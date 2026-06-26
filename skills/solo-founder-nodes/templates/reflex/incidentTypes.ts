import type { SoloEvent, SoloEventName } from "../events/soloEventBus";

export const reflexFailureEvents: SoloEventName[] = [
  "tool.error",
  "browser.proof.stop",
  "eval.stop",
  "judge.verdict",
];

export type IncidentKind = "transient" | "task_specific" | "systemic" | "security";
export type IncidentSeverity = "P0" | "P1" | "P2" | "P3";
export type IncidentStatus =
  | "observed"
  | "classified"
  | "retry_scheduled"
  | "quarantined"
  | "future_lanes_paused"
  | "repair_spawned"
  | "verification_ready"
  | "promoted"
  | "blocked";

export type IncidentAction =
  | "retry_with_fallback"
  | "quarantine_task"
  | "pause_future_lanes"
  | "stop_affected_lanes"
  | "record_improvement";

export type IncidentEvidenceRef = {
  eventId: string;
  eventType: SoloEventName;
  ts: string;
  status: string;
  message?: string;
  toolName?: string;
  receiptPath?: string;
  generationId?: string;
  taskId?: string;
  screenshotPath?: string;
  tracePath?: string;
};

export type IncidentClassification = {
  kind: IncidentKind;
  severity: IncidentSeverity;
  action: IncidentAction;
  affectedCapabilities: string[];
  pauseScope: "none" | "task" | "capability" | "all_affected";
  reason: string;
  requiresRepair: boolean;
  humanizedStatus: string;
};

export type ReflexIncident = {
  schemaVersion: 1;
  id: string;
  runId?: string;
  fingerprint: string;
  status: IncidentStatus;
  firstSeenAt: string;
  lastSeenAt: string;
  occurrenceCount: number;
  generationId?: string;
  taskIds: string[];
  eventTypes: SoloEventName[];
  evidenceRefs: IncidentEvidenceRef[];
  classification?: IncidentClassification;
  repairPlanPath?: string;
  patchContractPath?: string;
  verificationPath?: string;
  promotionReceiptPath?: string;
};

export type RunGeneration = {
  generationId: string;
  commitSha: string;
  frontendBuildId: string;
  convexDeploymentId: string;
  schemaVersion: string;
  harnessVersion: string;
  modelRoutingSnapshotHash: string;
  proofContractHash: string;
  createdAt: string;
  parentGenerationId?: string;
};

export type GenerationLaneStatus = "running" | "queued" | "passed" | "failed" | "cancelled" | "paused";

export type GenerationLane = {
  laneId: string;
  taskId: string;
  capability: string;
  generationId: string;
  status: GenerationLaneStatus;
  incidentIds: string[];
};

export type GenerationState = {
  schemaVersion: 1;
  activeGenerationId: string;
  generations: RunGeneration[];
  lanes: GenerationLane[];
  routingNotes: string[];
  updatedAt: string;
};

export type RepairRole =
  | "triager"
  | "root_cause_reviewer"
  | "implementer"
  | "regression_verifier"
  | "readability_critic";

export type RepairRoleBrief = {
  role: RepairRole;
  readonly: boolean;
  inputRefs: string[];
  outputPath: string;
  prompt: string;
};

export type RepairSpawnPlan = {
  schemaVersion: 1;
  incidentId: string;
  createdAt: string;
  roles: RepairRoleBrief[];
  isolatedWorktreeRequired: true;
  canMutateActiveGeneration: false;
  targetGenerationId: string;
  canaryRequired: true;
  promotionRule: "verify-isolated-generation-before-routing-future-lanes";
};

export type PatchContract = {
  schemaVersion: 1;
  incidentId: string;
  userVisibleSymptom: string;
  evidence: string[];
  violatedInvariant: string;
  rootCause: string;
  systemicFix: string;
  whyNotOneTaskSpecialCase: string;
  compatibility: string;
  regressionFixture: string;
  liveCanary: string;
  humanizedUiImpact: string;
  architectureProofUpdates: string[];
  rollback: string;
  debtReceipt?: {
    expiresAt: string;
    owner: string;
    reason: string;
  };
};

export type PatchContractVerification = {
  ok: boolean;
  errors: string[];
};

export type ReflexVerificationReceipt = {
  schemaVersion: 1;
  incidentId: string;
  generationId: string;
  regressionFixture: {
    command: string;
    passed: boolean;
    evidenceRef: string;
  };
  liveCanary: {
    command: string;
    passed: boolean;
    evidenceRef: string;
  };
  readabilityCritic: {
    passed: boolean;
    evidenceRef: string;
  };
  verdict: "pass" | "fail" | "blocked";
};

export type PromotionReceipt = {
  schemaVersion: 1;
  incidentId: string;
  fromGenerationId: string;
  toGenerationId: string;
  promotedAt: string;
  routedQueuedLanes: string[];
  requeuedFailedLanes: string[];
  activeLanesLeftPinned: string[];
  evidence: string[];
  rollback: string;
};

export type FailureSignal = {
  event: SoloEvent;
  generationId?: string;
  taskId?: string;
  capability?: string;
};
