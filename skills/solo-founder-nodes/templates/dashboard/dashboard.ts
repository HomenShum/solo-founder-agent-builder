import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { agentHostMatrix, readSoloEventLog, type AgentHostMatrixRow } from "../events/soloEventBus";
import { readReflexIncidents } from "../reflex/incidentBroker";
import {
  loadRalphLoop,
  ralphMilestoneLabels,
  ralphRequiredReceipts,
  ralphPaths,
  type RalphMilestone,
  type SoloLoopRun,
} from "../loop/ralphLedger";

export type CommandCenterSnapshot = {
  schemaVersion: 1;
  projectPath: string;
  generatedAt: string;
  slogan: string;
  loop?: SoloLoopRun;
  loopError?: string;
  activeProof: {
    proofVerdictPath: string;
    exists: boolean;
    ok: boolean;
    status: "pass" | "fail" | "missing" | "invalid";
  };
  metrics: {
    eventCount: number;
    recentEventCount: number;
    receiptFileCount: number;
    completedMilestones: number;
    blockedMilestones: number;
    incidentCount: number;
    systemicIncidentCount: number;
  };
  artifacts: Array<{ path: string; exists: boolean; sizeBytes?: number }>;
  recentEvents: Array<Record<string, unknown>>;
  incidents: Array<{
    id: string;
    status: string;
    kind: string;
    action: string;
    occurrenceCount: number;
    humanizedStatus: string;
  }>;
  agentHosts: AgentHostMatrixRow[];
  runtime: {
    node: string;
    platform: string;
    cwd: string;
  };
};

export function makeDashboardSnapshot(repoPath: string, options: { eventLimit?: number } = {}): CommandCenterSnapshot {
  const projectPath = resolve(repoPath);
  const paths = ralphPaths(projectPath);
  let loop: SoloLoopRun | undefined;
  let loopError: string | undefined;
  try {
    loop = loadRalphLoop(projectPath).loop;
  } catch (error) {
    loopError = error instanceof Error ? error.message : String(error);
  }

  const proofVerdict = readProofVerdict(paths.proofVerdictPath);
  const recentEvents = readSoloEventLog(projectPath, options.eventLimit ?? 12);
  const allEvents = readSoloEventLog(projectPath, 100_000);
  const incidents = readReflexIncidents(projectPath);
  const artifacts = [
    paths.statePath,
    paths.eventsPath,
    paths.memoryDbPath,
    paths.proofVerdictPath,
    paths.reworkLedgerPath,
    paths.receiptsDir,
  ].map((path) => statArtifact(path, projectPath));

  return {
    schemaVersion: 1,
    projectPath,
    generatedAt: new Date().toISOString(),
    slogan: "Hooks observe the agent. Receipts prove the work. The CLI makes the whole loop visible.",
    loop,
    loopError,
    activeProof: {
      proofVerdictPath: paths.proofVerdictPath,
      exists: proofVerdict.exists,
      ok: proofVerdict.ok,
      status: proofVerdict.status,
    },
    metrics: {
      eventCount: allEvents.length,
      recentEventCount: recentEvents.length,
      receiptFileCount: countFiles(paths.receiptsDir),
      completedMilestones: loop ? Object.values(loop.milestones).filter((state) => state.status === "completed").length : 0,
      blockedMilestones: loop ? Object.values(loop.milestones).filter((state) => state.status === "blocked").length : 0,
      incidentCount: incidents.length,
      systemicIncidentCount: incidents.filter((incident) => incident.classification?.requiresRepair).length,
    },
    artifacts,
    recentEvents,
    incidents: incidents.slice(-8).map((incident) => ({
      id: incident.id,
      status: incident.status,
      kind: incident.classification?.kind ?? "unclassified",
      action: incident.classification?.action ?? "pending",
      occurrenceCount: incident.occurrenceCount,
      humanizedStatus: incident.classification?.humanizedStatus ?? "classification pending",
    })),
    agentHosts: agentHostMatrix(),
    runtime: {
      node: process.version,
      platform: process.platform,
      cwd: process.cwd(),
    },
  };
}

export function renderDashboard(repoPath: string, options: { eventLimit?: number } = {}): string {
  return renderDashboardSnapshot(makeDashboardSnapshot(repoPath, options));
}

