#!/usr/bin/env python3
"""
SpreadsheetBench autonomous runner — the skill's reproducible full-auto loop for SpreadsheetBench.

It does what the founder would do by hand, under the autonomy policy:
  clone the benchmark (from the policy download-allowlist) -> seal a held-out slice ->
  attempt each held-out task with the model IN the loop -> grade with the benchmark's OWN grader
  (evaluation.compare_workbooks, OJ-style: all test cases must pass) -> write an honest result.

Honesty (derive-don't-accept): the harness contains NO per-task answers. A row counts toward the
headline only as a held-out clean probe with the model genuinely in the loop. The grader is the
benchmark's own; we never reimplement or soften it.

Modes:
  --mode api      : call an OpenAI-compatible model (env OPENAI_API_KEY, OPENAI_BASE_URL) — full auto.
  --mode agent    : the coding agent IS the model — read attempts from <attempts-dir>/<id>.json.
  --mode code-exec: ask the model to write a self-contained openpyxl python script per task;
                    execute it once per test case in an isolated tempdir under --code-timeout.
                    Required for sheet-level tasks (new sheets, large spans, formula resolution).
  --mode tool-loop: code-exec PLUS a critique-and-retry inner loop. After the v1 script runs,
                    diff its output.xlsx against the input.xlsx, build a critique citing the
                    observed deltas + the original instruction + violated rules, and ask the
                    model for v2 (up to --max-loop-iters, default 3). The grader scores the
                    FINAL attempt only — no best-of-N cherry-pick. Targets sheet-level tasks
                    (e.g. CF_6540) where single-shot code-exec stalls at 0 hard / 0.33 soft.
  --dump          : print each held-out task (instruction + answer_position + per-test-case input
                    preview) so an agent-in-the-loop can produce attempts. No grading.

Usage:
  python spreadsheetbench.py --repo <clone> --dataset sample_data_200 --slice 3 --salt <s> --dump
  python spreadsheetbench.py --repo <clone> --dataset sample_data_200 --slice 3 --salt <s> \
      --mode agent --attempts-dir ./attempts --out results.json
"""
import os, sys, json, argparse, hashlib, hmac, subprocess, tarfile

REPO_URL = "https://github.com/RUCKBReasoning/SpreadsheetBench.git"  # scope via your autonomy allowlist


def ensure_dataset(repo, dataset, allowlist):
    if not os.path.isdir(repo):
        if allowlist and not any(h in REPO_URL for h in allowlist):
            raise SystemExit(f"hard-stop: {REPO_URL} not in download allowlist {allowlist}")
        subprocess.run(["git", "clone", "--depth", "1", REPO_URL, repo], check=True)
    dpath = os.path.join(repo, "data", dataset)
    if not os.path.isdir(dpath):
        tar = os.path.join(repo, "data", dataset + ".tar.gz")
        if not os.path.isfile(tar):
            raise SystemExit(f"dataset tar not found: {tar}")
        with tarfile.open(tar) as t:
            t.extractall(os.path.join(repo, "data"))
    return dpath


def load_tasks(dpath):
    with open(os.path.join(dpath, "dataset.json"), encoding="utf-8") as f:
        return json.load(f)


def seal_heldout(ids, salt):
    return hmac.new(salt.encode(), ",".join(sorted(ids)).encode(), hashlib.sha256).hexdigest()


def import_official_grader(repo):
    # Use the benchmark's OWN grader — do not reimplement.
    sys.path.insert(0, os.path.join(repo, "evaluation"))
    import evaluation
    return evaluation


def tc_path(dpath, tid, i, kind):
    return os.path.join(dpath, "spreadsheet", str(tid), f"{i}_{tid}_{kind}.xlsx")


def num_test_cases(dpath, tid):
    n = 0
    for i in range(1, 6):
        if os.path.isfile(tc_path(dpath, tid, i, "input")) and os.path.isfile(tc_path(dpath, tid, i, "answer")):
            n += 1
    return n


def preview_input(grader, path, answer_position, max_rows=20):
    import openpyxl
    wb = openpyxl.load_workbook(path, data_only=True)
    out = {}
    for scr in answer_position.split(","):
        sheet = wb.sheetnames[0]
        rng = scr
        if "!" in scr:
            sheet, rng = scr.split("!")
            sheet = sheet.strip("'")
        ws = wb[sheet] if sheet in wb.sheetnames else wb[wb.sheetnames[0]]
        rows = []
        for r in ws.iter_rows(min_row=1, max_row=min(max_rows, ws.max_row), values_only=True):
            rows.append([c for c in r])
        out[scr] = {"sheet": sheet, "answer_cells": grader.generate_cell_names(rng), "rows": rows}
    return out


def apply_attempt(input_path, out_path, attempt_cells):
    # attempt_cells: { "Sheet!Cell" or "Cell": value }. Fill them into a copy of the input.
    # MergedCell fix: openpyxl makes non-anchor cells of a merged range read-only
    # (AttributeError on assignment). Before writing, detect+unmerge the containing range.
    # This only affects the model's output copy; the grader compares VALUES inside answer_position
    # (cell_level_compare ignores fill/font), so cosmetic merge loss is benign.
    import openpyxl
    from openpyxl.utils.cell import coordinate_from_string, column_index_from_string
    wb = openpyxl.load_workbook(input_path)
    for ref, val in attempt_cells.items():
        sheet = wb.sheetnames[0]
        cell = ref
        if "!" in ref:
            sheet, cell = ref.split("!")
            sheet = sheet.strip("'")
        ws = wb[sheet] if sheet in wb.sheetnames else wb[wb.sheetnames[0]]
        # Unmerge any merged range that contains this target so the write doesn't hit a read-only MergedCell.
        try:
            col_letters, row = coordinate_from_string(cell)
            ci = column_index_from_string(col_letters)
            for mr in list(ws.merged_cells.ranges):
                if mr.min_col <= ci <= mr.max_col and mr.min_row <= row <= mr.max_row:
                    ws.unmerge_cells(str(mr))
                    break
        except Exception as e:
            print(f"   ! unmerge probe failed for {ref}: {e}")
        try:
            ws[cell] = val
        except AttributeError as e:
            # Last-resort: skip with warning rather than crash the whole task.
            print(f"   ! skip merged-readonly cell {ref}: {e}")
            continue
    wb.save(out_path)


