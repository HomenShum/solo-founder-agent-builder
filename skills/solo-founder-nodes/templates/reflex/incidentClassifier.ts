import { createHash } from "node:crypto";
import type { SoloEvent } from "../events/soloEventBus";
import {
  reflexFailureEvents,
  type FailureSignal,
  type IncidentClassification,
  type IncidentEvidenceRef,
  type ReflexIncident,
} from "./incidentTypes";

export function isFailureSignal(event: SoloEvent): boolean {
  if (!reflexFailureEvents.includes(event.event)) return false;
  if (event.event === "judge.verdict") return event.status === "blocked" || event.payload?.blockClaim === true;
  if (event.event === "browser.proof.stop" || event.event === "eval.stop") {
    return event.status === "error" || event.status === "blocked" || /fail|error|blocked/i.test(event.message ?? "");
  }
  return event.status === "error" || event.status === "blocked" || event.event === "tool.error";
}

export function extractFailureSignal(event: SoloEvent): FailureSignal {
  return {
    event,
    generationId: stringValue(event.payload?.generationId) ?? stringValue(event.payload?.runGenerationId),
    taskId: stringValue(event.payload?.taskId) ?? stringValue(event.payload?.caseId),
    capability: stringValue(event.payload?.capability) ?? stringValue(event.payload?.affectedModule) ?? event.toolName,
  };
}

export function fingerprintEvent(event: SoloEvent): string {
  const payload = event.payload ?? {};
  const source = {
    eventType: event.event,
    toolName: event.toolName ?? "",
    errorCode: stringValue(payload.errorCode) ?? stringValue(payload.code) ?? "",
    normalizedMessage: normalizeMessage(event.message ?? stringValue(payload.message) ?? ""),
    failingSelector: stringValue(payload.failingSelector) ?? "",
    invariantId: stringValue(payload.invariantId) ?? "",
    affectedModule: stringValue(payload.affectedModule) ?? stringValue(payload.capability) ?? "",
  };
  return createHash("sha256").update(JSON.stringify(source)).digest("hex").slice(0, 24);
}

export function evidenceFromEvent(event: SoloEvent): IncidentEvidenceRef {
  const payload = event.payload ?? {};
  return {
    eventId: event.id,
    eventType: event.event,
    ts: event.ts,
    status: event.status,
    message: event.message ?? stringValue(payload.message),
    toolName: event.toolName,
    receiptPath: event.receiptPath ?? stringValue(payload.receiptPath),
    generationId: stringValue(payload.generationId) ?? stringValue(payload.runGenerationId),
    taskId: stringValue(payload.taskId) ?? stringValue(payload.caseId),
    screenshotPath: stringValue(payload.screenshotPath),
    tracePath: stringValue(payload.tracePath),
  };
}

export function classifyIncident(incident: ReflexIncident): IncidentClassification {
  const text = [
    incident.fingerprint,
    incident.evidenceRefs.map((ref) => `${ref.eventType} ${ref.toolName ?? ""} ${ref.message ?? ""}`).join("\n"),
  ].join("\n").toLowerCase();
  const capabilities = inferAffectedCapabilities(incident);

  if (/(secret|api[_ -]?key|token leak|privacy|pii|destructive|corrupt|unsafe write|credential)/i.test(text)) {
    return {
      kind: "security",
      severity: "P0",
      action: "stop_affected_lanes",
      affectedCapabilities: capabilities,
      pauseScope: "all_affected",
      reason: "Security, privacy, destructive write, or artifact corruption signal must stop affected lanes immediately.",
      requiresRepair: true,
      humanizedStatus: "A safety or privacy defect was detected. Affected work is stopped while an isolated repair is verified.",
    };
  }

  if (/(timeout|dns|rate limit|429|503|network|temporar|provider unavailable|connection reset)/i.test(text)) {
    return {
      kind: "transient",
      severity: "P3",
      action: "retry_with_fallback",
      affectedCapabilities: capabilities,
      pauseScope: "none",
      reason: "Failure looks provider/network transient; retry or fallback before editing code.",
      requiresRepair: false,
      humanizedStatus: "The provider or network failed transiently, so the lane should retry or use a fallback route.",
    };
  }

  if (/(missing source|fixture absent|bad fixture|task-specific|source absent|not found in task|input missing)/i.test(text)) {
    return {
      kind: "task_specific",
      severity: "P2",
      action: "quarantine_task",
      affectedCapabilities: capabilities,
      pauseScope: "task",
      reason: "Failure is tied to a single task/source fixture and should not mutate shared code yet.",
      requiresRepair: false,
      humanizedStatus: "This task appears to have bad or missing source material. It is quarantined without changing shared code.",
    };
  }

  if (
    incident.occurrenceCount >= 2
    || /(schema|argument|required arg|selector|invariant|shared ui|overflow|contrast|no-progress|same error|adapter|transport|component|assembly|floating|mesh|uv|pbr|topology|reopen)/i.test(text)
  ) {
    return {
      kind: "systemic",
      severity: /(ui|visual|overflow|contrast|component|assembly|mesh|topology|reopen)/i.test(text) ? "P1" : "P2",
      action: "pause_future_lanes",
      affectedCapabilities: capabilities,
      pauseScope: "capability",
      reason: "Failure appears to be a reusable harness/app/proof defect that can affect future lanes.",
      requiresRepair: true,
      humanizedStatus: "A shared workflow defect was detected. Current lanes remain version-pinned while future lanes wait for a verified repair.",
    };
  }

  return {
    kind: "task_specific",
    severity: "P2",
    action: "record_improvement",
    affectedCapabilities: capabilities,
    pauseScope: "task",
    reason: "Failure is not yet recurrent enough for an automatic repair; record it as an improvement candidate.",
    requiresRepair: false,
    humanizedStatus: "The issue was recorded for follow-up; more recurrence is needed before pausing shared lanes.",
  };
}

export function normalizeMessage(message: string): string {
  return message
    .toLowerCase()
    .replace(/[a-f0-9]{12,}/g, "<hash>")
    .replace(/\d+/g, "<n>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

function inferAffectedCapabilities(incident: ReflexIncident): string[] {
  const values = new Set<string>();
  for (const ref of incident.evidenceRefs) {
    if (ref.toolName) values.add(ref.toolName);
    if (ref.message) {
      const message = ref.message.toLowerCase();
      if (/browser|selector|visual|contrast|overflow|ui/.test(message)) values.add("live-ui-proof");
      if (/schema|argument|tool/.test(message)) values.add("tool-schema");
      if (/mesh|3d|glb|obj|uv|pbr|topology|floating|assembly/.test(message)) values.add("3d-asset-quality");
      if (/eval|score|benchmark|held-out/.test(message)) values.add("benchmark-eval");
      if (/deploy|vercel|preview/.test(message)) values.add("deployment");
    }
  }
  return values.size ? [...values].sort() : ["unknown-capability"];
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}
