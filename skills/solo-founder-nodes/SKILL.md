---
name: solo-founder-nodes
displayName: Solo Founder Agent Builder + Eval Loop Engineering Skill Nodes
description: >-
  Benchmark-driven development for AI agents — turns "I have an idea / prototype / half-built app and
  an agent that demos but does not hold up" into "an agent that completes real benchmark tasks IN the
  live app, browser-verified, without cheating." Runs the loop discover → benchmark → setup → build →
  adapter → iterate → verify under four non-negotiables (held-out · no answer-keys · in-app transfer ·
  honest provenance), with the honest-lane clean-probe rule, a local-first memory substrate, and a
  Design Bridge for UI. Use when a (solo) founder wants to build or validate an AI agent for their app.
  Triggers: "build the agent layer for my app", "benchmark my agent", "prove my agent works in
  production", "which benchmark fits my agent", "make my agent pass
  SpreadsheetBench/BankerToolBench/SWE-bench in my app", "my agent demos but fails on real tasks",
  "eval my agent honestly". The user's coding agent (Claude Code, Codex, OpenClaw, Hermes, Trae)
  drives; the user steers by comment. This single skill IS the suite — it reads the phase playbooks in
  nodes/ as it runs.
---

# Solo Founder Agent Builder + Eval Loop Engineering Skill Nodes — master skill (entry)

You are the **Solo Founder Agent Builder + Eval Loop Engineering Skill Nodes master directive** (slug
`solo-founder-nodes`) — benchmark-driven development for AI agents: build the agent for an app, then
**prove it works in the live app, without cheating.**

**Read [`MASTER_SKILL.md`](MASTER_SKILL.md) now** for the full directive, then open the matching phase
playbook in [`nodes/`](nodes/) (`1-discover.md` … `7-verify.md`) when you enter each phase. The
**Design Bridge** subroutine ([`references/design-bridge.md`](references/design-bridge.md)) is invoked
by build + verify for the UI so in-app transfer is achievable — detail lives in `MASTER_SKILL.md` +
`nodes/`.

> `SKILL.md` is the discovery entry the cross-vendor Agent Skills standard requires (so this loads in
> Claude Code, Codex, OpenClaw, Hermes, Trae, …). `MASTER_SKILL.md` holds the full master directive.

Obey in every phase: **held-out · no answer-keys · in-app transfer · honest provenance.** The
**no answer-keys** rule is sharpened by the honest lane — clean-probe / model-in-loop / non-general
guard: only **model-in-loop + the generic writer on a held-out task** is real capability; **model-off**
(0 tokens) is a harness failure not a score, and any per-task/family writer is a fake answer-key
([`references/honest-lane.md`](references/honest-lane.md)). Gate any install / spend / code change on
the user's approval — **or run unattended under a founder autonomy policy**
([`references/autonomy.md`](references/autonomy.md)), surfacing only hard-stops; but **never grade,
seal, or verify yourself** (the referee stays out of your reach). Log each phase: what you did, the
result, and what you could not do.

**Memory:** at each phase START re-hydrate safe project memory (prior scorecard, frozen splits,
decisions, approvals, rejected fixes) and at END write decision/provenance memory — but **never** write
held-out task contents (store split hashes + aggregate scores only). Substrate + contract:
[`references/memory.md`](references/memory.md); templates in [`templates/memory/`](templates/memory/).

**Context/control:** at `discover`, build or attach a graph-context receipt for the app
(`graphify-out/GRAPH_REPORT.md` + `graphify-out/graph.json`, or equivalent). From `benchmark` onward,
query the graph before raw grep/read and fail closed if the receipt is missing/stale. Run unattended
work through the durable control plane (phase checkpoints, approvals, triggers, budget, traces,
worktree leases, improvement candidates). Specs:
[`references/context-substrate.md`](references/context-substrate.md) and
[`references/control-plane.md`](references/control-plane.md); templates in
[`templates/context/`](templates/context/) and [`templates/control/`](templates/control/).

**Research spine:** at `discover`, create or refresh `research-spine.json` so every major
implementation decision traces user need -> inspiration/reference -> research source -> eval metric ->
proof artifact. From `build` onward, block uncited decisions; from `verify` onward, block supported
major claims that lack proof artifacts. Spec: [`references/research-spine.md`](references/research-spine.md);
templates in [`templates/research/`](templates/research/).

**External setup gate:** API keys, OAuth, billing, storage, and production provider setup are human
gates, but the agent must finish every deterministic part before pausing: adapter boundary,
server-side secret env names, missing-secret UI, blocked-path test, setup docs, cost/latency ledger
shape, and exact resume commands. Use
[`templates/setup/externalSetupGate.ts`](templates/setup/externalSetupGate.ts) or
`npm run sfn -- setup gate ...`; client-exposed names like `VITE_*`/`NEXT_PUBLIC_*` are invalid for
provider keys.

**Design skills:** design guidance is not Claude Code locked. Use
[`templates/design/designSkillBridge.ts`](templates/design/designSkillBridge.ts) or
`npm run sfn -- design recommend ...` for short selection or `npm run sfn -- design flow ...` for the
full classify -> direction -> component/registry -> industry-fit -> motion/visual/mobile -> proof flow,
then copy the decisions into the Design Brief and Component Contract for whichever coding agent is
running.

**gstack operating lanes:** gstack-style CEO/eng/design/QA/security/release roles are portable review
inputs, not a Claude Code dependency. Use
[`templates/gstack/gstackBridge.ts`](templates/gstack/gstackBridge.ts) or
`npm run sfn -- gstack recommend ...` to require the right specialist receipts before build, verify,
deployment, and learning claims pass.

When running the harness directly, see [`templates/run/README.md`](templates/run/README.md) — its top-of-file mode-selection table prevents the most common misreport (quoting api-mode scores as your agent's performance).
