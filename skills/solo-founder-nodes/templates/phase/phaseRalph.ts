import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { loopPhases, type LoopPhase } from "../control/controlPlane";
import { ralphMilestones, ralphPaths, type RalphMilestone } from "../loop/ralphLedger";

export type PhaseRalphStage = RalphMilestone;

export type PhaseRalphGate = {
  phase: LoopPhase;
  stage: PhaseRalphStage;
  label: string;
  requiredReceipts: string[];
  purpose: string;
};

export type PhaseRalphVerification = {
  ok: boolean;
  phase: LoopPhase;
  stage?: PhaseRalphStage;
  checked: PhaseRalphGate[];
  missing: string[];
  errors: string[];
  nextCommand: string;
};

export type PhaseRouteTarget = Exclude<LoopPhase, "iterate"> | "verify";

export type PhaseFailureRouteReceipt = {
  schemaVersion: 1;
  fromPhase: "verify";
  toPhase: PhaseRouteTarget;
  reason: string;
  evidenceRefs: string[];
  createdAt: string;
};

const gate = (
  phase: LoopPhase,
  stage: PhaseRalphStage,
  label: string,
  purpose: string,
  requiredReceipts: string[],
): PhaseRalphGate => ({ phase, stage, label, purpose, requiredReceipts });

export const phaseRalphGates: Record<LoopPhase, PhaseRalphGate[]> = {
  discover: [
    gate("discover", "R", "Reality", "Parse the real user need and current repo/app state.", ["user-need-intake", "screenshot-prompt-intake"]),
    gate("discover", "A", "Acceptance", "Freeze what discover must prove before benchmark selection.", ["capability-spec"]),
    gate("discover", "L", "Live substrate", "Attach the orientation and research substrate.", ["graph-context", "research-spine"]),
    gate("discover", "P", "Proof", "Prove claims are not silently over-scoped.", ["unsupported-claim-labels"]),
    gate("discover", "H", "Harden", "Persist safe memory for resume.", ["phase-memory"]),
  ],
  benchmark: [
    gate("benchmark", "R", "Reality", "Compare candidate benchmark families to the product deliverable.", ["benchmark-candidates"]),
    gate("benchmark", "A", "Acceptance", "Commit the benchmark and rubric.", ["benchmark-choice", "scorecard-rubric"]),
    gate("benchmark", "L", "Live substrate", "Bind scorer and baseline run.", ["scorer-binding", "baseline-run"]),
    gate("benchmark", "P", "Proof", "Freeze held-out and contamination guards.", ["heldout-split-policy", "contamination-guard"]),
    gate("benchmark", "H", "Harden", "Persist benchmark decisions without answer contents.", ["phase-memory"]),
  ],
  setup: [
    gate("setup", "R", "Reality", "Choose first-party, provider, storage, and deployment constraints.", ["provider-selfhosted-matrix"]),
    gate("setup", "A", "Acceptance", "Record DB/storage/deployment decisions and required secrets.", ["db-storage-deploy-decision"]),
    gate("setup", "L", "Live substrate", "Finish deterministic no-secret setup work.", ["env-contract", "no-secret-prework"]),
    gate("setup", "P", "Proof", "Prove missing-secret paths are safe and resumable.", ["missing-secret-ui", "blocked-path-test"]),
    gate("setup", "H", "Harden", "Persist cost/latency shape and resume commands.", ["cost-latency-ledger", "resume-command", "phase-memory"]),
  ],
  build: [
    gate("build", "R", "Reality", "Read implementation decisions and design constraints before code.", ["implementation-decisions"]),
    gate("build", "A", "Acceptance", "Freeze product/API/design acceptance before mutation.", ["design-brief", "agent-api-contract"]),
    gate("build", "L", "Live substrate", "Build the real app surface and action protocol.", ["app-ui", "ai-chat-component", "typed-action-protocol"]),
    gate("build", "P", "Proof", "Prove UI quality, agent chat workspace UX, 3D asset quality, and research-backed decisions.", ["design-quality", "agent-chat-ux", "asset-quality", "research-backed-decision-receipts"]),
    gate("build", "H", "Harden", "Persist build decisions and remaining stubs.", ["phase-memory"]),
  ],
  adapter: [
    gate("adapter", "R", "Reality", "Identify the product/harness boundary.", ["adapter-boundary"]),
    gate("adapter", "A", "Acceptance", "Freeze schemas and scorer contract.", ["tool-call-schema", "scorer-adapter"]),
    gate("adapter", "L", "Live substrate", "Wire the coding-agent/NodeAgent bridge.", ["nodeagent-coding-agent-bridge"]),
    gate("adapter", "P", "Proof", "Prove model-in-loop transport, not replay.", ["transport-model-in-loop-proof"]),
    gate("adapter", "H", "Harden", "Persist adapter provenance.", ["phase-memory"]),
  ],
  verify: [
    gate("verify", "R", "Reality", "Open the live target in a fresh room.", ["live-ui-target", "fresh-room-receipt"]),
    gate("verify", "A", "Acceptance", "Freeze proof manifest before collection.", ["proof-manifest"]),
    gate("verify", "L", "Live substrate", "Capture real proof artifacts.", ["playwright-trace", "fullscreen-video", "deployed-url", "generated-artifact", "export-reopen-proof"]),
    gate("verify", "P", "Proof", "Produce independent verdict plus visual/design/agent-chat/asset-quality proof.", ["proof-verdict", "design-quality", "agent-chat-ux", "asset-quality", "recording-audit"]),
    gate("verify", "H", "Harden", "Route failures for iteration and persist safe memory.", ["failure-route", "phase-memory"]),
  ],
  iterate: [
    gate("iterate", "R", "Reality", "Consume verified failures only.", ["verified-failure-evidence"]),
    gate("iterate", "A", "Acceptance", "Write the hypothesis and expected metric movement.", ["failure-hypothesis"]),
    gate("iterate", "L", "Live substrate", "Apply one shared routed fix.", ["routed-phase-fix", "rework-ledger"]),
    gate("iterate", "P", "Proof", "Re-run Phase 6 proof after the fix.", ["reverification-receipt"]),
    gate("iterate", "H", "Harden", "Quarantine memory and preserve lessons.", ["memory-quarantine", "phase-memory"]),
  ],
};

