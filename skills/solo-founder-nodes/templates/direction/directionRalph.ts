import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const directionRalphStages = ["R", "A", "L", "P", "H"] as const;
export type DirectionRalphStage = (typeof directionRalphStages)[number];

export const directionChangeTriggerPattern =
  /\b(change direction|instead of|not integrate|make our own|oss|open[- ]source|learn from|gold standard|new architecture|new pipeline|replace|pivot|rethink|north star|spline|emergent|bruno simon|igloo|architecture governor|research governor|proof registry)\b/i;

export const directionBuckets = [
  "product-direction",
  "technical-architecture",
  "visual-interaction-quality",
  "proof-eval-direction",
  "agent-process-direction",
  "risk-constraint",
] as const;
export type DirectionBucket = (typeof directionBuckets)[number];

export const directionOutcomes = ["adopt", "adapt", "park", "reject"] as const;
export type DirectionOutcome = (typeof directionOutcomes)[number];

export const directionQualityTiers = ["T0", "T1", "T2", "T3", "T4", "T5"] as const;
export type DirectionQualityTier = (typeof directionQualityTiers)[number];

export type DirectionIntakeItem = {
  id: string;
  bucket: DirectionBucket;
  inspiration: string;
  interpretation: string;
  outcome: DirectionOutcome;
  affects: string[];
  risk: string;
};

export type DirectionIntake = {
  schemaVersion: 1;
  pivotId: string;
  createdAt: string;
  sourceText: string;
  changedDirection: boolean;
  triggerTerms: string[];
  items: DirectionIntakeItem[];
};

export type DirectionProposal = {
  schemaVersion: 1;
  pivotId: string;
  status: "proposed";
  createdAt: string;
  oldDirection: string;
  proposedDirection: string;
  reason: string;
  targetQualityTier: DirectionQualityTier;
  directionRalph: Record<DirectionRalphStage, {
    question: string;
    requiredReceipts: string[];
    proofObligations: string[];
  }>;
  adoptedItems: string[];
  adaptedItems: string[];
  parkedItems: string[];
  rejectedItems: string[];
  requiredUpdates: {
    researchSpine: true;
    systemMapGraph: true;
    proofRegistry: true;
    componentRalphLedger: true;
    architectureGovernor: true;
    researchGovernor: true;
    freshContextJudge: true;
  };
  newRequiredReceipts: string[];
  invalidatedReceipts: string[];
  nonClaims: string[];
};

export type DirectionDecision = {
  schemaVersion: 1;
  pivotId: string;
  decision: "accepted" | "parked" | "rejected";
  decidedAt: string;
  decidedBy: "user" | "agent-with-user-policy";
  rationale: string;
  resumeCommand: string;
};

export type DirectionImpact = {
  schemaVersion: 1;
  pivotId: string;
  status: "accepted" | "parked" | "rejected";
  oldDirection: string;
  newDirection: string;
  affectedMilestones: DirectionRalphStage[];
  invalidatedReceipts: string[];
  newRequiredReceipts: string[];
  decision: string;
};

export type DirectionChangeReceipt = DirectionImpact & {
  schema: 1;
  why: string;
};

export type DirectionVerdict = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function directionPaths(projectPath: string, pivotId = "pivot-001") {
  const project = resolve(projectPath);
  return {
    directionDir: join(project, ".solo", "direction"),
    intakePath: join(project, ".solo", "direction", `${pivotId}.intake.md`),
    proposalPath: join(project, ".solo", "direction", `${pivotId}.proposal.json`),
    decisionPath: join(project, ".solo", "direction", `${pivotId}.decision.md`),
    impactPath: join(project, ".solo", "direction", `${pivotId}.impact.json`),
    directionReceiptPath: join(project, ".solo", "receipts", "R", "direction-change-receipt.json"),
    researchBriefPath: join(project, "docs", "research", "briefs", "direction-change.md"),
    adrPath: join(project, "docs", "adr", `0008-${pivotId}-direction-change.md`),
    systemMapPath: join(project, "docs", "system-map.graph.json"),
  };
}

export function directionChangedByText(text: string): boolean {
  return directionChangeTriggerPattern.test(text);
}

