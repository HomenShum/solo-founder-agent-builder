import { existsSync } from "node:fs";
import { resolve } from "node:path";

export type FreshUserEmulationPlan = {
  schemaVersion: 1;
  caseId: string;
  persona: "nontechnical-founder";
  startingKnowledge: "fresh" | "provided-screenshot-only";
  userPrompt: string;
  githubUrl?: string;
  requiredAgentSurfaces: string[];
  requiredSetupChoices: string[];
  requiredEvidence: string[];
  stopConditions: string[];
};

export type FreshUserEmulationReceipt = FreshUserEmulationPlan & {
  actualEvidence: Record<string, string>;
  completed: boolean;
};

export type FreshUserEmulationVerdict = {
  ok: boolean;
  errors: string[];
};

export function makeFreshUserEmulationPlan(input: {
  caseId: string;
  userPrompt: string;
  githubUrl?: string;
}): FreshUserEmulationPlan {
  return {
    schemaVersion: 1,
    caseId: input.caseId,
    persona: "nontechnical-founder",
    startingKnowledge: "provided-screenshot-only",
    userPrompt: input.userPrompt,
    githubUrl: input.githubUrl,
    requiredAgentSurfaces: [
      "coding-agent-ide-or-cli",
      "actual-app-ui",
      "provider-or-self-hosted-setup-screen",
      "deployment-dashboard-or-cli",
      "browser-proof-run",
    ],
    requiredSetupChoices: [
      "database",
      "object-storage",
      "deployment-target",
      "3d-generation-lane",
      "model-provider",
      "cost-latency-budget",
    ],
    requiredEvidence: [
      "fullscreen-video",
      "terminal-transcript",
      "playwright-trace",
      "playwright-video",
      "deployed-url",
      "generated-asset",
      "export-reopen-proof",
      "setup-decision-receipt",
      "proof-verdict",
      "comparator-scorecard",
    ],
    stopConditions: [
      "missing user-owned secret after deterministic no-secret prework is complete",
      "budget exceeded",
      "unsafe download or untrusted executable",
      "proof verdict failed with receipt",
    ],
  };
}

export function verifyFreshUserEmulationReceipt(
  receipt: FreshUserEmulationReceipt,
  options: { baseDir?: string; requireFiles?: boolean } = {},
): FreshUserEmulationVerdict {
  const errors: string[] = [];
  const baseDir = options.baseDir ?? process.cwd();
  const requireFiles = options.requireFiles ?? true;
  if (receipt.schemaVersion !== 1) errors.push("fresh-user receipt schemaVersion must be 1");
  if (receipt.persona !== "nontechnical-founder") errors.push("fresh-user receipt must use nontechnical-founder persona");
  if (!receipt.userPrompt.trim()) errors.push("fresh-user receipt requires the user's prompt");
  for (const choice of receipt.requiredSetupChoices) {
    if (!receipt.actualEvidence[`choice:${choice}`]) errors.push(`missing setup choice evidence: ${choice}`);
  }
  for (const evidence of receipt.requiredEvidence) {
    const path = receipt.actualEvidence[evidence];
    if (!path) {
      errors.push(`missing fresh-user evidence: ${evidence}`);
    } else if (requireFiles && !existsSync(resolve(baseDir, path))) {
      errors.push(`fresh-user evidence path does not exist: ${evidence}:${path}`);
    }
  }
  if (receipt.completed !== true) errors.push("fresh-user receipt completed must be true");
  return { ok: errors.length === 0, errors };
}
