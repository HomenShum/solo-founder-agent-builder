# Autonomous benchmark runner — REFERENCE ADAPTER (shape only)

## Which `--mode` to use

> ⚠️ **CRITICAL HONESTY GATE:** `--mode api` evaluates **the upstream LLM** (e.g. gpt-4.1-mini) inside the harness — **not your agent**. Quoting an api-mode score as your agent's performance is the exact misrepresentation this skill is built to prevent. Use `--mode agent` to evaluate **your** agent against the same harness.

| Mode | What it evaluates | Use when |
|---|---|---|
| `--mode api` | The upstream LLM (via OpenRouter / OpenAI-compatible) inside the harness — requires `OPENAI_API_KEY`. The runner calls a chat model once per test case for a JSON answer-map, then value-fills the answer-position cells. | You're sanity-checking the harness itself, or comparing **models** against the benchmark — **not** when reporting your agent's score. |
| `--mode agent` | **Your agent** — reads attempts from `<attempts-dir>/<id>.json` produced by your coding agent and applies the same value-fill path as `api`, but with no API call. | You're evaluating **the founder's agent** (the skill's primary purpose) on cell-level tasks. |
| `--mode code-exec` | Your agent through a code-execution attempt: the model writes ONE openpyxl Python script per task (`argv[1]=input`, `argv[2]=output`), the harness runs it in an isolated tempdir under `--code-timeout`, and the grader scores the output. Anti-cheat: script must contain `openpyxl` and `argv`. | Sheet-level tasks (new sheets, multi-sheet filters, large-span formulas) where single-shot value-fill is insufficient. |
| `--mode tool-loop` | `code-exec` PLUS a critique-and-retry loop (`--max-loop-iters`, hard cap at 3). Diff of `output.xlsx` vs `input.xlsx` is fed back as structured critique for v2/v3. The grader scores the **FINAL** attempt only — no best-of-N cherry-pick. Honest gate: all iters produced real scripts, no timeouts, no two consecutive scripts identical. | Sheet-level tasks where `code-exec` stalls (e.g. 0 hard / 0.33 soft); honest because the FINAL attempt is graded, not the best one. |

**This is not "what the skill does."** The skill is end-to-end for **your app**: it discovers what
your app does, then **picks or builds the right test for *that* app**. SpreadsheetBench is one
adapter — useful only if your app is spreadsheet-shaped. For any other app the agent should write a
sibling adapter (in-app real-task set, BankerToolBench, SWE-bench, your own held-out set, …) using
this file's *shape*.

What the shape is — the loop's **iterate/verify** phase as runnable code: clone the benchmark from
the autonomy allowlist → **seal a held-out slice** → attempt each held-out task with the **model in
the loop** → grade with the **benchmark's OWN grader** (or your own deterministic grader for an
in-app eval set) → write an **honest headline**. The harness contains no per-task answers; a row
counts only as a clean held-out probe. Mirrors `references/autonomy.md` + `references/honest-lane.md`.

## Reference adapter: SpreadsheetBench (`spreadsheetbench.py`)
Wraps the real benchmark faithfully — it imports SpreadsheetBench's official `evaluation.compare_workbooks`
(OJ-style: a task passes `hard` only if **all** its test cases match at `answer_position`). It does NOT
reimplement or soften the grader.

