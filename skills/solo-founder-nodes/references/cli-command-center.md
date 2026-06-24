# CLI Command Center

The clean visualization is the CLI command center. Static diagrams can explain the architecture, but
`sfn dashboard` is the operating surface a founder or coding agent should use while the loop is
running.

Binding rule:

> Hooks observe the agent. Receipts prove the work. The CLI makes the whole loop visible.

## What the dashboard shows

`npm run sfn -- dashboard --project <path>` renders:

- active RALPH loop id, goal, status, current milestone, and blockers;
- R/A/L/P/H milestone receipt counts;
- proof verdict state;
- recent normalized events from `.solo/events.jsonl`;
- agent host matrix summary;
- local artifacts such as loop state, event log, memory db, receipts, proof verdict, and rework ledger;
- runtime facts needed to reproduce the local run.

Use `--json` when another tool needs a machine-readable snapshot.

`npm run sfn -- judge current --project <path>` is the fresh-context completion guard. It reads
`.solo/loop-state.json`, RALPH required receipts, recent events, and `.solo/proof-verdict.json` and
returns `done | not_done | blocked | needs_research | needs_verification`. Use `--on-stop` from host
idle/final-answer hooks; if `blockClaim` is true, the agent must continue or report the exact blocker.

## Universal event bus

Agent hosts normalize native hook output into `SoloEvent` rows in `.solo/events.jsonl`.

Event vocabulary:

```text
session.start
session.created
session.idle
session.stop
session.deleted
phase.start
phase.stop
prompt.submit
tool.before
tool.pre
tool.post
tool.after
tool.error
file.read.pre
file.changed
file.write.pre
file.write.post
command.run.pre
command.run.post
browser.proof.start
browser.proof.stop
receipt.write
memory.write
eval.start
eval.stop
rework.recorded
judge.verdict
```

The event bus is observability, not a grader. A `tool.post` or `session.stop` event never proves the
capability shipped. Receipts and proof verdicts decide pass/fail.

## Agent host matrix

Use:

```bash
npm run sfn -- agent matrix
npm run sfn -- hooks install --target pi --project . --dry-run
npm run sfn -- hooks install --target hermes --project . --dry-run
npm run sfn -- hooks install --target openclaw --project . --dry-run
npm run sfn -- hooks install --target trae --mode generic-until-verified --project . --dry-run
npm run sfn -- agent install-hooks --target codex --project . --dry-run
npm run sfn -- agent collect --project .
```

Hook-native hosts can emit richer telemetry. Generic/no-hooks hosts are still supported, but only as
external proof lanes: browser proof, terminal transcript, fresh-room receipt, and proof verdict.
Generic hosts cannot self-report completion.

The hook installer writes or previews:

- `.solo/bin/record-event`
- `.solo/bin/sfn-pre-tool-policy.js`
- `.solo/bin/sfn-post-tool-receipt.js`
- `.solo/bin/sfn-session-idle-judge.js`
- `.solo/bin/sfn-final-answer-guard.js`
- `.solo/bin/sfn-inject-loop-context.js`
- `AGENTS.md`
- host-specific hook or rules files such as `.codex/config.toml`, `.codex/hooks.json`,
  `.claude/settings.json`, `.windsurf/hooks.json`, `.pi/hook/hooks.yaml`, `.hermes/hooks.yaml`,
  `.openclaw/hooks/solo-session-memory/HOOK.md`, `.trae/rules/...`, and generic rules files.

Host-specific files are adapter templates. After installation, run the host's actual conformance or
proof flow before treating native hook events as complete coverage.

Detailed host hook doctrine: [`host-hooks-fresh-judge.md`](host-hooks-fresh-judge.md).

## NodeRoom handoff

Use:

```bash
npm run sfn -- noderoom run-fresh-room --case FR-010 --base-url <url> --headed --record-video --trace on --focus-mode on --model-mode top_paid --budget benchmark_completion
```

This produces a handoff receipt and records an eval event. It is not a pass. The pass requires the
NodeRoom run to export trace/video/fresh-room receipts, reopen generated artifacts, run the official
scorer where applicable, visually verify the recording, and produce a passing proof verdict.

## Failure modes this prevents

- A coding agent claims "done" after a chat transcript but before live UI proof.
- A benchmark score is reported without trace/video/scorer receipts.
- A founder cannot tell which phase is blocked or what command resumes it.
- A no-hooks agent is treated as if its own completion message is proof.
- Memory, rework, and proof artifacts exist but are invisible unless someone opens the filesystem.
