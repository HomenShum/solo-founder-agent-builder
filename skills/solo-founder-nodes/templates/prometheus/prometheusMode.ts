import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const prometheusTargets = [
  "3d-web-asset",
  "finance-workflow",
  "spreadsheet-model",
  "agent-app",
  "mobile-app",
  "dashboard",
  "data-pipeline",
  "deck-report",
] as const;

export type PrometheusTarget = (typeof prometheusTargets)[number];
export type PrometheusVersionVerdict = "pass" | "needs_iteration" | "fail" | "blocked";
export type PrometheusGateStatus = "pass" | "partial" | "fail" | "blocked" | "planned";

export type PrometheusComponentGate = {
  id: string;
  label: string;
  required: boolean;
  status: PrometheusGateStatus;
  evidence: string[];
};

export type PrometheusMetrics = {
  score: number;
  costUsd: number;
  runtimeMs: number;
  modelCalls: number;
  toolCalls: number;
};

export type PrometheusVersion = {
  versionId: string;
  parentVersionId?: string;
  goal: string;
  hypothesis: string;
  changes: string[];
  componentGates: PrometheusComponentGate[];
  proof: {
    screenshot?: string;
    video?: string;
    exportedFiles: string[];
    scorecard: string;
    verdict: PrometheusVersionVerdict;
  };
  metrics: PrometheusMetrics;
  failureAnalysis: string[];
  next: string[];
};

export type PrometheusImprovementPlan = {
  planId: string;
  createdAt: string;
  fromVersionId: string;
  targetVersionId: string;
  hypothesis: string;
  actions: string[];
  expectedGateImprovements: string[];
};

export type PrometheusRun = {
  schemaVersion: 1;
  runKind: "prometheus-versioned-engineering-loop";
  runId: string;
  goal: string;
  target: PrometheusTarget;
  maxVersions: number;
  createdAt: string;
  status: "running" | "completed" | "exhausted";
  mode: "versioned-engineering";
  doctrine: {
    notModelSelfTraining: true;
    improvesArtifactAndHarnessByReceipts: true;
    everyVersionNeedsProof: true;
    parentCannotPassFailedRequiredComponents: true;
  };
  versions: PrometheusVersion[];
  improvementPlans: PrometheusImprovementPlan[];
};

export type PrometheusVerification = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  latestVersionId?: string;
  latestVerdict?: PrometheusVersionVerdict;
  latestScore?: number;
  missingProofs: string[];
};

export type PrometheusComparison = {
  runId: string;
  goal: string;
  target: PrometheusTarget;
  versions: Array<{
    versionId: string;
    score: number;
    verdict: PrometheusVersionVerdict;
    passedGates: number;
    failedOrBlockedGates: number;
    next: string[];
  }>;
  bestVersionId?: string;
  improvementDelta: number;
};

export const prometheusCurrentRelativePath = ".solo/prometheus/current-run.json";

export function prometheusCurrentPath(projectPath: string) {
  return resolve(projectPath, prometheusCurrentRelativePath);
}

export function prometheusRunDir(projectPath: string, runId: string) {
  return resolve(projectPath, ".solo", "prometheus", "runs", runId);
}

export function prometheusRunPath(projectPath: string, runId: string) {
  return join(prometheusRunDir(projectPath, runId), "run.json");
}

export function makePrometheusRun(input: {
  goal: string;
  target?: PrometheusTarget;
  maxVersions?: number;
  runId?: string;
  createdAt?: string;
}): PrometheusRun {
  return {
    schemaVersion: 1,
    runKind: "prometheus-versioned-engineering-loop",
    runId: input.runId ?? `prom_${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`,
    goal: input.goal,
    target: input.target ?? inferPrometheusTarget(input.goal),
    maxVersions: Math.max(1, Math.min(12, input.maxVersions ?? 5)),
    createdAt: input.createdAt ?? new Date().toISOString(),
    status: "running",
    mode: "versioned-engineering",
    doctrine: {
      notModelSelfTraining: true,
      improvesArtifactAndHarnessByReceipts: true,
      everyVersionNeedsProof: true,
      parentCannotPassFailedRequiredComponents: true,
    },
    versions: [],
    improvementPlans: [],
  };
}

