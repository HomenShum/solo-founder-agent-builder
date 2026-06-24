# Solo Founder Agent Builder + Eval Loop Engineering Skill Nodes - prove your agent works, in your app, without cheating

This one skill is the whole loop. The master directive runs the phases in order, reading the matching
**playbook in `nodes/`** when it enters each phase (progressive disclosure). It is
**benchmark-driven development for agents**: define what *good* looks like with a real benchmark and
rubric **before** building, then build the agent and UI/UX to pass it **in the actual app, on the real
UI**, and prove the capability is real, not memorized.

## The one non-negotiable - why this skill exists

A coding agent told to "pass the benchmark" will cheat: hardcode answers, detect-and-template
specific tasks, report a high score with **zero** real capability. NodeRoom has receipts for the
failure pattern: selected/family-writer benchmark paths around **0.96**, an older pre-materializer
signal around **0.009**, and a current full-100 clean-probe mean of **0.251875**. Treat the exact
"0.96 versus 0.008" launch-copy sentence as **unproven until the incident bundle is linked** in
`docs/PUBLIC_CLAIM_PROOF.md`. This directive is the honesty conscience a solo founder cannot staff.

Every phase obeys:
- **HELD-OUT** - never tune on the tasks you score on; keep a held-out split + an off-distribution slice.
- **NO ANSWER-KEYS** - no per-task detectors or hardcoded outputs; revert any change that only lifts the tuned tasks. The **honest lane** sharpens this: the same task scores three ways and conflating them *is* the bug. **model-off** (0 tokens, no real tool-call) is a degenerate floor / harness failure, NOT capability. A **task-specific / family writer** firing (deterministic `detect-task -> emit-canned-package`) is an answer-key, fake. Only **model-in-loop + the generic writer** is the real signal. **NON-GENERAL GUARD:** a run counts as capability IFF the generic writer alone produced output, the model was genuinely in the loop (tokens > 0 / real transport), AND it ran on a held-out task; otherwise tag it `answer-key | model-off | replay` and exclude it. Run **clean-probe mode** (force the generic writer; a 0-token trial FAILS LOUDLY; held-out n >= 10; report the distribution). A change counts only if it raises the held-out clean-probe mean via a reusable tool / context-management / generic-writer / app-UI affordance, never a per-task writer. **ENFORCE, DON'T REQUEST:** the substrate must **DERIVE** the gate (which writer fired, model-in-loop, held-out membership) from observed evidence and never accept self-reported fields; a self-set clean-probe flag is itself an answer-key. Red-team the substrate itself as a recurring phase; the claim is "cheating is detectable and expensive," never "impossible." Full doctrine: [`references/honest-lane.md`](references/honest-lane.md).
- **IN-APP TRANSFER** - a score counts only if the same task through the real app UI reproduces it (browser-verified).
- **HONEST PROVENANCE** - every number traces to a recorded run; report the real number even if it is low.

## Who acts / how the human steers

The user's coding agent drives each phase (reads the codebase, web-searches, builds). The user steers
by **comment**. If the user defers, proceed on explicit, stated assumptions and surface them.

**Full autonomy (the goal).** Under a founder **autonomy policy** ([`references/autonomy.md`](references/autonomy.md))
- model + key, a budget cap, a download allowlist, auto-approve installs/code - the agent runs the
WHOLE loop unattended on the founder's behalf: download the dataset, wire the harness, run the model,
iterate, and verify in the live app, pausing only on a hard-stop (over budget, untrusted download,
public publish, deleting data, credentials). The carve-out that makes this safe: **the agent does
every step and produces every proof, but never grades / seals / verifies itself - the referee (seal
salt, gate derivation, sealed-gold, independent verifier) lives out of its reach**
([`references/trust-root-api.md`](references/trust-root-api.md)). Maximum autonomy on the work; zero
autonomy on the scoring.

## Permission gates (hard)

