import { existsSync } from "node:fs";
import { resolve } from "node:path";

export type ThreeDAssetClaimLevel = "personal-research-scaffold" | "prototype" | "industry-grade";

export type ThreeDAssetTarget =
  | "viewer"
  | "game"
  | "cad"
  | "character"
  | "scene"
  | "marketplace";

export type ThreeDAssetQualitySourceKind =
  | "paper"
  | "official-doc"
  | "benchmark"
  | "engine-doc";

export type ThreeDAssetQualitySource = {
  id: string;
  title: string;
  url: string;
  kind: ThreeDAssetQualitySourceKind;
  claim: string;
};

export type ThreeDAssetQualityCriterionId =
  | "semantic-part-graph"
  | "geometry-validity"
  | "topology-retopo"
  | "uv-unwrap"
  | "pbr-materials"
  | "portable-engine-export"
  | "dcc-reopen-proof"
  | "lod-collision-pivot"
  | "benchmark-scorecard";

export type ThreeDAssetQualityCriterion = {
  id: ThreeDAssetQualityCriterionId;
  requiredFor: ThreeDAssetClaimLevel[];
  evidence: string[];
  sourceIds: string[];
};

export type ThreeDMeshStats = {
  vertices: number;
  faces: number;
  objectCount: number;
  degenerateFaces: number;
  nonManifoldEdges?: number;
  normalsPresent: boolean;
  unitScale?: string;
};

export type ThreeDAssetQualityReceipt = {
  schemaVersion: 1;
  goal: string;
  target: ThreeDAssetTarget;
  claimLevel: ThreeDAssetClaimLevel;
  generatedAt: string;
  researchSourceIds: string[];
  criteria: ThreeDAssetQualityCriterionId[];
  evidence: {
    semanticPartGraphPath?: string;
    meshStats?: ThreeDMeshStats;
    topologyReportPath?: string;
    uvReportPath?: string;
    pbrMaterialMapPaths?: {
      baseColor?: string;
      normal?: string;
      roughness?: string;
      metallic?: string;
      ambientOcclusion?: string;
    };
    exports?: {
      glb?: string;
      gltf?: string;
      usdz?: string;
      obj?: string;
      stl?: string;
    };
    reopenProofPaths?: string[];
    viewerScreenshotPaths?: string[];
    wireframeScreenshotPaths?: string[];
    uvScreenshotPaths?: string[];
    lodCollisionPivotReceiptPath?: string;
    benchmarkScorecardPath?: string;
    rightsProvenanceReceiptPath?: string;
  };
  restrictions: {
    exactReplicaExport: false;
    personalResearchOnly?: boolean;
    notProductionReady?: boolean;
  };
};

export type ThreeDAssetQualityPlan = {
  schemaVersion: 1;
  goal: string;
  target: ThreeDAssetTarget;
  claimLevel: ThreeDAssetClaimLevel;
  generatedAt: string;
  sources: ThreeDAssetQualitySource[];
  criteria: ThreeDAssetQualityCriterion[];
  requiredEvidence: string[];
  failClosedRules: string[];
};

export type ThreeDAssetQualityVerdict = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export const threeDAssetTargets: ThreeDAssetTarget[] = ["viewer", "game", "cad", "character", "scene", "marketplace"];
export const threeDAssetClaimLevels: ThreeDAssetClaimLevel[] = ["personal-research-scaffold", "prototype", "industry-grade"];

