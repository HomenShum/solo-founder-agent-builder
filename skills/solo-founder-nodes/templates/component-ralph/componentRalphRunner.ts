import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export const componentRalphStages = ["R", "A", "L", "P", "H"] as const;
export type ComponentRalphStage = (typeof componentRalphStages)[number];
export type ComponentRalphStageStatus = "planned" | "running" | "completed" | "blocked";

export type ComponentSourceKind =
  | "paper"
  | "official-doc"
  | "benchmark"
  | "dataset"
  | "industry-reference"
  | "internal-doctrine";

export type ComponentResearchSource = {
  id: string;
  title: string;
  url: string;
  kind: ComponentSourceKind;
  domain: string;
  claim: string;
};

export type ComponentInput = {
  id: string;
  label: string;
  kind?: string;
  description?: string;
  parent?: string;
  children?: string[];
  constraints?: string[];
  required?: boolean;
  researchSourceIds?: string[];
};

export type ComponentAcceptanceGate = {
  id: string;
  label: string;
  required: boolean;
  evidenceRequired: string[];
  researchSourceIds: string[];
};

export type ComponentProofGate = {
  id: string;
  label: string;
  kind:
    | "research"
    | "structure"
    | "geometry"
    | "topology"
    | "material"
    | "export"
    | "runtime"
    | "safety"
    | "proof";
  required: boolean;
  passed: boolean;
  evidencePaths: string[];
};

export type ComponentStageReceipt = {
  stage: ComponentRalphStage;
  label: string;
  question: string;
  status: ComponentRalphStageStatus;
  receipt?: string;
  requiredReceipts: string[];
  evidencePaths: string[];
};

export type ComponentRalphNode = {
  componentId: string;
  kind: string;
  label: string;
  description: string;
  parent?: string;
  children: string[];
  required: boolean;
  productionCriticalReason: string;
  constraints: string[];
  researchSourceIds: string[];
  acceptanceGates: ComponentAcceptanceGate[];
  ralph: Record<ComponentRalphStage, ComponentStageReceipt>;
  proofGates: ComponentProofGate[];
  unsupportedUntil: string[];
};

export type ComponentRalphLedger = {
  schemaVersion: 1;
  ledgerKind: "component-ralph";
  assetId: string;
  goal: string;
  domain: string;
  parentLoopId?: string;
  generatedAt: string;
  decompositionPolicy: {
    onlyProductionCriticalComponents: true;
    maxRecommendedComponents: number;
    noTinyImplementationDetails: true;
  };
  sources: ComponentResearchSource[];
  components: ComponentRalphNode[];
  parentGate: {
    parentCannotPassWithoutRequiredComponentProofs: true;
    noComponentProofNoParentClaim: true;
  };
};

export type ComponentRalphVerdict = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  missingProofs: string[];
};

export const componentLedgerRelativePath = ".solo/ledgers/component-ralph.json";

export function componentLedgerPath(projectPath: string) {
  return resolve(projectPath, componentLedgerRelativePath);
}

