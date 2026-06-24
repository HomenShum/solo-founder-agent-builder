// sfn — Solo Founder Nodes local CLI. Run via:  npm run sfn -- <cmd>
// A thin, shell-only wrapper over the SAME code the smoke proves — no new dependencies, no service.
// It is just a convenience surface; every coding agent can run it because it is a shell command.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SoloLedger } from "../ledger/ledger";
import { inspectGraphContext } from "../context/graphContext";
import { SoloControlPlane } from "../control/controlPlane";
import { makeDashboardSnapshot, renderDashboard } from "../dashboard/dashboard";
import {
  agentHostMatrix,
  assertSoloEventName,
  formatAgentMatrix,
  makeAgentRunReceipt,
  makeHookInstallPlan,
  readSoloEventLog,
  recordSoloEvent,
  writeHookInstallPlan,
  type SupportedHookTarget,
} from "../events/soloEventBus";
import {
  make3dAgentResearchPack,
  proofScopes,
  researchDomains,
  top3dComparisonRubric,
  verifyResearchPack,
  type ProofArtifact,
  type ProofScope,
  type ResearchDomain,
  type ResearchPack,
} from "../research/researchSpine";
import {
  designAgentRuntimes,
  designStylePresets,
  designSkillRegistry,
  designSurfaceKinds,
  designTargetPlatforms,
  makeDesignFullFlow,
  recommendDesignSkills,
  verifyDesignFullFlow,
  verifyDesignSkillPlan,
  type DesignAgentRuntime,
  type DesignStylePreset,
  type DesignSurfaceKind,
  type DesignTargetPlatform,
} from "../design/designSkillBridge";
import {
  makeDesignQualityReceipt,
  verifyDesignQualityReceipt,
  type DesignQualityBar,
  type DesignQualityCriterion,
  type DesignVisualVerdict,
} from "../design/designQualityGate";
import {
  agentChatUxCapabilities,
  agentChatUxInspirationSources,
  agentChatUxSurfaceKinds,
  makeAgentChatUxPlan,
  verifyAgentChatUxPlan,
  verifyAgentChatUxReceipt,
  type AgentChatUxCapability,
  type AgentChatUxReceipt,
  type AgentChatUxSurfaceKind,
} from "../design/agentChatUxGate";
import {
  gstackRiskLevels,
  gstackRoleRegistry,
  recommendGstackLanes,
  soloLoopPhases,
  verifyGstackPlan,
  type GstackRiskLevel,
  type SoloLoopPhase,
} from "../gstack/gstackBridge";
import { makeExternalSetupGateReceipt, verifyExternalSetupGateReceipt } from "../setup/externalSetupGate";
import {
  makeOpenRouterAgentSetupPack,
  rankOpenRouterModelsFromCatalog,
  type OpenRouterModelAudit,
  verifyOpenRouterAgentSetupPack,
  writeOpenRouterAgentSetupPack,
} from "../setup/openrouterAgentHosts";
import { makeLoopRunReceipt, verifyLoopRunReceipt, type LoopRunReceipt } from "../loop/loopRunner";
import {
  assertLoopPhase,
  assertPhaseRalphStage,
  completePhaseRalphReceipt,
  makePhaseFailureRouteReceipt,
  phaseRalphGates,
  verifyPhaseRalph,
} from "../phase/phaseRalph";
import { makeThreeDComparatorRubric, makeThreeDPlan, verifyThreeDPlan, type ThreeDPlan } from "../threeD/threeDLoop";
import {
  makeThreeDAssetQualityPlan,
  threeDAssetClaimLevels,
  threeDAssetTargets,
  verifyThreeDAssetQualityReceipt,
  type ThreeDAssetClaimLevel,
  type ThreeDAssetQualityReceipt,
  type ThreeDAssetTarget,
} from "../threeD/assetQualityGate";
import {
  makeResearchOnlyAsset,
  verifyResearchAssetManifest,
  type ResearchAssetManifest,
} from "../threeD/researchAssetMaker";
import {
  engineeringRiskLevels,
  engineeringUrgencies,
  makeEngineeringInventionHarness,
  verifyEngineeringInventionHarness,
  type EngineeringInventionHarness,
  type EngineeringRiskLevel,
  type EngineeringUrgency,
} from "../engineering/engineeringInventionHarness";
import {
  makeFirstPrinciplesDeconstructionReceipt,
  verifyFirstPrinciplesDeconstructionReceipt,
  type FirstPrinciplesDeconstructionReceipt,
} from "../engineering/firstPrinciplesDeconstructionReceipt";
import { makeFullProofPack, verifyFullProofPack, type FullProofPack } from "../proof/fullProofPack";
import { makeFreshUserEmulationPlan, verifyFreshUserEmulationReceipt, type FreshUserEmulationReceipt } from "../freshUser/freshUserEmulation";
import { makeTrustRootReceipt, verifyTrustRootReceipt, type TrustRootReceipt } from "../trust/trustRoot";
import {
  completeRalphMilestone,
  createRalphLedger,
  doctorRalphLoop,
  loadRalphLoop,
  parseRalphMilestone,
  pauseRalphLoop,
  ralphPaths,
  ralphStatus,
  startRalphMilestone,
  verifyRalphMilestone,
} from "../loop/ralphLedger";
import { SoloMemory } from "../memory/localMemory";
import { exportMemoryToOkf } from "../memory/okfExport";
import type { RememberInput } from "../memory/types";
import { verifyAgentReadyToolContract, type AgentReadyToolContract } from "../agentApi/agentReadyApi";
import { verifyFreshRoomProofReceipt, type FreshRoomProofReceipt } from "../proof/freshRoomReceipt";
import { makeReworkLedger, verifyReworkLedger, type ReworkLedger, type ReworkLedgerEntry } from "../rework/reworkLedger";

const here = dirname(fileURLToPath(import.meta.url)); // templates/bin
const templates = join(here, "..");                   // templates
const skill = join(templates, "..");                  // skills/solo-founder-nodes
const conformanceMjs = join(skill, "conformance", "conformance.mjs");

const jbig = (_k: string, v: unknown) => (typeof v === "bigint" ? Number(v) : v);
// shell:true only for npm (npm.cmd on Windows); shell:false for node so spaced paths pass as array args.
const sh = (cmd: string, args: string[], cwd: string, shell = false) =>
  spawnSync(cmd, args, { cwd, stdio: "inherit", shell }).status ?? 1;

function flag(args: string[], name: string, fallback?: string) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
}

function flags(args: string[], name: string) {
  const values: string[] = [];
  for (let i = 0; i < args.length - 1; i++) {
    if (args[i] === name) values.push(args[i + 1]);
  }
  return values;
}

function csvFlags(args: string[], name: string) {
  return flags(args, name).flatMap((value) => value.split(",").map((part) => part.trim()).filter(Boolean));
}

