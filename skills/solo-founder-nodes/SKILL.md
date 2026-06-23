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

When running the harness directly, see [`templates/run/README.md`](templates/run/README.md) — its top-of-file mode-selection table prevents the most common misreport (quoting api-mode scores as your agent's performance).
