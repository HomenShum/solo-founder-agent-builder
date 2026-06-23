# Solo Founder Agent Builder + Eval Loop Engineering Skill Nodes — prove your agent works, in your app, without cheating

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
- **NO ANSWER-KEYS** — no per-task detectors or hardcoded outputs; revert any change that only lifts the tuned tasks. The **honest lane** sharpens this: the same task scores three ways and conflating them *is* the bug — **model-off** (0 tokens, no real tool-call) is a degenerate floor / harness failure, NOT capability; a **task-specific / family writer** firing (deterministic `detect-task → emit-canned-package`) is an answer-key, fake; only **model-in-loop + the generic writer** is the real signal. **NON-GENERAL GUARD:** a run counts as capability IFF the generic writer alone produced output, the model was genuinely in the loop (tokens > 0 / real transport), AND it ran on a held-out task — otherwise tag it `answer-key | model-off | replay` and exclude it. Run **clean-probe mode** (force the generic writer; a 0-token trial FAILS LOUDLY; held-out n ≥ 10; report the distribution). A change counts only if it raises the held-out clean-probe mean via a reusable tool / context-management / generic-writer / app-UI affordance — never a per-task writer. **ENFORCE, DON'T REQUEST:** the substrate must **DERIVE** the gate (which writer fired, model-in-loop, held-out membership) from observed evidence and never accept self-reported fields — a self-set clean-probe flag is itself an answer-key — and you must **red-team the substrate itself** as a recurring phase; the claim is "cheating is detectable and expensive," never "impossible." Full doctrine: [`references/honest-lane.md`](references/honest-lane.md).
- **IN-APP TRANSFER** — a score counts only if the same task through the real app UI reproduces it (browser-verified).
- **HONEST PROVENANCE** — every number traces to a recorded run; report the real number even if it is low.

## Who acts / how the human steers
The user's coding agent drives each phase (reads the codebase, web-searches, builds). The user steers
by **comment**. If the user defers, proceed on explicit, stated assumptions and surface them.

**Full autonomy (the goal).** Under a founder **autonomy policy** ([`references/autonomy.md`](references/autonomy.md))
— model + key, a budget cap, a download allowlist, auto-approve installs/code — the agent runs the WHOLE
loop unattended on the founder's behalf: download the dataset, wire the harness, run the model, iterate,
and verify in the live app, pausing only on a hard-stop (over budget · untrusted download · public
publish · deleting data · credentials). The carve-out that makes this safe: **the agent does every step
and produces every proof, but never grades / seals / verifies itself — the referee (seal salt, gate
derivation, sealed-gold, independent verifier) lives out of its reach** ([`references/trust-root-api.md`](references/trust-root-api.md)).
Maximum autonomy on the work; zero autonomy on the scoring.

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
| 4 | build     | build the missing agent + UI/UX pieces (calls the **Design Bridge** subroutine for the UI) | per-stack | yes | `nodes/4-build.md` |
| 5 | adapter   | wire the app real agent into the harness (no answer-keys) | medium | yes | `nodes/5-adapter.md` |
| 6 | iterate   | run tuned + held-out + generalization; fix the smallest shared component; re-measure | medium | cost | `nodes/6-iterate.md` |
| 7 | verify    | run the same task in the live app UI; browser-confirm transfer (**Design Bridge** verifies the rendered surface) | medium | no | `nodes/7-verify.md` |

Discover + benchmark define *what good is*; setup + build + adapter make it runnable; iterate + verify
make it real. Phases 6-7 are the loop you repeat.