export function renderDashboardSnapshot(snapshot: CommandCenterSnapshot): string {
  const lines: string[] = [];
  lines.push("SOLO FOUNDER COMMAND CENTER");
  lines.push("=".repeat(76));
  lines.push(snapshot.slogan);
  lines.push("");
  lines.push(`Project: ${snapshot.projectPath}`);
  lines.push(`Generated: ${snapshot.generatedAt}`);
  lines.push(`Runtime: ${snapshot.runtime.node} on ${snapshot.runtime.platform}`);
  lines.push("");

  if (!snapshot.loop) {
    lines.push("Loop: missing");
    lines.push(`Reason: ${snapshot.loopError ?? "no loop-state.json found"}`);
    lines.push("Next: npm run sfn -- loop init --goal <goal> --project .");
  } else {
    lines.push(`Loop: ${snapshot.loop.loopId} | ${snapshot.loop.status} | current ${snapshot.loop.currentMilestone}`);
    lines.push(`Goal: ${snapshot.loop.goal}`);
    lines.push("");
    lines.push("Milestones:");
    for (const milestone of ["R", "A", "L", "P", "H"] as RalphMilestone[]) {
      const state = snapshot.loop.milestones[milestone];
      const required = ralphRequiredReceipts[milestone].length;
      const present = state.receipts.length;
      const blocked = state.blockedOn ? ` | blocked: ${state.blockedOn.message}` : "";
      lines.push(`  ${milestone} ${ralphMilestoneLabels[milestone]}: ${state.status} | receipts ${present}/${required}${blocked}`);
    }
  }

  lines.push("");
  lines.push("Proof:");
  lines.push(`  proof-verdict.json: ${snapshot.activeProof.status} (${snapshot.activeProof.proofVerdictPath})`);
  lines.push("");
  lines.push("Metrics:");
  lines.push(`  events: ${snapshot.metrics.eventCount} total, ${snapshot.metrics.recentEventCount} recent`);
  lines.push(`  receipt files: ${snapshot.metrics.receiptFileCount}`);
  lines.push(`  milestones: ${snapshot.metrics.completedMilestones} completed, ${snapshot.metrics.blockedMilestones} blocked`);
  lines.push(`  incidents: ${snapshot.metrics.incidentCount} total, ${snapshot.metrics.systemicIncidentCount} repair-required`);
  lines.push("");

  lines.push("Artifacts:");
  for (const artifact of snapshot.artifacts) {
    lines.push(`  ${artifact.exists ? "yes" : "no "} ${artifact.path}${artifact.sizeBytes !== undefined ? ` (${artifact.sizeBytes} bytes)` : ""}`);
  }
  lines.push("");

  lines.push("Agent Hosts:");
  for (const row of snapshot.agentHosts.slice(0, 8)) {
    lines.push(`  ${row.id}: ${row.recommendedProofMode}; self-report ${row.selfReportedCompletionAllowed ? "telemetry-only" : "blocked"}`);
  }
  if (snapshot.agentHosts.length > 8) lines.push(`  ... ${snapshot.agentHosts.length - 8} more via: npm run sfn -- agent matrix`);
  lines.push("");

  lines.push("Recent Events:");
  if (snapshot.recentEvents.length === 0) {
    lines.push("  none");
  } else {
    for (const event of snapshot.recentEvents) {
      const ts = String(event.ts ?? event.createdAt ?? "").slice(0, 19);
      const name = String(event.event ?? event.kind ?? "event");
      const host = String(event.agentHost ?? event.loopId ?? "");
      const status = String(event.status ?? "");
      const message = String(event.message ?? "");
      lines.push(`  ${ts} ${name} ${host} ${status} ${message}`.trimEnd());
    }
  }

  lines.push("");
  lines.push("Reflex RALPH:");
  if (snapshot.incidents.length === 0) {
    lines.push("  no incidents recorded");
  } else {
    for (const incident of snapshot.incidents) {
      lines.push(`  ${incident.id}: ${incident.kind}/${incident.status} x${incident.occurrenceCount} -> ${incident.action}`);
      lines.push(`    ${incident.humanizedStatus}`);
    }
  }

  lines.push("");
  lines.push("Next Commands:");
  lines.push("  npm run sfn -- loop doctor --project .");
  lines.push("  npm run sfn -- reflex watch --project . --run <run-id>");
  lines.push("  npm run sfn -- agent collect --project .");
  lines.push("  npm run sfn -- proof verdict --run <proof-run-dir>");
  return lines.join("\n");
}

function readProofVerdict(path: string): { exists: boolean; ok: boolean; status: "pass" | "fail" | "missing" | "invalid" } {
  if (!existsSync(path)) return { exists: false, ok: false, status: "missing" };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { ok?: unknown };
    return { exists: true, ok: parsed.ok === true, status: parsed.ok === true ? "pass" : "fail" };
  } catch {
    return { exists: true, ok: false, status: "invalid" };
  }
}

function statArtifact(path: string, projectPath: string): { path: string; exists: boolean; sizeBytes?: number } {
  const exists = existsSync(path);
  const relPath = path.startsWith(projectPath) ? path.slice(projectPath.length + 1) : path;
  if (!exists) return { path: relPath, exists: false };
  const stat = statSync(path);
  return { path: relPath, exists: true, sizeBytes: stat.isDirectory() ? undefined : stat.size };
}

function countFiles(dir: string): number {
  if (!existsSync(dir)) return 0;
  let count = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) count += countFiles(path);
    else count += 1;
  }
  return count;
}