def grade_task(grader, dpath, task, out_dir):
    tid = task["id"]
    n = num_test_cases(dpath, tid)
    results = []
    for i in range(1, n + 1):
        ans = tc_path(dpath, tid, i, "answer")
        out = os.path.join(out_dir, f"{i}_{tid}_output.xlsx")
        try:
            ok, _ = grader.compare_workbooks(ans, out, task["instruction_type"], task["answer_position"])
        except Exception:
            ok = False
        results.append(int(bool(ok)))
    soft = sum(results) / len(results) if results else 0.0
    hard = 1 if results and 0 not in results else 0
    return {"test_case_results": results, "soft": soft, "hard": hard}


def _force_utf8_stdout():
    """Reconfigure stdout/stderr to UTF-8 so em-dash/ellipsis/box-drawing render under
    Windows PowerShell (default cp1252 console emits '?' for these). Cosmetic-only, but
    the R36 rollup flagged em-dash mojibake in stdout across all three runners."""
    for stream_name in ("stdout", "stderr"):
        s = getattr(sys, stream_name, None)
        if s is None:
            continue
        try:
            s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


def main():
    _force_utf8_stdout()
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", default=os.path.join(os.getcwd(), "SpreadsheetBench"))
    ap.add_argument("--dataset", default="sample_data_200")
    ap.add_argument("--slice", type=int, default=3)
    ap.add_argument("--salt", default=os.environ.get("SOLO_LEDGER_SALT", "dev-salt-change-me"))
    ap.add_argument("--mode", choices=["api", "agent", "code-exec", "tool-loop"], default="agent")
    ap.add_argument("--attempts-dir", default="./attempts")
    ap.add_argument("--allowlist", default="github.com")
    ap.add_argument("--out", default="results.json")
    ap.add_argument("--dump", action="store_true")
    ap.add_argument("--code-timeout", type=int, default=60,
                    help="seconds per test case in --mode code-exec / --mode tool-loop (default 60)")
    ap.add_argument("--max-loop-iters", type=int, default=3,
                    help="max critique-and-retry iterations in --mode tool-loop (default 3, hard cap)")
    a = ap.parse_args()

    dpath = ensure_dataset(a.repo, a.dataset, a.allowlist.split(","))
    grader = import_official_grader(a.repo)
    tasks = load_tasks(dpath)
    # held-out slice = first N tasks that have full test cases; seal it.
    sliced = [t for t in tasks if num_test_cases(dpath, t["id"]) >= 1][: a.slice]
    manifest = seal_heldout([str(t["id"]) for t in sliced], a.salt)
    print(f"sealed held-out slice: {len(sliced)} tasks · manifest {manifest[:16]}…")

    if a.dump:
        for t in sliced:
            print("\n" + "=" * 70)
            print(f"id={t['id']}  type={t['instruction_type']}  answer_position={t['answer_position']}")
            print("instruction:", t["instruction"][:600])
            n = num_test_cases(dpath, t["id"])
            for i in range(1, n + 1):
                pv = preview_input(grader, tc_path(dpath, t["id"], i, "input"), t["answer_position"])
                print(f"-- test case {i}: answer cells {[v['answer_cells'] for v in pv.values()]}")
                for scr, info in pv.items():
                    print(f"   [{scr}] first rows:")
                    for row in info["rows"][:12]:
                        print("    ", row)
        return

    os.makedirs("_sb_out", exist_ok=True)
    rows = []
    counted_hard = []
    for t in sliced:
        tid = t["id"]
        n = num_test_cases(dpath, tid)
        out_dir = os.path.join("_sb_out", str(tid)); os.makedirs(out_dir, exist_ok=True)
        # ---- code-exec: one model-authored python script per task; run it per test case ----
        if a.mode == "code-exec":
            script = code_exec_script(t, dpath, grader)
            # Anti-cheat: the model must produce an actual openpyxl script that reads argv,
            # not a hardcoded-values dump. If either signal is missing, we still execute
            # (failure -> no output -> grader scores 0) but mark cleanGeneralProbe=False.
            has_openpyxl = "openpyxl" in script
            has_argv = "argv" in script
            scripted = bool(script) and has_openpyxl and has_argv
            any_timeout = False
            tc_ran_clean = []
            tc_output_written = []
            for i in range(1, n + 1):
                in_path = tc_path(dpath, tid, i, "input")
                out_path = os.path.join(out_dir, f"{i}_{tid}_output.xlsx")
                st = run_code_exec(script, in_path, out_path, timeout=a.code_timeout)
                if st["timeout"]:
                    any_timeout = True
                tc_ran_clean.append(bool(st["ranWithoutException"]))
                tc_output_written.append(bool(st["output_written"]))
            g = grade_task(grader, dpath, t, out_dir)
            # P1-1: flag any tc that scored 1 while the script crashed (returncode!=0 AND
            # no output file). That is a 'lucky degenerate match' on the untouched input,
            # not a real solve. Reported in results.json, NOT subtracted from g["hard"]/g["soft"]
            # (those remain the official grader's verdict, untouched).
            degenerate_passes = []
            for idx, (tc_score, ran_clean, out_ok) in enumerate(
                zip(g.get("test_case_results", []) or [], tc_ran_clean, tc_output_written), start=1
            ):
                if tc_score == 1 and not ran_clean and not out_ok:
                    degenerate_passes.append(idx)
            # P0-2: semantic gate -- cleanGeneralProbe stays True only if the script also
            # actually ran without exception on at least one test case. Without this, a
            # SyntaxError run reads as a 'clean failure' which misleads the operator.
            ran_clean_any = any(tc_ran_clean)
            clean_structural = scripted and not any_timeout
            clean = clean_structural and ran_clean_any
            rows.append({"id": tid, "type": t["instruction_type"], **g, "mode": a.mode,
                         "cleanGeneralProbe": clean,
                         "cleanStructuralProbe": clean_structural,
                         "cleanSemanticProbe": ran_clean_any,
                         "degeneratePasses": degenerate_passes,
                         "modelInLoop": True,
                         "codeExec": {"scripted": scripted, "timeout": any_timeout,
                                      "hasOpenpyxl": has_openpyxl, "hasArgv": has_argv,
                                      "perTcRanClean": tc_ran_clean,
                                      "perTcOutputWritten": tc_output_written}})
            if clean:
                counted_hard.append(g["hard"])
            dp_note = (f" degenerate_pass={degenerate_passes}" if degenerate_passes else "")
            print(f"  {tid}: hard={g['hard']} soft={g['soft']:.2f} ({g['test_case_results']}) "
                  f"[code-exec scripted={scripted} timeout={any_timeout} "
                  f"ranClean={ran_clean_any}]{dp_note}")
            continue
        # ---- tool-loop: code-exec + critique-and-retry up to --max-loop-iters ----
        if a.mode == "tool-loop":
            max_iters = max(1, min(int(a.max_loop_iters), 3))  # hard cap at 3 for honesty
            # One script applies to all test cases; we iterate the script (not per-tc) using
            # test case 1 as the critique probe. The final script is then executed against
            # every test case and graded — no per-tc best-of-N.
            v1 = code_exec_script(t, dpath, grader)
            scripts = [v1]
            iter_records = []
            any_iter_timeout = False
            for it in range(max_iters):
                cur_script = scripts[-1]
                has_openpyxl = "openpyxl" in cur_script
                has_argv = "argv" in cur_script
                if not (cur_script and has_openpyxl and has_argv):
                    iter_records.append({"iter": it + 1, "scripted": False,
                                          "timeout": False, "duplicate": False,
                                          "diff_summary": "no-script"})
                    break
                # Probe on test case 1.
                probe_in = tc_path(dpath, tid, 1, "input")
                probe_out = os.path.join(out_dir, f"_probe_{it+1}_{tid}_output.xlsx")
                # Clean stale probe.
                try:
                    if os.path.isfile(probe_out):
                        os.remove(probe_out)
                except Exception:
                    pass
                st = run_code_exec(cur_script, probe_in, probe_out, timeout=a.code_timeout)
                timed_out = st["timeout"]
                ran_clean = bool(st["ranWithoutException"])
                if timed_out:
                    any_iter_timeout = True
                diff = diff_workbook_against_input(probe_in, probe_out, t["answer_position"]) \
                    if os.path.isfile(probe_out) else {"no_output": True, "in_answer": [],
                                                       "out_of_answer": [], "answer_covered": False}
                iter_records.append({
                    "iter": it + 1,
                    "scripted": True,
                    "timeout": timed_out,
                    "ranWithoutException": ran_clean,
                    "returncode": st.get("returncode"),
                    "stderr_tail": st.get("stderr_tail", ""),
                    "duplicate": False,
                    "diff_summary": _short_diff_summary(diff),
                })
                # Stop early on timeout -- no point retrying, we already failed the timeout honesty gate.
                if timed_out:
                    break
                # If this is the last allowed iter, do not request another script.
                if it + 1 >= max_iters:
                    break
                # Ask for v(it+2) using the diff as critique.
                try:
                    next_script = critique_and_retry(t, dpath, grader, cur_script, diff)
                except Exception as e:
                    iter_records[-1]["critique_error"] = str(e)[:200]
                    break
                # Honesty: the new script must actually differ from the previous one.
                if not next_script or next_script.strip() == cur_script.strip():
                    iter_records.append({"iter": it + 2, "scripted": bool(next_script),
                                          "timeout": False, "duplicate": True,
                                          "diff_summary": "model-did-not-change-script"})
                    break
                scripts.append(next_script)
            # Execute the FINAL script against every test case — this is what gets graded.
            final_script = scripts[-1]
            has_openpyxl = "openpyxl" in final_script
            has_argv = "argv" in final_script
            scripted = bool(final_script) and has_openpyxl and has_argv
            final_tc_ran_clean = []
            final_tc_output_written = []
            for i in range(1, n + 1):
                in_path = tc_path(dpath, tid, i, "input")
                out_path = os.path.join(out_dir, f"{i}_{tid}_output.xlsx")
                st = run_code_exec(final_script, in_path, out_path, timeout=a.code_timeout)
                if st["timeout"]:
                    any_iter_timeout = True
                final_tc_ran_clean.append(bool(st["ranWithoutException"]))
                final_tc_output_written.append(bool(st["output_written"]))
            g = grade_task(grader, dpath, t, out_dir)
            # P1-1: same degenerate-pass detection as code-exec lane.
            degenerate_passes = []
            for idx, (tc_score, ran_clean, out_ok) in enumerate(
                zip(g.get("test_case_results", []) or [], final_tc_ran_clean, final_tc_output_written),
                start=1
            ):
                if tc_score == 1 and not ran_clean and not out_ok:
                    degenerate_passes.append(idx)
            # Honest gate (tool-loop): every iter produced a real script, no timeouts,
            # no two consecutive scripts identical, maxIters <= 3.
            had_duplicate = any(r.get("duplicate") for r in iter_records)
            all_scripted = all(r.get("scripted") for r in iter_records) and scripted
            # P0-2: semantic axis -- at least one probe iter ran without exception, OR
            # the final script ran clean on at least one test case. Without this, a run
            # where v1 was 'wrong place but valid' and v2/v3 are SyntaxError still gets
            # cleanGeneralProbe=True, hiding that critique-and-retry made things strictly worse.
            ran_clean_any_iter = any(r.get("ranWithoutException") for r in iter_records)
            ran_clean_final = any(final_tc_ran_clean)
            clean_structural = (all_scripted and not any_iter_timeout and not had_duplicate
                                and max_iters <= 3)
            clean_semantic = ran_clean_any_iter or ran_clean_final
            clean = clean_structural and clean_semantic
            loop_iters_used = len(scripts)
            rows.append({"id": tid, "type": t["instruction_type"], **g, "mode": a.mode,
                         "cleanGeneralProbe": clean,
                         "cleanStructuralProbe": clean_structural,
                         "cleanSemanticProbe": clean_semantic,
                         "degeneratePasses": degenerate_passes,
                         "modelInLoop": True,
                         "toolLoop": {"loopIters": loop_iters_used,
                                       "maxIters": max_iters,
                                       "scripted": scripted,
                                       "anyTimeout": any_iter_timeout,
                                       "hadDuplicateScript": had_duplicate,
                                       "ranCleanAnyIter": ran_clean_any_iter,
                                       "ranCleanFinal": ran_clean_final,
                                       "finalPerTcRanClean": final_tc_ran_clean,
                                       "finalPerTcOutputWritten": final_tc_output_written,
                                       "iters": iter_records}})
            if clean:
                counted_hard.append(g["hard"])
            dp_note = (f" degenerate_pass={degenerate_passes}" if degenerate_passes else "")
            print(f"  {tid}: hard={g['hard']} soft={g['soft']:.2f} ({g['test_case_results']}) "
                  f"[tool-loop iters={loop_iters_used}/{max_iters} "
                  f"scripted={scripted} timeout={any_iter_timeout} dup={had_duplicate} "
                  f"ranCleanFinal={ran_clean_final}]{dp_note}")
            continue
        # ---- attempt (model in the loop) ----
        if a.mode == "agent":
            ap_file = os.path.join(a.attempts_dir, f"{tid}.json")
            if not os.path.isfile(ap_file):
                print(f"  ! no attempt for {tid} (expected {ap_file}); skipping"); continue
            attempt = json.load(open(ap_file, encoding="utf-8"))  # { "1": {ref:val}, "2": {...}, "3": {...} }
        else:
            attempt = api_attempt(t, dpath, grader)  # full-auto
        for i in range(1, n + 1):
            cells = attempt.get(str(i)) or attempt.get(i) or {}
            apply_attempt(tc_path(dpath, tid, i, "input"), os.path.join(out_dir, f"{i}_{tid}_output.xlsx"), cells)
        g = grade_task(grader, dpath, t, out_dir)
        # honest gate: held-out (sealed) + model-in-loop (agent or api) + no per-task answer in the harness.
        clean = True
        rows.append({"id": tid, "type": t["instruction_type"], **g, "mode": a.mode,
                     "cleanGeneralProbe": clean, "modelInLoop": True})
        if clean:
            counted_hard.append(g["hard"])
        print(f"  {tid}: hard={g['hard']} soft={g['soft']:.2f} ({g['test_case_results']})")

    headline_hard = sum(counted_hard) / len(counted_hard) if counted_hard else None
    summary = {"benchmark": "spreadsheetbench", "dataset": a.dataset, "manifest": manifest,
               "n": len(counted_hard), "headline_hard_mean": headline_hard,
               "rows": rows}
    json.dump(summary, open(a.out, "w"), indent=2)
    print(f"\nHEADLINE (held-out, model-in-loop, official grader): hard@all = {headline_hard} over n={len(counted_hard)}")
    print(f"results -> {a.out}")


