import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import type { SoloEvent } from "../events/soloEventBus";
import { ralphPaths } from "../loop/ralphLedger";
import {
  classifyIncident,
  evidenceFromEvent,
  extractFailureSignal,
  fingerprintEvent,
  isFailureSignal,
} from "./incidentClassifier";
import type { IncidentStatus, ReflexIncident } from "./incidentTypes";

export type ReflexPaths = {
  soloDir: string;
  incidentsPath: string;
  repairsDir: string;
  incidentDir: (incidentId: string) => string;
  incidentBriefPath: (incidentId: string) => string;
};

export type ReflexWatchResult = {
  projectPath: string;
  runId?: string;
  observed: number;
  incidents: ReflexIncident[];
  createdOrUpdated: string[];
  systemicIncidentIds: string[];
  nextCommands: string[];
};

export function reflexPaths(projectPath: string): ReflexPaths {
  const soloDir = ralphPaths(resolve(projectPath)).soloDir;
  const repairsDir = join(soloDir, "repairs");
  return {
    soloDir,
    incidentsPath: join(soloDir, "incidents.jsonl"),
    repairsDir,
    incidentDir: (incidentId: string) => join(repairsDir, incidentId),
    incidentBriefPath: (incidentId: string) => join(repairsDir, incidentId, "incident-brief.json"),
  };
}

export function consumeFailureEvents(
  projectPath: string,
  events: SoloEvent[],
  options: { runId?: string; now?: string } = {},
): ReflexWatchResult {
  const incidents = readReflexIncidents(projectPath);
  const byFingerprint = new Map(incidents.map((incident) => [incident.fingerprint, incident]));
  const createdOrUpdated: string[] = [];
  const now = options.now ?? new Date().toISOString();
  let observed = 0;

  for (const event of events) {
    if (!isFailureSignal(event)) continue;
    observed++;
    const signal = extractFailureSignal(event);
    const fingerprint = fingerprintEvent(event);
    const id = `inc_${fingerprint.slice(0, 12)}`;
    const existing = byFingerprint.get(fingerprint);
    const evidence = evidenceFromEvent(event);
    const next: ReflexIncident = existing
      ? {
          ...existing,
          runId: existing.runId ?? options.runId,
          status: nextObservedStatus(existing.status),
          lastSeenAt: now,
          occurrenceCount: existing.evidenceRefs.some((ref) => ref.eventId === event.id)
            ? existing.occurrenceCount
            : existing.occurrenceCount + 1,
          generationId: existing.generationId ?? signal.generationId,
          taskIds: mergeUnique(existing.taskIds, signal.taskId),
          eventTypes: mergeUnique(existing.eventTypes, event.event),
          evidenceRefs: existing.evidenceRefs.some((ref) => ref.eventId === event.id)
            ? existing.evidenceRefs
            : [...existing.evidenceRefs, evidence],
        }
      : {
          schemaVersion: 1,
          id,
          runId: options.runId,
          fingerprint,
          status: "observed",
          firstSeenAt: now,
          lastSeenAt: now,
          occurrenceCount: 1,
          generationId: signal.generationId,
          taskIds: signal.taskId ? [signal.taskId] : [],
          eventTypes: [event.event],
          evidenceRefs: [evidence],
        };
    const classifiedStatus: IncidentStatus = ["promoted", "blocked", "repair_spawned", "future_lanes_paused"].includes(next.status)
      ? next.status
      : "classified";
    const classified = { ...next, classification: classifyIncident(next), status: classifiedStatus };
    byFingerprint.set(fingerprint, classified);
    createdOrUpdated.push(classified.id);
  }

  const nextIncidents = [...byFingerprint.values()].sort((a, b) => a.firstSeenAt.localeCompare(b.firstSeenAt));
  writeReflexIncidents(projectPath, nextIncidents);
  for (const incident of nextIncidents.filter((incident) => createdOrUpdated.includes(incident.id))) {
    writeIncidentBrief(projectPath, incident);
  }

  const systemicIncidentIds = nextIncidents
    .filter((incident) => incident.classification?.requiresRepair)
    .map((incident) => incident.id);

  return {
    projectPath: resolve(projectPath),
    runId: options.runId,
    observed,
    incidents: nextIncidents,
    createdOrUpdated: [...new Set(createdOrUpdated)],
    systemicIncidentIds,
    nextCommands: systemicIncidentIds.map((incidentId) => `npm run sfn -- reflex spawn --incident ${incidentId} --project .`),
  };
}

export function readReflexIncidents(projectPath: string): ReflexIncident[] {
  const path = reflexPaths(projectPath).incidentsPath;
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as ReflexIncident);
}

export function readReflexIncident(projectPath: string, incidentId: string): ReflexIncident {
  const incident = readReflexIncidents(projectPath).find((candidate) => candidate.id === incidentId);
  if (!incident) throw new Error(`incident not found: ${incidentId}`);
  return incident;
}

export function updateReflexIncident(
  projectPath: string,
  incidentId: string,
  patch: Partial<ReflexIncident> & { status?: IncidentStatus },
): ReflexIncident {
  const incidents = readReflexIncidents(projectPath);
  const index = incidents.findIndex((incident) => incident.id === incidentId);
  if (index < 0) throw new Error(`incident not found: ${incidentId}`);
  const next = { ...incidents[index], ...patch, lastSeenAt: patch.lastSeenAt ?? new Date().toISOString() };
  incidents[index] = next;
  writeReflexIncidents(projectPath, incidents);
  writeIncidentBrief(projectPath, next);
  return next;
}

export function writeIncidentBrief(projectPath: string, incident: ReflexIncident): string {
  const path = reflexPaths(projectPath).incidentBriefPath(incident.id);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({
    schemaVersion: 1,
    incidentId: incident.id,
    fingerprint: incident.fingerprint,
    runId: incident.runId,
    generationId: incident.generationId,
    taskIds: incident.taskIds,
    occurrenceCount: incident.occurrenceCount,
    classification: incident.classification,
    evidenceRefs: incident.evidenceRefs,
    invariantPrompt: "No patch without an invariant. No merge without a negative regression fixture. No hot-patch of active generation.",
  }, null, 2)}\n`, "utf8");
  return path;
}

function writeReflexIncidents(projectPath: string, incidents: ReflexIncident[]) {
  const path = reflexPaths(projectPath).incidentsPath;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, incidents.map((incident) => JSON.stringify(incident)).join("\n") + (incidents.length ? "\n" : ""), "utf8");
}

function nextObservedStatus(status: IncidentStatus): IncidentStatus {
  if (["promoted", "blocked", "repair_spawned", "future_lanes_paused"].includes(status)) return status;
  return "observed";
}

function mergeUnique<T extends string>(values: T[], next?: T): T[] {
  return next && !values.includes(next) ? [...values, next] : values;
}
