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
verify in the live app, and iterate from proof failures, pausing only on a hard-stop (over budget, untrusted download,
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

## Optional agent host setup (OpenRouter / OpenClaw / Hermes)

Do not lock the skill to Claude Code, Codex, OpenClaw, Hermes, or any model provider. If the founder
wants a low-cost OpenRouter-backed agent-host setup, generate an **optional** setup pack with
`npm run sfn -- agents openrouter-audit --out openrouter-model-audit.json` followed by
`npm run sfn -- agents openrouter-plan --audit openrouter-model-audit.json --out agent-host-setup`.
The pack must keep secrets out of repo files, cite the OpenRouter model catalog date, and select
models by evidence:

- OpenClaw default: cheapest paid conformance-proven route (`deepseek/deepseek-v4-flash` in the
  2026-06-24 audit).
- Hermes default: conformance-proven coding fallback (`qwen/qwen3-coder-next` in the 2026-06-24
  audit).
- Free and multimodal catalog lanes stay in `SOLO_OPENROUTER_AUDITED_*` until the selected host
  produces its own smoke and conformance receipts.

Treat model choice as a receipt-backed policy, not a hardcoded eternal truth. If the catalog changes,
rerun smoke + agent conformance before changing claims.

## CLI command center + universal event bus (hard)

The clean visualization is the CLI command center, not a static diagram. Use
`npm run sfn -- dashboard --project <path>` to show loop state, active proof status, agent hosts,
runtime, metrics, artifacts, and recent events. The slogan is binding:
**Hooks observe the agent. Receipts prove the work. The CLI makes the whole loop visible.**

All agent hosts normalize telemetry into the universal `SoloEvent` bus in `.solo/events.jsonl`:
`session.created`, `session.start`, `session.idle`, `session.stop`, `session.deleted`,
`phase.start`, `phase.stop`, `prompt.submit`, `tool.before`, `tool.pre`, `tool.post`,
`tool.after`, `tool.error`, `file.read.pre`, `file.changed`, `file.write.pre`, `file.write.post`,
`command.run.pre`, `command.run.post`, `browser.proof.start`, `browser.proof.stop`,
`receipt.write`, `memory.write`, `eval.start`, `eval.stop`, `rework.recorded`, and
`judge.verdict`. Native hooks are
allowed when a host supports them; otherwise use the external proof wrapper. Generic/no-hooks agents
must not self-report completion. Install or inspect adapter plans with
`npm run sfn -- agent matrix` and
`npm run sfn -- hooks install --target <pi|hermes|openclaw|trae|codex|claude-code|windsurf|devin|cursor|generic|all> --project <path>`.
Use `--mode generic-until-verified` for hosts such as Trae until native hooks are proven. The
compatibility alias `agent install-hooks` still works, but the canonical surface is `hooks install`.

**Fresh-context judge:** stop/idle/final-answer hooks must call
`npm run sfn -- judge current --project <path> --on-stop`. The judge reads only durable evidence:
`.solo/loop-state.json`, `.solo/events.jsonl`, `.solo/receipts`, `.solo/proof-verdict.json`, and the
RALPH receipt requirements. It returns `done | not_done | blocked | needs_research |
needs_verification`. `done` is legal only when the full RALPH loop is complete; a locally completed
milestone still returns `not_done` with the next command. Missing discover receipts route to
`needs_research`; missing proof verdicts route to `needs_verification`. Final-answer hooks block when
`blockClaim` is true. Native where available, generic wrapper when not, receipts always. Doctrine:
[`references/host-hooks-fresh-judge.md`](references/host-hooks-fresh-judge.md).

NodeRoom proof runs are surfaced through `npm run sfn -- noderoom run-fresh-room ...`, but a handoff
receipt is not a pass. Only verified fresh-room receipts, trace/video artifacts, visual recording
checks, and a passing proof verdict count. Doctrine: [`references/cli-command-center.md`](references/cli-command-center.md);
copyable implementation: [`templates/events/`](templates/events/) and
[`templates/dashboard/`](templates/dashboard/).

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

For resumable phase enforcement, create a RALPH loop ledger with
`npm run sfn -- loop init --goal <goal> --project <path>`, inspect it with
`npm run sfn -- loop status --project <path>`, resume with
`npm run sfn -- loop resume --loop-id <id> --project <path>`, and start anywhere only through
`npm run sfn -- loop start --from <R|A|L|P|H> --project <path>`. The ledger writes
`.solo/loop-state.json`, `.solo/events.jsonl`, `.solo/receipts/<milestone>/`, `.solo/proof-verdict.json`,
and `.solo/rework-ledger.md`. A milestone can start only if prior required receipts exist; otherwise it
records a blocker and emits the backfill command. The lower-level phase receipt verifier remains
available with `npm run sfn -- run verify --receipt loop-run.json`. No phase advances without its
required receipts; the verify/proof milestone cannot complete without a passing `proof-verdict.json`.
Doctrine: [`references/ralph-loop-ledger.md`](references/ralph-loop-ledger.md); copyable
implementation: [`templates/loop/`](templates/loop/).

**Nested phase RALPH:** the macro RALPH ledger is not enough. Each major phase also has its own
`R/A/L/P/H` gates via `npm run sfn -- phase verify --phase <discover|benchmark|setup|build|adapter|verify|iterate>`.
`verify` must emit the failure route, and `iterate` must consume that verified evidence to route back
to the earliest broken phase. Do not patch from vibes; no Phase 6 proof means no Phase 7 fix.

**Intent RALPH (generic user-intent decomposition):** the skill is not tied to any one proof domain.
After `discover`, decompose the founder request into major workstreams/capabilities and run
`npm run sfn -- intent ralph-plan --goal "<goal>" --domain <domain> --out intent-ralph.json`, then
`npm run sfn -- intent ralph-verify --receipt intent-ralph.json`. Each workstream must carry nested
`R` research, `A` alignment/dependency contracts, `L` live-build artifact plan, `P` proof evidence,
and `H` hardening/blocked-claim receipts. Domain adapters such as 3D part research may add stricter
checks; they do not replace the generic intent loop. Doctrine: [`references/intent-ralph.md`](references/intent-ralph.md);
copyable implementation: [`templates/intent/intentRalph.ts`](templates/intent/intentRalph.ts).

**Idea tweaks (cheap founder-screenshot delta intake):** founder scope changes are expected. When the
user adds screenshots, competitor links, "also..." requirements, roadmap bullets, storage/provider
preferences, design references, or safety/commercial boundaries after the loop has started, run
`npm run sfn -- tweak intake --goal "<goal>" --input <text-or-file> --domain <domain> --out idea-tweaks.json`
and then `npm run sfn -- tweak verify --receipt idea-tweaks.json`. The tweak receipt classifies each
new idea as a capability delta, names the earliest phase to revisit, and lists the receipts/proofs
that must be updated. It must feed Intent RALPH, Component RALPH, design flow, setup matrix, agent chat
UX, and live proof only when those deltas require it. Do not silently absorb scope changes into a
final answer. Doctrine: [`references/idea-tweaks.md`](references/idea-tweaks.md); copyable
implementation: [`templates/tweaks/ideaTweak.ts`](templates/tweaks/ideaTweak.ts). Doctrine:
**No silent scope creep; every tweak is implemented, deferred, or blocked with proof.**

**Direction Change Protocol:** if the founder says "instead of," "make our own," "new pipeline,"
"learn from this gold standard," "replace," "pivot," or otherwise changes the product, architecture,
proof, or quality direction, do not treat it as a cheap tweak. Run
`npm run sfn -- direction intake --file <text-or-screenshot-notes> --project .`,
`npm run sfn -- direction propose --goal "<updated goal>" --project .`,
`npm run sfn -- direction decide --pivot pivot-001 --decision accepted --project .`, and
`npm run sfn -- direction apply --pivot pivot-001 --project .`. The receipt must classify each
inspiration as Adopt/Adapt/Park/Reject, record old vs. new direction, target quality tier, invalidated
receipts, new proof obligations, and the parent RALPH reroute. Direction RALPH is Reality,
Acceptance, Live Build, Proof Run, Harden for the pivot itself. Doctrine:
[`references/direction-change.md`](references/direction-change.md); copyable implementation:
[`templates/direction/directionRalph.ts`](templates/direction/directionRalph.ts). Doctrine:
**No direction receipt, no architecture-changing code claim.**

**Architecture Governor:** direction or architecture-relevant changes require a canonical
`docs/system-map.graph.json`. Initialize and verify with
`npm run sfn -- graph init --goal "<goal>" --project .`,
`npm run sfn -- graph validate --project .`, and optionally
`npm run sfn -- graph render --project . --out docs/system-map.md`. The system map is the
control-plane contract a fresh coding agent uses to orient itself around UI, agent loop, research
spine, proof registry, component ledger, storage, deployment, model/runtime, and external systems.
Doctrine: [`references/architecture-governor.md`](references/architecture-governor.md); copyable
implementation: [`templates/architecture/architectureGovernor.ts`](templates/architecture/architectureGovernor.ts).

**Component RALPH (nested proof for compositional outputs):** if the output is compositional, the
agent must create `.solo/ledgers/component-ralph.json` with `npm run sfn -- component init --goal
"<goal>" --domain <domain> --project .`, then prove each production-critical component through its
own `R/A/L/P/H` receipts. This applies to 3D assets, multi-tab workbooks, multi-file reports, UI
systems, agent harnesses, data pipelines, and simulations. Do not decompose tiny implementation
details. Decompose only pieces that affect user value, have external quality standards, can
independently fail, are exported deliverables, or create trust/safety/performance risk. Stop/idle/final-answer
hooks call `judge current`, and the judge blocks parent `L/P/H` claims when the component ledger is
missing or any required child proof is incomplete. Use `npm run sfn -- component proof --all --project
.` before claiming parent proof. Doctrine: [`references/component-ralph.md`](references/component-ralph.md);
copyable implementation: [`templates/component-ralph/`](templates/component-ralph/). Doctrine:
**No component proof, no parent claim.**

**Assembly Coherence Governor (interfaces after components):** Component RALPH can still produce a
nonsense parent artifact if proven parts do not attach, hand off state, export together, or survive
the live proof as one composed system. After Component RALPH, run
`npm run sfn -- assembly init --goal "<goal>" --domain <domain> --project .` and
`npm run sfn -- assembly verify --receipt .solo/ledgers/assembly-coherence.json --base .`.
The receipt must name subassemblies, required interfaces, evidence paths, no-floating/no-orphan
checks, and export/runtime/proof binding. The fresh-context judge blocks parent `L/P/H` claims for
compositional goals when the assembly ledger is missing or incomplete. Doctrine:
[`references/assembly-coherence.md`](references/assembly-coherence.md); copyable implementation:
[`templates/assembly/assemblyCoherence.ts`](templates/assembly/assemblyCoherence.ts). Doctrine:
**No assembly/interface proof, no professional workflow claim.**

**Domain RALPH Packs (professional invariants):** Generic RALPH proves the process; Domain RALPH
proves that the work is good for the user's specific industry/task. When the goal is domain-specific,
professional, visual, agentic, financial, deployment-facing, or benchmark-facing, run
`npm run sfn -- domain research --goal "<goal>" --project .`, then
`npm run sfn -- domain synthesize --goal "<goal>" --project .`, then
`npm run sfn -- domain verify --project .`. R does not end with a research summary; it must produce a
self-researched domain pack with ontology, professional invariants, proof gates, source tiers, visual
checks when applicable, child RALPH targets, negative fixtures, and regression fixtures. If a user reports a
failure, convert it into a permanent gate with
`npm run sfn -- domain classify-report --file <report>` and
`npm run sfn -- domain add-regression --file <report> --project .`; do not only patch the visible bug.
The fresh-context judge blocks parent `L/P/H` claims when required domain gates are missing or failing.
Doctrine: [`references/domain-packs.md`](references/domain-packs.md); copyable implementation:
[`templates/domain-pack/domainJudge.ts`](templates/domain-pack/domainJudge.ts). Doctrine:
**No self-researched domain pack, no build. No domain proof, no domain claim. Every user-reported domain failure becomes a permanent proof gate.**

**Acceptance Compiler (domain pack -> proof registry):** after Domain RALPH produces the pack, A must
compile that pack into executable proof obligations before Live Build can be claimed:
`npm run sfn -- acceptance compile --project . --no-files` and
`npm run sfn -- acceptance verify --project . --no-files`. The compiler writes
`.solo/receipts/A/acceptance-bar.json` and `.solo/receipts/A/proof-registry.json`, carrying child
component/assembly/operation RALPH targets and negative fixtures. `--no-files` is valid only while
creating the pre-build contract; later proof phases must produce the files named by the registry. The
fresh-context judge blocks parent `L/P/H` claims when the compiler receipt is missing or incomplete.
Doctrine: [`references/acceptance-compiler.md`](references/acceptance-compiler.md); copyable
implementation: [`templates/acceptance/acceptanceCompiler.ts`](templates/acceptance/acceptanceCompiler.ts).
Doctrine: **No proof gate registry, no build.**

**Operation RALPH (workflow actions):** object proof is not workflow proof. When the user expects
brush selection, delete, material replacement, moving/resizing, hotspot creation, animation, export,
or any other product action, run
`npm run sfn -- operation init --goal "<goal>" --domain <domain> --project .` and
`npm run sfn -- operation verify --project .`. Each required operation needs `R/A/L/P/H` receipts,
expected post-conditions, before/after or selection proof, and regression hardening. The
fresh-context judge blocks parent `L/P/H` claims for edit/export workflows when Operation RALPH is
missing or failing. Doctrine: [`references/operation-ralph.md`](references/operation-ralph.md);
copyable implementation: [`templates/operation/operationRalph.ts`](templates/operation/operationRalph.ts).
Doctrine: **No operation proof, no workflow claim.**

**Prometheus Mode (versioned engineering loop):** when the user wants a product to improve over
attempts, or when the proof story is "watch the artifact get better," wrap the parent RALPH loop in
Prometheus Mode:
`npm run sfn -- prometheus init --goal "<goal>" --target <domain> --project .`,
`npm run sfn -- prometheus run --goal "<goal>" --iterations <n> --record --project .`,
`npm run sfn -- prometheus compare --project .`, and
`npm run sfn -- prometheus publish --project .`. Each version must record a hypothesis, changed
artifact surfaces, component gates, proof references, score, cost/runtime/model/tool usage, failure
analysis, and next-version improvement plan. This is not model self-training; it is artifact and
harness improvement through receipts. The fresh-context judge blocks final claims for active
Prometheus runs whose latest version has not passed. Doctrine:
[`references/prometheus-mode.md`](references/prometheus-mode.md); copyable implementation:
[`templates/prometheus/`](templates/prometheus/). Doctrine:
**Every version needs proof; every failed proof needs a next-version plan.**

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

**Research Governor:** for any research-backed implementation, classify sources and write a fresh
research brief before the build decision is treated as grounded:
`npm run sfn -- research classify --title "<title>" --url <url> --domain <domain>` and
`npm run sfn -- research brief --goal "<goal>" --domain <domain> --project .`, then verify with
`npm run sfn -- research verify <brief.json>`. Product inspirations are only product references; they
must be Adopt/Adapt/Park/Reject classified and cannot prove implementation quality. Doctrine:
[`references/research-governor.md`](references/research-governor.md); copyable implementation:
[`templates/research/researchGovernor.ts`](templates/research/researchGovernor.ts).

**3D founder scenario:** for picture/text/video/reference-media-to-3D requests, default to a
first-party plan: reference-media intake + rights/provenance gate -> first-principles component
breakdown -> capture/coverage -> multi-view reconstruction or local/open image/text-to-asset -> depth
fallback -> brush/source crop when the user marks an object -> shared scene manifest -> assetize/export
-> Three.js/WebGL viewer action protocol -> voice transcript handoff and permission-gated camera
animation contract. Meshy/Tripo/Rodin/Luma are
comparator or fallback lanes, not the product architecture unless the founder explicitly chooses
provider-first. GMI AgentBox is an optional deployment/listing lane for packaged agents, not a
required 3D generation provider. Exact extraction of protected movie/game/social/textbook assets
without rights proof is blocked. Educational purpose is recorded as context, not treated as automatic permission. Allowed
modes are user-owned or licensed media, public-domain/compatible-license media, real-world factual
object reference, or transformed inspiration with similarity/provenance receipts. Before generation,
produce a component tree, functional geometry/material map, protected-expression filter, and
originality delta so the output is an original design from abstracted components. Use
`npm run sfn -- 3d plan ...` and `npm run sfn -- 3d verify ...`. For this domain, run the
**3D part-research RALPH adapter** before any mesh is treated as coherent:
`npm run sfn -- 3d part-research-plan --goal "<goal>" --components <component-tree.json> --out part-research.json`
and `npm run sfn -- 3d part-research-verify --receipt part-research.json`. This nested loop expands
each component into `R` research, `A` assembly/interface constraints, `L` local geometry/material,
`P` proof evidence, and `H` hardening/blocked-claim receipts. The output cannot claim a coherent
product, CAD, game, character, or scene asset if any part lacks sources, functional requirements,
composition interfaces, evidence files, or unsupported-claim labels. Doctrine:
[`references/part-research-ralph.md`](references/part-research-ralph.md); copyable implementation:
[`templates/threeD/partResearchRalph.ts`](templates/threeD/partResearchRalph.ts).
For personal research scaffolds, use `npm run sfn -- 3d make-asset ...` to create a deterministic OBJ
from a filtered functional spec or text prompt. This asset is proof material for the loop: mark it
personal-research-only, not production-ready, not human-use approved, and not an exact replica export.
Commercial/deployment use is a user-owned external decision after their due diligence; the agent must
not claim to approve it.

**Local 3D model RALPH:** if the loop claims Hunyuan3D-2.0, TRELLIS, or another self-hosted model
generated an asset, run `npm run sfn -- 3d model-plan --goal "<goal>" --model
<hunyuan3d-2.0|trellis> --out <receipt.json>` before setup/build and
`npm run sfn -- 3d model-verify --receipt <receipt.json>` during verify. A blocked preflight is still
valid evidence for setup honesty, but it cannot support a model-generated asset claim. `--require-pass`
is legal only when the receipt includes the generated asset, runtime log, mesh validation, DCC/viewer
reopen proof, and actual UI screenshot. Record only the `HF_TOKEN` env contract and presence boolean;
never record token values. If local runtime is blocked, route to a remote compute lane such as
Hugging Face Jobs GPU, a hosted Hunyuan3D Space, the Microsoft TRELLIS.2 hosted Space, an Inference
Endpoint, or another approved GPU cloud; the same source/privacy, runtime/output, mesh validation,
reopen, and actual UI proof contract still applies. Doctrine: [`references/local-3d-model-ralph.md`](references/local-3d-model-ralph.md);
copyable implementation: [`templates/threeD/localModelRalph.ts`](templates/threeD/localModelRalph.ts).
Hosted generation proof is a tiered claim, not a blank check. A remote model lane may pass
`generated-output` and `app-import` after a GLB/mesh is produced and loaded in the live UI, while
`asset-quality`, `industry-grade`, `game-ready`, `CAD-ready`, or `customer-ready` remain blocked until
mesh validation, DCC reopen, UV/PBR, topology/retopology, rig/performance, and benchmark receipts pass.

**3D asset quality gate:** coherent/prototype/industry-grade asset claims require more than a visible
OBJ. Before building, run `npm run sfn -- 3d quality-plan --goal "<goal>" --target
<viewer|game|cad|character|scene|marketplace> --industry-grade` when the target claim is industry
grade. During verify, run `npm run sfn -- 3d quality-verify --receipt <asset-quality-receipt.json>`.
The receipt must prove semantic part graph, mesh validity, topology/retopo, UV unwrap, PBR material
maps, GLB/glTF export, DCC/viewer reopen, wireframe/UV screenshots, benchmark scorecard, and
LOD/collision/pivot where runtime use demands it. OBJ-only, random primitive, no-UV, no-PBR,
no-topology, or no-reopen evidence blocks prototype/customer/industry claims. Doctrine:
[`references/industry-3d-assets.md`](references/industry-3d-assets.md); copyable implementation:
[`templates/threeD/assetQualityGate.ts`](templates/threeD/assetQualityGate.ts).

**Engineering invention harness:** for engineer/inventor requests that mention urgent, safety-critical,
life-support, medical, field-repair, or "life and death" stakes, use `npm run sfn -- engineering plan
...` before build work. The harness may allow an exact previous model only inside a sealed,
non-exportable study sandbox for measurement and first-principles extraction. The final generator must
receive only the filtered functional spec, never the raw replica. Urgency accelerates triage,
simulation/test planning, and receipt collection; it does not permit exact replica export, human use,
or customer/regulator claims without hazard analysis, simulation or bench-test evidence, qualified
human engineering approval, and an export-eligibility verdict. Medical or life-support lanes also
require regulatory-scope review. If a qualified human chooses an emergency break-glass path outside
the agent, record the override context, owner, scope, known unknowns, and post-hoc review plan, but do
not let the agent convert that override into a passing safety/export verdict. Use the
first-principles deconstruction receipt (`npm run sfn -- engineering deconstruct-init ...`) to prove
the exact replica stayed study-only, was purged/sealed, and only the filtered functional spec reached
the reinvention agent. The receipt documents process integrity; it is not a legal opinion, safety
approval, freedom-to-operate opinion, or human-use approval.

**Fresh-user and proof gates:** screenshot-only founder requests must be proven through a fresh
nontechnical emulation receipt (`npm run sfn -- fresh-user ...`) and a full proof pack
(`npm run sfn -- proof full-verify ...`). A plain recording is not enough: require full-screen video,
separate recording audit, terminal transcript, Playwright trace/video, deployed URL, generated assets,
export/reopen proof, scorecard, cost/latency, and a trust-root verdict. Use
`npm run sfn -- trust verify ...` to prove held-out salt, scorer, and final verdict stay outside the
agent process.

## Agent-ready API gate (hard for tools)

Every production tool exposed to a model must be agent-ready by construction. Backend validation is
not enough; the provider-facing schema and description are what the model sees. During **build** and
**adapter**, produce an `agent-api-contract.md` or JSON equivalent for every production tool and
verify it with `npm run sfn -- agent-api verify --contract <file>`. The contract must include:
tool purpose, input/output schema, provider schema parity, required args, semantic lifecycle
(`search -> resolve -> preview -> execute -> verify -> recover`), when to use, when not to use,
preconditions, success signals, structured failure modes, recovery paths, cost/latency class,
permission level, mutation flag, approval requirement, and examples. Doctrine:
[`references/agent-ready-api.md`](references/agent-ready-api.md); copyable verifier:
[`templates/agentApi/`](templates/agentApi/).

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
| 6 | verify | run the same task in the live app UI; browser-confirm transfer (**Design Bridge** verifies the rendered surface) | medium | no | `nodes/6-verify.md` |
| 7 | iterate | route proof failures back to discover / benchmark / setup / build / adapter, apply one research-backed fix, and re-run verification | medium | cost | `nodes/7-iterate.md` |

Discover + benchmark define *what good is*; setup + build + adapter make it runnable; verify proves
what happened in the live UI; iterate decides which earlier phase must change and repeats the proof.
Phases 6-7 are the loop you repeat, in that order: proof first, fix second.

When running the harness directly, see [`templates/run/README.md`](templates/run/README.md). Its
top-of-file mode-selection table prevents the most common misreport: quoting api-mode scores as your
agent's performance.

## Design Bridge (subroutine - invoked by build + verify)

Not a phase. A subroutine **build** (phase 4) and **verify** (phase 6) call when a UI gap is
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

**Agent chat UX gate (hard for agent apps).** Agent chat surfaces must follow the VisualLabs and
Harness4Visuals patterns: chat is a production workspace with artifacts, visible tool/job status,
cost/latency, approval/dry-run actions, analytics loopback, provenance, trace export, and
memory/taste export. Before build, run `npm run sfn -- chat-ux plan ...`
([`templates/design/agentChatUxGate.ts`](templates/design/agentChatUxGate.ts)) and copy its required
surfaces into the Component Contract. During verify, run
`npm run sfn -- chat-ux verify --receipt <agent-chat-ux-receipt.json>`. A generic chat box, hidden
job runner, transcript-only memory, or missing artifact/cost/provenance surface cannot pass build or
verify. Doctrine: [`references/agent-chat-ux.md`](references/agent-chat-ux.md).

## Memory substrate (local-first, audit-safe)

Each phase **reads safe project memory at start** (decisions, approvals, benchmark choice, setup env,
design constraints, prior rejected fixes) and **writes decision/provenance memory at end** so a founder
resuming next day re-hydrates instead of re-deriving. What each phase reads/writes: discover ->
capability spec + open questions; benchmark -> rubric + the **frozen** split policy/hashes; setup ->
env provenance (image digest, dataset revision, disk paths, smoke baseline); build -> template choice
+ wired seam + TODO stubs; adapter -> adapter path + routed model_id + the honest-baseline writer
mode; verify -> the DOM signal, screenshot path, run id, transfer ledger, generated/exported artifacts,
proof verdict, and failure classes; iterate -> the routed phase to revisit, the research-backed fix,
the rework entry, the held-out/generalization **deltas**, and kill-threshold progress.

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

## Build to delete (hard for rework)

Disposable scaffolding is allowed; undocumented replacement is not. When a path is deleted,
deprecated, or replaced because proof showed it failed, record a rework ledger entry with the old
approach, why it seemed right, what failed, the failure receipt, the new approach, why it survived,
the proof receipts, what was deleted, what survived, and the lesson. Verify with
`npm run sfn -- rework verify --ledger rework-ledger.json`. Doctrine:
[`references/build-to-delete.md`](references/build-to-delete.md); copyable verifier:
[`templates/rework/`](templates/rework/).

## Output

A **scorecard** - tuned / held-out / generalization, each with its honesty state - plus the
**in-app transfer proof** (browser evidence) and a one-line verdict: **real capability or overfitting.**

Reuse: a deterministic, no-LLM grader and a worked example live at `docs/eval/nonbtb/` and
`docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md` (repo root; distilled from NodeRoom, the origin).
