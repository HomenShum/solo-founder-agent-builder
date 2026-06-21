# Solo Founder Nodes Phase 2 — Recommend the benchmark + author the rubric

## What this phase does
Turns the agent **capability spec** into a committed **benchmark choice** and a written **rubric**. You pick the external
standard the app's agent must meet — chosen so its output *shape* matches what the app actually produces, so that Phase 8
in-app transfer is meaningful — and you define "what good looks like" as an un-gameable, deterministic-where-possible rubric
with a held-out split designed in from the start. No infra is stood up, no money spent, no code touched. This is a reading +
research + writing phase; the agent drafts, the human steers the choice by comment.

## Inputs (what it reads) / Outputs (the artifact it produces)
**Reads:**
- `capability-spec.md` (from Phase 1 / `discover`) — the app's agent functions and its real output shapes.
- `.claude/skills/solo-founder-nodes/references/benchmarks.md` — the starter registry (BankerToolBench, SpreadsheetBench, SWE-bench,
  WebArena/VisualWebArena/BrowserGym, GAIA, τ-bench, OSWorld) + the built-in choose-rubric.
- Live web search — registries rot; agent benchmarks ship monthly. Always search for newer/closer benchmarks and confirm
  the candidate still exists and its harness still runs before committing.

**Produces:** `benchmark-choice.md` — the committed primary benchmark (+ optional fast-signal starter), the rejected
alternatives with one-line reasons, the rubric (the four un-gameable axes + any app-specific criteria), the held-out and
off-distribution generalization split definitions, and the infra-weight call (which feeds the Phase 3 gate).

## Procedure (agent-driven; the human comments to steer)
1. **Re-read `capability-spec.md`** and extract two things: the **dominant agent function** (document-gen / spreadsheet /
   code / web-nav / tool-use / computer-use) and the **literal deliverable shape** the app emits (xlsx? a chat answer with
   citations? a code patch? a browser end-state?).
2. **Load the registry** `.claude/skills/solo-founder-nodes/references/benchmarks.md` and shortlist by **deliverable shape first, then
   function** (per the registry's choose-rubric). Shape match is non-negotiable: a spreadsheet app scored against GAIA short
   answers can't transfer to its own UI in Phase 8.
3. **Web-search for newer/closer benchmarks** ("<domain> agent benchmark 2026", "<deliverable> eval harness", leaderboards).
   Verify each candidate (a) still exists, (b) has a runnable harness, (c) has a license you can use. Note found-but-rejected
   ones so the choice is auditable.
4. **Score infra weight** for each finalist (light / medium / heavy → Docker/Harbor/HF/verifier). If the founder wants a fast
   first signal, recommend the **lightest benchmark that still matches the deliverable shape** as a starter, and name the
   heavier one as the graduation target. Heavy choices flag the Phase 3 gate.
5. **Author the rubric — "what good looks like."** Always include the four un-gameable axes, made concrete for this app:
   **correctness** (matches expected end-state), **formula-vs-hardcode** (computed, not a literal answer baked in),
   **citation-resolves** (every cited source actually contains the claim), **no-fabrication** (no invented numbers/sources).
   Prefer a **deterministic, no-LLM grader** for each axis where possible so the Phase 6–7 loop is cheap and un-gameable.
   Add app-specific pass criteria only if they're observable and objective.
6. **Define the splits now, not later.** Specify the **held-out split** (tasks the loop may NEVER tune on) and an
   **off-distribution generalization slice** (tasks deliberately unlike the tuned set — different inputs, harder variants,
   adversarial cases). State the sampling rule and the freeze point so Phase 6 inherits them.
7. **Write `benchmark-choice.md`** and present it. **Human steers by comment:** confirm/override the benchmark, adjust the
   rubric weights, tighten the generalization slice, or change the fast-signal-vs-graduation call. If the user defers, proceed
   on explicit stated assumptions and surface them for confirmation.

## Honesty guardrail (the slice that applies here)
This phase owns the **HELD-OUT** non-negotiable at design time: the held-out split and the off-distribution generalization
slice must be **defined and frozen in `benchmark-choice.md` before any building begins** — you cannot honestly carve a
held-out set after you've seen which tasks you can pass. It also pre-empts **NO ANSWER-KEYS**: the rubric must reward the
*capability* (formula-vs-hardcode, citation-resolves), never the specific task, so a later per-task detector visibly violates
the written standard. Pick the benchmark to **expose** overfitting, not to win it — a benchmark you can only pass by
hardcoding is the wrong benchmark, or it's being used dishonestly. The aim is a real external standard, not a high number.

## Gate
None — this phase is light (read + search + write). It only *flags* the Phase 3 gate by recording the chosen benchmark's
infra weight (heavy = Docker/Harbor/HF/verifier → guide → generate → gate before standing it up).

## Reuse
- **Registry + choose-rubric:** `.claude/skills/solo-founder-nodes/references/benchmarks.md` (shape-first matching, infra-weight table,
  honesty note). Treat it as a starter — supplement with live web search.
- **Master directive:** `.claude/skills/solo-founder-nodes/SKILL.md` (the 7-phase loop, the four non-negotiables, the gate policy).
- **Upstream artifact:** `capability-spec.md` from `discover` (Phase 1).
- **Dogfooded worked example — NodeRoom + BankerToolBench:** NodeRoom's agent produces analyst documents (xlsx/pptx/docx)
  and cited chat answers, so the deliverable-shape match is **BankerToolBench** (`docs/eval/bankertoolbench-official-contract.json`,
  `docs/eval/MEDIA_JUDGE.md`, the in-repo `btb_noderoom_agent/`). For a faster first signal on the spreadsheet sub-function,
  **SpreadsheetBench** is the lighter starter that still matches shape — graduate to BTB. This is the same shape-first,
  rubric-with-held-out reasoning to apply to any new app.
