import { existsSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

export type FullProofArtifactKind =
  | "fullscreen-video"
  | "recording-audit"
  | "terminal-transcript"
  | "playwright-trace"
  | "playwright-video"
  | "screenshot"
  | "deployed-url"
  | "generated-asset"
  | "exported-asset"
  | "reopen-proof"
  | "cost-latency-ledger"
  | "scorecard"
  | "trust-root-verdict";

export type FullProofArtifact = {
  id: string;
  kind: FullProofArtifactKind;
  path: string;
  required: boolean;
  sha256?: string;
};

export type FullProofPack = {
  schemaVersion: 1;
  goal: string;
  runId: string;
  createdAt: string;
  deployedUrl: string;
  artifacts: FullProofArtifact[];
  claims: Array<{
    id: string;
    claim: string;
    artifactIds: string[];
  }>;
};

export type FullProofPackVerdict = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function makeFullProofPack(input: {
  goal: string;
  runId?: string;
  deployedUrl?: string;
  createdAt?: string;
}): FullProofPack {
  return {
    schemaVersion: 1,
    goal: input.goal,
    runId: input.runId ?? `proof_${Date.now()}`,
    createdAt: input.createdAt ?? new Date().toISOString(),
    deployedUrl: input.deployedUrl ?? "",
    artifacts: [
      artifact("fullscreen-video", "fullscreen-video", "proof/fullscreen-session.webm"),
      artifact("recording-audit", "recording-audit", "proof/recording-audit.json"),
      artifact("terminal-transcript", "terminal-transcript", "proof/terminal-transcript.log"),
      artifact("playwright-trace", "playwright-trace", "proof/playwright-trace.zip"),
      artifact("playwright-video", "playwright-video", "proof/playwright-video.webm"),
      artifact("desktop-screenshot", "screenshot", "proof/screenshots/desktop.png"),
      artifact("mobile-screenshot", "screenshot", "proof/screenshots/mobile.png"),
      artifact("deployed-url", "deployed-url", "proof/deployed-url.txt"),
      artifact("generated-asset", "generated-asset", "proof/assets/generated.glb"),
      artifact("exported-asset", "exported-asset", "proof/assets/exported.glb"),
      artifact("reopen-proof", "reopen-proof", "proof/reopen-proof.json"),
      artifact("cost-latency-ledger", "cost-latency-ledger", "proof/cost-latency.json"),
      artifact("scorecard", "scorecard", "proof/scorecard.json"),
      artifact("trust-root-verdict", "trust-root-verdict", "proof/trust-root-verdict.json"),
    ],
    claims: [
      {
        id: "live-ui-completion",
        claim: "A fresh user can complete the task in the actual deployed UI.",
        artifactIds: ["fullscreen-video", "playwright-trace", "playwright-video", "deployed-url", "scorecard", "trust-root-verdict"],
      },
      {
        id: "3d-asset-produced",
        claim: "The app produced and exported a loadable 3D asset.",
        artifactIds: ["generated-asset", "exported-asset", "reopen-proof", "cost-latency-ledger"],
      },
      {
        id: "recording-visually-verified",
        claim: "The full-screen recording was separately inspected and is not just a blank/plain screen capture.",
        artifactIds: ["fullscreen-video", "recording-audit", "desktop-screenshot", "mobile-screenshot"],
      },
    ],
  };
}

export function verifyFullProofPack(pack: FullProofPack, options: { baseDir?: string; requireFiles?: boolean } = {}): FullProofPackVerdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  const baseDir = options.baseDir ?? process.cwd();
  const requireFiles = options.requireFiles ?? true;
  if (pack.schemaVersion !== 1) errors.push("full proof pack schemaVersion must be 1");
  if (!pack.goal.trim()) errors.push("full proof pack requires a goal");
  if (!pack.runId.trim()) errors.push("full proof pack requires a runId");
  if (!/^https:\/\/[^\s]+/.test(pack.deployedUrl)) errors.push("full proof pack requires an https deployedUrl");

  const requiredKinds: FullProofArtifactKind[] = [
    "fullscreen-video",
    "recording-audit",
    "terminal-transcript",
    "playwright-trace",
    "playwright-video",
    "screenshot",
    "deployed-url",
    "generated-asset",
    "exported-asset",
    "reopen-proof",
    "cost-latency-ledger",
    "scorecard",
    "trust-root-verdict",
  ];
  for (const kind of requiredKinds) {
    if (!pack.artifacts.some((artifact) => artifact.kind === kind && artifact.required)) {
      errors.push(`missing required full proof artifact kind: ${kind}`);
    }
  }

  const ids = new Set(pack.artifacts.map((artifact) => artifact.id));
  for (const claim of pack.claims) {
    if (claim.artifactIds.length === 0) errors.push(`claim '${claim.id}' has no proof artifacts`);
    for (const id of claim.artifactIds) {
      if (!ids.has(id)) errors.push(`claim '${claim.id}' references missing artifact '${id}'`);
    }
  }

  if (requireFiles) {
    for (const artifact of pack.artifacts.filter((artifact) => artifact.required)) {
      const abs = resolve(baseDir, artifact.path);
      if (!existsSync(abs)) {
        errors.push(`full proof artifact path does not exist: ${artifact.id}:${artifact.path}`);
        continue;
      }
      const size = statSync(abs).size;
      if (size === 0) errors.push(`full proof artifact is empty: ${artifact.id}`);
      for (const error of validateArtifactShape(artifact, size)) errors.push(error);
    }
  }
  if (!pack.artifacts.some((artifact) => artifact.kind === "screenshot" && /mobile/i.test(artifact.id))) {
    warnings.push("no mobile screenshot artifact id found");
  }
  return { ok: errors.length === 0, errors, warnings };
}

