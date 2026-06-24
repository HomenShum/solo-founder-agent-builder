# Solo Founder Nodes — Phase 6: Verify in the Live UI

## What this phase does
Closes the loop between an OFFLINE harness score and a REAL user outcome. The harness scored the agent on a task in a controlled rig; this phase drives the SAME task through the live app UI exactly as a user would, then verifies — with a concrete DOM signal and a screenshot — that the app shows the same correct, cited answer. The deliverable is browser-grounded proof plus a binary verdict. If the in-app run diverges from the harness (different answer, missing citation, error, blank shell), the harness number is declared NON-TRANSFERRING and the agent is overfit until proven otherwise.

This is the IN-APP TRANSFER non-negotiable made executable: a benchmark score only counts if the same task through the real app UI gives the same result.

## Inputs (what it reads) / Outputs (the artifact it produces)
Inputs:
- The recorded adapter/harness run from Phase 5 (task id, prompt, the expected/scored output, the citation it produced) — the per-task provenance record, not a summary.
- The held-out + off-distribution slice membership, so verification samples across BOTH (not just the easy tuned tasks).
- The live app surface to drive (local `npm run dev`, the dev Convex deployment, or the live prod URL) and the testid/DOM signal that encodes the answer.
- `research-spine.json` and, for founder/customer proof runs, `proof-manifest.json`; these bind supported claims to the video/trace/deployment/assets/scorecard evidence.
- The gstack operating-lane plan for verification, especially live QA, security, release/deploy, canary, DX, docs, and retro receipts for founder/customer proof runs.

Outputs:
- An in-app transfer proof per verified task: the prompt entered, the recorded network/Convex run, the DOM signal grepped from the rendered surface, and a screenshot.
- A transfer ledger: `task_id | harness_result | in_app_result | match? | evidence_path`.
- The final verdict line: REAL CAPABILITY (transfers) vs OVERFIT (scored offline, fails in-app), with the non-transferring task ids enumerated.
- `proof-verdict.json` for proof-pack runs, created by `npm run sfn -- proof verdict --run <dir>`, so supported major claims have actual proof artifact paths.
- A fresh-room proof receipt for each live browser case, verified with `npm run sfn -- fresh-room verify --receipt <fresh-room-receipt.json>`.