**Step 0 — install the Python deps (once, before any `--mode` invocation):**
```bash
pip install -r requirements.txt   # openpyxl + openai; see requirements.txt
```
Skip this and `spreadsheetbench.py` fails with `ModuleNotFoundError: openpyxl` (or `openai`)
the moment a task is graded or `--mode api` runs. The local CLI reports the Python lane status so
you find this before a run, not during one — invoke it from the templates root (the `sfn` binary
is **not** on PATH; it's an npm script):

```bash
cd skills/solo-founder-nodes/templates && npm install && npm run sfn -- doctor
```

Or, for a Python-lane preflight without the CLI:

```bash
python -c "import openpyxl, openai, pptx, docx, reportlab" && echo 'python lane ok' || echo 'python lane missing libs — run: pip install -r run/requirements.txt'
```

**Step 1 — invoke the runner** (pick the mode that matches who's running the model):
```bash
# full auto — a dev with a model key gets the whole run unattended:
OPENAI_API_KEY=...  python spreadsheetbench.py --slice 10 --mode api --salt "$SOLO_LEDGER_SALT"

# agent-in-the-loop — the coding agent IS the model (write attempts/<id>.json, then grade):
python spreadsheetbench.py --repo <clone> --slice 3 --mode agent --attempts-dir ./attempts --salt <s>

# inspect held-out tasks so an agent can attempt them:
python spreadsheetbench.py --repo <clone> --slice 3 --dump
```

> **Using OpenRouter** (recommended for cheap open-source models like `z-ai/glm-5.2` or `deepseek/deepseek-v4-pro`)? Set:
>
> ```bash
> export OPENAI_API_KEY=$OPENROUTER_API_KEY
> export OPENAI_BASE_URL=https://openrouter.ai/api/v1
> export SOLO_MODEL=z-ai/glm-5.2     # any OpenRouter slug; the openai SDK calls it transparently
> ```

It clones `RUCKBReasoning/SpreadsheetBench` (scope it via the policy `downloadAllowlist`), extracts the
dataset, seals the slice (HMAC), attempts, grades with the official grader, and prints
`HEADLINE … hard@all = <mean> over n=<n>` plus a `results.json`.

## Proven (this is a real run, not a claim)
A 2-task held-out demo (agent-in-the-loop, sample_data_200, official grader):
- `59196` (cell-level): **hard=1** (all 3 test cases) — genuinely solved.
- `99-24` (sheet-level): **hard=0** — honestly failed (value-fill can't reconstruct multi-sheet filters).
- **Headline: hard@all = 0.5, n=2.** Low n, honest number.

## Cold-start gotchas (R36 cold-start findings)

These are the friction points the R36 cold-start suite surfaced. Each is now either fixed in the runner or documented here so the next cold-start does not hit them.

### Reasoning-model gotcha (`--mode code-exec` / `--mode tool-loop`)

Reasoning-tuned slugs on OpenRouter — `z-ai/glm-5.2`, most `deepseek/*` thinker variants, `qwen3/*-thinking` — frequently return `choices[0].message.content == None` while spending all tokens in `.reasoning` / `.reasoning_content`. The OLD runner read `.content` directly, silently produced an empty script, and the honest-lane gate read it as "model failed" when it was actually "runner failed to read the model output".

The runner now hard-errors with `RuntimeError("model={slug} returned empty .content ...")` naming the model + token usage. It also best-effort extracts a fenced ```python block from `.reasoning` before failing — many reasoning models put the final code there. If you hit the error, either:

- switch to a non-thinker slug: `export SOLO_MODEL=openai/gpt-4.1-mini` (or `anthropic/claude-haiku-4.5`), OR
- raise the provider's `max_tokens` so the model has room for both reasoning and the answer.

### Windows path normalization

Claude Code's `Read` tool on Windows rejects POSIX-absolute paths like `/tmp/sfn-fresh/...`. When cold-starting on Windows, write outputs to `C:/tmp/...` (or `%TEMP%`) from the start — do NOT default to `/tmp/`. The PowerShell tool understands both, but `Read` does not auto-normalize.

If a script must be Windows-portable, use `tempfile.gettempdir()` rather than hardcoding `/tmp`.

### Default `--slice 3` ceiling under `--mode agent`

`sample_data_200` slice 3 contains 2 sheet-level tasks. Value-fill (which is what `--mode agent` does) cannot solve sheet-level tasks by construction — the answer requires creating/filtering new sheets. So `--mode agent --slice 3` is capped at `hard@all=0.333` regardless of agent capability. If your goal is to evaluate the agent (not measure the slice geometry), either:

- raise `--slice` to a value with more cell-level tasks, OR
- switch to `--mode code-exec` / `--mode tool-loop` (which CAN solve sheet-level tasks via openpyxl scripts).

### Attempts file schema (`--mode agent`)

The runner expects `<attempts-dir>/<id>.json` shaped like:

```json
{
  "1": { "Sheet1!B2": 123.45, "Sheet1!C2": "result" },
  "2": { "Sheet1!B2": 456.78, "Sheet1!C2": "other"  },
  "3": { "Sheet1!B2": 789.01, "Sheet1!C2": "third"  }
}
```

Top-level keys `"1"`, `"2"`, `"3"` correspond to test cases 1..N (N = `num_test_cases(dataset, task_id)`). Each value is a `{cellRef: value}` map.

### Honest-lane semantic gate (R36 P0-2)

`cleanGeneralProbe` used to be purely structural (script-produced + has openpyxl + has argv + no timeout + no duplicate scripts). It would stay True even when v2/v3 of `--mode tool-loop` crashed with `SyntaxError`, which made critique-and-retry regressions look like "clean failures" instead of regressions.

The runner now reports both axes in `results.json`:

- `cleanStructuralProbe` — old behavior (script-shaped, no timeouts, no dup scripts).
- `cleanSemanticProbe` — at least one iter ran without exception.
- `cleanGeneralProbe` — both axes True.

A row only counts toward `headline_hard_mean` when `cleanGeneralProbe == True`.

### Degenerate-pass flagging (R36 P1-1)

`test_case_results=[1,0,0]` reads as "1 solve + 2 misses" but can actually be "1 lucky degenerate match because the input workbook already contained the answer rows for test case 1, plus 2 crashes". The runner now sets `degeneratePasses: [test_case_indices]` on each row when grader records a 1 but the script crashed (`ranWithoutException=False` AND `output_written=False`) — that's the unambiguous signature of a lucky-on-untouched-input pass. The official `hard`/`soft` numbers are NOT mutated (the grader's verdict stays intact), but the flag is visible to anyone reading `results.json`.

## Honest boundaries
- `--mode agent` value-fill handles **cell-level** tasks; **sheet-level** tasks need the code-exec
  attempt (model writes openpyxl code, run in the repo's `code_exec_docker`) — wire that as the
  api-mode `attempt` for full coverage. The grader is unchanged either way.
- The **referee stays out of the agent's reach**: the seal salt is the founder's/CI's
  (`SOLO_LEDGER_SALT`), and grading uses the benchmark's own code — the agent runs the loop but cannot
  forge the verdict. See `references/autonomy.md`.

### Sealing the held-out slice (`SOLO_LEDGER_SALT` semantics)

The salt is the **referee carve-out** — the one piece of state the agent provably never sees.
Everything below is enforced by the file boundary (CI secret / founder's vault), not by trust.

- **Why a salt at all.** The seal is `HMAC(salt, task_id)` over every dataset row, then the lowest-N
  hashes become the held-out slice. Without a salt, the agent could re-derive which task ids are in
  the slice (the dataset is public), prefetch them, and "solve" the held-out set by lookup. The salt
  makes slice membership **unforgeable from the agent's side** while staying **deterministic on the
  referee's side** — same salt + same dataset = same slice, every run, for replay/audit.
- **What it seals.** Slice **membership** (which task ids are held out), not task **contents**. The
  benchmark contents stay public; the salt only hides *which subset* counts toward the headline.
- **Who owns it.** The founder, or CI on the founder's behalf. Store it in a CI secret
  (`SOLO_LEDGER_SALT` env var on the runner) or a password manager (1Password / Bitwarden item).
  **Never** commit it to the repo, never paste it into an agent prompt, never log it. If the agent
  can read it (in env, in a file the agent has fs access to, in a tool response), the seal is broken
  for that run — discard the row.
- **When to rotate.** Per project, per quarter, or after any suspected leak — **never re-use across
  projects**. Rotation is intentional and irreversible: old ledger rows become un-replayable because
  the slice they were graded against no longer regenerates. That's the design — a rotated salt means
  "those old verdicts are sealed history; new runs start a fresh held-out set the agent has never
  seen." Treat rotation as a ledger-epoch boundary, not a bug.
- **Unset salt → dev fallback.** If `SOLO_LEDGER_SALT` is unset, the runner falls back to the literal
  string `dev-salt-change-me` and prints an explicit warning. This exists so a first-time contributor
  can `python spreadsheetbench.py --slice 3 --dump` on their laptop without configuring secrets — it
  is **dev-only**. A row sealed with `dev-salt-change-me` is **not** a real held-out probe and must
  not be written to the headline ledger. CI should fail the run if the salt equals the fallback.

## Add another benchmark
Copy this file's shape: `ensure_dataset` (clone from allowlist) · `seal_heldout` · `attempt` (api/agent)
· `grade` (call the benchmark's OWN grader) · honest headline. Same contract, any benchmark — that's how
every dev gets the same full-auto experience.

## Live-browser UI lane — `liveBrowserRoom.ts` (the second adapter shape)

The python adapter above proves the agent passes the **harness**. The TypeScript sibling
[`liveBrowserRoom.ts`](./liveBrowserRoom.ts) proves the agent passes the **live app** — the
in-app transfer non-negotiable from `nodes/7-verify.md`, made executable. A founder runs both
lanes; only the live-browser lane can flip a row's `live_browser_room_passed` ledger bit, and
only `clean && live_browser_room_passed` rows count toward the headline mean.

**Why a second adapter shape?** The python harness can be cheated by a code path that detects
the task id and emits a canned package — the score lights up while the live UI does something
else (or nothing at all, behind a Suspense/SSR blank shell). The live-browser lane drives the
real composer, the real upload button, the real export button, and feeds the EXPORTED bytes
into the benchmark's own official scorer. The two lanes have to agree, on the same task ids,
on the same answers, or the row is non-transferring.

**The 7 steps the adapter executes (per task, in order, with receipts):**
1. `ensureFreshRoom` — launch a brand-new room URL; empty work surface at t=0; one room per task.
2. `importHeldOut` — drive the real upload path with the sealed held-out task artifact.
3. `askAgent` — type the literal task prompt into the real composer (no template wrapper).
4. `waitForArtifact` — wait on a DOM testid + Convex run id (NEVER `sleep(N)` poll).
5. `exportArtifact` — click the real export button; read the bytes from the file the user gets.
6. `gradeWithOfficial` — invoke the benchmark's OWN official scorer on those bytes, unchanged.
7. `writeLedgerRow` — `SoloLedger.recordTask` with `live_browser_room_passed` DERIVED (not
   accepted) from the six receipts.

**Status: shape only.** `liveBrowserRoom.ts` ships signatures, receipt types, and the
honest-lane comment block — **not** a default implementation. Each app writes its own concrete
sibling (`liveBrowserRoom.spreadsheetbench.ts`, `liveBrowserRoom.bankertoolbench.ts`, …)
because the Playwright selectors, Convex schema, and export buttons differ per app, but the
contract is invariant.

**Coverage report.** Adapters also emit a [`../ledger/uiCoverage.ts`](../ledger/uiCoverage.ts)
record per track — `liveBrowserRoomCases`, `allOfficialTasksLiveBrowserVerified`, the
per-deliverable-type breakdown, and a top-level `strictUiCoverageReady` summary flag. **All
deliverable types are required**: if a benchmark spans `xlsx-cell`, `xlsx-sheet`, `chart`,
and `json`, every shape must have at least one passing live-browser row before
`allOfficialTasksLiveBrowserVerified` flips true.

**Dogfood reference.** NodeRoom is implementing this contract for its SpreadsheetBench +
BankerToolBench + multi-user-conflict tracks in `src/eval/officialBenchmarkUiCoverage.ts`
(sibling to `src/eval/officialBenchmarkTaskCoverage.ts`). That file is the worked example —
the skill stays portable, the noderoom file stays in the noderoom repo.