export function makeDirectionIntake(input: {
  sourceText: string;
  pivotId?: string;
  createdAt?: string;
}): DirectionIntake {
  const sourceText = input.sourceText.trim();
  const triggerTerms = extractTriggerTerms(sourceText);
  return {
    schemaVersion: 1,
    pivotId: input.pivotId ?? "pivot-001",
    createdAt: input.createdAt ?? new Date().toISOString(),
    sourceText,
    changedDirection: triggerTerms.length > 0 || directionChangeTriggerPattern.test(sourceText),
    triggerTerms,
    items: classifyDirectionItems(sourceText),
  };
}

export function makeDirectionProposal(input: {
  goal: string;
  intake: DirectionIntake;
  oldDirection?: string;
  proposedDirection?: string;
  targetQualityTier?: DirectionQualityTier;
  createdAt?: string;
}): DirectionProposal {
  const oldDirection = input.oldDirection ?? "Current product direction before this inspiration intake.";
  const pivotId = input.intake.pivotId;
  const proposedDirection =
    input.proposedDirection ??
    input.goal ??
    "Updated product direction from accepted direction-change inspiration.";
  return {
    schemaVersion: 1,
    pivotId,
    status: "proposed",
    createdAt: input.createdAt ?? new Date().toISOString(),
    oldDirection,
    proposedDirection,
    reason: `Direction-changing inspiration detected: ${input.intake.triggerTerms.join(", ") || "semantic direction shift"}.`,
    targetQualityTier: input.targetQualityTier ?? inferQualityTier(input.intake.sourceText),
    directionRalph: {
      R: {
        question: "What direction is the user actually changing?",
        requiredReceipts: [`.solo/direction/${pivotId}.intake.md`, "docs/research/briefs/direction-change.md"],
        proofObligations: ["classified inspiration buckets", "old vs new direction", "non-claims"],
      },
      A: {
        question: "What acceptance bar proves the new direction is real?",
        requiredReceipts: [`.solo/direction/${pivotId}.proposal.json`, ".solo/ledgers/component-ralph.json"],
        proofObligations: ["target quality tier", "proof registry entries", "component RALPH gate list"],
      },
      L: {
        question: "What live code/tool/architecture changes are required?",
        requiredReceipts: ["docs/system-map.graph.json", "docs/adr/0008-pivot-to-direction-change.md"],
        proofObligations: ["architecture graph updated", "implementation surfaces named", "affected milestones listed"],
      },
      P: {
        question: "Can the new direction run in the real app UI and produce artifacts?",
        requiredReceipts: [".solo/proof-verdict.json", ".solo/receipts/P/proof-registry.json"],
        proofObligations: ["browser proof", "export/reopen proof where relevant", "performance or quality receipt where claimed"],
      },
      H: {
        question: "What old direction is deprecated, and what survives as memory?",
        requiredReceipts: [".solo/rework-ledger.md", `.solo/direction/${pivotId}.impact.json`],
        proofObligations: ["invalidated receipts recorded", "rework lesson saved", "fresh judge rerun"],
      },
    },
    adoptedItems: input.intake.items.filter((item) => item.outcome === "adopt").map((item) => item.id),
    adaptedItems: input.intake.items.filter((item) => item.outcome === "adapt").map((item) => item.id),
    parkedItems: input.intake.items.filter((item) => item.outcome === "park").map((item) => item.id),
    rejectedItems: input.intake.items.filter((item) => item.outcome === "reject").map((item) => item.id),
    requiredUpdates: {
      researchSpine: true,
      systemMapGraph: true,
      proofRegistry: true,
      componentRalphLedger: true,
      architectureGovernor: true,
      researchGovernor: true,
      freshContextJudge: true,
    },
    newRequiredReceipts: [
      ".solo/receipts/R/direction-change-receipt.json",
      "docs/research/briefs/direction-change.md",
      "docs/system-map.graph.json",
      ".solo/ledgers/component-ralph.json",
      ".solo/proof-verdict.json",
      ".solo/receipts/P/proof-registry.json",
    ],
    invalidatedReceipts: [".solo/receipts/A/old-acceptance-bar.json"],
    nonClaims: [
      "Inspiration does not grant permission to copy proprietary product assets.",
      "A new direction is not implemented until live UI proof and required receipts pass.",
      "Industry-grade claims require explicit quality-tier and component proof receipts.",
    ],
  };
}