Phases that install heavy infra (Docker, Harbor, HuggingFace), spend API money, or mutate the codebase
are **guide -> generate -> gate**: present the plan + exact commands + links, dry-run if possible, and
get explicit approval **before** executing.

## External setup gate (hard)

External accounts, billing, OAuth, production deploys, storage projects, and API keys are human gates,
but they are not permission to stop early. Before pausing on a provider key or service setup, complete
all deterministic prework that does not require the secret: adapter boundary, AI chat component, typed
chat action protocol, server-side secret env names, missing-secret UI, blocked-path test, setup
documentation, cost/latency ledger shape, and exact resume commands. Do not expose provider keys
through `VITE_`, `NEXT_PUBLIC_`, screenshots, logs, or chat. The pause receipt must say what is
already built, what human action is required, and which command resumes proof collection. Template +
verifier: [`templates/setup/externalSetupGate.ts`](templates/setup/externalSetupGate.ts); CLI:
`npm run sfn -- setup gate ...`.

## Context substrate + control plane (required for full autonomy)

The agent must not rely on chat context alone. At `discover`, build or refresh a graph-context receipt
for the app (`graphify-out/GRAPH_REPORT.md` + `graphify-out/graph.json`, or an equivalent code graph).
From `benchmark` onward, fail closed if the receipt is missing or stale. Query the graph before raw
grep/read for architecture, adapter, UI, benchmark, export, persistence, or scorer questions. Store
the receipt and important query refs in memory, never held-out task contents. Doctrine:
[`references/context-substrate.md`](references/context-substrate.md); copyable inspector:
[`templates/context/`](templates/context/).

Run the loop through a durable control plane when unattended: one loop id, phase checkpoints, approval
requests, trigger idempotency, budget/spend, trace spans, worktree leases, and improvement candidates.
This is how the agent pauses/resumes, survives a fresh session, and hill-climbs from observed failures
instead of waiting for the founder to steer. Doctrine: [`references/control-plane.md`](references/control-plane.md);
copyable implementation: [`templates/control/`](templates/control/). The control plane coordinates
work; `SoloLedger` and the trust-root still derive the benchmark verdict.

## Research spine (required for research-backed implementation)

The agent must not turn a founder's domain prompt into unsupported architecture or product claims. At
`discover`, create or refresh a `research-spine.json` with user needs, inspirational references,
current research, implementation decisions, eval metrics, and required proof artifacts. From `build`
onward, fail closed if a major implementation decision lacks a decision receipt citing at least one
research source, one practical/reference source when available, and one eval metric. From `verify`
onward, fail closed if a major capability/result claim lacks proof artifacts. Unsupported stretch lanes
must be labeled `unsupported_assumption` or `rejected`, never sold as shipped capability. Doctrine:
[`references/research-spine.md`](references/research-spine.md); copyable implementation:
[`templates/research/`](templates/research/).

## gstack operating lanes (portable operating review team)

Use `garrytan/gstack` as an operating-method inspiration, not a Claude Code lock-in. Before accepting
high-impact work, select the specialist review lanes with `npm run sfn -- gstack recommend ...`
([`templates/gstack/gstackBridge.ts`](templates/gstack/gstackBridge.ts)). The bridge maps gstack-style
CEO/product, engineering, design, developer experience, staff review, QA, security, release, guardrail,
docs, and retro roles onto this loop and requires receipts before claims can pass. Examples:
`discover` needs office-hours + CEO review; UI `build` needs engineering + design review before
implementation and staff review before landing; security-boundary work needs a CSO threat receipt;
deployed `verify` needs live QA, release/deploy, and canary receipts. Doctrine:
[`references/gstack-bridge.md`](references/gstack-bridge.md); copyable implementation:
[`templates/gstack/`](templates/gstack/).

## The loop - run in order; read the playbook for each phase