def _extract_completion_content(r, model, fn_name):
    """Pull the assistant text out of an OpenAI ChatCompletion, with a hard error on the
    reasoning-model gotcha that silently breaks the harness.

    Background (R36 P0-1): reasoning-tuned slugs on OpenRouter (e.g. z-ai/glm-5.2 and most
    deepseek/qwen3 thinker variants) frequently return `choices[0].message.content == None`
    while consuming all tokens in `.reasoning` / `.reasoning_content`. The old code did
    `r.choices[0].message.content.strip()` which silently raises AttributeError or produces
    an empty script — the honest-lane gate then reads it as "model failed" when it's
    actually "runner failed to read the model output". This helper:

      1) Surfaces a HARD RuntimeError naming the model + token usage so the operator can
         switch model or raise max_tokens.
      2) As a best-effort recovery, extracts a fenced ```python block from the reasoning
         trace before failing — many reasoning models emit the final code there.

    Args:
      r          : the ChatCompletion response object.
      model      : the model slug (for error messaging).
      fn_name    : the calling function ("code_exec_script" / "critique_and_retry" / "api_attempt").
    Returns: the assistant text (non-empty), stripped.
    Raises : RuntimeError if neither .content nor an extractable fenced block in .reasoning is usable.
    """
    msg = r.choices[0].message
    content = getattr(msg, "content", None)
    if content and content.strip():
        return content.strip()
    # Fallback: many reasoning models put the final code inside the reasoning trace.
    reasoning = getattr(msg, "reasoning", None) or getattr(msg, "reasoning_content", None)
    if reasoning:
        import re
        m = re.search(r"```(?:python)?\s*\n(.*?)```", reasoning, re.DOTALL)
        if m and m.group(1).strip():
            print(f"   [{fn_name}] WARN: model={model} returned content=None; "
                  f"recovered ```python block from .reasoning ({len(m.group(1))} chars).")
            return m.group(1).strip()
    # Hard error — better to fail loudly than to write an empty script and call it 'model failed'.
    usage = getattr(r, "usage", None)
    usage_repr = ""
    if usage is not None:
        try:
            usage_repr = f" usage={usage.model_dump() if hasattr(usage, 'model_dump') else dict(usage)}"
        except Exception:
            usage_repr = f" usage={usage}"
        reasoning_len = len(reasoning or "")
    raise RuntimeError(
        f"[{fn_name}] model={model} returned empty .content "
        f"(reasoning_len={len(reasoning or '')}{usage_repr}). "
        "This is the R36 reasoning-model gotcha — the model consumed all tokens in the "
        "reasoning trace. Either switch SOLO_MODEL to a non-thinker slug "
        "(e.g. openai/gpt-4.1-mini, anthropic/claude-haiku-4.5) or raise the provider's "
        "max_tokens. See templates/run/README.md '#reasoning-model gotcha'."
    )