export function componentRalphSources(domain = "general"): ComponentResearchSource[] {
  return [
    {
      id: "component-ralph-doctrine",
      title: "Solo Founder Component RALPH",
      url: "references/component-ralph.md",
      kind: "internal-doctrine",
      domain,
      claim: "Compositional products need production-critical child components with their own R/A/L/P/H receipts.",
    },
    {
      id: "research-spine",
      title: "Solo Founder Research Spine",
      url: "references/research-spine.md",
      kind: "internal-doctrine",
      domain,
      claim: "Implementation decisions trace user need to inspiration, research, decision, metric, and proof.",
    },
    {
      id: "fresh-room-proof",
      title: "Solo Founder Fresh-room Proof Receipt",
      url: "templates/proof/freshRoomReceipt.ts",
      kind: "internal-doctrine",
      domain: "proof",
      claim: "A claim counts only when live UI evidence, artifacts, and verifier receipts support it.",
    },
    {
      id: "p3d-bench",
      title: "P3D-Bench",
      url: "https://arxiv.org/abs/2606.11152",
      kind: "benchmark",
      domain: "3d-generation",
      claim: "Parametric 3D generation should be evaluated on executability, geometry, topology, constraints, multiview semantic alignment, and part-level structure.",
    },
    {
      id: "hy3d-bench",
      title: "HY3D-Bench",
      url: "https://arxiv.org/abs/2602.03907",
      kind: "benchmark",
      domain: "3d-generation",
      claim: "3D generation datasets benefit from structured part-level decomposition for fine-grained perception and controllable editing.",
    },
    {
      id: "gltf-spec",
      title: "glTF 2.0 Specification",
      url: "https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html",
      kind: "official-doc",
      domain: "3d-generation",
      claim: "glTF/GLB is an interoperability target for meshes, nodes, materials, textures, cameras, animation, and runtime asset delivery.",
    },
    {
      id: "pbr3dgen",
      title: "PBR3DGen",
      url: "https://arxiv.org/abs/2503.11368",
      kind: "paper",
      domain: "3d-generation",
      claim: "PBR material quality is a separate generation problem involving material decomposition and roughness/metallic consistency.",
    },
    {
      id: "webarena",
      title: "WebArena",
      url: "https://arxiv.org/abs/2307.13854",
      kind: "benchmark",
      domain: "agent-loop",
      claim: "Real web-agent tasks require end-to-end completion in live-like environments.",
    },
    {
      id: "osworld",
      title: "OSWorld",
      url: "https://arxiv.org/abs/2404.07972",
      kind: "benchmark",
      domain: "agent-loop",
      claim: "Computer-use agents need executable environment proof, not only text answers.",
    },
  ];
}

export function makeComponentRalphLedger(input: {
  goal: string;
  domain?: string;
  assetId?: string;
  parentLoopId?: string;
  components?: ComponentInput[];
  generatedAt?: string;
  status?: ComponentRalphStageStatus;
  evidenceRoot?: string;
}): ComponentRalphLedger {
  const domain = input.domain ?? "general";
  const components = input.components?.length ? input.components : defaultComponents(domain, input.goal);
  const status = input.status ?? "planned";
  return {
    schemaVersion: 1,
    ledgerKind: "component-ralph",
    assetId: input.assetId ?? slugify(input.goal || "component-product"),
    goal: input.goal,
    domain,
    parentLoopId: input.parentLoopId,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    decompositionPolicy: {
      onlyProductionCriticalComponents: true,
      maxRecommendedComponents: 25,
      noTinyImplementationDetails: true,
    },
    sources: componentRalphSources(domain),
    components: components.map((component, index) =>
      makeComponentNode(component, components, index, domain, status, input.evidenceRoot ?? "component-ralph"),
    ),
    parentGate: {
      parentCannotPassWithoutRequiredComponentProofs: true,
      noComponentProofNoParentClaim: true,
    },
  };
}