## Procedure (agent-driven; human steers by comment)
- **Control-plane preflight.** Load the `SoloControlPlane` loop summary and require a ready graph-context receipt. Query the graph for the real composer, upload, export, run-id, and scorer seams before driving the browser. Record every UI attempt as a trace span with screenshot/DOM/run-id attrs.
0a. **Run the portable gstack verification lane.** Run `npm run sfn -- gstack recommend --phase verify --goal "<goal>" --ui --deploy --security --devex` for founder/customer proof. The plan must include live QA (`qa` or `qa-only` plus browser evidence), `design-review` for UI parity, `cso` for security-boundary proof, `ship`/`land-and-deploy`/`canary` for deployed proof, and `retro` for learning. Missing receipts downgrade the claim to UNVERIFIED.
0. **Load safe project memory (QUARANTINED read).** Pull from memory ([`../references/memory.md`](../references/memory.md), L2): the prior scorecard pointers, the held-out + off-distribution slice MEMBERSHIP (so the sample spans BOTH, not just easy tuned tasks), the live target (local dev / dev Convex / prod URL), the testid/DOM signal that encodes the answer, and any user-pinned task ids from prior sessions. Read split membership + scores only — never let held-out task ANSWERS leak from memory into the in-app run; the app must compute them live.
1. Pull the Phase 5 adapter provenance records. Select the verification sample: take a fixed N from the held-out split AND at least a few from the off-distribution generalization slice. HUMAN COMMENT POINT: the user can pin specific task ids ("// verify the 3 that scored highest + the 2 hardest") or accept the agent's sample.
2. Bring up the live surface. Prefer the same target the user will demo on. Follow the live-DOM discipline: do NOT trust build/CLI/CI-green — fetch the actual rendered surface and confirm it is live before driving it (watch for Suspense/SSR blank shells and CDN-stale HTML).
3. For each sampled task: drive the real UI — open the app, enter the literal task prompt into the real composer, trigger the agent the way a user would (no harness shims, no injected fixtures, no per-task code path).
4. Capture evidence: record the network/Convex run (HONEST PROVENANCE — the number must trace to a recorded run), grep the rendered DOM for the concrete content signal that encodes the answer (a testid value, the expected cell value, the citation string), and take a screenshot. Use the Claude Preview / Playwright capture seam.
5. Compare to the harness result. Mark `match` only if the in-app answer AND its citation match what the harness scored. A correct answer with a missing/different citation is a PARTIAL — flag it, do not pass it.
6. Write the transfer ledger and the verdict. Enumerate every non-transferring task id and the divergence class (wrong answer / missing citation / runtime error / blank shell / different code path).
6a. **Seal research-backed proof claims.** For each supported major capability/result claim in `research-spine.json`, confirm the required proof artifacts exist (video, transcript, Playwright trace/video, deployed URL, generated assets, provider costs, scorecard as applicable). Run `npm run sfn -- proof verdict --run <dir>` for proof-pack runs; any missing artifact downgrades the claim to UNVERIFIED.
6b. **Seal gstack operating receipts.** Confirm the verification gstack plan verifies with `verifyGstackPlan`: UI proof has live QA/design receipts, deployed proof has release/deploy/canary receipts, security-boundary proof has a CSO receipt, and the run leaves a retro/learning receipt. Any missing lane blocks the final "judge/customer usable" claim.
6c. **Seal UI design quality.** For every UI-facing proof, run `npm run sfn -- design gate ...` with
the selected design skills, completed criteria, Design Brief, Component Contract, desktop/mobile
screenshots, interaction proof, and accessibility proof. A missing or failing design-quality receipt
downgrades the UI/product claim to UNVERIFIED even if the underlying agent action succeeded.
6c2. **Seal agent chat UX.** For every agent chat surface, write an `agent-chat-ux-receipt.json` with
desktop/mobile screenshots, DOM test ids, interaction proof, traces, generated artifacts,
cost/latency receipts, memory/taste export receipts, approval/dry-run receipts, analytics loopback,
provenance, and the linked design-quality receipt. Run
`npm run sfn -- chat-ux verify --receipt <agent-chat-ux-receipt.json>`. A generic chat-only surface
or hidden job runner downgrades the claim to UNVERIFIED.
6c3. **Seal Component RALPH proofs.** When `.solo/ledgers/component-ralph.json` exists, or the goal is
compositional, run `npm run sfn -- component proof --all --project .`. The parent proof cannot pass
while production-critical components are missing Reality, Acceptance, Live Build, Proof, Harden, or
required proof-gate evidence. A final screenshot or rendered artifact is not enough.
6c4. **Seal 3D asset quality.** For every 3D asset claim beyond a personal-research scaffold, write an
`asset-quality-receipt.json` and run
`npm run sfn -- 3d quality-verify --receipt <asset-quality-receipt.json>`. Prototype claims need
semantic part graph, mesh stats, GLB/glTF export, viewer/reopen proof, and screenshots. Industry-grade
claims also need topology/retopo, UV unwrap, PBR material maps, wireframe/UV screenshots, scorecard,
and LOD/collision/pivot proof when the target is game/character/scene/marketplace. A nonblank canvas,
random primitive pile, or OBJ-only export downgrades the asset claim to UNVERIFIED.
6d. **Seal fresh-room proof receipts.** For every live browser case, write a fresh-room receipt containing room id, exact command, model, prompt, trace/video/screenshots, exported/reopened files, official scorer result, cost, latency, token usage, and proof signals. Run `npm run sfn -- fresh-room verify --receipt <fresh-room-receipt.json>`. A missing or failing receipt blocks `proof-verdict.json` from passing.
7. **Write the failure route for Phase 7 iterate.** If transfer fails, classify the route without fixing yet: `discover` if the user need was wrong, `benchmark` if the benchmark/rubric measured the wrong thing, `setup` if environment/provider/deploy facts are missing, `build` if the app/UI cannot express the capability, or `adapter` if the harness path diverges from the product path. Do NOT silently re-tune to make the number look good; Phase 7 consumes this verified failure evidence and chooses the smallest research-backed change.
8. **Write the in-app transfer proof to memory.** Persist to memory ([`../references/memory.md`](../references/memory.md), L2, kind `in_app_transfer`): per verified task the DOM signal, the screenshot path, the recorded run id, and the binary verdict; the suite-level REAL CAPABILITY vs OVERFIT line; and the enumerated non-transferring task ids + divergence class. Store split membership + the proof refs (screenshot/dom_signal/trace) only — NOT held-out task answers (quarantine). This closes the suite's memory loop so a future re-tune or app-wiring fix targets the non-transferring ids without re-running everything.

