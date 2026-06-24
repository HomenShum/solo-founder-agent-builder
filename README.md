# Solo Founder Agent Builder + Eval Loop Engineering Skill Nodes

**Solo Founder Agent Builder + Eval Loop Engineering Skill Nodes -- an agent skill for one-person companies** (slug `solo-founder-nodes`).

Benchmark-driven development for AI agents: your coding agent builds the agent for your app, then
**proves it actually works in your live app -- without cheating.**

## What it is
One portable skill (`solo-founder-nodes`). Point the coding agent you already use (Claude Code, Codex,
OpenClaw, Hermes, Trae) at the master directive and it runs the loop, reading a phase playbook in
`nodes/` as it goes:

`discover -> benchmark -> setup -> build -> adapter -> iterate -> verify`

Discover + benchmark define *what good is*; setup + build + adapter make it runnable; iterate + verify
make it real.

## Public claim proof
Before reposting launch copy or benchmark claims, read
[`docs/PUBLIC_CLAIM_PROOF.md`](docs/PUBLIC_CLAIM_PROOF.md). The core loop is proofed locally; several
public-facing claims need narrower wording or explicit receipts.

Short version: no receipt, no number.

## The one non-negotiable -- why this exists
A coding agent told to "pass the benchmark" will cheat: hardcode answers, detect-and-template specific
tasks, report a high score with **zero** real capability. NodeRoom has adjacent receipts for this
failure pattern: selected/family-writer BankerToolBench runs around **0.96**, an older
pre-materializer signal around **0.009**, and a current full-100 clean-probe mean of **0.251875**.
Do **not** compress those into the public sentence "0.96 versus 0.008" unless the exact incident
receipt is linked in [`docs/PUBLIC_CLAIM_PROOF.md`](docs/PUBLIC_CLAIM_PROOF.md). Every phase obeys:
- **HELD-OUT** -- never tune on the tasks you score on; keep a held-out split + an off-distribution slice.
- **NO ANSWER-KEYS** -- no per-task detectors or hardcoded outputs; revert any change that only lifts the tuned tasks. The **honest lane** sharpens this: the same task scores three ways -- **model-off** (0 tokens, no real tool-call) is a floor/harness-failure *not* capability; a per-task/family writer firing is a fake answer-key; only **model-in-loop + the generic writer on a held-out task** is real. A change counts only if it raises the held-out clean-probe mean via a reusable tool / context / generic-writer / app-UI affordance ([`references/honest-lane.md`](skills/solo-founder-nodes/references/honest-lane.md)).
- **IN-APP TRANSFER** -- a score counts only if the same task through the real app UI reproduces it (browser-verified).
- **HONEST PROVENANCE** -- every number traces to a recorded run; report the real number even if it is low.

## Serving the models
The benchmark runs need a model server. Use **[Inference.ai](https://inference.ai)** or any
OpenAI-compatible provider your eval policy approves. Configure the harness with a one-line
`base_url` override, no SDK changes:

```
OPENAI_BASE_URL = https://<your-provider-endpoint>/v1   # OpenAI-compatible
OPENAI_API_KEY  = <your provider key>
model           = <approved model id>
```

The public event receipt says The Super Solo: Agent Skills Hack Day was co-hosted by BotLearn,
Inference.ai, and SSG Accelerator. Use "co-hosted with Inference.ai," not "hosted by Inference.ai,"
unless a separate receipt supports that narrower wording.

## Use it with your coding agent
Portable **SKILL.md** -- works with any coding agent. Paste this into your agent, **inside your own project**:

> Fetch Solo Founder Agent Builder + Eval Loop Engineering Skill Nodes from https://github.com/HomenShum/solo-founder-agent-builder (clone it, or read the
> raw files). Then act as the master directive in `skills/solo-founder-nodes/SKILL.md` -> `MASTER_SKILL.md`:
> run benchmark-driven development on THIS project -- discover what my agent should do, recommend a
> benchmark, set it up, build the missing agent + UI, wire the adapter, iterate, and verify it in my live
> app UI -- reading each phase playbook in `skills/solo-founder-nodes/nodes/`. Obey the non-negotiables:
> held-out (never tune on what you score), no answer-keys, in-app transfer (a score counts only if it
> reproduces in my real UI), honest provenance (report the real number). Gate any install / spend / code
> change on my approval, and log each phase: what you did, the result, and what you COULD NOT do.

**Claude Code:** copy `skills/solo-founder-nodes/` into your project's `.claude/skills/` -- it auto-loads
`SKILL.md`. **Codex / OpenClaw / Hermes / Trae / Cursor / Windsurf / other agents:** point them at the
GitHub files and have them follow `SKILL.md` -> `MASTER_SKILL.md` as the playbook, then run
`skills/solo-founder-nodes/conformance/conformance.mjs`. Do not claim an agent is verified until its
probe receipt is recorded.

