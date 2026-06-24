# Autonomy — the agent does everything, and is never its own judge

The goal of Solo Founder Nodes: the founder's coding agent runs the **whole loop on their behalf,
unattended** — discover → benchmark → setup → build → adapter → iterate → verify. That includes the
work a founder would otherwise do by hand: **downloading the benchmark dataset, wiring the harness,
running the model on tasks, fixing the generic writer/tools/context, and verifying in the live app.**

Autonomy is not "no guardrails." It is: **the founder sets one policy, then the agent runs free within
it** — and the single thing the agent never gets to do is grade itself.

## The founder policy (set once)
A single config the agent reads at the start — see [`../templates/autonomy.policy.example.json`](../templates/autonomy.policy.example.json):
- **`model` + `apiKeyEnv`** — which model attempts the tasks and the env var holding its key. The agent
  can't pick its own brain or invent a key; you choose them once.
- **`budgetUsd`** — a hard ceiling on spend. The agent tracks cost and **stops** at the cap.
- **`downloadAllowlist`** — the sources the agent may download from (scope it to the *specific*
  benchmark's dataset host). Anything off the list is a hard-stop.
- **`autoApprove`** — `installs` / `codeChanges` / `localRuns`: when true, the agent proceeds without asking.
- **Always-surface hard-stops** (never auto-approved): publishing public content, spend over `budgetUsd`,
  downloads outside `downloadAllowlist`, deleting data, anything touching credentials.

With the policy set, the agent executes the loop end-to-end and pauses only on a hard-stop or a real
failure. No per-step nagging. A credential hard-stop is not an early exit: before pausing, the agent
must finish the no-secret work, including adapter boundaries, AI chat component, typed chat action
protocol, server-side env names, missing-secret UI, blocked-path tests, setup docs, cost/latency ledger shape, and resume commands.

The durable runtime is `templates/control/SoloControlPlane`: it records the loop id, phase checkpoints,
approval pauses, idempotent triggers, budget spend, trace spans, worktree leases, and improvement
candidates. That is the difference between "the chat is trying to keep going" and "the loop can resume
from durable state without the founder steering every turn." See [`control-plane.md`](control-plane.md).

## The one carve-out — and why it ENABLES the autonomy
The agent does every step and produces every artifact — but the **honesty referee runs out of its
reach**: the held-out seal (the salt), the gate derivation, the grader's sealed-gold, and the
independent verifier live in the founder's secret / CI / the trust-root API, **never** in the agent's
process. The agent *runs* verify (drives the UI, captures the proof); it cannot *forge the verdict*.

This is the opposite of a limit — it is what makes full autonomy safe. You can let the agent run
unattended **precisely because the referee can't be bribed.** An agent that graded itself would cheat
(NodeRoom receipts show selected/family-writer paths around 0.96 and much lower clean/general signals;
see `docs/PUBLIC_CLAIM_PROOF.md` before quoting exact public numbers). So "do everything on the user's behalf" =
**all the labor + all the proof, with a verdict the agent cannot fake.** See
[`honest-lane.md`](honest-lane.md) (derive-don't-accept) and [`trust-root-api.md`](trust-root-api.md).

## What "everything" covers
| Phase | The agent does (autonomously, under policy) | The referee owns (out of the agent's reach) |
|---|---|---|
| discover / benchmark | read the app, pick the benchmark, define the rubric | — |
| setup | download the dataset (allowlisted), wire the harness, install deps (budgeted) | the **held-out seal** (salt) |
| build / adapter | build the agent + UI + generic writer; wire the real runner | — |
| iterate | run the model on tasks, cluster failures, fix the shared/generic layer | the **gate derivation** + sealed-gold |
| verify | drive the live UI, capture DOM signal + screenshot proof | the **verdict** (independent verifier) |

The founder reviews the **honest ledger the agent produces** — not each step. That is the deal:
maximum autonomy on the work, zero autonomy on the scoring.