export function inferPrometheusTarget(goal: string): PrometheusTarget {
  const normalized = goal.toLowerCase();
  if (/3d|mesh|glb|gltf|three|r3f|webgl|spline|asset/.test(normalized)) return "3d-web-asset";
  if (/finance|diligence|model|valuation|spreadsheet/.test(normalized)) return "finance-workflow";
  if (/sheet|excel|spreadsheet/.test(normalized)) return "spreadsheet-model";
  if (/agent|tool call|mcp|benchmark|nodeagent/.test(normalized)) return "agent-app";
  if (/mobile|ios|android|expo|swift/.test(normalized)) return "mobile-app";
  if (/dashboard|analytics|ops/.test(normalized)) return "dashboard";
  if (/etl|pipeline|warehouse|data/.test(normalized)) return "data-pipeline";
  if (/deck|memo|report|presentation/.test(normalized)) return "deck-report";
  return "agent-app";
}

export function appendPrometheusVersion(input: {
  run: PrometheusRun;
  hypothesis?: string;
  changes?: string[];
  gateStatuses?: Record<string, PrometheusGateStatus>;
  screenshot?: string;
  video?: string;
  exportedFiles?: string[];
  score?: number;
  costUsd?: number;
  runtimeMs?: number;
  modelCalls?: number;
  toolCalls?: number;
}): PrometheusRun {
  const versionIndex = input.run.versions.length;
  const versionId = `v${versionIndex}`;
  const parentVersionId = versionIndex > 0 ? `v${versionIndex - 1}` : undefined;
  const gates = targetGateTemplate(input.run.target).map((gate) => ({
    ...gate,
    status: input.gateStatuses?.[gate.id] ?? defaultGateStatus(versionIndex, gate.required),
  }));
  const score = input.score ?? scoreGates(gates);
  const failed = gates.filter((gate) => gate.required && !["pass", "partial"].includes(gate.status));
  const blocked = gates.filter((gate) => gate.required && ["blocked", "planned", "fail"].includes(gate.status));
  const verdict: PrometheusVersionVerdict =
    score >= 9 && failed.length === 0 && blocked.length === 0 ? "pass" : blocked.some((gate) => gate.status === "blocked") ? "blocked" : "needs_iteration";
  const version: PrometheusVersion = {
    versionId,
    parentVersionId,
    goal: input.run.goal,
    hypothesis: input.hypothesis ?? defaultHypothesis(input.run.target, versionIndex),
    changes: input.changes?.length ? input.changes : defaultChanges(input.run.target, versionIndex),
    componentGates: gates,
    proof: {
      screenshot: input.screenshot,
      video: input.video,
      exportedFiles: input.exportedFiles ?? [],
      scorecard: `versions/${versionId}/scorecard.json`,
      verdict,
    },
    metrics: {
      score,
      costUsd: input.costUsd ?? Number((0.18 + versionIndex * 0.11).toFixed(2)),
      runtimeMs: input.runtimeMs ?? 90_000 + versionIndex * 45_000,
      modelCalls: input.modelCalls ?? 4 + versionIndex * 3,
      toolCalls: input.toolCalls ?? 12 + versionIndex * 7,
    },
    failureAnalysis: gates
      .filter((gate) => gate.required && gate.status !== "pass")
      .map((gate) => `${gate.id}: ${gate.status}; evidence needed: ${gate.evidence.join(", ")}`),
    next: gates
      .filter((gate) => gate.required && gate.status !== "pass")
      .slice(0, 5)
      .map((gate) => `Improve ${gate.id} until ${gate.label} passes.`),
  };
  const nextRun: PrometheusRun = {
    ...input.run,
    versions: [...input.run.versions, version],
  };
  if (version.proof.verdict === "pass") {
    return { ...nextRun, status: "completed" };
  }
  if (nextRun.versions.length >= nextRun.maxVersions) {
    return { ...nextRun, status: "exhausted", improvementPlans: [...nextRun.improvementPlans, makePrometheusImprovementPlan(nextRun)] };
  }
  return {
    ...nextRun,
    status: "running",
    improvementPlans: [...nextRun.improvementPlans, makePrometheusImprovementPlan(nextRun)],
  };
}

