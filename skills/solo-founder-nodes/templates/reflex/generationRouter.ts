import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { reflexPaths } from "./incidentBroker";
import type { GenerationLane, GenerationState, IncidentClassification, PromotionReceipt, ReflexIncident, RunGeneration } from "./incidentTypes";

export function generationsPath(projectPath: string) {
  return join(reflexPaths(projectPath).soloDir, "generations.json");
}

export function makeRunGeneration(input: Omit<RunGeneration, "createdAt"> & { createdAt?: string }): RunGeneration {
  return { ...input, createdAt: input.createdAt ?? new Date().toISOString() };
}

export function makeGenerationState(input: {
  activeGeneration: RunGeneration;
  lanes?: GenerationLane[];
  updatedAt?: string;
}): GenerationState {
  return {
    schemaVersion: 1,
    activeGenerationId: input.activeGeneration.generationId,
    generations: [input.activeGeneration],
    lanes: input.lanes ?? [],
    routingNotes: ["active generation is version-pinned; repairs create a new generation"],
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function readGenerationState(projectPath: string): GenerationState | undefined {
  const path = generationsPath(projectPath);
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf8")) as GenerationState;
}

export function writeGenerationState(projectPath: string, state: GenerationState): string {
  const path = generationsPath(projectPath);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2)}\n`, "utf8");
  return path;
}

export function routeIncidentForFutureLanes(
  state: GenerationState,
  incident: ReflexIncident,
  classification: IncidentClassification,
): GenerationState {
  if (classification.action !== "pause_future_lanes" && classification.action !== "stop_affected_lanes") {
    return {
      ...state,
      routingNotes: [...state.routingNotes, `${incident.id}: ${classification.action}; no generation routing change`],
      updatedAt: new Date().toISOString(),
    };
  }
  const affected = new Set(classification.affectedCapabilities);
  const lanes = state.lanes.map((lane) => {
    const matches = affected.has(lane.capability) || affected.has("unknown-capability");
    if (!matches) return lane;
    if (lane.status === "queued") {
      return { ...lane, status: "paused" as const, incidentIds: mergeUnique(lane.incidentIds, incident.id) };
    }
    return { ...lane, incidentIds: mergeUnique(lane.incidentIds, incident.id) };
  });
  return {
    ...state,
    lanes,
    routingNotes: [
      ...state.routingNotes,
      `${incident.id}: active ${incident.generationId ?? state.activeGenerationId} lanes remain pinned; queued affected lanes pause until isolated repair passes`,
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function applyPromotion(state: GenerationState, receipt: PromotionReceipt): GenerationState {
  const lanes = state.lanes.map((lane) => {
    if (receipt.activeLanesLeftPinned.includes(lane.laneId)) return lane;
    if (receipt.routedQueuedLanes.includes(lane.laneId) || receipt.requeuedFailedLanes.includes(lane.laneId)) {
      return { ...lane, status: "queued" as const, generationId: receipt.toGenerationId };
    }
    return lane;
  });
  return {
    ...state,
    activeGenerationId: receipt.toGenerationId,
    lanes,
    routingNotes: [
      ...state.routingNotes,
      `${receipt.incidentId}: promoted ${receipt.toGenerationId}; queued/failed future lanes routed forward; active lanes left pinned`,
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function summarizePromotionRouting(state: GenerationState, fromGenerationId: string) {
  return {
    routedQueuedLanes: state.lanes.filter((lane) => lane.generationId === fromGenerationId && lane.status === "queued").map((lane) => lane.laneId),
    requeuedFailedLanes: state.lanes.filter((lane) => lane.generationId === fromGenerationId && lane.status === "failed").map((lane) => lane.laneId),
    activeLanesLeftPinned: state.lanes.filter((lane) => lane.generationId === fromGenerationId && lane.status === "running").map((lane) => lane.laneId),
  };
}

function mergeUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}