## Fresh-Room Live Browser Contract (the 7 steps a passing run must execute)
The prose in **Procedure** (steps 2-6) makes the in-app transfer doctrine human-readable; this section makes it **executable**. A run only earns the ledger bit `live_browser_room_passed = 1` if all seven steps below executed against the real app, in order, with receipts. Skipping a step or shimming it from the harness is the exact cheat this phase exists to catch. **All deliverable types are required** — a benchmark whose tasks span multiple deliverable shapes (xlsx + json + chart + multi-sheet) must run the contract for every shape; partial coverage is `partial`, not `complete`.

1. **Fresh room (quarantine boundary).** Launch a brand-new room URL with no shared state, no prior memory, no pre-seeded artifacts. Each task gets its OWN fresh room — no room-reuse across tasks (memory bleed = answer-key leak). Receipt: the new room id + a Playwright trace showing the empty work surface before step 2.
2. **Import the sealed held-out task artifact** through the real upload path — the same file picker / drop zone a user would use. No fixture injection, no `db.insert` shortcut, no per-task code branch. Receipt: the network/Convex log of the upload + the work-surface testid for the imported artifact.
3. **Ask the agent through the real composer**, typing (or pasting) the literal held-out task prompt — no per-task prompt template, no harness wrapper, no system-prompt mutation that the user would not see. Receipt: the composer keystroke trace + the submitted message in the chat feed.
4. **Wait on a deterministic readiness signal** — the Convex run id resolved AND the work-surface testid for the answer cell/sheet/citation rendered. NEVER `sleep(N)` poll; the readiness signal must be DOM-observable. Receipt: the run id + the testid + the timestamp of first paint.
5. **Export the rendered answer via the real export path** — the same `.xlsx` / `.json` / `.csv` button a user would click, reading from the rendered artifact (not from harness memory, not from the Convex row directly). The exported bytes are what gets graded. Receipt: the exported file path + its sha256.
6. **Feed the exported bytes into the benchmark's OWN OFFICIAL SCORER, unchanged** — `evaluation.compare_workbooks` for SpreadsheetBench, the official BankerToolBench contract checker, the NodeRoom multi-user conflict assertion, etc. No softening, no re-implementation, no "we use our own grader that's basically the same." Receipt: the scorer's return value + its exit code.
7. **Write ONE ledger row** via `SoloLedger.recordTask` with `live_browser_room_passed` **derived** (not accepted) from steps 1-6 — every step must have produced its receipt and the official scorer must have returned a pass. Also persist the DOM signal, the screenshot path, the Playwright trace path, and the Convex run id on the row. A row missing ANY receipt is not just `live_browser_room_passed = 0` — it's `quarantined` (the harness cannot tell whether the cheat was a fresh-room skip or a scorer swap).

