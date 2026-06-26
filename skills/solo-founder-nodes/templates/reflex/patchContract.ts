import type { PatchContract, PatchContractVerification } from "./incidentTypes";

export function makePatchContract(input: Omit<PatchContract, "schemaVersion">): PatchContract {
  return { schemaVersion: 1, ...input };
}

export function verifyPatchContract(contract: PatchContract): PatchContractVerification {
  const errors: string[] = [];
  if (contract.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  for (const key of [
    "incidentId",
    "userVisibleSymptom",
    "violatedInvariant",
    "rootCause",
    "systemicFix",
    "whyNotOneTaskSpecialCase",
    "compatibility",
    "regressionFixture",
    "liveCanary",
    "humanizedUiImpact",
    "rollback",
  ] as const) {
    if (!contract[key]?.trim()) errors.push(`missing ${key}`);
  }
  if (contract.evidence.length === 0) errors.push("evidence must include at least one trace, screenshot, receipt, selector, or exact error");
  if (contract.architectureProofUpdates.length === 0) errors.push("architectureProofUpdates must name the graph, domain pack, tool contract, or proof gate that changed");
  if (/task\s*\d+|case-only|special-case|hardcode|answer-key/i.test(contract.systemicFix)) {
    errors.push("systemicFix appears task-specific or answer-key-like");
  }
  if (!/invariant|must|always|guarantee|cannot|never/i.test(contract.violatedInvariant)) {
    errors.push("violatedInvariant must state what should always have been true");
  }
  if (!/test|fixture|negative|regression|spec/i.test(contract.regressionFixture)) {
    errors.push("regressionFixture must be an actual negative fixture or test command, not a note");
  }
  if (!/browser|live|canary|ui|playwright|deployed/i.test(contract.liveCanary)) {
    errors.push("liveCanary must prove the repair in the actual app or browser lane");
  }
  if (contract.debtReceipt && !contract.debtReceipt.expiresAt) {
    errors.push("temporary debt receipt needs expiresAt");
  }
  return { ok: errors.length === 0, errors };
}
