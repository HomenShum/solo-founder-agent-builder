import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { nanoid } from "nanoid";
import { ralphPaths, type RalphMilestone } from "../loop/ralphLedger";

export const soloEventNames = [
  "session.start",
  "session.stop",
  "phase.start",
  "phase.stop",
  "prompt.submit",
  "tool.pre",
  "tool.post",
  "tool.error",
  "file.read.pre",
  "file.write.pre",
  "file.write.post",
  "command.run.pre",
  "command.run.post",
  "browser.proof.start",
  "browser.proof.stop",
  "receipt.write",
  "memory.write",
  "eval.start",
  "eval.stop",
  "rework.recorded",
] as const;

export type SoloEventName = (typeof soloEventNames)[number];
export type SoloEventStatus = "ok" | "error" | "blocked" | "started" | "stopped" | "info";

export type SoloEvent = {
  schemaVersion: 1;
  id: string;
  ts: string;
  event: SoloEventName;
  agentHost: string;
  source: string;
  loopId?: string;
  milestone?: RalphMilestone;
  phase?: string;
  status: SoloEventStatus;
  message?: string;
  cwd?: string;
  command?: string;
  filePath?: string;
  toolName?: string;
  receiptPath?: string;
  payload?: Record<string, unknown>;
};

export type SoloEventInput = Omit<SoloEvent, "schemaVersion" | "id" | "ts" | "status" | "source"> & {
  id?: string;
  ts?: string;
  status?: SoloEventStatus;
  source?: string;
};

export type AgentHostCapability =
  | "native-hooks"
  | "rules-file"
  | "mcp-optional"
  | "external-proof-wrapper"
  | "no-self-reported-completion";

export type AgentHostMatrixRow = {
  id: string;
  label: string;
  family: "ide-agent" | "cli-agent" | "cloud-agent" | "generic";
  capabilities: AgentHostCapability[];
  hookFiles: string[];
  recommendedProofMode: "native-hooks-plus-receipts" | "external-proof-only";
  selfReportedCompletionAllowed: boolean;
  installCommand: string;
  notes: string[];
};

export type HookInstallFile = {
  path: string;
  content: string;
  mode: "overwrite" | "append-or-create" | "skip-if-exists";
  executable?: boolean;
};

export type HookInstallPlan = {
  schemaVersion: 1;
  target: string;
  generatedAt: string;
  files: HookInstallFile[];
  warnings: string[];
  verificationCommands: string[];
};

export type HookInstallResult = HookInstallPlan & {
  dryRun: boolean;
  writtenFiles: string[];
};

const supportedHookTargets = [
  "claude-code",
  "codex",
  "windsurf",
  "devin",
  "cursor",
  "trae",
  "opencode",
  "openclaw",
  "hermes",
  "pi-agent",
  "flue-ai",
  "generic",
] as const;

export type SupportedHookTarget = (typeof supportedHookTargets)[number] | "all";

export function assertSoloEventName(value: string): SoloEventName {
  if (soloEventNames.includes(value as SoloEventName)) return value as SoloEventName;
  throw new Error(`unsupported solo event '${value}' (expected one of: ${soloEventNames.join(", ")})`);
}

export function recordSoloEvent(repoPath: string, input: SoloEventInput): SoloEvent {
  const paths = ralphPaths(repoPath);
  mkdirSync(paths.soloDir, { recursive: true });
  mkdirSync(dirname(paths.eventsPath), { recursive: true });
  const event: SoloEvent = {
    schemaVersion: 1,
    id: input.id ?? `evt_${nanoid(10)}`,
    ts: input.ts ?? new Date().toISOString(),
    status: input.status ?? "info",
    source: input.source ?? "sfn",
    ...input,
  };
  assertSoloEventName(event.event);
  appendFileSync(paths.eventsPath, `${JSON.stringify(event)}\n`, "utf8");
  return event;
}

export function readSoloEventLog(repoPath: string, limit = 50): Array<Record<string, unknown>> {
  const path = ralphPaths(repoPath).eventsPath;
  if (!existsSync(path)) return [];
  const rows = readFileSync(path, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line) as Record<string, unknown>;
      } catch {
        return { malformed: true, raw: line };
      }
    });
  return rows.slice(Math.max(0, rows.length - limit));
}

