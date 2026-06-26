import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { reflexPaths, updateReflexIncident } from "./incidentBroker";
import { verifyPatchContract } from "./patchContract";
import type { PatchContract, PromotionReceipt, ReflexIncident, ReflexVerificationReceipt } from "./incidentTypes";

export function verifyPromotionGate(input: {
  incident: ReflexIncident;
  patchContract: PatchContract;
  verification: ReflexVerificationReceipt;
}): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const patch = verifyPatchContract(input.patchContract);
  if (!patch.ok) errors.push(...patch.errors.map((error) => `patch: ${error}`));
  if (!input.incident.classification?.requiresRepair) errors.push("incident classification does not require repair promotion");
  if (input.verification.schemaVersion !== 1) errors.push("verification schemaVersion must be 1");
  if (input.verification.incidentId !== input.incident.id) errors.push("verification incidentId mismatch");
  if (input.verification.verdict !== "pass") errors.push("verification verdict must be pass");
  if (!input.verification.regressionFixture.passed) errors.push("negative regression fixture did not pass");
  if (!input.verification.liveCanary.passed) errors.push("live canary did not pass");
  if (!input.verification.readabilityCritic.passed) errors.push("readability critic did not pass");
  return { ok: errors.length === 0, errors };
}

export function makePromotionReceipt(input: {
  incident: ReflexIncident;
  fromGenerationId: string;
  toGenerationId: string;
  routedQueuedLanes: string[];
  requeuedFailedLanes: string[];
  activeLanesLeftPinned: string[];
  evidence: string[];
  rollback: string;
  promotedAt?: string;
}): PromotionReceipt {
  return {
    schemaVersion: 1,
    incidentId: input.incident.id,
    fromGenerationId: input.fromGenerationId,
    toGenerationId: input.toGenerationId,
    promotedAt: input.promotedAt ?? new Date().toISOString(),
    routedQueuedLanes: input.routedQueuedLanes,
    requeuedFailedLanes: input.requeuedFailedLanes,
    activeLanesLeftPinned: input.activeLanesLeftPinned,
    evidence: input.evidence,
    rollback: input.rollback,
  };
}

export function writePromotionReceipt(projectPath: string, receipt: PromotionReceipt): string {
  const path = join(reflexPaths(projectPath).incidentDir(receipt.incidentId), "promotion-receipt.json");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  updateReflexIncident(projectPath, receipt.incidentId, {
    status: "promoted",
    promotionReceiptPath: path,
  });
  return path;
}
