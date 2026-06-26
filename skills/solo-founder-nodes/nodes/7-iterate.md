# Solo Founder Nodes — Phase 7: Iterate From Verified Evidence

## What this phase does
Consumes the proof produced by Phase 6 and decides what must be revisited. Iteration happens **after**
live UI verification because the whole point is to improve the system from real evidence, not from a
pre-proof hunch. The agent does not patch randomly or tune against held-out answers; it routes each
verified failure back to the earliest broken phase, applies one research-backed shared fix, and then
re-runs Phase 6.

The loop is:

`discover → benchmark → setup → build → adapter → verify → iterate → routed earlier phase → verify`

## Inputs (what it reads) / Outputs (the artifact it produces)
Inputs:
- `proof-verdict.json`, fresh-room receipt, transfer ledger, Playwright trace/video, screenshots,
  deployment URL, generated/exported artifacts, cost/latency ledger, and failure-route receipt from
  Phase 6.
- The prior phase receipts:
  - `discover`: user need extraction, screenshot/prompt intake, graph context, research spine,
    capability spec, unsupported-claim labels.
  - `benchmark`: real benchmark choice, held-out split policy, scorer binding, contamination guard,
    baseline run, scorecard rubric.
  - `setup`: provider/self-hosted setup matrix, required env vars, no-secret prework completion,
    deployment target, storage/db decision receipt.
  - `build`: actual app/UI, AI chat component, typed action protocol, design-quality receipt,
    research-backed implementation decisions.
  - `adapter`: agent API contract, NodeAgent/coding-agent bridge, tool-call schema, scorer adapter,
    transport/model-in-loop proof.
  - `verify`: live UI proof, Playwright trace/video, screenshot, deployed URL, generated artifact,
    export/reopen proof, verdict JSON.
- Safe memory: prior routed fixes, rejected hypotheses, aggregate held-out/generalization deltas,
  failure classes, and proof refs. Never read held-out task answers from memory.
- `research-spine.json`, so every proposed fix cites the relevant research/practical reference and
  expected eval metric.
- Reflex RALPH incident records from `.solo/incidents.jsonl`, including classification, impacted
  generation/lane ids, evidence refs, repair spawn plans, and any Root-Cause Patch Contract draft.

Outputs:
- `failure-hypothesis.json`: verified failure class, routed phase, expected metric movement, and why
  earlier/later routes were rejected.
- `rework-ledger.json`: the approach replaced/deleted/deprecated, why it failed, the new shared fix,
  proof receipts, kept/deleted artifacts, and the lesson.
- A Reflex repair receipt for systemic/security/progress-stall incidents: bounded subagent role
  briefs, root-cause diagnosis, patch contract, verification receipts, promotion decision, and
  generation routing (`G0` pinned, future `G1` canary/adopted/rejected).
- Updated phase receipt for the routed phase, then a new Phase 6 verification run.
- Updated memory with aggregate deltas and proof refs only.

## Procedure
0. **Control-plane preflight.** Load the loop state, graph-context receipt, proof verdict, recent
   `SoloEvent` records, budget, approvals, and open rework items. If Phase 6 has not produced a proof
   verdict and fresh-room receipt, stop; iteration has no verified evidence.
0a. **Capture new founder tweaks before choosing a fix.** If the latest user message adds scope,
   screenshots, roadmap bullets, competitor/design references, provider/storage choices, or safety/use
   constraints, run `npm run sfn -- tweak intake --goal "<goal>" --input <text-or-file> --domain <domain>`
   and `npm run sfn -- tweak verify --receipt <file>`. Treat the tweak receipt as routing evidence:
   it may send the loop back to discover, setup, build, adapter, or verify before any rework is kept.
0b. **Load Reflex RALPH incidents.** Run `npm run sfn -- reflex incidents --project . --run <run-id>`
   and inspect any open systemic, security, or progress-stall incidents before choosing a fix. If Phase
   6 wrote raw `SoloEvent` failures but no incident ledger, run `npm run sfn -- reflex watch --project . --run <run-id>`
   first. Active lanes remain pinned to their current `RunGeneration`; iterate can only repair in an
   isolated future generation.
