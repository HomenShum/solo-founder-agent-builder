# Solo Founder Nodes — Adapter (wire the REAL agent to the harness)

## What this phase does
Builds the thin adaptation layer between the benchmark harness's agent contract (e.g. Harbor's `BaseAgent`) and your app's actual runner — so the SAME agent that serves users in the app is what executes benchmark tasks. The adapter is glue, not intelligence: it translates the harness's task/environment into a call to your real runner, routes the model, captures outputs, and writes deliverables back into the harness's expected paths. It does NOT add task-specific cleverness. The whole point of Solo Founder Nodes is to measure the general agent; an adapter that quietly solves tasks the runner can't is the failure mode this phase exists to prevent.

## Inputs (what it reads)
- The chosen benchmark + harness contract from the prior phase (the `BaseAgent` interface, env/rollout signature, expected output directory layout, scoring expectations).
- Your app's real agent runner entrypoint (CLI, module, or HTTP endpoint) — the same one the live UI drives.
- Model routing config: the `model_id` you want to evaluate (e.g. an `openrouter/…` or `inference.ai` slug) and how to pass it to the runner.
- Worked example to copy from: `btb_noderoom_agent/harbor_adapter.py` (NodeRoom's Harbor `BaseAgent` subclass `NodeRoomNodeAgent`, which shells the app's runner via `subprocess` and routes the model through a `model_id` arg).

## Outputs (the artifact it produces)
- An adapter module (e.g. `btb_<app>_agent/harbor_adapter.py`) exposing the harness's agent class, with:
  - a `run`/`rollout` method that invokes the real runner and surfaces its outputs/citations into the harness paths;
  - a `model_id` constructor arg + env override for model routing;
  - a `materializer_mode` switch with at least two values — full pipeline and **general-only** (materializers OFF) — recorded into the run (NodeRoom writes `materializer_mode.json` with `replayMaterializersEnabled`).
- A one-line smoke invocation (single task, dry-run-able) proving the adapter reaches the real runner.

## Procedure (agent-driven; human steers by comment)
1. **Read the contract.** Open the harness's `BaseAgent` (or equivalent) and the prior phase's notes. Identify the exact method signature, the env/task object, and where deliverables must be written.
2. **Locate the real runner.** Find the app's actual agent entrypoint — the one the live UI calls. Confirm it accepts a task prompt + a model id. If it doesn't, add a thin headless entry that reuses the same code path (do not fork the agent logic).
3. **Subclass the agent contract.** Mirror `NodeRoomNodeAgent`: constructor takes `model_id` (with `os.environ` override) and `materializer_mode` validated to a small enum (e.g. `{"replay", "general-only"}`). Reject unknown modes loudly.
4. **Implement `run`/`rollout` as pure glue.** Build the prompt from the harness task, `subprocess.run` (or HTTP) the real runner with the routed `model_id`, capture stdout/stderr to the logs dir, then map the runner's outputs into the harness's expected output directory.
5. **Wire the materializers-OFF switch.** Any output-shaping step (Office/PDF deliverable writers, citation receipt builders) must be gated by `materializer_mode`. In **general-only** the adapter writes ONLY what the general agent produced — no replay packagers. Record the mode into the run artifact.
6. **Smoke one task.** Run a single task through the adapter (dry-run if the harness supports it) and confirm: the real runner was invoked (check captured stdout), the model id propagated, deliverables landed where the harness scores them.
7. **HUMAN COMMENT GATES:** the human steers by leaving comments on (a) the model_id to evaluate, (b) which materializer_mode is the "honest" baseline for this loop, and (c) approving the GATE below before any container/API-cost run. Surface these as explicit questions; do not assume.
8. Hand the wired adapter + smoke result to the next phase (the scoring/loop runner).

## Honesty guardrail (the NO ANSWER-KEYS slice — non-negotiable)
The adapter must route through the real agent and must contain **no per-task detectors and no hardcoded outputs**. Concretely:
- **No `is_<task> → write_<task>_package` dispatch.** This is the exact overfitting Solo Founder Nodes prevents. NodeRoom's own adapter accumulated `write_teaser_package`, `write_comcast_take_private_teaser_package`, `write_coty_trading_comps_package`, … per-task writers — `docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md` flags this dispatch (`harbor_adapter.py:4717`) as the contamination to revert. Treat any such branch as a regression: if a change only lifts the tuned tasks, revert it.
- **Materializers-OFF must exist and be runnable.** The `general-only` mode measures the true general agent with all replay/packaging disabled. The honest baseline number for the loop is the general-only score, and the run artifact (`materializer_mode.json` / `replayMaterializersEnabled: false`) must prove which mode produced it.
- **HONEST PROVENANCE:** the adapter records `model_id` and `materializer_mode` into every run so each number traces back to what actually ran; the unverified is flagged, not assumed.
- The full-materializer mode may exist for the app's product behavior, but it is NEVER the headline benchmark number unless the same task through the real app UI reproduces it (that IN-APP TRANSFER check is enforced in the verification phase, not here).

## Gate (heavy/irreversible — explicit approval required)
GUIDE → GENERATE → GATE before any execution that builds containers, pulls images, or spends API money:
1. **GUIDE:** present the plan — adapter module path, the exact `model_id` to route, the harness build/run command, and whether it pulls a Docker/Harbor image or calls a paid model endpoint. Include the download/API-key link the human needs.
2. **GENERATE:** produce the adapter + the exact one-task smoke command, dry-run first if the harness offers `--dry-run`.
3. **GATE:** require explicit human approval (a comment) before running the container build or any paid model call. The single-task smoke is the cheapest real proof — run it before any full sweep.

## Reuse (existing assets — real paths)
- `btb_noderoom_agent/harbor_adapter.py` — the dogfooded `BaseAgent` adapter to copy: `NodeRoomNodeAgent(model_id=…, materializer_mode=…)`, subprocess to the real runner, `materializer_mode ∈ {replay, general-only}`, `materializer_mode.json` provenance.
- `docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md` — the diagnostic naming the `write_*_package` dispatch as the contamination to revert; read it before touching any materializer.
- `src/eval/bankerToolBenchRunner.ts` — the app-side runner the adapter shells into (same path the live agent uses).
- `scripts/bankertoolbench-nodeagent-smoke-runner.ts` — the single-task smoke pattern to mirror for step 6.
- `docs/eval/BANKERTOOLBENCH_NODEROOM_EXECUTION_PLAN.md` + `docs/eval/BANKERTOOLBENCH_LOOP_ITERATIONS.md` — the worked-example loop this adapter feeds.
