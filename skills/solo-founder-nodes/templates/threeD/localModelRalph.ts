import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export const localThreeDModelIds = ["hunyuan3d-2.0", "trellis"] as const;
export type LocalThreeDModelId = (typeof localThreeDModelIds)[number];

export type LocalThreeDModelStatus = "planned" | "blocked_compute" | "blocked_secret" | "ready_to_run" | "pass" | "failed_with_receipt";

export type LocalThreeDModelBackend = {
  id: LocalThreeDModelId;
  name: string;
  repo: string;
  officialDocs: string;
  huggingFaceModels: string[];
  supportedInputs: Array<"image" | "multi-image" | "text">;
  outputFormats: string[];
  minimumRuntime: {
    os: string[];
    gpu: string;
    vramGb: number;
    python: string;
    notes: string[];
  };
  proofClaimsBlockedUntil: string[];
};

export type LocalThreeDModelRuntimeProbe = {
  checkedAt: string;
  os: string;
  pythonVersion?: string;
  nvidiaSmi?: {
    found: boolean;
    gpuName?: string;
    vramGb?: number;
  };
  torch?: {
    found: boolean;
    version?: string;
    cudaAvailable: boolean;
  };
  hfToken: {
    envName: "HF_TOKEN";
    present: boolean;
    tokenValueRecorded: false;
  };
};

export type LocalThreeDModelRalphReceipt = {
  schemaVersion: 1;
  receiptKind: "local-3d-model-ralph";
  goal: string;
  modelId: LocalThreeDModelId;
  backend: LocalThreeDModelBackend;
  generatedAt: string;
  status: LocalThreeDModelStatus;
  runtime: LocalThreeDModelRuntimeProbe;
  ralph: Record<"R" | "A" | "L" | "P" | "H", {
    status: "completed" | "blocked" | "planned";
    evidence: string[];
  }>;
  setupContract: {
    secretEnvVars: ["HF_TOKEN"];
    installCommands: string[];
    runCommand: string;
    noSecretLogging: true;
    outputDirectory: string;
  };
  inputContract: {
    acceptedInputs: Array<"image" | "multi-image" | "text">;
    rightsProvenanceReceiptRequired: true;
    brushCropReceiptRequired: boolean;
  };
  outputProof: {
    outputAssetPath?: string;
    runtimeLogPath?: string;
    meshValidationPath?: string;
    reopenProofPath?: string;
    viewerScreenshotPath?: string;
  };
  verdict: {
    ok: boolean;
    canClaimModelGeneratedAsset: boolean;
    blockedClaims: string[];
    missingProofs: string[];
    reason: string;
  };
};

export type LocalThreeDModelVerdict = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  missingProofs: string[];
};

export const localThreeDModelBackends: LocalThreeDModelBackend[] = [
  {
    id: "hunyuan3d-2.0",
    name: "Hunyuan3D 2.0",
    repo: "https://github.com/Tencent-Hunyuan/Hunyuan3D-2",
    officialDocs: "https://huggingface.co/tencent/Hunyuan3D-2",
    huggingFaceModels: ["tencent/Hunyuan3D-2", "tencent/Hunyuan3D-2mv", "tencent/Hunyuan3D-2mini"],
    supportedInputs: ["image", "multi-image"],
    outputFormats: ["glb", "obj", "trimesh"],
    minimumRuntime: {
      os: ["Windows", "Linux", "macOS"],
      gpu: "NVIDIA CUDA GPU strongly preferred",
      vramGb: 6,
      python: "3.10+",
      notes: [
        "Official README states shape generation takes about 6 GB VRAM.",
        "Shape plus texture generation takes about 16 GB VRAM.",
        "The shape pipeline is Hunyuan3DDiTFlowMatchingPipeline.from_pretrained('tencent/Hunyuan3D-2').",
      ],
    },
    proofClaimsBlockedUntil: [
      "Textured/PBR Hunyuan asset until paint model output and material map receipts exist.",
      "Industry-grade/game/CAD asset until topology, UV, DCC reopen, and benchmark receipts exist.",
    ],
  },
  {
    id: "trellis",
    name: "TRELLIS image/text-to-3D",
    repo: "https://github.com/microsoft/TRELLIS",
    officialDocs: "https://huggingface.co/microsoft/TRELLIS-image-large",
    huggingFaceModels: ["microsoft/TRELLIS-image-large", "microsoft/TRELLIS-text-base", "microsoft/TRELLIS-text-large", "microsoft/TRELLIS-text-xlarge"],
    supportedInputs: ["image", "multi-image", "text"],
    outputFormats: ["glb", "ply", "mesh", "3d-gaussian", "radiance-field"],
    minimumRuntime: {
      os: ["Linux"],
      gpu: "NVIDIA CUDA GPU",
      vramGb: 16,
      python: "3.10+ with TRELLIS environment",
      notes: [
        "Official README says the code is tested only on Linux.",
        "Official README requires an NVIDIA GPU with at least 16 GB memory.",
        "Text-to-3D is recommended through text-to-image first, then TRELLIS-image.",
      ],
    },
    proofClaimsBlockedUntil: [
      "TRELLIS-generated asset until Linux/CUDA runtime, model output, mesh validation, and reopen receipts exist.",
      "Interactive production-quality asset until exported GLB/mesh loads in the app and passes the quality gate.",
    ],
  },
];

