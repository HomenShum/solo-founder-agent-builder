import { existsSync } from "node:fs";
import { resolve } from "node:path";

export const partResearchRalphStages = ["R", "A", "L", "P", "H"] as const;
export type PartResearchRalphStage = (typeof partResearchRalphStages)[number];

export type PartResearchStageStatus = "planned" | "completed";

export type PartResearchSourceKind =
  | "paper"
  | "dataset"
  | "benchmark"
  | "official-doc"
  | "industry-reference";

export type PartResearchSource = {
  id: string;
  title: string;
  url: string;
  kind: PartResearchSourceKind;
  claim: string;
};

export type PartResearchComponentInput = {
  id: string;
  label: string;
  role: string;
  partClass?: string;
  material?: string;
  geometryPrimitive?: string;
  dimensions?: [number, number, number];
};

export type PartFunctionalRequirement = {
  id: string;
  requirement: string;
  sourceIds: string[];
  evidenceRequired: string[];
};

export type PartCompositionInterface = {
  id: string;
  targetPartId: string;
  constraint: string;
  sourceIds: string[];
  evidenceRequired: string[];
};

export type PartResearchStageReceipt = {
  stage: PartResearchRalphStage;
  label: string;
  question: string;
  requiredReceipts: string[];
  evidencePaths: string[];
  status: PartResearchStageStatus;
};

export type PartResearchRalphLoop = {
  partId: string;
  label: string;
  partClass: string;
  role: string;
  researchSourceIds: string[];
  functionalRequirements: PartFunctionalRequirement[];
  compositionInterfaces: PartCompositionInterface[];
  localGeometryPlan: {
    primitive: string;
    dimensions?: [number, number, number];
    material: string;
    generatedFromFunctionalSpecOnly: true;
  };
  stages: Record<PartResearchRalphStage, PartResearchStageReceipt>;
  unsupportedUntil: string[];
};

export type PartResearchCompositionEdge = {
  fromPartId: string;
  toPartId: string;
  constraint: string;
  sourceIds: string[];
};

export type ThreeDPartResearchRalphReceipt = {
  schemaVersion: 1;
  goal: string;
  objectCategory: string;
  generatedAt: string;
  sources: PartResearchSource[];
  partLoops: PartResearchRalphLoop[];
  compositionGraph: {
    nodes: string[];
    edges: PartResearchCompositionEdge[];
  };
  globalCompositionConstraints: string[];
  restrictions: {
    exactReplicaExport: false;
    personalResearchOnly?: boolean;
    notHumanUseApproved: true;
    commercialUseUserOwnedDecision: true;
  };
};

export type ThreeDPartResearchRalphVerdict = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function threeDPartResearchSources(): PartResearchSource[] {
  return [
    {
      id: "partnet-dataset",
      title: "PartNet: A Large-scale Benchmark for Fine-grained and Hierarchical Part-level 3D Object Understanding",
      url: "https://partnet.cs.stanford.edu/",
      kind: "dataset",
      claim: "Fine-grained 3D understanding needs explicit hierarchical part annotations, not one undifferentiated mesh.",
    },
    {
      id: "partnet-recursive",
      title: "PartNet: A Recursive Part Decomposition Network for Fine-grained and Hierarchical Shape Segmentation",
      url: "https://arxiv.org/abs/1903.00709",
      kind: "paper",
      claim: "Top-down recursive decomposition uses higher-level structure to constrain lower-level parts.",
    },
    {
      id: "sam-part-3d",
      title: "Find Any Part in 3D / SAMPart3D",
      url: "https://arxiv.org/html/2411.13550v2",
      kind: "paper",
      claim: "Part-aware 3D systems should handle many semantic part types at multiple granularities.",
    },
    {
      id: "p3d-bench",
      title: "P3D-Bench",
      url: "https://arxiv.org/html/2606.11152v2",
      kind: "benchmark",
      claim: "Assembly-3D evaluation should score executability, topology, constraints, multiview semantic alignment, and part-level structure.",
    },
    {
      id: "text2cad",
      title: "Text2CAD",
      url: "https://arxiv.org/html/2409.17106v1",
      kind: "paper",
      claim: "Editable CAD generation benefits from explicit intermediate parts and sequential design operations.",
    },
    {
      id: "histcad",
      title: "HistCAD",
      url: "https://arxiv.org/html/2602.19171v1",
      kind: "paper",
      claim: "Functional CAD outputs need geometric constraints such as parallelism, tangency, and parameterized primitives.",
    },
    {
      id: "eyewear-frame-parts",
      title: "Ophthalmic Frames Principal Parts",
      url: "https://opticaltraining.com/html/continuing_ed/wbt/ABO/Ophthalmic_Frames/page_two.html",
      kind: "industry-reference",
      claim: "Spectacle frames compose eyewires/rims, bridge, end pieces, hinges, and temples as functional frame parts.",
    },
    {
      id: "eyewear-anatomy",
      title: "Diagram of Glasses Parts and Their Functions",
      url: "https://www.allaboutvision.com/eyewear/eyeglasses/diagram-parts-of-glasses/",
      kind: "industry-reference",
      claim: "Lenses, rims, bridge, nose pads, pad arms, temples, end pieces, hinges, screws, and rivets have distinct functions.",
    },
    {
      id: "iso-12870",
      title: "ISO 12870:2024 / EN ISO 12870:2025 Spectacle frames requirements and test methods",
      url: "https://standards.iteh.ai/catalog/standards/cen/d3b72aaf-b3a6-4102-aec4-5778ce50250a/en-iso-12870-2025",
      kind: "official-doc",
      claim: "Spectacle frame claims require explicit requirements and test methods; research scaffolds must not imply certification.",
    },
    {
      id: "parametric-eyewear",
      title: "Parametric design for custom-fit eyewear frames",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC10559553/",
      kind: "paper",
      claim: "Functional eyewear design benefits from parameterized frame geometry tied to fit and assembly constraints.",
    },
  ];
}