def code_exec_script(task, dpath, grader):
    """Ask the model for ONE openpyxl python script. argv[1]=input, argv[2]=output. Returns the script text.

    Honesty: prompt carries the instruction + answer_position + a 30-row input preview -- same
    information api_attempt already gets. We do NOT show the answer workbook.
    """
    from openai import OpenAI
    client = OpenAI(base_url=os.environ.get("OPENAI_BASE_URL"), api_key=os.environ["OPENAI_API_KEY"])
    model = os.environ.get("SOLO_MODEL", "openai/gpt-4.1-mini")
    # One representative preview grounds column meanings; do NOT leak answers.
    pv = preview_input(grader, tc_path(dpath, task["id"], 1, "input"), task["answer_position"], max_rows=30)
    prompt = (
        "Write ONE Python 3 script that solves a SpreadsheetBench task using openpyxl.\n"
        "Contract:\n"
        "  - argv[1] = absolute path to input .xlsx; argv[2] = absolute path where you MUST save the result.\n"
        "  - Use openpyxl only (already installed). Do not read network or other files.\n"
        "  - Read input, mutate as the instruction requires, write to argv[2].\n"
        f"  - The grader compares VALUES (not formulas) inside answer_position={task['answer_position']!r}.\n"
        "    Resolve formulas to literal values before saving (e.g. compute in Python, write the result).\n"
        "  - If the task creates/filters NEW sheets (e.g. 'Paid', 'NotPaid'), create them with the EXACT names.\n"
        "  - Preserve other sheets/cells untouched.\n"
        "  - If a target sheet ALREADY EXISTS in the input workbook with rows in it, treat those rows\n"
        "    as a CORRECT partial starter. Do NOT clear, overwrite, or rewrite them. Preserve them at\n"
        "    their original row indices and APPEND the rows that satisfy the instruction's filter\n"
        "    starting at the first empty row below the starter. Detect the starter by scanning the\n"
        "    target sheet's existing non-empty rows BEFORE writing anything.\n"
        "  - If the instruction says 'There's an example', 'I have an example in this file', or\n"
        "    similar, the example IS the pre-filled rows in the target sheet — replicate the same\n"
        "    filter for the remaining source rows; do NOT regenerate the entire sheet from scratch.\n"
        "  - The grader compares the FULL answer_position range; pre-existing rows in target sheets\n"
        "    must keep their key columns (IDs, dates, names) intact at their original row indices.\n"
        "  - answer_position uses Excel A1 notation with optional sheet prefix and may be comma-\n"
        "    separated, e.g. \"'Paid'!A1:E58,'NotPaid'!A1:E12\" — each segment is one (sheet, range)\n"
        "    pair the grader will check. Cover every segment.\n"
        "  - For numeric outputs that may sit on a 2-decimal rounding boundary (values ending\n"
        "    in .xx5), prefer decimal.Decimal with ROUND_HALF_UP, or write the value Excel would\n"
        "    store (Excel rounds 22.425 -> 22.43, not 22.42). Avoid raw Python round() for money.\n"
        "  - NO STYLING. Do NOT use PatternFill, Color, Fill, Font, Alignment, Border, Side,\n"
        "    NamedStyle, GradientFill, or anything from openpyxl.styles. The grader compares\n"
        "    cell VALUES inside answer_position, not formatting. Styling code that constructs\n"
        "    Color/Fill objects raises TypeError on many openpyxl versions\n"
        "    (e.g. 'PatternFill.fgColor should be Color but value is RGB'); the script then\n"
        "    aborts and the test case scores 0.\n"
        "  - Use the openpyxl basic API ONLY: load_workbook(input).active or wb[sheet_name],\n"
        "    ws['A1'].value = ..., ws.cell(row, column, value=...), wb.create_sheet(name),\n"
        "    wb.save(output). No styles imports.\n"
        "  - Wrap in if __name__ == '__main__'. Print nothing on success.\n\n"
        f"Instruction:\n{task['instruction']}\n\n"
        f"instruction_type: {task['instruction_type']}\n"
        f"answer_position : {task['answer_position']}\n\n"
        f"Representative input preview (test case 1, first rows):\n{json.dumps(pv, default=str)[:6000]}\n\n"
        "Return ONLY the python code, no fences, no prose."
    )
    r = client.chat.completions.create(model=model, messages=[{"role": "user", "content": prompt}],
                                       temperature=0)
    code = _extract_completion_content(r, model, "code_exec_script")
    # Defensive strip of accidental ``` fences
    if code.startswith("```"):
        code = code.strip("`")
        if code.startswith("python"):
            code = code[len("python"):]
        code = code.strip()
    # Belt-and-suspenders: scrub openpyxl.styles usage that some models emit despite the
    # prompt warning. Observed failure on glm-5.2 R3 for task 99-24 (sheet-level):
    #   TypeError: <class 'openpyxl.styles.fills.PatternFill'>.fgColor should be
    #   <class 'openpyxl.styles.colors.Color'> but value is <class 'openpyxl.styles.colors.RGB'>
    # The grader only checks VALUES inside answer_position (cell_level_compare ignores fills),
    # so stripping styling is non-destructive and prevents a hard abort on the whole test case.
    code = _strip_styling(code)
    return code


