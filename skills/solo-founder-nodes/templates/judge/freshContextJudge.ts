import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  loadRalphLoop,
  ralphPaths,
  ralphRequiredReceipts,
  type RalphMilestone,
  type SoloLoopRun,
} from "../loop/ralphLedger";
import { readSoloEventLog } from "../events/soloEventBus";
import { judgeComponentLayer, type ComponentJudgeVerdict } from "../component-ralph/componentJudge";
import { readComponentRalphLedger } from "../component-ralph/componentRalphRunner";
import {
  directionChangedByText,
  directionPaths,
  readDirectionChangeReceipt,
  verifyDirectionChangeReceipt,
} from "../direction/directionRalph";
import { readSystemMapGraph, validateSystemMapGraph } from "../architecture/architectureGovernor";

export type FreshContextJudgeVerdictKind =
  | "done"
  | "not_done"
  | "blocked"
  | "needs_research"
  | "needs_verification";

export type FreshContextJudgeInput = {
  schemaVersion: 1;
  projectPath: string;
  initialUserGoal?: string;
  currentMilestone?: RalphMilestone;
  loop?: SoloLoopRun;
  missingReceipts: string[];
  recentEvents: Array<Record<string, unknown>>;
  proofVerdict: {
    exists: boolean;
    ok: boolean;
    status: "pass" | "fail" | "missing" | "invalid";
  };
  componentLayer: {
    exists: boolean;
    required: boolean;
    ok: boolean;
    status: ComponentJudgeVerdict["status"];
    reason: string;
    missingProofs: string[];
  };
  directionLayer: {
    required: boolean;
    exists: boolean;
    ok: boolean;
    reason: string;
    missingProofs: string[];
  };
  lastAssistantMessage?: string;
};

export type FreshContextJudgeVerdict = {
  schemaVersion: 1;
  verdict: FreshContextJudgeVerdictKind;
  confidence: number;
  currentMilestone?: RalphMilestone;
  reason: string;
  missingReceipts: string[];
  requiredNextActions: Array<{
    kind: "command" | "receipt" | "manual";
    command?: string;
    receipt?: string;
    description: string;
  }>;
  shouldContinueMainAgent: boolean;
  shouldRunResearch: boolean;
  shouldRunVerification: boolean;
  blockClaim: boolean;
};

export function makeFreshContextJudgeInput(input: {
  projectPath: string;
  initialUserGoal?: string;
  lastAssistantMessage?: string;
  eventLimit?: number;
}): FreshContextJudgeInput {
  const projectPath = resolve(input.projectPath);
  let loop: SoloLoopRun | undefined;
  let currentMilestone: RalphMilestone | undefined;
  let missingReceipts: string[] = [];
  try {
    loop = loadRalphLoop(projectPath).loop;
    currentMilestone = loop.currentMilestone;
    missingReceipts = missingReceiptsFor(projectPath, loop, currentMilestone);
  } catch {
    missingReceipts = [".solo/loop-state.json"];
  }

  const proofVerdict = readProofVerdict(projectPath);
  const recentEvents = readSoloEventLog(projectPath, input.eventLimit ?? 20);
  const componentLayer = readComponentLayer(projectPath, loop);
  const directionLayer = readDirectionLayer(projectPath, {
    initialUserGoal: input.initialUserGoal,
    lastAssistantMessage: input.lastAssistantMessage,
    recentEvents,
  });
  return {
    schemaVersion: 1,
    projectPath,
    initialUserGoal: input.initialUserGoal,
    currentMilestone,
    loop,
    missingReceipts,
    recentEvents,
    proofVerdict,
    componentLayer,
    directionLayer,
    lastAssistantMessage: input.lastAssistantMessage,
  };
}

export function judgeCurrentLoop(input: {
  projectPath: string;
  initialUserGoal?: string;
  lastAssistantMessage?: string;
  eventLimit?: number;
}): { judgeInput: FreshContextJudgeInput; verdict: FreshContextJudgeVerdict } {
  const judgeInput = makeFreshContextJudgeInput(input);
  return { judgeInput, verdict: deterministicFreshContextJudge(judgeInput) };
}

