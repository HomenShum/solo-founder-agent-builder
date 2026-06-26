# Reflex RALPH

Reflex RALPH is the continuous repair loop that runs beside benchmark, proof, and Prometheus runs.

The normal loop answers:

```text
Did the product complete the benchmark?
```

Reflex RALPH answers:

```text
What just went wrong?
Is it likely to hurt later tasks?
Can we safely repair it now?
Which future lanes should inherit the fix?
```

## Core Rule

Do not hot-patch an active generation. Every lane is pinned to a `RunGeneration`:

```ts
type RunGeneration = {
  generationId: string;
  commitSha: string;
  frontendBuildId: string;
  convexDeploymentId: string;
  schemaVersion: string;
  harnessVersion: string;
  modelRoutingSnapshotHash: string;
  proofContractHash: string;
};
```

Already running `G0` lanes finish on `G0` or are explicitly cancelled. Repair agents work in an
isolated `G1` worktree/preview. Once `G1` canary passes, queued lanes route to `G1`, and failed `G0`
lanes can requeue on `G1`.

## Runtime

```text
event observed
  -> classify incident
  -> determine whether it is systemic
  -> pause only affected future lanes
  -> spawn bounded repair roles
  -> verify fix in an isolated generation
  -> promote fixed generation
  -> route future lanes onto fixed generation
```

## CLI

```bash
npm run sfn -- reflex watch --project . --run <run-id>
npm run sfn -- reflex incidents --project .
npm run sfn -- reflex inspect --incident <id> --project .
npm run sfn -- reflex spawn --incident <id> --project .
npm run sfn -- reflex verify --incident <id> --project .
npm run sfn -- reflex promote --incident <id> --from G0 --to G1 --project .
npm run sfn -- reflex replay --run <run-id> --project .
```

## Incident Rules

| Signal | Behavior |
| --- | --- |
| Security/privacy leak, destructive write, corrupted artifact | Stop affected lanes immediately |
| Same tool-schema failure in two lanes | Pause future lanes using that tool and start repair |
| One deterministic tool-schema failure with clear reproduction | Start repair; unrelated lanes continue |
| Provider timeout/DNS/rate limit | Retry or fallback; do not edit code yet |
| Task-specific missing source | Quarantine that task |
| Shared UI overflow or unusable contrast | Repair UI lane; future browser runs use fixed generation |
| P2 visual polish issue | Record improvement; do not block the batch |
| Repeated no-progress loop | Stop that lane and start harness diagnosis |

## Repair Roles

Do not send one unbounded "fix this" prompt. Spawn bounded roles:

- Incident triager: read-only classification, scope, reproduction, invariant.
- Root-cause reviewer: cause, missed gates, defect boundary, generalization risk.
- Implementation agent: isolated worktree patch from the root-cause brief.
- Verification agent: negative regression, focused tests, live-browser canary, affected proof gate.
- Readability and UX critic: naming, centralization, user-facing recovery, error translation.

## Binding Rules

- No patch without an invariant.
- No merge without a negative regression fixture.
- No benchmark-specific answer-key branch.
- No user-facing error without a next action.
- No temporary workaround without an explicit debt receipt and expiry.

Copyable implementation: `templates/reflex/`.