export function makeThreeDPartResearchRalphReceipt(input: {
  goal: string;
  objectCategory?: string;
  components?: PartResearchComponentInput[];
  generatedAt?: string;
  status?: PartResearchStageStatus;
  evidenceRoot?: string;
}): ThreeDPartResearchRalphReceipt {
  const components = input.components?.length ? input.components : defaultEyewearParts();
  const status = input.status ?? "planned";
  const loops = components.map((component, index) => makePartLoop(component, components, index, status, input.evidenceRoot ?? "part-research"));
  return {
    schemaVersion: 1,
    goal: input.goal,
    objectCategory: input.objectCategory ?? "eyewear",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    sources: threeDPartResearchSources(),
    partLoops: loops,
    compositionGraph: {
      nodes: loops.map((loop) => loop.partId),
      edges: loops.flatMap((loop) =>
        loop.compositionInterfaces.map((edge) => ({
          fromPartId: loop.partId,
          toPartId: edge.targetPartId,
          constraint: edge.constraint,
          sourceIds: edge.sourceIds,
        })),
      ),
    },
    globalCompositionConstraints: [
      "Every generated object must map back to exactly one researched part loop or an explicitly labeled environment/proof helper.",
      "Adjacent parts must name their interface constraint before mesh generation.",
      "Functional geometry/material requirements must be derived from sources and first principles, not copied protected expression.",
      "A whole-asset proof cannot pass while any required part loop is missing R/A/L/P/H evidence.",
    ],
    restrictions: {
      exactReplicaExport: false,
      personalResearchOnly: true,
      notHumanUseApproved: true,
      commercialUseUserOwnedDecision: true,
    },
  };
}

