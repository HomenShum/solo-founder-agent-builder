# Solo Founder Nodes Loop — Run, Score, Fix, Re-measure

## What this phase does
Closes the benchmark-driven loop. You already have an adapter that runs tasks through the real agent. This phase (a) executes the suite across three slices, (b) grades deterministically, (c) classifies failures into SHARED root causes, (d) makes ONE smallest-shared-component fix steered by human comment, and (e) re-runs the held-out + generalization slices to confirm the fix generalizes — not just memorizes. It loops until held-out stops improving, then emits the Solo Founder Nodes scorecard. The entire point is to make "the number went up" mean "the agent got better," not "I overfit the tuned tasks."

## Inputs (what it reads) / Outputs (the artifact it produces)
Inputs:
- The three task splits: TUNED (you may inspect + iterate on), HELD-OUT (run, never tune on), GENERALIZATION (off-distribution; run, never tune on). For the dogfood: BankerToolBench tuned/held-out + the non-BTB generalization slice.
- The deterministic grader: `docs/eval/nonbtb/grade.py` (correctness / formula / citation / fabrication; self-tested — run its self-test first).
- **Reference autonomous runner (SHAPE, not the workflow):** [`templates/run/`](../templates/run/) — `spreadsheetbench.py` is one worked adapter showing the *shape* (clone-from-allowlist → seal held-out → **model-in-loop** attempt → grade with the benchmark's **OWN** grader → honest headline). **For the user's app you do NOT run SpreadsheetBench unless their app is spreadsheet-shaped.** Discover/benchmark pick or build the right adapter for *that* app — either a public benchmark whose tasks transfer (SWE-bench, BankerToolBench, SpreadsheetBench, …) or a held-out set generated from the app's real usage. Same shape, same gate.
- The slice contract + materializers-off rule: `docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md`.
- The parallel runner: `scripts/bankertoolbench-nodeagent-parallel.ps1` (throttled parallel runs).
- The agent adapter from the prior phase (the thing that drives the real NodeRoom agent over a task).

Outputs:
- `docs/eval/solo-founder-nodes-scorecard.md` (+ a machine-readable `solo-founder-nodes-scorecard.json`): per-slice pass rate, per-failure-class counts, the one fix applied this iteration, the held-out/generalization delta, and an HONEST/UNVERIFIED flag per number.
- Per-run records (raw transcripts + grades) under `docs/eval/runs/<iso-timestamp>/`, one row per task, so every scorecard number traces to a recorded run.

## Procedure (agent-driven; human steers by comment)
0. **Load safe project memory (QUARANTINED read).** Pull from memory ([`../references/memory.md`](../references/memory.md), L2): the chosen shared-component target, prior fixes + their held-out/generalization deltas, the kill-threshold (min-delta + max-iterations), the failure-class clusters, and the split *hashes*. Read aggregate SCORES and failure CLASSES only — the held-out/generalization per-task CONTENTS must stay quarantined out of memory, or cross-session memory becomes an answer-key leak that silently defeats the anti-overfit design. Memory is a tuned-signal + scores store, not a held-out-content channel.
1. **Self-test the grader.** Run `grade.py`'s self-test. If it doesn't pass, stop — a broken grader fakes every downstream number. (Re your honesty contract: the grader is the measuring instrument; calibrate it before measuring.)
2. **Freeze the splits.** Confirm TUNED / HELD-OUT / GENERALIZATION membership from `BTB_GENERALIZATION_DIAGNOSTIC.md` and record the split hashes. HELD-OUT and GENERALIZATION are write-locked for this whole phase — you may read their pass/fail, never their per-task contents while fixing.
3. **Run all three slices** via `scripts/bankertoolbench-nodeagent-parallel.ps1` (throttle to your API budget — see Gate). Write raw transcripts to `docs/eval/runs/<ts>/`. Run with materializers OFF (the `BTB_GENERALIZATION_DIAGNOSTIC.md` rule) so a precomputed answer can't masquerade as agent competence.
4. **Grade deterministically.** Score every run with `grade.py` — no LLM judge on the scored path. Emit per-task pass/fail + failure class (incorrect / bad-formula / missing-citation / fabrication / tool-error / timeout).
5. **Classify into SHARED root causes.** Cluster the TUNED failures by the component they implicate (planner, a tool, the citation step, the output formatter). **Human comments here** to confirm the cluster and pick the target. The rule: fix a component many tasks share, never a writer that only lifts named tasks.
6. **Make ONE fix** to that shared component. Optionally iterate fast with `harbor --disable-verification` for tight inner-loop turnaround (verification re-enabled before any number counts — see Gate).
7. **Re-measure HELD-OUT + GENERALIZATION** (full verification on). Keep the fix ONLY if held-out AND generalization pass rates hold or rise. If held-out rises but generalization drops, you found an answer-key — revert. If only tuned rose, revert.
8. **Loop** from step 5 until held-out stops improving (define a min-delta + max-iterations kill threshold up front). Then **emit the Solo Founder Nodes scorecard** with the in-app transfer check pending (handoff to the in-app verification phase). **Write iterate memory (QUARANTINED write):** alongside the scorecard, persist to memory ([`../references/memory.md`](../references/memory.md), L2) ONLY the per-iteration fix, the held-out/generalization delta, the failure-CLASS clusters, the aggregate clean-probe headline, the kill-threshold progress, and the HONEST/UNVERIFIED flag per number. NEVER write held-out or generalization per-task contents into memory (set `metadata.aggregateOnly = true`; reject any write tagged `heldout_forbidden`). This keeps the loop resumable without leaking the held-out split across sessions.

## Honesty guardrail (the slice that applies here)
- **HELD-OUT:** you fix using TUNED signal only; held-out + generalization are read-as-score, never read-as-content. A fix that lifts tuned but not held-out is overfitting — revert it. **The headline is the mean over the held-out clean-probe set** ([`../references/honest-lane.md`](../references/honest-lane.md)) — report the real number even if it is low. A fix COUNTS only if held-out + generalization hold or rise by improving a reusable TOOL / CONTEXT-MANAGEMENT / GENERIC-WRITER / APP-UI affordance — never by adding a per-task writer.
- **NO ANSWER-KEYS:** the smallest-shared-component rule IS the guard. If a candidate fix only moves the tasks you looked at (and generalization drops or is flat), it's a per-task detector in disguise — revert. Run in clean-probe mode (all per-task/family writers OFF, generic writer forced, model asserted in the loop) so precomputed outputs can't pose as competence.
- **MEMORY QUARANTINE:** write failure-CLASS and aggregate-SCORE memory only; NEVER write held-out/generalization task contents to memory (it would make cross-session memory an answer-key). See [`../references/memory.md`](../references/memory.md).
- **HONEST PROVENANCE:** every scorecard cell links to a row in `docs/eval/runs/<ts>/`. Any number without a recorded run is marked UNVERIFIED, not reported as a result. The deterministic grader (no LLM on the scored path) is what keeps the score honest; reserve any LLM judge for triage suggestions only, never for the reported number.

## Gate (heavy/irreversible — explicit approval required)
The parallel runs spend API money. Before executing step 3 (and each re-measure in step 7), GUIDE → GENERATE → GATE:
- Present the plan: which slices, task counts, model, throttle/concurrency, and the **estimated total API cost** + wall-clock.
- Show the exact command (e.g. `pwsh scripts/bankertoolbench-nodeagent-parallel.ps1 -Slice held-out -Concurrency N -Model <id>`), dry-run the task enumeration first (list tasks, no model calls).
- Get explicit approval before the spend. Re-confirm if a re-measure materially raises cost.
- `harbor --disable-verification` is for the fix inner-loop ONLY; re-enable verification before any number that lands in the scorecard (an unverified run is not a result).

## Reuse (existing assets to lean on)
- `docs/eval/nonbtb/grade.py` — deterministic correctness/formula/citation/fabrication grader (self-tested); the measuring instrument for step 4.
- `docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md` — the tuned/held-out/non-BTB scorecard layout + the materializers-off rule (steps 2, 3, and the scorecard shape).
- `scripts/bankertoolbench-nodeagent-parallel.ps1` — throttled parallel runner for step 3 + step 7 re-measures.
- `harbor --disable-verification` — fast fix-iteration in step 6 (verification back on before scoring).
- The official contract `docs/eval/bankertoolbench-official-contract.json` — the dogfooded BankerToolBench task shape the adapter and grader speak.