_STYLE_CLASSES = (
    "PatternFill", "GradientFill", "Fill", "Color", "Font", "Alignment",
    "Border", "Side", "NamedStyle", "Protection",
)


def _strip_styling(code: str):
    """Remove openpyxl.styles imports and any line that constructs/assigns a style object.

    Conservative: we drop whole physical lines (and their continuation lines) that reference
    a style class or assign to a styling property (.fill / .font / .alignment / .border /
    .number_format on a cell). Keep .value assignments. If a `for`/`if` body becomes empty
    we leave a `pass` stub so indentation stays valid.
    """
    import re
    style_class_re = re.compile(r"\b(" + "|".join(_STYLE_CLASSES) + r")\b")
    style_attr_re = re.compile(r"\.(fill|font|alignment|border|number_format|protection|style)\s*=")
    style_import_re = re.compile(r"^\s*(from\s+openpyxl\.styles[\w\.]*\s+import\s+|import\s+openpyxl\.styles)")
    out, i = [], 0
    lines = code.splitlines()
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()
        is_style = (
            style_import_re.match(line) is not None
            or (style_class_re.search(line) is not None and not stripped.startswith("#"))
            or (style_attr_re.search(line) is not None and ".value" not in line)
        )
        if is_style:
            # Consume continuation lines (open paren or trailing backslash).
            open_parens = line.count("(") - line.count(")")
            trailing_bs = line.rstrip().endswith("\\")
            while (open_parens > 0 or trailing_bs) and i + 1 < len(lines):
                i += 1
                nxt = lines[i]
                open_parens += nxt.count("(") - nxt.count(")")
                trailing_bs = nxt.rstrip().endswith("\\")
            # Replace with a comment placeholder preserving indentation so block bodies stay valid.
            indent = line[: len(line) - len(line.lstrip())]
            out.append(f"{indent}pass  # [stripped styling]")
        else:
            out.append(line)
        i += 1
    return "\n".join(out)