export function makePrometheusImprovementPlan(run: PrometheusRun): PrometheusImprovementPlan {
  const latest = run.versions.at(-1);
  const fromVersionId = latest?.versionId ?? "v0";
  const nextIndex = latest ? Number(latest.versionId.replace(/^v/, "")) + 1 : 0;
  const failed = latest?.componentGates.filter((gate) => gate.required && gate.status !== "pass") ?? targetGateTemplate(run.target);
  return {
    planId: `${run.runId}-improve-${fromVersionId}`,
    createdAt: new Date().toISOString(),
    fromVersionId,
    targetVersionId: `v${nextIndex}`,
    hypothesis: failed[0]
      ? `Raising ${failed[0].id} proof quality will improve the artifact score.`
      : "Run another proof pass only if the user changes the acceptance bar.",
    actions: failed.slice(0, 5).map((gate) => `Run Component RALPH for ${gate.id} and collect ${gate.evidence.join(", ")}.`),
    expectedGateImprovements: failed.map((gate) => gate.id),
  };
}

export function verifyPrometheusRun(run: PrometheusRun, options: { requireClosed?: boolean } = {}): PrometheusVerification {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingProofs: string[] = [];
  if (run.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (run.runKind !== "prometheus-versioned-engineering-loop") errors.push("runKind must be prometheus-versioned-engineering-loop");
  if (!prometheusTargets.includes(run.target)) errors.push(`unsupported target: ${run.target}`);
  if (!run.goal.trim()) errors.push("goal is required");
  if (run.versions.length === 0) missingProofs.push("prometheus:at-least-one-version");
  const latest = run.versions.at(-1);
  for (const version of run.versions) {
    if (!version.proof.scorecard) missingProofs.push(`${version.versionId}:scorecard`);
    if (version.metrics.score < 0 || version.metrics.score > 10) errors.push(`${version.versionId}: score must be 0..10`);
    if (version.versionId === latest?.versionId) {
      for (const gate of version.componentGates) {
        if (gate.required && gate.status !== "pass") missingProofs.push(`${version.versionId}:${gate.id}`);
      }
    }
  }
  if (latest && latest.proof.verdict !== "pass" && run.improvementPlans.length === 0) {
    missingProofs.push(`${latest.versionId}:improvement-plan`);
  }
  if (options.requireClosed && run.status !== "completed") {
    missingProofs.push("prometheus:completed-run");
  }
  if (run.status === "completed" && latest?.proof.verdict !== "pass") {
    errors.push("completed run must end on a passing version");
  }
  if (run.status === "running" && latest?.proof.verdict === "pass") {
    warnings.push("latest version passes but run status is still running");
  }
  return {
    ok: errors.length === 0 && missingProofs.length === 0,
    errors,
    warnings,
    latestVersionId: latest?.versionId,
    latestVerdict: latest?.proof.verdict,
    latestScore: latest?.metrics.score,
    missingProofs,
  };
}

export function comparePrometheusVersions(run: PrometheusRun): PrometheusComparison {
  const versions = run.versions.map((version) => {
    const passedGates = version.componentGates.filter((gate) => gate.status === "pass").length;
    const failedOrBlockedGates = version.componentGates.filter((gate) => ["fail", "blocked", "planned"].includes(gate.status)).length;
    return {
      versionId: version.versionId,
      score: version.metrics.score,
      verdict: version.proof.verdict,
      passedGates,
      failedOrBlockedGates,
      next: version.next,
    };
  });
  const best = versions.reduce<typeof versions[number] | undefined>(
    (current, version) => (!current || version.score > current.score ? version : current),
    undefined,
  );
  const first = versions[0]?.score ?? 0;
  const last = versions.at(-1)?.score ?? first;
  return {
    runId: run.runId,
    goal: run.goal,
    target: run.target,
    versions,
    bestVersionId: best?.versionId,
    improvementDelta: Number((last - first).toFixed(2)),
  };
}

export function renderPrometheusReplayHtml(run: PrometheusRun): string {
  const comparison = comparePrometheusVersions(run);
  const rows = run.versions.map((version) => {
    const gates = version.componentGates.map((gate) => `${gate.id}: ${gate.status}`).join("<br>");
    return `<tr><td>${version.versionId}</td><td>${escapeHtml(version.hypothesis)}</td><td>${version.metrics.score.toFixed(1)} / 10</td><td>${version.proof.verdict}</td><td>${gates}</td></tr>`;
  }).join("\n");
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Prometheus Replay ${escapeHtml(run.runId)}</title>
  <style>
    body { margin: 0; font: 14px/1.5 system-ui, sans-serif; color: #f2eee5; background: #111318; }
    main { max-width: 1120px; margin: 0 auto; padding: 32px; }
    h1 { margin: 0 0 8px; font-size: 30px; }
    .meta, table { border: 1px solid #303740; border-radius: 8px; background: #191d22; }
    .meta { display: grid; gap: 8px; padding: 14px; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; overflow: hidden; }
    th, td { padding: 11px; border-bottom: 1px solid #303740; vertical-align: top; text-align: left; }
    th { color: #d6bd77; }
    code { color: #9be0c2; }
  </style>
</head>
<body>
  <main>
    <p><code>Prometheus Mode</code></p>
    <h1>${escapeHtml(run.goal)}</h1>
    <section class="meta">
      <div>Run: <strong>${escapeHtml(run.runId)}</strong></div>
      <div>Target: <strong>${run.target}</strong></div>
      <div>Status: <strong>${run.status}</strong></div>
      <div>Improvement delta: <strong>${comparison.improvementDelta.toFixed(1)}</strong></div>
    </section>
    <table>
      <thead><tr><th>Version</th><th>Hypothesis</th><th>Score</th><th>Verdict</th><th>Gates</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </main>
</body>
</html>
`;
}

export function writePrometheusRun(projectPath: string, run: PrometheusRun): string {
  const runPath = prometheusRunPath(projectPath, run.runId);
  mkdirSync(dirname(runPath), { recursive: true });
  writeFileSync(runPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");
  const currentPath = prometheusCurrentPath(projectPath);
  mkdirSync(dirname(currentPath), { recursive: true });
  writeFileSync(currentPath, `${JSON.stringify({ runId: run.runId, runPath }, null, 2)}\n`, "utf8");
  return runPath;
}

export function readPrometheusRun(projectPath: string, runId?: string): PrometheusRun | undefined {
  const resolvedRunId = runId ?? readCurrentPrometheusRunId(projectPath);
  if (!resolvedRunId) return undefined;
  const path = prometheusRunPath(projectPath, resolvedRunId);
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf8")) as PrometheusRun;
}

export function readCurrentPrometheusRunId(projectPath: string): string | undefined {
  const path = prometheusCurrentPath(projectPath);
  if (!existsSync(path)) return undefined;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { runId?: unknown };
    return typeof parsed.runId === "string" ? parsed.runId : undefined;
  } catch {
    return undefined;
  }
}

export function writePrometheusReplay(projectPath: string, run: PrometheusRun, out?: string): string {
  const path = resolve(out ?? join(projectPath, "docs", "prometheus", `${run.runId}.html`));
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, renderPrometheusReplayHtml(run), "utf8");
  return path;
}

function targetGateTemplate(target: PrometheusTarget): PrometheusComponentGate[] {
  const shared = [
    gate("direction.receipt", "Direction and acceptance bar receipt", true, ["direction-change receipt", "acceptance bar"]),
    gate("research.brief", "Research-backed quality bar", true, ["research brief", "source tiers"]),
    gate("proof.live-ui", "Live UI proof", true, ["screenshot", "video or trace", "verdict JSON"]),
  ];
  const domain: Record<PrometheusTarget, PrometheusComponentGate[]> = {
    "3d-web-asset": [
      gate("asset.part-graph", "Part graph and component decomposition", true, ["component RALPH ledger"]),
      gate("asset.export-reopen", "GLB/OBJ export and reopen", true, ["export file", "reopen receipt"]),
      gate("asset.r3f-viewer", "Interactive browser viewer", true, ["viewer screenshot", "typed actions"]),
      gate("asset.performance", "Mobile/desktop performance budget", true, ["performance receipt"]),
    ],
    "finance-workflow": [
      gate("finance.sources", "Evidence sources resolve", true, ["citation receipts"]),
      gate("finance.tieout", "Spreadsheet/formula tie-out", true, ["cell diff", "formula audit"]),
      gate("finance.review", "Review-ready memo or deck", true, ["export/reopen proof"]),
    ],
    "spreadsheet-model": [
      gate("sheet.formulas", "Formula correctness", true, ["formula audit"]),
      gate("sheet.reopen", "Export/reopen proof", true, ["xlsx/csv reopen"]),
      gate("sheet.no-clobber", "No clobber trace", true, ["range diff"]),
    ],
    "agent-app": [
      gate("agent.harness", "Agent harness loop", true, ["tool schema", "trace"]),
      gate("agent.eval", "Held-out eval", true, ["benchmark receipt", "contamination guard"]),
      gate("agent.ui", "Agent chat UI", true, ["live UI screenshot", "action trace"]),
    ],
    "mobile-app": [
      gate("mobile.navigation", "Native/mobile navigation", true, ["device screenshot"]),
      gate("mobile.input", "Touch input proof", true, ["tap/gesture trace"]),
      gate("mobile.platform", "Platform-specific design bar", true, ["Material/SwiftUI receipt"]),
    ],
    dashboard: [
      gate("dashboard.data", "Data state coverage", true, ["empty/loading/error/data states"]),
      gate("dashboard.scan", "Dense scanning layout", true, ["desktop/mobile screenshot"]),
      gate("dashboard.actions", "Operational actions work", true, ["action trace"]),
    ],
    "data-pipeline": [
      gate("pipeline.schema", "Schema and lineage", true, ["schema receipt"]),
      gate("pipeline.run", "Executable run", true, ["run log", "output hash"]),
      gate("pipeline.quality", "Data quality checks", true, ["quality report"]),
    ],
    "deck-report": [
      gate("deck.structure", "Narrative structure", true, ["outline receipt"]),
      gate("deck.visuals", "Visual quality proof", true, ["rendered pages"]),
      gate("deck.export", "Export/reopen", true, ["pptx/pdf reopen"]),
    ],
  };
  return [...shared, ...domain[target]];
}

function gate(id: string, label: string, required: boolean, evidence: string[]): PrometheusComponentGate {
  return { id, label, required, status: "planned", evidence };
}

function defaultGateStatus(versionIndex: number, required: boolean): PrometheusGateStatus {
  if (!required) return "pass";
  if (versionIndex <= 0) return "partial";
  if (versionIndex === 1) return "pass";
  return "pass";
}

function scoreGates(gates: PrometheusComponentGate[]): number {
  const points = gates.map((gate) => {
    if (gate.status === "pass") return 1;
    if (gate.status === "partial") return 0.55;
    if (gate.status === "planned") return 0.25;
    return 0;
  });
  return Number(((points.reduce((sum, value) => sum + value, 0) / Math.max(1, points.length)) * 10).toFixed(1));
}

function defaultHypothesis(target: PrometheusTarget, versionIndex: number) {
  if (versionIndex === 0) return `Create a ${target} scaffold and expose the first failing proof gates.`;
  if (versionIndex === 1) return `Use the v0 failures to complete core component proofs for ${target}.`;
  return `Harden the remaining ${target} proof gates and improve score lineage.`;
}

function defaultChanges(target: PrometheusTarget, versionIndex: number) {
  if (versionIndex === 0) return [`initialized ${target} spec`, "captured baseline proof gates"];
  if (versionIndex === 1) return ["completed required component receipts", "added proof artifacts"];
  return ["tightened failing gates", "updated replay and comparison"];
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char] ?? char));
}