export function readSoloEvents(repoPath: string, limit = 50): SoloEvent[] {
  return readSoloEventLog(repoPath, limit).filter((event): event is SoloEvent => event.schemaVersion === 1 && typeof event.event === "string");
}

export function agentHostMatrix(): AgentHostMatrixRow[] {
  return [
    {
      id: "codex",
      label: "Codex CLI / Codex IDE",
      family: "cli-agent",
      capabilities: ["native-hooks", "rules-file", "mcp-optional"],
      hookFiles: [".codex/config.toml", ".codex/hooks.json", ".codex/hooks/solo-pre-tool.js", ".codex/hooks/solo-post-tool.js", ".codex/hooks/solo-stop.js", "AGENTS.md", ".solo/bin/record-event"],
      recommendedProofMode: "native-hooks-plus-receipts",
      selfReportedCompletionAllowed: true,
      installCommand: "npm run sfn -- agent install-hooks --target codex --project .",
      notes: ["Use hooks for observation and receipts for proof.", "Run conformance after install."],
    },
    {
      id: "claude-code",
      label: "Claude Code",
      family: "cli-agent",
      capabilities: ["native-hooks", "rules-file", "mcp-optional"],
      hookFiles: [".claude/settings.json", ".claude/hooks/solo-pre-tool.js", ".claude/hooks/solo-post-tool.js", ".claude/hooks/solo-stop.js", "AGENTS.md", ".solo/bin/record-event"],
      recommendedProofMode: "native-hooks-plus-receipts",
      selfReportedCompletionAllowed: true,
      installCommand: "npm run sfn -- agent install-hooks --target claude-code --project .",
      notes: ["Treat Claude-origin skills as portable references, not a lock-in."],
    },
    {
      id: "windsurf",
      label: "Windsurf",
      family: "ide-agent",
      capabilities: ["native-hooks", "rules-file"],
      hookFiles: [".windsurf/hooks.json", ".windsurf/hooks/solo-event.js", "AGENTS.md", ".solo/bin/record-event"],
      recommendedProofMode: "native-hooks-plus-receipts",
      selfReportedCompletionAllowed: true,
      installCommand: "npm run sfn -- agent install-hooks --target windsurf --project .",
      notes: ["Keep host events normalized to SoloEvent names."],
    },
    {
      id: "devin",
      label: "Devin",
      family: "cloud-agent",
      capabilities: ["rules-file", "external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: [".devin/rules/solo-founder-agent-builder.md", "AGENTS.md", ".solo/bin/record-event"],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- agent install-hooks --target devin --project .",
      notes: ["Use rules for steering; count only external proof receipts."],
    },
    {
      id: "cursor",
      label: "Cursor",
      family: "ide-agent",
      capabilities: ["rules-file", "external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: [".cursor/rules/solo-founder-agent-builder.mdc", "AGENTS.md", ".solo/bin/record-event"],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- agent install-hooks --target cursor --project .",
      notes: ["Rules steer the agent; receipts prove outcomes."],
    },
    {
      id: "trae",
      label: "Trae",
      family: "ide-agent",
      capabilities: ["rules-file", "external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: [".trae/rules/solo-founder-agent-builder.md", "AGENTS.md", ".solo/bin/record-event"],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- agent install-hooks --target trae --project .",
      notes: ["No benchmark score counts without trace/video/scorer receipts."],
    },
    {
      id: "opencode",
      label: "OpenCode",
      family: "cli-agent",
      capabilities: ["rules-file", "external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: [".opencode/solo-founder-agent-builder.md", "AGENTS.md", ".solo/bin/record-event"],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- agent install-hooks --target opencode --project .",
      notes: ["Use wrapper events when native hooks are absent."],
    },
    {
      id: "openclaw",
      label: "OpenClaw",
      family: "cli-agent",
      capabilities: ["rules-file", "external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: [".openclaw/solo-founder-agent-builder.md", "AGENTS.md", ".solo/bin/record-event"],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- agent install-hooks --target openclaw --project .",
      notes: ["Optional OpenRouter host; run conformance before trusting model choices."],
    },
    {
      id: "hermes",
      label: "Hermes",
      family: "cli-agent",
      capabilities: ["rules-file", "external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: [".hermes/solo-founder-agent-builder.md", "AGENTS.md", ".solo/bin/record-event"],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- agent install-hooks --target hermes --project .",
      notes: ["Optional OpenRouter host; use as a second agent only after receipts."],
    },
    {
      id: "pi-agent",
      label: "Pi Agent",
      family: "generic",
      capabilities: ["external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: ["AGENTS.md", ".solo/bin/record-event"],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- agent install-hooks --target pi-agent --project .",
      notes: ["Generic hosts get proof wrappers, not trusted self-reports."],
    },
    {
      id: "flue-ai",
      label: "Flue AI",
      family: "generic",
      capabilities: ["external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: ["AGENTS.md", ".solo/bin/record-event"],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- agent install-hooks --target flue-ai --project .",
      notes: ["Generic hosts get proof wrappers, not trusted self-reports."],
    },
    {
      id: "generic",
      label: "Generic Coding Agent",
      family: "generic",
      capabilities: ["external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: ["AGENTS.md", ".solo/bin/record-event"],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- agent install-hooks --target generic --project .",
      notes: ["Use browser proof, terminal transcript, receipts, and independent verification."],
    },
  ];
}

export function makeAgentMatrixRows(): AgentHostMatrixRow[] {
  return agentHostMatrix();
}

export function formatAgentMatrix(rows = agentHostMatrix()): string {
  const header = ["host", "family", "proof mode", "self-report", "hook files"].join(" | ");
  const line = ["----", "------", "----------", "-----------", "----------"].join(" | ");
  const body = rows.map((row) => [
    row.id,
    row.family,
    row.recommendedProofMode,
    row.selfReportedCompletionAllowed ? "allowed with receipts" : "blocked",
    row.hookFiles.join(", "),
  ].join(" | "));
  return [header, line, ...body].join("\n");
}

export function makeHookInstallPlan(target: SupportedHookTarget, generatedAt = new Date().toISOString()): HookInstallPlan {
  if (!supportedHookTargets.includes(target as never) && target !== "all") {
    throw new Error(`unsupported hook target '${target}' (expected one of: ${[...supportedHookTargets, "all"].join(", ")})`);
  }
  const rows = target === "all" ? agentHostMatrix() : agentHostMatrix().filter((row) => row.id === target);
  const files: HookInstallFile[] = [
    {
      path: ".solo/bin/record-event",
      content: recordEventScript(),
      mode: "overwrite",
      executable: true,
    },
    {
      path: "AGENTS.md",
      content: agentInstructionsBlock(rows.map((row) => row.id)),
      mode: "append-or-create",
    },
  ];

  for (const row of rows) {
    for (const filePath of row.hookFiles) {
      if (filePath === ".solo/bin/record-event" || filePath === "AGENTS.md") continue;
      files.push({
        path: filePath,
        content: hookFileContent(row.id, filePath),
        mode: filePath.endsWith(".json") || filePath.endsWith(".toml") ? "skip-if-exists" : "append-or-create",
        executable: filePath.endsWith(".js"),
      });
    }
  }

  return {
    schemaVersion: 1,
    target,
    generatedAt,
    files,
    warnings: [
      "Hooks observe the agent; receipts prove the work; the CLI makes the loop visible.",
      "Native hook files are host adapter templates. Run the host's own conformance/proof command before counting events.",
      "Generic/no-hooks agents must use external proof only and cannot self-report completion.",
    ],
    verificationCommands: [
      "npm run sfn -- dashboard --project .",
      "npm run sfn -- loop doctor --project .",
      "npm run sfn -- agent collect --project .",
    ],
  };
}

export function writeHookInstallPlan(repoPath: string, target: SupportedHookTarget, options: { dryRun?: boolean } = {}): HookInstallResult {
  const plan = makeHookInstallPlan(target);
  const base = resolve(repoPath);
  const writtenFiles: string[] = [];
  if (!options.dryRun) {
    for (const file of plan.files) {
      const abs = resolve(base, file.path);
      mkdirSync(dirname(abs), { recursive: true });
      if (file.mode === "skip-if-exists" && existsSync(abs)) continue;
      if (file.mode === "append-or-create" && existsSync(abs)) {
        const existing = readFileSync(abs, "utf8");
        if (existing.includes("SOLO FOUNDER COMMAND CENTER")) continue;
        writeFileSync(abs, `${existing.trimEnd()}\n\n${file.content}`, "utf8");
      } else {
        writeFileSync(abs, file.content, "utf8");
      }
      writtenFiles.push(file.path);
    }
  }
  return { ...plan, dryRun: options.dryRun ?? false, writtenFiles };
}

export function makeAgentRunReceipt(input: {
  projectPath: string;
  host: string;
  goal: string;
  command?: string;
  dryRun?: boolean;
}) {
  const row = agentHostMatrix().find((candidate) => candidate.id === input.host);
  if (!row) throw new Error(`unknown agent host '${input.host}'`);
  return {
    schemaVersion: 1,
    kind: "agent-run-receipt",
    host: row.id,
    goal: input.goal,
    projectPath: resolve(input.projectPath),
    command: input.command,
    dryRun: input.dryRun ?? true,
    selfReportedCompletionAllowed: row.selfReportedCompletionAllowed,
    requiredProof: row.selfReportedCompletionAllowed
      ? ["SoloEvent hooks", "receipt.write events", "proof verdict"]
      : ["external browser proof", "terminal transcript", "fresh-room receipt", "proof verdict"],
    status: input.dryRun === false ? "ready_for_host_execution" : "planned",
    warning: row.selfReportedCompletionAllowed
      ? "Self-report is accepted only as telemetry; receipts still decide pass/fail."
      : "This host cannot count self-reported completion. Use external proof only.",
  };
}

function hookFileContent(hostId: string, filePath: string): string {
  if (filePath.endsWith(".js")) return hostHookScript(hostId, filePath);
  if (hostId === "codex") {
    if (filePath.endsWith("hooks.json")) {
      return `${JSON.stringify({
        schemaVersion: 1,
        hooks: {
          PreToolUse: "node .codex/hooks/solo-pre-tool.js",
          PostToolUse: "node .codex/hooks/solo-post-tool.js",
          Stop: "node .codex/hooks/solo-stop.js",
        },
        recordEvent: "node .solo/bin/record-event",
      }, null, 2)}\n`;
    }
    return [
      "# Solo Founder Agent Builder hook bridge",
      "# Generated by: npm run sfn -- agent install-hooks --target codex --project .",
      "[solo_founder]",
      "record_event = \"node .solo/bin/record-event\"",
      "event_bus = \".solo/events.jsonl\"",
      "proof_required = true",
      "",
    ].join("\n");
  }
  if (hostId === "claude-code" && filePath.endsWith("settings.json")) {
    return `${JSON.stringify({
      hooks: {
        PreToolUse: [{ hooks: [{ type: "command", command: "node .claude/hooks/solo-pre-tool.js" }] }],
        PostToolUse: [{ hooks: [{ type: "command", command: "node .claude/hooks/solo-post-tool.js" }] }],
        Stop: [{ hooks: [{ type: "command", command: "node .claude/hooks/solo-stop.js" }] }],
      },
      soloFounder: {
        recordEvent: "node .solo/bin/record-event",
        proofRequired: true,
      },
    }, null, 2)}\n`;
  }
  const payload = {
    schemaVersion: 1,
    host: hostId,
    recordEvent: "node .solo/bin/record-event",
    events: soloEventNames,
    policy: {
      proofRequired: true,
      noSelfReportedCompletionWithoutReceipt: true,
      slogan: "Hooks observe the agent. Receipts prove the work. The CLI makes the whole loop visible.",
    },
    examples: [
      "node .solo/bin/record-event --event session.start --agent " + hostId,
      "node .solo/bin/record-event --event receipt.write --agent " + hostId + " --receipt .solo/proof-verdict.json",
    ],
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function hostHookScript(hostId: string, filePath: string): string {
  const event = filePath.includes("pre-tool")
    ? "tool.pre"
    : filePath.includes("post-tool")
      ? "tool.post"
      : filePath.includes("stop")
        ? "session.stop"
        : "command.run.post";
  return [
    "#!/usr/bin/env node",
    "import { spawnSync } from 'node:child_process';",
    "",
    `const host = ${JSON.stringify(hostId)};`,
    `const event = ${JSON.stringify(event)};`,
    "const args = ['.solo/bin/record-event', '--event', event, '--agent', host, '--source', 'native-hook'];",
    "if (process.env.SOLO_PHASE) args.push('--phase', process.env.SOLO_PHASE);",
    "if (process.env.SOLO_MILESTONE) args.push('--milestone', process.env.SOLO_MILESTONE);",
    "if (process.env.SOLO_TOOL_NAME) args.push('--tool', process.env.SOLO_TOOL_NAME);",
    "if (process.env.SOLO_COMMAND) args.push('--command', process.env.SOLO_COMMAND);",
    "if (process.env.SOLO_RECEIPT) args.push('--receipt', process.env.SOLO_RECEIPT);",
    "const res = spawnSync(process.execPath, args, { stdio: 'inherit' });",
    "process.exit(res.status ?? 0);",
    "",
  ].join("\n");
}

function agentInstructionsBlock(hostIds: string[]): string {
  return [
    "<!-- SOLO FOUNDER COMMAND CENTER START -->",
    "# Solo Founder Command Center",
    "",
    "Hooks observe the agent. Receipts prove the work. The CLI makes the whole loop visible.",
    "",
    "Agent hosts installed for observation: " + hostIds.join(", "),
    "",
    "Rules:",
    "- Record normalized SoloEvent rows for session, phase, tool, file, command, browser proof, receipt, memory, eval, and rework events.",
    "- Do not count self-reported completion unless the host matrix says it is allowed and a receipt/proof verdict exists.",
    "- Use `npm run sfn -- dashboard --project .` to show loop state before claiming progress.",
    "- Use `npm run sfn -- proof verdict --run <dir>` or `npm run sfn -- fresh-room verify --receipt <file>` before shipping a capability claim.",
    "<!-- SOLO FOUNDER COMMAND CENTER END -->",
    "",
  ].join("\n");
}

function recordEventScript(): string {
  return [
    "#!/usr/bin/env node",
    "import { appendFileSync, mkdirSync } from 'node:fs';",
    "import { dirname, resolve } from 'node:path';",
    "import { randomUUID } from 'node:crypto';",
    "",
    "const eventNames = " + JSON.stringify(soloEventNames) + ";",
    "function arg(name, fallback) {",
    "  const i = process.argv.indexOf(name);",
    "  return i >= 0 ? process.argv[i + 1] : fallback;",
    "}",
    "const event = arg('--event', 'tool.post');",
    "if (!eventNames.includes(event)) {",
    "  console.error('unsupported solo event: ' + event);",
    "  process.exit(2);",
    "}",
    "const project = resolve(arg('--project', process.cwd()));",
    "const out = resolve(project, '.solo/events.jsonl');",
    "mkdirSync(dirname(out), { recursive: true });",
    "const row = {",
    "  schemaVersion: 1,",
    "  id: 'evt_' + randomUUID().replace(/-/g, '').slice(0, 12),",
    "  ts: new Date().toISOString(),",
    "  event,",
    "  agentHost: arg('--agent', process.env.SOLO_AGENT_HOST || 'unknown'),",
    "  source: arg('--source', 'hook'),",
    "  status: arg('--status', 'info'),",
    "  milestone: arg('--milestone', undefined),",
    "  phase: arg('--phase', undefined),",
    "  message: arg('--message', undefined),",
    "  command: arg('--command', undefined),",
    "  filePath: arg('--file', undefined),",
    "  toolName: arg('--tool', undefined),",
    "  receiptPath: arg('--receipt', undefined),",
    "  cwd: process.cwd(),",
    "};",
    "appendFileSync(out, JSON.stringify(row) + '\\n', 'utf8');",
    "console.log(JSON.stringify(row));",
    "",
  ].join("\n");
}
