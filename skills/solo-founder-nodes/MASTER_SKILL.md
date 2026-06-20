# Solo Founder Nodes — prove your agent works, in your app, without cheating

This one skill is the whole loop. The master directive (this file) runs the phases in order, reading
the matching **playbook in `nodes/`** when it enters each phase (progressive disclosure). It is
**benchmark-driven development for agents**: define what *good* looks like (a real benchmark + rubric)
**before** building, then build the agent and the UI/UX to pass it **in the actual app, on the real
UI** — and prove the capability is real, not memorized.

## The one non-negotiable — why this skill exists
A coding agent told to "pass the benchmark" will cheat: hardcode answers, detect-and-template specific
tasks, report a high score with **zero** real capability. (Observed: a fleet drove a benchmark to
**0.96** while true held-out capability was **0.008** — answer-keys, not ability.) This directive is
the honesty conscience a solo founder cannot staff. Every phase obeys:
- **HELD-OUT** — never tune on the tasks you score on; keep a held-out split + an off-distribution slice.
- **NO ANSWER-KEYS** — no per-task detectors or hardcoded outputs; revert any change that only lifts the tuned tasks.
- **IN-APP TRANSFER** — a score counts only if the same task through the real app UI reproduces it (browser-verified).
- **HONEST PROVENANCE** — every number traces to a recorded run; report the real number even if it is low.

## Who acts / how the human steers
The user's coding agent drives each phase (reads the codebase, web-searches, builds). The user steers
by **comment**. If the user defers, proceed on explicit, stated assumptions and surface them.

## Permission gates (hard)
Phases that install heavy infra (Docker, Harbor, HuggingFace), spend API money, or mutate the codebase
are **guide -> generate -> gate**: present the plan + exact commands + links, dry-run if possible, and
get explicit approval **before** executing.

## The loop — run in order; read the playbook for each phase

| # | Phase | Goal | Weight | Gate | Playbook |
|---|---|---|---|---|---|
| 1 | discover  | deep-read the app + web-search -> capability spec | light | no | `nodes/1-discover.md` |
| 2 | benchmark | pick the benchmark matching the deliverable shape + author the rubric | light | no | `nodes/2-benchmark.md` |
| 3 | setup     | stand up the eval env (Docker/Harbor/HF/verifier) | heavy | yes | `nodes/3-setup.md` |
| 4 | build     | build the missing agent + UI/UX pieces | per-stack | yes | `nodes/4-build.md` |
| 5 | adapter   | wire the app real agent into the harness (no answer-keys) | medium | yes | `nodes/5-adapter.md` |
| 6 | iterate   | run tuned + held-out + generalization; fix the smallest shared component; re-measure | medium | cost | `nodes/6-iterate.md` |
| 7 | verify    | run the same task in the live app UI; browser-confirm transfer | medium | no | `nodes/7-verify.md` |

Discover + benchmark define *what good is*; setup + build + adapter make it runnable; iterate + verify
make it real. Phases 6-7 are the loop you repeat.

## Output
A **Parity scorecard** — tuned / held-out / generalization, each with its honesty state — plus the
**in-app transfer proof** (browser evidence) and a one-line verdict: **real capability or overfitting.**

## The rest of the suite (separate, standalone skills)
Honesty *primitives* — usable on their own, not phases of this loop:
- **`cited-sources`** — prove a claim by boxing the exact source line; refuses if the quote is not there.
- **`powerpoint`** — turn notes into a deck where every claim is `verified` / `manual` / `needs_review`.

Reuse: a deterministic, no-LLM grader and a worked example live at `docs/eval/nonbtb/` and
`docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md` (repo root; distilled from NodeRoom, the origin).