export function makeDirectionDecision(input: {
  pivotId: string;
  decision: DirectionDecision["decision"];
  rationale?: string;
  decidedAt?: string;
  decidedBy?: DirectionDecision["decidedBy"];
}): DirectionDecision {
  return {
    schemaVersion: 1,
    pivotId: input.pivotId,
    decision: input.decision,
    decidedAt: input.decidedAt ?? new Date().toISOString(),
    decidedBy: input.decidedBy ?? "user",
    rationale: input.rationale ?? `Direction pivot ${input.decision}.`,
    resumeCommand: input.decision === "accepted"
      ? "npm run sfn -- loop start --from R --project ."
      : "npm run sfn -- loop resume --project .",
  };
}

export function makeDirectionImpact(input: {
  proposal: DirectionProposal;
  decision: DirectionDecision;
}): DirectionImpact {
  return {
    schemaVersion: 1,
    pivotId: input.proposal.pivotId,
    status: input.decision.decision,
    oldDirection: input.proposal.oldDirection,
    newDirection: input.decision.decision === "accepted" ? input.proposal.proposedDirection : input.proposal.oldDirection,
    affectedMilestones: directionRalphStages.slice(),
    invalidatedReceipts: input.decision.decision === "accepted" ? input.proposal.invalidatedReceipts : [],
    newRequiredReceipts: input.decision.decision === "accepted" ? input.proposal.newRequiredReceipts : [],
    decision: input.decision.decision === "accepted"
      ? "restart from R with prior work archived into rework ledger"
      : `pivot ${input.decision.decision}; keep old direction and park the proposal`,
  };
}

export function makeDirectionChangeReceipt(input: {
  proposal: DirectionProposal;
  decision: DirectionDecision;
}): DirectionChangeReceipt {
  const impact = makeDirectionImpact(input);
  return {
    schema: 1,
    ...impact,
    why: input.proposal.reason,
  };
}

export function verifyDirectionProposal(proposal: DirectionProposal): DirectionVerdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (proposal.schemaVersion !== 1) errors.push("direction proposal schemaVersion must be 1");
  if (!proposal.pivotId) errors.push("direction proposal requires pivotId");
  if (!proposal.oldDirection || !proposal.proposedDirection) errors.push("direction proposal requires oldDirection and proposedDirection");
  if (!directionQualityTiers.includes(proposal.targetQualityTier)) errors.push("direction proposal requires valid targetQualityTier");
  for (const stage of directionRalphStages) {
    const receipt = proposal.directionRalph?.[stage];
    if (!receipt) errors.push(`direction proposal missing Direction RALPH stage ${stage}`);
    else {
      if (receipt.requiredReceipts.length < 1) errors.push(`direction stage ${stage} requires receipts`);
      if (receipt.proofObligations.length < 1) errors.push(`direction stage ${stage} requires proof obligations`);
    }
  }
  if (!proposal.requiredUpdates?.researchSpine) errors.push("direction proposal must update research spine");
  if (!proposal.requiredUpdates?.systemMapGraph) errors.push("direction proposal must update system map graph");
  if (!proposal.requiredUpdates?.proofRegistry) errors.push("direction proposal must update proof registry");
  if (!proposal.requiredUpdates?.freshContextJudge) errors.push("direction proposal must rerun fresh-context judge");
  if (proposal.newRequiredReceipts.length < 4) errors.push("direction proposal needs concrete new required receipts");
  if (proposal.nonClaims.length < 2) warnings.push("direction proposal should include non-claims");
  return { ok: errors.length === 0, errors, warnings };
}

export function verifyDirectionChangeReceipt(receipt: DirectionChangeReceipt): DirectionVerdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (receipt.schema !== 1 || receipt.schemaVersion !== 1) errors.push("direction-change receipt requires schema=1 and schemaVersion=1");
  if (!receipt.pivotId) errors.push("direction-change receipt requires pivotId");
  if (!["accepted", "parked", "rejected"].includes(receipt.status)) errors.push("direction-change receipt status must be accepted/parked/rejected");
  if (receipt.status === "accepted") {
    if (receipt.oldDirection === receipt.newDirection) errors.push("accepted direction change must change oldDirection -> newDirection");
    if (receipt.affectedMilestones.length !== directionRalphStages.length) errors.push("accepted direction change must affect all RALPH milestones");
    if (receipt.newRequiredReceipts.length < 4) errors.push("accepted direction change requires newRequiredReceipts");
  }
  if (!receipt.why) warnings.push("direction-change receipt should record why");
  return { ok: errors.length === 0, errors, warnings };
}

