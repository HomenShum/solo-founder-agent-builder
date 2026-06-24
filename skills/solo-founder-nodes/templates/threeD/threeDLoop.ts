export const threeDProofStates = ["pass", "fallback_delivered", "needs_more_capture", "blocked_compute", "failed_with_receipt"] as const;
export type ThreeDProofState = (typeof threeDProofStates)[number];

export const firstPartyThreeDLanes = [
  "capture-intake",
  "coverage-scoring",
  "multiview-reconstruction",
  "gaussian-splat-rendering",
  "single-image-asset",
  "text-to-asset",
  "depth-fallback",
  "assetize-export",
  "viewer-action-protocol",
] as const;
export type FirstPartyThreeDLane = (typeof firstPartyThreeDLanes)[number];

export const optionalThreeDProviders = ["meshy", "tripo", "rodin-hyper3d", "luma"] as const;
export type OptionalThreeDProvider = (typeof optionalThreeDProviders)[number];

export type ThreeDBenchmarkId = "tanks-and-temples" | "dtu-mvs" | "co3d" | "objaverse" | "hy3d-bench" | "p3d-bench" | "fresh-founder-3d";

export type ThreeDPlan = {
  schemaVersion: 1;
  goal: string;
  mode: "first-party-core" | "provider-fallback" | "comparator-only";
  generatedAt: string;
  firstPartyLanes: Array<{
    id: FirstPartyThreeDLane;
    role: string;
    references: string[];
    proofRequired: string[];
  }>;
  providerPolicy: {
    defaultRole: "comparator_or_fallback_only";
    providers: OptionalThreeDProvider[];
    mustNotBlockCoreProof: boolean;
  };
  benchmarks: Array<{
    id: ThreeDBenchmarkId;
    role: string;
    required: boolean;
  }>;
  proofStates: ThreeDProofState[];
  exportTargets: string[];
};

export type ThreeDPlanVerdict = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function makeThreeDPlan(input: {
  goal: string;
  mode?: ThreeDPlan["mode"];
  generatedAt?: string;
}): ThreeDPlan {
  return {
    schemaVersion: 1,
    goal: input.goal,
    mode: input.mode ?? "first-party-core",
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    firstPartyLanes: [
      lane("capture-intake", "Accept text, one image, multi-view images, and video-frame references.", ["CO3D", "Objaverse"], ["input-manifest", "capture-coverage-receipt"]),
      lane("coverage-scoring", "Warn when user inputs cannot support the requested 3D quality.", ["COLMAP", "VGGT", "DUSt3R", "MASt3R"], ["coverage-score", "needs-more-capture-state"]),
      lane("multiview-reconstruction", "Recover camera/depth/point structure when enough references exist.", ["COLMAP", "VGGT", "DUSt3R", "MASt3R"], ["camera-pose-receipt", "point-cloud-or-depth-artifact"]),
      lane("gaussian-splat-rendering", "Render navigable reconstruction for scenes and objects.", ["3D Gaussian Splatting", "gsplat", "msplat"], ["splat-artifact", "viewer-screenshot"]),
      lane("single-image-asset", "Generate a usable mesh asset from a single image.", ["InstantMesh", "Stable Fast 3D", "TRELLIS", "Hunyuan3D"], ["glb-or-usdz", "asset-validity-check"]),
      lane("text-to-asset", "Generate a mesh asset from text when no image exists.", ["DreamFusion", "Magic3D", "Shap-E", "TRELLIS"], ["prompt-alignment-score", "generated-asset"]),
      lane("depth-fallback", "Provide a navigable fallback when full reconstruction is blocked.", ["Depth Anything", "Video Depth Anything"], ["fallback-depth-map", "fallback-viewer-proof"]),
      lane("assetize-export", "Convert outputs into portable artifacts.", ["glTF", "USDZ", "OBJ", "STL"], ["exported-file", "reopen-proof", "hash"]),
      lane("viewer-action-protocol", "Let the chat agent act inside the viewer with typed actions.", ["ReAct", "Toolformer", "WebArena", "OSWorld"], ["action-schema", "playwright-trace", "viewer-state-receipt"]),
    ],
    providerPolicy: {
      defaultRole: "comparator_or_fallback_only",
      providers: [...optionalThreeDProviders],
      mustNotBlockCoreProof: true,
    },
    benchmarks: [
      { id: "fresh-founder-3d", role: "Screenshot-derived real user task through the actual UI.", required: true },
      { id: "objaverse", role: "Asset validity and category diversity reference.", required: true },
      { id: "hy3d-bench", role: "Current 3D asset generation quality benchmark.", required: true },
      { id: "p3d-bench", role: "Parametric / instruction-to-3D eval reference.", required: false },
      { id: "co3d", role: "Multi-view object reconstruction reference.", required: false },
      { id: "tanks-and-temples", role: "Scene reconstruction reference.", required: false },
      { id: "dtu-mvs", role: "Multi-view stereo geometry reference.", required: false },
    ],
    proofStates: [...threeDProofStates],
    exportTargets: ["glb", "gltf", "usdz", "obj", "stl", "viewer-url", "blender-open-proof", "cad-stretch-label"],
  };
}

