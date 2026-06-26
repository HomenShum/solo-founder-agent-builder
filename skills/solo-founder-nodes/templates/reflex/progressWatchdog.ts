export type ProgressDecisionAction = "continue" | "stop" | "diagnose" | "spawn_repair_and_pause_lane";

export type RunProgressState = {
  securityViolation?: boolean;
  absoluteSpendUsd: number;
  emergencySpendCapUsd: number;
  newProofGatesPassed: number;
  newArtifactsCreated: number;
  newRequiredFieldsCompleted: number;
  sameErrorFingerprintCount: number;
  stepsWithoutMeasurableProgress: number;
};

export type ProgressDecision = {
  action: ProgressDecisionAction;
  reason: string;
};

export function shouldContinue(run: RunProgressState): ProgressDecision {
  if (run.securityViolation) return { action: "stop", reason: "security/privacy violation" };
  if (run.absoluteSpendUsd >= run.emergencySpendCapUsd) return { action: "stop", reason: "emergency spend cap reached" };
  if (run.newProofGatesPassed > 0) return { action: "continue", reason: "new proof gates passed" };
  if (run.newArtifactsCreated > 0) return { action: "continue", reason: "new artifacts created" };
  if (run.newRequiredFieldsCompleted > 0) return { action: "continue", reason: "required fields completed" };
  if (run.sameErrorFingerprintCount >= 3) {
    return { action: "spawn_repair_and_pause_lane", reason: "same error fingerprint repeated at least three times" };
  }
  if (run.stepsWithoutMeasurableProgress >= 25) return { action: "diagnose", reason: "no measurable progress for 25 steps" };
  return { action: "continue", reason: "within progress budget" };
}

export type EmpiricalBudgetSample = {
  taskClass: string;
  modelProvider: string;
  steps: number;
  costUsd: number;
  succeeded: boolean;
};

export function empiricalTaskBudget(samples: EmpiricalBudgetSample[], safetyFactor = 1.5) {
  const successfulSteps = samples
    .filter((sample) => sample.succeeded)
    .map((sample) => sample.steps)
    .sort((a, b) => a - b);
  if (successfulSteps.length === 0) {
    return { steps: 128, basis: "fallback-no-successful-samples" };
  }
  const index = Math.min(successfulSteps.length - 1, Math.ceil(successfulSteps.length * 0.95) - 1);
  return {
    steps: Math.ceil(successfulSteps[index] * safetyFactor),
    basis: `p95 successful steps x ${safetyFactor}`,
  };
}
