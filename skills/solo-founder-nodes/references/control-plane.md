# Control plane - durable loop state

The skill prose tells an agent what to do. The control plane records whether the agent is actually
doing it, where it paused, what it spent, what it observed, and what it should improve next.

This closes the loop-engineering gaps that plain prompts cannot close:

- durable phase state and checkpoints
- event-driven triggers with idempotency
- graph-context gates
- human approval pause/resume
- budget metering and hard stops
- trace spans for cost/latency/tokens/tool outcomes
- worktree leases for parallel agents
- improvement candidates sourced from traces/evals

## Reference implementation

`templates/control/controlPlane.ts` is a local-first SQLite/libSQL implementation. It is not the
benchmark referee. It coordinates the loop; `SoloLedger` still scores capability and derives the
honest-lane gate.

The control plane stores:

- `control_loops`: goal, policy, current phase, status, budget/spend, graph receipt.
- `control_phase_runs`: phase attempts, checkpoints, blockers.
- `control_events`: cron/webhook/CI/trace-alert triggers with idempotency keys.
- `control_approvals`: pending and decided human gates.
- `control_traces`: spans with status, duration, tokens, cost, attrs.
- `control_improvements`: proposed harness/app fixes linked to traces.
- `control_worktrees`: active/released leases by purpose.

## Required lifecycle

1. Start a loop under the founder autonomy policy.
2. Build or attach a ready graph-context receipt during `discover`.
3. Start each phase through the control plane, not from chat memory.
4. Checkpoint useful intermediate state before long commands.
5. Pause with a durable approval request for hard gates.
6. Record spans for model calls, tool calls, UI runs, grader runs, deploys, and failures.
7. Convert repeated trace/eval failures into improvement candidates.
8. Use worktree leases before dispatching reviewer/red-team/sub-agent work.
9. Finish with `SoloLedger` and the trust-root/verifier; never let the control plane self-score.

## Event sources

The local implementation accepts generic triggers. App integrations should map these into the same
contract:

- cron/nightly discovery or benchmark drift check
- GitHub push/PR/check failure
- deployment finished
- Slack/Linear request
- production trace anomaly
- score regression or verifier refutation

Use idempotency keys. A duplicate webhook must not start a second loop.

## Approval semantics

Approval is durable state, not a chat convention. A decision is one of:

- `approve`: run as requested
- `edit`: run with the edited payload
- `reject`: block the loop
- `respond`: answer an information request without executing a tool

Hard stops remain: over budget, off-allowlist download, public publish, data deletion, credentials.
Credential hard stops are valid only after the loop has checkpointed the deterministic prework that does
not require the secret: adapter boundary, server-side env names, missing-secret UI, blocked-path test,
setup doc, cost/latency ledger shape, and resume command. Store that checkpoint as an external setup
receipt so a fresh session can continue without rediscovering the provider boundary.

## Observability and hill climbing

Every expensive or uncertain step emits a trace span. A trace can become an improvement candidate:

- failing selector -> patch live-browser adapter contract
- high token cost -> add graph query or memory compression
- verifier refutation -> update harness evidence receipt
- repeated setup failure -> update setup playbook or dependency probe

This is the hill-climbing loop: traces feed improvement candidates; improvements go through review,
worktree isolation, eval, and ledger verification.

## CLI

From `templates/`:

```bash
npm run sfn -- context inspect <app-root>
npm run sfn -- control trigger --source cron --key nightly-2026-06-23 --project my-app --goal "run loop"
npm run sfn -- control start --project my-app --goal "prove agent works" --budget 5 --root <app-root>
npm run sfn -- control status <loopId>
```

Run `npm run smoke` to prove the local control-plane invariants.