export function verifyThreeDPartResearchRalphReceipt(
  receipt: ThreeDPartResearchRalphReceipt,
  options: { baseDir?: string; requireFiles?: boolean; requireCompleted?: boolean } = {},
): ThreeDPartResearchRalphVerdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  const baseDir = options.baseDir ?? process.cwd();
  const requireFiles = options.requireFiles ?? true;
  const requireCompleted = options.requireCompleted ?? true;

  if (receipt.schemaVersion !== 1) errors.push("part research RALPH receipt schemaVersion must be 1");
  if (!receipt.goal?.trim()) errors.push("part research RALPH receipt requires goal");
  if (!receipt.objectCategory?.trim()) errors.push("part research RALPH receipt requires objectCategory");
  if (receipt.restrictions?.exactReplicaExport !== false) errors.push("part research RALPH must block exactReplicaExport");
  if (receipt.restrictions?.notHumanUseApproved !== true) errors.push("part research RALPH must not approve human use");
  if (receipt.restrictions?.commercialUseUserOwnedDecision !== true) errors.push("commercial/deployment decision must stay user-owned");

  const sourceIds = new Set((receipt.sources ?? []).map((source) => source.id));
  for (const required of ["partnet-dataset", "p3d-bench", "text2cad"]) {
    if (!sourceIds.has(required)) errors.push(`missing part research source: ${required}`);
  }

  if (!receipt.partLoops?.length) errors.push("part research RALPH requires at least one part loop");
  const partIds = new Set(receipt.partLoops.map((loop) => loop.partId));
  const graphNodes = new Set(receipt.compositionGraph?.nodes ?? []);
  for (const id of partIds) {
    if (!graphNodes.has(id)) errors.push(`composition graph missing node for part: ${id}`);
  }

  for (const loop of receipt.partLoops ?? []) {
    if (!loop.partId || !loop.label || !loop.role) errors.push(`part loop ${loop.partId || "<missing>"} requires id, label, and role`);
    if (loop.researchSourceIds.length < 2) errors.push(`part ${loop.partId} requires at least two research sources`);
    for (const sourceId of loop.researchSourceIds) {
      if (!sourceIds.has(sourceId)) errors.push(`part ${loop.partId} references unknown source ${sourceId}`);
    }
    if (loop.functionalRequirements.length < 2) errors.push(`part ${loop.partId} requires at least two functional requirements`);
    for (const requirement of loop.functionalRequirements) {
      if (requirement.sourceIds.length === 0) errors.push(`part ${loop.partId} requirement ${requirement.id} has no sourceIds`);
      if (requirement.evidenceRequired.length === 0) errors.push(`part ${loop.partId} requirement ${requirement.id} has no evidence requirements`);
    }
    if (loop.compositionInterfaces.length === 0) errors.push(`part ${loop.partId} requires at least one composition interface`);
    for (const edge of loop.compositionInterfaces) {
      if (!partIds.has(edge.targetPartId) && edge.targetPartId !== "scene") {
        errors.push(`part ${loop.partId} interface ${edge.id} targets unknown part ${edge.targetPartId}`);
      }
      if (edge.sourceIds.length === 0) errors.push(`part ${loop.partId} interface ${edge.id} has no sourceIds`);
    }
    if (loop.localGeometryPlan.generatedFromFunctionalSpecOnly !== true) {
      errors.push(`part ${loop.partId} geometry must be generated from functional spec only`);
    }
    for (const stage of partResearchRalphStages) {
      const stageReceipt = loop.stages?.[stage];
      if (!stageReceipt) {
        errors.push(`part ${loop.partId} missing nested RALPH stage ${stage}`);
        continue;
      }
      if (requireCompleted && stageReceipt.status !== "completed") {
        errors.push(`part ${loop.partId} stage ${stage} is not completed`);
      }
      if (stageReceipt.requiredReceipts.length === 0) errors.push(`part ${loop.partId} stage ${stage} has no required receipts`);
      if (stageReceipt.evidencePaths.length === 0) errors.push(`part ${loop.partId} stage ${stage} has no evidence paths`);
      if (requireFiles) {
        for (const path of stageReceipt.evidencePaths) {
          if (!existsSync(resolve(baseDir, path))) errors.push(`part ${loop.partId} stage ${stage} evidence file does not exist: ${path}`);
        }
      }
    }
    if (loop.unsupportedUntil.length === 0) warnings.push(`part ${loop.partId} has no unsupported-until limits; check overclaims`);
  }

  if ((receipt.compositionGraph?.edges ?? []).length < Math.max(0, partIds.size - 1)) {
    errors.push("composition graph must connect the part loops with interface constraints");
  }
  if ((receipt.globalCompositionConstraints ?? []).length < 3) errors.push("global composition constraints are too thin");

  return { ok: errors.length === 0, errors, warnings };
}