function firstPositional(args: string[], fallback: string) {
  for (let i = 0; i < args.length; i++) {
    const prev = args[i - 1];
    if (!args[i].startsWith("--") && !(prev && prev.startsWith("--"))) return args[i];
  }
  return fallback;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8").replace(/^\uFEFF/, "")) as T;
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, jbig, 2)}\n`, "utf8");
}

async function fetchOpenRouterCatalog() {
  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: { "User-Agent": "solo-founder-nodes-openrouter-audit" },
  });
  if (!response.ok) throw new Error(`OpenRouter catalog fetch failed: HTTP ${response.status}`);
  return response.json() as Promise<{ data?: unknown[] }>;
}

function validateProofArtifactFile(runDir: string, artifact: ProofArtifact): string[] {
  if (!artifact.path) return [];
  const errors: string[] = [];
  const absPath = resolve(runDir, artifact.path);
  if (!existsSync(absPath)) return errors;
  const size = statSync(absPath).size;
  const ext = extname(absPath).toLowerCase();
  const label = `proof artifact '${artifact.id}'`;
  if (size === 0) errors.push(`${label} file is empty`);

  const expectExt = (allowed: string[]) => {
    if (!allowed.includes(ext)) errors.push(`${label} expected ${allowed.join("/")} file, got '${ext || "<none>"}'`);
  };

  if (artifact.kind === "fullscreen-video" || artifact.kind === "playwright-video") {
    expectExt([".mp4", ".webm", ".mov"]);
    if (size < 1024) errors.push(`${label} video is too small to be useful`);
  } else if (artifact.kind === "playwright-trace") {
    expectExt([".zip"]);
    if (size < 1024) errors.push(`${label} trace is too small to be useful`);
  } else if (artifact.kind === "generated-asset") {
    expectExt([".glb", ".gltf", ".usdz", ".obj", ".ply"]);
    if (size < 100) errors.push(`${label} generated asset is too small to be useful`);
  } else if (artifact.kind === "deployed-url") {
    expectExt([".md", ".txt", ".json"]);
    const text = readFileSync(absPath, "utf8");
    if (!/https:\/\/[^\s)]+/.test(text)) errors.push(`${label} deployed-url receipt must contain an https URL`);
  } else if (artifact.kind === "terminal-transcript") {
    expectExt([".txt", ".log", ".md"]);
    if (size < 100) errors.push(`${label} transcript is too small to show a real session`);
  } else if (artifact.kind === "recording-audit") {
    expectExt([".md", ".json", ".txt"]);
    const text = readFileSync(absPath, "utf8");
    if (size < 200) errors.push(`${label} recording audit is too small to be useful`);
    if (!/frame/i.test(text) || !/video/i.test(text)) errors.push(`${label} must mention video and frame inspection`);
  } else if (["provider-costs", "scorecard", "decision-log"].includes(artifact.kind)) {
    expectExt([".md", ".json", ".txt", ".csv"]);
    if (size < 50) errors.push(`${label} receipt is too small to be useful`);
  }

  return errors;
}

function parseDomain(value?: string): ResearchDomain {
  if (value && researchDomains.includes(value as ResearchDomain)) return value as ResearchDomain;
  throw new Error(`unsupported research domain '${value ?? ""}' (expected one of: ${researchDomains.join(", ")})`);
}

function parseProofScope(value?: string): ProofScope {
  const normalized = value ?? "production";
  if (proofScopes.includes(normalized as ProofScope)) return normalized as ProofScope;
  throw new Error(`unsupported proof scope '${normalized}' (expected one of: ${proofScopes.join(", ")})`);
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "proof-run";
}

function parseDesignRuntime(value?: string): DesignAgentRuntime {
  if (value && designAgentRuntimes.includes(value as DesignAgentRuntime)) return value as DesignAgentRuntime;
  throw new Error(`unsupported design runtime '${value ?? ""}' (expected one of: ${designAgentRuntimes.join(", ")})`);
}

function parseSurfaceKind(value?: string): DesignSurfaceKind {
  if (value && designSurfaceKinds.includes(value as DesignSurfaceKind)) return value as DesignSurfaceKind;
  throw new Error(`unsupported design surface '${value ?? ""}' (expected one of: ${designSurfaceKinds.join(", ")})`);
}

function parseStylePreset(value?: string): DesignStylePreset | undefined {
  if (!value) return undefined;
  if (designStylePresets.includes(value as DesignStylePreset)) return value as DesignStylePreset;
  throw new Error(`unsupported design style '${value}' (expected one of: ${designStylePresets.join(", ")})`);
}

function parseTargetPlatform(value?: string): DesignTargetPlatform {
  if (value && designTargetPlatforms.includes(value as DesignTargetPlatform)) return value as DesignTargetPlatform;
  throw new Error(`unsupported design platform '${value ?? ""}' (expected one of: ${designTargetPlatforms.join(", ")})`);
}

function parseDesignVisualVerdict(value?: string): DesignVisualVerdict {
  const allowed: DesignVisualVerdict[] = ["pass", "needs-redesign", "internal-harness", "not-run"];
  if (value && allowed.includes(value as DesignVisualVerdict)) return value as DesignVisualVerdict;
  throw new Error(`unsupported design visual verdict '${value ?? ""}' (expected one of: ${allowed.join(", ")})`);
}

function parseDesignQualityBar(value?: string): DesignQualityBar {
  const allowed: DesignQualityBar[] = ["shipping", "prototype", "internal"];
  if (value && allowed.includes(value as DesignQualityBar)) return value as DesignQualityBar;
  throw new Error(`unsupported design quality bar '${value ?? ""}' (expected one of: ${allowed.join(", ")})`);
}

function parseAgentChatSurfaceKind(value?: string): AgentChatUxSurfaceKind {
  if (value && agentChatUxSurfaceKinds.includes(value as AgentChatUxSurfaceKind)) return value as AgentChatUxSurfaceKind;
  throw new Error(`unsupported agent chat surface '${value ?? ""}' (expected one of: ${agentChatUxSurfaceKinds.join(", ")})`);
}

function parseAgentChatCapabilities(values: string[]): AgentChatUxCapability[] {
  const capabilities = values as AgentChatUxCapability[];
  const invalid = capabilities.filter((capability) => !agentChatUxCapabilities.includes(capability));
  if (invalid.length > 0) {
    throw new Error(`unsupported agent chat capability '${invalid.join(", ")}' (expected one of: ${agentChatUxCapabilities.join(", ")})`);
  }
  return capabilities;
}

function parseSoloPhase(value?: string): SoloLoopPhase {
  if (value && soloLoopPhases.includes(value as SoloLoopPhase)) return value as SoloLoopPhase;
  throw new Error(`unsupported phase '${value ?? ""}' (expected one of: ${soloLoopPhases.join(", ")})`);
}

function parseThreeDAssetTarget(value?: string): ThreeDAssetTarget {
  const normalized = value ?? "viewer";
  if (threeDAssetTargets.includes(normalized as ThreeDAssetTarget)) return normalized as ThreeDAssetTarget;
  throw new Error(`unsupported 3D asset target '${normalized}' (expected one of: ${threeDAssetTargets.join(", ")})`);
}

function parseThreeDAssetClaimLevel(args: string[]): ThreeDAssetClaimLevel {
  const raw = flag(args, "--claim", args.includes("--industry-grade") ? "industry-grade" : "prototype");
  if (raw && threeDAssetClaimLevels.includes(raw as ThreeDAssetClaimLevel)) return raw as ThreeDAssetClaimLevel;
  throw new Error(`unsupported 3D asset claim level '${raw ?? ""}' (expected one of: ${threeDAssetClaimLevels.join(", ")})`);
}

function parseGstackRisk(value?: string): GstackRiskLevel {
  if (value && gstackRiskLevels.includes(value as GstackRiskLevel)) return value as GstackRiskLevel;
  throw new Error(`unsupported gstack risk '${value ?? ""}' (expected one of: ${gstackRiskLevels.join(", ")})`);
}

async function openProjectMemory(projectPath: string) {
  const paths = ralphPaths(resolve(projectPath));
  const memory = new SoloMemory({
    dbUrl: `file:${paths.memoryDbPath}`,
    eventLogPath: join(paths.soloDir, "memory.events.jsonl"),
  });
  await memory.init();
  return { memory, paths };
}

function parseHookTarget(value?: string): SupportedHookTarget {
  const allowed = ["all", ...agentHostMatrix().map((row) => row.id)];
  if (value && allowed.includes(value)) return value as SupportedHookTarget;
  throw new Error(`unsupported agent hook target '${value ?? ""}' (expected one of: ${allowed.join(", ")})`);
}

function writeReceipt(projectPath: string, relativePath: string, payload: unknown) {
  const abs = resolve(projectPath, relativePath);
  writeJson(abs, payload);
  return abs;
}

const HELP = `sfn - Solo Founder Nodes local CLI   (run via: npm run sfn -- <cmd>)

  doctor                      check node + deps readiness
  smoke                       run the substrate proof (expect all assertions to pass)
  conformance                 run the cross-agent portability probe (PASS + receipt)
  dashboard [--project <path>] [--json] [--events <n>]
  event record --event <name> --agent <host> [--project <path>] [--phase <p>] [--milestone <R|A|L|P|H>] [--status ok|error|blocked|started|stopped|info] [--message <m>]
  context inspect [root]      inspect Graphify-style graph context receipt
  control start --project <p> --goal <g> [--budget <n>] [--root <path>]
  control status <loopId>     print durable loop status/resume summary
  control trigger --source <s> --key <k> --project <p> --goal <g> [--budget <n>]
  loop init --goal <g> [--project <path>] [--max-usd <n>] [--max-runtime-ms <n>] [--max-model-calls <n>]
  loop status [--project <path>]
  loop resume [--loop-id <id>] [--project <path>]
  loop start --from <R|A|L|P|H> [--project <path>]
  loop pause --message <m> [--project <path>] [--next <cmd>]
  loop events [--project <path>] [--limit <n>]
  loop doctor [--project <path>]
  loop verify --milestone <R|A|L|P|H> [--project <path>]
  loop complete --milestone <R|A|L|P|H> --receipt <path>... [--project <path>]
  phase status|verify --phase <p> [--stage <R|A|L|P|H>] [--project <path>]
  phase complete --phase <p> --stage <R|A|L|P|H> --receipt <id>... [--project <path>]
  phase route --to <phase> --reason <text> [--evidence <path>] [--project <path>]
  agent list|matrix
  agent install-hooks --target <host|all> [--project <path>] [--dry-run]
  agent run --host <host> --goal <g> [--project <path>] [--command <cmd>] [--execute]
  agent fanout --host <h1,h2> --goal <g> [--project <path>] [--out <file>]
  agent collect [--project <path>] [--limit <n>]
  run --project <path> --goal <g> [--out <file>]  create an enforceable loop receipt skeleton
  run verify --receipt <file> [--base <dir>]       fail until all phase receipts and proof-verdict pass
  setup gate --goal <g> --provider <p> --env <NAME> [--setup-url <url>] [--completed <csv>] [--resume <cmd>] [--out <file>]
  agent-api verify --contract <file>
  fresh-room verify --receipt <file> [--base <dir>]
  noderoom run-fresh-room --case <id> --base-url <url> [--headed] [--record-video] [--trace on|off] [--focus-mode on|off] [--model-mode <m>] [--budget <profile>]
  noderoom watch --case <id> [--project <path>] [--focus-mode]
  noderoom export-proof --receipt <file> [--base <dir>]
  noderoom judge-video --video <file>
  memory add --project <path> --project-id <id> --summary <s> [--content <c>] [--phase <p>] [--kind <k>] [--tag <t>]
  memory search --project <path> --project-id <id> --query <q> [--limit <n>]
  memory quarantine --project <path> --project-id <id> --summary <s> --content <c>
  memory export-okf --project <path> --project-id <id> [--out <dir>]
  memory doctor [--project <path>]
  rework verify --ledger <file> [--base <dir>]
  rework add --project <path> --project-id <id> --id <id> --old <text> --why <text> --failure <text> --failure-receipt <path> --new <text> --survived <text> --proof <path> --deleted <text> --kept <text> --lesson <text>
  rework list [--project <path>]
  rework explain --ledger <file> [--base <dir>]
  research init --goal <g> --domain <d> [--scope production|local-personal-research] [--out <file>]
  research verify [file] [--max-age-days <n>]
  proof init --goal <g> --domain <d> [--scope production|local-personal-research] [--out <dir>]
  proof start --run <dir>
  proof receipt --run <dir>
  proof collect --run <dir> --artifact <id> --path <path> [--sha256 <hash>]
  proof verify --run <dir>
  proof verdict --run <dir>
  proof full-init --goal <g> --deployed-url <url> [--out <file>]
  proof full-verify --receipt <file> [--base <dir>]
  proof publish --run <dir> [--out <file>]
  compare top3d [--out <file>]  print/write the 3D provider comparison rubric
  3d init|plan --goal <g> [--out <file>]
  3d verify --file <file>
  3d compare [--out <file>]
  3d quality-plan --goal <g> [--target viewer|game|cad|character|scene|marketplace] [--claim personal-research-scaffold|prototype|industry-grade] [--industry-grade] [--out <file>]
  3d quality-verify --receipt <file> [--base <dir>]
  3d make-asset --goal <g> --project-id <id> --out-dir <dir> [--functional-spec <file>] [--deconstruction-receipt <file>]
  3d verify-asset --manifest <file> [--base <dir>]
  engineering plan --goal <g> [--risk low|material_damage|safety_critical|medical_or_life_support] [--urgency routine|urgent|emergency] [--out <file>]
  engineering verify --file <file>
  engineering deconstruct-init --goal <g> --project-id <id> [--source <text>] [--out <file>]
  engineering deconstruct-verify --file <file>
  fresh-user init --case <id> --prompt <p> [--github <url>] [--out <file>]
  fresh-user verify --receipt <file> [--base <dir>]
  trust init --run <id> --verifier <cmd> [--signed <path>] [--out <file>]
  trust verify --receipt <file>
  agents openrouter-plan [--out <dir>] [--host-root <path>] [--audit <file>]
  agents openrouter-audit [--catalog <file>] [--out <file>] [--max <n>]
  design registry [--out <file>]
  design recommend --surface <kind> [--stack <s>] [--runtime <r>] [--style <preset>] [--platform <p>] [--animation] [--visuals] [--mobile] [--shadcn] [--shadcn-mcp] [--out <file>]
  design flow --surface <kind> [--category <c>] [--stack <s>] [--runtime <r>] [--style <preset>] [--platform <p>] [--animation] [--visuals] [--mobile] [--shadcn] [--shadcn-mcp] [--out <file>]
  design gate --surface <kind> --skill <id> --completed <csv> --desktop <path> --mobile <path> --brief <path> --contract <path> --interaction <path> --a11y <path> [--primary <kind>] [--verdict pass|needs-redesign|internal-harness|not-run] [--quality shipping|prototype|internal] [--note <text>] [--out <file>]
  design receipt --surface <kind> ...             alias for design gate
  design compare [--out <file>]                   print/write top 3D UI comparison rubric
  chat-ux sources [--out <file>]
  chat-ux plan --goal <g> [--surface <kind>] [--category <c>] [--model-compare] [--deployment] [--out <file>]
  chat-ux verify --receipt <file>
  gstack registry [--out <file>]
  gstack recommend --phase <p> --goal <g> [--surface <s>] [--risk low|medium|high] [--ui] [--deploy] [--security] [--devex] [--docs] [--perf] [--mobile] [--out <file>]
  seal --salt <s> <id...>     seal a held-out manifest (HMAC) — keep the salt OUT of the agent's reach
  ledger list                 list recorded eval runs
  ledger verify <runId>       re-verify a run's hash-chain (tamper check)

