# Solo Founder Nodes Phase 1 — Discover (capability spec)

## What this phase does
Turns a vague idea / running prototype / half-built app into a written, falsifiable **capability spec** before any benchmark is chosen or any code is touched. The coding agent acts as an analyst: it reads what actually exists (not what the user says exists), searches the domain to learn the real deliverables a competent operator would produce, and writes down what the agent should DO and for WHOM. It explicitly separates *observed* (grounded in code/UI/web) from *assumed* (the user deferred or never said). The human reads the draft and comments to correct scope and vision. Nothing is installed, spent, or mutated.

## Inputs (what it reads) / Outputs (the artifact it produces)
**Reads:**
- The repo: entry points, routes/pages, the UI surfaces a real user touches, any existing agent/tool harness (system prompts, tool definitions, eval scripts), data model/schema, README/docs.
- The live UI if runnable (read-only: click through the real user flow, note what the agent can and cannot reach).
- The web: the domain's real workflows, what end-users actually need, what "done" looks like for a competent human, and any public benchmark whose tasks resemble this domain (named here only as candidates — selection is a later phase).
- Any steering comments the user has already left.

**Produces:** `capability-spec.md` at the repo root (or `docs/solo-founder-nodes/capability-spec.md` if a `docs/` tree exists). Sections, in order:
1. **One-line agent mission** — "The agent does X for Y so they can Z."
2. **End-users / personas** — who invokes it, their goal, their definition of done.
3. **Real deliverables** — the concrete artifacts the agent must produce (a filled spreadsheet, a memo, a corrected cell, a routed decision), each tied to a user goal — not capabilities in the abstract.
4. **Observed surfaces & harness** — what the app/agent can actually do today, with file paths and UI locations as evidence.
5. **Domain workflow** — from web research, how a competent human does this; cite sources.
6. **Candidate benchmark families** — public benchmarks whose tasks resemble these deliverables (candidates only; defer selection).
7. **Assumptions & deferrals** — every place the user did not specify, stated as an explicit assumption the human can overturn in one comment.
8. **Open questions for the human** — the ≤5 decisions that would most change the spec.

## Procedure (agent-driven; human steers by comment)
1. **Map the repo.** Locate entry points, routes/pages, schema, and any existing agent harness (system prompts, tool defs, eval/bench scripts). Record exact paths. Do not summarize from the README alone — verify against code.
2. **Walk the live UI** (if runnable). Click the real user flow read-only; note which deliverables the UI actually supports and where the agent plugs in. If not runnable, say so and mark UI claims unverified.
3. **Research the domain.** Web-search the real workflows and end-user needs; learn what "done" means to a competent operator. Note 2–4 candidate public benchmarks that resemble the deliverables.
4. **Draft `capability-spec.md`** with the eight sections above. Tag each claim `observed` (cite path/URL) or `assumed`. Keep deliverables concrete and user-tied, never abstract capabilities.
5. **Surface the deferrals** as explicit assumptions plus ≤5 open questions — the smallest set whose answers would most change scope.
6. **Hand to the human for comment.** The human edits scope/vision/personas inline or in a comment. The agent revises the spec to match; it does not defend its draft. Re-tag anything the human changed from `assumed` to `observed`/decided.
7. **Stop here.** No benchmark selection, no install, no code change — those are later phases. Emit the path to `capability-spec.md` and the open-questions list.

## Honesty guardrail (the slice that applies here)
This phase sets up the later guardrails, so it must not contaminate them:
- **HONEST PROVENANCE applies now:** every claim in the spec is tagged `observed` (with a path or URL) or `assumed`. No invented capabilities, no "the agent can X" without a code/UI citation. Unverified UI walk = flagged unverified.
- **No answer-keys, early:** do NOT enumerate specific benchmark task IDs, expected outputs, or per-task hints. Candidate benchmark *families* only — naming exact tasks here would seed tuning-on-the-test later.
- **Held-out, early:** note that whatever benchmark is later chosen must keep a held-out split + an off-distribution slice; do not let the spec quietly assume the agent will be tuned on the same tasks it is scored on.
- **In-app transfer, early:** every deliverable in the spec is written as something verifiable through the real app UI, not only through a script — so a later score can be browser-verified against this spec.

## Gate
None. This phase is read-only: code reading, UI walking, and web search only. No Docker/HF/Harbor, no API spend, no codebase mutation. (The first GUIDE → GENERATE → GATE approval appears in a later, heavier phase.)

## Reuse (existing assets to lean on)
- **Dogfooded worked example — NodeRoom + BankerToolBench.** Read the agent harness under `src/nodeagent/` (models in `src/nodeagent/models/modelCatalog.ts`, capture loop in `src/nodeagent/capture/`), the Convex ledger schema in `convex/schema.ts`, and the live UI surfaces in `src/ui/panels/` (e.g. `Artifact.tsx`, `TraceSurface.tsx`). The frozen product wedge lives in `docs/WEDGE.md`; the architecture in `docs/ARCHITECTURE.md`; the BankerToolBench eval contract in `docs/eval/bankertoolbench-official-contract.json` and `docs/eval/BANKERTOOLBENCH_LOOP_ITERATIONS.md`. These show what a finished capability spec maps onto: real deliverables (a banker's filled artifact), real end-users (the three personas in `docs/eval/three-user-shots/`), and an existing harness to ground "observed" claims.
- **Code-reading + web-search only** — no heavy tooling. Use the repo's own docs tree (`docs/`) as the home for `capability-spec.md` when present.
