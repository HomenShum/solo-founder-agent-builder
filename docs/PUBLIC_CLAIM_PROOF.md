# Public Claim Proof Matrix

This matrix is the public-copy guardrail for Solo Founder Nodes. If a claim is not backed by a
receipt here, do not publish it as fact. Use the safe wording instead.

## Verdict

The post is not fully proofed as written.

The repo can support the core claim that Solo Founder Nodes is a portable, benchmark-driven skill
that forces held-out, no-answer-key, in-app-transfer, and provenance gates. It cannot yet support
the exact public sentence "a coding-agent fleet pushed a benchmark to 0.96 while real held-out
capability was 0.008" without merging separate receipts into one auditable incident record.

## Claim Matrix

| Draft claim | Current proof | Status | Safe public wording |
|---|---|---|---|
| "I watched a coding-agent fleet push a benchmark to 0.96 while the agent's real, held-out capability was 0.008." | NodeRoom receipts show selected/family-writer BankerToolBench results around `0.9608` and `0.9638`, plus an older diagnostic where pre-materializer signal was `0.009`. A separate SpreadsheetBench smoke row contains `0.008333`. The currently recorded full-100 BTB clean-probe mean is `0.251875`. These are adjacent evidence, not one sealed public proof of the exact `0.96 -> 0.008` incident. | Not proven as written | "I watched high benchmark numbers collapse once the run was forced through clean-probe gates. In NodeRoom, selected/family-writer BTB runs reached about 0.96, while generic clean-probe measurements were much lower; I am publishing the receipt matrix instead of treating the high score as capability." |
| "It had quietly memorized answer-keys for the exact tasks being graded." | NodeRoom anti-cheat docs identify per-task/family writers, replay materializers, and self-certified clean rows as the failure pattern. The repo doctrine forbids per-task detectors and hardcoded outputs. | Proven as failure mode; exact "memorized" phrasing should be used carefully | "The high score came from task/family-specific materialization paths, not from a reusable general agent lane." |
| "That gap is how most AI products die in the demo to production handoff." | This is a product opinion, not a measured statistic in this repo. | Rhetorical, not empirical | "That gap is exactly what breaks demos when they meet real users." |
| "At the Super Solo Hack Day, hosted by Inference.ai." | Luma lists "The Super Solo: Agent Skills Hack Day" as presented by BotLearn and co-hosted by BotLearn, Inference.ai, and SSG Accelerator. | Partially proven; "hosted by Inference.ai" is too narrow | "At The Super Solo: Agent Skills Hack Day, co-hosted with Inference.ai." |
| "I shipped a skill: Solo Founder Agent Builder + Eval Loop Engineering Skill Nodes." | This repository contains the skill, master directive, phase nodes, templates, conformance probe, and smoke suite. | Proven locally | "I shipped Solo Founder Agent Builder + Eval Loop Engineering Skill Nodes." |
| "Benchmark-driven development for AI agents." | `MASTER_SKILL.md` requires discover, benchmark, setup, build, adapter, iterate, and verify, with held-out and provenance gates. | Proven as skill design | Keep as written. |
| "Point the coding agent you already use -- Claude Code, Codex, OpenClaw, Hermes, Trae -- at it." | The core is markdown plus shell-based Node/Python substrate. Claude Code had an earlier conformance receipt; Codex has a local conformance receipt after this audit. OpenClaw and Hermes were independently driven through OpenRouter/Qwen and returned PASS receipt `d35b461dfbefb25b`; see `docs/AGENT_PORTABILITY_PROOF.md`. Trae is not independently driven in this repo. | Partially proven | "Point Claude Code, Codex, OpenClaw, Hermes, or any coding agent that can read markdown and run shell commands at it. Trae and other agents should run the included conformance probe before you claim them as verified." |
| "It runs one honest loop on your app: discover -> pick benchmark -> set it up -> build agent + UI -> wire adapter -> iterate -> verify in live UI." | The skill encodes the loop and the 3D proof repo dogfoods the process. It is not a universal guarantee for an arbitrary user's app until the loop is actually run on that app. | Proven as process; per-app proof required | "It gives your coding agent one honest loop to run on your app... The claim becomes real only after the proof pack contains the live UI trace and verdict for that app." |
| "Install it and tell me what it caught." | README and Quickstart provide install/bootstrap instructions; conformance probe verifies structure. | Proven as installable docs | Keep as call to action, but link `QUICKSTART.md` and `conformance/PROBE.md`. |

## Internal Receipts To Link Before Reusing The Exact Numbers

- NodeRoom selected/family-writer BTB receipts:
  - `D:\VSCode Projects\cafecorner_nodebench\nodebench_ai4\noderoom\docs\eval\BANKERTOOLBENCH_NODEROOM_EXECUTION_PLAN.md`
  - Rows include `0.9608` and `0.9638` diagnostic results.
- NodeRoom overfit diagnostic:
  - `D:\VSCode Projects\cafecorner_nodebench\nodebench_ai4\noderoom\docs\eval\BTB_GENERALIZATION_DIAGNOSTIC.md`
  - Notes `0.009` pre-materializer signal and explains why the old high scores were not a true general-agent measurement.
- NodeRoom anti-cheat doctrine:
  - `D:\VSCode Projects\cafecorner_nodebench\nodebench_ai4\noderoom\docs\eval\BANKERTOOLBENCH_ANTI_CHEAT_DOCTRINE.md`
  - Defines the corrected claim and forbids self-certified clean rows.
- Current NodeRoom clean-probe full-100 summary:
  - `D:\VSCode Projects\cafecorner_nodebench\nodebench_ai4\noderoom\docs\eval\btb-clean-capability-full100-parallel-v3-gpt41mini.json`
  - `selectedTasks=100`, `completedTasks=100`, `erroredTasks=0`, `meanReward=0.251875`.
- SpreadsheetBench `0.008333` row:
  - `D:\VSCode Projects\cafecorner_nodebench\nodebench_ai4\noderoom\docs\eval\spreadsheetbench-v1-copy-input-full-smoke.json`
  - This is not currently tied to the BTB `0.96` incident; do not combine them in public copy.

## External Receipts

- Luma event page: `https://luma.com/lktan8iq`
  - Confirms The Super Solo: Agent Skills Hack Day, Redwood City, and co-host list including Inference.ai.
- gstack reference: `https://github.com/garrytan/gstack`
  - Confirms the operating-lane inspiration: specialist roles, review, QA, deploy, canary, docs, memory, and multi-agent/cross-agent support.
- Local OpenClaw/Hermes conformance proof:
  - `docs/AGENT_PORTABILITY_PROOF.md`
  - Confirms OpenClaw and Hermes can drive the conformance probe through OpenRouter/Qwen. This is not a live UI/deployment proof.

## Required Rule

If a post includes a number, the number needs:

1. Run path.
2. Task count and split.
3. Materializer/writer state.
4. Model transport proof.
5. Whether the gate was substrate-derived or provisional.
6. Live UI proof status, if transfer is claimed.

No receipt, no number.