export function decomposeComponentsFromText(input: { text: string; domain?: string }): ComponentInput[] {
  const text = `${input.domain ?? ""} ${input.text}`.toLowerCase();
  if (/3d|mesh|model|asset|glb|gltf|blender|cad|auto\s?cad|construction|game/.test(text)) {
    if (/chair/.test(text)) {
      return [
        component("chair.seat", "Seat", "geometry_part", "Support surface with usable thickness.", ["horizontal orientation", "connects to legs", "not floating"]),
        component("chair.legs", "Leg assembly", "geometry_part", "Four supports that keep the chair stable.", ["four comparable supports", "connects to seat", "stable footprint"]),
        component("chair.backrest", "Backrest", "geometry_part", "Rear support surface connected to the seat.", ["behind seat", "connected", "reasonable angle"]),
        component("chair.crossbar", "Crossbar", "geometry_part", "Reinforcement between legs.", ["connects leg pair", "not floating", "no major intersection"]),
        component("chair.material", "Wood/PBR material", "material", "Material system that survives export.", ["material assigned", "roughness/metalness plausible", "not lighting-baked only"]),
        component("export.glb", "GLB export", "export", "Portable asset output for runtime and DCC reopen.", ["valid GLB/glTF", "node/material hierarchy", "reopens in viewer"]),
      ];
    }
    return [
      component("part-graph", "Part graph", "structure", "Names production-critical parts, relationships, and non-copying deltas.", ["component tree exists", "critical parts named", "interfaces declared"]),
      component("mesh-geometry", "Mesh geometry", "geometry", "Non-empty geometry for every critical part.", ["non-empty mesh", "reasonable scale", "no floating major parts"]),
      component("topology", "Topology", "topology", "Geometry quality suitable for the intended target.", ["triangle budget", "normals valid", "degenerates below threshold"]),
      component("uv-pbr-material", "UV/PBR material", "material", "UVs and materials survive export and downstream rendering.", ["uv present", "material assigned", "PBR maps or explicit fallback"]),
      component("export-reopen", "Export and reopen", "export", "GLB/glTF asset exports and reopens in a separate viewer or DCC lane.", ["export file exists", "validator or parser passes", "reopen screenshot/receipt"]),
      component("viewer-action", "Viewer interaction", "runtime", "The live UI can inspect and act on the asset.", ["camera controls work", "structured action protocol", "screenshot proof"]),
      component("proof-runner", "Proof runner", "proof", "Receipts bind UI, artifact, export, and scorecard evidence.", ["proof verdict", "artifact hashes", "no screenshot-only pass"]),
    ];
  }
  if (/workbook|spreadsheet|finance|sheet|model/.test(text)) {
    return [
      component("input-sheet", "Input sheet", "data", "Captures user-provided assumptions.", ["typed inputs", "validation", "source notes"]),
      component("formula-driver", "Formula driver", "logic", "Calculates outputs from documented assumptions.", ["formula audit", "edge cases", "no hidden constants"]),
      component("output-tab", "Output tab", "artifact", "Presents final values and scenarios.", ["traceable formulas", "user-readable", "reopen proof"]),
      component("chart", "Chart", "visual", "Visualizes the result without obscuring assumptions.", ["axis labels", "data binding", "screenshot proof"]),
      component("memo", "Memo", "narrative", "Explains caveats and non-claims.", ["risk notes", "source references", "approval boundary"]),
    ];
  }
  if (/agent|workflow|automation|tool|chat|app|ui|dashboard/.test(text)) {
    return [
      component("model-router", "Model router", "agent", "Chooses models/providers with cost, capability, and fallback receipts.", ["typed routing policy", "cost class", "fallback path"]),
      component("tool-registry", "Tool registry", "agent", "Exposes typed tools and recovery paths.", ["schema parity", "preconditions", "failure modes"]),
      component("memory-store", "Memory store", "state", "Keeps durable state outside prompt transcripts.", ["trace id", "redaction", "retrieval policy"]),
      component("approval-gate", "Approval gate", "control", "Blocks risky or user-owned actions until approved.", ["risk class", "manual approval", "audit receipt"]),
      component("ui-surface", "UI surface", "runtime", "Lets a real user run and inspect the workflow.", ["desktop/mobile proof", "state coverage", "accessibility"]),
      component("proof-runner", "Proof runner", "proof", "Runs the task in the actual environment and records artifacts.", ["trace/video", "verdict json", "reopen/export proof where relevant"]),
    ];
  }
  return [
    component("user-facing-output", "User-facing output", "artifact", "The artifact the user actually cares about.", ["matches intent", "evidence receipt", "non-claims labeled"]),
    component("critical-data-flow", "Critical data flow", "data", "The data path that can independently fail.", ["source receipt", "schema check", "failure mode"]),
    component("external-interface", "External interface", "interface", "The API, file, UI, or deployment boundary.", ["contract", "auth/approval boundary", "runtime proof"]),
    component("proof-runner", "Proof runner", "proof", "Executable proof that blocks unsupported parent claims.", ["trace/artifact", "verdict", "rework hook"]),
  ];
}