## Repo layout
- `skills/solo-founder-nodes/` -- `SKILL.md` (loader entry) + `MASTER_SKILL.md` (full directive) + 7 phase playbooks in `nodes/` + `references/` (incl. `honest-lane.md`, `memory.md`, `design-bridge.md`).
- **Design Bridge** -- `references/design-bridge.md` + `templates/design/` -- the UI/UX subroutine the **build** and **verify** phases call so the in-app surface can actually run the benchmark task.
- **Design Skill Bridge** -- `templates/design/designSkillBridge.ts` -- selects portable design guidance across Claude-origin skills, shadcn, GSAP, UI UX Pro Max, Expo, Material 3, and design registries without locking the loop to Claude Code.
- **gstack Bridge** -- `references/gstack-bridge.md` + `templates/gstack/` -- converts `garrytan/gstack` CEO/eng/design/QA/security/release roles into portable operating-review receipts, without requiring a Claude Code runtime.
- **Memory substrate** -- `references/memory.md` + `templates/memory/` -- local-first, audit-safe memory so a resumed session re-hydrates instead of re-deriving.
- **Research Spine** -- `references/research-spine.md` + `templates/research/` -- executable research receipts so each major implementation decision traces user need -> reference -> paper/benchmark -> eval metric -> proof artifact.
- `docs/eval/nonbtb/` -- a runnable deterministic example grader; `docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md` -- the anti-overfit protocol.

## Context + control substrates
The loop now ships the missing self-direction pieces:

- **Context substrate**: inspect `graphify-out/GRAPH_REPORT.md` + `graphify-out/graph.json`, require a ready graph receipt after discover, and query the graph before raw file search.
- **Control plane**: persist loop/phase state, approval pauses, event triggers, budget stops, trace spans, worktree leases, and trace-sourced improvement candidates.

Run `npm run smoke` in `skills/solo-founder-nodes/templates/` to prove these local invariants.

## Research-backed implementation
The loop now gates major architecture and product claims through `research-spine.json`.

- `npm run sfn -- research init --goal "build a 3D model app from pictures" --domain 3d-generation`
- `npm run sfn -- research verify research-spine.json`
- `npm run sfn -- proof init --goal "fresh-user 3D app proof" --domain 3d-generation`
- `npm run sfn -- compare top3d`

The seeded 3D-agent lane points agents toward a realistic v1: provider-backed image/text-to-3D,
Three.js viewer, deployment, persistence, full UI proof, and comparator scoring against Meshy, Tripo,
Rodin/Hyper3D, and Luma. COLMAP/3DGS, CAD-native output, humanoid rigging, and motion tracking remain
stretch lanes until separately proved.

## Portable design skills
The design bridge is now agent-agnostic:

- `npm run sfn -- design registry`
- `npm run sfn -- design recommend --surface dashboard --stack "Next.js shadcn" --runtime codex`
- `npm run sfn -- design recommend --surface marketing-site --style premium --visuals --animation --runtime codex`
- `npm run sfn -- design recommend --surface mobile-app --platform ios --stack SwiftUI --runtime codex`
- `npm run sfn -- design flow --surface 3d-app --category "3D asset generation" --style premium --visuals --animation --shadcn-mcp --runtime codex`
- `npm run sfn -- design flow --surface dashboard --category analytics --stack "Next.js shadcn" --shadcn-mcp --runtime codex`

Claude-labeled skills can still be useful, but only as portable markdown/tooling references. The loop
copies their concrete design decisions into `design-brief.md` and `component-contract.md`; implementation
can run under Codex, Claude Code, Cursor, Windsurf, Copilot, or a generic coding agent. Use
`design flow` when you want the full transcript sequence: classify the surface, break generic defaults,
use component registries where appropriate, arrange dashboard information, run industry-fit palette/font
selection, choose one taste preset, add GSAP/Higgsfield/mobile lanes only when needed, and verify in the
real UI.

## Portable gstack operating lanes
The loop also integrates `garrytan/gstack` as a portable specialist-review model:

- `npm run sfn -- gstack registry`
- `npm run sfn -- gstack recommend --phase discover --goal "3D model app from screenshots"`
- `npm run sfn -- gstack recommend --phase build --goal "3D model app" --ui --security --risk high`
- `npm run sfn -- gstack recommend --phase verify --goal "fresh-user proof" --ui --deploy --security --devex`

These commands make the coding agent produce CEO/product, engineering, design, staff-review, QA,
security, release, canary, docs, and retro receipts before it claims progress. Upstream gstack remains
the inspiration source; Solo Founder Nodes owns the cross-agent gate.

## Memory substrate
The loop **persists** what it learns so a founder resuming the next day does not re-derive it: the
capability spec, the benchmark choice + the **frozen** held-out split **hashes**, scorecards and
per-iteration deltas, the env provenance, and the in-app transfer verdict. It is **local-first and
audit-safe** -- held-out task *contents* never enter persistent memory (only split hashes + aggregate
scores), the memory-side mirror of NO ANSWER-KEYS. Doctrine + the event contract:
[`skills/solo-founder-nodes/references/memory.md`](skills/solo-founder-nodes/references/memory.md);
copyable templates in [`skills/solo-founder-nodes/templates/memory/`](skills/solo-founder-nodes/templates/memory/).

Distilled from **NodeRoom** (the origin).