export function threeDAssetQualitySources(): ThreeDAssetQualitySource[] {
  return [
    {
      id: "production-ready-3d-survey",
      title: "From Visual Synthesis to Interactive Worlds: Toward Production-Ready 3D Asset Generation",
      url: "https://arxiv.org/html/2604.23629v2",
      kind: "paper",
      claim: "Production-ready 3D assets need topology, UVs, PBR materials, rigging/editability, physics/collision metadata, and engine import proof, not just visual plausibility.",
    },
    {
      id: "hunyuan3d-21",
      title: "Hunyuan3D 2.1: From Images to High-Fidelity 3D Assets with Production-Ready PBR Material",
      url: "https://arxiv.org/html/2506.15442v1",
      kind: "paper",
      claim: "High-fidelity image-to-3D separates shape generation from mesh-conditioned PBR texture generation with aligned albedo, metallic, and roughness maps.",
    },
    {
      id: "p3d-bench",
      title: "P3D-Bench",
      url: "https://arxiv.org/abs/2606.11152",
      kind: "benchmark",
      claim: "3D evaluation should include executability, geometric fidelity, topology, text-grounded constraints, multi-view semantic alignment, and part-level structure.",
    },
    {
      id: "assetgen",
      title: "AssetGen: Deployable 3D Asset Generation at Interactive Speed",
      url: "https://arxiv.org/html/2605.26137v1",
      kind: "paper",
      claim: "Deployable asset evaluation inspects mesh, texture, UV layout, and wireframe in an interactive 3D viewer.",
    },
    {
      id: "gltf-20",
      title: "glTF 2.0 Specification",
      url: "https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html",
      kind: "official-doc",
      claim: "glTF is an interoperable runtime delivery format for 3D assets moving between DCC tools and engines.",
    },
    {
      id: "gltf-pbr",
      title: "Khronos glTF Physically Based Rendering",
      url: "https://www.khronos.org/gltf/pbr/",
      kind: "official-doc",
      claim: "glTF PBR assets need material parameters that produce predictable lighting across engines.",
    },
    {
      id: "unreal-static-mesh",
      title: "Unreal Engine FBX Static Mesh Pipeline",
      url: "https://dev.epicgames.com/documentation/unreal-engine/fbx-static-mesh-pipeline-in-unreal-engine?lang=en-US",
      kind: "engine-doc",
      claim: "Engine-ready static meshes need aligned pivots, materials, and LOD-aware import behavior.",
    },
    {
      id: "unity-lod",
      title: "Unity Level of Detail Manual",
      url: "https://docs.unity3d.com/6000.5/Documentation/Manual/LevelOfDetail.html",
      kind: "engine-doc",
      claim: "Game/runtime assets should include lower-detail mesh/material variants for performance-sensitive views.",
    },
  ];
}

export function makeThreeDAssetQualityPlan(input: {
  goal: string;
  target?: ThreeDAssetTarget;
  claimLevel?: ThreeDAssetClaimLevel;
  generatedAt?: string;
}): ThreeDAssetQualityPlan {
  const target = input.target ?? "viewer";
  const claimLevel = input.claimLevel ?? "industry-grade";
  const criteria = threeDAssetQualityCriteria(target);
  const required = criteria.filter((criterion) => criterion.requiredFor.includes(claimLevel));
  return {
    schemaVersion: 1,
    goal: input.goal,
    target,
    claimLevel,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    sources: threeDAssetQualitySources(),
    criteria,
    requiredEvidence: required.flatMap((criterion) => criterion.evidence),
    failClosedRules: [
      "Do not call an OBJ-only scaffold industry-grade.",
      "Do not claim photo/video reconstruction unless coverage, camera/depth, and asset validity receipts exist.",
      "Do not claim game/CAD/marketplace readiness without GLB/glTF or engine import proof, topology, UV, PBR, and reopen evidence.",
      "Do not export exact replicas or source-derived protected mesh/texture without rights/provenance and explicit user-owned approval.",
    ],
  };
}