export function getLocalThreeDModelBackend(modelId: LocalThreeDModelId): LocalThreeDModelBackend {
  const backend = localThreeDModelBackends.find((item) => item.id === modelId);
  if (!backend) throw new Error(`unsupported local 3D model: ${modelId}`);
  return backend;
}

export function makeLocalThreeDModelRalphReceipt(input: {
  goal: string;
  modelId: LocalThreeDModelId;
  status?: LocalThreeDModelStatus;
  generatedAt?: string;
  runtime?: Partial<LocalThreeDModelRuntimeProbe>;
  outputProof?: LocalThreeDModelRalphReceipt["outputProof"];
}): LocalThreeDModelRalphReceipt {
  const backend = getLocalThreeDModelBackend(input.modelId);
  const status = input.status ?? "planned";
  const runtime: LocalThreeDModelRuntimeProbe = {
    checkedAt: input.generatedAt ?? new Date().toISOString(),
    os: process.platform,
    hfToken: {
      envName: "HF_TOKEN",
      present: false,
      tokenValueRecorded: false,
    },
    ...input.runtime,
  };
  runtime.hfToken = {
    envName: "HF_TOKEN",
    present: input.runtime?.hfToken?.present ?? false,
    tokenValueRecorded: false,
  };
  const proof = input.outputProof ?? {};
  const canClaim = status === "pass"
    && Boolean(proof.outputAssetPath && proof.runtimeLogPath && proof.meshValidationPath && proof.reopenProofPath && proof.viewerScreenshotPath);
  const missing = canClaim ? [] : requiredOutputProofs(proof);
  const blockedClaims = canClaim ? [] : backend.proofClaimsBlockedUntil;
  const stageStatus = status === "pass" ? "completed" : status.startsWith("blocked") ? "blocked" : "planned";
  return {
    schemaVersion: 1,
    receiptKind: "local-3d-model-ralph",
    goal: input.goal,
    modelId: input.modelId,
    backend,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    status,
    runtime,
    ralph: {
      R: { status: "completed", evidence: [backend.repo, backend.officialDocs] },
      A: { status: "completed", evidence: ["HF_TOKEN env contract", "rights provenance required", "model output proof required"] },
      L: { status: stageStatus, evidence: proof.runtimeLogPath ? [proof.runtimeLogPath] : [] },
      P: { status: canClaim ? "completed" : stageStatus, evidence: [proof.meshValidationPath, proof.reopenProofPath, proof.viewerScreenshotPath].filter(Boolean) as string[] },
      H: { status: canClaim ? "completed" : stageStatus, evidence: ["blocked claims recorded until output proof exists"] },
    },
    setupContract: {
      secretEnvVars: ["HF_TOKEN"],
      installCommands: installCommandsFor(input.modelId),
      runCommand: runCommandFor(input.modelId),
      noSecretLogging: true,
      outputDirectory: "docs/proof/local-model-runs",
    },
    inputContract: {
      acceptedInputs: backend.supportedInputs,
      rightsProvenanceReceiptRequired: true,
      brushCropReceiptRequired: true,
    },
    outputProof: proof,
    verdict: {
      ok: status === "pass" ? canClaim : true,
      canClaimModelGeneratedAsset: canClaim,
      blockedClaims,
      missingProofs: missing,
      reason: canClaim
        ? `${backend.name} produced an asset with runtime, mesh validation, reopen, and viewer proof.`
        : `${backend.name} is wired but cannot satisfy a model-generated asset claim until runtime and output proofs exist.`,
    },
  };
}

