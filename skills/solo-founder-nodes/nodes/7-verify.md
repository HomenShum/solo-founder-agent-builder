# Solo Founder Nodes — Phase 8: In-App Transfer Verification

## What this phase does
Closes the loop between an OFFLINE harness score and a REAL user outcome. The harness scored the agent on a task in a controlled rig; this phase drives the SAME task through the live app UI exactly as a user would, then verifies — with a concrete DOM signal and a screenshot — that the app shows the same correct, cited answer. The deliverable is browser-grounded proof plus a binary verdict. If the in-app run diverges from the harness (different answer, missing citation, error, blank shell), the harness number is declared NON-TRANSFERRING and the agent is overfit until proven otherwise.

This is the IN-APP TRANSFER non-negotiable made executable: a benchmark score only counts if the same task through the real app UI gives the same result.

## Inputs (what it reads) / Outputs (the artifact it produces)
Inputs:
- The recorded harness run from Phase 7 scoring (task id, prompt, the expected/scored output, the citation it produced) — the per-task provenance record, not a summary.
- The held-out + off-distribution slice membership, so verification samples across BOTH (not just the easy tuned tasks).
- The live app surface to drive (local `npm run dev`, the dev Convex deployment, or the live prod URL) and the testid/DOM signal that encodes the answer.

Outputs:
- An in-app transfer proof per verified task: the prompt entered, the recorded network/Convex run, the DOM signal grepped from the rendered surface, and a screenshot.
- A transfer ledger: `task_id | harness_result | in_app_result | match? | evidence_path`.
- The final verdict line: REAL CAPABILITY (transfers) vs OVERFIT (scored offline, fails in-app), with the non-transferring task ids enumerated.

## Procedure (agent-driven; human steers by comment)
1. Pull the Phase 7 provenance records. Select the verification sample: take a fixed N from the held-out split AND at least a few from the off-distribution generalization slice. HUMAN COMMENT POINT: the user can pin specific task ids ("// verify the 3 that scored highest + the 2 hardest") or accept the agent's sample.
2. Bring up the live surface. Prefer the same target the user will demo on. Follow the live-DOM discipline: do NOT trust build/CLI/CI-green — fetch the actual rendered surface and confirm it is live before driving it (watch for Suspense/SSR blank shells and CDN-stale HTML).
3. For each sampled task: drive the real UI — open the app, enter the literal task prompt into the real composer, trigger the agent the way a user would (no harness shims, no injected fixtures, no per-task code path).
4. Capture evidence: record the network/Convex run (HONEST PROVENANCE — the number must trace to a recorded run), grep the rendered DOM for the concrete content signal that encodes the answer (a testid value, the expected cell value, the citation string), and take a screenshot. Use the Claude Preview / Playwright capture seam.
5. Compare to the harness result. Mark `match` only if the in-app answer AND its citation match what the harness scored. A correct answer with a missing/different citation is a PARTIAL — flag it, do not pass it.
6. Write the transfer ledger and the verdict. Enumerate every non-transferring task id and the divergence class (wrong answer / missing citation / runtime error / blank shell / different code path).
7. HUMAN COMMENT POINT: if transfer fails, the user steers the next move by comment — loop back to Phase 7 (the harness was measuring something the app does not do), or back to the app wiring (the capability exists but the UI path is broken). Do NOT silently re-tune to make the number look good.

## Honesty guardrail (the slice that applies here)
- IN-APP TRANSFER (primary): a score only counts when the same task through the real app UI gives the same result, browser-verified. Driving a hidden harness code path and calling it "in-app" is the cheat this phase exists to catch — the prompt must go through the real composer and the answer must come out of the real rendered surface.
- HONEST PROVENANCE: every "match" cites a recorded run + a captured DOM signal + a screenshot. Any verdict without all three is flagged `unverified`; never report it as a pass.
- NO ANSWER-KEYS: confirm the in-app path contains no per-task detector or hardcoded output that the harness lacked (or vice-versa). If the app only works for the tuned task ids, that is overfit — fail it.
- HELD-OUT: the verification sample must include held-out and off-distribution tasks, not only the tasks tuning optimized. Reporting transfer on tuned tasks alone is not transfer.
- Never claim "verified in-app" on the basis of build success, `git push`, CLI exit codes, or CI-green. Live rendered DOM signal + screenshot, or it did not transfer.

## Gate
Verification itself is read-mostly (drive UI, capture evidence) and needs no approval. The GATE applies only if a sampled task would SPEND (paid model calls on the live deployment) or MUTATE shared state (writing artifacts into a shared/prod Convex room). In that case: GUIDE -> GENERATE -> GATE — present the task list, the exact run commands, the estimated spend / the rows that will be written, and the live target; dry-run against the dev deployment first if possible; get explicit approval before driving the paid/shared run. Prefer the dev Convex deployment and a throwaway room to avoid the gate entirely.

## Reuse (existing assets to lean on)
- Live-DOM verification discipline (fetch the live surface, confirm a new Ready deploy younger than the commit, grep the raw rendered DOM for a concrete content signal before claiming it works) — the standing rule that supersedes optimistic deploy language.
- Claude Preview / Playwright screenshot + DOM capture (`mcp__Claude_Preview__preview_*`, `npx playwright test` in memory mode with `?mode=memory`); prefer `getByTestId` over copy matching. Note the Preview hidden-tab gotcha: `document.hidden=true` pauses IntersectionObserver/scroll/screenshots — verify via click + `preview_eval` + `getComputedStyle`, not passive screenshots.
- The dogfooded worked example: NodeRoom + BankerToolBench. Drive a scored BankerToolBench task through the live NodeRoom composer (`src/ui/panels/Chat.tsx`, room vs private agent lanes), confirm the answer renders on the work surface (`src/ui/panels/Artifact.tsx`) with the coach evidence click-through resolving to the exact source cell, and capture from the Trace work-surface tab (`.r-tracevu-*`, `/public/qa-trace`) which already records screenshot+box provenance per run.
- Convex run inspection (`mcp__convex__logs`, `mcp__convex__run`) to bind the in-app answer to a recorded backend run for HONEST PROVENANCE; the askAgent / askPrivateAgent lanes are the real user entry points.