export function verifyComponentRalphLedger(
  ledger: ComponentRalphLedger,
  options: { baseDir?: string; requireFiles?: boolean; requireCompleted?: boolean; componentId?: string } = {},
): ComponentRalphVerdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingProofs: string[] = [];
  const baseDir = options.baseDir ?? process.cwd();
  const requireFiles = options.requireFiles ?? true;
  const requireCompleted = options.requireCompleted ?? true;
  const components = options.componentId
    ? (ledger.components ?? []).filter((component) => component.componentId === options.componentId)
    : ledger.components ?? [];

  if (ledger.schemaVersion !== 1) errors.push("component RALPH ledger schemaVersion must be 1");
  if (ledger.ledgerKind !== "component-ralph") errors.push("component RALPH ledgerKind must be component-ralph");
  if (!ledger.goal?.trim()) errors.push("component RALPH ledger requires goal");
  if (!ledger.domain?.trim()) errors.push("component RALPH ledger requires domain");
  if (ledger.parentGate?.parentCannotPassWithoutRequiredComponentProofs !== true) errors.push("component RALPH parent gate must fail closed");
  if (ledger.parentGate?.noComponentProofNoParentClaim !== true) errors.push("component RALPH must enforce no component proof, no parent claim");
  if (ledger.decompositionPolicy?.onlyProductionCriticalComponents !== true) errors.push("component RALPH must limit decomposition to production-critical components");
  if (ledger.decompositionPolicy?.noTinyImplementationDetails !== true) errors.push("component RALPH must avoid tiny implementation-detail decomposition");

  const sourceIds = new Set((ledger.sources ?? []).map((source) => source.id));
  for (const required of ["component-ralph-doctrine", "research-spine", "fresh-room-proof"]) {
    if (!sourceIds.has(required)) errors.push(`missing component RALPH source: ${required}`);
  }

  if (!ledger.components?.length) errors.push("component RALPH ledger requires at least one component");
  if (ledger.components?.length > (ledger.decompositionPolicy?.maxRecommendedComponents ?? 25)) {
    warnings.push("component ledger exceeds maxRecommendedComponents; check for infinite/tiny decomposition");
  }
  if (options.componentId && components.length === 0) errors.push(`component not found: ${options.componentId}`);

  const allComponentIds = new Set((ledger.components ?? []).map((component) => component.componentId));
  for (const component of components) {
    if (!component.componentId || !component.label || !component.description) {
      errors.push(`component ${component.componentId || "<missing>"} requires id, label, and description`);
    }
    if (component.required !== true) warnings.push(`component ${component.componentId} is optional; parent proof may not depend on it`);
    if (!component.productionCriticalReason?.trim()) errors.push(`component ${component.componentId} requires productionCriticalReason`);
    if ((component.constraints ?? []).length < 2) errors.push(`component ${component.componentId} needs at least two constraints`);
    if ((component.researchSourceIds ?? []).length < 2) errors.push(`component ${component.componentId} requires at least two research sources`);
    for (const sourceId of component.researchSourceIds ?? []) {
      if (!sourceIds.has(sourceId)) errors.push(`component ${component.componentId} references unknown source ${sourceId}`);
    }
    if ((component.acceptanceGates ?? []).length < 2) errors.push(`component ${component.componentId} requires at least two acceptance gates`);
    for (const gate of component.acceptanceGates ?? []) {
      if (!gate.id || !gate.label) errors.push(`component ${component.componentId} has malformed acceptance gate`);
      if (gate.required && gate.evidenceRequired.length === 0) errors.push(`component ${component.componentId} gate ${gate.id} has no evidence requirements`);
      for (const sourceId of gate.researchSourceIds ?? []) {
        if (!sourceIds.has(sourceId)) errors.push(`component ${component.componentId} gate ${gate.id} references unknown source ${sourceId}`);
      }
    }
    for (const child of component.children ?? []) {
      if (!allComponentIds.has(child)) errors.push(`component ${component.componentId} child ${child} is not in ledger`);
    }
    for (const stage of componentRalphStages) {
      const stageReceipt = component.ralph?.[stage];
      if (!stageReceipt) {
        errors.push(`component ${component.componentId} missing RALPH stage ${stage}`);
        missingProofs.push(`${component.componentId}.${stage}`);
        continue;
      }
      if ((stageReceipt.requiredReceipts ?? []).length === 0) errors.push(`component ${component.componentId} stage ${stage} has no required receipts`);
      if ((stageReceipt.evidencePaths ?? []).length === 0) errors.push(`component ${component.componentId} stage ${stage} has no evidence paths`);
      if (requireCompleted && component.required && stageReceipt.status !== "completed") {
        const missing = `${component.componentId}.${stage}`;
        errors.push(`component ${component.componentId} stage ${stage} is not completed`);
        missingProofs.push(missing);
      }
      if (requireFiles) {
        for (const evidencePath of stageReceipt.evidencePaths ?? []) {
          if (!existsSync(resolve(baseDir, evidencePath))) {
            errors.push(`component ${component.componentId} stage ${stage} evidence file does not exist: ${evidencePath}`);
            missingProofs.push(`${component.componentId}.${stage}:${evidencePath}`);
          }
        }
      }
    }
    const requiredProofGates = (component.proofGates ?? []).filter((gate) => gate.required);
    if (requiredProofGates.length < 4) errors.push(`component ${component.componentId} needs at least four required proof gates`);
    for (const gate of requiredProofGates) {
      if (requireCompleted && !gate.passed) {
        errors.push(`component ${component.componentId} required proof gate ${gate.id} is not passed`);
        missingProofs.push(`${component.componentId}.proofGate:${gate.id}`);
      }
      if (gate.evidencePaths.length === 0) errors.push(`component ${component.componentId} proof gate ${gate.id} has no evidence paths`);
      if (requireFiles) {
        for (const evidencePath of gate.evidencePaths) {
          if (!existsSync(resolve(baseDir, evidencePath))) {
            errors.push(`component ${component.componentId} proof gate ${gate.id} evidence file does not exist: ${evidencePath}`);
            missingProofs.push(`${component.componentId}.proofGate:${gate.id}:${evidencePath}`);
          }
        }
      }
    }
    if ((component.unsupportedUntil ?? []).length < 2) errors.push(`component ${component.componentId} needs unsupported-until claim blockers`);
  }

  return { ok: errors.length === 0, errors, warnings, missingProofs: Array.from(new Set(missingProofs)) };
}

