# build — Build the agent and the UI it needs

## What this phase does
Turns the gap report from the prior phase into running code, on the user's actual stack. Two halves, both required: (1) the **agent layer** — a harness loop, the tool implementations the benchmark task needs, and model routing; (2) the **app layer** — the UI/UX components that let a real user trigger the task and watch the agent work (input surface, streaming trace, result artifact, approval/review controls). A benchmark score is meaningless if the same task cannot be run through the live UI, so the UI is in scope, not an afterthought. Per-stack TEMPLATES only — start from the stacks you know; a universal generator is explicitly a NON-GOAL.

## Inputs (what it reads) / Outputs (the artifact it produces)
- **Inputs:** the chosen benchmark + task contract (from solo-founder-nodes's benchmark-selection phase); `research-spine.json` with decision receipts; the gstack operating-lane plan/receipt; the gap report (what the app/agent cannot yet do); the target stack and its conventions; existing harness/tool code to extend; the human's architecture comments.
- **Outputs:** a proposed **diff** (new/changed files for the agent layer + UI layer), `agent-api-contract.md` or `agent-api-contract.json` for every production tool exposed to the model, plus a short build note listing what was added, which tool stubs are still TODO, and how to invoke the task both programmatically and through the UI. Nothing is committed before the Gate.

## Procedure (agent-driven; human steers by comment)
0x. **Do deterministic provider/setup work before any credential pause.** If a real provider, storage
service, deploy secret, OAuth app, or billing account is missing, build the pieces that do not need it:
server-side adapter interface, AI chat component, typed chat action protocol, server-only env var
names, missing-secret UI, blocked-path test, setup doc, cost/latency ledger shape, and exact resume command. Generate an external setup receipt with
`npm run sfn -- setup gate ...`. Do not stop at "need API key" while these pieces are still unbuilt.
0. **Load safe project memory + check prior decisions.** Before scaffolding, read from memory ([`../references/memory.md`](../references/memory.md), L1/L3): the detected stack + prior template choice, the existing harness/tool registry shape, approved architecture rules, founder stack/design preferences, AND the prior REJECTED fixes. Do NOT re-propose an architecture or a fix the human already rejected, and EXTEND the existing tool registry rather than forking it. Read split hashes/scores only — never held-out task contents (quarantine).
0a. **Gate implementation decisions through the Research Spine.** Run `npm run sfn -- research verify research-spine.json`. For every major architecture choice in this phase, add or update a decision receipt with `requirementId`, `chosenApproach`, rejected alternatives, research source ids, practical/inspiration source ids, eval metric ids, and risk. Do not build from a claim labeled `unsupported_assumption` unless the output is explicitly a stretch/prototype lane.
0b. **Gate implementation process through gstack lanes.** Run `npm run sfn -- gstack recommend --phase build --goal "<goal>" --ui --security --risk high` when the work touches UI, credentials, provider calls, deployment, user data, or broad architecture. The plan must include `plan-eng-review`; UI work must include `plan-design-review`; code landing must include `review`; security-boundary work must include `cso`; high-risk work must include `guard`. Store the receipts in the build note before mutating code.
0c. **Gate UI quality before UI code.** For every UI-facing change, run `npm run sfn -- design flow ...`
for the surface and category, then record a Design Brief, Component Contract, selected design skills,
state matrix, and planned visual proof. Do not write UI code from a blank/default harness. The
post-implementation receipt must be created with `npm run sfn -- design gate ...`; missing distinctive
direction, industry fit, component-system choice, responsive screenshots, interaction proof,
accessibility proof, or anti-generic review means the diff is not ready.
0d. **Gate agent chat UX before chat code.** If the app has an agent chat surface, run
`npm run sfn -- chat-ux plan --goal "<goal>" --surface <kind> --category "<category>"` before
implementation. Copy the required workspace surfaces into the Component Contract: real composer,
artifact rail/workspace, tool/job timeline, cost/latency ledger, approval console, analytics loopback,
provenance, trace export, and memory/taste export. A generic chat box around a hidden runner is not an
acceptable app layer.
0e. **Gate 3D asset quality before 3D code.** If the deliverable claims coherent, prototype,
game/CAD/customer, or industry-grade 3D assets, run
`npm run sfn -- 3d quality-plan --goal "<goal>" --target <target> --claim <level>` before mesh/export
work. Copy the required semantic part graph, mesh stats, topology, UV, PBR, GLB/glTF, reopen, wireframe,
UV screenshot, benchmark scorecard, and LOD/collision/pivot evidence into the Component Contract. A
visible OBJ or primitive scaffold can be useful personal-research proof, but it is not a prototype or
industry-grade asset claim.
1. **Pick the stack template.** Detect the stack (Convex/React, Next.js, Streamlit, …) and announce which template you're applying. If unknown, say so and propose the closest one — do NOT invent a universal abstraction.
2. **Map task → capabilities.** For each benchmark task, list the tools the agent must call, the model route(s), and the UI surfaces a human needs to run it and see the result. Present this map; **the human comments here to steer architecture** (e.g. "reuse the existing tool registry, don't fork it", "route long-context to X").
2a. **Write the agent-ready API contract before tool code lands.** For every production tool in the capability map, produce an agent-facing contract and run `npm run sfn -- agent-api verify --contract <agent-api-contract.json>`. The contract must include semantic lifecycle, input/output schemas, provider schema parity, use/do-not-use guidance, preconditions, success signals, structured failure modes, recovery paths, governance, cost/latency class, and examples. Missing or failing contracts block implementation.
3. **Scaffold the agent layer — including the clean-probe lane.** Harness loop (observe → plan → act → extract), tool implementations (real, not answer-keys), model routing. Reuse the existing harness shape; extend the registry rather than forking. Build the **clean-probe lane from the start**: a generic writer that renders the model's own plan (no per-task/family writers) plus the wiring for a mode that forces it with the model in the loop — this is what the adapter (Phase 5) toggles and verify (Phase 6) measures as the headline. See [`../references/honest-lane.md`](../references/honest-lane.md).
4. **Scaffold the app layer.** The input surface, a streaming trace/observability view, the result artifact, and any approval/review controls — using the app's real components so the task runs end-to-end in the live UI.
   For agent chat apps, this must be the full production workspace from the `chat-ux` plan: composer,
   artifact rail, visible tool/job statuses, async progress, cost/latency, approvals/dry-runs,
   analytics, memory/taste export, provenance, and trace export.
5. **Wire the seam.** Connect UI trigger → harness → tools → artifact, so one user action drives the whole loop and surfaces its output on screen.
6. **Present the diff for the Gate** (below). After approval, apply it, then leave a build note with the two invocation paths (programmatic + UI) and the remaining TODO tool stubs.
7. **Write decision/provenance memory + hand off.** Persist to memory ([`../references/memory.md`](../references/memory.md), L1/L2): which template was applied, the wired seam (UI trigger → harness → tools → artifact), the clean-probe lane that now exists, any Component Contract produced by the Design Bridge, and the still-TODO stubs (what's real vs placeholder) so Phase 5 (adapter) and Phase 6 (verify) inherit it. Then **hand off** to adapter + verify — do NOT self-certify that it works; in-app browser verification belongs to the proof phase.

## Honesty guardrail (the slice that applies here)
- **EXTERNAL SETUP GATE:** missing credentials block live provider proof only after deterministic
  prework is complete. Provider keys must be server-side only; `VITE_*`/`NEXT_PUBLIC_*` provider-key
  wiring is a security bug, not a setup shortcut.
- **NO ANSWER-KEYS:** tools must do real work. No per-task detectors, hardcoded outputs, or branches keyed on a known task id. If a change only makes the tuned tasks pass, revert it.
- **IN-APP TRANSFER (built-in here):** build the UI surface in the SAME action as the agent layer so the task is runnable through the real app — a harness that only passes via a private script is not done. (The actual browser-verification proof is the next phase's job; here you just make it possible.)
- **HONEST PROVENANCE:** the build note must mark every tool stub that is still a placeholder as TODO/unverified — never describe a stub as working.
- **HELD-OUT:** do not peek at the held-out or off-distribution task contents while building; build to the task *shape*, not to specific held-out answers.
- **RESEARCH-BACKED IMPLEMENTATION:** a major implementation decision without a valid decision receipt is blocked. If the research says a capability is stretch/unproven, the build must label it that way in UI/docs/proof rather than silently claiming it.
- **AGENT-READY API:** every production tool must have a verified agent-facing contract before it is exposed to the model. Backend validation alone is insufficient; if the provider schema drops required args, omits recovery semantics, hides mutation/approval requirements, or cannot explain when NOT to use the tool, the diff is not ready.
- **GSTACK OPERATING RECEIPTS:** architecture, design, staff-review, security, and guard lanes are mandatory when their trigger conditions apply. Missing gstack receipts mean the diff is not ready for the Gate.
- **DESIGN QUALITY GATE:** any UI-facing diff needs a `design-quality-receipt` from
  `npm run sfn -- design gate ...`. A UI that still reads as an internal harness, lacks desktop/mobile
  screenshots, lacks interaction/a11y proof, or skips industry-fit/component-system decisions is not
  ready even if the backend agent loop works.
- **AGENT CHAT UX GATE:** any agent chat diff needs an `agent-chat-ux` receipt plan from
  `npm run sfn -- chat-ux plan ...` before implementation and a proof receipt collected in Phase 6.
  Missing artifacts, visible tool status, cost/latency, approvals, analytics, provenance, traces, or
  memory/taste export means the app layer is not ready.
- **3D ASSET QUALITY GATE:** any coherent/prototype/industry 3D asset diff needs an `asset-quality`
  plan from `npm run sfn -- 3d quality-plan ...` before implementation and a proof receipt collected in
  Phase 6. OBJ-only, random primitive, no-topology, no-UV, no-PBR, or no-reopen evidence means the
  asset claim is not ready.

## Design Bridge (subroutine — mandatory for UI-facing build work)
When the app-layer gap is a missing or visually-wrong surface, run this subroutine so IN-APP TRANSFER is achievable against a real design — not "make it pretty" guesswork. The design tool is optional; the design-quality receipt is mandatory. Full subroutine + templates: [`../references/design-bridge.md`](../references/design-bridge.md). Order is a hard guardrail: **brief FIRST, design output SECOND, implementation THIRD, browser-verify LAST.**
1. **Gap → structured Design Brief.** Write the brief: the user job; the missing surface; the required components; the design-system tokens; layout/motion/accessibility constraints; screenshots of the current UI; and the EXACT code surfaces to change. (No giant one-shot "redesign the app" prompt.)
2. **Select portable design skills.** Run `npm run sfn -- design recommend ...` (or call `templates/design/designSkillBridge.ts`) to choose direction/component/dashboard/animation/mobile guidance for the surface. Claude-origin skills are allowed as markdown references, but implementation must remain runnable by the current coding agent.
2a. **Plan the agent-chat workspace.** Run `npm run sfn -- chat-ux plan ...` when the surface includes
chat, and fold the required surfaces into the same Component Contract.
3. **Inspect/generate via a design MCP (if connected).** Use the connected design tool (Figma MCP for structured access to files/components/variables/layout and code-from-frame; Codex/Claude/Cursor/Windsurf can also use screenshots, Open Design, or DESIGN.md/SKILL.md inputs) to pull context/assets for visual parity. The design tool is an artifact generator + validator, NOT the source of product truth.
4. **Produce a Component Contract.** Name the components, their explicit states, the tokens used, and the props/data they bind to.
5. **Implement from the contract — REUSE existing components.** Build from the contract using the app's real components (avoid one-off CSS drift). Record the contract for the build note.
6. **Browser-verify** (handed to Phase 6's Design Bridge): Playwright screenshot, DOM signal, visual diff, interaction path, mobile breakpoint, design-token usage.
7. **Create the design-quality receipt.** Run `npm run sfn -- design gate ...` with selected skills,
desktop/mobile screenshots, interaction proof, accessibility proof, the Design Brief, and the Component
Contract. A receipt whose visual verdict is `internal-harness`, `needs-redesign`, or `not-run` blocks
the UI claim.
- **COST GATE:** GUIDE → GENERATE → GATE before burning many design calls or writing back to Figma (same discipline as the Gate below; some seat tiers rate-limit design tool calls hard).

## Gate (heavy/irreversible — explicit approval required)
Mutating the codebase is GUIDE → GENERATE → GATE. Present the full proposed **diff** (files added/changed, new deps, any schema/migration changes), call out anything irreversible (schema migration, new external dependency, API-key wiring), and dry-run/typecheck if possible. **Wait for explicit approval before applying the diff or committing.** If new deps or paid API keys are involved, include the install commands and the key-acquisition links and gate those separately.

## Reuse (existing assets to lean on)
- **Reference shape — NodeRoom's `src/nodeagent/`:** use this as the canonical agent-layer template (harness loop, tools, model routing). Model routing lives in `src/nodeagent/models/modelCatalog.ts`; the live observe/act/extract capture loop in `src/nodeagent/capture/` shows the harness + provenance pattern. Extend the existing tool registry rather than forking it.
- **App-layer references (NodeRoom):** input/composer + streaming trace surfaces in `src/ui/panels/` (e.g. `TraceSurface.tsx`, `traceData.ts`, `Artifact.tsx`) for the result artifact and observability view; Convex functions in `convex/` (e.g. `artifacts.ts`) as the server seam between UI trigger and harness.
- **Worked example:** NodeRoom + BankerToolBench — the BankerToolBench task contract drives which tools/UI to scaffold; the agent layer extends `src/nodeagent`, the UI extends the `src/ui/panels` surfaces, and the Convex layer is the trigger→harness→artifact seam.
