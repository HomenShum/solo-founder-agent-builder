# Solo Founder Nodes — local substrate (turnkey)

Runnable, local-first reference of the substrates the loop needs. **One command, no cloud, no API
keys, no Convex:**

```
npm i && npm run smoke
```

The smoke runs pass/fail assertions that *prove* each anti-cheat/control-plane/design/research/gstack
mechanism (and the chain detecting a tamper) — not a claim, a passing run.

## CLI (`sfn`) — the universal shell entry
A thin wrapper over the **same code the smoke proves** — pure shell, no new deps. It's the
agent-agnostic surface: every coding agent can run it.

```
npm run sfn -- doctor                       # node + deps readiness
npm run sfn -- smoke                        # the substrate proof (expect all assertions to pass)
npm run sfn -- conformance                  # the cross-agent portability probe (PASS + receipt)
npm run sfn -- dashboard --project .        # command-center view over loop/proof/events/agents/artifacts
npm run sfn -- judge current --project . --on-stop
npm run sfn -- event record --event tool.post --agent codex --project .
npm run sfn -- context inspect <app-root>   # inspect Graphify-style graph context readiness
npm run sfn -- control start --project <p> --goal <g> --budget 5 --root <app-root>
npm run sfn -- control status <loopId>      # resume summary: phase, approvals, traces, improvements
npm run sfn -- research init --goal <g> --domain 3d-generation --scope local-personal-research
npm run sfn -- research classify --title "Khronos glTF" --url https://www.khronos.org/gltf/ --domain 3d-asset-pipeline
npm run sfn -- research brief --goal "web-ready 3D asset pipeline" --domain 3d-asset-pipeline --project .
npm run sfn -- direction intake --file founder-inspiration.txt --project .
npm run sfn -- direction propose --goal "owned OSS interactive 3D asset pipeline" --project .
npm run sfn -- direction decide --pivot pivot-001 --decision accepted --project .
npm run sfn -- direction apply --pivot pivot-001 --project .
npm run sfn -- graph init --goal "owned OSS interactive 3D asset pipeline" --project .
npm run sfn -- graph validate --project .
npm run sfn -- graph render --project . --out docs/system-map.md
npm run sfn -- loop init --goal <g> --project <path>
npm run sfn -- loop status --project <path>
npm run sfn -- loop events --project <path>
npm run sfn -- loop doctor --project <path>
npm run sfn -- loop resume --loop-id <id> --project <path>
npm run sfn -- loop start --from <R|A|L|P|H> --project <path>
npm run sfn -- loop verify --milestone <R|A|L|P|H> --project <path>
npm run sfn -- phase verify --phase verify --stage P --project <path>
npm run sfn -- phase route --to build --reason "live proof failed at chat action protocol" --project <path>
npm run sfn -- agent matrix                 # host adapters, hook files, proof mode, self-report policy
npm run sfn -- hooks install --target pi --project . --dry-run
npm run sfn -- hooks install --target hermes --project . --dry-run
npm run sfn -- hooks install --target openclaw --project . --dry-run
npm run sfn -- hooks install --target trae --mode generic-until-verified --project . --dry-run
npm run sfn -- agent install-hooks --target codex --project . --dry-run
npm run sfn -- noderoom run-fresh-room --case FR-010 --base-url <url> --headed --record-video --trace on --focus-mode on --model-mode top_paid --budget benchmark_completion
npm run sfn -- run --project <path> --goal <g> --out loop-run.json
npm run sfn -- run verify --receipt loop-run.json
npm run sfn -- proof init --goal <g> --domain 3d-generation --scope local-personal-research
npm run sfn -- proof full-verify --receipt full-proof-pack.json
npm run sfn -- agent-api verify --contract agent-api-contract.json
npm run sfn -- fresh-room verify --receipt docs/eval/fresh-room/<case-id>/latest.json
npm run sfn -- fresh-user init --case fresh-3d-001 --prompt "I want a 3D model app from pictures"
npm run sfn -- trust verify --receipt trust-root-receipt.json
npm run sfn -- tweak intake --goal <g> --input new-founder-notes.txt --domain <domain> --out idea-tweaks.json
npm run sfn -- tweak verify --receipt idea-tweaks.json
npm run sfn -- intent ralph-plan --goal "build a hiring operations agent" --domain workflow-ops-agent --out intent-ralph.json
npm run sfn -- intent ralph-verify --receipt intent-ralph.json --base docs/proof
npm run sfn -- component init --goal "build a coherent 3D asset app" --domain 3d-generation --project .
npm run sfn -- component decompose --input "wooden chair from image" --domain 3d-generation --out component-tree.json
npm run sfn -- component proof --all --project .
npm run sfn -- prometheus init --goal "interactive 3D eyewear product page" --target 3d-web-asset --project .
npm run sfn -- prometheus run --goal "interactive 3D eyewear product page" --iterations 3 --record --project .
npm run sfn -- prometheus compare --project .
npm run sfn -- prometheus publish --project .
npm run sfn -- 3d plan --goal "first-party picture/text to 3D app"
npm run sfn -- 3d part-research-plan --goal "coherent eyewear 3D asset" --out part-research.json  # 3D-specific adapter
npm run sfn -- 3d part-research-verify --receipt part-research.json --base docs/proof
npm run sfn -- 3d model-plan --goal "run Hunyuan3D-2.0/TRELLIS after brush crop" --model hunyuan3d-2.0 --status blocked_compute --out hunyuan-local-model.json
npm run sfn -- 3d model-verify --receipt hunyuan-local-model.json --no-files
npm run sfn -- 3d quality-plan --goal "game-ready picture to 3D asset" --target game --industry-grade
npm run sfn -- 3d quality-verify --receipt asset-quality-receipt.json
npm run sfn -- 3d make-asset --goal "personal research 3D scaffold" --project-id kestrel-seat --out-dir proof/assets
npm run sfn -- engineering plan --goal "urgent replacement part from prior models" --risk safety_critical --urgency emergency
npm run sfn -- engineering deconstruct-init --goal "clean-room deconstruct prior model" --project-id kestrel-seat
npm run sfn -- memory add --project . --project-id <id> --summary <s>
npm run sfn -- rework list --project .
npm run sfn -- rework verify --ledger rework-ledger.json
npm run sfn -- agents openrouter-audit --out openrouter-model-audit.json
npm run sfn -- agents openrouter-plan --audit openrouter-model-audit.json --out agent-host-setup
npm run sfn -- design recommend --surface saas-app --runtime codex
npm run sfn -- design flow --surface 3d-app --category "3D asset generation" --visuals --animation --runtime codex
npm run sfn -- chat-ux plan --goal "3D asset agent workspace" --surface 3d-asset-workspace --category "3D asset generation" --model-compare
npm run sfn -- chat-ux verify --receipt docs/proof/agent-chat-ux-receipt.json
npm run sfn -- gstack recommend --phase verify --goal <g> --ui --deploy --security
npm run sfn -- seal --salt <s> <taskId...>  # seal a held-out manifest (HMAC) — keep the salt OUT of the agent's reach
npm run sfn -- ledger list                  # list recorded eval runs
npm run sfn -- ledger verify <runId>        # re-verify a run's hash-chain (tamper check)
```

