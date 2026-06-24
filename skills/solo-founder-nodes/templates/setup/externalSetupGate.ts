export const defaultDeterministicPrework = [
  "adapter-boundary",
  "ai-chat-component",
  "chat-action-protocol",
  "provider-selfhosted-matrix",
  "database-storage-decision",
  "deployment-target",
  "server-side-secret-boundary",
  "missing-secret-ui",
  "blocked-path-test",
  "cost-latency-ledger",
  "setup-doc",
  "resume-command",
] as const;

export type DeterministicPrework = (typeof defaultDeterministicPrework)[number];

export interface ExternalSetupGateReceipt {
  schemaVersion: 1;
  goal: string;
  provider: string;
  requiredSecrets: string[];
  setupUrls: string[];
  completedPrework: string[];
  missingPrework: string[];
  humanInstructions: string[];
  resumeCommands: string[];
  status: "prework_incomplete" | "waiting_on_human";
  createdAt: string;
}

export interface ExternalSetupGateInput {
  goal: string;
  provider: string;
  requiredSecrets: string[];
  setupUrls?: string[];
  completedPrework?: string[];
  resumeCommands?: string[];
  createdAt?: string;
}

export interface ExternalSetupGateVerdict {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export function makeExternalSetupGateReceipt(input: ExternalSetupGateInput): ExternalSetupGateReceipt {
  const completed = [...new Set(input.completedPrework ?? [])];
  const missing = defaultDeterministicPrework.filter((item) => !completed.includes(item));
  const requiredSecrets = [...new Set(input.requiredSecrets.map((secret) => secret.trim()).filter(Boolean))];
  return {
    schemaVersion: 1,
    goal: input.goal,
    provider: input.provider,
    requiredSecrets,
    setupUrls: [...new Set(input.setupUrls ?? [])],
    completedPrework: completed,
    missingPrework: missing,
  humanInstructions: [
      `Create or select the ${input.provider} account outside the chat session.`,
      `Add the server-side secret(s): ${requiredSecrets.join(", ") || "<missing env name>"}.`,
      "Confirm the database, object storage, deployment target, and self-hosted/provider fallback policy.",
      "Do not paste API keys into chat, logs, client-side environment variables, or screenshots.",
      "After the secret is installed, run the resume command(s) and collect provider cost/latency proof.",
    ],
    resumeCommands: input.resumeCommands ?? [],
    status: missing.length === 0 ? "waiting_on_human" : "prework_incomplete",
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

export function verifyExternalSetupGateReceipt(receipt: ExternalSetupGateReceipt): ExternalSetupGateVerdict {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (receipt.schemaVersion !== 1) errors.push("external setup receipt schemaVersion must be 1");
  if (!receipt.goal.trim()) errors.push("external setup receipt requires a goal");
  if (!receipt.provider.trim()) errors.push("external setup receipt requires a provider");
  if (receipt.requiredSecrets.length === 0) errors.push("external setup receipt requires at least one server-side secret env name");
  for (const secret of receipt.requiredSecrets) {
    if (!/^[A-Z][A-Z0-9_]*$/.test(secret)) errors.push(`secret '${secret}' must be an uppercase server env var name`);
    if (/^(VITE_|NEXT_PUBLIC_|PUBLIC_)/.test(secret)) {
      errors.push(`secret '${secret}' is client-exposed; provider keys must be server-side only`);
    }
  }
  if (receipt.setupUrls.length === 0) warnings.push("no provider setup URL recorded");
  if (receipt.resumeCommands.length === 0) errors.push("external setup receipt requires at least one resume command");

  const completed = new Set(receipt.completedPrework);
  for (const item of defaultDeterministicPrework) {
    if (!completed.has(item)) errors.push(`deterministic prework missing: ${item}`);
  }
  if (receipt.status === "waiting_on_human" && receipt.missingPrework.length > 0) {
    errors.push("status cannot be waiting_on_human while deterministic prework is missing");
  }
  if (receipt.status === "prework_incomplete" && receipt.missingPrework.length === 0) {
    errors.push("status cannot be prework_incomplete after all deterministic prework is complete");
  }

  return { ok: errors.length === 0, errors, warnings };
}