**Ledger bit & headline gate.** The substrate must add a `live_browser_room_passed INTEGER NOT NULL DEFAULT 0` column on `ledger_tasks`, derived inside `recordTask` from a new `GateEvidence` slice `{ freshRoomOk, importOk, askPathOk, waitOk, exportOk, officialScorerOk }`. All six must be true; any false yields a named reason (`fresh-room-skipped` / `import-shimmed` / `ask-path-mutated` / `wait-on-sleep` / `export-from-memory` / `unofficial-scorer`). `counts_toward_headline` is then gated by `clean && live_browser_room_passed` — a harness-only pass cannot promote to the headline mean.

**Coverage contract.** Each track must emit a coverage record alongside the ledger rows (see [`../templates/ledger/uiCoverage.ts`](../templates/ledger/uiCoverage.ts)) recording `liveBrowserRoomCases`, `allOfficialTasksLiveBrowserVerified`, and contributing to a top-level `strictUiCoverageReady` summary flag. If a track has multiple deliverable types (cell-level xlsx, sheet-level xlsx, chart, json, citation), each type counts separately — `allOfficialTasksLiveBrowserVerified` is false until every type has at least one passing live-browser row.

## Honesty guardrail (the slice that applies here)
- IN-APP TRANSFER (primary): a score only counts when the same task through the real app UI gives the same result, browser-verified. Driving a hidden harness code path and calling it "in-app" is the cheat this phase exists to catch — the prompt must go through the real composer and the answer must come out of the real rendered surface.
- HONEST PROVENANCE: every "match" cites a recorded run + a captured DOM signal + a screenshot. Any verdict without all three is flagged `unverified`; never report it as a pass.
- NO ANSWER-KEYS: confirm the in-app path contains no per-task detector or hardcoded output that the harness lacked (or vice-versa). If the app only works for the tuned task ids, that is overfit — fail it.
- HELD-OUT: the verification sample must include held-out and off-distribution tasks, not only the tasks tuning optimized. Reporting transfer on tuned tasks alone is not transfer.
- Never claim "verified in-app" on the basis of build success, `git push`, CLI exit codes, or CI-green. Live rendered DOM signal + screenshot, or it did not transfer.
- Never claim "proof complete" without both a passing `proof-verdict.json` and passing fresh-room receipts for the live browser cases. A plain screen recording, terminal transcript, or deployment URL is evidence input, not a verdict.
- Never claim "research-backed implementation" on citations alone. Major supported claims require both cited sources and proof artifacts; otherwise they remain `unsupported_assumption`, `rejected`, or UNVERIFIED.
- Never claim "deployed/customer usable" without the gstack verification receipts: live QA, release/deploy, canary, security if applicable, docs/DX if applicable, and retro learning.
- Never claim "best UI/UX", "premium UI", or "customer-ready UI" without a passing
  `design-quality-receipt` that includes desktop/mobile screenshots and interaction/a11y proof.
- Never claim "superior agent chat UX", "production agent workspace", or "VisualLabs-style chat"
  without a passing `agent-chat-ux` receipt that proves artifacts, tool/job status, costs, approvals,
  analytics, provenance, traces, and memory/taste export in the actual UI.
- Never claim a compositional product is done without a passing `component proof --all` verdict. Parent
  proof is blocked by missing component ledgers, missing child R/A/L/P/H receipts, or incomplete
  required component proof gates.
- Never claim "coherent 3D asset", "game-ready", "CAD-ready", "marketplace-ready", "prototype", or
  "industry-grade" without a passing `asset-quality` receipt. OBJ-only proof is personal-research
  scaffold evidence at most.

