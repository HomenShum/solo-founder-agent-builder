import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { reflexPaths, updateReflexIncident } from "./incidentBroker";
import type { ReflexIncident, RepairRole, RepairRoleBrief, RepairSpawnPlan } from "./incidentTypes";

export const defaultRepairRoles: RepairRole[] = [
  "triager",
  "root_cause_reviewer",
  "implementer",
  "regression_verifier",
  "readability_critic",
];

export function makeRepairSpawnPlan(
  incident: ReflexIncident,
  options: { targetGenerationId?: string; roles?: RepairRole[]; createdAt?: string } = {},
): RepairSpawnPlan {
  const targetGenerationId = options.targetGenerationId ?? nextGenerationId(incident.generationId);
  const roles = options.roles ?? defaultRepairRoles;
  return {
    schemaVersion: 1,
    incidentId: incident.id,
    createdAt: options.createdAt ?? new Date().toISOString(),
    isolatedWorktreeRequired: true,
    canMutateActiveGeneration: false,
    targetGenerationId,
    canaryRequired: true,
    promotionRule: "verify-isolated-generation-before-routing-future-lanes",
    roles: roles.map((role) => roleBrief(role, incident, targetGenerationId)),
  };
}

export function writeRepairSpawnPlan(projectPath: string, incident: ReflexIncident, plan = makeRepairSpawnPlan(incident)): string {
  const path = join(reflexPaths(projectPath).incidentDir(incident.id), "repair-plan.json");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
  updateReflexIncident(projectPath, incident.id, {
    status: "repair_spawned",
    repairPlanPath: path,
  });
  return path;
}

export function renderReflexReplay(incidents: ReflexIncident[]): string {
  const lines = [
    "SOLO FOUNDER CONTINUOUS REPAIR RUNTIME",
    "=".repeat(72),
    "Observe immediately, classify immediately, repair in isolation, verify on a canary, promote only future lanes.",
    "",
  ];
  if (incidents.length === 0) {
    lines.push("No incidents recorded.");
    return lines.join("\n");
  }
  for (const incident of incidents) {
    lines.push(`${incident.id} | ${incident.status} | ${incident.classification?.kind ?? "unclassified"} | seen ${incident.occurrenceCount}x`);
    lines.push(`  fingerprint: ${incident.fingerprint}`);
    lines.push(`  generation: ${incident.generationId ?? "unknown"}`);
    lines.push(`  action: ${incident.classification?.action ?? "pending"}`);
    lines.push(`  status: ${incident.classification?.humanizedStatus ?? "classification pending"}`);
    lines.push(`  next: ${incident.repairPlanPath ? "verify repair contract and canary" : `npm run sfn -- reflex spawn --incident ${incident.id} --project .`}`);
    lines.push("");
  }
  return lines.join("\n");
}

function roleBrief(role: RepairRole, incident: ReflexIncident, targetGenerationId: string): RepairRoleBrief {
  const baseInputRefs = [
    `.solo/repairs/${incident.id}/incident-brief.json`,
    ".solo/events.jsonl",
    ".solo/loop-state.json",
  ];
  const outputPath = `.solo/repairs/${incident.id}/${role}.md`;
  const prompts: Record<RepairRole, string> = {
    triager: "Classify the incident from durable evidence only. Output transient/task-specific/systemic/security, stop scope, reproduction, and invariant.",
    root_cause_reviewer: "Find the architectural root cause, explain why existing gates missed it, and decide whether the fix generalizes. Do not edit code.",
    implementer: `Patch an isolated worktree for generation ${targetGenerationId}. Update the common layer and proof contract, not a one-task branch.`,
    regression_verifier: "Run a negative regression fixture, focused tests, live-browser canary, and affected proof gate. Produce verification.json.",
    readability_critic: "Judge whether the repair is understandable, centralized, user-facing, and smaller/clearer than the behavior it replaces.",
  };
  return {
    role,
    readonly: role !== "implementer",
    inputRefs: baseInputRefs,
    outputPath,
    prompt: prompts[role],
  };
}

function nextGenerationId(current?: string) {
  if (!current) return "G1";
  const match = current.match(/^(.*?)(\d+)$/);
  if (!match) return `${current}-repair`;
  return `${match[1]}${Number(match[2]) + 1}`;
}
