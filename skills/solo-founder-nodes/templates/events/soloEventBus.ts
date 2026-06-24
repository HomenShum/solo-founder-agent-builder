import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { nanoid } from "nanoid";
import { ralphPaths, type RalphMilestone } from "../loop/ralphLedger";

export const soloEventNames = [
  "session.created",
  "session.start",
  "session.idle",
  "session.stop",
  "session.deleted",
  "phase.start",
  "phase.stop",
  "prompt.submit",
  "tool.before",
  "tool.pre",
  "tool.post",
  "tool.after",
  "tool.error",
  "file.read.pre",
  "file.changed",
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
  "judge.verdict",
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
  | "native-plugin-hooks"
  | "native-yaml-hooks"
  | "shell-hooks"
  | "rules-file"
  | "mcp-optional"
  | "can-block"
  | "can-inject-context"
  | "can-force-continuation"
  | "external-proof-wrapper"
  | "host-unverified"
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
  "pi",
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

export type HookInstallMode = "native" | "generic-until-verified";

const commonHookBinFiles = [
  ".solo/bin/record-event",
  ".solo/bin/sfn-hook.js",
  ".solo/bin/sfn-pre-tool-policy.js",
  ".solo/bin/sfn-post-tool-receipt.js",
  ".solo/bin/sfn-session-idle-judge.js",
  ".solo/bin/sfn-final-answer-guard.js",
  ".solo/bin/sfn-inject-loop-context.js",
] as const;

function normalizeHookTarget(target: SupportedHookTarget): Exclude<SupportedHookTarget, "all" | "pi"> | "all" {
  if (target === "pi") return "pi-agent";
  return target as Exclude<SupportedHookTarget, "pi">;
}

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
      capabilities: ["native-hooks", "rules-file", "mcp-optional", "can-inject-context"],
      hookFiles: [".codex/config.toml", ".codex/hooks.json", ".codex/hooks/solo-pre-tool.js", ".codex/hooks/solo-post-tool.js", ".codex/hooks/solo-stop.js", "AGENTS.md", ...commonHookBinFiles],
      recommendedProofMode: "native-hooks-plus-receipts",
      selfReportedCompletionAllowed: true,
      installCommand: "npm run sfn -- hooks install --target codex --project .",
      notes: ["Use hooks for observation and receipts for proof.", "Run conformance after install."],
    },
    {
      id: "claude-code",
      label: "Claude Code",
      family: "cli-agent",
      capabilities: ["native-hooks", "rules-file", "mcp-optional", "can-block", "can-inject-context"],
      hookFiles: [".claude/settings.json", ".claude/hooks/solo-pre-tool.js", ".claude/hooks/solo-post-tool.js", ".claude/hooks/solo-stop.js", "AGENTS.md", ...commonHookBinFiles],
      recommendedProofMode: "native-hooks-plus-receipts",
      selfReportedCompletionAllowed: true,
      installCommand: "npm run sfn -- hooks install --target claude-code --project .",
      notes: ["Treat Claude-origin skills as portable references, not a lock-in."],
    },
    {
      id: "windsurf",
      label: "Windsurf",
      family: "ide-agent",
      capabilities: ["native-hooks", "rules-file", "can-inject-context"],
      hookFiles: [".windsurf/hooks.json", ".windsurf/hooks/solo-event.js", "AGENTS.md", ...commonHookBinFiles],
      recommendedProofMode: "native-hooks-plus-receipts",
      selfReportedCompletionAllowed: true,
      installCommand: "npm run sfn -- hooks install --target windsurf --project .",
      notes: ["Keep host events normalized to SoloEvent names."],
    },
    {
      id: "devin",
      label: "Devin",
      family: "cloud-agent",
      capabilities: ["rules-file", "external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: [".devin/rules/solo-founder-agent-builder.md", "AGENTS.md", ...commonHookBinFiles],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- hooks install --target devin --project .",
      notes: ["Use rules for steering; count only external proof receipts."],
    },
    {
      id: "cursor",
      label: "Cursor",
      family: "ide-agent",
      capabilities: ["rules-file", "external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: [".cursor/rules/solo-founder-agent-builder.mdc", "AGENTS.md", ...commonHookBinFiles],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- hooks install --target cursor --project .",
      notes: ["Rules steer the agent; receipts prove outcomes."],
    },
    {
      id: "trae",
      label: "Trae",
      family: "ide-agent",
      capabilities: ["rules-file", "external-proof-wrapper", "host-unverified", "no-self-reported-completion"],
      hookFiles: [".trae/rules/solo-founder-agent-builder.md", "AGENTS.md", ...commonHookBinFiles],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- hooks install --target trae --mode generic-until-verified --project .",
      notes: ["Use generic-until-verified mode until a native Trae hook surface is proven.", "No benchmark score counts without trace/video/scorer receipts."],
    },
    {
      id: "opencode",
      label: "OpenCode",
      family: "cli-agent",
      capabilities: ["rules-file", "external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: [".opencode/solo-founder-agent-builder.md", "AGENTS.md", ...commonHookBinFiles],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- hooks install --target opencode --project .",
      notes: ["Use wrapper events when native hooks are absent."],
    },
    {
      id: "openclaw",
      label: "OpenClaw",
      family: "cli-agent",
      capabilities: ["native-hooks", "native-plugin-hooks", "rules-file", "can-block", "can-inject-context", "no-self-reported-completion"],
      hookFiles: [".openclaw/hooks/solo-session-memory/HOOK.md", ".openclaw/hooks/solo-session-memory/handler.ts", ".openclaw/plugin/solo-founder/plugin.ts", ".openclaw/solo-founder-agent-builder.md", "AGENTS.md", ...commonHookBinFiles],
      recommendedProofMode: "native-hooks-plus-receipts",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- hooks install --target openclaw --project .",
      notes: ["Optional OpenRouter host; run native hook conformance before trusting model choices.", "Stop/final-answer hooks must call the fresh-context judge."],
    },
    {
      id: "hermes",
      label: "Hermes",
      family: "cli-agent",
      capabilities: ["shell-hooks", "native-plugin-hooks", "rules-file", "can-block", "can-inject-context", "no-self-reported-completion"],
      hookFiles: [".hermes/hooks.yaml", ".hermes/plugins/solo_founder/plugin.py", ".hermes/solo-founder-agent-builder.md", "AGENTS.md", ...commonHookBinFiles],
      recommendedProofMode: "native-hooks-plus-receipts",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- hooks install --target hermes --project .",
      notes: ["Optional OpenRouter host; use as a second agent only after receipts.", "Shell hooks must record pre/post tool receipts and call judge current on idle/stop."],
    },
    {
      id: "pi-agent",
      label: "Pi Agent",
      family: "generic",
      capabilities: ["native-yaml-hooks", "rules-file", "can-block", "can-inject-context", "external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: [".pi/hook/hooks.yaml", "AGENTS.md", ...commonHookBinFiles],
      recommendedProofMode: "native-hooks-plus-receipts",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- hooks install --target pi --project .",
      notes: ["Pi uses a YAML hook pack when available; otherwise keep the same receipt/fresh-judge policy through the generic wrapper."],
    },
    {
      id: "flue-ai",
      label: "Flue AI",
      family: "generic",
      capabilities: ["native-yaml-hooks", "rules-file", "can-block", "can-inject-context", "external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: [".flue/hook/hooks.yaml", "AGENTS.md", ...commonHookBinFiles],
      recommendedProofMode: "native-hooks-plus-receipts",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- hooks install --target flue-ai --project .",
      notes: ["Flue uses the same Pi-style YAML hook contract when available; receipts remain the proof boundary."],
    },
    {
      id: "generic",
      label: "Generic Coding Agent",
      family: "generic",
      capabilities: ["external-proof-wrapper", "no-self-reported-completion"],
      hookFiles: ["AGENTS.md", ...commonHookBinFiles],
      recommendedProofMode: "external-proof-only",
      selfReportedCompletionAllowed: false,
      installCommand: "npm run sfn -- hooks install --target generic --project .",
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

export function makeHookInstallPlan(
  target: SupportedHookTarget,
  generatedAt = new Date().toISOString(),
  options: { mode?: HookInstallMode } = {},
): HookInstallPlan {
  if (!supportedHookTargets.includes(target as never) && target !== "all") {
    throw new Error(`unsupported hook target '${target}' (expected one of: ${[...supportedHookTargets, "all"].join(", ")})`);
  }
  const normalizedTarget = normalizeHookTarget(target);
  const installMode = options.mode ?? (target === "trae" ? "generic-until-verified" : "native");
  const rows = normalizedTarget === "all" ? agentHostMatrix() : agentHostMatrix().filter((row) => row.id === normalizedTarget);
  const files: HookInstallFile[] = [
    {
      path: ".solo/bin/record-event",
      content: recordEventScript(),
      mode: "overwrite",
      executable: true,
    },
    {
      path: ".solo/bin/sfn-hook.js",
      content: sfnHookScript(),
      mode: "overwrite",
      executable: true,
    },
    {
      path: ".solo/bin/sfn-pre-tool-policy.js",
      content: sfnPreToolPolicyScript(),
      mode: "overwrite",
      executable: true,
    },
    {
      path: ".solo/bin/sfn-post-tool-receipt.js",
      content: sfnPostToolReceiptScript(),
      mode: "overwrite",
      executable: true,
    },
    {
      path: ".solo/bin/sfn-session-idle-judge.js",
      content: sfnSessionIdleJudgeScript(),
      mode: "overwrite",
      executable: true,
    },
    {
      path: ".solo/bin/sfn-final-answer-guard.js",
      content: sfnFinalAnswerGuardScript(),
      mode: "overwrite",
      executable: true,
    },
    {
      path: ".solo/bin/sfn-inject-loop-context.js",
      content: sfnInjectLoopContextScript(),
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
      if ((commonHookBinFiles as readonly string[]).includes(filePath) || filePath === "AGENTS.md") continue;
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
      `Install mode: ${installMode}. Native hook claims still require host conformance before they count.`,
      "Native hook files are host adapter templates. Run the host's own conformance/proof command before counting events.",
      "Generic/no-hooks agents must use external proof only and cannot self-report completion.",
      "Stop, idle, and final-answer paths call the fresh-context judge; a completion claim is blocked when receipts/proof are missing.",
    ],
    verificationCommands: [
      "npm run sfn -- dashboard --project .",
      "npm run sfn -- judge current --project .",
      "npm run sfn -- loop doctor --project .",
      "npm run sfn -- agent collect --project .",
    ],
  };
}

export function writeHookInstallPlan(repoPath: string, target: SupportedHookTarget, options: { dryRun?: boolean; mode?: HookInstallMode } = {}): HookInstallResult {
  const plan = makeHookInstallPlan(target, new Date().toISOString(), { mode: options.mode });
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
  if (filePath === ".pi/hook/hooks.yaml") return piYamlHooks("pi-agent");
  if (filePath === ".flue/hook/hooks.yaml") return piYamlHooks("flue-ai");
  if (filePath === ".hermes/hooks.yaml") return hermesHooksYaml();
  if (filePath === ".hermes/plugins/solo_founder/plugin.py") return hermesPluginPy();
  if (filePath === ".openclaw/hooks/solo-session-memory/HOOK.md") return openClawHookMd();
  if (filePath === ".openclaw/hooks/solo-session-memory/handler.ts") return openClawHookHandlerTs();
  if (filePath === ".openclaw/plugin/solo-founder/plugin.ts") return openClawPluginTs();
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
      "# Generated by: npm run sfn -- hooks install --target codex --project .",
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
  if (filePath.endsWith(".md") || filePath.endsWith(".mdc")) return agentRulesFileContent(hostId);
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

function piYamlHooks(hostId: string): string {
  return [
    "# SOLO FOUNDER COMMAND CENTER",
    "# Pi/Flue-style YAML hook pack. If the host cannot load this file natively, run the same",
    "# scripts from the host's generic wrapper and keep external proof mode enabled.",
    "hooks:",
    "  - id: solo-pre-bash-policy",
    "    event: tool.before.bash",
    "    actions:",
    `      - bash: "SOLO_AGENT_HOST=${hostId} node .solo/bin/sfn-pre-tool-policy.js"`,
    "  - id: solo-post-tool-receipt",
    "    event: tool.after",
    "    actions:",
    `      - bash: "SOLO_AGENT_HOST=${hostId} node .solo/bin/sfn-post-tool-receipt.js"`,
    "  - id: solo-idle-judge",
    "    event: session.idle",
    "    actions:",
    `      - bash: "SOLO_AGENT_HOST=${hostId} node .solo/bin/sfn-session-idle-judge.js"`,
    "  - id: solo-final-answer-guard",
    "    event: assistant.final_answer.before",
    "    actions:",
    `      - bash: "SOLO_AGENT_HOST=${hostId} node .solo/bin/sfn-final-answer-guard.js"`,
    "  - id: solo-context-injection",
    "    event: session.context.request",
    "    actions:",
    `      - bash: "SOLO_AGENT_HOST=${hostId} node .solo/bin/sfn-inject-loop-context.js"`,
    "",
  ].join("\n");
}

function hermesHooksYaml(): string {
  return [
    "# SOLO FOUNDER COMMAND CENTER",
    "# Hermes shell hook pack. Receipts decide pass/fail; model self-report does not.",
    "hooks:",
    "  pre_tool:",
    "    - id: solo-pre-tool-policy",
    "      command: node .solo/bin/sfn-pre-tool-policy.js",
    "  post_tool:",
    "    - id: solo-post-tool-receipt",
    "      command: node .solo/bin/sfn-post-tool-receipt.js",
    "  session_idle:",
    "    - id: solo-session-idle-judge",
    "      command: node .solo/bin/sfn-session-idle-judge.js",
    "  final_answer:",
    "    - id: solo-final-answer-guard",
    "      command: node .solo/bin/sfn-final-answer-guard.js",
    "  inject_context:",
    "    - id: solo-inject-loop-context",
    "      command: node .solo/bin/sfn-inject-loop-context.js",
    "",
  ].join("\n");
}

function hermesPluginPy(): string {
  return [
    '"""SOLO FOUNDER COMMAND CENTER',
    "Hermes plugin scaffold: native adapters should call these functions from the host hook API.",
    "The scripts are intentionally standalone so receipts survive fresh sessions.",
    '"""',
    "from __future__ import annotations",
    "",
    "import os",
    "import subprocess",
    "",
    "",
    "def _run(script: str) -> int:",
    "    env = os.environ.copy()",
    "    env.setdefault('SOLO_AGENT_HOST', 'hermes')",
    "    return subprocess.call(['node', script], env=env)",
    "",
    "",
    "def pre_tool_policy() -> int:",
    "    return _run('.solo/bin/sfn-pre-tool-policy.js')",
    "",
    "",
    "def post_tool_receipt() -> int:",
    "    return _run('.solo/bin/sfn-post-tool-receipt.js')",
    "",
    "",
    "def session_idle_judge() -> int:",
    "    return _run('.solo/bin/sfn-session-idle-judge.js')",
    "",
    "",
    "def final_answer_guard() -> int:",
    "    return _run('.solo/bin/sfn-final-answer-guard.js')",
    "",
  ].join("\n");
}

function openClawHookMd(): string {
  return [
    "---",
    "name: solo-session-memory",
    "description: RALPH loop memory, receipt recording, and fresh-context completion guard for OpenClaw.",
    "---",
    "",
    "# Solo Founder OpenClaw Hook",
    "",
    "This hook normalizes OpenClaw tool/session events into `.solo/events.jsonl`, injects RALPH loop",
    "context when requested, and blocks final-answer claims when `sfn judge current --on-stop` says",
    "receipts or proof are missing.",
    "",
    "Required runtime scripts:",
    "- `.solo/bin/sfn-pre-tool-policy.js`",
    "- `.solo/bin/sfn-post-tool-receipt.js`",
    "- `.solo/bin/sfn-session-idle-judge.js`",
    "- `.solo/bin/sfn-final-answer-guard.js`",
    "",
  ].join("\n");
}

function openClawHookHandlerTs(): string {
  return [
    "// SOLO FOUNDER COMMAND CENTER",
    'import { spawnSync } from "node:child_process";',
    "",
    "type OpenClawEvent = { type?: string; toolName?: string; command?: string; finalMessage?: string };",
    "",
    "function run(script: string, event: OpenClawEvent = {}) {",
    "  const env = {",
    "    ...process.env,",
    '    SOLO_AGENT_HOST: process.env.SOLO_AGENT_HOST ?? "openclaw",',
    '    SOLO_TOOL_NAME: event.toolName ?? process.env.SOLO_TOOL_NAME ?? "",',
    '    SOLO_COMMAND: event.command ?? process.env.SOLO_COMMAND ?? "",',
    '    SOLO_FINAL_MESSAGE: event.finalMessage ?? process.env.SOLO_FINAL_MESSAGE ?? "",',
    "  };",
    '  const result = spawnSync(process.execPath, [script], { stdio: "inherit", env });',
    "  return result.status ?? 0;",
    "}",
    "",
    "export function beforeTool(event: OpenClawEvent) {",
    '  return run(".solo/bin/sfn-pre-tool-policy.js", event);',
    "}",
    "",
    "export function afterTool(event: OpenClawEvent) {",
    '  return run(".solo/bin/sfn-post-tool-receipt.js", event);',
    "}",
    "",
    "export function onIdle(event: OpenClawEvent) {",
    '  return run(".solo/bin/sfn-session-idle-judge.js", event);',
    "}",
    "",
    "export function beforeFinalAnswer(event: OpenClawEvent) {",
    '  return run(".solo/bin/sfn-final-answer-guard.js", event);',
    "}",
    "",
  ].join("\n");
}

function openClawPluginTs(): string {
  return [
    "// SOLO FOUNDER COMMAND CENTER",
    "// OpenClaw plugin scaffold. Wire these handlers to the host's plugin API, then run",
    "// `npm run sfn -- judge current --project . --on-stop` in the target repo before trusting claims.",
    "export const soloFounderPlugin = {",
    '  name: "solo-founder-agent-builder",',
    "  hooks: {",
    '    beforeTool: ".solo/bin/sfn-pre-tool-policy.js",',
    '    afterTool: ".solo/bin/sfn-post-tool-receipt.js",',
    '    sessionIdle: ".solo/bin/sfn-session-idle-judge.js",',
    '    beforeFinalAnswer: ".solo/bin/sfn-final-answer-guard.js",',
    '    injectContext: ".solo/bin/sfn-inject-loop-context.js",',
    "  },",
    '  proofPolicy: "receipts-and-fresh-context-judge",',
    "};",
    "",
  ].join("\n");
}

function agentRulesFileContent(hostId: string): string {
  return [
    "<!-- SOLO FOUNDER COMMAND CENTER START -->",
    `# Solo Founder Agent Builder Rules for ${hostId}`,
    "",
    "You may not claim completion from chat context alone.",
    "",
    "Before final answer:",
    "1. Run `npm run sfn -- dashboard --project .`.",
    "2. Run `npm run sfn -- judge current --project . --on-stop`.",
    "3. If the judge returns `blockClaim: true`, continue the loop or report the exact blocker.",
    "",
    "For UI/agent/3D claims, receipts must include live UI proof, trace/video, exported/reopened artifacts,",
    "design-quality receipt, agent-chat UX receipt where applicable, and 3D asset-quality receipt for",
    "coherent/prototype/industry-grade asset claims.",
    "",
    "Generic-until-verified hosts must use external proof only until their native hook adapter has its own conformance receipt.",
    "<!-- SOLO FOUNDER COMMAND CENTER END -->",
    "",
  ].join("\n");
}

function hostHookScript(hostId: string, filePath: string): string {
  const event = filePath.includes("pre-tool")
    ? "tool.pre"
    : filePath.includes("post-tool")
      ? "tool.post"
      : filePath.includes("stop")
        ? "session.stop"
        : "command.run.post";
  const delegate = filePath.includes("pre-tool")
    ? ".solo/bin/sfn-pre-tool-policy.js"
    : filePath.includes("post-tool")
      ? ".solo/bin/sfn-post-tool-receipt.js"
      : filePath.includes("stop")
        ? ".solo/bin/sfn-final-answer-guard.js"
        : undefined;
  return [
    "#!/usr/bin/env node",
    "import { spawnSync } from 'node:child_process';",
    "",
    `const host = ${JSON.stringify(hostId)};`,
    `const event = ${JSON.stringify(event)};`,
    `const delegate = ${JSON.stringify(delegate)};`,
    "if (delegate) {",
    "  const env = { ...process.env, SOLO_AGENT_HOST: host };",
    "  const delegated = spawnSync(process.execPath, [delegate], { stdio: 'inherit', env });",
    "  process.exit(delegated.status ?? 0);",
    "}",
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
    "- Use `npm run sfn -- judge current --project . --on-stop` before a final answer. If it blocks, continue or report the blocker.",
    "- Use `npm run sfn -- proof verdict --run <dir>` or `npm run sfn -- fresh-room verify --receipt <file>` before shipping a capability claim.",
    "<!-- SOLO FOUNDER COMMAND CENTER END -->",
    "",
  ].join("\n");
}

function sfnHookRuntimeCommon(): string[] {
  return [
    "import { spawnSync } from 'node:child_process';",
    "import { existsSync } from 'node:fs';",
    "import { resolve } from 'node:path';",
    "",
    "function arg(name, fallback) {",
    "  const i = process.argv.indexOf(name);",
    "  return i >= 0 ? process.argv[i + 1] : fallback;",
    "}",
    "const host = arg('--agent', process.env.SOLO_AGENT_HOST || 'unknown');",
    "const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';",
    "function runNode(args) {",
    "  return spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env });",
    "}",
    "function record(event, extra = []) {",
    "  const args = ['.solo/bin/record-event', '--event', event, '--agent', host, '--source', 'solo-hook'];",
    "  if (process.env.SOLO_PHASE) args.push('--phase', process.env.SOLO_PHASE);",
    "  if (process.env.SOLO_MILESTONE) args.push('--milestone', process.env.SOLO_MILESTONE);",
    "  if (process.env.SOLO_TOOL_NAME) args.push('--tool', process.env.SOLO_TOOL_NAME);",
    "  if (process.env.SOLO_COMMAND) args.push('--command', process.env.SOLO_COMMAND);",
    "  if (process.env.SOLO_RECEIPT) args.push('--receipt', process.env.SOLO_RECEIPT);",
    "  args.push(...extra);",
    "  if (existsSync(resolve('.solo/bin/record-event'))) runNode(args);",
    "}",
    "function runSfn(args, stdio = 'inherit') {",
    "  return spawnSync(npmBin, ['run', 'sfn', '--', ...args], { stdio, shell: false, env: process.env });",
    "}",
    "function judge(extra = [], stdio = 'inherit') {",
    "  return runSfn(['judge', 'current', '--project', process.cwd(), ...extra], stdio);",
    "}",
    "function commandText() {",
    "  return process.env.SOLO_COMMAND || arg('--command', '') || process.argv.slice(2).join(' ');",
    "}",
  ];
}

function sfnHookScript(): string {
  return [
    "#!/usr/bin/env node",
    ...sfnHookRuntimeCommon(),
    "",
    "const kind = arg('--kind', process.env.SOLO_HOOK_KIND || 'post-tool');",
    "const dispatch = {",
    "  'pre-tool': '.solo/bin/sfn-pre-tool-policy.js',",
    "  'post-tool': '.solo/bin/sfn-post-tool-receipt.js',",
    "  'idle': '.solo/bin/sfn-session-idle-judge.js',",
    "  'final-answer': '.solo/bin/sfn-final-answer-guard.js',",
    "  'context': '.solo/bin/sfn-inject-loop-context.js',",
    "};",
    "const script = dispatch[kind];",
    "if (!script) {",
    "  console.error('unsupported SOLO hook kind: ' + kind);",
    "  process.exit(2);",
    "}",
    "const result = runNode([script, ...process.argv.slice(2)]);",
    "process.exit(result.status ?? 0);",
    "",
  ].join("\n");
}

function sfnPreToolPolicyScript(): string {
  return [
    "#!/usr/bin/env node",
    ...sfnHookRuntimeCommon(),
    "",
    "record('tool.before');",
    "record('tool.pre');",
    "const command = commandText();",
    "const destructive = /(git\\s+reset\\s+--hard|git\\s+checkout\\s+--|rm\\s+-rf\\s+\\/?|Remove-Item\\b[\\s\\S]*-Recurse|vercel\\s+--prod|npm\\s+publish)/i.test(command);",
    "if (destructive && process.env.SFN_ALLOW_DESTRUCTIVE !== '1') {",
    "  record('tool.error', ['--status', 'blocked', '--message', 'blocked destructive or publish command before approval']);",
    "  console.error(JSON.stringify({ decision: 'block', reason: 'Solo Founder pre-tool policy requires explicit approval for destructive/publish commands.', command }));",
    "  process.exit(1);",
    "}",
    "console.log(JSON.stringify({ decision: 'allow', reason: 'pre-tool policy passed' }));",
    "",
  ].join("\n");
}

function sfnPostToolReceiptScript(): string {
  return [
    "#!/usr/bin/env node",
    ...sfnHookRuntimeCommon(),
    "",
    "record('tool.after');",
    "record('tool.post');",
    "if (process.env.SOLO_RECEIPT) record('receipt.write');",
    "console.log(JSON.stringify({ decision: 'recorded', event: 'tool.after', receipt: process.env.SOLO_RECEIPT || null }));",
    "",
  ].join("\n");
}

function sfnSessionIdleJudgeScript(): string {
  return [
    "#!/usr/bin/env node",
    ...sfnHookRuntimeCommon(),
    "",
    "record('session.idle');",
    "const result = judge(['--on-stop']);",
    "if (result.error) {",
    "  console.error(JSON.stringify({ decision: 'warn', reason: 'sfn judge current was unavailable; external proof still required' }));",
    "  process.exit(0);",
    "}",
    "process.exit(result.status ?? 0);",
    "",
  ].join("\n");
}

function sfnFinalAnswerGuardScript(): string {
  return [
    "#!/usr/bin/env node",
    ...sfnHookRuntimeCommon(),
    "",
    "record('session.stop');",
    "const message = process.env.SOLO_FINAL_MESSAGE || arg('--last-message', '');",
    "const extra = ['--on-stop'];",
    "if (message) extra.push('--last-message', message);",
    "const result = judge(extra);",
    "if (result.error) {",
    "  console.error(JSON.stringify({ decision: 'warn', reason: 'sfn judge current was unavailable; final answer must cite external proof manually' }));",
    "  process.exit(0);",
    "}",
    "process.exit(result.status ?? 0);",
    "",
  ].join("\n");
}

function sfnInjectLoopContextScript(): string {
  return [
    "#!/usr/bin/env node",
    ...sfnHookRuntimeCommon(),
    "",
    "record('prompt.submit', ['--message', 'loop context requested']);",
    "console.log('SOLO FOUNDER LOOP CONTEXT');",
    "const dash = runSfn(['dashboard', '--project', process.cwd(), '--json'], 'pipe');",
    "if (dash.stdout) process.stdout.write(dash.stdout);",
    "const current = judge([], 'pipe');",
    "if (current.stdout) process.stdout.write(current.stdout);",
    "if (dash.error || current.error) console.error('sfn unavailable; use external receipts and proof verdict before claiming completion');",
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
