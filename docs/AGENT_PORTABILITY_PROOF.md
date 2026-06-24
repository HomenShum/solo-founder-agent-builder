# Agent Portability Proof

This file records local receipts for the claim that Solo Founder Nodes can be driven by coding
agents other than Claude Code or Codex. It proves conformance portability only: the agent can ingest
the skill instructions, run the conformance probe, and report the PASS receipt. It does not prove a
fresh-user 3D app build, live UI completion, production deployment, or customer-readiness by itself.

## 2026-06-24 UTC OpenRouter Cheap-Model Run

This run was captured on an older 74-test substrate. The current substrate reports `135 passed, 0
failed`; rerun the reproduce commands below before claiming OpenClaw or Hermes are verified against
the latest gates.

Setup:

- Host directory: `D:\ai-agent-hosts`
- Target repo: `D:\VSCode Projects\solo-founder-nodes`
- Provider: OpenRouter
- OpenClaw model: `deepseek/deepseek-v4-flash`
- Hermes model: `qwen/qwen3-coder-next`
- Static optional free code fallback: `cohere/north-mini-code:free`
- Static optional multimodal UI fallback: `google/gemini-3.1-flash-lite`
- Live catalog-only free candidate: `openrouter/owl-alpha`
- Live catalog-only multimodal UI candidate: `qwen/qwen3.5-flash-02-23`
- OpenRouter key source: NodeBench/Convex local env, loaded into process env only
- Command under test: `node skills/solo-founder-nodes/conformance/conformance.mjs --run-smoke`

Receipts:

| Agent | Result | Receipt | Proof artifact | SHA-256 |
|---|---:|---|---|---|
| OpenRouter smoke | PASS | `openrouter-ok` | `D:\ai-agent-hosts\proof\openrouter-smoke.json` | `1AB0D01EE8E5163BB5D3D465F8187D3DACDF304A2D0F489BEEC8737E418FD2EB` |
| OpenClaw | PASS | `311d4ca418744ba5` | `D:\ai-agent-hosts\proof\openclaw-conformance.txt` | `89B8312C59D3417320BC7C16E65119A36A1CA383D11AAE00B56E902671CF6F74` |
| Hermes | PASS | `311d4ca418744ba5` | `D:\ai-agent-hosts\proof\hermes-conformance.txt` | `04C61AEFB1DB3C38291B0B68122CB8C3AAA914D4D8A6C8F804148D54F8E6CB6B` |
| Model audit smoke | PASS | selected routes | `D:\ai-agent-hosts\proof\openrouter-model-smoke.json` | `28D48F768B28087B5C1AF173E59B2633B1C35F1D52561E82A11708D43C48A5E2` |
| Live model catalog audit | PASS | catalog-only recommendations | `D:\ai-agent-hosts\proof\openrouter-model-audit-live.json` | `7EE0A117368CFA5EFE42DFC5697C86CF894D2B22602DF4E591A7B72BDF05F187` |
| Fixed-catalog model audit | PASS | deterministic recommendations | `D:\ai-agent-hosts\proof\openrouter-model-audit-from-catalog.json` | `98641BFA879021B4A068189FCA2AB6ADCEC28750866A4C268E0292837EE0E865` |

Observed outputs:

- OpenClaw returned: `PASS 17/17 receipt 311d4ca418744ba5`; model `deepseek/deepseek-v4-flash`; resolved workspace `D:\ai-agent-hosts\openclaw-workspace`; older substrate smoke `74 passed, 0 failed`.
- Hermes returned: `PASS 17/17 receipt 311d4ca418744ba5`; model `qwen/qwen3-coder-next`; older substrate smoke `74 passed, 0 failed`.
- DeepSeek V4 Flash is kept as OpenClaw's cheap paid default; Qwen3 Coder Next is kept as Hermes'
  coding fallback because one Hermes run on DeepSeek returned `15/16`.
- Live catalog recommendations are carried in `SOLO_OPENROUTER_AUDITED_*` variables but remain
  catalog-only until the selected host produces its own smoke and conformance receipt.

Important caveats:

- OpenClaw's JSON includes `replayInvalid: true`; treat this as an agent-run conformance receipt, not
  a replay-sealed transcript.
- Hermes was rerun with `C:\nvm4w\nodejs` prefixed on PATH after the generic proof script picked up
  a stale Node v12 runtime and produced a failed artifact. The local proof script now enforces the
  Node 22 path and the refreshed proof file is the script-generated Hermes PASS output.
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
$env:Path = "C:\nvm4w\nodejs;$env:Path"
D:\ai-agent-hosts\scripts\Run-HermesConformance.ps1
```

Do not paste or persist the OpenRouter key in repo files. The scripts load it into process env and
write only non-secret receipts.