export function verifyLocalThreeDModelRalphReceipt(
  receipt: LocalThreeDModelRalphReceipt | undefined,
  options: { baseDir?: string; requireFiles?: boolean; requirePass?: boolean } = {},
): LocalThreeDModelVerdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingProofs: string[] = [];
  const baseDir = options.baseDir ?? process.cwd();
  const requireFiles = options.requireFiles ?? true;
  const requirePass = options.requirePass ?? false;

  if (!receipt) {
    return {
      ok: false,
      errors: ["local 3D model RALPH receipt is required"],
      warnings,
      missingProofs: ["docs/proof/local-model-ralph-receipt.json"],
    };
  }
  if (receipt.schemaVersion !== 1) errors.push("local model receipt schemaVersion must be 1");
  if (receipt.receiptKind !== "local-3d-model-ralph") errors.push("local model receipt kind must be local-3d-model-ralph");
  if (!localThreeDModelIds.includes(receipt.modelId)) errors.push(`unsupported local model id: ${receipt.modelId}`);
  if (!receipt.goal?.trim()) errors.push("local model receipt requires goal");
  if (receipt.setupContract?.noSecretLogging !== true) errors.push("local model setup must forbid secret logging");
  if (!receipt.setupContract?.secretEnvVars?.includes("HF_TOKEN")) errors.push("local model setup must use HF_TOKEN env contract");
  if (receipt.runtime?.hfToken?.tokenValueRecorded !== false) errors.push("local model receipt must not record the HF token value");
  if (!receipt.inputContract?.rightsProvenanceReceiptRequired) errors.push("local model run requires rights provenance before generation");

  const backend = receipt.modelId && localThreeDModelIds.includes(receipt.modelId)
    ? getLocalThreeDModelBackend(receipt.modelId)
    : undefined;
  if (backend && receipt.backend?.repo !== backend.repo) errors.push(`local model backend repo mismatch for ${receipt.modelId}`);

  for (const stage of ["R", "A", "L", "P", "H"] as const) {
    if (!receipt.ralph?.[stage]) errors.push(`local model RALPH missing stage ${stage}`);
  }

  for (const path of Object.values(receipt.outputProof ?? {})) {
    if (typeof path === "string" && looksLikeSecret(path)) {
      errors.push("local model proof path appears to contain a secret token");
    }
  }

  const outputMissing = requiredOutputProofs(receipt.outputProof ?? {});
  if (receipt.status === "pass") {
    if (outputMissing.length > 0) {
      errors.push("passing local model receipt requires output asset, runtime log, mesh validation, reopen proof, and viewer screenshot");
      missingProofs.push(...outputMissing);
    }
    if (!receipt.verdict.canClaimModelGeneratedAsset) errors.push("passing local model receipt must allow model-generated asset claim");
  }
  if (requirePass && receipt.status !== "pass") {
    errors.push(`local model pass required but receipt status is ${receipt.status}`);
    missingProofs.push(...outputMissing);
  }
  if (receipt.status !== "pass" && receipt.verdict.canClaimModelGeneratedAsset) {
    errors.push("non-passing local model receipt cannot claim model-generated asset");
  }
  if (receipt.status === "blocked_compute" && !receipt.runtime?.torch) warnings.push("blocked_compute should include torch probe evidence when available");

  if (requireFiles) {
    for (const path of receipt.status === "pass" ? outputMissingFreePaths(receipt.outputProof ?? {}) : []) {
      if (!existsSync(resolve(baseDir, path))) {
        errors.push(`local model proof file does not exist: ${path}`);
        missingProofs.push(path);
      }
    }
  }

  return {
    ok: errors.length === 0 && (!requirePass || receipt.status === "pass"),
    errors,
    warnings,
    missingProofs: [...new Set(missingProofs)],
  };
}

export function readLocalThreeDModelRalphReceipt(path: string): LocalThreeDModelRalphReceipt | undefined {
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf8")) as LocalThreeDModelRalphReceipt;
}

function installCommandsFor(modelId: LocalThreeDModelId) {
  if (modelId === "hunyuan3d-2.0") {
    return [
      "git clone https://github.com/Tencent-Hunyuan/Hunyuan3D-2.git external/Hunyuan3D-2",
      "cd external/Hunyuan3D-2 && python -m pip install -r requirements.txt && python -m pip install -e .",
      "$env:HF_TOKEN must be set in the shell or secret manager; never commit it.",
    ];
  }
  return [
    "git clone --recurse-submodules https://github.com/microsoft/TRELLIS.git external/TRELLIS",
    "cd external/TRELLIS && ./setup.sh --new-env --basic --xformers --flash-attn --diffoctreerast --spconv --mipgaussian --kaolin --nvdiffrast",
    "$env:HF_TOKEN must be set in the shell or secret manager; never commit it.",
  ];
}

function runCommandFor(modelId: LocalThreeDModelId) {
  if (modelId === "hunyuan3d-2.0") {
    return "python scripts/run-hunyuan3d20.py --input <image> --out docs/proof/local-model-runs/hunyuan3d-2.0";
  }
  return "python scripts/run-trellis.py --input <image> --out docs/proof/local-model-runs/trellis";
}

function requiredOutputProofs(proof: LocalThreeDModelRalphReceipt["outputProof"]) {
  const required: Array<keyof LocalThreeDModelRalphReceipt["outputProof"]> = [
    "outputAssetPath",
    "runtimeLogPath",
    "meshValidationPath",
    "reopenProofPath",
    "viewerScreenshotPath",
  ];
  return required.filter((key) => !proof[key]).map((key) => `local-model:${String(key)}`);
}

function outputMissingFreePaths(proof: LocalThreeDModelRalphReceipt["outputProof"]) {
  return [
    proof.outputAssetPath,
    proof.runtimeLogPath,
    proof.meshValidationPath,
    proof.reopenProofPath,
    proof.viewerScreenshotPath,
  ].filter(Boolean) as string[];
}

function looksLikeSecret(value: string) {
  return /hf_[A-Za-z0-9]{20,}/.test(value) || /TOKEN=.*[A-Za-z0-9]{20,}/i.test(value);
}