Every command wraps the same code the smoke proves; no new dependencies, shell-only.`;

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  switch (cmd) {
    case "doctor": {
      const nodeOk = Number(process.versions.node.split(".")[0]) >= 18;
      const deps = existsSync(join(templates, "node_modules"));
      console.log(`node ${process.versions.node} — ${nodeOk ? "ok" : "TOO OLD (need >= 18)"}`);
      console.log(`deps installed: ${deps ? "yes" : "no — run: npm i"}`);
      console.log(`conformance probe present: ${existsSync(conformanceMjs) ? "yes" : "no"}`);
      // Python lane (optional): run/spreadsheetbench.py hard-requires openpyxl + openai; the BTB
      // deliverable writers in run/deliverables.py also need python-pptx (imports as `pptx`),
      // python-docx (imports as `docx`), and reportlab. Probe ALL five so the lane can't report
      // "ok" while 3 of 4 BTB writers silently no-op (they lazy-import and degrade gracefully).
      // Report RED-when-broken instead of silent-green — a missing import is the cold gap that
      // surfaces as a vanished deliverable. WARNING, not a gate: founders on the Node-only
      // smoke/conformance lane shouldn't be blocked by absent Python.
      const pyProbe = ["-c", "import openpyxl, openai, pptx, docx, reportlab"];
      const tryPy = (bin: string) => spawnSync(bin, pyProbe, { stdio: "ignore" });
      let pyRes = tryPy("python3");
      if (pyRes.error) pyRes = tryPy("python"); // python3 not on PATH (common on Windows) → fall back
      if (pyRes.error) {
        console.log("python lane: WARNING — no python3/python on PATH (needed for run/spreadsheetbench.py + run/bankertoolbench.py; install: pip install -r run/requirements.txt)");
      } else if (pyRes.status === 0) {
        console.log("python lane: ok (openpyxl + openai + pptx + docx + reportlab importable)");
      } else {
        console.log("python lane: WARNING — python found but one of {openpyxl, openai, pptx, docx, reportlab} NOT importable; run: pip install -r run/requirements.txt  (BTB writers silently no-op without pptx/docx/reportlab)");
      }
      process.exit(nodeOk && deps ? 0 : 1);
    }
    case "smoke":
      process.exit(sh("npm", ["run", "smoke"], templates, true));
    case "conformance":
      process.exit(sh(process.execPath, [conformanceMjs, ...rest], skill, false));
    case "dashboard": {
      const projectPath = resolve(flag(rest, "--project", ".")!);
      const eventLimit = Number(flag(rest, "--events", "12"));
      if (rest.includes("--json")) {
        console.log(JSON.stringify(makeDashboardSnapshot(projectPath, { eventLimit }), jbig, 2));
      } else {
        console.log(renderDashboard(projectPath, { eventLimit }));
      }
      process.exit(0);
    }
    case "event": {
      const sub = rest[0];
      if (sub !== "record") {
        console.error("event record --event <name> --agent <host> [--project <path>] [--phase <p>] [--milestone <R|A|L|P|H>] [--status ok|error|blocked|started|stopped|info] [--message <m>]");
        process.exit(2);
      }
      const event = assertSoloEventName(flag(rest, "--event") ?? "");
      const agentHost = flag(rest, "--agent");
      if (!agentHost) {
        console.error("event record requires --agent <host>");
        process.exit(2);
      }
      const projectPath = resolve(flag(rest, "--project", ".")!);
      const milestone = flag(rest, "--milestone") ? parseRalphMilestone(flag(rest, "--milestone")) : undefined;
      const recorded = recordSoloEvent(projectPath, {
        event,
        agentHost,
        milestone,
        phase: flag(rest, "--phase"),
        status: (flag(rest, "--status", "info") as never),
        message: flag(rest, "--message"),
        command: flag(rest, "--command"),
        filePath: flag(rest, "--file"),
        toolName: flag(rest, "--tool"),
        receiptPath: flag(rest, "--receipt"),
        source: flag(rest, "--source", "sfn"),
        cwd: process.cwd(),
      });
      console.log(JSON.stringify(recorded, jbig, 2));
      process.exit(0);
    }
    case "context": {
      if (rest[0] !== "inspect") {
        console.error("context: inspect [root]");
        process.exit(2);
      }
      const root = rest[1] ?? process.cwd();
      const receipt = inspectGraphContext({ projectRoot: root });
      console.log(JSON.stringify(receipt, jbig, 2));
      process.exit(receipt.status === "ready" ? 0 : 1);
    }
    case "control": {
      const sub = rest[0];
      const control = new SoloControlPlane();
      await control.init();
      if (sub === "start") {
        const projectId = flag(rest, "--project");
        const goal = flag(rest, "--goal");
        const budgetUsd = Number(flag(rest, "--budget", "5"));
        const root = flag(rest, "--root");
        if (!projectId || !goal) {
          console.error("control start --project <p> --goal <g> [--budget <n>] [--root <path>]");
          process.exit(2);
        }
        const context = root ? inspectGraphContext({ projectRoot: root }) : undefined;
        const started = await control.startLoop({ projectId, goal, budgetUsd, context });
        console.log(JSON.stringify(started, jbig, 2));
        process.exit(0);
      }
      if (sub === "status") {
        const loopId = rest[1];
        if (!loopId) {
          console.error("control status <loopId>");
          process.exit(2);
        }
        console.log(JSON.stringify(await control.resumeSummary(loopId), jbig, 2));
        process.exit(0);
      }
      if (sub === "trigger") {
        const source = flag(rest, "--source");
        const idempotencyKey = flag(rest, "--key");
        const projectId = flag(rest, "--project");
        const goal = flag(rest, "--goal");
        const budgetUsd = Number(flag(rest, "--budget", "5"));
        if (!source || !idempotencyKey || !projectId || !goal) {
          console.error("control trigger --source <s> --key <k> --project <p> --goal <g> [--budget <n>]");
          process.exit(2);
        }
        const result = await control.ingestTrigger({ source, idempotencyKey, projectId, goal, budgetUsd });
        console.log(JSON.stringify(result, jbig, 2));
        process.exit(0);
      }
      console.error("control: start | status <loopId> | trigger");
      process.exit(2);
    }
    case "loop": {
      const sub = rest[0];
      const projectPath = resolve(flag(rest, "--project", ".")!);
      if (sub === "init") {
        const goal = flag(rest, "--goal");
        if (!goal) {
          console.error("loop init --goal <g> [--project <path>] [--max-usd <n>] [--max-runtime-ms <n>] [--max-model-calls <n>]");
          process.exit(2);
        }
        const budgets = {
          maxUsd: flag(rest, "--max-usd") ? Number(flag(rest, "--max-usd")) : undefined,
          maxRuntimeMs: flag(rest, "--max-runtime-ms") ? Number(flag(rest, "--max-runtime-ms")) : undefined,
          maxModelCalls: flag(rest, "--max-model-calls") ? Number(flag(rest, "--max-model-calls")) : undefined,
        };
        const result = createRalphLedger({ repoPath: projectPath, goal, budgets });
        console.log(JSON.stringify(result, jbig, 2));
        process.exit(0);
      }
      if (sub === "status") {
        const result = ralphStatus(projectPath);
        console.log(JSON.stringify(result, jbig, 2));
        process.exit(0);
      }
      if (sub === "resume") {
        const loopId = flag(rest, "--loop-id");
        const result = loadRalphLoop(projectPath);
        if (loopId && result.loop.loopId !== loopId) {
          console.error(`loop-id mismatch: requested ${loopId}, found ${result.loop.loopId}`);
          process.exit(1);
        }
        console.log(JSON.stringify({ ...result, resumeCommand: `npm run sfn -- loop start --from ${result.loop.currentMilestone}` }, jbig, 2));
        process.exit(0);
      }
      if (sub === "pause") {
        const message = flag(rest, "--message");
        if (!message) {
          console.error("loop pause --message <m> [--project <path>] [--next <cmd>]");
          process.exit(2);
        }
        const result = pauseRalphLoop(projectPath, { message, nextAction: flag(rest, "--next") });
        console.log(JSON.stringify(result, jbig, 2));
        process.exit(0);
      }
      if (sub === "events") {
        const limit = Number(flag(rest, "--limit", "50"));
        console.log(JSON.stringify({ projectPath, events: readSoloEventLog(projectPath, limit) }, jbig, 2));
        process.exit(0);
      }
      if (sub === "doctor") {
        const report = doctorRalphLoop(projectPath);
        console.log(JSON.stringify(report, jbig, 2));
        process.exit(report.ok ? 0 : 1);
      }
      if (sub === "start") {
        const milestone = parseRalphMilestone(flag(rest, "--from"));
        const result = startRalphMilestone(projectPath, milestone);
        console.log(JSON.stringify(result, jbig, 2));
        process.exit(result.verification.ok ? 0 : 1);
      }
      if (sub === "verify") {
        const milestone = parseRalphMilestone(flag(rest, "--milestone"));
        const verdict = verifyRalphMilestone(projectPath, milestone);
        console.log(JSON.stringify({ projectPath, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "complete") {
        const milestone = parseRalphMilestone(flag(rest, "--milestone"));
        const receipts = flags(rest, "--receipt");
        if (receipts.length === 0) {
          console.error("loop complete --milestone <R|A|L|P|H> --receipt <path>... [--project <path>]");
          process.exit(2);
        }
        const result = completeRalphMilestone(projectPath, milestone, receipts);
        console.log(JSON.stringify(result, jbig, 2));
        process.exit(0);
      }
      console.error("loop: init | status | resume | pause | events | doctor | start --from <R|A|L|P|H> | verify --milestone <R|A|L|P|H> | complete --milestone <R|A|L|P|H> --receipt <path>...");
      process.exit(2);
    }
    case "phase": {
      const sub = rest[0];
      const projectPath = resolve(flag(rest, "--project", ".")!);
      if (sub === "status" || sub === "verify") {
        const phase = assertLoopPhase(flag(rest, "--phase") ?? "");
        const stage = flag(rest, "--stage") ? assertPhaseRalphStage(flag(rest, "--stage")!) : undefined;
        const verdict = verifyPhaseRalph(projectPath, phase, stage);
        console.log(JSON.stringify({ projectPath, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "complete") {
        const phase = assertLoopPhase(flag(rest, "--phase") ?? "");
        const stage = assertPhaseRalphStage(flag(rest, "--stage") ?? "");
        const receipts = flags(rest, "--receipt");
        if (receipts.length === 0) {
          console.error("phase complete --phase <p> --stage <R|A|L|P|H> --receipt <id>... [--project <path>]");
          process.exit(2);
        }
        const written = receipts.map((receiptId) => completePhaseRalphReceipt(projectPath, { phase, stage, receiptId }));
        console.log(JSON.stringify({ projectPath, phase, stage, written }, jbig, 2));
        process.exit(0);
      }
      if (sub === "route") {
        const toPhase = assertLoopPhase(flag(rest, "--to") ?? "");
        if (toPhase === "iterate") {
          console.error("phase route --to cannot target iterate; route to the earlier broken phase or verify");
          process.exit(2);
        }
        const reason = flag(rest, "--reason");
        if (!reason) {
          console.error("phase route --to <phase> --reason <text> [--evidence <path>] [--project <path>]");
          process.exit(2);
        }
        const receipt = makePhaseFailureRouteReceipt({ toPhase, reason, evidenceRefs: flags(rest, "--evidence") });
        const out = completePhaseRalphReceipt(projectPath, {
          phase: "verify",
          stage: "H",
          receiptId: "failure-route",
          payload: { route: receipt },
        });
        console.log(JSON.stringify({ projectPath, receiptPath: out.path, receipt }, jbig, 2));
        process.exit(0);
      }
      if (sub === "gates") {
        console.log(JSON.stringify(phaseRalphGates, jbig, 2));
        process.exit(0);
      }
      console.error("phase: status|verify --phase <p> [--stage <R|A|L|P|H>] | complete --phase <p> --stage <R|A|L|P|H> --receipt <id>... | route --to <phase> --reason <text> | gates");
      process.exit(2);
    }
    case "run": {
      const sub = rest[0];
      if (sub === "verify") {
        const receiptPath = flag(rest, "--receipt");
        const baseDir = flag(rest, "--base");
        if (!receiptPath) {
          console.error("run verify --receipt <file> [--base <dir>]");
          process.exit(2);
        }
        const abs = resolve(receiptPath);
        const receipt = readJson<LoopRunReceipt>(abs);
        const verdict = verifyLoopRunReceipt(receipt, { baseDir: baseDir ? resolve(baseDir) : dirname(abs) });
        console.log(JSON.stringify({ receipt: abs, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      const projectPath = flag(rest, "--project");
      const goal = flag(rest, "--goal");
      if (!projectPath || !goal) {
        console.error("run --project <path> --goal <g> [--out <file>] | run verify --receipt <file> [--base <dir>]");
        process.exit(2);
      }
      const receipt = makeLoopRunReceipt({ projectPath: resolve(projectPath), goal });
      const verdict = verifyLoopRunReceipt(receipt, { baseDir: resolve(projectPath), requireFiles: false });
      const out = flag(rest, "--out");
      if (out) writeJson(resolve(out), receipt);
      console.log(JSON.stringify(out ? { out: resolve(out), receipt, verdict } : { receipt, verdict }, jbig, 2));
      process.exit(0);
    }
    case "agent-api": {
      const sub = rest[0];
      if (sub !== "verify") {
        console.error("agent-api verify --contract <file>");
        process.exit(2);
      }
      const contractPath = flag(rest, "--contract");
      if (!contractPath) {
        console.error("agent-api verify --contract <file>");
        process.exit(2);
      }
      const abs = resolve(contractPath);
      const contract = readJson<AgentReadyToolContract>(abs);
      const verdict = verifyAgentReadyToolContract(contract);
      console.log(JSON.stringify({ contract: abs, verdict }, jbig, 2));
      process.exit(verdict.ok ? 0 : 1);
    }
    case "fresh-room": {
      const sub = rest[0];
      if (sub !== "verify") {
        console.error("fresh-room verify --receipt <file> [--base <dir>]");
        process.exit(2);
      }
      const receiptPath = flag(rest, "--receipt");
      const baseDir = flag(rest, "--base");
      if (!receiptPath) {
        console.error("fresh-room verify --receipt <file> [--base <dir>]");
        process.exit(2);
      }
      const abs = resolve(receiptPath);
      const receipt = readJson<FreshRoomProofReceipt>(abs);
      const verdict = verifyFreshRoomProofReceipt(receipt, { baseDir: baseDir ? resolve(baseDir) : dirname(abs) });
      console.log(JSON.stringify({ receipt: abs, verdict }, jbig, 2));
      process.exit(verdict.ok ? 0 : 1);
    }
    case "noderoom": {
      const sub = rest[0];
      if (sub === "run-fresh-room") {
        const caseId = flag(rest, "--case");
        const baseUrl = flag(rest, "--base-url");
        if (!caseId || !baseUrl) {
          console.error("noderoom run-fresh-room --case <id> --base-url <url> [--headed] [--record-video] [--trace on|off] [--focus-mode on|off] [--model-mode <m>] [--budget <profile>]");
          process.exit(2);
        }
        const projectPath = resolve(flag(rest, "--project", ".")!);
        const receipt = {
          schemaVersion: 1,
          kind: "noderoom-fresh-room-command",
          caseId,
          baseUrl,
          headed: rest.includes("--headed"),
          recordVideo: rest.includes("--record-video"),
          trace: flag(rest, "--trace", "on"),
          focusMode: flag(rest, "--focus-mode", rest.includes("--focus") ? "on" : "off"),
          modelMode: flag(rest, "--model-mode", "top_paid"),
          budget: flag(rest, "--budget", "benchmark_completion"),
          command: [
            "npm run nodeagent:fresh-room --",
            `--case ${caseId}`,
            `--base-url ${baseUrl}`,
            rest.includes("--headed") ? "--headed" : "",
            rest.includes("--record-video") ? "--record-video" : "",
            `--trace ${flag(rest, "--trace", "on")}`,
            `--focus-mode ${flag(rest, "--focus-mode", "on")}`,
            `--model-mode ${flag(rest, "--model-mode", "top_paid")}`,
            `--budget ${flag(rest, "--budget", "benchmark_completion")}`,
          ].filter(Boolean).join(" "),
          requiredProof: ["fullscreen or Playwright video", "trace zip", "fresh-room latest.json", "proof-verdict.json", "visual verification of recording"],
          status: "handoff_ready",
          warning: "This command receipt is not a pass. Run it in NodeRoom and verify exported proof receipts.",
        };
        const out = writeReceipt(projectPath, `.solo/receipts/P-proof-run/noderoom-${caseId}.json`, receipt);
        recordSoloEvent(projectPath, {
          event: "eval.start",
          agentHost: "noderoom",
          milestone: "P",
          status: "started",
          message: `Fresh-room handoff ${caseId}`,
          receiptPath: out,
          source: "sfn-noderoom",
        });
        console.log(JSON.stringify({ out, receipt }, jbig, 2));
        process.exit(0);
      }
      if (sub === "watch") {
        const projectPath = resolve(flag(rest, "--project", ".")!);
        console.log(renderDashboard(projectPath, { eventLimit: Number(flag(rest, "--events", "20")) }));
        process.exit(0);
      }
      if (sub === "export-proof") {
        const receiptPath = flag(rest, "--receipt");
        const baseDir = flag(rest, "--base");
        if (!receiptPath) {
          console.error("noderoom export-proof --receipt <file> [--base <dir>]");
          process.exit(2);
        }
        const abs = resolve(receiptPath);
        const receipt = readJson<FreshRoomProofReceipt>(abs);
        const verdict = verifyFreshRoomProofReceipt(receipt, { baseDir: baseDir ? resolve(baseDir) : dirname(abs) });
        console.log(JSON.stringify({ receipt: abs, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "judge-video") {
        const video = flag(rest, "--video");
        if (!video) {
          console.error("noderoom judge-video --video <file>");
          process.exit(2);
        }
        const abs = resolve(video);
        const exists = existsSync(abs);
        const sizeBytes = exists ? statSync(abs).size : 0;
        const verdict = {
          ok: exists && sizeBytes > 1024,
          video: abs,
          exists,
          sizeBytes,
          requiredNext: "Open the recording or frame-audit it before claiming it captured the correct UI session.",
        };
        console.log(JSON.stringify(verdict, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      console.error("noderoom: run-fresh-room | watch | export-proof | judge-video");
      process.exit(2);
    }
    case "memory": {
      const sub = rest[0];
      const projectPath = resolve(flag(rest, "--project", ".")!);
      if (sub === "add") {
        const projectId = flag(rest, "--project-id");
        const summary = flag(rest, "--summary");
        if (!projectId || !summary) {
          console.error("memory add --project <path> --project-id <id> --summary <s> [--content <c>] [--phase <p>] [--kind <k>] [--tag <t>]");
          process.exit(2);
        }
        const { memory } = await openProjectMemory(projectPath);
        const input: RememberInput = {
          projectId,
          phase: (flag(rest, "--phase", "runtime") as never),
          kind: (flag(rest, "--kind", "decision") as never),
          summary,
          content: flag(rest, "--content", ""),
          tags: flags(rest, "--tag"),
          evidenceRefs: flags(rest, "--evidence").map((ref) => ({ type: "file" as const, ref })),
          benchmarkSafety: (flag(rest, "--safety", "safe") as never),
        };
        const result = await memory.remember(input);
        recordSoloEvent(projectPath, {
          event: "memory.write",
          agentHost: flag(rest, "--agent", "sfn") ?? "sfn",
          status: "ok",
          message: summary,
          source: "sfn-memory",
        });
        console.log(JSON.stringify(result, jbig, 2));
        process.exit(0);
      }
      if (sub === "search") {
        const projectId = flag(rest, "--project-id");
        const query = flag(rest, "--query");
        if (!projectId || !query) {
          console.error("memory search --project <path> --project-id <id> --query <q> [--limit <n>]");
          process.exit(2);
        }
        const { memory } = await openProjectMemory(projectPath);
        const hits = await memory.search({ projectId, query, limit: Number(flag(rest, "--limit", "8")), minScore: Number(flag(rest, "--min-score", "0")) });
        console.log(JSON.stringify(hits, jbig, 2));
        process.exit(0);
      }
      if (sub === "quarantine") {
        const projectId = flag(rest, "--project-id");
        const summary = flag(rest, "--summary");
        const content = flag(rest, "--content");
        if (!projectId || !summary || !content) {
          console.error("memory quarantine --project <path> --project-id <id> --summary <s> --content <c>");
          process.exit(2);
        }
        const { memory } = await openProjectMemory(projectPath);
        let rejected = false;
        try {
          await memory.remember({
            projectId,
            phase: "runtime",
            kind: "run_result",
            summary,
            content,
            benchmarkSafety: "heldout_forbidden",
          });
        } catch {
          rejected = true;
        }
        const payload = { ok: rejected, rejected, reason: "heldout_forbidden writes must not enter durable memory" };
        recordSoloEvent(projectPath, {
          event: "memory.write",
          agentHost: "sfn",
          status: rejected ? "blocked" : "error",
          message: summary,
          source: "sfn-memory-quarantine",
          payload,
        });
        console.log(JSON.stringify(payload, jbig, 2));
        process.exit(rejected ? 0 : 1);
      }
      if (sub === "export-okf") {
        const projectId = flag(rest, "--project-id");
        if (!projectId) {
          console.error("memory export-okf --project <path> --project-id <id> [--out <dir>]");
          process.exit(2);
        }
        const { memory } = await openProjectMemory(projectPath);
        const result = await exportMemoryToOkf({ memory, projectId, outDir: flag(rest, "--out") ? resolve(flag(rest, "--out")!) : join(ralphPaths(projectPath).soloDir, "okf-memory") });
        console.log(JSON.stringify(result, jbig, 2));
        process.exit(0);
      }
      if (sub === "doctor") {
        const paths = ralphPaths(projectPath);
        const exists = existsSync(paths.memoryDbPath);
        const payload = { ok: true, memoryDbPath: paths.memoryDbPath, exists, note: exists ? "memory db present" : "memory db will be created on first add/search" };
        console.log(JSON.stringify(payload, jbig, 2));
        process.exit(0);
      }
      console.error("memory: add | search | quarantine | export-okf | doctor");
      process.exit(2);
    }
    case "rework": {
      const sub = rest[0];
      if (sub === "verify" || sub === "explain") {
        const ledgerPath = flag(rest, "--ledger");
        const baseDir = flag(rest, "--base");
        if (!ledgerPath) {
          console.error(`rework ${sub} --ledger <file> [--base <dir>]`);
          process.exit(2);
        }
        const abs = resolve(ledgerPath);
        const ledger = readJson<ReworkLedger>(abs);
        const verdict = verifyReworkLedger(ledger, { baseDir: baseDir ? resolve(baseDir) : dirname(abs) });
        const payload = sub === "explain"
          ? {
              ledger: abs,
              verdict,
              lessons: ledger.entries.map((entry) => ({
                id: entry.id,
                failureMode: entry.failureMode,
                newApproach: entry.newApproach,
                lesson: entry.lesson,
              })),
            }
          : { ledger: abs, verdict };
        console.log(JSON.stringify(payload, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "list") {
        const projectPath = resolve(flag(rest, "--project", ".")!);
        const path = ralphPaths(projectPath).reworkLedgerPath;
        if (!existsSync(path)) {
          console.log(JSON.stringify({ path, entries: [], warning: "no rework ledger yet" }, jbig, 2));
          process.exit(0);
        }
        const ledger = readJson<ReworkLedger>(path);
        console.log(JSON.stringify({ path, entries: ledger.entries }, jbig, 2));
        process.exit(0);
      }
      if (sub === "add") {
        const projectPath = resolve(flag(rest, "--project", ".")!);
        const projectId = flag(rest, "--project-id");
        const id = flag(rest, "--id");
        const required = ["--old", "--why", "--failure", "--failure-receipt", "--new", "--survived", "--proof", "--deleted", "--kept", "--lesson"];
        if (!projectId || !id || required.some((name) => !flag(rest, name))) {
          console.error("rework add --project <path> --project-id <id> --id <id> --old <text> --why <text> --failure <text> --failure-receipt <path> --new <text> --survived <text> --proof <path> --deleted <text> --kept <text> --lesson <text>");
          process.exit(2);
        }
        const paths = ralphPaths(projectPath);
        const existing = existsSync(paths.reworkLedgerPath)
          ? readJson<ReworkLedger>(paths.reworkLedgerPath)
          : makeReworkLedger({ projectId, entries: [] });
        const entry: ReworkLedgerEntry = {
          id,
          oldApproach: flag(rest, "--old")!,
          whyItSeemedRight: flag(rest, "--why")!,
          failureMode: flag(rest, "--failure")!,
          failureReceiptPath: flag(rest, "--failure-receipt")!,
          newApproach: flag(rest, "--new")!,
          whyItSurvived: flag(rest, "--survived")!,
          proofReceiptPaths: flags(rest, "--proof"),
          deletedArtifacts: csvFlags(rest, "--deleted"),
          keptArtifacts: csvFlags(rest, "--kept"),
          lesson: flag(rest, "--lesson")!,
        };
        existing.entries = existing.entries.filter((candidate) => candidate.id !== id);
        existing.entries.push(entry);
        writeJson(paths.reworkLedgerPath, existing);
        recordSoloEvent(projectPath, {
          event: "rework.recorded",
          agentHost: flag(rest, "--agent", "sfn") ?? "sfn",
          milestone: "H",
          status: "ok",
          message: entry.lesson,
          receiptPath: paths.reworkLedgerPath,
          source: "sfn-rework",
        });
        console.log(JSON.stringify({ path: paths.reworkLedgerPath, ledger: existing }, jbig, 2));
        process.exit(0);
      }
      console.error("rework: add | list | explain | verify");
      process.exit(2);
    }
    case "setup": {
      const sub = rest[0];
      if (sub !== "gate") {
        console.error("setup: gate");
        process.exit(2);
      }
      const goal = flag(rest, "--goal");
      const provider = flag(rest, "--provider");
      const requiredSecrets = csvFlags(rest, "--env");
      const resumeCommands = flags(rest, "--resume");
      if (!goal || !provider || requiredSecrets.length === 0) {
        console.error("setup gate --goal <g> --provider <p> --env <NAME> [--setup-url <url>] [--completed <csv>] [--resume <cmd>] [--out <file>]");
        process.exit(2);
      }
      const receipt = makeExternalSetupGateReceipt({
        goal,
        provider,
        requiredSecrets,
        setupUrls: flags(rest, "--setup-url"),
        completedPrework: csvFlags(rest, "--completed"),
        resumeCommands,
      });
      const verdict = verifyExternalSetupGateReceipt(receipt);
      const payload = { receipt, verdict };
      const out = flag(rest, "--out");
      if (out) writeJson(resolve(out), payload);
      console.log(JSON.stringify(out ? { out: resolve(out), ...payload } : payload, jbig, 2));
      process.exit(verdict.ok ? 0 : 1);
    }
    case "research": {
      const sub = rest[0];
      if (sub === "init") {
        const goal = flag(rest, "--goal");
        const domain = parseDomain(flag(rest, "--domain", "3d-generation"));
        const proofScope = parseProofScope(flag(rest, "--scope"));
        const out = resolve(flag(rest, "--out") ?? "research-spine.json");
        if (!goal) {
          console.error("research init --goal <g> --domain <d> [--scope production|local-personal-research] [--out <file>]");
          process.exit(2);
        }
        const pack = make3dAgentResearchPack({ goal, domain, proofScope });
        writeJson(out, pack);
        const verdict = verifyResearchPack(pack);
        console.log(JSON.stringify({ out, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "verify") {
        const file = resolve(firstPositional(rest.slice(1), "research-spine.json"));
        const maxSourceAgeDays = Number(flag(rest, "--max-age-days", "365"));
        const pack = readJson<ResearchPack>(file);
        const verdict = verifyResearchPack(pack, { maxSourceAgeDays });
        console.log(JSON.stringify({ file, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      console.error("research: init | verify");
      process.exit(2);
    }
    case "proof": {
      const sub = rest[0];
      if (sub === "init") {
        const goal = flag(rest, "--goal");
        const domain = parseDomain(flag(rest, "--domain", "3d-generation"));
        const proofScope = parseProofScope(flag(rest, "--scope"));
        if (!goal) {
          console.error("proof init --goal <g> --domain <d> [--scope production|local-personal-research] [--out <dir>]");
          process.exit(2);
        }
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const out = resolve(flag(rest, "--out") ?? join("proof-runs", `${slugify(goal)}-${stamp}`));
        mkdirSync(out, { recursive: true });
        const pack = make3dAgentResearchPack({ goal, domain, proofScope });
        const manifest = {
          schemaVersion: 1,
          goal,
          domain,
          proofScope,
          createdAt: new Date().toISOString(),
          status: "initialized",
          researchSpine: "research-spine.json",
          collected: [] as Array<{ artifactId: string; path: string; sha256?: string }>,
        };
        writeJson(join(out, "research-spine.json"), pack);
        writeJson(join(out, "proof-manifest.json"), manifest);
        console.log(JSON.stringify({ out, manifest }, jbig, 2));
        process.exit(0);
      }
      if (sub === "start") {
        const runDir = flag(rest, "--run");
        if (!runDir) {
          console.error("proof start --run <dir>");
          process.exit(2);
        }
        const manifestPath = join(resolve(runDir), "proof-manifest.json");
        const manifest = readJson<Record<string, unknown>>(manifestPath);
        manifest.status = "started";
        manifest.startedAt = manifest.startedAt ?? new Date().toISOString();
        writeJson(manifestPath, manifest);
        console.log(JSON.stringify({ run: resolve(runDir), manifest }, jbig, 2));
        process.exit(0);
      }
      if (sub === "receipt") {
        const runDir = flag(rest, "--run");
        if (!runDir) {
          console.error("proof receipt --run <dir>");
          process.exit(2);
        }
        const absRun = resolve(runDir);
        const manifest = readJson<Record<string, unknown>>(join(absRun, "proof-manifest.json"));
        const verdictPath = join(absRun, "proof-verdict.json");
        const verdict = existsSync(verdictPath) ? readJson<Record<string, unknown>>(verdictPath) : { ok: false, missing: true };
        console.log(JSON.stringify({ run: absRun, manifest, verdict }, jbig, 2));
        process.exit(0);
      }
      if (sub === "collect") {
        const runDir = flag(rest, "--run");
        const artifactId = flag(rest, "--artifact");
        const artifactPath = flag(rest, "--path");
        const sha = flag(rest, "--sha256");
        if (!runDir || !artifactId || !artifactPath) {
          console.error("proof collect --run <dir> --artifact <id> --path <path> [--sha256 <hash>]");
          process.exit(2);
        }
        const absRun = resolve(runDir);
        const manifestPath = join(absRun, "proof-manifest.json");
        const packPath = join(absRun, "research-spine.json");
        const manifest = readJson<{ collected?: Array<{ artifactId: string; path: string; sha256?: string }>; [k: string]: unknown }>(manifestPath);
        const pack = readJson<ResearchPack>(packPath);
        if (!pack.proofArtifacts.some((a) => a.id === artifactId)) {
          console.error(`unknown proof artifact '${artifactId}'`);
          process.exit(2);
        }
        const collected = (manifest.collected ?? []).filter((a) => a.artifactId !== artifactId);
        collected.push({ artifactId, path: artifactPath, ...(sha ? { sha256: sha } : {}) });
        manifest.collected = collected;
        manifest.status = "collecting";
        for (const artifact of pack.proofArtifacts) {
          if (artifact.id === artifactId) {
            artifact.path = artifactPath;
            if (sha) artifact.sha256 = sha;
          }
        }
        writeJson(manifestPath, manifest);
        writeJson(packPath, pack);
        console.log(JSON.stringify({ run: absRun, collected }, jbig, 2));
        process.exit(0);
      }
      if (sub === "verdict" || sub === "verify") {
        const runDir = flag(rest, "--run");
        if (!runDir) {
          console.error(`proof ${sub} --run <dir>`);
          process.exit(2);
        }
        const absRun = resolve(runDir);
        const pack = readJson<ResearchPack>(join(absRun, "research-spine.json"));
        const verdict = verifyResearchPack(pack, { requireProofArtifactPaths: true });
        const missingPaths = pack.proofArtifacts
          .filter((a) => a.required && a.path && !existsSync(resolve(absRun, a.path)))
          .map((a) => `${a.id}:${a.path}`);
        for (const missing of missingPaths) verdict.errors.push(`proof artifact path does not exist: ${missing}`);
        for (const artifact of pack.proofArtifacts) {
          for (const error of validateProofArtifactFile(absRun, artifact)) verdict.errors.push(error);
        }
        verdict.ok = verdict.errors.length === 0;
        writeJson(join(absRun, "proof-verdict.json"), verdict);
        console.log(JSON.stringify({ run: absRun, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "full-init") {
        const goal = flag(rest, "--goal");
        const deployedUrl = flag(rest, "--deployed-url");
        if (!goal || !deployedUrl) {
          console.error("proof full-init --goal <g> --deployed-url <url> [--out <file>]");
          process.exit(2);
        }
        const pack = makeFullProofPack({ goal, deployedUrl });
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), pack);
        console.log(JSON.stringify(out ? { out: resolve(out), pack } : pack, jbig, 2));
        process.exit(0);
      }
      if (sub === "full-verify") {
        const receiptPath = flag(rest, "--receipt");
        if (!receiptPath) {
          console.error("proof full-verify --receipt <file> [--base <dir>]");
          process.exit(2);
        }
        const abs = resolve(receiptPath);
        const pack = readJson<FullProofPack>(abs);
        const verdict = verifyFullProofPack(pack, { baseDir: flag(rest, "--base") ? resolve(flag(rest, "--base")!) : dirname(abs) });
        console.log(JSON.stringify({ receipt: abs, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "publish") {
        const runDir = flag(rest, "--run");
        if (!runDir) {
          console.error("proof publish --run <dir> [--out <file>]");
          process.exit(2);
        }
        const absRun = resolve(runDir);
        const manifest = readJson<Record<string, unknown>>(join(absRun, "proof-manifest.json"));
        const verdictPath = join(absRun, "proof-verdict.json");
        const verdict = existsSync(verdictPath) ? readJson<Record<string, unknown>>(verdictPath) : { ok: false, missing: true };
        const summary = {
          schemaVersion: 1,
          run: absRun,
          manifest,
          verdict,
          publishable: verdict.ok === true,
          warning: verdict.ok === true ? undefined : "Do not publish a capability claim until proof verdict passes.",
        };
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), summary);
        console.log(JSON.stringify(out ? { out: resolve(out), summary } : summary, jbig, 2));
        process.exit(verdict.ok === true ? 0 : 1);
      }
      console.error("proof: init | start | receipt | collect | verify | verdict | full-init | full-verify | publish");
      process.exit(2);
    }
    case "compare": {
      const sub = rest[0];
      if (sub !== "top3d") {
        console.error("compare top3d [--out <file>]");
        process.exit(2);
      }
      const rubric = top3dComparisonRubric();
      const out = flag(rest, "--out");
      if (out) {
        writeJson(resolve(out), rubric);
        console.log(JSON.stringify({ out: resolve(out), rubric }, jbig, 2));
      } else {
        console.log(JSON.stringify(rubric, jbig, 2));
      }
      process.exit(0);
    }
    case "3d": {
      const sub = rest[0];
      if (sub === "init" || sub === "plan") {
        const goal = flag(rest, "--goal");
        if (!goal) {
          console.error("3d init|plan --goal <g> [--out <file>]");
          process.exit(2);
        }
        const plan = makeThreeDPlan({ goal });
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), plan);
        console.log(JSON.stringify(out ? { out: resolve(out), plan } : plan, jbig, 2));
        process.exit(0);
      }
      if (sub === "verify") {
        const file = flag(rest, "--file");
        if (!file) {
          console.error("3d verify --file <file>");
          process.exit(2);
        }
        const abs = resolve(file);
        const plan = readJson<ThreeDPlan>(abs);
        const verdict = verifyThreeDPlan(plan);
        console.log(JSON.stringify({ file: abs, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "compare") {
        const rubric = makeThreeDComparatorRubric();
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), rubric);
        console.log(JSON.stringify(out ? { out: resolve(out), rubric } : rubric, jbig, 2));
        process.exit(0);
      }
      if (sub === "quality-plan" || sub === "asset-quality-plan") {
        const goal = flag(rest, "--goal");
        if (!goal) {
          console.error("3d quality-plan --goal <g> [--target viewer|game|cad|character|scene|marketplace] [--claim personal-research-scaffold|prototype|industry-grade] [--industry-grade] [--out <file>]");
          process.exit(2);
        }
        const plan = makeThreeDAssetQualityPlan({
          goal,
          target: parseThreeDAssetTarget(flag(rest, "--target", "viewer")),
          claimLevel: parseThreeDAssetClaimLevel(rest),
        });
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), plan);
        console.log(JSON.stringify(out ? { out: resolve(out), plan } : plan, jbig, 2));
        process.exit(0);
      }
      if (sub === "quality-verify" || sub === "asset-quality-verify") {
        const receiptPath = flag(rest, "--receipt");
        if (!receiptPath) {
          console.error("3d quality-verify --receipt <file> [--base <dir>]");
          process.exit(2);
        }
        const abs = resolve(receiptPath);
        const receipt = readJson<ThreeDAssetQualityReceipt>(abs);
        const verdict = verifyThreeDAssetQualityReceipt(receipt, { baseDir: flag(rest, "--base") ? resolve(flag(rest, "--base")!) : dirname(abs) });
        console.log(JSON.stringify({ receipt: abs, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "make-asset" || sub === "asset-make") {
        const goal = flag(rest, "--goal");
        const projectId = flag(rest, "--project-id");
        const outDir = flag(rest, "--out-dir");
        if (!goal || !projectId || !outDir) {
          console.error("3d make-asset --goal <g> --project-id <id> --out-dir <dir> [--functional-spec <file>] [--deconstruction-receipt <file>]");
          process.exit(2);
        }
        const functionalSpecPath = flag(rest, "--functional-spec");
        const receiptPath = flag(rest, "--deconstruction-receipt");
        let functionalSpec = functionalSpecPath ? readFileSync(resolve(functionalSpecPath), "utf8") : undefined;
        if (!functionalSpec && receiptPath) {
          const receipt = readJson<FirstPrinciplesDeconstructionReceipt>(resolve(receiptPath));
          const verdict = verifyFirstPrinciplesDeconstructionReceipt(receipt);
          if (!verdict.ok) {
            console.error(JSON.stringify({ receipt: resolve(receiptPath), verdict }, jbig, 2));
            process.exit(1);
          }
          functionalSpec = receipt.functionalSpec.content;
        }
        const manifest = makeResearchOnlyAsset({
          goal,
          projectId,
          outputDir: resolve(outDir),
          functionalSpec,
          deconstructionReceiptPath: receiptPath ? resolve(receiptPath) : undefined,
        });
        const manifestPath = resolve(outDir, `${manifest.assetId}.manifest.json`);
        console.log(JSON.stringify({ manifestPath, manifest }, jbig, 2));
        process.exit(0);
      }
      if (sub === "verify-asset" || sub === "asset-verify") {
        const manifestPath = flag(rest, "--manifest");
        if (!manifestPath) {
          console.error("3d verify-asset --manifest <file> [--base <dir>]");
          process.exit(2);
        }
        const abs = resolve(manifestPath);
        const manifest = readJson<ResearchAssetManifest>(abs);
        const verdict = verifyResearchAssetManifest(manifest, { baseDir: flag(rest, "--base") ? resolve(flag(rest, "--base")!) : dirname(abs) });
        console.log(JSON.stringify({ manifest: abs, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      console.error("3d: init|plan --goal <g> [--out <file>] | verify --file <file> | compare [--out <file>] | quality-plan --goal <g> [--target <target>] [--claim <level>] [--out <file>] | quality-verify --receipt <file> [--base <dir>] | make-asset --goal <g> --project-id <id> --out-dir <dir> [--functional-spec <file>] [--deconstruction-receipt <file>] | verify-asset --manifest <file> [--base <dir>]");
      process.exit(2);
    }
    case "engineering": {
      const sub = rest[0];
      if (sub === "plan" || sub === "init") {
        const goal = flag(rest, "--goal");
        if (!goal) {
          console.error("engineering plan --goal <g> [--risk low|material_damage|safety_critical|medical_or_life_support] [--urgency routine|urgent|emergency] [--out <file>]");
          process.exit(2);
        }
        const rawRisk = flag(rest, "--risk", "safety_critical");
        const rawUrgency = flag(rest, "--urgency", "urgent");
        if (!engineeringRiskLevels.includes(rawRisk as EngineeringRiskLevel)) {
          console.error(`unsupported --risk '${rawRisk}' (expected ${engineeringRiskLevels.join(", ")})`);
          process.exit(2);
        }
        if (!engineeringUrgencies.includes(rawUrgency as EngineeringUrgency)) {
          console.error(`unsupported --urgency '${rawUrgency}' (expected ${engineeringUrgencies.join(", ")})`);
          process.exit(2);
        }
        const plan = makeEngineeringInventionHarness({
          goal,
          riskLevel: rawRisk as EngineeringRiskLevel,
          urgency: rawUrgency as EngineeringUrgency,
        });
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), plan);
        console.log(JSON.stringify(out ? { out: resolve(out), plan } : plan, jbig, 2));
        process.exit(0);
      }
      if (sub === "verify") {
        const file = flag(rest, "--file");
        if (!file) {
          console.error("engineering verify --file <file>");
          process.exit(2);
        }
        const abs = resolve(file);
        const plan = readJson<EngineeringInventionHarness>(abs);
        const verdict = verifyEngineeringInventionHarness(plan);
        console.log(JSON.stringify({ file: abs, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "deconstruct-init" || sub === "receipt-init") {
        const goal = flag(rest, "--goal");
        const projectId = flag(rest, "--project-id");
        if (!goal || !projectId) {
          console.error("engineering deconstruct-init --goal <g> --project-id <id> [--source <text>] [--out <file>]");
          process.exit(2);
        }
        const receipt = makeFirstPrinciplesDeconstructionReceipt({
          goal,
          projectId,
          sourceDescription: flag(rest, "--source"),
        });
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), receipt);
        console.log(JSON.stringify(out ? { out: resolve(out), receipt } : receipt, jbig, 2));
        process.exit(0);
      }
      if (sub === "deconstruct-verify" || sub === "receipt-verify") {
        const file = flag(rest, "--file");
        if (!file) {
          console.error("engineering deconstruct-verify --file <file>");
          process.exit(2);
        }
        const abs = resolve(file);
        const receipt = readJson<FirstPrinciplesDeconstructionReceipt>(abs);
        const verdict = verifyFirstPrinciplesDeconstructionReceipt(receipt);
        console.log(JSON.stringify({ file: abs, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      console.error("engineering: plan --goal <g> [--risk <level>] [--urgency <level>] [--out <file>] | verify --file <file> | deconstruct-init --goal <g> --project-id <id> [--source <text>] [--out <file>] | deconstruct-verify --file <file>");
      process.exit(2);
    }
    case "fresh-user": {
      const sub = rest[0];
      if (sub === "init") {
        const caseId = flag(rest, "--case");
        const userPrompt = flag(rest, "--prompt");
        if (!caseId || !userPrompt) {
          console.error("fresh-user init --case <id> --prompt <p> [--github <url>] [--out <file>]");
          process.exit(2);
        }
        const plan = makeFreshUserEmulationPlan({ caseId, userPrompt, githubUrl: flag(rest, "--github") });
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), plan);
        console.log(JSON.stringify(out ? { out: resolve(out), plan } : plan, jbig, 2));
        process.exit(0);
      }
      if (sub === "verify") {
        const receiptPath = flag(rest, "--receipt");
        if (!receiptPath) {
          console.error("fresh-user verify --receipt <file> [--base <dir>]");
          process.exit(2);
        }
        const abs = resolve(receiptPath);
        const receipt = readJson<FreshUserEmulationReceipt>(abs);
        const verdict = verifyFreshUserEmulationReceipt(receipt, { baseDir: flag(rest, "--base") ? resolve(flag(rest, "--base")!) : dirname(abs) });
        console.log(JSON.stringify({ receipt: abs, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      console.error("fresh-user: init --case <id> --prompt <p> [--github <url>] [--out <file>] | verify --receipt <file> [--base <dir>]");
      process.exit(2);
    }
    case "trust": {
      const sub = rest[0];
      if (sub === "init") {
        const runId = flag(rest, "--run");
        const verifierCommand = flag(rest, "--verifier");
        if (!runId || !verifierCommand) {
          console.error("trust init --run <id> --verifier <cmd> [--signed <path>] [--out <file>]");
          process.exit(2);
        }
        const receipt = makeTrustRootReceipt({ runId, verifierCommand, signedArtifacts: flags(rest, "--signed") });
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), receipt);
        console.log(JSON.stringify(out ? { out: resolve(out), receipt } : receipt, jbig, 2));
        process.exit(0);
      }
      if (sub === "verify") {
        const receiptPath = flag(rest, "--receipt");
        if (!receiptPath) {
          console.error("trust verify --receipt <file>");
          process.exit(2);
        }
        const abs = resolve(receiptPath);
        const receipt = readJson<TrustRootReceipt>(abs);
        const verdict = verifyTrustRootReceipt(receipt);
        console.log(JSON.stringify({ receipt: abs, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      console.error("trust: init --run <id> --verifier <cmd> [--signed <path>] [--out <file>] | verify --receipt <file>");
      process.exit(2);
    }
    case "agent": {
      const sub = rest[0];
      if (sub === "list") {
        console.log(JSON.stringify(agentHostMatrix(), jbig, 2));
        process.exit(0);
      }
      if (sub === "matrix") {
        if (rest.includes("--json")) console.log(JSON.stringify(agentHostMatrix(), jbig, 2));
        else console.log(formatAgentMatrix());
        process.exit(0);
      }
      if (sub === "install-hooks") {
        const target = parseHookTarget(flag(rest, "--target", "generic"));
        const projectPath = resolve(flag(rest, "--project", ".")!);
        const dryRun = rest.includes("--dry-run");
        const result = dryRun
          ? { ...makeHookInstallPlan(target), dryRun: true, writtenFiles: [] as string[] }
          : writeHookInstallPlan(projectPath, target, { dryRun: false });
        console.log(JSON.stringify({ projectPath, result }, jbig, 2));
        process.exit(0);
      }
      if (sub === "run") {
        const host = flag(rest, "--host");
        const goal = flag(rest, "--goal");
        if (!host || !goal) {
          console.error("agent run --host <host> --goal <g> [--project <path>] [--command <cmd>] [--execute]");
          process.exit(2);
        }
        const projectPath = resolve(flag(rest, "--project", ".")!);
        const receipt = makeAgentRunReceipt({
          projectPath,
          host,
          goal,
          command: flag(rest, "--command"),
          dryRun: !rest.includes("--execute"),
        });
        const out = writeReceipt(projectPath, ".solo/receipts/agent-run-receipt.json", receipt);
        recordSoloEvent(projectPath, {
          event: "session.start",
          agentHost: host,
          status: "started",
          message: goal,
          receiptPath: out,
          source: "sfn-agent-run",
        });
        console.log(JSON.stringify({ out, receipt }, jbig, 2));
        process.exit(0);
      }
      if (sub === "fanout") {
        const hosts = csvFlags(rest, "--host");
        const goal = flag(rest, "--goal");
        const projectPath = resolve(flag(rest, "--project", ".")!);
        if (hosts.length === 0 || !goal) {
          console.error("agent fanout --host <h1,h2> --goal <g> [--project <path>] [--out <file>]");
          process.exit(2);
        }
        const receipts = hosts.map((host) => makeAgentRunReceipt({ projectPath, host, goal, dryRun: true }));
        const payload = {
          schemaVersion: 1,
          goal,
          hosts,
          receipts,
          status: "planned",
          warning: "Fanout plans do not count as proof. Collect receipts from each host and verify live UI proof.",
        };
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), payload);
        console.log(JSON.stringify(out ? { out: resolve(out), payload } : payload, jbig, 2));
        process.exit(0);
      }
      if (sub === "collect") {
        const projectPath = resolve(flag(rest, "--project", ".")!);
        const limit = Number(flag(rest, "--limit", "100"));
        const events = readSoloEventLog(projectPath, limit);
        const receiptEvents = events.filter((event) => event.event === "receipt.write" || event.kind === "receipt");
        const payload = {
          projectPath,
          eventCount: events.length,
          receiptEventCount: receiptEvents.length,
          proofVerdict: doctorRalphLoop(projectPath).proofVerdict,
          selfReportWarning: "Telemetry is not proof. A passing proof verdict or fresh-room receipt is required.",
          events,
        };
        console.log(JSON.stringify(payload, jbig, 2));
        process.exit(0);
      }
      console.error("agent: list | matrix | install-hooks | run | fanout | collect");
      process.exit(2);
    }
    case "agents": {
      const sub = rest[0];
      if (sub === "openrouter-audit") {
        const catalogFile = flag(rest, "--catalog");
        const maxCandidates = Number(flag(rest, "--max", "20"));
        const catalog = catalogFile
          ? readJson<{ data?: unknown[] }>(resolve(catalogFile))
          : await fetchOpenRouterCatalog();
        const audit = rankOpenRouterModelsFromCatalog(catalog as { data?: never[] }, { maxCandidates });
        const out = flag(rest, "--out");
        if (out) {
          writeJson(resolve(out), audit);
          console.log(JSON.stringify({ out: resolve(out), audit }, jbig, 2));
        } else {
          console.log(JSON.stringify(audit, jbig, 2));
        }
        process.exit(0);
      }
      if (sub !== "openrouter-plan") {
        console.error("agents openrouter-plan [--out <dir>] [--host-root <path>] [--audit <file>] | agents openrouter-audit [--catalog <file>] [--out <file>] [--max <n>]");
        process.exit(2);
      }
      const auditFile = flag(rest, "--audit");
      const modelAudit = auditFile ? readJson<OpenRouterModelAudit>(resolve(auditFile)) : undefined;
      const pack = makeOpenRouterAgentSetupPack({ hostRoot: flag(rest, "--host-root"), modelAudit });
      const verdict = verifyOpenRouterAgentSetupPack(pack);
      if (!verdict.ok) {
        console.error(JSON.stringify({ ok: false, errors: verdict.errors }, null, 2));
        process.exit(1);
      }
      const out = flag(rest, "--out");
      if (out) {
        const absOut = resolve(out);
        writeOpenRouterAgentSetupPack(absOut, pack);
        console.log(JSON.stringify({ out: absOut, pack }, jbig, 2));
      } else {
        console.log(JSON.stringify(pack, jbig, 2));
      }
      process.exit(0);
    }
    case "design": {
      const sub = rest[0];
      if (sub === "registry") {
        const registry = designSkillRegistry();
        const out = flag(rest, "--out");
        if (out) {
          writeJson(resolve(out), registry);
          console.log(JSON.stringify({ out: resolve(out), registry }, jbig, 2));
        } else {
          console.log(JSON.stringify(registry, jbig, 2));
        }
        process.exit(0);
      }
      if (sub === "recommend") {
        const surfaceKind = parseSurfaceKind(flag(rest, "--surface", "saas-app"));
        const runtime = parseDesignRuntime(flag(rest, "--runtime", "generic-agent"));
        const targetPlatform = parseTargetPlatform(flag(rest, "--platform", "web"));
        const plan = recommendDesignSkills({
          surfaceKind,
          runtime,
          stack: flag(rest, "--stack", ""),
          needsAnimation: rest.includes("--animation"),
          needsVisualContent: rest.includes("--visuals"),
          needsMobileNative: rest.includes("--mobile"),
          usesShadcn: rest.includes("--shadcn"),
          usesShadcnMcp: rest.includes("--shadcn-mcp"),
          stylePreset: parseStylePreset(flag(rest, "--style")),
          targetPlatform,
        });
        const verdict = verifyDesignSkillPlan(plan);
        const payload = { plan, verdict };
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), payload);
        console.log(JSON.stringify(out ? { out: resolve(out), ...payload } : payload, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "flow") {
        const surfaceKind = parseSurfaceKind(flag(rest, "--surface", "saas-app"));
        const runtime = parseDesignRuntime(flag(rest, "--runtime", "generic-agent"));
        const targetPlatform = parseTargetPlatform(flag(rest, "--platform", "web"));
        const plan = makeDesignFullFlow({
          surfaceKind,
          runtime,
          stack: flag(rest, "--stack", ""),
          productCategory: flag(rest, "--category"),
          needsAnimation: rest.includes("--animation"),
          needsVisualContent: rest.includes("--visuals"),
          needsMobileNative: rest.includes("--mobile"),
          usesShadcn: rest.includes("--shadcn"),
          usesShadcnMcp: rest.includes("--shadcn-mcp"),
          stylePreset: parseStylePreset(flag(rest, "--style")),
          targetPlatform,
        });
        const verdict = verifyDesignFullFlow(plan);
        const payload = { plan, verdict };
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), payload);
        console.log(JSON.stringify(out ? { out: resolve(out), ...payload } : payload, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "compare") {
        const rubric = top3dComparisonRubric();
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), rubric);
        console.log(JSON.stringify(out ? { out: resolve(out), rubric } : rubric, jbig, 2));
        process.exit(0);
      }
      if (sub === "gate" || sub === "receipt") {
        const surfaceKind = parseSurfaceKind(flag(rest, "--surface", "saas-app"));
        const selectedSkillIds = csvFlags(rest, "--skill");
        const completedCriteria = csvFlags(rest, "--completed") as DesignQualityCriterion[];
        if (selectedSkillIds.length === 0 || completedCriteria.length === 0) {
          console.error(`design ${sub} --surface <kind> --skill <id> --completed <csv> --desktop <path> --mobile <path> --brief <path> --contract <path> --interaction <path> --a11y <path> [--primary <kind>] [--out <file>]`);
          process.exit(2);
        }
        const receipt = makeDesignQualityReceipt({
          surfaceKind,
          selectedSkillIds,
          completedCriteria,
          desktopScreenshotPaths: flags(rest, "--desktop"),
          mobileScreenshotPaths: flags(rest, "--mobile"),
          designBriefPath: flag(rest, "--brief"),
          componentContractPath: flag(rest, "--contract"),
          interactionProofPaths: flags(rest, "--interaction"),
          accessibilityProofPaths: flags(rest, "--a11y"),
          primarySurface: flag(rest, "--primary", "unspecified"),
          visualVerdict: parseDesignVisualVerdict(flag(rest, "--verdict", "not-run")),
          qualityBar: parseDesignQualityBar(flag(rest, "--quality", "prototype")),
          notes: flags(rest, "--note"),
        });
        const verdict = verifyDesignQualityReceipt(receipt);
        const payload = { receipt, verdict };
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), payload);
        console.log(JSON.stringify(out ? { out: resolve(out), ...payload } : payload, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      console.error("design: registry | recommend | flow | gate | receipt | compare");
      process.exit(2);
    }
    case "chat-ux":
    case "agent-chat": {
      const sub = rest[0];
      if (sub === "sources") {
        const sources = agentChatUxInspirationSources();
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), sources);
        console.log(JSON.stringify(out ? { out: resolve(out), sources } : sources, jbig, 2));
        process.exit(0);
      }
      if (sub === "plan") {
        const goal = flag(rest, "--goal");
        if (!goal) {
          console.error("chat-ux plan --goal <g> [--surface <kind>] [--category <c>] [--model-compare] [--deployment] [--out <file>]");
          process.exit(2);
        }
        const plan = makeAgentChatUxPlan({
          goal,
          surfaceKind: parseAgentChatSurfaceKind(flag(rest, "--surface", "generic-agent-app")),
          productCategory: flag(rest, "--category"),
          needsModelComparison: rest.includes("--model-compare"),
          needsDeploymentHandoff: rest.includes("--deployment"),
        });
        const verdict = verifyAgentChatUxPlan(plan);
        const payload = { plan, verdict };
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), payload);
        console.log(JSON.stringify(out ? { out: resolve(out), ...payload } : payload, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      if (sub === "verify") {
        const receiptPath = flag(rest, "--receipt");
        if (!receiptPath) {
          console.error("chat-ux verify --receipt <file>");
          process.exit(2);
        }
        const abs = resolve(receiptPath);
        const receipt = readJson<AgentChatUxReceipt>(abs);
        receipt.completedCapabilities = parseAgentChatCapabilities(receipt.completedCapabilities);
        const verdict = verifyAgentChatUxReceipt(receipt);
        console.log(JSON.stringify({ receipt: abs, verdict }, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      console.error("chat-ux: sources | plan | verify");
      process.exit(2);
    }
    case "gstack": {
      const sub = rest[0];
      if (sub === "registry") {
        const registry = gstackRoleRegistry();
        const out = flag(rest, "--out");
        if (out) {
          writeJson(resolve(out), registry);
          console.log(JSON.stringify({ out: resolve(out), registry }, jbig, 2));
        } else {
          console.log(JSON.stringify(registry, jbig, 2));
        }
        process.exit(0);
      }
      if (sub === "recommend") {
        const goal = flag(rest, "--goal");
        if (!goal) {
          console.error("gstack recommend --phase <p> --goal <g> [--surface <s>] [--risk low|medium|high] [--ui] [--deploy] [--security] [--devex] [--docs] [--perf] [--mobile] [--out <file>]");
          process.exit(2);
        }
        const plan = recommendGstackLanes({
          phase: parseSoloPhase(flag(rest, "--phase", "build")),
          goal,
          surfaceKind: flag(rest, "--surface", "unspecified"),
          risk: parseGstackRisk(flag(rest, "--risk", "medium")),
          hasUi: rest.includes("--ui"),
          hasDeployment: rest.includes("--deploy"),
          hasSecurityBoundary: rest.includes("--security"),
          needsDevex: rest.includes("--devex"),
          needsDocs: rest.includes("--docs"),
          needsPerformance: rest.includes("--perf"),
          needsMobile: rest.includes("--mobile"),
        });
        const verdict = verifyGstackPlan(plan);
        const payload = { plan, verdict };
        const out = flag(rest, "--out");
        if (out) writeJson(resolve(out), payload);
        console.log(JSON.stringify(out ? { out: resolve(out), ...payload } : payload, jbig, 2));
        process.exit(verdict.ok ? 0 : 1);
      }
      console.error("gstack: registry | recommend");
      process.exit(2);
    }
    case "seal": {
      const saltIdx = rest.indexOf("--salt");
      const salt = saltIdx >= 0 ? rest[saltIdx + 1] : process.env.SOLO_LEDGER_SALT;
      const ids = rest.filter((a, i) => !a.startsWith("--") && i !== saltIdx + 1);
      if (!salt) {
        console.error("seal: provide --salt <salt> (or SOLO_LEDGER_SALT). The salt must live OUT of the agent's reach (CI / a secret).");
        process.exit(2);
      }
      if (ids.length === 0) {
        console.error("seal: provide held-out task ids — e.g. sfn seal --salt <s> t1 t2 t3");
        process.exit(2);
      }
      const ledger = new SoloLedger({ salt });
      await ledger.init();
      const hash = await ledger.sealHeldOut(ids);
      console.log(`sealed ${ids.length} held-out task(s) · manifest HMAC ${hash}`);
      process.exit(0);
    }
    case "ledger": {
      const sub = rest[0];
      const ledger = new SoloLedger({ salt: process.env.SOLO_LEDGER_SALT ?? "dev-salt-change-me" });
      await ledger.init();
      if (sub === "list") {
        console.log(JSON.stringify(await ledger.listRuns(), jbig, 2));
        process.exit(0);
      }
      if (sub === "verify") {
        if (!rest[1]) { console.error("ledger verify <runId>"); process.exit(2); }
        const v = await ledger.verifyChain(rest[1]);
        console.log(JSON.stringify(v, jbig));
        process.exit(v.ok ? 0 : 1);
      }
      console.error("ledger: list | verify <runId>");
      process.exit(2);
    }
    default:
      console.log(HELP);
      process.exit(cmd && cmd !== "help" ? 1 : 0);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
