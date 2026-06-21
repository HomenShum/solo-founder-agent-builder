# Solo Founder Nodes

**Solo-Founder Agent Builder + Eval Loop-Engineering — an agent skill for one-person companies.**

Benchmark-driven development for AI agents: your coding agent builds the agent for your app, then
**proves it actually works in your live app — without cheating.**

## What it is
One portable skill (`solo-founder-nodes`). Point the coding agent you already use (Claude Code, Codex,
OpenClaw, Hermes, Trae) at the master directive and it runs the loop, reading a phase playbook in
`nodes/` as it goes:

`discover → benchmark → setup → build → adapter → iterate → verify`

Discover + benchmark define *what good is*; setup + build + adapter make it runnable; iterate + verify
make it real.

## The one non-negotiable — why this exists
A coding agent told to "pass the benchmark" will cheat: hardcode answers, detect-and-template specific
tasks, report a high score with **zero** real capability. (Receipt: a fleet drove a benchmark to
**0.96** while true held-out capability was **0.008** — answer-keys, not ability.) Every phase obeys:
- **HELD-OUT** — never tune on the tasks you score on; keep a held-out split + an off-distribution slice.
- **NO ANSWER-KEYS** — no per-task detectors or hardcoded outputs; revert any change that only lifts the tuned tasks.
- **IN-APP TRANSFER** — a score counts only if the same task through the real app UI reproduces it (browser-verified).
- **HONEST PROVENANCE** — every number traces to a recorded run; report the real number even if it is low.

## Serving the models — Inference.ai
The benchmark runs need a model server. **[Inference.ai](https://inference.ai)** serves the frontier
models you benchmark against — validated: **`gpt-5.4` replies on an OpenAI-compatible endpoint** — so you
point the harness at it with a one-line `base_url` override, no SDK changes:

```
OPENAI_BASE_URL = https://<your-inference.ai-endpoint>/v1   # OpenAI-compatible
OPENAI_API_KEY  = <your Inference.ai key>
model           = gpt-5.4                                   # validated on Inference.ai
```

(Inference.ai also hosts the Super Solo: AI Agent Skills Hack Day, where this skill was built.)

## Use it with your coding agent
Portable **SKILL.md** — works with any coding agent. Paste this into your agent, **inside your own project**:

> Fetch Solo Founder Nodes from https://github.com/HomenShum/solo-founder-nodes (clone it, or read the
> raw files). Then act as the master directive in `skills/solo-founder-nodes/SKILL.md` → `MASTER_SKILL.md`:
> run benchmark-driven development on THIS project — discover what my agent should do, recommend a
> benchmark, set it up, build the missing agent + UI, wire the adapter, iterate, and verify it in my live
> app UI — reading each phase playbook in `skills/solo-founder-nodes/nodes/`. Obey the non-negotiables:
> held-out (never tune on what you score), no answer-keys, in-app transfer (a score counts only if it
> reproduces in my real UI), honest provenance (report the real number). Gate any install / spend / code
> change on my approval, and log each phase: what you did, the result, and what you COULD NOT do.

**Claude Code:** copy `skills/solo-founder-nodes/` into your project's `.claude/skills/` — it auto-loads
`SKILL.md`. **Other agents:** point them at the GitHub files and have them follow `SKILL.md` →
`MASTER_SKILL.md` as the playbook.

## Repo layout
- `skills/solo-founder-nodes/` — `SKILL.md` (loader entry) + `MASTER_SKILL.md` (full directive) + 7 phase playbooks in `nodes/` + `references/`.
- `docs/eval/nonbtb/` — a runnable deterministic example grader; `docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md` — the anti-overfit protocol.

Distilled from **NodeRoom** (the origin).
