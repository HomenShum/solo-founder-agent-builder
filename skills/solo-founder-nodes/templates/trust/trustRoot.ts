export type TrustRootReceipt = {
  schemaVersion: 1;
  runId: string;
  heldOutSealOwner: "ci" | "human" | "trust-root-service";
  scorerOwner: "ci" | "human" | "trust-root-service";
  verdictOwner: "ci" | "human" | "trust-root-service";
  agentCanReadSalt: boolean;
  agentCanWriteVerdict: boolean;
  signedArtifacts: string[];
  verifierCommand: string;
  createdAt: string;
};

export type TrustRootVerdict = {
  ok: boolean;
  errors: string[];
};

export function makeTrustRootReceipt(input: {
  runId: string;
  verifierCommand: string;
  signedArtifacts?: string[];
  createdAt?: string;
}): TrustRootReceipt {
  return {
    schemaVersion: 1,
    runId: input.runId,
    heldOutSealOwner: "ci",
    scorerOwner: "ci",
    verdictOwner: "ci",
    agentCanReadSalt: false,
    agentCanWriteVerdict: false,
    signedArtifacts: input.signedArtifacts ?? [],
    verifierCommand: input.verifierCommand,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function verifyTrustRootReceipt(receipt: TrustRootReceipt): TrustRootVerdict {
  const errors: string[] = [];
  if (receipt.schemaVersion !== 1) errors.push("trust-root receipt schemaVersion must be 1");
  if (!receipt.runId.trim()) errors.push("trust-root receipt requires runId");
  if (!receipt.verifierCommand.trim()) errors.push("trust-root receipt requires verifierCommand");
  if (receipt.agentCanReadSalt) errors.push("agent must not be able to read the held-out seal salt");
  if (receipt.agentCanWriteVerdict) errors.push("agent must not be able to write the final verdict");
  for (const [field, value] of Object.entries({
    heldOutSealOwner: receipt.heldOutSealOwner,
    scorerOwner: receipt.scorerOwner,
    verdictOwner: receipt.verdictOwner,
  })) {
    if (value !== "ci" && value !== "human" && value !== "trust-root-service") {
      errors.push(`${field} must be outside the agent process`);
    }
  }
  if (receipt.signedArtifacts.length === 0) errors.push("trust-root receipt requires at least one signed artifact");
  return { ok: errors.length === 0, errors };
}