function makePartLoop(
  component: PartResearchComponentInput,
  allComponents: PartResearchComponentInput[],
  index: number,
  status: PartResearchStageStatus,
  evidenceRoot: string,
): PartResearchRalphLoop {
  const sourceIds = sourceIdsForPart(component);
  const target = adjacentTarget(component, allComponents, index);
  return {
    partId: component.id,
    label: component.label,
    partClass: component.partClass ?? classifyPart(component),
    role: component.role,
    researchSourceIds: sourceIds,
    functionalRequirements: [
      {
        id: `${component.id}-function`,
        requirement: `Define what ${component.label} must do in the assembly before geometry is generated.`,
        sourceIds,
        evidenceRequired: ["functional role note", "part-level source note"],
      },
      {
        id: `${component.id}-geometry-material`,
        requirement: `Choose geometry and material from the functional spec and target workflow, not from protected source expression.`,
        sourceIds: ["p3d-bench", "text2cad", ...sourceIds.slice(0, 1)],
        evidenceRequired: ["primitive/dimension note", "material intent note", "clean-room delta"],
      },
    ],
    compositionInterfaces: [
      {
        id: `${component.id}-to-${target}`,
        targetPartId: target,
        constraint: interfaceConstraint(component, target),
        sourceIds: ["p3d-bench", "histcad", ...sourceIds.slice(0, 1)],
        evidenceRequired: ["adjacency/constraint note", "assembly graph edge"],
      },
    ],
    localGeometryPlan: {
      primitive: component.geometryPrimitive ?? "functional-primitive",
      dimensions: component.dimensions,
      material: component.material ?? materialForPart(component),
      generatedFromFunctionalSpecOnly: true,
    },
    stages: makeStages(component, evidenceRoot, status),
    unsupportedUntil: [
      "No exact replica export until rights/provenance and similarity review pass.",
      "No human-use or physical-use claim until hazard, fit, and qualified review receipts exist.",
      "No industry-grade claim until topology, UV, PBR, GLB/glTF, reopen, and benchmark receipts exist.",
    ],
  };
}

function makeStages(
  component: PartResearchComponentInput,
  evidenceRoot: string,
  status: PartResearchStageStatus,
): Record<PartResearchRalphStage, PartResearchStageReceipt> {
  const prefix = `${evidenceRoot}/${component.id}`;
  return {
    R: stage("R", "Research", `What does ${component.label} do and which sources support that role?`, ["source-map", "part-function-note"], [`${prefix}/R-research.md`], status),
    A: stage("A", "Assembly", `Which neighboring parts constrain ${component.label}?`, ["interface-constraint", "assembly-edge"], [`${prefix}/A-assembly.md`], status),
    L: stage("L", "Local Geometry", `What primitive/material/dimensions make ${component.label} functional?`, ["geometry-plan", "material-plan"], [`${prefix}/L-local-geometry.md`], status),
    P: stage("P", "Proof", `How is ${component.label} proven in the generated asset and UI?`, ["mesh-object-proof", "viewer-focus-or-reopen-proof"], [`${prefix}/P-proof.md`], status),
    H: stage("H", "Hardening", `Which claims are still blocked for ${component.label}?`, ["unsupported-claim-labels", "safety-use-limits"], [`${prefix}/H-hardening.md`], status),
  };
}

function stage(
  stageId: PartResearchRalphStage,
  label: string,
  question: string,
  requiredReceipts: string[],
  evidencePaths: string[],
  status: PartResearchStageStatus,
): PartResearchStageReceipt {
  return { stage: stageId, label, question, requiredReceipts, evidencePaths, status };
}

function defaultEyewearParts(): PartResearchComponentInput[] {
  return [
    { id: "left-frame-ring", label: "Left frame ring", role: "Holds and surrounds the left lens.", partClass: "rim/eyewire", material: "frame polymer or metal", geometryPrimitive: "torus/oval rim" },
    { id: "right-frame-ring", label: "Right frame ring", role: "Holds and surrounds the right lens.", partClass: "rim/eyewire", material: "frame polymer or metal", geometryPrimitive: "torus/oval rim" },
    { id: "left-lens", label: "Left lens", role: "Transparent optical insert placeholder.", partClass: "lens", material: "transparent glass/plastic", geometryPrimitive: "ellipsoid insert" },
    { id: "right-lens", label: "Right lens", role: "Transparent optical insert placeholder.", partClass: "lens", material: "transparent glass/plastic", geometryPrimitive: "ellipsoid insert" },
    { id: "bridge", label: "Bridge", role: "Connects the two front frame modules over the nose.", partClass: "bridge", material: "frame polymer or metal", geometryPrimitive: "box/curved connector" },
    { id: "left-hinge", label: "Left hinge", role: "Connects left front frame to left temple arm.", partClass: "hinge/end-piece", material: "metal joint", geometryPrimitive: "block joint" },
    { id: "right-hinge", label: "Right hinge", role: "Connects right front frame to right temple arm.", partClass: "hinge/end-piece", material: "metal joint", geometryPrimitive: "block joint" },
    { id: "left-temple-arm", label: "Left temple arm", role: "Extends from hinge toward the ear to stabilize the frame.", partClass: "temple", material: "frame polymer or metal", geometryPrimitive: "long arm" },
    { id: "right-temple-arm", label: "Right temple arm", role: "Extends from hinge toward the ear to stabilize the frame.", partClass: "temple", material: "frame polymer or metal", geometryPrimitive: "long arm" },
    { id: "left-nose-pad", label: "Left nose pad", role: "Soft support/contact pad near the bridge.", partClass: "nose-pad", material: "rubber/silicone", geometryPrimitive: "ellipsoid pad" },
    { id: "right-nose-pad", label: "Right nose pad", role: "Soft support/contact pad near the bridge.", partClass: "nose-pad", material: "rubber/silicone", geometryPrimitive: "ellipsoid pad" },
  ];
}

