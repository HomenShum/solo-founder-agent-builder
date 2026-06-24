# Agent Portability Proof

This file records local receipts for the claim that Solo Founder Nodes can be driven by coding
agents other than Claude Code or Codex. It proves conformance portability only: the agent can ingest
the skill instructions, run the conformance probe, and report the PASS receipt. It does not prove a
fresh-user 3D app build, live UI completion, production deployment, or customer-readiness by itself.

## 2026-06-24 UTC OpenRouter/Qwen Run

Setup:

- Host directory: `D:\ai-agent-hosts`
- Target repo: `D:\VSCode Projects\solo-founder-nodes`
- Provider: OpenRouter
- Model: `qwen/qwen3-coder-next`
- OpenRouter key source: NodeBench/Convex local env, loaded into process env only
- Command under test: `node skills/solo-founder-nodes/conformance/conformance.mjs --run-smoke`

Receipts:

| Agent | Result | Receipt | Proof artifact | SHA-256 |
|---|---:|---|---|---|
| OpenRouter smoke | PASS | `openrouter-ok` | `D:\ai-agent-hosts\proof\openrouter-smoke.json` | `B8C77F0EE0747BB5F272D6D99D11D79D796A97D3C085E9C5C6D95FA03F92FE76` |
| OpenClaw | PASS | `d35b461dfbefb25b` | `D:\ai-agent-hosts\proof\openclaw-conformance.txt` | `B8F7B832A75747DA4C4CC99EC6D0F1505F9FB8723BD90DB72FBF5D2B89612B70` |
| Hermes | PASS | `d35b461dfbefb25b` | `D:\ai-agent-hosts\proof\hermes-conformance.txt` | `F54722F1798CDE2A548B9C2DBECFA8493576411F083B60152A94EAEE782E07AC` |

Observed outputs:

- OpenClaw returned: `PASS · 16/16 · receipt d35b461dfbefb25b`; resolved workspace `D:\ai-agent-hosts\openclaw-workspace`.
- Hermes returned: `PASS · 16/16 · receipt d35b461dfbefb25b`; substrate smoke `64 passed, 0 failed`.

Important caveats:

- OpenClaw's JSON includes `replayInvalid: true`; treat this as an agent-run conformance receipt, not
  a replay-sealed transcript.
- These receipts do not cover Trae, Cursor, Windsurf, OpenCode, Kilo Code, or other agents until
  those tools run the same probe and record their own PASS artifacts.
- These receipts do not cover the broader product proof target: fresh-user emulation, video, real UI
  trace, generated 3D assets, provider cost/latency receipts, deployment URL, and comparison scorecard.

## Reproduce

From a PowerShell process with access to the NodeBench/Convex env:

```powershell
. D:\ai-agent-hosts\scripts\Set-AgentEnv.ps1
D:\ai-agent-hosts\scripts\Load-NodeBenchOpenRouterKey.ps1
D:\ai-agent-hosts\scripts\Verify-OpenRouter.ps1
D:\ai-agent-hosts\scripts\Run-OpenClawConformance.ps1
D:\ai-agent-hosts\scripts\Run-HermesConformance.ps1
```

Do not paste or persist the OpenRouter key in repo files. The scripts load it into process env and
write only non-secret receipts.
