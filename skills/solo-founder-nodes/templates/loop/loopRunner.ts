import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loopPhases, type LoopPhase } from "../control/controlPlane";

export type PhaseRequirementId =
  | "graph-context"
  | "phase-memory"
  | "research-intake"
  | "benchmark-choice"
  | "heldout-manifest"
  | "setup-gate"
  | "agent-api-contract"
  | "design-quality"
  | "adapter-contract"
  | "official-scorer-binding"
  | "failure-hypothesis"
  | "rework-ledger"
  | "proof-verdict"
  | "fresh-room-receipt";

export type PhaseReceiptStatus = "pending" | "completed" | "blocked";

export type PhaseReceipt = {
  phase: LoopPhase;
  status: PhaseReceiptStatus;
  memoryReceiptPath?: string;
  artifacts: Partial<Record<PhaseRequirementId, string>>;
};

export type LoopRunReceipt = {
  schemaVersion: 1;
  projectPath: string;
  goal: string;
  createdAt: string;
  phases: PhaseReceipt[];
};

export type LoopRunVerification = {
  ok: boolean;
  errors: string[];
  nextPhase?: LoopPhase;
};

export const loopPhaseRequirements: Record<LoopPhase, PhaseRequirementId[]> = {
  discover: ["graph-context", "research-intake", "phase-memory"],
  benchmark: ["benchmark-choice", "heldout-manifest", "phase-memory"],
  setup: ["setup-gate", "phase-memory"],
  build: ["agent-api-contract", "design-quality", "phase-memory"],
  adapter: ["adapter-contract", "official-scorer-binding", "phase-memory"],
  verify: ["proof-verdict", "fresh-room-receipt", "design-quality", "phase-memory"],
  iterate: ["failure-hypothesis", "rework-ledger", "phase-memory"],
};

export function makeLoopRunReceipt(input: {
  projectPath: string;
  goal: string;
  createdAt?: string;
}): LoopRunReceipt {
  return {
    schemaVersion: 1,
    projectPath: input.projectPath,
    goal: input.goal,
    createdAt: input.createdAt ?? new Date().toISOString(),
    phases: loopPhases.map((phase) => ({ phase, status: "pending", artifacts: {} })),
  };
}

export function verifyLoopRunReceipt(
  receipt: LoopRunReceipt,
  options: { baseDir?: string; requireFiles?: boolean } = {},
): LoopRunVerification {
  const errors: string[] = [];
  const requireFiles = options.requireFiles ?? true;
  const baseDir = options.baseDir ?? process.cwd();
  if (receipt.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!receipt.projectPath) errors.push("projectPath is required");
  if (!receipt.goal) errors.push("goal is required");

  const byPhase = new Map(receipt.phases.map((phase) => [phase.phase, phase]));
  for (const phase of loopPhases) {
    const phaseReceipt = byPhase.get(phase);
    if (!phaseReceipt) {
      errors.push(`missing phase receipt '${phase}'`);
      continue;
    }
    if (phaseReceipt.status !== "completed") {
      errors.push(`phase '${phase}' is not completed`);
    }
    for (const requirement of loopPhaseRequirements[phase]) {
      if (requirement === "phase-memory") {
        if (!phaseReceipt.memoryReceiptPath) {
          errors.push(`phase '${phase}' missing memoryReceiptPath`);
        } else if (requireFiles && !existsRelative(baseDir, phaseReceipt.memoryReceiptPath)) {
          errors.push(`phase '${phase}' memory receipt path does not exist: ${phaseReceipt.memoryReceiptPath}`);
        }
        continue;
      }
      const path = phaseReceipt.artifacts[requirement];
      if (!path) {
        errors.push(`phase '${phase}' missing required artifact '${requirement}'`);
      } else if (requireFiles && !existsRelative(baseDir, path)) {
        errors.push(`phase '${phase}' artifact '${requirement}' path does not exist: ${path}`);
      }
      if (requirement === "proof-verdict" && path && requireFiles) {
        const verdict = readJsonIfPresent(resolve(baseDir, path));
        if (!verdict || verdict.ok !== true) {
          errors.push(`phase 'verify' proof-verdict.json must exist and contain ok=true`);
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    nextPhase: receipt.phases.find((phase) => phase.status !== "completed")?.phase,
  };
}

function existsRelative(baseDir: string, path: string) {
  return existsSync(resolve(baseDir, path));
}

function readJsonIfPresent(path: string): Record<string, unknown> | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}