1. **Classify the verified failure.** Use Phase 6 artifacts to assign one route:
   - `discover`: the real user need, screenshot interpretation, or unsupported-claim labeling was
     wrong.
   - `benchmark`: the benchmark/rubric/scorer does not represent the product outcome.
   - `setup`: provider, self-hosted compute, deployment, storage, env, or cost assumptions failed.
   - `build`: the app/UI/chat/action protocol cannot express the intended workflow.
   - `adapter`: the harness/tool-call/scorer/model-in-loop path diverges from the real product path.
   - `verify`: the proof capture itself was incomplete, stale, visually unverified, or not fresh-room.
2. **Run the gstack iterate lane.** Use
   `npm run sfn -- gstack recommend --phase iterate --goal "<goal>" --ui --perf` when UI, product,
   performance, or proof quality is involved. Repeated failures require `investigate`, review, QA, and
   retro receipts before the fix can be kept.
2a. **Spawn bounded Reflex repair for systemic failures.** For an open systemic/security/progress-stall
   incident, run `npm run sfn -- reflex spawn --project . --incident <id> --role <role>`. Spawn only the
   roles needed for diagnosis and verification (for example `root-cause`, `test-writer`, `runtime`,
   `ux-judge`, `security`, `doc-writer`). Each role receives the incident brief, generation pin, allowed
   files/tools, budget cap, and required output receipt. No role may patch the active run lane.
3. **Write the research-backed hypothesis.** Update the relevant decision receipt in
   `research-spine.json`: cite the research/practical sources, name the metric expected to move, list
   rejected alternatives, and mark unsupported claims honestly.
4. **Apply one shared fix in the routed phase.** The fix must improve a reusable tool, context
   substrate, generic writer, API contract, UI affordance, provider/self-hosted setup, or proof
   harness. Never add a per-task writer, benchmark detector, or hidden product path.
4a. **Require the Root-Cause Patch Contract.** Before any Reflex repair can be kept, run
   `npm run sfn -- reflex verify --project . --incident <id> --contract <root-cause-patch-contract.json>`.
   The contract must identify the shared root cause, name the first broken phase, cite the changed files,
   add/adjust deterministic tests, include regression proof, state deployment/user-visible impact, and
   prove no held-out answers or per-task shortcuts were introduced.
5. **Record build-to-delete evidence.** If the fix replaces, disables, or deprecates anything, write
   `rework-ledger.json` and run
   `npm run sfn -- rework verify --ledger rework-ledger.json`.
6. **Re-run Phase 6 verification.** A fix is accepted only if the live UI proof improves or holds on
   held-out/generalization evidence without weakening the fresh-room proof, export/reopen proof,
   design-quality receipt, deployment proof, or official scorer binding.
6a. **Promote only future generations.** After verification passes, run
   `npm run sfn -- reflex promote --project . --incident <id> --contract <root-cause-patch-contract.json>`.
   Promotion can adopt `G1` for queued/future lanes, but must leave already-running `G0` lanes auditable.
   If the canary fails, reject the promotion and keep the incident open with the failed hypothesis.
7. **Accept, revert, or route deeper.** If only tuned/easy cases improve, revert. If the proof capture
   fails, route to `verify`. If the same failure repeats, route to the earliest phase whose receipt was
   wrong and keep the failed hypothesis in memory so the agent does not repeat it.
8. **Persist safe memory.** Store the route, failure class, accepted/rejected hypothesis, aggregate
   metric delta, proof refs, and new receipt paths. Do not store held-out task contents.

## Honesty Guardrail
- Iteration is evidence-driven: no Phase 6 proof, no Phase 7 fix.
- A benchmark number is not enough; the fix must survive live UI proof.
- Held-out and generalization task contents remain quarantined. Store only split hashes, aggregate
  deltas, failure classes, and proof references.
- Every kept fix needs both a research-backed decision receipt and a passing re-verification receipt.
- The loop can jump back to any earlier phase, including `discover`, when the verified failure proves
  the premise was wrong.
- Reflex repairs must be generational. No hot-patching active lanes, no unbounded subagent swarm, no
  patch without a verified Root-Cause Patch Contract, and no promotion without replay/canary evidence.

## Gate
Any re-run that spends model/provider money, uses paid 3D generation, changes shared/prod data, or
deploys publicly needs GUIDE → GENERATE → GATE: show the routed phase, exact command, task/sample
count, estimated cost, expected artifacts, and rollback plan before execution.