| # | Phase | Goal | Weight | Gate | Playbook |
|---|---|---|---|---|---|
| 1 | discover | deep-read the app + web-search -> capability spec | light | no | `nodes/1-discover.md` |
| 2 | benchmark | pick the benchmark matching the deliverable shape + author the rubric | light | no | `nodes/2-benchmark.md` |
| 3 | setup | stand up the eval env (Docker/Harbor/HF/verifier) | heavy | yes | `nodes/3-setup.md` |
| 4 | build | build the missing agent + UI/UX pieces (calls the **Design Bridge** subroutine for the UI) | per-stack | yes | `nodes/4-build.md` |
| 5 | adapter | wire the app real agent into the harness (no answer-keys) | medium | yes | `nodes/5-adapter.md` |
| 6 | iterate | run tuned + held-out + generalization; fix the smallest shared component; re-measure | medium | cost | `nodes/6-iterate.md` |
| 7 | verify | run the same task in the live app UI; browser-confirm transfer (**Design Bridge** verifies the rendered surface) | medium | no | `nodes/7-verify.md` |

Discover + benchmark define *what good is*; setup + build + adapter make it runnable; iterate + verify
make it real. Phases 6-7 are the loop you repeat.

When running the harness directly, see [`templates/run/README.md`](templates/run/README.md). Its
top-of-file mode-selection table prevents the most common misreport: quoting api-mode scores as your
agent's performance.

## Design Bridge (subroutine - invoked by build + verify)

Not a phase. A subroutine **build** (phase 4) and **verify** (phase 7) call when a UI gap is
architectural/visual and a design tool (Figma MCP, Codex "Implement designs") is connected. **Order is
the guardrail:** structured Design Brief FIRST (user job, missing surface, required components, design
tokens, layout/motion/a11y constraints, current-UI screenshots, the exact code surfaces to change) ->
design output SECOND (inspect/generate via the design MCP) -> produce a Component Contract ->
implement THIRD by REUSING existing components (no one-off CSS drift) -> browser-verify LAST
(Playwright screenshot, DOM signal, visual diff, interaction path, mobile breakpoint, token usage).
**Cost gate:** guide -> generate -> gate before burning design calls or writing back to canvas (same
discipline as the setup install gate). A design MCP is an artifact generator + validator, **not**
product truth. Avoid "make it pretty" / "redesign the whole app" / one giant Figma prompt; prefer
compact, contract-driven prompts on existing tokens. Spec:
[`references/design-bridge.md`](references/design-bridge.md); copyable templates in
[`templates/design/`](templates/design/) (design-brief, component-contract, visual-regression-checklist).

**Design skills are portable inputs, not Claude Code lock-in.** Before calling any design MCP or
writing UI code, select the relevant design guidance with `npm run sfn -- design recommend ...` for a
short plan or `npm run sfn -- design flow ...` for the full transcript flow
([`templates/design/designSkillBridge.ts`](templates/design/designSkillBridge.ts)). Claude-origin
frontend skills, shadcn skills, GSAP skills, UI UX Pro Max, Expo, Material 3, and design registries
are consumed as markdown/tooling references that Codex, Claude Code, Cursor, Windsurf, Copilot, or a
generic coding agent can apply. Do not require a Claude-only slash command or plugin to implement the
surface; port the design decisions into the Design Brief and Component Contract.

The full flow must classify the surface before code: marketing/portfolio uses break-default direction;
functional products use component systems + industry-fit design intelligence; dashboards require
information architecture; mobile is not small web. Select exactly the needed lanes: one style preset
when useful (`minimalist`, `industrial-brutalist`, `all-rounder`, or `premium`), `--visuals` only when
generated image/video assets are part of the product, and `--platform ios|android|cross-platform`
only when the surface is actually mobile/native. Generated media, shadcn MCP registry pulls, and
native mobile guidance still require browser/device proof.