export function verifyThreeDAssetQualityReceipt(
  receipt: ThreeDAssetQualityReceipt,
  options: { baseDir?: string; requireFiles?: boolean } = {},
): ThreeDAssetQualityVerdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  const baseDir = options.baseDir ?? process.cwd();
  const requireFiles = options.requireFiles ?? true;

  if (receipt.schemaVersion !== 1) errors.push("3D asset quality receipt schemaVersion must be 1");
  if (!receipt.goal?.trim()) errors.push("3D asset quality receipt requires goal");
  if (!threeDAssetTargets.includes(receipt.target)) errors.push(`unsupported 3D asset target '${receipt.target}'`);
  if (!threeDAssetClaimLevels.includes(receipt.claimLevel)) errors.push(`unsupported 3D asset claim level '${receipt.claimLevel}'`);
  if (receipt.restrictions?.exactReplicaExport !== false) errors.push("3D asset quality receipt must block exactReplicaExport");

  const requiredSources = ["production-ready-3d-survey", "hunyuan3d-21", "p3d-bench", "assetgen", "gltf-20", "gltf-pbr"];
  for (const sourceId of requiredSources) {
    if (!receipt.researchSourceIds.includes(sourceId)) errors.push(`missing 3D asset quality research source: ${sourceId}`);
  }

  const criteria = threeDAssetQualityCriteria(receipt.target);
  const requiredCriteria = criteria.filter((criterion) => criterion.requiredFor.includes(receipt.claimLevel));
  for (const criterion of requiredCriteria) {
    if (!receipt.criteria.includes(criterion.id)) errors.push(`missing required 3D asset quality criterion: ${criterion.id}`);
  }

  const evidence = receipt.evidence ?? {};
  const meshStats = evidence.meshStats;
  const exportCount = Object.values(evidence.exports ?? {}).filter(Boolean).length;
  const hasRuntimeExport = Boolean(evidence.exports?.glb || evidence.exports?.gltf);

  if (receipt.claimLevel === "personal-research-scaffold") {
    if (!evidence.exports?.obj && !hasRuntimeExport) errors.push("personal-research scaffold still needs an export artifact");
    warnings.push("personal-research-scaffold is not production-ready and must not be described as industry-grade");
  }

  if (receipt.claimLevel === "prototype" || receipt.claimLevel === "industry-grade") {
    if (!evidence.semanticPartGraphPath) errors.push("missing semantic part graph / component tree evidence");
    if (!meshStats) {
      errors.push("missing mesh stats evidence");
    } else {
      if (meshStats.vertices <= 0 || meshStats.faces <= 0 || meshStats.objectCount <= 0) errors.push("mesh stats must show non-empty geometry");
      if (meshStats.degenerateFaces > 0) errors.push("mesh stats must show zero degenerate faces");
      if (!meshStats.normalsPresent) errors.push("mesh stats must prove normals are present");
    }
    if (!hasRuntimeExport) errors.push("prototype/industry 3D asset must include GLB or glTF export");
    if (exportCount === 1 && evidence.exports?.obj) errors.push("OBJ-only export cannot pass prototype or industry-grade 3D quality");
    if ((evidence.reopenProofPaths ?? []).length === 0) errors.push("missing DCC/viewer reopen proof");
    if ((evidence.viewerScreenshotPaths ?? []).length === 0) errors.push("missing viewer screenshot evidence");
  }

  if (receipt.claimLevel === "industry-grade") {
    if (!evidence.topologyReportPath) errors.push("industry-grade asset requires topology/retopo report");
    if (!evidence.uvReportPath) errors.push("industry-grade asset requires UV unwrap report");
    const maps = evidence.pbrMaterialMapPaths ?? {};
    for (const map of ["baseColor", "normal", "roughness", "metallic"] as const) {
      if (!maps[map]) errors.push(`industry-grade asset requires PBR material map: ${map}`);
    }
    if ((evidence.wireframeScreenshotPaths ?? []).length === 0) errors.push("industry-grade asset requires wireframe screenshot evidence");
    if ((evidence.uvScreenshotPaths ?? []).length === 0) errors.push("industry-grade asset requires UV layout screenshot evidence");
    if (!evidence.benchmarkScorecardPath) errors.push("industry-grade asset requires benchmark/scorecard evidence");
    if (needsRuntimeMetadata(receipt.target) && !evidence.lodCollisionPivotReceiptPath) {
      errors.push(`target '${receipt.target}' requires LOD/collision/pivot receipt`);
    }
  }

  if (requireFiles) {
    const paths = [
      evidence.semanticPartGraphPath,
      evidence.topologyReportPath,
      evidence.uvReportPath,
      evidence.pbrMaterialMapPaths?.baseColor,
      evidence.pbrMaterialMapPaths?.normal,
      evidence.pbrMaterialMapPaths?.roughness,
      evidence.pbrMaterialMapPaths?.metallic,
      evidence.pbrMaterialMapPaths?.ambientOcclusion,
      evidence.exports?.glb,
      evidence.exports?.gltf,
      evidence.exports?.usdz,
      evidence.exports?.obj,
      evidence.exports?.stl,
      evidence.lodCollisionPivotReceiptPath,
      evidence.benchmarkScorecardPath,
      evidence.rightsProvenanceReceiptPath,
      ...(evidence.reopenProofPaths ?? []),
      ...(evidence.viewerScreenshotPaths ?? []),
      ...(evidence.wireframeScreenshotPaths ?? []),
      ...(evidence.uvScreenshotPaths ?? []),
    ].filter(Boolean) as string[];
    for (const path of paths) {
      if (!existsSync(resolve(baseDir, path))) errors.push(`3D asset quality evidence file does not exist: ${path}`);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

function threeDAssetQualityCriteria(target: ThreeDAssetTarget): ThreeDAssetQualityCriterion[] {
  const runtimeRequired: ThreeDAssetClaimLevel[] = needsRuntimeMetadata(target) ? ["industry-grade"] : [];
  return [
    criterion("semantic-part-graph", ["prototype", "industry-grade"], ["component tree", "part roles", "dimensions/constraints"], ["p3d-bench", "production-ready-3d-survey"]),
    criterion("geometry-validity", ["prototype", "industry-grade"], ["mesh stats", "normals", "non-degenerate faces", "unit scale"], ["assetgen", "p3d-bench"]),
    criterion("topology-retopo", ["industry-grade"], ["topology report", "wireframe screenshot", "editability note"], ["production-ready-3d-survey", "assetgen", "p3d-bench"]),
    criterion("uv-unwrap", ["industry-grade"], ["UV report", "UV layout screenshot", "distortion/overlap note"], ["production-ready-3d-survey", "assetgen"]),
    criterion("pbr-materials", ["industry-grade"], ["baseColor/albedo", "normal", "roughness", "metallic material maps"], ["hunyuan3d-21", "gltf-pbr"]),
    criterion("portable-engine-export", ["prototype", "industry-grade"], ["GLB/glTF export", "hash", "format note"], ["gltf-20", "gltf-pbr"]),
    criterion("dcc-reopen-proof", ["prototype", "industry-grade"], ["Blender/Three.js/glTF-viewer reopen", "viewer screenshot"], ["assetgen", "gltf-20"]),
    criterion("lod-collision-pivot", runtimeRequired, ["LOD/collision/pivot receipt", "engine import note"], ["unreal-static-mesh", "unity-lod"]),
    criterion("benchmark-scorecard", ["industry-grade"], ["P3D/HY3D/AssetGen-style scorecard", "human inspection notes"], ["p3d-bench", "assetgen"]),
  ];
}

function criterion(
  id: ThreeDAssetQualityCriterionId,
  requiredFor: ThreeDAssetClaimLevel[],
  evidence: string[],
  sourceIds: string[],
): ThreeDAssetQualityCriterion {
  return { id, requiredFor, evidence, sourceIds };
}

function needsRuntimeMetadata(target: ThreeDAssetTarget) {
  return target === "game" || target === "character" || target === "scene" || target === "marketplace";
}