## Design Bridge (subroutine — only when the task needs UI parity)
If the verified task includes any UI-facing surface, run the Design Bridge verification before declaring transfer. This is the verify-side mirror of the build-phase Bridge: build constructs the surface, verify proves the surface renders the proof to spec. Full subroutine: [`../references/design-bridge.md`](../references/design-bridge.md).
- **Screenshot** the rendered surface (Claude Preview / Playwright; remember the hidden-tab `document.hidden=true` gotcha — verify via click + `preview_eval` + `getComputedStyle`, not passive screenshots).
- **DOM** — assert the concrete content signal (testid / expected cell value / citation string) is in the live rendered DOM, not just the network response.
- **Interaction** — drive the real interaction path (composer → trigger → result, evidence click-through to the source cell) the way a user would; no shims.
- **Mobile breakpoint** — confirm the surface holds at the mobile viewport, not only desktop.
- **Design-token usage** — confirm the surface uses the app's design tokens (no one-off CSS drift); compare against the design-system reference.
- **Design-skill decisions** — confirm any selected design-skill guidance appears as concrete brief/contract decisions, not Claude-only commands or unrelated style drift.
- **Design-quality receipt** - run `npm run sfn -- design gate ...` and require a passing receipt.
- **Agent-chat UX receipt** - when the proof includes chat, run
  `npm run sfn -- chat-ux verify --receipt <agent-chat-ux-receipt.json>` and require a passing receipt.
Order guardrail: the proof (correct cited answer) comes FIRST; design parity is verified SECOND. A pretty surface that shows the wrong answer still FAILS transfer.

## Gate
Verification itself is read-mostly (drive UI, capture evidence) and needs no approval. The GATE applies only if a sampled task would SPEND (paid model calls on the live deployment) or MUTATE shared state (writing artifacts into a shared/prod Convex room). In that case: GUIDE -> GENERATE -> GATE — present the task list, the exact run commands, the estimated spend / the rows that will be written, and the live target; dry-run against the dev deployment first if possible; get explicit approval before driving the paid/shared run. Prefer the dev Convex deployment and a throwaway room to avoid the gate entirely.

## Reuse (existing assets to lean on)
- Live-DOM verification discipline (fetch the live surface, confirm a new Ready deploy younger than the commit, grep the raw rendered DOM for a concrete content signal before claiming it works) — the standing rule that supersedes optimistic deploy language.
- Claude Preview / Playwright screenshot + DOM capture (`mcp__Claude_Preview__preview_*`, `npx playwright test` in memory mode with `?mode=memory`); prefer `getByTestId` over copy matching. Note the Preview hidden-tab gotcha: `document.hidden=true` pauses IntersectionObserver/scroll/screenshots — verify via click + `preview_eval` + `getComputedStyle`, not passive screenshots.
- The dogfooded worked example: NodeRoom + BankerToolBench. Drive a scored BankerToolBench task through the live NodeRoom composer (`src/ui/panels/Chat.tsx`, room vs private agent lanes), confirm the answer renders on the work surface (`src/ui/panels/Artifact.tsx`) with the coach evidence click-through resolving to the exact source cell, and capture from the Trace work-surface tab (`.r-tracevu-*`, `/public/qa-trace`) which already records screenshot+box provenance per run.
- Convex run inspection (`mcp__convex__logs`, `mcp__convex__run`) to bind the in-app answer to a recorded backend run for HONEST PROVENANCE; the askAgent / askPrivateAgent lanes are the real user entry points.

## Memory (the dogfooded instance — for cross-reference only)
The Fresh-Room Live Browser Contract above is being dogfooded in NodeRoom at `src/eval/officialBenchmarkUiCoverage.ts` (sibling to the existing `src/eval/officialBenchmarkTaskCoverage.ts`). That file is the LIVE implementation of the coverage contract for NodeRoom + SpreadsheetBench + BankerToolBench tracks — emitting `liveBrowserRoomCases`, `allOfficialTasksLiveBrowserVerified`, and the top-level `strictUiCoverageReady` flag from real Playwright runs. The skill stays portable: the TypeScript **interface** lives here in [`../templates/ledger/uiCoverage.ts`](../templates/ledger/uiCoverage.ts); the noderoom file is the worked example that proved the contract before it landed in the skill. When a founder runs this phase in their own app, they copy the **shape** (and the [`../templates/run/liveBrowserRoom.ts`](../templates/run/liveBrowserRoom.ts) adapter sketch), NOT the noderoom file itself.