export function readComponentRalphLedger(projectPath: string): ComponentRalphLedger | undefined {
  const path = componentLedgerPath(projectPath);
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf8")) as ComponentRalphLedger;
}

export function isCompositionalGoal(goal: string) {
  return /3d|mesh|model|asset|glb|gltf|blender|cad|workbook|spreadsheet|multi[-\s]?file|multi[-\s]?tab|dashboard|ui system|agent harness|data pipeline|simulation|workflow/i.test(goal);
}

export function markComponentStage(
  ledger: ComponentRalphLedger,
  input: { componentId: string; stage: ComponentRalphStage; receipt?: string; status?: ComponentRalphStageStatus },
): ComponentRalphLedger {
  const next: ComponentRalphLedger = JSON.parse(JSON.stringify(ledger)) as ComponentRalphLedger;
  const component = next.components.find((candidate) => candidate.componentId === input.componentId);
  if (!component) throw new Error(`component not found: ${input.componentId}`);
  const stageReceipt = component.ralph[input.stage];
  stageReceipt.status = input.status ?? "completed";
  if (input.receipt) {
    stageReceipt.receipt = input.receipt;
    if (!stageReceipt.evidencePaths.includes(input.receipt)) stageReceipt.evidencePaths.push(input.receipt);
  }
  if (input.stage === "P") {
    for (const gate of component.proofGates) {
      gate.passed = true;
      if (input.receipt && !gate.evidencePaths.includes(input.receipt)) gate.evidencePaths.push(input.receipt);
    }
  }
  return next;
}