**Design quality gate (hard for UI).** A UI-facing task must run the Design Bridge automatically. The
design tool is optional; the **design quality gate is mandatory**. The goal is to enforce the **best
UI/UX** the task can support, not merely a mechanically working internal harness. A UI-facing build
cannot pass verify until it has a `design-quality-receipt` from `npm run sfn -- design gate ...`
([`templates/design/designQualityGate.ts`](templates/design/designQualityGate.ts)). The receipt must
show: surface classification, distinctive direction, industry fit, component-system choice, state
matrix, responsive proof, desktop + mobile browser screenshots, real interaction proof, accessibility
check, and anti-generic review. Functional product UIs must select product UX/industry-fit guidance
and a component-system lane; 3D apps must prove a full-bleed viewer/workspace-console primary surface,
not a tiny framed preview card. If the visual verdict is `internal-harness`, `needs-redesign`, or
`not-run`, the UI claim is blocked even when the agent mechanics work.

## Memory substrate (local-first, audit-safe)

Each phase **reads safe project memory at start** (decisions, approvals, benchmark choice, setup env,
design constraints, prior rejected fixes) and **writes decision/provenance memory at end** so a founder
resuming next day re-hydrates instead of re-deriving. What each phase reads/writes: discover ->
capability spec + open questions; benchmark -> rubric + the **frozen** split policy/hashes; setup ->
env provenance (image digest, dataset revision, disk paths, smoke baseline); build -> template choice
+ wired seam + TODO stubs; adapter -> adapter path + routed model_id + the honest-baseline writer
mode; iterate -> per-iteration fixes + held-out/generalization **deltas** + failure clusters +
kill-threshold progress; verify -> the DOM signal, screenshot path, run id, transfer ledger, and
verdict.

**FOUR LEVELS:** L0 phase-scratch (discarded after the phase); L1 project (spec, benchmark choice,
stack facts, approved decisions, commands, design constraints, runner paths); L2 evaluation (split
**hashes**, split policy, run ids, scorecards, failure clusters, fixes, provenance); L3 founder
preference (stack, disk paths, design style, approval rules, budget/model prefs - cross-project).

**CRITICAL QUARANTINE:** held-out / off-distribution task **CONTENTS must NEVER enter persistent
memory**; store only split hashes, aggregate scores, and failure classes. This is the memory-side
mirror of NO ANSWER-KEYS: it stops memory from becoming an answer-key leak path across sessions. Each
event carries a benchmark-safety level (`safe | tuned_only | aggregate_only | heldout_forbidden` ->
REJECT the write | `redacted` -> local only). **One sentence:** remember decisions, constraints,
proofs, and preferences - not benchmark answers.

**SAFE STACK (local-first):** SQLite/libSQL = source of truth; FTS5 = default keyword-recall path;
optional embeddings + RRF + rerank + low-confidence rejection (do NOT hallucinate memory); JSONL =
append-only audit ledger; OKF = portable Markdown+YAML export. Mem0 is an OPTIONAL adapter for safe
cross-project preference memory ONLY (filter its sync to exclude held-out content, PII, keys) - never
the authority. Doctrine + the `SoloMemoryEvent` contract + the memory tools the skill calls:
[`references/memory.md`](references/memory.md); copyable templates in
[`templates/memory/`](templates/memory/) (types.ts, schema.ts, localMemory.ts, retrieval.ts,
okfExport.ts, mem0Adapter.ts, solo-memory.schema.json, memory-policy.md). The LIVE implementation
belongs in the founder's own app (e.g. `src/nodeagent/memory/`) - reference it, do not inline it here.

## Output

A **scorecard** - tuned / held-out / generalization, each with its honesty state - plus the
**in-app transfer proof** (browser evidence) and a one-line verdict: **real capability or overfitting.**

Reuse: a deterministic, no-LLM grader and a worked example live at `docs/eval/nonbtb/` and
`docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md` (repo root; distilled from NodeRoom, the origin).
