# Adaptive Budget Policy

Static step ceilings are a last-resort safety guard, not the definition of completion.

Separate:

- Slice budget: how much one runtime slice can do before checkpointing.
- Total task budget: how much the whole resumable task may spend.
- Progress budget: whether the task is still making measurable progress.
- Emergency cap: absolute protection against runaway spend or broken loops.

During benchmark infancy, use completion-first budgets:

```text
do not stop because an arbitrary step count was reached
checkpoint and resume
measure actual cost/time/steps
stop only on safety, no-progress, or emergency spend conditions
```

## Progress-Aware Continuation

```ts
function shouldContinue(run: RunState): Decision {
  if (run.securityViolation) return { action: "stop" };
  if (run.absoluteSpendUsd >= run.emergencySpendCapUsd) return { action: "stop" };
  if (run.newProofGatesPassed > 0) return { action: "continue" };
  if (run.newArtifactsCreated > 0) return { action: "continue" };
  if (run.newRequiredFieldsCompleted > 0) return { action: "continue" };
  if (run.sameErrorFingerprintCount >= 3) return { action: "spawn_repair_and_pause_lane" };
  if (run.stepsWithoutMeasurableProgress >= 25) return { action: "diagnose" };
  return { action: "continue" };
}
```

Future task budgets should be empirical:

```text
p95(total steps of successful runs for task class + model route) * 1.25-1.75
```

Track task class, model/provider, steps, model calls, tool calls, tokens, runtime calls, wall time,
cost, retry count, failure fingerprints, proof gates passed, and final score.

Copyable implementation: `templates/reflex/progressWatchdog.ts`.