function makeComponentNode(
  componentInput: ComponentInput,
  allComponents: ComponentInput[],
  index: number,
  domain: string,
  status: ComponentRalphStageStatus,
  evidenceRoot: string,
): ComponentRalphNode {
  const componentId = componentInput.id;
  const sourceIds = componentInput.researchSourceIds?.length
    ? componentInput.researchSourceIds
    : sourceIdsForComponent(componentInput, domain);
  const kind = componentInput.kind ?? classifyComponent(componentInput, domain);
  const constraints = componentInput.constraints?.length
    ? componentInput.constraints
    : defaultConstraintsForKind(kind);
  return {
    componentId,
    kind,
    label: componentInput.label,
    description: componentInput.description ?? `${componentInput.label} is a production-critical component of ${domain}.`,
    parent: componentInput.parent,
    children: componentInput.children ?? [],
    required: componentInput.required ?? true,
    productionCriticalReason: productionCriticalReason(componentInput, kind),
    constraints,
    researchSourceIds: sourceIds,
    acceptanceGates: acceptanceGatesFor(componentId, kind, sourceIds),
    ralph: stagesFor(componentId, componentInput.label, evidenceRoot, status),
    proofGates: proofGatesFor(componentId, kind, status === "completed"),
    unsupportedUntil: [
      "No parent done claim until this component has R/A/L/P/H receipts.",
      "No production/customer/judge claim until proof gates pass with evidence files.",
      "No high-risk commercial, physical, safety, or regulated-use claim until the user attaches the required external approval receipts.",
    ],
  };
}

function component(id: string, label: string, kind: string, description: string, constraints: string[]): ComponentInput {
  return { id, label, kind, description, constraints, required: true };
}

function defaultComponents(domain: string, goal: string): ComponentInput[] {
  return decomposeComponentsFromText({ text: goal, domain });
}

function sourceIdsForComponent(component: ComponentInput, domain: string): string[] {
  const text = `${domain} ${component.id} ${component.label} ${component.kind ?? ""} ${component.description ?? ""}`.toLowerCase();
  const base = ["component-ralph-doctrine", "research-spine", "fresh-room-proof"];
  if (/3d|mesh|model|asset|glb|gltf|geometry|topology|material|viewer|cad/.test(text)) {
    const ids = [...base, "p3d-bench", "hy3d-bench", "gltf-spec"];
    if (/material|pbr|uv/.test(text)) ids.push("pbr3dgen");
    return ids;
  }
  if (/agent|tool|workflow|ui|dashboard|browser|proof/.test(text)) return [...base, "webarena", "osworld"];
  return [...base, "webarena"];
}

function classifyComponent(component: ComponentInput, domain: string): string {
  const text = `${domain} ${component.id} ${component.label} ${component.description ?? ""}`.toLowerCase();
  if (/export|gltf|glb|usdz/.test(text)) return "export";
  if (/material|pbr|uv|texture/.test(text)) return "material";
  if (/topology|normal|triangle|mesh/.test(text)) return "topology";
  if (/viewer|ui|surface|browser/.test(text)) return "runtime";
  if (/proof|verdict|trace|receipt/.test(text)) return "proof";
  if (/agent|tool|router|memory/.test(text)) return "agent";
  return "component";
}

function defaultConstraintsForKind(kind: string): string[] {
  if (kind === "export") return ["portable artifact exists", "validator or parser proof exists", "reopen proof exists"];
  if (kind === "material") return ["material assigned", "UV/PBR plan or explicit fallback exists", "render proof exists"];
  if (kind === "topology") return ["triangle budget stated", "normals valid", "degenerate/self-intersection check exists"];
  if (kind === "runtime") return ["live UI proof exists", "interaction receipt exists", "state is inspectable"];
  if (kind === "proof") return ["verdict json exists", "artifact evidence exists", "unsupported claims are labeled"];
  return ["component role documented", "acceptance gate exists", "proof receipt exists"];
}