export function deterministicFreshContextJudge(input: FreshContextJudgeInput): FreshContextJudgeVerdict {
  if (!input.loop) {
    return verdict({
      kind: "blocked",
      confidence: 1,
      reason: "Missing .solo/loop-state.json; the agent has no durable RALPH location.",
      missingReceipts: input.missingReceipts,
      currentMilestone: input.currentMilestone,
      actions: [
        {
          kind: "command",
          command: 'npm run sfn -- loop init --goal "<goal>" --project .',
          description: "Initialize the RALPH loop ledger before claiming progress.",
        },
      ],
    });
  }

  const current = input.currentMilestone ?? input.loop.currentMilestone;
  if (input.loop.status === "blocked" || input.loop.milestones[current]?.status === "blocked") {
    const blocker = input.loop.milestones[current]?.blockedOn;
    return verdict({
      kind: "blocked",
      confidence: 0.98,
      currentMilestone: current,
      reason: blocker?.message ?? `Current milestone ${current} is blocked.`,
      missingReceipts: input.missingReceipts,
      actions: [
        {
          kind: "command",
          command: blocker?.nextAction ?? `npm run sfn -- loop start --from ${current} --project .`,
          description: blocker?.nextAction ?? "Resume the current blocked milestone.",
        },
      ],
    });
  }

  if ((input.directionLayer.required || input.directionLayer.exists) && input.directionLayer.ok !== true) {
    return verdict({
      kind: "needs_research",
      confidence: 0.98,
      currentMilestone: current,
      reason: input.directionLayer.reason,
      missingReceipts: input.directionLayer.missingProofs,
      actions: [
        {
          kind: "command",
          command: 'npm run sfn -- direction intake --file <inspiration-or-user-message> --project .',
          description: "Classify the direction-changing input before editing further.",
        },
        {
          kind: "command",
          command: 'npm run sfn -- direction propose --goal "<updated goal>" --project .',
          description: "Write the Direction RALPH proposal with old/new direction and proof obligations.",
        },
        {
          kind: "command",
          command: "npm run sfn -- direction decide --pivot pivot-001 --decision accepted --project .",
          description: "Record the user-level Adopt/Adapt/Park/Reject decision.",
        },
        {
          kind: "command",
          command: "npm run sfn -- direction apply --pivot pivot-001 --project .",
          description: "Write the direction-change receipt and reroute the parent loop.",
        },
      ],
    });
  }

  if (input.missingReceipts.length > 0) {
    return verdict({
      kind: current === "R" ? "needs_research" : current === "P" ? "needs_verification" : "not_done",
      confidence: 0.96,
      currentMilestone: current,
      reason: `Current milestone ${current} is missing required receipts: ${input.missingReceipts.join(", ")}`,
      missingReceipts: input.missingReceipts,
      actions: input.missingReceipts.map((receipt) => ({
        kind: "receipt",
        receipt,
        description: `Create or verify required receipt ${receipt}.`,
      })),
    });
  }

  if (["L", "P", "H"].includes(current) && input.componentLayer.required && input.componentLayer.ok !== true) {
    return verdict({
      kind: "not_done",
      confidence: 0.97,
      currentMilestone: current,
      reason: input.componentLayer.reason,
      missingReceipts: input.componentLayer.missingProofs,
      actions: [
        {
          kind: "command",
          command: input.componentLayer.exists
            ? "npm run sfn -- component proof --all --project ."
            : 'npm run sfn -- component init --domain <domain> --goal "<goal>" --project .',
          description: "Complete required nested Component RALPH proofs before claiming the parent loop is done.",
        },
      ],
    });
  }

  if (current === "P" && input.proofVerdict.ok !== true) {
    return verdict({
      kind: "needs_verification",
      confidence: 0.99,
      currentMilestone: current,
      reason: "Proof milestone cannot complete until .solo/proof-verdict.json exists and contains ok=true.",
      missingReceipts: [".solo/proof-verdict.json"],
      actions: [
        {
          kind: "command",
          command: "npm run sfn -- proof verdict --run <proof-run-dir>",
          description: "Run the proof verdict command and copy/pass the verdict into .solo/proof-verdict.json.",
        },
      ],
    });
  }

  const lastMessageLooksDone = /\b(done|complete|finished|shipped|verified)\b/i.test(input.lastAssistantMessage ?? "");
  const status = input.loop.milestones[current]?.status;
  if (status !== "completed" && lastMessageLooksDone) {
    return verdict({
      kind: "not_done",
      confidence: 0.9,
      currentMilestone: current,
      reason: `Assistant claimed completion, but milestone ${current} is still '${status}'.`,
      missingReceipts: [],
      actions: [
        {
          kind: "command",
          command: `npm run sfn -- loop complete --milestone ${current} --receipt <receipt> --project .`,
          description: "Complete the milestone only with concrete receipts.",
        },
      ],
    });
  }

  const isFinalDone = current === "H" && input.loop.status === "completed";
  return {
    schemaVersion: 1,
    verdict: isFinalDone ? "done" : "not_done",
    confidence: 0.88,
    currentMilestone: current,
    reason: isFinalDone
      ? "All RALPH milestones are complete and proof state is acceptable."
      : `Milestone ${current} has its deterministic receipts; advance or run semantic review if the claim is high-risk.`,
    missingReceipts: [],
    requiredNextActions: isFinalDone
      ? []
      : [
          {
            kind: "command",
            command: `npm run sfn -- loop start --from ${nextMilestone(current)} --project .`,
            description: "Advance to the next RALPH milestone when appropriate.",
          },
        ],
    shouldContinueMainAgent: !isFinalDone,
    shouldRunResearch: false,
    shouldRunVerification: false,
    blockClaim: !isFinalDone,
  };
}

