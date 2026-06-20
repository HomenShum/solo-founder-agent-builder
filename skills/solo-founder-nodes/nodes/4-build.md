# build — Build the agent and the UI it needs

## What this phase does
Turns the gap report from the prior phase into running code, on the user's actual stack. Two halves, both required: (1) the **agent layer** — a harness loop, the tool implementations the benchmark task needs, and model routing; (2) the **app layer** — the UI/UX components that let a real user trigger the task and watch the agent work (input surface, streaming trace, result artifact, approval/review controls). A benchmark score is meaningless if the same task cannot be run through the live UI, so the UI is in scope, not an afterthought. Per-stack TEMPLATES only — start from the stacks you know; a universal generator is explicitly a NON-GOAL.

## Inputs (what it reads) / Outputs (the artifact it produces)
- **Inputs:** the chosen benchmark + task contract (from solo-founder-nodes's benchmark-selection phase); the gap report (what the app/agent cannot yet do); the target stack and its conventions; existing harness/tool code to extend; the human's architecture comments.
- **Outputs:** a proposed **diff** (new/changed files for the agent layer + UI layer), plus a short build note listing what was added, which tool stubs are still TODO, and how to invoke the task both programmatically and through the UI. Nothing is committed before the Gate.

## Procedure (agent-driven; human steers by comment)
1. **Pick the stack template.** Detect the stack (Convex/React, Next.js, Streamlit, …) and announce which template you're applying. If unknown, say so and propose the closest one — do NOT invent a universal abstraction.
2. **Map task → capabilities.** For each benchmark task, list the tools the agent must call, the model route(s), and the UI surfaces a human needs to run it and see the result. Present this map; **the human comments here to steer architecture** (e.g. "reuse the existing tool registry, don't fork it", "route long-context to X").
3. **Scaffold the agent layer.** Harness loop (observe → plan → act → extract), tool implementations (real, not answer-keys), model routing. Reuse the existing harness shape; extend the registry rather than forking.
4. **Scaffold the app layer.** The input surface, a streaming trace/observability view, the result artifact, and any approval/review controls — using the app's real components so the task runs end-to-end in the live UI.
5. **Wire the seam.** Connect UI trigger → harness → tools → artifact, so one user action drives the whole loop and surfaces its output on screen.
6. **Present the diff for the Gate** (below). After approval, apply it, then leave a build note with the two invocation paths (programmatic + UI) and the remaining TODO tool stubs.
7. **Hand off** to the run/verify phase — do NOT self-certify that it works; in-app browser verification belongs to the next phase.

## Honesty guardrail (the slice that applies here)
- **NO ANSWER-KEYS:** tools must do real work. No per-task detectors, hardcoded outputs, or branches keyed on a known task id. If a change only makes the tuned tasks pass, revert it.
- **IN-APP TRANSFER (built-in here):** build the UI surface in the SAME action as the agent layer so the task is runnable through the real app — a harness that only passes via a private script is not done. (The actual browser-verification proof is the next phase's job; here you just make it possible.)
- **HONEST PROVENANCE:** the build note must mark every tool stub that is still a placeholder as TODO/unverified — never describe a stub as working.
- **HELD-OUT:** do not peek at the held-out or off-distribution task contents while building; build to the task *shape*, not to specific held-out answers.

## Gate (heavy/irreversible — explicit approval required)
Mutating the codebase is GUIDE → GENERATE → GATE. Present the full proposed **diff** (files added/changed, new deps, any schema/migration changes), call out anything irreversible (schema migration, new external dependency, API-key wiring), and dry-run/typecheck if possible. **Wait for explicit approval before applying the diff or committing.** If new deps or paid API keys are involved, include the install commands and the key-acquisition links and gate those separately.

## Reuse (existing assets to lean on)
- **Reference shape — NodeRoom's `src/nodeagent/`:** use this as the canonical agent-layer template (harness loop, tools, model routing). Model routing lives in `src/nodeagent/models/modelCatalog.ts`; the live observe/act/extract capture loop in `src/nodeagent/capture/` shows the harness + provenance pattern. Extend the existing tool registry rather than forking it.
- **App-layer references (NodeRoom):** input/composer + streaming trace surfaces in `src/ui/panels/` (e.g. `TraceSurface.tsx`, `traceData.ts`, `Artifact.tsx`) for the result artifact and observability view; Convex functions in `convex/` (e.g. `artifacts.ts`) as the server seam between UI trigger and harness.
- **Worked example:** NodeRoom + BankerToolBench — the BankerToolBench task contract drives which tools/UI to scaffold; the agent layer extends `src/nodeagent`, the UI extends the `src/ui/panels` surfaces, and the Convex layer is the trigger→harness→artifact seam.