function sourceIdsForPart(component: PartResearchComponentInput): string[] {
  const text = `${component.id} ${component.label} ${component.role} ${component.partClass ?? ""}`.toLowerCase();
  const base = ["partnet-dataset", "partnet-recursive", "p3d-bench"];
  if (/lens|frame|rim|bridge|hinge|temple|nose|pad|eyewire/.test(text)) {
    return [...base, "eyewear-frame-parts", "eyewear-anatomy", "iso-12870", "parametric-eyewear"];
  }
  if (/cad|bracket|joint|constraint|assembly/.test(text)) return [...base, "text2cad", "histcad"];
  return [...base, "sam-part-3d", "text2cad"];
}

function classifyPart(component: PartResearchComponentInput): string {
  const text = `${component.id} ${component.label}`.toLowerCase();
  if (text.includes("lens")) return "lens";
  if (text.includes("hinge")) return "hinge/end-piece";
  if (text.includes("temple") || text.includes("arm")) return "temple";
  if (text.includes("bridge")) return "bridge";
  if (text.includes("pad")) return "nose-pad";
  if (text.includes("frame") || text.includes("ring") || text.includes("rim")) return "rim/eyewire";
  return "functional-part";
}

function materialForPart(component: PartResearchComponentInput): string {
  const partClass = component.partClass ?? classifyPart(component);
  if (partClass.includes("lens")) return "transparent glass/plastic";
  if (partClass.includes("hinge")) return "metal joint";
  if (partClass.includes("pad")) return "soft rubber/silicone";
  return "structural polymer/metal";
}

function adjacentTarget(component: PartResearchComponentInput, allComponents: PartResearchComponentInput[], index: number): string {
  const text = `${component.id} ${component.label}`.toLowerCase();
  if (text.includes("left-lens")) return "left-frame-ring";
  if (text.includes("right-lens")) return "right-frame-ring";
  if (text.includes("left-hinge")) return "left-frame-ring";
  if (text.includes("right-hinge")) return "right-frame-ring";
  if (text.includes("left-temple")) return "left-hinge";
  if (text.includes("right-temple")) return "right-hinge";
  if (text.includes("nose-pad")) return "bridge";
  if (text.includes("bridge")) return allComponents.find((part) => part.id.includes("frame-ring"))?.id ?? "scene";
  return allComponents[(index + 1) % allComponents.length]?.id ?? "scene";
}

function interfaceConstraint(component: PartResearchComponentInput, targetPartId: string): string {
  const partClass = component.partClass ?? classifyPart(component);
  if (partClass.includes("lens")) return `Seat inside ${targetPartId} without claiming certified optical geometry.`;
  if (partClass.includes("hinge")) return `Align hinge block with ${targetPartId} and the matching temple arm pivot.`;
  if (partClass.includes("temple")) return `Attach to ${targetPartId} with foldable side-arm clearance.`;
  if (partClass.includes("nose-pad")) return `Attach to ${targetPartId} as a soft support placeholder, not a fit-certified contact surface.`;
  if (partClass.includes("bridge")) return `Join front frame modules while preserving original clean-room proportions.`;
  return `Declare adjacency and scale constraint with ${targetPartId}.`;
}