function verdict(input: {
  kind: FreshContextJudgeVerdictKind;
  confidence: number;
  currentMilestone?: RalphMilestone;
  reason: string;
  missingReceipts: string[];
  actions: FreshContextJudgeVerdict["requiredNextActions"];
}): FreshContextJudgeVerdict {
  return {
    schemaVersion: 1,
    verdict: input.kind,
    confidence: input.confidence,
    currentMilestone: input.currentMilestone,
    reason: input.reason,
    missingReceipts: input.missingReceipts,
    requiredNextActions: input.actions,
    shouldContinueMainAgent: true,
    shouldRunResearch: input.kind === "needs_research",
    shouldRunVerification: input.kind === "needs_verification",
    blockClaim: true,
  };
}

function readDirectionLayer(projectPath: string, input: {
  initialUserGoal?: string;
  lastAssistantMessage?: string;
  recentEvents: Array<Record<string, unknown>>;
}): FreshContextJudgeInput["directionLayer"] {
  const text = [
    input.initialUserGoal,
    input.lastAssistantMessage,
    ...input.recentEvents.map((event) => [
      event.event,
      event.message,
      event.command,
      event.receiptPath,
    ].filter(Boolean).join(" ")),
  ].filter(Boolean).join("\n");
  const required = directionChangedByText(text);
  const receipt = readDirectionChangeReceipt(projectPath);
  const exists = !!receipt;
  const missingProofs: string[] = [];
  if (required && !receipt) missingProofs.push(".solo/receipts/R/direction-change-receipt.json");
  const receiptVerdict = receipt ? verifyDirectionChangeReceipt(receipt) : { ok: !required, errors: [] as string[] };
  for (const error of receiptVerdict.errors) missingProofs.push(`direction-receipt:${error}`);

  const paths = directionPaths(projectPath, receipt?.pivotId ?? "pivot-001");
  const systemMapOk = readSystemMapVerdict(paths.systemMapPath);
  if ((required || exists) && !systemMapOk.ok) missingProofs.push("docs/system-map.graph.json");
  const researchBriefOk = [
    paths.researchBriefPath,
    paths.researchBriefPath.replace(/\.md$/, ".json"),
    join(projectPath, "docs", "research", "briefs", "3d-asset-pipeline-brief.json"),
    join(projectPath, "docs", "research", "briefs", "generic-product-brief.json"),
    join(projectPath, "docs", "research", "briefs", "direction-change.json"),
  ].some((path) => existsSync(path));
  if ((required || exists) && !researchBriefOk) missingProofs.push("docs/research/briefs/direction-change.{md,json}");

  const ok = (!required && !exists) || (exists && receiptVerdict.ok && systemMapOk.ok && researchBriefOk);
  return {
    required,
    exists,
    ok,
    reason: ok
      ? "Direction layer is satisfied or not required."
      : required
        ? "Direction-changing input requires Direction RALPH, Research Governor, and Architecture Governor receipts before completion claims count."
        : "A direction receipt exists but its dependent research or architecture receipts are incomplete.",
    missingProofs: [...new Set(missingProofs)],
  };
}

function readSystemMapVerdict(path: string) {
  if (!existsSync(path)) return { ok: false };
  try {
    return validateSystemMapGraph(readSystemMapGraph(path));
  } catch {
    return { ok: false };
  }
}

function readComponentLayer(projectPath: string, loop?: SoloLoopRun): FreshContextJudgeInput["componentLayer"] {
  const ledger = readComponentRalphLedger(projectPath);
  const result = judgeComponentLayer({
    projectPath,
    ledger,
    goal: loop?.goal,
    requireFiles: true,
    requireCompleted: true,
  });
  return {
    exists: !!ledger,
    required: result.status !== "not_required",
    ok: result.ok,
    status: result.status,
    reason: result.reason,
    missingProofs: result.missingProofs,
  };
}

function missingReceiptsFor(projectPath: string, loop: SoloLoopRun, milestone: RalphMilestone): string[] {
  const paths = ralphPaths(projectPath);
  const state = loop.milestones[milestone];
  const missing: string[] = [];
  for (const receipt of ralphRequiredReceipts[milestone]) {
    const present = state.receipts.some((receiptPath) => receiptPath.includes(receipt) && existsSync(resolve(paths.soloDir, receiptPath)));
    if (!present) missing.push(`${milestone}:${receipt}`);
  }
  if (milestone === "P" && !readProofVerdict(projectPath).ok) missing.push("P:proof-verdict-ok");
  return missing;
}

function readProofVerdict(projectPath: string): FreshContextJudgeInput["proofVerdict"] {
  const path = ralphPaths(projectPath).proofVerdictPath;
  if (!existsSync(path)) return { exists: false, ok: false, status: "missing" };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { ok?: unknown };
    return { exists: true, ok: parsed.ok === true, status: parsed.ok === true ? "pass" : "fail" };
  } catch {
    return { exists: true, ok: false, status: "invalid" };
  }
}

function nextMilestone(current: RalphMilestone): RalphMilestone {
  const order: RalphMilestone[] = ["R", "A", "L", "P", "H"];
  return order[Math.min(order.length - 1, order.indexOf(current) + 1)] ?? current;
}
