# Universal Conformance Probe - Paste Into Any Coding Agent

Paste the block below into your coding agent (Cursor, Windsurf, Trae, Codex, Claude Code, OpenClaw,
Hermes, OpenCode, Kilo Code, or another coding agent). It certifies that *this* agent can ingest the
directive and run the substrate, which are the only two things the skill requires.

> Clone `https://github.com/HomenShum/solo-founder-agent-builder` (or read its raw files). To prove you
> can run Solo Founder Nodes locally:
> 1. Read `skills/solo-founder-nodes/SKILL.md` -> `MASTER_SKILL.md` and report back the 7-phase loop
>    (`discover -> benchmark -> setup -> build -> adapter -> verify -> iterate`) and the four non-negotiables
>    (HELD-OUT / NO ANSWER-KEYS / IN-APP TRANSFER / HONEST PROVENANCE).
> 2. In `skills/solo-founder-nodes/templates/`, run `npm i && npm run smoke` and paste the last line
>    (expect `156 passed, 0 failed` on the current substrate).
> 3. Run `node skills/solo-founder-nodes/conformance/conformance.mjs --run-smoke` and paste the final
>    `PASS ... receipt ...` line.
> Report the receipt hash. If all three succeed, this agent is certified portable for the skill.

A PASS receipt from step 3, with the smoke green, is that agent's portability proof. Collect one per
agent and record it in `PORTABILITY.md`'s matrix: evidence, not assertion.