def run_code_exec(script, in_path, out_path, timeout=60):
    """Execute the model-authored script in a tempdir against a copy of the input.

    Returns a status dict: {timeout: bool, ranWithoutException: bool, returncode: int,
    stderr_tail: str, output_written: bool}. Failure (nonzero, timeout, missing output)
    leaves out_path absent so the grader scores 0 via 'File not exist' -- no soft pass-through.

    Honest-lane note (R36 P0-2): `timeout` alone is NOT a sufficient gate. A SyntaxError
    from critique-and-retry's v2/v3 returns rc!=0 (ranWithoutException=False) and silently
    looks identical to "model ran, output happened to be wrong" if you only check timeout.
    Callers MUST inspect `ranWithoutException` so cleanGeneralProbe is semantic, not just
    structural.

    Back-compat: this function used to return a bare bool (timed_out). Some callers may
    still treat the return as truthy/falsy -- the dict's truthiness is fine for new code,
    but legacy `if run_code_exec(...):` checks will now evaluate True for ANY non-empty
    dict. All in-repo callers have been updated to read the keys explicitly.
    """
    import tempfile, shutil
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="sb_exec_") as td:
        sp = os.path.join(td, "solve.py")
        ip = os.path.join(td, "input.xlsx")
        op = os.path.join(td, "output.xlsx")
        with open(sp, "w", encoding="utf-8") as f:
            f.write(script)
        shutil.copyfile(in_path, ip)
        try:
            proc = subprocess.run([sys.executable, sp, ip, op],
                                  cwd=td, timeout=timeout,
                                  capture_output=True, text=True)
        except subprocess.TimeoutExpired:
            print(f"   code-exec TIMEOUT after {timeout}s for {os.path.basename(in_path)}")
            return {"timeout": True, "ranWithoutException": False, "returncode": None,
                    "stderr_tail": f"TIMEOUT after {timeout}s", "output_written": False}
        ran_clean = (proc.returncode == 0)
        if not ran_clean:
            tail = (proc.stderr or "")[-400:]
            print(f"   code-exec NONZERO rc={proc.returncode} stderr={tail}")
        else:
            tail = ""
        output_written = False
        if os.path.isfile(op):
            shutil.copyfile(op, out_path)  # grader will find it
            output_written = True
        # else: grader's compare_workbooks returns ('File not exist') -> scored 0.
        return {"timeout": False, "ranWithoutException": ran_clean,
                "returncode": proc.returncode, "stderr_tail": tail,
                "output_written": output_written}