export function verifyThreeDPlan(plan: ThreeDPlan): ThreeDPlanVerdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (plan.schemaVersion !== 1) errors.push("3D plan schemaVersion must be 1");
  if (!plan.goal.trim()) errors.push("3D plan requires a goal");
  const laneIds = new Set(plan.firstPartyLanes.map((lane) => lane.id));
  for (const required of firstPartyThreeDLanes) {
    if (!laneIds.has(required)) errors.push(`missing first-party 3D lane: ${required}`);
  }
  if (plan.providerPolicy.defaultRole !== "comparator_or_fallback_only") {
    errors.push("providers must default to comparator_or_fallback_only");
  }
  if (plan.providerPolicy.mustNotBlockCoreProof !== true) {
    errors.push("provider availability must not block first-party core proof");
  }
  if (!plan.benchmarks.some((benchmark) => benchmark.id === "fresh-founder-3d" && benchmark.required)) {
    errors.push("fresh-founder-3d benchmark is required");
  }
  if (!plan.benchmarks.some((benchmark) => benchmark.id === "hy3d-bench" && benchmark.required)) {
    errors.push("HY3D-Bench reference is required for current 3D quality comparison");
  }
  for (const state of threeDProofStates) {
    if (!plan.proofStates.includes(state)) errors.push(`missing 3D proof state: ${state}`);
  }
  if (!plan.exportTargets.includes("glb") || !plan.exportTargets.includes("blender-open-proof")) {
    errors.push("3D plan must include GLB export and Blender open proof");
  }
  if (plan.exportTargets.includes("cad-native-pass")) {
    warnings.push("CAD-native pass should remain a separate proof lane unless a CAD adapter is verified");
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function makeThreeDComparatorRubric() {
  return {
    schemaVersion: 1,
    providers: [...optionalThreeDProviders],
    metrics: [
      { id: "asset-validity", points: 20, evidence: ["loadable GLB/USDZ", "geometry/material presence", "reopen proof"] },
      { id: "visual-alignment", points: 20, evidence: ["input screenshot", "viewer screenshot", "human/ML rubric score"] },
      { id: "editability", points: 15, evidence: ["Blender open proof", "mesh/material notes", "CAD stretch label"] },
      { id: "latency", points: 10, evidence: ["queue/runtime timestamps"] },
      { id: "cost", points: 10, evidence: ["provider or local compute cost ledger"] },
      { id: "ui-completion", points: 15, evidence: ["fresh-room trace", "chat action protocol", "export path"] },
      { id: "fallback-quality", points: 10, evidence: ["fallback state", "needs-more-capture explanation", "nonblank viewer proof"] },
    ],
    passRule: "Score all first-party outputs and optional provider outputs with the same rubric; providers are comparators/fallbacks, not the default product architecture.",
  };
}

function lane(id: FirstPartyThreeDLane, role: string, references: string[], proofRequired: string[]) {
  return { id, role, references, proofRequired };
}