## What's here
- **`ledger/` — `SoloLedger`**: the honest-lane eval ledger that **DERIVES the gate, never accepts it**.
  - Enforced fully + locally: **S9** derive-the-gate + quarantine-on-disagreement · **S12** split
    sealing + immutable split-ledger (rejects tuned-reuse / off-manifest) · **S14** memory-leak taint ·
    **S16** hash-chain (detects out-of-band tampering).
  - Wired as hooks — the harness supplies a receipt, the ledger *checks* it: **S10** writer-provenance
    receipt tied to the deliverable bytes · **S11** signed transport ledger (per-run nonce) · **S15**
    independent refute-by-default verifier.
- **`memory/` — `SoloMemory`**: local-first SQLite + FTS5 recall + the **S13** content gate
  (rejects held-out gold regardless of the caller's self-declared `benchmarkSafety` label).
- **`context/` - `GraphContext`**: Graphify-style receipt inspector. Post-discover phases fail closed
  unless the app has a ready graph report + graph JSON, forcing query-first orientation.
- **`control/` - `SoloControlPlane`**: durable loop state for triggers, checkpoints, approvals, budget
  stops, trace spans, worktree leases, and trace-sourced improvement candidates.
- **`events/` - `SoloEvent` bus + agent matrix**: normalizes agent hooks into `.solo/events.jsonl`,
  generates Pi/Hermes/OpenClaw/Trae/Codex/etc. hook/rules plans, and blocks self-reported completion
  for no-hooks or generic-until-verified agents.
- **`judge/` - Fresh-context judge**: reads loop state, required receipts, events, and proof verdict
  to return `done | not_done | blocked | needs_research | needs_verification`; stop/final-answer
  hooks use it to continue the loop instead of trusting chat memory.
- **`dashboard/` - CLI command center**: renders the active loop, proof verdict, metrics, artifacts,
  recent events, runtime, and agent host policy from local receipts.
- **`research/` - Research Spine + Research Governor**: research-backed decision receipts, claim
  gates, proof artifacts, source-tier classification, fresh research briefs, and 3D-agent comparison
  rubric.
- **`direction/` - Direction Change Protocol**: classifies direction-changing founder inspirations
  into Adopt/Adapt/Park/Reject, writes Direction RALPH proposals, and produces the receipt required
  before architecture-changing code claims continue.
- **`architecture/` - Architecture Governor**: writes and validates `docs/system-map.graph.json` so
  fresh coding agents can orient through UI, agent loop, research spine, proof registry, component
  ledger, deployment, storage, and external systems.
- **`loop/` - RALPH Loop Ledger + Loop Runner**: `.solo/loop-state.json`, `events.jsonl`, milestone
  receipt directories, start-anywhere gates, and executable phase receipts for discover -> benchmark ->
  setup -> build -> adapter -> verify -> iterate, with proof-verdict enforcement before rework.
- **`phase/` - nested phase RALPH**: each major phase has its own R/A/L/P/H receipt gates, and
  verified failures route back to the earliest broken phase instead of patching blindly.
- **`intent/` - generic Intent RALPH**: turns any founder request into workstream/capability loops
  with research, alignment/dependencies, live-build plan, proof evidence, and hardening labels. This
  is the default nested loop for all domains; 3D, engineering, design, and other adapters add stricter
  checks on top.
- **`tweaks/` - Idea Tweaks**: turns new founder screenshots/comments/roadmap bullets into structured
  deltas, earliest-phase reroutes, required receipt updates, and proof obligations. This keeps pivots
  cheap without allowing silent scope creep.
- **`component-ralph/` - generic Component RALPH**: creates `.solo/ledgers/component-ralph.json`
  for compositional outputs and blocks parent L/P/H claims until production-critical child components
  have R/A/L/P/H receipts and proof gates. This is generic; 3D part research is one adapter on top.
- **`prometheus/` - Prometheus Mode**: versioned engineering loop over any supported artifact domain.
  It records v0/v1/... hypotheses, changes, component gates, proof references, scores, failure
  analysis, improvement plans, comparison data, and replay HTML. It improves artifacts and harnesses
  through receipts; it does not claim model self-training.
- **`agentApi/` - Agent-ready API gate**: semantic tool contracts, provider-schema parity, and
  structured failure/recovery checks.
- **`proof/` - Fresh-room and full proof receipts**: live browser proof receipts with trace/video/screenshots,
  official scorer results, exported/reopened artifacts, costs, latency, token usage, full-screen
  video, recording audit, deployed URL, generated assets, scorecard, and trust-root verdict.
- **`freshUser/` - Fresh nontechnical founder emulation**: required setup choices and proof evidence
  for a GitHub-URL-plus-vague-prompt session.
- **`threeD/` - First-party 3D app lane**: reference-media intake, rights/provenance gate,
  first-principles component breakdown/originality delta, capture/reconstruction/3DGS/local
  generation/depth fallback/export/viewer-action plan with providers as comparator/fallback only.
  Includes a 3D-specific part-research RALPH adapter (`partResearchRalph.ts`) that forces every component to
  carry researched function, assembly interfaces, local geometry/material, proof evidence, and
  hardening labels before composition. Also includes a deterministic personal-research-only OBJ asset
  maker for proof scaffolds, a local Hunyuan3D-2.0/TRELLIS model RALPH lane, and an industry-grade
  asset quality gate that rejects OBJ-only/random-primitive/no-UV/no-PBR/no-topology claims when the
  target is prototype, game/CAD/customer, or industry-grade output.
- **`engineering/` - Safety-critical invention harness**: exact previous models allowed only in a
  non-exportable study sandbox; exportable designs require first-principles specs, hazard analysis,
  simulation/test receipts, qualified engineer review, and export eligibility. Break-glass emergency
  overrides are record-only and cannot make the agent issue a passing safety verdict. Includes a
  first-principles deconstruction receipt verifier for study-only clean-room extraction.
- **`trust/` - Trust-root receipt**: held-out salt, scorer, and final verdict boundaries that stay
  outside the agent process.
- **`rework/` - Build-to-delete ledger**: records replaced/deleted approaches, failure receipts,
  surviving proof, and lessons.
- **`design/`**: the design-bridge templates (brief / component contract / visual-regression checklist)
  plus the agent-chat UX gate that forces VisualLabs-style artifacts, tool status, costs, approvals,
  analytics, provenance, and Harness4Visuals-style memory/taste export.
- **`gstack/` - gstack Bridge**: portable CEO/eng/design/QA/security/release operating-review lanes.
- **`setup/openrouterAgentHosts.ts` - Optional agent hosts**: OpenRouter/OpenClaw/Hermes setup pack
  generator with cheap current model policy, secret hygiene, and conformance commands. The core skill
  does not require these hosts.
- **`smoke.ts`**: the proof.

## What runs vs. what you wire
- **Runs out of the box (generic, local):** the gate / split-sealing / memory-leak taint / hash-chain,
  the memory engine + content gate, graph-context receipt checks, durable control plane, loop runner,
  RALPH ledger, agent-ready API gate, fresh-room receipt verifier, rework ledger verifier,
  design/research/gstack gates, and OpenRouter setup policy. (The deterministic grader is at
  `../../../docs/eval/nonbtb/grade.py`.)
- **You wire (app-coupled — by design, because they touch *your* harness):**
  - **S10/S11 receipts** must be produced by your harness — instrument your materializer to log the
    call-stack-leaf per deliverable, and your planner to write the signed transport row. The contract is
    the `WriterReceipt` / `TransportReceipt` types in `ledger/ledger.ts`.
  - **S15 verifier** is a function you pass to `finishRun({ verifier })` — plug your second model/lens.
  - The **sealed-gold corpus** (for S13) and the **HMAC salt** (for S12) must live **out of the agent's
    reach** (CI / a signing service), never in the agent's own process.

## The honest boundary
This makes cheating **detectable and expensive — not impossible.** The irreducible residuals
(input-corpus laundering, family-shape priors over a fixed pool, the signing process as the trust root)
require a continuously-refreshed family-disjoint held-out stream + a human/CI backstop. See the full
doctrine in [`../references/honest-lane.md`](../references/honest-lane.md) and the literature in
[`../references/research.md`](../references/research.md).