def _parse_answer_segments(answer_position):
    """Parse SpreadsheetBench answer_position into list of (sheet_or_None, a1_range) pairs.

    Example: "'Paid'!A1:E58,'NotPaid'!A1:E12" -> [("Paid","A1:E58"), ("NotPaid","A1:E12")].
    A bare "B2:B10" returns [(None, "B2:B10")] -> default to first sheet.
    """
    out = []
    for seg in (answer_position or "").split(","):
        seg = seg.strip()
        if not seg:
            continue
        if "!" in seg:
            sheet, rng = seg.split("!", 1)
            out.append((sheet.strip("'\""), rng.strip()))
        else:
            out.append((None, seg))
    return out


def diff_workbook_against_input(in_path, out_path, answer_position, max_deltas=80):
    """Return a structured diff between the input and the model's output workbook.

    Shape:
      {
        "in_answer":    [{sheet,cell,before,after}, ...]   # deltas inside answer_position
        "out_of_answer":[{sheet,cell,before,after}, ...]   # deltas outside (truncated)
        "answer_covered": bool   # did any answer-position cell change?
        "sheets_added":   [str]  # sheets present in output but not in input
        "sheets_removed": [str]
        "no_output":      bool   # set True only if out_path is missing
      }

    Cosmetic differences (font/fill) are ignored — we compare cell.value only, matching the
    grader's cell_level_compare.
    """
    if not os.path.isfile(out_path):
        return {"no_output": True, "in_answer": [], "out_of_answer": [],
                "answer_covered": False, "sheets_added": [], "sheets_removed": []}
    import openpyxl
    from openpyxl.utils.cell import coordinate_from_string, column_index_from_string, get_column_letter

    wb_in = openpyxl.load_workbook(in_path, data_only=True)
    wb_out = openpyxl.load_workbook(out_path, data_only=True)

    segs = _parse_answer_segments(answer_position)
    # Build set of (sheet, cellref) inside the answer span for fast membership check.
    answer_set = set()
    for sheet, rng in segs:
        target_sheet = sheet or (wb_in.sheetnames[0] if wb_in.sheetnames else None)
        try:
            for cn in _expand_range(rng):
                answer_set.add((target_sheet, cn))
        except Exception:
            pass

    in_answer, out_of_answer = [], []
    answer_covered = False
    sheets_in = set(wb_in.sheetnames)
    sheets_out = set(wb_out.sheetnames)
    sheets_added = sorted(sheets_out - sheets_in)
    sheets_removed = sorted(sheets_in - sheets_out)

    # Walk every sheet that appears in EITHER workbook.
    for sn in sorted(sheets_in | sheets_out):
        ws_in = wb_in[sn] if sn in wb_in.sheetnames else None
        ws_out = wb_out[sn] if sn in wb_out.sheetnames else None
        if ws_out is None:
            continue  # sheet was removed; report via sheets_removed only
        max_row = ws_out.max_row or 0
        max_col = ws_out.max_column or 0
        if ws_in is not None:
            max_row = max(max_row, ws_in.max_row or 0)
            max_col = max(max_col, ws_in.max_column or 0)
        # Cap to avoid pathologically large sweeps; answer_position is typically small.
        max_row = min(max_row, 200)
        max_col = min(max_col, 40)
        for r in range(1, max_row + 1):
            for c in range(1, max_col + 1):
                cn = f"{get_column_letter(c)}{r}"
                bv = ws_in.cell(row=r, column=c).value if ws_in is not None else None
                av = ws_out.cell(row=r, column=c).value
                if bv == av:
                    continue
                rec = {"sheet": sn, "cell": cn,
                       "before": _coerce(bv), "after": _coerce(av)}
                in_a = (sn, cn) in answer_set or (None, cn) in answer_set
                if in_a:
                    answer_covered = True
                    if len(in_answer) < max_deltas:
                        in_answer.append(rec)
                else:
                    if len(out_of_answer) < max_deltas:
                        out_of_answer.append(rec)
    return {"in_answer": in_answer, "out_of_answer": out_of_answer,
            "answer_covered": answer_covered, "sheets_added": sheets_added,
            "sheets_removed": sheets_removed, "no_output": False}


def _expand_range(a1_range):
    """Expand 'A1:C3' or 'A1' into a list of cell references."""
    from openpyxl.utils.cell import (coordinate_from_string, column_index_from_string,
                                      get_column_letter)
    rng = a1_range.strip()
    if ":" not in rng:
        return [rng]
    start, end = rng.split(":", 1)
    sc, sr = coordinate_from_string(start)
    ec, er = coordinate_from_string(end)
    sci = column_index_from_string(sc); eci = column_index_from_string(ec)
    if sci > eci: sci, eci = eci, sci
    if sr > er: sr, er = er, sr
    out = []
    for r in range(sr, er + 1):
        for c in range(sci, eci + 1):
            out.append(f"{get_column_letter(c)}{r}")
    return out


def _coerce(v):
    """JSON-safe coercion of openpyxl cell values."""
    import datetime
    if v is None or isinstance(v, (str, int, float, bool)):
        return v
    if isinstance(v, (datetime.date, datetime.datetime, datetime.time)):
        return v.isoformat()
    try:
        return str(v)
    except Exception:
        return repr(v)


def _short_diff_summary(diff):
    """Human-readable one-line summary of a diff dict, for the iter records."""
    if diff.get("no_output"):
        return "no-output"
    return (f"in_answer={len(diff.get('in_answer', []))} "
            f"out_of_answer={len(diff.get('out_of_answer', []))} "
            f"answer_covered={diff.get('answer_covered')} "
            f"sheets_added={diff.get('sheets_added')} "
            f"sheets_removed={diff.get('sheets_removed')}")


