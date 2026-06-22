# Autonomous benchmark runner — REFERENCE ADAPTER (shape only)

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

```bash
# full auto — a dev with a model key gets the whole run unattended:
OPENAI_API_KEY=...  python spreadsheetbench.py --slice 10 --mode api --salt "$SOLO_LEDGER_SALT"

# agent-in-the-loop — the coding agent IS the model (write attempts/<id>.json, then grade):
python spreadsheetbench.py --repo <clone> --slice 3 --mode agent --attempts-dir ./attempts --salt <s>

# inspect held-out tasks so an agent can attempt them:
python spreadsheetbench.py --repo <clone> --slice 3 --dump
```
It clones `RUCKBReasoning/SpreadsheetBench` (scope it via the policy `downloadAllowlist`), extracts the
dataset, seals the slice (HMAC), attempts, grades with the official grader, and prints
`HEADLINE … hard@all = <mean> over n=<n>` plus a `results.json`.

## Proven (this is a real run, not a claim)
A 2-task held-out demo (agent-in-the-loop, sample_data_200, official grader):
- `59196` (cell-level): **hard=1** (all 3 test cases) — genuinely solved.
- `99-24` (sheet-level): **hard=0** — honestly failed (value-fill can't reconstruct multi-sheet filters).
- **Headline: hard@all = 0.5, n=2.** Low n, honest number.

## Honest boundaries
- `--mode agent` value-fill handles **cell-level** tasks; **sheet-level** tasks need the code-exec
  attempt (model writes openpyxl code, run in the repo's `code_exec_docker`) — wire that as the
  api-mode `attempt` for full coverage. The grader is unchanged either way.
- The **referee stays out of the agent's reach**: the seal salt is the founder's/CI's
  (`SOLO_LEDGER_SALT`), and grading uses the benchmark's own code — the agent runs the loop but cannot
  forge the verdict. See `references/autonomy.md`.

## Add another benchmark
Copy this file's shape: `ensure_dataset` (clone from allowlist) · `seal_heldout` · `attempt` (api/agent)
· `grade` (call the benchmark's OWN grader) · honest headline. Same contract, any benchmark — that's how
every dev gets the same full-auto experience.