When running the harness directly, see [`templates/run/README.md`](templates/run/README.md) — its top-of-file mode-selection table prevents the most common misreport (quoting api-mode scores as your agent's performance).

## Design Bridge (subroutine — invoked by build + verify)
Not a phase — a subroutine **build** (phase 4) and **verify** (phase 7) call when a UI gap is
architectural/visual and a design tool (Figma MCP, Codex "Implement designs") is connected. **Order is
the guardrail:** structured Design Brief FIRST (user job; missing surface; required components; design
tokens; layout/motion/a11y constraints; current-UI screenshots; the exact code surfaces to change) →
design output SECOND (inspect/generate via the design MCP) → produce a Component Contract → implement
THIRD by REUSING existing components (no one-off CSS drift) → browser-verify LAST (Playwright
screenshot, DOM signal, visual diff, interaction path, mobile breakpoint, token usage). **Cost gate:**
guide -> generate -> gate before burning design calls or writing back to canvas (same discipline as the
setup install gate). A design MCP is an artifact generator + validator, **not** product truth. Avoid
"make it pretty" / "redesign the whole app" / one giant Figma prompt; prefer compact, contract-driven
prompts on existing tokens. Spec: [`references/design-bridge.md`](references/design-bridge.md);
copyable templates in [`templates/design/`](templates/design/) (design-brief, component-contract,
visual-regression-checklist).

## Memory substrate (local-first, audit-safe)
Each phase **reads safe project memory at start** (decisions, approvals, benchmark choice, setup env,
design constraints, prior rejected fixes) and **writes decision/provenance memory at end** — so a
founder resuming next day re-hydrates instead of re-deriving. What each phase reads/writes: discover →
capability spec + open questions; benchmark → rubric + the **frozen** split policy/hashes; setup → env
provenance (image digest, dataset revision, disk paths, smoke baseline); build → template choice + wired
seam + TODO stubs; adapter → adapter path + routed model_id + the honest-baseline writer mode; iterate →
per-iteration fixes + held-out/generalization **deltas** + failure clusters + kill-threshold progress;
verify → the DOM signal, screenshot path, run id, transfer ledger, and verdict.

**FOUR LEVELS:** L0 phase-scratch (discarded after the phase) · L1 project (spec, benchmark choice,
stack facts, approved decisions, commands, design constraints, runner paths) · L2 evaluation (split
**hashes**, split policy, run ids, scorecards, failure clusters, fixes, provenance) · L3 founder-
preference (stack, disk paths, design style, approval rules, budget/model prefs — cross-project).

**CRITICAL QUARANTINE:** held-out / off-distribution task **CONTENTS must NEVER enter persistent
memory** — store only split hashes, aggregate scores, and failure classes. This is the memory-side
mirror of NO ANSWER-KEYS: it stops memory from becoming an answer-key leak path across sessions. Each
event carries a benchmark-safety level (`safe | tuned_only | aggregate_only | heldout_forbidden` →
REJECT the write | `redacted` → local only). **One sentence:** remember decisions, constraints, proofs,
and preferences — not benchmark answers.

**SAFE STACK (local-first):** SQLite/libSQL = source of truth; FTS5 = the default keyword-recall path;
optional embeddings + RRF + rerank + low-confidence rejection (do NOT hallucinate memory); JSONL =
append-only audit ledger; OKF = portable Markdown+YAML export. Mem0 is an OPTIONAL adapter for safe
cross-project preference memory ONLY (filter its sync to exclude held-out content, PII, keys) — never
the authority. Doctrine + the `SoloMemoryEvent` contract + the memory tools the skill calls:
[`references/memory.md`](references/memory.md); copyable templates in
[`templates/memory/`](templates/memory/) (types.ts, schema.ts, localMemory.ts, retrieval.ts,
okfExport.ts, mem0Adapter.ts, solo-memory.schema.json, memory-policy.md). The LIVE implementation
belongs in the founder's own app (e.g. `src/nodeagent/memory/`) — reference it, do not inline it here.

## Output
A **scorecard** — tuned / held-out / generalization, each with its honesty state — plus the
**in-app transfer proof** (browser evidence) and a one-line verdict: **real capability or overfitting.**

Reuse: a deterministic, no-LLM grader and a worked example live at `docs/eval/nonbtb/` and
`docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md` (repo root; distilled from NodeRoom, the origin).