def critique_and_retry(task, dpath, grader, prev_script, diff):
    """Ask the model for a v(N+1) script given the previous script + observed diff.

    Returns the new script text (with the same _strip_styling defense as code_exec_script).
    """
    from openai import OpenAI
    client = OpenAI(base_url=os.environ.get("OPENAI_BASE_URL"), api_key=os.environ["OPENAI_API_KEY"])
    model = os.environ.get("SOLO_MODEL", "openai/gpt-4.1-mini")
    pv = preview_input(grader, tc_path(dpath, task["id"], 1, "input"), task["answer_position"], max_rows=30)

    # Build a focused critique. Identify the rule the v1 script violated.
    rule_hits = []
    if diff.get("no_output"):
        rule_hits.append("Script produced NO output file (.xlsx missing). Likely raised an "
                          "exception or wrote to the wrong path. Confirm argv[2] is used and "
                          "wb.save(argv[2]) runs without exceptions.")
    elif not diff.get("answer_covered"):
        rule_hits.append("ZERO cells inside answer_position changed. The script ran but did "
                          "not touch the cells the grader checks. Re-read the instruction and "
                          "answer_position; ensure you write to the EXACT sheet(s) and range.")
    if diff.get("sheets_removed"):
        rule_hits.append(f"Sheets removed from the workbook: {diff['sheets_removed']}. "
                          "Preserve other sheets untouched.")
    # Detect 'only headers changed' heuristic — if every in-answer delta is row 1 but the
    # range covers multiple rows, the model likely wrote only the header.
    in_a = diff.get("in_answer", [])
    if in_a and all(d.get("cell", "")[-1] == "1" or d.get("cell", "").endswith("1") for d in in_a):
        rule_hits.append("All in-answer deltas appear to be on row 1 — only the header was "
                          "written. The data rows below must be populated too.")

    prompt = (
        "Your previous Python script for this SpreadsheetBench task did not produce the "
        "expected output. Read the observed diff and write a CORRECTED script.\n\n"
        f"Instruction:\n{task['instruction']}\n\n"
        f"instruction_type: {task['instruction_type']}\n"
        f"answer_position : {task['answer_position']}\n\n"
        f"Representative input preview (test case 1, first rows):\n"
        f"{json.dumps(pv, default=str)[:4000]}\n\n"
        "Observed diff of YOUR previous output vs the input:\n"
        f"{json.dumps(diff, default=str)[:3000]}\n\n"
        "Critique (rules your previous script violated):\n"
        + ("\n".join(f"  - {h}" for h in rule_hits) if rule_hits else
           "  - The output workbook differs from the answer in ways the grader still rejects.\n"
           "    Re-derive the answer carefully and ensure every answer_position cell is correct.")
        + "\n\nYour PREVIOUS script (for reference — DO NOT return it unchanged):\n"
        f"{prev_script[:6000]}\n\n"
        "Same contract as before:\n"
        "  - argv[1]=input path, argv[2]=output path.\n"
        "  - openpyxl only; resolve formulas to literal VALUES inside answer_position.\n"
        "  - Cover every comma-separated answer_position segment.\n"
        "  - NO openpyxl.styles imports or PatternFill/Color/Font/Alignment/Border/Side usage.\n"
        "  - Preserve sheets/cells outside answer_position. If a target sheet exists with rows,\n"
        "    treat them as starter rows and APPEND filtered rows below.\n"
        "  - Wrap in if __name__ == '__main__'; print nothing on success.\n\n"
        "Return ONLY the corrected python code, no fences, no prose. The script MUST be "
        "MEANINGFULLY DIFFERENT from the previous one — change the logic, not just whitespace."
    )
    r = client.chat.completions.create(model=model, messages=[{"role": "user", "content": prompt}],
                                       temperature=0)
    code = _extract_completion_content(r, model, "critique_and_retry")
    if code.startswith("```"):
        code = code.strip("`")
        if code.startswith("python"):
            code = code[len("python"):]
        code = code.strip()
    code = _strip_styling(code)
    return code


def api_attempt(task, dpath, grader):
    """Full-auto attempt via an OpenAI-compatible model. Returns { '1': {ref:val}, ... }."""
    from openai import OpenAI
    client = OpenAI(base_url=os.environ.get("OPENAI_BASE_URL"), api_key=os.environ["OPENAI_API_KEY"])
    model = os.environ.get("SOLO_MODEL", "gpt-4.1-mini")
    out = {}
    n = num_test_cases(dpath, task["id"])
    for i in range(1, n + 1):
        pv = preview_input(grader, tc_path(dpath, task["id"], i, "input"), task["answer_position"])
        prompt = (f"Spreadsheet task. Instruction:\n{task['instruction']}\n\n"
                  f"Fill these answer cells: {task['answer_position']}\n"
                  f"Input preview (first rows): {json.dumps(pv, default=str)[:4000]}\n\n"
                  "Return ONLY a JSON object mapping each answer cell ref to its value, e.g. "
                  '{"Sheet1!B2": 123.45}. No prose.')
        r = client.chat.completions.create(model=model, messages=[{"role": "user", "content": prompt}],
                                           temperature=0)
        try:
            txt = _extract_completion_content(r, model, "api_attempt").strip("`")
        except RuntimeError as e:
            print(f"   api_attempt: {e}")
            out[str(i)] = {}
            continue
        if txt.startswith("json"):
            txt = txt[4:]
        try:
            out[str(i)] = json.loads(txt)
        except Exception:
            out[str(i)] = {}
    return out


if __name__ == "__main__":
    main()