export function assertLoopPhase(value: string): LoopPhase {
  if (loopPhases.includes(value as LoopPhase)) return value as LoopPhase;
  throw new Error(`unsupported loop phase '${value}' (expected one of: ${loopPhases.join(", ")})`);
}

export function assertPhaseRalphStage(value: string): PhaseRalphStage {
  if (ralphMilestones.includes(value as PhaseRalphStage)) return value as PhaseRalphStage;
  throw new Error(`unsupported phase RALPH stage '${value}' (expected one of: ${ralphMilestones.join(", ")})`);
}

export function phaseRalphReceiptPath(repoPath: string, phase: LoopPhase, stage: PhaseRalphStage, receiptId: string) {
  return join(ralphPaths(repoPath).soloDir, "phase-ralph", phase, stage, `${receiptId}.json`);
}

export function completePhaseRalphReceipt(repoPath: string, input: {
  phase: LoopPhase;
  stage: PhaseRalphStage;
  receiptId: string;
  payload?: Record<string, unknown>;
}) {
  const path = phaseRalphReceiptPath(repoPath, input.phase, input.stage, input.receiptId);
  mkdirSync(dirname(path), { recursive: true });
  const payload = {
    schemaVersion: 1,
    phase: input.phase,
    stage: input.stage,
    receiptId: input.receiptId,
    createdAt: new Date().toISOString(),
    ...(input.payload ?? {}),
  };
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return { path, payload };
}

export function verifyPhaseRalph(repoPath: string, phase: LoopPhase, stage?: PhaseRalphStage): PhaseRalphVerification {
  const gates = phaseRalphGates[phase].filter((gate) => !stage || gate.stage === stage);
  const missing: string[] = [];
  for (const gate of gates) {
    for (const receipt of gate.requiredReceipts) {
      if (!hasPhaseReceipt(repoPath, gate.phase, gate.stage, receipt)) missing.push(`${gate.phase}.${gate.stage}:${receipt}`);
    }
  }
  return {
    ok: missing.length === 0,
    phase,
    stage,
    checked: gates,
    missing,
    errors: missing.map((receipt) => `missing phase RALPH receipt: ${receipt}`),
    nextCommand: missing.length
      ? `npm run sfn -- phase complete --phase ${phase} --stage ${firstMissingStage(missing, stage)} --receipt <id> --project .`
      : `npm run sfn -- phase status --phase ${phase} --project .`,
  };
}

export function makePhaseFailureRouteReceipt(input: {
  toPhase: PhaseRouteTarget;
  reason: string;
  evidenceRefs?: string[];
  createdAt?: string;
}): PhaseFailureRouteReceipt {
  return {
    schemaVersion: 1,
    fromPhase: "verify",
    toPhase: input.toPhase,
    reason: input.reason,
    evidenceRefs: input.evidenceRefs ?? [],
    createdAt: input.createdAt ?? new Date().toISOString(),
  };
}

function hasPhaseReceipt(repoPath: string, phase: LoopPhase, stage: PhaseRalphStage, receiptId: string) {
  const paths = ralphPaths(repoPath);
  const candidates = [
    phaseRalphReceiptPath(repoPath, phase, stage, receiptId),
    join(paths.soloDir, "receipts", phase, `${receiptId}.json`),
    join(paths.soloDir, "receipts", phase, `${receiptId}.md`),
    join(paths.soloDir, "receipts", `${phase}-${receiptId}.json`),
    join(paths.soloDir, "receipts", `${receiptId}.json`),
    join(paths.soloDir, `${receiptId}.json`),
  ].map((path) => resolve(path));
  return candidates.some((path) => existsSync(path));
}

function firstMissingStage(missing: string[], fallback?: PhaseRalphStage) {
  if (fallback) return fallback;
  const first = missing[0]?.split(".")[1]?.split(":")[0];
  return ralphMilestones.includes(first as PhaseRalphStage) ? first : "R";
}
