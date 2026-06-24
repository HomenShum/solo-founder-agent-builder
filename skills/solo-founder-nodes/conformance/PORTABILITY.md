# Portability - proving Solo Founder Nodes works across coding agents

"Works for all coding agents" is a claim, so it must be *proven*, not asserted. Here is how.

## The portability contract (what the skill needs of ANY agent)
The skill has **only two hard dependencies**, both universal to coding agents:

1. **Ingest a markdown directive** (read `SKILL.md` -> `MASTER_SKILL.md` and follow it).
2. **Run a shell** that can execute Node (`npm i && npm run smoke`) and Python (`grade.py`).

Plus the table-stakes coding-agent abilities it uses: **read files progressively** and **edit code**.
It needs **no** agent-specific API, MCP server, plugin runtime, or vendor lock-in. That absence is
what makes it portable, and the conformance probe checks for it.

## What is PROVEN vs. what you run

| Layer | How it's proven | Status |
|---|---|---|
| **Substrate is identical everywhere** | `templates/` is plain Node/Python; `npm i && npm run smoke` currently reports **135 passed, 0 failed** with zero agent involvement | proven (reproducible by anyone) |
| **No agent-specific coupling** | `conformance/conformance.mjs` checks markdown-only directive + no lock-in + portability declared | proven |
| **A specific agent can ingest + run it** | run `node conformance/conformance.mjs --run-smoke` under that agent's shell -> PASS receipt | Codex current receipt `4e853c2c6b08ddee`; Claude Code prior receipt `468f7aef456c64e8` on an older substrate; OpenClaw/Hermes prior receipt `311d4ca418744ba5` on the older 74-test substrate; other agents = run the probe |

We do **not** claim "we drove all nine." The proof model is: the agent-agnostic core is proven once;
each agent self-certifies by running the probe. The matrix below is the loading guide + an honest
verified column.

## Loading taxonomy

- **A. Native `SKILL.md` auto-discovery** - the agent reads `SKILL.md` frontmatter automatically.
- **B. Rules-file injection** - drop the directive into the agent's rules file.
- **C. Bootstrap prompt (universal fallback)** - paste `conformance/PROBE.md` / the README bootstrap;
  works for **every** agent because every coding agent can read a pasted instruction + run a shell.

## Per-agent matrix (loading mechanism + honest verification state)

| Agent | Primary loading | Verified by us |
|---|---|---|
| **Claude Code** | A - `.claude/skills/<name>/SKILL.md` auto-discovered | prior probe PASS, receipt `468f7aef456c64e8`; rerun for current 135-test substrate |
| **Codex (OpenAI)** | A/B - Codex Skills / `AGENTS.md`, else C | local probe PASS, receipt `4e853c2c6b08ddee`, current substrate smoke 135/135 |
| **Trae IDE** | A/C - `SKILL.md` per the standard, else bootstrap | run the probe |
| **OpenClaw** | A/C - `SKILL.md` per the cross-vendor standard | prior local probe PASS via OpenRouter/DeepSeek V4 Flash, receipt `311d4ca418744ba5`, older smoke 74/74; rerun for current 135-test substrate; see [`../../../docs/AGENT_PORTABILITY_PROOF.md`](../../../docs/AGENT_PORTABILITY_PROOF.md) |
| **Hermes** | A/C - `SKILL.md` per the standard | prior local probe PASS via OpenRouter/Qwen3 Coder Next, receipt `311d4ca418744ba5`, older smoke 74/74; rerun for current 135-test substrate; see [`../../../docs/AGENT_PORTABILITY_PROOF.md`](../../../docs/AGENT_PORTABILITY_PROOF.md) |
| **Cursor** | B/C - Project Rules (`.cursor/rules/*.mdc`) or bootstrap | run the probe |
| **Windsurf** | B/C - `.windsurfrules` / Cascade, or bootstrap | run the probe |
| **OpenCode** | B/C - `AGENTS.md` / rules, or bootstrap | run the probe |
| **Kilo Code** | B/C - custom modes / rules, or bootstrap | run the probe |

> The loading column for agents we haven't driven is best-effort and should be confirmed against each
> tool's current docs. The **bootstrap (C) is the guaranteed floor** for all of them: it depends only
> on "reads an instruction + runs a shell," which every coding agent satisfies by definition.

## How to certify an agent (the reproducible proof)

1. Load the skill via the agent's mechanism above (or paste `PROBE.md`).
2. Have the agent run `node conformance/conformance.mjs --run-smoke` from `skills/solo-founder-nodes`.
3. A **PASS receipt** (smoke green) is that agent's portability proof. Collect one per agent, then the matrix's verified column fills in with evidence, not assertion.