function productionCriticalReason(component: ComponentInput, kind: string): string {
  if (component.description) return component.description;
  return `${component.label} can independently make the parent product fail, so it needs its own component RALPH receipts.`;
}

function acceptanceGatesFor(componentId: string, kind: string, sourceIds: string[]): ComponentAcceptanceGate[] {
  return [
    {
      id: `${componentId}-role`,
      label: "Role and constraints are researched",
      required: true,
      evidenceRequired: ["component research brief", "functional constraints"],
      researchSourceIds: sourceIds,
    },
    {
      id: `${componentId}-proof-contract`,
      label: "Proof contract exists",
      required: true,
      evidenceRequired: ["proof receipt path", "failure mode", "rework route"],
      researchSourceIds: ["component-ralph-doctrine", "fresh-room-proof", ...sourceIds.slice(0, 1)],
    },
    {
      id: `${componentId}-${kind}-quality`,
      label: `${kind} quality gate passes`,
      required: true,
      evidenceRequired: ["quality report", "artifact or UI signal"],
      researchSourceIds: sourceIds,
    },
  ];
}

function stagesFor(
  componentId: string,
  label: string,
  evidenceRoot: string,
  status: ComponentRalphStageStatus,
): Record<ComponentRalphStage, ComponentStageReceipt> {
  const prefix = `${evidenceRoot}/${componentId}`;
  return {
    R: stage("R", "Reality", `What is ${label}, what role does it serve, and which sources constrain it?`, ["component-reality", "research-brief"], [`${prefix}/R-reality.md`], status),
    A: stage("A", "Acceptance Bar", `What makes ${label} valid enough for the parent claim?`, ["acceptance-gates", "failure-modes"], [`${prefix}/A-acceptance.json`], status),
    L: stage("L", "Live Build", `What concrete build/refinement created ${label}?`, ["build-receipt", "artifact-delta"], [`${prefix}/L-build.json`], status),
    P: stage("P", "Proof Run", `How did ${label} pass proof in the actual output/environment?`, ["proof-receipt", "artifact-or-ui-signal"], [`${prefix}/P-proof.json`], status),
    H: stage("H", "Harden", `What rework, risk, or blocked claim remains for ${label}?`, ["rework-note", "unsupported-claim-labels"], [`${prefix}/H-harden.md`], status),
  };
}

function stage(
  stageId: ComponentRalphStage,
  label: string,
  question: string,
  requiredReceipts: string[],
  evidencePaths: string[],
  status: ComponentRalphStageStatus,
): ComponentStageReceipt {
  return { stage: stageId, label, question, status, requiredReceipts, evidencePaths };
}

function proofGatesFor(componentId: string, kind: string, passed: boolean): ComponentProofGate[] {
  const base = [
    gate(componentId, "research", "Research brief exists", "research", passed),
    gate(componentId, "acceptance", "Acceptance gates are explicit", "proof", passed),
    gate(componentId, "build", "Build artifact or change exists", "structure", passed),
    gate(componentId, "proof", "Proof receipt exists", "proof", passed),
  ];
  if (kind === "export") base.push(gate(componentId, "reopen", "Export reopens in target viewer/tool", "export", passed));
  if (kind === "material") base.push(gate(componentId, "pbr", "UV/material/PBR evidence exists", "material", passed));
  if (kind === "topology" || kind === "geometry") base.push(gate(componentId, "mesh-quality", "Mesh quality report exists", "topology", passed));
  if (kind === "runtime") base.push(gate(componentId, "interaction", "Runtime interaction proof exists", "runtime", passed));
  return base;
}

function gate(componentId: string, id: string, label: string, kind: ComponentProofGate["kind"], passed: boolean): ComponentProofGate {
  return {
    id,
    label,
    kind,
    required: true,
    passed,
    evidencePaths: [`component-ralph/${componentId}/P-${id}.json`],
  };
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 64) || "component-product";
}