export function writeDirectionProtocol(projectPath: string, input: {
  intake: DirectionIntake;
  proposal: DirectionProposal;
  decision?: DirectionDecision;
}) {
  const paths = directionPaths(projectPath, input.intake.pivotId);
  mkdirSync(paths.directionDir, { recursive: true });
  mkdirSync(dirname(paths.directionReceiptPath), { recursive: true });
  writeFileSync(paths.intakePath, renderDirectionIntakeMarkdown(input.intake), "utf8");
  writeJson(paths.proposalPath, input.proposal);
  if (input.decision) {
    writeFileSync(paths.decisionPath, renderDirectionDecisionMarkdown(input.decision), "utf8");
    const impact = makeDirectionImpact({ proposal: input.proposal, decision: input.decision });
    writeJson(paths.impactPath, impact);
    if (input.decision.decision === "accepted") {
      writeJson(paths.directionReceiptPath, makeDirectionChangeReceipt({ proposal: input.proposal, decision: input.decision }));
    }
  }
  return paths;
}

export function readDirectionChangeReceipt(projectPath: string): DirectionChangeReceipt | null {
  const path = directionPaths(projectPath).directionReceiptPath;
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as DirectionChangeReceipt;
  } catch {
    return null;
  }
}

export function renderDirectionIntakeMarkdown(intake: DirectionIntake): string {
  return [
    `# Direction Intake: ${intake.pivotId}`,
    "",
    `- Changed direction: ${intake.changedDirection}`,
    `- Trigger terms: ${intake.triggerTerms.join(", ") || "none"}`,
    "",
    "## Classified Inspirations",
    "",
    ...intake.items.map((item) => [
      `### ${item.id}`,
      `- Bucket: ${item.bucket}`,
      `- Outcome: ${item.outcome}`,
      `- Inspiration: ${item.inspiration}`,
      `- Interpretation: ${item.interpretation}`,
      `- Affects: ${item.affects.join(", ")}`,
      `- Risk: ${item.risk}`,
      "",
    ].join("\n")),
  ].join("\n");
}

export function renderDirectionDecisionMarkdown(decision: DirectionDecision): string {
  return [
    `# Direction Decision: ${decision.pivotId}`,
    "",
    `- Decision: ${decision.decision}`,
    `- Decided by: ${decision.decidedBy}`,
    `- Decided at: ${decision.decidedAt}`,
    `- Rationale: ${decision.rationale}`,
    `- Resume: \`${decision.resumeCommand}\``,
    "",
  ].join("\n");
}