function artifact(id: string, kind: FullProofArtifactKind, path: string): FullProofArtifact {
  return { id, kind, path, required: true };
}

function validateArtifactShape(artifact: FullProofArtifact, size: number): string[] {
  const errors: string[] = [];
  const ext = extname(artifact.path).toLowerCase();
  const expect = (allowed: string[]) => {
    if (!allowed.includes(ext)) errors.push(`artifact '${artifact.id}' expected ${allowed.join("/")} file, got '${ext || "<none>"}'`);
  };
  if (artifact.kind === "fullscreen-video" || artifact.kind === "playwright-video") {
    expect([".webm", ".mp4", ".mov"]);
    if (size < 1024) errors.push(`artifact '${artifact.id}' video too small`);
  } else if (artifact.kind === "playwright-trace") {
    expect([".zip"]);
    if (size < 1024) errors.push(`artifact '${artifact.id}' trace too small`);
  } else if (artifact.kind === "screenshot") {
    expect([".png", ".jpg", ".jpeg", ".webp"]);
    if (size < 100) errors.push(`artifact '${artifact.id}' screenshot too small`);
  } else if (artifact.kind === "generated-asset" || artifact.kind === "exported-asset") {
    expect([".glb", ".gltf", ".usdz", ".obj", ".stl", ".ply"]);
    if (size < 100) errors.push(`artifact '${artifact.id}' asset too small`);
  } else if (artifact.kind === "terminal-transcript") {
    expect([".log", ".txt", ".md"]);
    if (size < 100) errors.push(`artifact '${artifact.id}' transcript too small`);
  } else if (["recording-audit", "reopen-proof", "cost-latency-ledger", "scorecard", "trust-root-verdict"].includes(artifact.kind)) {
    expect([".json", ".md", ".txt", ".csv"]);
    if (size < 50) errors.push(`artifact '${artifact.id}' receipt too small`);
  } else if (artifact.kind === "deployed-url") {
    expect([".txt", ".md", ".json"]);
  }
  return errors;
}