function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function classifyDirectionItems(text: string): DirectionIntakeItem[] {
  const lower = text.toLowerCase();
  const items: DirectionIntakeItem[] = [];
  const add = (item: DirectionIntakeItem) => items.push(item);
  if (/(make our own|oss|open[- ]source|not integrate|emergent|spline)/i.test(text)) {
    add({
      id: "oss-interactive-3d-pipeline",
      bucket: "product-direction",
      inspiration: "Emergent + Spline / own OSS replacement",
      interpretation: "Treat proprietary products as product-shape inspiration and make the core direction an owned pipeline.",
      outcome: lower.includes("make our own") || lower.includes("oss") ? "adopt" : "adapt",
      affects: ["product goal", "target user", "architecture", "proof gates"],
      risk: "Do not copy proprietary assets or imply parity without proof.",
    });
  }
  if (/(blender|gltf|glb|gltfjsx|r3f|react three fiber|three\.js|local generation|headless)/i.test(text)) {
    add({
      id: "web-ready-3d-architecture",
      bucket: "technical-architecture",
      inspiration: "local/open generation, headless DCC conditioning, GLB/glTF, R3F/Three.js",
      interpretation: "Move from a rendered scaffold toward a web-ready asset pipeline with export and runtime components.",
      outcome: "adapt",
      affects: ["repo architecture", "agent tools", "runtime", "export path"],
      risk: "Self-hosted and DCC lanes require runtime/GPU/binary proof before capability claims.",
    });
  }
  if (/(bruno simon|igloo|spline|shader|physics|cinematic|performance|instancing|interactive)/i.test(text)) {
    add({
      id: "premium-webgl-quality-bar",
      bucket: "visual-interaction-quality",
      inspiration: "Bruno Simon / Igloo / high-end interactive WebGL",
      interpretation: "Use as an interaction and performance quality bar, not a v1 requirement to match bespoke WebGL artistry.",
      outcome: "adapt",
      affects: ["design quality", "interaction", "performance", "mobile behavior"],
      risk: "Park T4/T5 claims until performance and visual proof receipts exist.",
    });
  }
  if (/(proof registry|benchmark|receipt|reopen|performance|quality|proof gate|asset quality)/i.test(text)) {
    add({
      id: "proof-registry-direction",
      bucket: "proof-eval-direction",
      inspiration: "Proof Registry and component-level asset quality receipts",
      interpretation: "Replace vague render proof with tiered proof gates and a registry of required artifacts.",
      outcome: "adopt",
      affects: ["proof gates", "benchmark", "scorecard", "component RALPH"],
      risk: "No high quality claim without matching proof registry entries.",
    });
  }
  if (/(architecture governor|research governor|mcp|hooks|fresh-context judge|nodeagent|convex)/i.test(text)) {
    add({
      id: "agent-process-governors",
      bucket: "agent-process-direction",
      inspiration: "Architecture Governor, Research Governor, hooks, MCP, fresh-context judge",
      interpretation: "Require system-map and research-spine updates before code edits after pivots.",
      outcome: "adopt",
      affects: ["hooks", "MCP", "system map", "research spine", "judge"],
      risk: "Agent must not rely on chat memory or stale architecture maps.",
    });
  }
  if (/(industry-grade|production-ready|copy|proprietary|copyright|commercial|safety|webRTC|speculation)/i.test(text)) {
    add({
      id: "direction-risk-constraints",
      bucket: "risk-constraint",
      inspiration: "Blocked claims, proprietary products, speculative lanes",
      interpretation: "Adopt/Adapt/Park/Reject each inspiration to prevent inspiration drift and overclaiming.",
      outcome: lower.includes("webrtc") ? "park" : "adapt",
      affects: ["non-claims", "blocked lanes", "quality tiers"],
      risk: "Commercial, proprietary-copy, and industry-grade claims stay blocked without receipts.",
    });
  }
  if (items.length === 0) {
    add({
      id: "general-direction-review",
      bucket: "product-direction",
      inspiration: text.slice(0, 160) || "unspecified inspiration",
      interpretation: "Review whether the new context changes product direction or stays a feature tweak.",
      outcome: "park",
      affects: ["discover", "proof gates"],
      risk: "Insufficient trigger evidence; do not rewrite app blindly.",
    });
  }
  return items;
}

function extractTriggerTerms(text: string): string[] {
  const terms = [
    "change direction",
    "instead of",
    "not integrate",
    "make our own",
    "oss",
    "open-source",
    "learn from",
    "gold standard",
    "new architecture",
    "new pipeline",
    "replace",
    "pivot",
    "rethink",
    "north star",
    "spline",
    "emergent",
    "bruno simon",
    "igloo",
    "architecture governor",
    "research governor",
    "proof registry",
  ];
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term));
}

function inferQualityTier(text: string): DirectionQualityTier {
  const lower = text.toLowerCase();
  if (/game-ready|cad-ready|dcc-grade|rig|collision|lod|uv|pbr|topology/.test(lower)) return "T5";
  if (/production-ready|optimized|draw calls|texture budget|accessibility/.test(lower)) return "T4";
  if (/demo-ready|polished|mobile|desktop|video receipt|bruno|igloo/.test(lower)) return "T3";
  if (/glb|gltf|r3f|react three fiber|web-ready|interaction proof/.test(lower)) return "T2";
  if (/coherent/.test(lower)) return "T1";
  return "T0";
}
