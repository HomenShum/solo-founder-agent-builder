// Turnkey proof of the local substrates. Run: npm i && npm run smoke
// Every S-mechanism is a pass/fail assertion; the process exits non-zero if any fails.
import { createClient } from "@libsql/client";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { SoloLedger } from "./ledger/ledger";
import { SoloMemory } from "./memory/localMemory";
import { sealGold, contentGate } from "./ledger/contentGate";
import { sha256 } from "./ledger/hash";
import { inspectGraphContext, graphQueryPlan } from "./context/graphContext";
import { SoloControlPlane, loopPhases } from "./control/controlPlane";
import { make3dAgentResearchPack, top3dComparisonRubric, verifyResearchPack, type ResearchPack } from "./research/researchSpine";
import { classifyResearchSource, makeResearchBrief, verifyResearchBrief } from "./research/researchGovernor";
import { makeSystemMapGraph, renderSystemMapMermaid, validateSystemMapGraph, writeSystemMapGraph } from "./architecture/architectureGovernor";
import {
  directionChangedByText,
  directionPaths,
  makeDirectionChangeReceipt,
  makeDirectionDecision,
  makeDirectionIntake,
  makeDirectionProposal,
  verifyDirectionChangeReceipt,
  verifyDirectionProposal,
} from "./direction/directionRalph";
import { designSkillRegistry, makeDesignFullFlow, recommendDesignSkills, verifyDesignFullFlow, verifyDesignSkillPlan, type DesignFullFlowPlan } from "./design/designSkillBridge";
import { defaultDesignQualityCriteria, makeDesignQualityReceipt, verifyDesignQualityReceipt, type DesignQualityGateInput } from "./design/designQualityGate";
import {
  agentChatUxInspirationSources,
  agentChatUxSurfaces,
  makeAgentChatUxPlan,
  requiredAgentChatUxCapabilities,
  requiredAgentChatUxDomSignals,
  verifyAgentChatUxPlan,
  verifyAgentChatUxReceipt,
  type AgentChatUxReceipt,
} from "./design/agentChatUxGate";
import { gstackRoleRegistry, recommendGstackLanes, verifyGstackPlan, type GstackReviewPlan } from "./gstack/gstackBridge";
import { defaultDeterministicPrework, makeExternalSetupGateReceipt, verifyExternalSetupGateReceipt } from "./setup/externalSetupGate";
import { makeOpenRouterAgentSetupPack, rankOpenRouterModelsFromCatalog, verifyOpenRouterAgentSetupPack } from "./setup/openrouterAgentHosts";
import { makeAgentApiContractMarkdown, makeAgentReadyToolContract, verifyAgentReadyToolContract, type AgentReadyToolContract } from "./agentApi/agentReadyApi";
import { makeLoopRunReceipt, verifyLoopRunReceipt, type LoopRunReceipt } from "./loop/loopRunner";
import {
  assertLoopPhase,
  completePhaseRalphReceipt,
  makePhaseFailureRouteReceipt,
  phaseRalphGates,
  verifyPhaseRalph,
} from "./phase/phaseRalph";
import {
  intentRalphStages,
  makeIntentRalphReceipt,
  verifyIntentRalphReceipt,
} from "./intent/intentRalph";
import { makeIdeaTweakReceipt, verifyIdeaTweakReceipt } from "./tweaks/ideaTweak";
import {
  componentLedgerPath,
  componentRalphStages,
  decomposeComponentsFromText,
  makeComponentRalphLedger,
  markComponentStage,
  verifyComponentRalphLedger,
} from "./component-ralph/componentRalphRunner";
import { judgeComponentLayer } from "./component-ralph/componentJudge";
import { makeThreeDComparatorRubric, makeThreeDPlan, verifyThreeDPlan } from "./threeD/threeDLoop";
import { makeThreeDAssetQualityPlan, verifyThreeDAssetQualityReceipt, type ThreeDAssetQualityReceipt } from "./threeD/assetQualityGate";
import {
  makeThreeDPartResearchRalphReceipt,
  partResearchRalphStages,
  verifyThreeDPartResearchRalphReceipt,
} from "./threeD/partResearchRalph";
import { makeResearchOnlyAsset, verifyResearchAssetManifest } from "./threeD/researchAssetMaker";
import { makeEngineeringInventionHarness, verifyEngineeringInventionHarness } from "./engineering/engineeringInventionHarness";
import { makeFirstPrinciplesDeconstructionReceipt, verifyFirstPrinciplesDeconstructionReceipt } from "./engineering/firstPrinciplesDeconstructionReceipt";
import { makeFullProofPack, verifyFullProofPack } from "./proof/fullProofPack";
import { makeFreshUserEmulationPlan, verifyFreshUserEmulationReceipt, type FreshUserEmulationReceipt } from "./freshUser/freshUserEmulation";
import { makeTrustRootReceipt, verifyTrustRootReceipt } from "./trust/trustRoot";
import { makeDashboardSnapshot, renderDashboard } from "./dashboard/dashboard";
import { formatAgentMatrix, makeAgentMatrixRows, makeHookInstallPlan, readSoloEvents, recordSoloEvent } from "./events/soloEventBus";
import { judgeCurrentLoop } from "./judge/freshContextJudge";
import {
  completeRalphMilestone,
  createRalphLedger,
  doctorRalphLoop,
  pauseRalphLoop,
  ralphPaths,
  startRalphMilestone,
  verifyRalphMilestone,
} from "./loop/ralphLedger";
import { verifyFreshRoomProofReceipt, type FreshRoomProofReceipt } from "./proof/freshRoomReceipt";
import { makeReworkLedger, verifyReworkLedger, type ReworkLedger } from "./rework/reworkLedger";

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}${detail ? " — " + detail : ""}`);
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

async function main() {
  console.log("\n=== Solo Founder Nodes — local substrate smoke ===\n");

  // ---------------- SoloLedger: derive-don't-accept ----------------
  console.log("SoloLedger (S9/S12/S14/S16 enforced; S10/S11/S15 wired):");
  const dbFile = join(tmpdir(), `solo-smoke-ledger-${process.pid}-${Date.now()}.db`);
  const ledger = new SoloLedger({ dbUrl: `file:${dbFile}`, salt: "smoke-salt" });
  await ledger.init();

  // S12 — tuned first, then seal a DISJOINT held-out manifest
  await ledger.markTuned(["t-tuned"]);
  const manifest = await ledger.sealHeldOut(["t1", "t2", "t3", "t4", "t5", "vt1"]);
  check("S12 sealed held-out manifest (HMAC)", /^[0-9a-f]{64}$/.test(manifest));
  let sealThrew = false;
  try {
    await ledger.sealHeldOut(["t-tuned"]);
  } catch {
    sealThrew = true;
  }
  check("S12 refuses to seal a tuned task as held-out", sealThrew);

  const { runId, nonce } = await ledger.startRun({
    iterationLabel: "smoke-iter",
    benchmark: "demo",
    model: "demo-model",
    materializerMode: "generic-only",
  });

  // a writer receipt tied to the actual deliverable bytes (S10)
  const deliv = (leaf: string, bytes: string) => {
    const h = sha256(bytes);
    return { writer: { firedWriterLeaf: leaf, deliverableHash: h }, deliverableHash: h };
  };

  // (a) HONEST: generic writer + model-in-loop + valid nonce + held-out
  const a = await ledger.recordTask(runId, { taskId: "t1", reward: 0.42, ...deliv("write_general", "t1 bytes"), transport: { tokensUsed: 4200, nonce }, claimedClean: true });
  check("S9 honest generic + model-in-loop + held-out COUNTS", a.counts === true, a.reasons.join(","));

  // (b) FAMILY writer but agent CLAIMS clean -> derived false -> disagreement -> quarantined
  const b = await ledger.recordTask(runId, { taskId: "t2", reward: 0.97, ...deliv("write_comcast_package", "t2 bytes"), transport: { tokensUsed: 50, nonce }, claimedClean: true });
  check("S10 family-writer excluded despite 0.97 reward", b.counts === false && b.reasons.some((r) => r.startsWith("non-generic-writer")));
  check("S9 quarantines agent-claim vs derived disagreement", b.quarantined === true);

  // (c) MODEL-OFF
  const c = await ledger.recordTask(runId, { taskId: "t3", reward: 0.40, ...deliv("write_general", "t3 bytes"), transport: { tokensUsed: 0, nonce }, claimedClean: true });
  check("S11 model-off (0 tokens) excluded", c.counts === false && c.reasons.includes("model-off"));

  // (d) FORGED transport nonce
  const d = await ledger.recordTask(runId, { taskId: "t4", reward: 0.41, ...deliv("write_general", "t4 bytes"), transport: { tokensUsed: 9999, nonce: "forged" }, claimedClean: true });
  check("S11 forged transport nonce excluded", d.counts === false && d.reasons.includes("unsigned-transport"));

  // (e) MEMORY-LEAK taint
  const e = await ledger.recordTask(runId, { taskId: "t5", reward: 0.55, ...deliv("write_general", "t5 bytes"), transport: { tokensUsed: 3000, nonce }, recalledMemoryLeak: true, claimedClean: true });
  check("S14 memory-leak taint excludes the row", e.counts === false && e.reasons.includes("memory-leak"));

  // (f) TUNED-REUSE
  const f = await ledger.recordTask(runId, { taskId: "t-tuned", reward: 0.99, ...deliv("write_general", "tuned bytes"), transport: { tokensUsed: 3000, nonce }, claimedClean: true });
  check("S12 tuned-task-reuse excluded", f.counts === false && (f.reasons.includes("tuned-task-reuse") || f.reasons.includes("not-held-out")));

  // headline = mean over the clean row ONLY (just t1)
  const fin = await ledger.finishRun(runId);
  check("S6/S9 headline counts ONLY the clean row", fin.headlineN === 1 && Math.abs((fin.headlineMean ?? -1) - 0.42) < 1e-9, `mean=${fin.headlineMean} n=${fin.headlineN}`);

  // S16 — chain verifies, then an out-of-band tamper breaks it
  check("S16 hash-chain verifies (clean)", (await ledger.verifyChain(runId)).ok === true);
  const raw = createClient({ url: `file:${dbFile}` });
  await raw.execute({ sql: `UPDATE ledger_tasks SET reward = 9.99 WHERE run_id = ? AND task_id = 't1'`, args: [runId] });
  const tampered = await ledger.verifyChain(runId);
  check("S16 DETECTS out-of-band tampering (chain breaks)", tampered.ok === false, JSON.stringify(tampered));

  // ---------------- S15 independent verifier ----------------
  console.log("\nSoloLedger S15 (independent refute-by-default verifier):");
  const r2 = await ledger.startRun({ iterationLabel: "verifier-iter", benchmark: "demo", materializerMode: "generic-only" });
  const g = await ledger.recordTask(r2.runId, { taskId: "vt1", reward: 0.80, ...deliv("write_general", "vt1 bytes"), transport: { tokensUsed: 5000, nonce: r2.nonce }, claimedClean: true });
  check("clean row counts before the verifier", g.counts === true, g.reasons.join(","));
  const finV = await ledger.finishRun(r2.runId, { verifier: async () => true });
  check("S15 refute-by-default verifier demotes the row", finV.headlineN === 0, `n=${finV.headlineN}`);

  // ---------------- SoloMemory: S13 content gate ----------------
  console.log("\nSoloMemory (S13 content gate — the honor-system label is no longer enough):");
  const goldText = "Project Comcast take-private teaser: TEV 6538.0M, EV/EBITDA 17.0x, COTY 902.90M diluted shares, premium 35%.";
  const sealedGold = sealGold([goldText]);
  const mem = new SoloMemory({ dbUrl: ":memory:", heldOutGuard: (inp) => contentGate(sealedGold, `${inp.summary}\n${inp.content}`) });
  await mem.init();

  let benignOk = false;
  await mem.remember({ projectId: "smoke", phase: "build", kind: "decision", summary: "Use a design brief before any Figma write.", content: "Gate design calls behind a human approval.", benchmarkSafety: "safe" });
  benignOk = true;
  check("S13 benign write accepted", benignOk);

  let goldThrew = false;
  try {
    await mem.remember({ projectId: "smoke", phase: "iterate", kind: "decision", summary: "Methodology note", content: "EV/EBITDA 17.0x, TEV 6538.0M, COTY 902.90M diluted shares, premium 35% — reuse for the next comp.", benchmarkSafety: "safe" });
  } catch {
    goldThrew = true;
  }
  check("S13 rejects laundered held-out gold despite 'safe' label", goldThrew);

  let labelThrew = false;
  try {
    await mem.remember({ projectId: "smoke", phase: "iterate", kind: "run_result", summary: "held-out answer", content: "x", benchmarkSafety: "heldout_forbidden" });
  } catch {
    labelThrew = true;
  }
  check("honor-system heldout_forbidden label still rejected", labelThrew);

  await mem.remember({
    projectId: "smoke",
    phase: "iterate",
    kind: "run_result",
    summary: "held-out aggregate score only",
    content: "heldout_n=10 mean=0.42 failure_class=export-missing",
    benchmarkSafety: "aggregate_only",
    metadata: { aggregateOnly: true },
  });
  const aggregateHits = await mem.search({ projectId: "smoke", query: "aggregate score export missing", limit: 3, minScore: 0 });
  check("memory allows aggregate scores with aggregateOnly receipt", aggregateHits.some((hit) => hit.summary.includes("aggregate score")));

  let aggregateMissingMetadataThrew = false;
  try {
    await mem.remember({
      projectId: "smoke",
      phase: "iterate",
      kind: "run_result",
      summary: "aggregate without metadata",
      content: "mean=0.51",
      benchmarkSafety: "aggregate_only",
    });
  } catch {
    aggregateMissingMetadataThrew = true;
  }
  check("memory rejects aggregate_only without metadata.aggregateOnly", aggregateMissingMetadataThrew);

  let secretThrew = false;
  try {
    await mem.remember({
      projectId: "smoke",
      phase: "setup",
      kind: "env_fact",
      summary: "OpenRouter key",
      content: "OPENROUTER_API_KEY=sk-test-1234567890abcdef",
      benchmarkSafety: "safe",
    });
  } catch {
    secretThrew = true;
  }
  check("memory refuses API keys", secretThrew);

  let piiThrew = false;
  try {
    await mem.remember({
      projectId: "smoke",
      phase: "discover",
      kind: "project_fact",
      summary: "founder ssn",
      content: "SSN 123-45-6789",
      benchmarkSafety: "safe",
    });
  } catch {
    piiThrew = true;
  }
  check("memory refuses PII patterns", piiThrew);

  await mem.remember({
    projectId: "smoke",
    phase: "setup",
    kind: "env_fact",
    summary: "redacted local-only provider setup",
    content: "redacted provider setup notes for local operator only",
    benchmarkSafety: "redacted",
    visibility: "local",
  });
  const redactedHits = await mem.search({ projectId: "smoke", query: "redacted provider setup", limit: 5, minScore: 0 });
  check("memory search does not return redacted contents", redactedHits.every((hit) => hit.benchmarkSafety !== "redacted"));

  // ---------------- Graph context: query-first orientation ----------------
  console.log("\nGraphContext (query-first self-orientation):");
  const graphRoot = mkdtempSync(join(tmpdir(), "solo-smoke-graph-"));
  const graphDir = join(graphRoot, "graphify-out");
  mkdirSync(graphDir, { recursive: true });
  writeFileSync(join(graphDir, "GRAPH_REPORT.md"), "# Smoke graph\n\nGod nodes: Composer, Exporter, OfficialScorer\n", "utf8");
  writeFileSync(
    join(graphDir, "graph.json"),
    JSON.stringify({
      nodes: [
        { id: "Composer", community: "ui" },
        { id: "Exporter", community: "ui" },
        { id: "OfficialScorer", community: "eval" },
      ],
      edges: [
        { source: "Composer", target: "Exporter" },
        { source: "Exporter", target: "OfficialScorer" },
      ],
    }),
    "utf8",
  );
  const graphReceipt = inspectGraphContext({ projectRoot: graphRoot });
  check("graph context receipt is ready", graphReceipt.status === "ready", graphReceipt.staleReasons.join(","));
  check("graph context counts nodes and edges", graphReceipt.nodeCount === 3 && graphReceipt.edgeCount === 2);
  const plan = graphQueryPlan("what connects composer to scorer?", graphReceipt);
  check("graph query plan is command-shaped", plan.command.includes("graphify query"));

  // ---------------- External setup gate: finish deterministic work before human credentials ----------------
  console.log("\nExternalSetupGate (no early stop at API-key setup):");
  const incompleteGate = makeExternalSetupGateReceipt({
    goal: "Connect Meshy real 3D generation.",
    provider: "Meshy",
    requiredSecrets: ["MESHY_API_KEY"],
    setupUrls: ["https://www.meshy.ai/api"],
    completedPrework: ["adapter-boundary", "ai-chat-component", "server-side-secret-boundary"],
    resumeCommands: ["npm run build"],
    createdAt: "2026-06-23T00:00:00.000Z",
  });
  const incompleteGateVerdict = verifyExternalSetupGateReceipt(incompleteGate);
  check("credential gate rejects early stop before deterministic prework", incompleteGateVerdict.ok === false && incompleteGateVerdict.errors.some((e) => e.includes("chat-action-protocol")));

  const completeGate = makeExternalSetupGateReceipt({
    goal: "Connect Meshy real 3D generation.",
    provider: "Meshy",
    requiredSecrets: ["MESHY_API_KEY"],
    setupUrls: ["https://www.meshy.ai/api"],
    completedPrework: [...defaultDeterministicPrework],
    resumeCommands: ["vercel env pull .env.local", "npm run build", "npm run test:e2e"],
    createdAt: "2026-06-23T00:00:00.000Z",
  });
  const completeGateVerdict = verifyExternalSetupGateReceipt(completeGate);
  check("credential gate passes only after deterministic prework + resume commands", completeGateVerdict.ok && completeGate.status === "waiting_on_human", completeGateVerdict.errors.join("; "));

  const exposedSecretGate = makeExternalSetupGateReceipt({
    goal: "Connect Meshy real 3D generation.",
    provider: "Meshy",
    requiredSecrets: ["VITE_MESHY_API_KEY"],
    completedPrework: [...defaultDeterministicPrework],
    resumeCommands: ["npm run build"],
  });
  const exposedSecretVerdict = verifyExternalSetupGateReceipt(exposedSecretGate);
  check("credential gate rejects client-exposed provider keys", exposedSecretVerdict.ok === false && exposedSecretVerdict.errors.some((e) => e.includes("server-side only")));

  console.log("\nOpenRouterAgentHosts (optional cheap multi-agent setup):");
  const agentSetup = makeOpenRouterAgentSetupPack({ generatedAt: "2026-06-24T00:00:00.000Z", hostRoot: "D:\\ai-agent-hosts" });
  const agentSetupVerdict = verifyOpenRouterAgentSetupPack(agentSetup);
  check("optional OpenRouter setup verifies", agentSetupVerdict.ok, agentSetupVerdict.errors.join("; "));
  check("model policy selects current cheap paid + coding fallback", agentSetup.environment.SOLO_OPENROUTER_OPENCLAW_MODEL === "deepseek/deepseek-v4-flash" && agentSetup.environment.SOLO_OPENROUTER_HERMES_MODEL === "qwen/qwen3-coder-next");
  check("model policy includes free and multimodal lanes", agentSetup.environment.SOLO_OPENROUTER_FREE_CODE_MODEL === "cohere/north-mini-code:free" && agentSetup.environment.SOLO_OPENROUTER_MULTIMODAL_MODEL === "google/gemini-3.1-flash-lite");
  check("agent setup stays optional", agentSetup.optional === true && agentSetup.safetyRules.some((rule) => rule.includes("optional")));
  check("agent setup does not persist concrete OpenRouter keys", !JSON.stringify(agentSetup).includes("sk-or-") && agentSetup.environment.OPENROUTER_API_KEY.includes("never commit"));
  check("agent setup includes OpenClaw and Hermes conformance commands", agentSetup.verificationCommands.some((cmd) => cmd.includes("openclaw") && cmd.includes("conformance.mjs")) && agentSetup.verificationCommands.some((cmd) => cmd.includes("hermes") && cmd.includes("conformance.mjs")));
  const audit = rankOpenRouterModelsFromCatalog({
    data: [
      {
        id: "expensive/great-code",
        name: "Great Code",
        created: 1780000000,
        description: "agentic coding model",
        context_length: 1048576,
        architecture: { modality: "text->text", input_modalities: ["text"], output_modalities: ["text"] },
        pricing: { prompt: "0.000005", completion: "0.00001" },
        supported_parameters: ["tools", "structured_outputs"],
      },
      {
        id: "cheap/current-code",
        name: "Current Cheap Code",
        created: 1781000000,
        description: "agentic coding model",
        context_length: 262144,
        architecture: { modality: "text->text", input_modalities: ["text"], output_modalities: ["text"] },
        pricing: { prompt: "0.0000001", completion: "0.0000002" },
        supported_parameters: ["tools", "structured_outputs"],
      },
      {
        id: "free/north-mini-code:free",
        name: "North Mini Code free",
        created: 1781700000,
        description: "free agentic coding model",
        context_length: 256000,
        architecture: { modality: "text->text", input_modalities: ["text"], output_modalities: ["text"] },
        pricing: { prompt: "0", completion: "0" },
        supported_parameters: ["tools"],
      },
      {
        id: "google/gemini-flash-lite",
        name: "Gemini Flash Lite",
        created: 1780500000,
        description: "low cost multimodal agent model",
        context_length: 1048576,
        architecture: { modality: "text+image+video->text", input_modalities: ["text", "image", "video"], output_modalities: ["text"] },
        pricing: { prompt: "0.00000025", completion: "0.0000015" },
        supported_parameters: ["tools", "response_format"],
      },
    ],
  }, { generatedAt: "2026-06-24T00:00:00.000Z" });
  check("live catalog audit keeps paid/free/multimodal lanes separate", audit.recommended.paidCode?.id === "cheap/current-code" && audit.recommended.freeCode?.id === "free/north-mini-code:free" && audit.recommended.multimodalUi?.id === "google/gemini-flash-lite");
  check("live catalog audit is marked catalog-only until conformance", audit.warning.includes("Catalog audit only") && audit.warning.includes("conformance"));
  const auditedAgentSetup = makeOpenRouterAgentSetupPack({ generatedAt: "2026-06-24T00:00:00.000Z", hostRoot: "D:\\ai-agent-hosts", modelAudit: audit });
  const auditedAgentSetupVerdict = verifyOpenRouterAgentSetupPack(auditedAgentSetup);
  check("audited OpenRouter setup still verifies", auditedAgentSetupVerdict.ok, auditedAgentSetupVerdict.errors.join("; "));
  check("audited OpenRouter setup exposes catalog recommendations without replacing proved defaults", auditedAgentSetup.environment.SOLO_OPENROUTER_OPENCLAW_MODEL === "deepseek/deepseek-v4-flash" && auditedAgentSetup.environment.SOLO_OPENROUTER_AUDITED_PAID_CODE_MODEL === "cheap/current-code" && auditedAgentSetup.environment.SOLO_OPENROUTER_AUDITED_FREE_CODE_MODEL === "free/north-mini-code:free" && auditedAgentSetup.environment.SOLO_OPENROUTER_AUDITED_MULTIMODAL_MODEL === "google/gemini-flash-lite");

  // ---------------- Agent-ready API: schema + lifecycle + recovery gate ----------------
  console.log("\nAgentReadyApi (tool contracts for model-facing APIs):");
  const writeCellContract = makeAgentReadyToolContract({
    toolName: "write_locked_cell_results",
    purpose: "Write evidence-bearing spreadsheet results after previewing target cells and respecting locks.",
    lifecycle: ["search", "resolve", "preview", "execute", "verify", "recover"],
    requiredArgs: ["ops"],
    inputSchema: {
      type: "object",
      properties: {
        ops: {
          type: "array",
          items: {
            type: "object",
            properties: {
              cellId: { type: "string" },
              value: { type: "string" },
              evidenceRef: { type: "string" },
            },
            required: ["cellId", "value", "evidenceRef"],
          },
        },
      },
      required: ["ops"],
    },
    providerInputSchema: {
      type: "object",
      properties: {
        ops: { type: "array" },
      },
      required: ["ops"],
    },
    outputSchema: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["ok", "pendingApproval", "conflict", "error"] },
        mutationIds: { type: "array", items: { type: "string" } },
        error: { type: "object" },
      },
      required: ["status"],
    },
    useWhen: ["writing evidence-bearing spreadsheet outputs after target cells are resolved"],
    doNotUseWhen: ["the user is actively typing the target cell", "evidence is missing"],
    preconditions: ["read the current cell versions", "collect evidence refs", "preview affected cells"],
    successSignals: ["status is ok or pendingApproval", "mutationIds are returned", "verification read matches expected values"],
    failureModes: [
      { kind: "missing_required_arg", when: "ops is omitted", recoveryPath: "construct ops from resolved target cells and retry once", nextAction: "retry" },
      { kind: "permission_denied", when: "write scope is not allowed", recoveryPath: "ask the human for approval or stop", nextAction: "ask_human" },
      { kind: "cas_conflict", when: "cell version changed", recoveryPath: "re-read target cells and propose a conflict-safe patch", nextAction: "recover" },
      { kind: "provider_timeout", when: "tool call times out", recoveryPath: "verify whether mutation landed before retrying", nextAction: "recover" },
    ],
    costClass: "low",
    latencyClass: "interactive",
    permissionLevel: "write",
    mutates: true,
    approvalRequired: false,
    examples: {
      call: { ops: [{ cellId: "Sheet1!B4", value: "42", evidenceRef: "source:10" }] },
      success: { status: "ok", mutationIds: ["mut_1"] },
      failure: { status: "conflict", error: { kind: "cas_conflict", missingFields: [] } },
    },
  });
  const apiVerdict = verifyAgentReadyToolContract(writeCellContract);
  const contractMd = makeAgentApiContractMarkdown(writeCellContract);
  check("agent-ready API contract verifies", apiVerdict.ok, apiVerdict.errors.join("; "));
  check("agent-api-contract.md names when/not-when/recovery", contractMd.includes("Use When") && contractMd.includes("Do Not Use When") && contractMd.includes("cas_conflict"));

  const missingProviderArg: AgentReadyToolContract = clone(writeCellContract);
  missingProviderArg.providerInputSchema = { type: "object", properties: {}, required: [] };
  const missingProviderArgVerdict = verifyAgentReadyToolContract(missingProviderArg);
  check("agent-ready API gate rejects provider schema arg loss", missingProviderArgVerdict.ok === false && missingProviderArgVerdict.errors.some((e) => e.includes("provider schema")));

  const missingRecovery: AgentReadyToolContract = clone(writeCellContract);
  missingRecovery.failureModes = [];
  const missingRecoveryVerdict = verifyAgentReadyToolContract(missingRecovery);
  check("agent-ready API gate rejects missing recovery paths", missingRecoveryVerdict.ok === false && missingRecoveryVerdict.errors.some((e) => e.includes("failure modes")));

  // ---------------- Research spine: research-backed implementation gate ----------------
  console.log("\nResearchSpine (research-backed decisions + proof target):");
  const researchPack = make3dAgentResearchPack({
    goal: "Fresh founder asks for an AI app that creates 3D models from pictures.",
    generatedAt: "2026-06-23T00:00:00.000Z",
  });
  const researchVerdict = verifyResearchPack(researchPack, { now: new Date("2026-06-23T12:00:00.000Z") });
  check("complete 3D-agent research pack passes", researchVerdict.ok, researchVerdict.errors.join("; "));

  const localResearchPack = make3dAgentResearchPack({
    goal: "Local personal research proof for a screenshot-derived 3D asset app.",
    generatedAt: "2026-06-23T00:00:00.000Z",
    proofScope: "local-personal-research",
  });
  check(
    "local personal-research proof scope keeps deployment/provider/comparator optional",
    localResearchPack.proofScope === "local-personal-research" &&
      localResearchPack.proofArtifacts.find((artifact) => artifact.id === "artifact-deployed-url")?.required === false &&
      localResearchPack.proofArtifacts.find((artifact) => artifact.id === "artifact-provider-costs")?.required === false &&
      localResearchPack.proofArtifacts.find((artifact) => artifact.id === "artifact-comparator-scorecard")?.required === false &&
      localResearchPack.proofArtifacts.find((artifact) => artifact.id === "artifact-playwright-trace")?.required === true &&
      localResearchPack.proofArtifacts.find((artifact) => artifact.id === "artifact-generated-assets")?.required === true,
  );

  const missingSource = clone<ResearchPack>(researchPack);
  missingSource.sources = missingSource.sources.filter((s) => s.id !== "instantmesh");
  const missingSourceVerdict = verifyResearchPack(missingSource, { now: new Date("2026-06-23T12:00:00.000Z") });
  check("missing source is rejected", missingSourceVerdict.ok === false && missingSourceVerdict.errors.some((e) => e.includes("instantmesh")));

  const staleSource = clone<ResearchPack>(researchPack);
  staleSource.sources[0].verifiedAt = "2020-01-01";
  const staleSourceVerdict = verifyResearchPack(staleSource, { now: new Date("2026-06-23T12:00:00.000Z"), maxSourceAgeDays: 365 });
  check("stale source is rejected", staleSourceVerdict.ok === false && staleSourceVerdict.errors.some((e) => e.includes("stale")));

  const uncitedDecision = clone<ResearchPack>(researchPack);
  uncitedDecision.decisions[0].researchSourceIds = [];
  const uncitedDecisionVerdict = verifyResearchPack(uncitedDecision, { now: new Date("2026-06-23T12:00:00.000Z") });
  check("uncited implementation decision is rejected", uncitedDecisionVerdict.ok === false && uncitedDecisionVerdict.errors.some((e) => e.includes("no researchSourceIds")));

  const unsupportedClaim = clone<ResearchPack>(researchPack);
  const unsupportedCapabilityClaim = unsupportedClaim.claims.find((claim) => claim.id === "claim-agent-acts-in-ui")!;
  unsupportedCapabilityClaim.proofArtifactIds = [];
  unsupportedCapabilityClaim.sourceIds = [];
  const unsupportedClaimVerdict = verifyResearchPack(unsupportedClaim, { now: new Date("2026-06-23T12:00:00.000Z") });
  check("unsupported major capability claim is rejected", unsupportedClaimVerdict.ok === false && unsupportedClaimVerdict.errors.some((e) => e.includes("major capability/result claim")));

  const rubric = top3dComparisonRubric();
  check("top3d comparator has 4 providers and 100 points", rubric.competitors.length === 4 && rubric.totalPoints === 100);

  // ---------------- Design skill bridge: agent-agnostic design intelligence ----------------
  console.log("\nDesignSkillBridge (not Claude Code locked):");
  const designRegistry = designSkillRegistry();
  check("design registry has portable sources", designRegistry.length >= 12 && designRegistry.every((s) => s.agentLocked === false));
  check("design registry includes Codex-compatible skills", designRegistry.some((s) => s.runtimeSupport.includes("codex") && s.id === "frontend-design"));
  check("design registry includes visual/taste/native lanes", ["taste-minimalist-ui", "taste-industrial-brutalist-ui", "frontend-ui-ux", "premium-frontend-ui", "higgsfield-skills", "swiftui-skills"].every((id) => designRegistry.some((s) => s.id === id)));
  const dashboardPlan = recommendDesignSkills({
    surfaceKind: "dashboard",
    stack: "Next.js shadcn Tailwind",
    runtime: "codex",
    usesShadcnMcp: true,
  });
  const dashboardVerdict = verifyDesignSkillPlan(dashboardPlan);
  check("dashboard design plan selects shadcn + UI intelligence", dashboardPlan.selectedSkillIds.includes("shadcn-ui") && dashboardPlan.selectedSkillIds.includes("ui-ux-pro-max"));
  check("dashboard design plan verifies", dashboardVerdict.ok, dashboardVerdict.errors.join("; "));
  const premiumVisualPlan = recommendDesignSkills({
    surfaceKind: "marketing-site",
    stack: "Next.js hero image background video",
    runtime: "codex",
    stylePreset: "premium",
    needsVisualContent: true,
    needsAnimation: true,
  });
  check("premium visual plan selects premium + Higgsfield + GSAP", ["premium-frontend-ui", "higgsfield-skills", "gsap-skills"].every((id) => premiumVisualPlan.selectedSkillIds.includes(id)));
  const mobilePlan = recommendDesignSkills({
    surfaceKind: "mobile-app",
    stack: "Expo React Native SwiftUI",
    runtime: "codex",
    needsMobileNative: true,
    targetPlatform: "ios",
  });
  check("mobile design plan selects Expo/mobile/SwiftUI skills", mobilePlan.selectedSkillIds.includes("mobile-app-ui-design") && mobilePlan.selectedSkillIds.includes("expo-skills") && mobilePlan.selectedSkillIds.includes("swiftui-skills"));
  const badDesignPlan = { ...dashboardPlan, sequence: ["implementation", "design-brief", "browser-verify"] };
  const badDesignVerdict = verifyDesignSkillPlan(badDesignPlan);
  check("design order violation is rejected", badDesignVerdict.ok === false && badDesignVerdict.errors.some((e) => e.includes("before implementation")));
  const full3dDesignFlow = makeDesignFullFlow({
    surfaceKind: "3d-app",
    stack: "Next.js shadcn Three.js hero image",
    runtime: "codex",
    productCategory: "3D asset generation",
    stylePreset: "premium",
    needsAnimation: true,
    needsVisualContent: true,
    usesShadcnMcp: true,
  });
  const full3dDesignVerdict = verifyDesignFullFlow(full3dDesignFlow);
  check("full transcript design flow selects direction/component/industry/motion/visual/proof stages", ["surface-classification", "break-default-direction", "component-registry", "industry-fit-engine", "motion-plan", "visual-content", "implementation-proof"].every((id) => full3dDesignFlow.sequence.includes(id)));
  check("full transcript design flow verifies for 3D app", full3dDesignVerdict.ok, full3dDesignVerdict.errors.join("; "));
  const fullDashboardFlow = makeDesignFullFlow({
    surfaceKind: "dashboard",
    stack: "Next.js shadcn Tailwind",
    runtime: "codex",
    productCategory: "analytics",
    usesShadcnMcp: true,
  });
  check("dashboard full flow includes dashboard arrangement + industry fit", fullDashboardFlow.selectedSkillIds.includes("dashboard-arrangement") && fullDashboardFlow.sequence.includes("dashboard-information-architecture") && fullDashboardFlow.sequence.includes("industry-fit-engine"));
  const fullMobileFlow = makeDesignFullFlow({
    surfaceKind: "mobile-app",
    stack: "Expo SwiftUI React Native",
    runtime: "codex",
    targetPlatform: "ios",
    needsMobileNative: true,
  });
  const fullMobileVerdict = verifyDesignFullFlow(fullMobileFlow);
  check("mobile full flow treats mobile as native, not small web", fullMobileFlow.sequence.includes("mobile-native-rules") && fullMobileFlow.selectedSkillIds.includes("mobile-app-ui-design") && fullMobileFlow.selectedSkillIds.includes("swiftui-skills"));
  check("mobile full flow verifies", fullMobileVerdict.ok, fullMobileVerdict.errors.join("; "));
  const badFullFlow: DesignFullFlowPlan = { ...full3dDesignFlow, sequence: full3dDesignFlow.sequence.filter((id) => id !== "surface-classification") };
  const badFullFlowVerdict = verifyDesignFullFlow(badFullFlow);
  check("full design flow without surface classification is rejected", badFullFlowVerdict.ok === false && badFullFlowVerdict.errors.some((e) => e.includes("surface-classification")));

  const designQualityInput: DesignQualityGateInput = {
    surfaceKind: "3d-app",
    selectedSkillIds: ["frontend-design", "ui-ux-pro-max", "shadcn-ui", "premium-frontend-ui", "gsap-skills"],
    completedCriteria: [...defaultDesignQualityCriteria],
    desktopScreenshotPaths: ["docs/proof/playwright-results/fresh-founder-flow-chromium/fresh-founder-flow.png"],
    mobileScreenshotPaths: ["docs/proof/playwright-results/fresh-founder-flow-mobile/fresh-founder-flow.png"],
    designBriefPath: "docs/proof/design-flow.json",
    componentContractPath: "docs/decisions/implementation-receipts.md",
    interactionProofPaths: ["docs/proof/playwright-report/index.html"],
    accessibilityProofPaths: ["docs/proof/scorecard.md"],
    primarySurface: "workspace-console",
    visualVerdict: "pass",
    qualityBar: "shipping",
  };
  const designQualityReceipt = makeDesignQualityReceipt(designQualityInput);
  const designQualityVerdict = verifyDesignQualityReceipt(designQualityReceipt);
  check("design quality gate passes complete 3D workspace receipt", designQualityVerdict.ok, designQualityVerdict.errors.join("; "));

  const missingVisualReceipt = makeDesignQualityReceipt({
    ...designQualityInput,
    desktopScreenshotPaths: [],
    mobileScreenshotPaths: [],
  });
  const missingVisualVerdict = verifyDesignQualityReceipt(missingVisualReceipt);
  check("design quality gate rejects missing visual screenshots", missingVisualVerdict.ok === false && missingVisualVerdict.errors.some((e) => e.includes("screenshot")));

  const harnessReceipt = makeDesignQualityReceipt({
    ...designQualityInput,
    selectedSkillIds: ["frontend-design", "shadcn-ui"],
    completedCriteria: defaultDesignQualityCriteria.filter((criterion) => criterion !== "industry-fit"),
    primarySurface: "framed-preview-card",
    visualVerdict: "internal-harness",
    qualityBar: "internal",
    notes: ["current UI still reads as an internal test harness"],
  });
  const harnessVerdict = verifyDesignQualityReceipt(harnessReceipt);
  check("design quality gate rejects framed/internal harness UI", harnessVerdict.ok === false && harnessVerdict.errors.some((e) => e.includes("framed preview card")) && harnessVerdict.errors.some((e) => e.includes("internal")));

  // ---------------- Agent chat UX: VisualLabs-style production workspace ----------------
  console.log("\nAgentChatUxGate (chat as production workspace, not chatbot wrapper):");
  const agentChatSources = agentChatUxInspirationSources();
  check("agent chat UX sources include VisualLabs + Harness4Visuals", ["visual-labs-production-line", "harness4visuals-taste-memory"].every((id) => agentChatSources.some((source) => source.id === id)));
  const agentChatPlan = makeAgentChatUxPlan({
    goal: "Build a 3D asset agent workspace from screenshots and reference media.",
    surfaceKind: "3d-asset-workspace",
    productCategory: "3D asset generation",
    needsModelComparison: true,
    needsDeploymentHandoff: true,
    createdAt: "2026-06-24T00:00:00.000Z",
  });
  const agentChatPlanVerdict = verifyAgentChatUxPlan(agentChatPlan);
  check("agent chat UX plan requires workspace/artifacts/tools/costs/memory/proof", agentChatPlanVerdict.ok && ["workspace-not-chatbot", "observable-agent-loop", "learning-loop", "proof-receipt"].every((id) => agentChatPlan.stages.some((stage) => stage.id === id)), agentChatPlanVerdict.errors.join("; "));

  const agentChatReceipt: AgentChatUxReceipt = {
    schemaVersion: 1,
    goal: "Build a 3D asset agent workspace from screenshots and reference media.",
    surfaceKind: "3d-asset-workspace",
    productCategory: "3D asset generation",
    inspirationSourceIds: agentChatSources.map((source) => source.id),
    completedCapabilities: [...requiredAgentChatUxCapabilities, "model-provider-comparison", "deployment-publish-handoff"],
    implementedSurfaces: [...agentChatUxSurfaces],
    evidence: {
      desktopScreenshotPaths: ["docs/proof/agent-chat/desktop.png"],
      mobileScreenshotPaths: ["docs/proof/agent-chat/mobile.png"],
      interactionProofPaths: ["docs/proof/agent-chat/interaction.trace.zip"],
      tracePaths: ["docs/proof/agent-chat/playwright-trace.zip"],
      domTestIds: [...requiredAgentChatUxDomSignals],
      artifactPaths: ["docs/proof/agent-chat/generated.glb", "docs/proof/agent-chat/remix-board.json"],
      costLatencyReceiptPaths: ["docs/proof/agent-chat/cost-latency.json"],
      memoryReceiptPaths: ["docs/proof/agent-chat/taste-memory.jsonl"],
      approvalReceiptPaths: ["docs/proof/agent-chat/publish-dry-run.json"],
      analyticsReceiptPaths: ["docs/proof/agent-chat/analytics-loopback.json"],
      provenanceReceiptPaths: ["docs/proof/agent-chat/provenance.json"],
      publishHandoffReceiptPaths: ["docs/proof/agent-chat/deploy-handoff.json"],
      modelComparisonPaths: ["docs/proof/agent-chat/model-comparison.json"],
    },
    designQualityReceiptPath: "docs/proof/design-quality-receipt.json",
    notes: ["production workspace with visible artifacts, tool calls, costs, approvals, memory export, analytics, and traces"],
    createdAt: "2026-06-24T00:00:00.000Z",
  };
  const agentChatReceiptVerdict = verifyAgentChatUxReceipt(agentChatReceipt);
  check("agent chat UX receipt passes complete production workspace evidence", agentChatReceiptVerdict.ok, agentChatReceiptVerdict.errors.join("; "));

  const missingMemoryChat = clone(agentChatReceipt);
  missingMemoryChat.evidence.memoryReceiptPaths = [];
  const missingMemoryChatVerdict = verifyAgentChatUxReceipt(missingMemoryChat);
  check("agent chat UX gate rejects transcript-only/no-memory export", missingMemoryChatVerdict.ok === false && missingMemoryChatVerdict.errors.some((e) => e.includes("memory/taste export")));

  const genericChatOnly = clone(agentChatReceipt);
  genericChatOnly.implementedSurfaces = ["agent-composer"];
  genericChatOnly.evidence.domTestIds = ["agent-composer"];
  genericChatOnly.notes = ["plain chat only generic chat box around an internal harness"];
  const genericChatVerdict = verifyAgentChatUxReceipt(genericChatOnly);
  check("agent chat UX gate rejects generic chat-only harness", genericChatVerdict.ok === false && genericChatVerdict.errors.some((e) => e.includes("artifact-rail")) && genericChatVerdict.errors.some((e) => e.includes("generic/internal")));

  // ---------------- gstack bridge: portable operating-review lanes ----------------
  console.log("\ngstackBridge (portable CEO/eng/design/QA/release roles):");
  const gstackRegistry = gstackRoleRegistry();
  check("gstack registry has portable specialist roles", gstackRegistry.length >= 20 && gstackRegistry.every((r) => r.agentLocked === false));
  check("gstack registry covers CEO, eng, QA, security, release", ["plan-ceo-review", "plan-eng-review", "qa-only", "cso", "land-and-deploy"].every((id) => gstackRegistry.some((r) => r.id === id)));
  const discoverGstack = recommendGstackLanes({
    phase: "discover",
    goal: "Fresh founder wants picture-to-3D app from screenshots.",
  });
  check("discover gstack plan requires office-hours + CEO review", discoverGstack.selectedRoleIds.includes("office-hours") && discoverGstack.selectedRoleIds.includes("plan-ceo-review"));
  const buildGstack = recommendGstackLanes({
    phase: "build",
    goal: "Build the 3D app upload/chat/viewer UI.",
    hasUi: true,
    hasSecurityBoundary: true,
    risk: "high",
  });
  const buildGstackVerdict = verifyGstackPlan(buildGstack);
  check("high-risk UI build gstack plan selects eng/design/security/review/guard", ["plan-eng-review", "plan-design-review", "cso", "review", "guard"].every((id) => buildGstack.selectedRoleIds.includes(id)));
  check("high-risk UI build gstack plan verifies", buildGstackVerdict.ok, buildGstackVerdict.errors.join("; "));
  const verifyGstack = recommendGstackLanes({
    phase: "verify",
    goal: "Prove fresh-user 3D app flow on deployed URL.",
    hasUi: true,
    hasDeployment: true,
    hasSecurityBoundary: true,
    needsDevex: true,
  });
  const verifyGstackVerdict = verifyGstackPlan(verifyGstack);
  check("deployed verification gstack plan selects live QA + release + canary", ["qa-only", "browse", "land-and-deploy", "canary"].every((id) => verifyGstack.selectedRoleIds.includes(id)));
  check("deployed verification gstack plan verifies", verifyGstackVerdict.ok, verifyGstackVerdict.errors.join("; "));
  const badGstackPlan: GstackReviewPlan = { ...verifyGstack, selectedRoleIds: verifyGstack.selectedRoleIds.filter((id) => id !== "land-and-deploy") };
  const badGstackVerdict = verifyGstackPlan(badGstackPlan);
  check("deployment proof without land-and-deploy is rejected", badGstackVerdict.ok === false && badGstackVerdict.errors.some((e) => e.includes("land-and-deploy")));

  // ---------------- Fresh-room proof receipts: NodeRoom-compatible latest.json shape ----------------
  console.log("\nFreshRoomProofReceipt (live UI proof receipt compatibility):");
  const proofRoot = mkdtempSync(join(tmpdir(), "solo-smoke-proof-"));
  const touch = (rel: string, body = "proof") => {
    const path = join(proofRoot, rel);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, body, "utf8");
    return rel;
  };
  const freshReceipt: FreshRoomProofReceipt = {
    schemaVersion: 1,
    caseId: "FR-010",
    roomId: "room_fresh",
    command: "npm run test:fresh-room",
    model: "deepseek/deepseek-v4-flash",
    runtimeProfile: "benchmark_completion",
    prompt: "Complete the held-out spreadsheet task.",
    tracePath: touch("trace.zip"),
    videoPath: touch("video.webm"),
    screenshotPaths: [touch("graded.png")],
    exportedFiles: [touch("answer.xlsx")],
    reopenedFiles: [touch("reopened.txt")],
    scorer: { id: "SpreadsheetBench/evaluation.compare_workbooks", official: true, passed: true, resultPath: touch("score.json", "{\"ok\":true}") },
    costUsd: 0.12,
    latencyMs: 42_000,
    tokenUsage: 22_000,
    mutationCount: 8,
    proofSignals: {
      freshRoom: true,
      liveBrowser: true,
      memoryModeFalse: true,
      zeroFabrication: true,
      selfTestPassed: true,
      exportDownloaded: true,
      artifactReopened: true,
    },
    pass: true,
  };
  const freshReceiptVerdict = verifyFreshRoomProofReceipt(freshReceipt, { baseDir: proofRoot });
  check("fresh-room receipt passes with live browser + official scorer proof", freshReceiptVerdict.ok, freshReceiptVerdict.errors.join("; "));
  const noOfficialScorerReceipt: FreshRoomProofReceipt = clone(freshReceipt);
  noOfficialScorerReceipt.scorer.official = false;
  const noOfficialScorerVerdict = verifyFreshRoomProofReceipt(noOfficialScorerReceipt, { baseDir: proofRoot });
  check("fresh-room receipt rejects unofficial scorer", noOfficialScorerVerdict.ok === false && noOfficialScorerVerdict.errors.some((e) => e.includes("official scorer")));
  const noArtifactReopenReceipt: FreshRoomProofReceipt = clone(freshReceipt);
  noArtifactReopenReceipt.proofSignals.artifactReopened = false;
  const noArtifactReopenVerdict = verifyFreshRoomProofReceipt(noArtifactReopenReceipt, { baseDir: proofRoot });
  check("fresh-room receipt rejects missing artifact reopen proof", noArtifactReopenVerdict.ok === false && noArtifactReopenVerdict.errors.some((e) => e.includes("artifactReopened")));

  // ---------------- Full proof pack, fresh-user emulation, trust root, and first-party 3D plan ----------------
  console.log("\nFullProofPack / FreshUser / TrustRoot / ThreeDPlan:");
  const threeDPlan = makeThreeDPlan({
    goal: "build a first-party image/text-to-3D app from a vague screenshot request",
    generatedAt: "2026-06-24T00:00:00.000Z",
  });
  const threeDPlanVerdict = verifyThreeDPlan(threeDPlan);
  check("3D plan keeps providers as comparator/fallback only", threeDPlanVerdict.ok && threeDPlan.providerPolicy.defaultRole === "comparator_or_fallback_only", threeDPlanVerdict.errors.join("; "));
  const decompositionLane = threeDPlan.firstPartyLanes.find((lane) => lane.id === "first-principles-decomposition");
  check("3D plan requires nested part-research RALPH before generation", !!decompositionLane?.proofRequired.includes("part-research-ralph") && !!decompositionLane?.proofRequired.includes("composition-constraint-graph"));
  const badThreeDPlan = clone(threeDPlan);
  badThreeDPlan.firstPartyLanes = badThreeDPlan.firstPartyLanes.filter((lane) => lane.id !== "multiview-reconstruction");
  const badThreeDPlanVerdict = verifyThreeDPlan(badThreeDPlan);
  check("3D plan rejects missing first-party reconstruction lane", badThreeDPlanVerdict.ok === false && badThreeDPlanVerdict.errors.some((e) => e.includes("multiview-reconstruction")));
  const noDecompositionPlan = clone(threeDPlan);
  noDecompositionPlan.firstPartyLanes = noDecompositionPlan.firstPartyLanes.filter((lane) => lane.id !== "first-principles-decomposition");
  const noDecompositionVerdict = verifyThreeDPlan(noDecompositionPlan);
  check("3D plan rejects missing first-principles decomposition lane", noDecompositionVerdict.ok === false && noDecompositionVerdict.errors.some((e) => e.includes("first-principles component breakdown")));
  const threeDComparator = makeThreeDComparatorRubric();
  check("3D comparator scores first-party and provider outputs on same rubric", threeDComparator.providers.length >= 4 && threeDComparator.passRule.includes("not the default product architecture"));
  check("3D comparator stays a 100-point rubric", threeDComparator.metrics.reduce((sum, metric) => sum + metric.points, 0) === 100);

  console.log("\nIntentRalph (generic nested loop for any user intent):");
  const genericIntentReceipt = makeIntentRalphReceipt({
    goal: "Build a founder-requested hiring operations agent from a vague prompt.",
    domain: "workflow-ops-agent",
    generatedAt: "2026-06-24T00:00:00.000Z",
    status: "completed",
  });
  for (const loop of genericIntentReceipt.workstreamLoops) {
    for (const stage of intentRalphStages) {
      for (const evidencePath of loop.stages[stage].evidencePaths) {
        touch(evidencePath, `# ${loop.label} ${stage}\n`);
      }
    }
  }
  const genericIntentVerdict = verifyIntentRalphReceipt(genericIntentReceipt, { baseDir: proofRoot });
  check(
    "generic intent RALPH passes complete research/alignment/build/proof/hardening evidence",
    genericIntentVerdict.ok && genericIntentReceipt.workstreamLoops.every((loop) => intentRalphStages.every((stage) => loop.stages[stage].status === "completed")),
    genericIntentVerdict.errors.join("; "),
  );
  const missingIntentResearch = clone(genericIntentReceipt);
  missingIntentResearch.workstreamLoops[0].researchSourceIds = [];
  const missingIntentResearchVerdict = verifyIntentRalphReceipt(missingIntentResearch, { baseDir: proofRoot });
  check("generic intent RALPH rejects uncited workstreams", missingIntentResearchVerdict.ok === false && missingIntentResearchVerdict.errors.some((e) => e.includes("research sources")));
  const missingIntentInterface = clone(genericIntentReceipt);
  missingIntentInterface.workstreamLoops[0].interfaces = [];
  const missingIntentInterfaceVerdict = verifyIntentRalphReceipt(missingIntentInterface, { baseDir: proofRoot });
  check("generic intent RALPH rejects missing dependency/interface contracts", missingIntentInterfaceVerdict.ok === false && missingIntentInterfaceVerdict.errors.some((e) => e.includes("dependency/interface")));
  const relaxedIntentRestrictions = clone(genericIntentReceipt);
  relaxedIntentRestrictions.restrictions.productionUseUserOwnedDecision = false as true;
  const relaxedIntentVerdict = verifyIntentRalphReceipt(relaxedIntentRestrictions, { baseDir: proofRoot });
  check("generic intent RALPH rejects agent-owned production/commercial approval", relaxedIntentVerdict.ok === false && relaxedIntentVerdict.errors.some((e) => e.includes("user-owned")));

  console.log("\nIdeaTweak (cheap founder-screenshot delta intake):");
  const tweakReceipt = makeIdeaTweakReceipt({
    goal: "Update a founder 3D asset app from new screenshot/chat ideas.",
    domain: "3d-generation",
    createdAt: "2026-06-24T00:00:00.000Z",
    messages: [
      "The user can brush over the item they want, crop everything around it, and generate the 3D model from that crop.",
      "Roadmap: create 3D model from pictures, animate that 3D model using laptop camera, put all generated assets in the same environment, voice feature for agents/models and chat transcription.",
      "I saw Spline, Framer, Emergent, and Bruno Simon interactive 3D websites and want the web design flow to feel that pretty.",
      "Use S3 to store 3D assets alongside photos for this hackathon demo, but no provider API should be required for the core demo.",
      "Personal research only; commercial or deployable use is up to the user.",
    ],
  });
  const tweakVerdict = verifyIdeaTweakReceipt(tweakReceipt);
  check("idea tweak receipt verifies screenshot-style additions", tweakVerdict.ok, tweakVerdict.errors.join("; "));
  check(
    "idea tweak extracts brush, storage, camera, voice, design-reference, provider, and rights deltas",
    ["source-brush-isolation", "asset-inventory-storage", "camera-animation-lane", "voice-chat-transcript", "interactive-web-3d-reference", "provider-optional-first-party-core", "rights-safe-originality"].every((id) =>
      tweakReceipt.deltas.some((delta) => delta.id === id),
    ),
  );
  check("idea tweak reroutes to earliest changed phase and requires proof/judge rerun", tweakReceipt.reroute.earliestPhase === "discover" && tweakReceipt.requiredActions.updateLiveProof && tweakReceipt.requiredActions.rerunFreshContextJudge);
  check("idea tweak forces component/design/setup updates only when deltas require them", tweakReceipt.requiredActions.updateComponentRalph && tweakReceipt.requiredActions.updateDesignFlow && tweakReceipt.requiredActions.updateSetupMatrix);
  const weakTweak = clone(tweakReceipt);
  weakTweak.parentLoopGate.tweakRequiresProof = false as true;
  weakTweak.requiredActions.rerunFreshContextJudge = false;
  const weakTweakVerdict = verifyIdeaTweakReceipt(weakTweak);
  check("idea tweak rejects silent scope creep without proof and fresh judge rerun", weakTweakVerdict.ok === false && weakTweakVerdict.errors.some((e) => e.includes("require proof")) && weakTweakVerdict.errors.some((e) => e.includes("fresh-context judge")));

  console.log("\nDirectionRalph + Governors (direction-changing inspiration gate):");
  const directionText = [
    "Instead of integrating Spline or Emergent, make our own OSS interactive 3D asset pipeline.",
    "Use Bruno Simon and Igloo as a gold standard for WebGL quality.",
    "Add a Research Governor, Architecture Governor, and Proof Registry so claims are proven.",
  ].join(" ");
  const directionIntake = makeDirectionIntake({ sourceText: directionText, pivotId: "pivot-001", createdAt: "2026-06-24T00:00:00.000Z" });
  check("direction intake detects pivot language", directionIntake.changedDirection && directionChangedByText(directionText) && directionIntake.items.length >= 4);
  const directionProposal = makeDirectionProposal({
    goal: "Owned OSS interactive 3D asset pipeline with proof registry.",
    intake: directionIntake,
    oldDirection: "Provider-first scaffold demo.",
    proposedDirection: "OSS, agent-driven pipeline for web-ready 3D experiences.",
    targetQualityTier: "T3",
    createdAt: "2026-06-24T00:00:00.000Z",
  });
  const directionProposalVerdict = verifyDirectionProposal(directionProposal);
  check("direction proposal requires all RALPH stages and proof updates", directionProposalVerdict.ok, directionProposalVerdict.errors.join("; "));
  const directionDecision = makeDirectionDecision({
    pivotId: "pivot-001",
    decision: "accepted",
    rationale: "User chose owned OSS pipeline over provider-only integration.",
    decidedAt: "2026-06-24T00:00:00.000Z",
  });
  const directionReceipt = makeDirectionChangeReceipt({ proposal: directionProposal, decision: directionDecision });
  const directionReceiptVerdict = verifyDirectionChangeReceipt(directionReceipt);
  check("direction change receipt verifies accepted pivot", directionReceiptVerdict.ok && directionReceipt.newDirection.includes("OSS"), directionReceiptVerdict.errors.join("; "));

  const gltfSource = classifyResearchSource({
    id: "khronos-gltf",
    title: "Khronos glTF runtime asset delivery",
    url: "https://www.khronos.org/gltf/",
    domain: "3d-asset-pipeline",
    verifiedAt: "2026-06-24T00:00:00.000Z",
  });
  const researchBrief = makeResearchBrief({
    goal: "Build a web-ready 3D asset pipeline",
    domain: "3d-asset-pipeline",
    sources: [gltfSource],
    createdAt: "2026-06-24T00:00:00.000Z",
    latestCheckAt: "2026-06-24T00:00:00.000Z",
    staleAfterDays: 180,
  });
  const researchBriefVerdict = verifyResearchBrief(researchBrief, { now: new Date("2026-06-24T00:00:00.000Z") });
  check("research governor verifies fresh source-backed implementation brief", researchBriefVerdict.ok, researchBriefVerdict.errors.join("; "));
  const staleBrief = clone(researchBrief);
  staleBrief.sources[0].verifiedAt = "2024-01-01T00:00:00.000Z";
  const staleBriefVerdict = verifyResearchBrief(staleBrief, { now: new Date("2026-06-24T00:00:00.000Z"), maxSourceAgeDays: 90 });
  check("research governor rejects stale source checks", staleBriefVerdict.ok === false && staleBriefVerdict.errors.some((error) => error.includes("stale")));
  const systemMap = makeSystemMapGraph({ projectGoal: "Owned OSS interactive 3D asset pipeline.", generatedAt: "2026-06-24T00:00:00.000Z" });
  const systemMapVerdict = validateSystemMapGraph(systemMap);
  check("architecture governor validates default system map", systemMapVerdict.ok && renderSystemMapMermaid(systemMap).includes("Proof registry"), systemMapVerdict.errors.join("; "));

  const directionJudgeRoot = mkdtempSync(join(tmpdir(), `solo-direction-judge-${process.pid}-`));
  createRalphLedger({ repoPath: directionJudgeRoot, goal: "Owned OSS interactive 3D asset pipeline", now: "2026-06-24T00:00:00.000Z" });
  recordSoloEvent(directionJudgeRoot, {
    event: "prompt.submit",
    agentHost: "smoke",
    status: "info",
    message: directionText,
    source: "smoke",
  });
  const missingDirectionJudge = judgeCurrentLoop({ projectPath: directionJudgeRoot, lastAssistantMessage: "done" });
  check(
    "fresh-context judge blocks direction-changing input without direction receipt",
    missingDirectionJudge.verdict.verdict === "needs_research" && missingDirectionJudge.verdict.missingReceipts.includes(".solo/receipts/R/direction-change-receipt.json"),
    missingDirectionJudge.verdict.reason,
  );
  const directionJudgePaths = directionPaths(directionJudgeRoot);
  mkdirSync(dirname(directionJudgePaths.directionReceiptPath), { recursive: true });
  writeFileSync(directionJudgePaths.directionReceiptPath, `${JSON.stringify(directionReceipt, null, 2)}\n`, "utf8");
  writeSystemMapGraph(directionJudgePaths.systemMapPath, systemMap);
  mkdirSync(dirname(directionJudgePaths.researchBriefPath), { recursive: true });
  writeFileSync(directionJudgePaths.researchBriefPath.replace(/\.md$/, ".json"), `${JSON.stringify(researchBrief, null, 2)}\n`, "utf8");
  const satisfiedDirectionJudge = judgeCurrentLoop({ projectPath: directionJudgeRoot, lastAssistantMessage: "done" });
  check(
    "fresh-context judge accepts completed direction layer and proceeds to normal receipts",
    satisfiedDirectionJudge.judgeInput.directionLayer.ok === true && !satisfiedDirectionJudge.verdict.missingReceipts.includes(".solo/receipts/R/direction-change-receipt.json"),
    satisfiedDirectionJudge.verdict.reason,
  );

  console.log("\nComponentRalph (generic nested loop for compositional outputs):");
  const chairComponents = decomposeComponentsFromText({ text: "wooden chair from an image into a GLB asset", domain: "3d-generation" });
  check("component decomposition finds production-critical 3D parts", ["chair.seat", "chair.legs", "chair.backrest", "export.glb"].every((id) => chairComponents.some((component) => component.id === id)));
  const componentLedger = makeComponentRalphLedger({
    goal: "Generate a functional wooden chair from one product image.",
    domain: "3d-generation",
    components: chairComponents,
    generatedAt: "2026-06-24T00:00:00.000Z",
    status: "completed",
  });
  for (const component of componentLedger.components) {
    for (const stage of componentRalphStages) {
      for (const evidencePath of component.ralph[stage].evidencePaths) touch(evidencePath, `# ${component.label} ${stage}\n`);
    }
    for (const gate of component.proofGates) {
      for (const evidencePath of gate.evidencePaths) touch(evidencePath, `{"componentId":"${component.componentId}","gate":"${gate.id}","verdict":"pass"}\n`);
    }
  }
  const componentVerdict = verifyComponentRalphLedger(componentLedger, { baseDir: proofRoot });
  check("component RALPH passes complete required component receipts", componentVerdict.ok, componentVerdict.errors.join("; "));
  const missingComponentProof = clone(componentLedger);
  missingComponentProof.components[0].ralph.P.status = "planned";
  const missingComponentProofVerdict = verifyComponentRalphLedger(missingComponentProof, { baseDir: proofRoot });
  check("component RALPH rejects missing nested proof stage", missingComponentProofVerdict.ok === false && missingComponentProofVerdict.missingProofs.some((proof) => proof.includes(".P")));
  const missingGateLedger = clone(componentLedger);
  missingGateLedger.components[0].proofGates[0].passed = false;
  const missingGateVerdict = verifyComponentRalphLedger(missingGateLedger, { baseDir: proofRoot });
  check("component RALPH rejects incomplete required proof gates", missingGateVerdict.ok === false && missingGateVerdict.missingProofs.some((proof) => proof.includes("proofGate")));
  const noLedgerJudge = judgeComponentLayer({ projectPath: proofRoot, goal: "prove a coherent 3D asset pipeline" });
  check("component judge blocks missing ledger for compositional parent proof", noLedgerJudge.ok === false && noLedgerJudge.missingProofs.includes(".solo/ledgers/component-ralph.json"));

  console.log("\nThreeDPartResearchRalph (per-component function + assembly research loop):");
  const partResearchReceipt = makeThreeDPartResearchRalphReceipt({
    goal: "Create a coherent eyewear-style 3D asset from screenshot inspiration.",
    objectCategory: "eyewear",
    generatedAt: "2026-06-24T00:00:00.000Z",
    status: "completed",
  });
  for (const loop of partResearchReceipt.partLoops) {
    for (const stage of partResearchRalphStages) {
      for (const evidencePath of loop.stages[stage].evidencePaths) {
        touch(evidencePath, `# ${loop.label} ${stage}\n`);
      }
    }
  }
  const partResearchVerdict = verifyThreeDPartResearchRalphReceipt(partResearchReceipt, { baseDir: proofRoot });
  check(
    "part-research RALPH passes complete per-part research, assembly, geometry, proof, and hardening evidence",
    partResearchVerdict.ok && partResearchReceipt.partLoops.every((loop) => partResearchRalphStages.every((stage) => loop.stages[stage].status === "completed")),
    partResearchVerdict.errors.join("; "),
  );
  const missingPartSources = clone(partResearchReceipt);
  missingPartSources.partLoops[0].researchSourceIds = [];
  const missingPartSourcesVerdict = verifyThreeDPartResearchRalphReceipt(missingPartSources, { baseDir: proofRoot });
  check("part-research RALPH rejects a component without research sources", missingPartSourcesVerdict.ok === false && missingPartSourcesVerdict.errors.some((e) => e.includes("research sources")));
  const plannedStageReceipt = clone(partResearchReceipt);
  plannedStageReceipt.partLoops[0].stages.P.status = "planned";
  const plannedStageVerdict = verifyThreeDPartResearchRalphReceipt(plannedStageReceipt, { baseDir: proofRoot });
  check("part-research RALPH rejects uncompleted nested proof stage", plannedStageVerdict.ok === false && plannedStageVerdict.errors.some((e) => e.includes("stage P")));
  const missingInterfaceReceipt = clone(partResearchReceipt);
  missingInterfaceReceipt.partLoops[0].compositionInterfaces = [];
  const missingInterfaceVerdict = verifyThreeDPartResearchRalphReceipt(missingInterfaceReceipt, { baseDir: proofRoot });
  check("part-research RALPH rejects missing part composition interface", missingInterfaceVerdict.ok === false && missingInterfaceVerdict.errors.some((e) => e.includes("composition interface")));

  console.log("\nThreeDAssetQualityGate (industry-grade asset bar):");
  const assetQualityPlan = makeThreeDAssetQualityPlan({
    goal: "Produce a coherent game-ready 3D asset from screenshot inspiration.",
    target: "game",
    claimLevel: "industry-grade",
    generatedAt: "2026-06-24T00:00:00.000Z",
  });
  check(
    "3D asset quality plan requires topology/UV/PBR/export/reopen/scorecard",
    ["topology-retopo", "uv-unwrap", "pbr-materials", "portable-engine-export", "dcc-reopen-proof", "benchmark-scorecard"].every((id) =>
      assetQualityPlan.criteria.some((criterion) => criterion.id === id),
    ) && assetQualityPlan.failClosedRules.some((rule) => rule.includes("OBJ-only")),
  );
  const completeAssetQualityReceipt: ThreeDAssetQualityReceipt = {
    schemaVersion: 1,
    goal: assetQualityPlan.goal,
    target: "game",
    claimLevel: "industry-grade",
    generatedAt: "2026-06-24T00:00:00.000Z",
    researchSourceIds: assetQualityPlan.sources.map((source) => source.id),
    criteria: assetQualityPlan.criteria.map((criterion) => criterion.id),
    evidence: {
      semanticPartGraphPath: touch("asset-quality/semantic-part-graph.json", "{\"parts\":[\"frame\",\"lens\",\"hinge\"]}"),
      meshStats: { vertices: 1824, faces: 3612, objectCount: 8, degenerateFaces: 0, normalsPresent: true, unitScale: "meters" },
      topologyReportPath: touch("asset-quality/topology-report.md", "manifold-ish retopo report"),
      uvReportPath: touch("asset-quality/uv-report.md", "uv atlas non-overlap report"),
      pbrMaterialMapPaths: {
        baseColor: touch("asset-quality/baseColor.png"),
        normal: touch("asset-quality/normal.png"),
        roughness: touch("asset-quality/roughness.png"),
        metallic: touch("asset-quality/metallic.png"),
      },
      exports: {
        glb: touch("asset-quality/generated.glb", "glb-bytes"),
        obj: touch("asset-quality/generated.obj", "obj-bytes"),
      },
      reopenProofPaths: [touch("asset-quality/reopen-proof.json", "{\"ok\":true}")],
      viewerScreenshotPaths: [touch("asset-quality/viewer.png", "png")],
      wireframeScreenshotPaths: [touch("asset-quality/wireframe.png", "png")],
      uvScreenshotPaths: [touch("asset-quality/uv-layout.png", "png")],
      lodCollisionPivotReceiptPath: touch("asset-quality/lod-collision-pivot.json", "{\"ok\":true}"),
      benchmarkScorecardPath: touch("asset-quality/scorecard.json", "{\"p3d\":true}"),
      rightsProvenanceReceiptPath: touch("asset-quality/rights-provenance.json", "{\"exactReplicaExport\":false}"),
    },
    restrictions: { exactReplicaExport: false },
  };
  const assetQualityVerdict = verifyThreeDAssetQualityReceipt(completeAssetQualityReceipt, { baseDir: proofRoot });
  check("3D asset quality gate passes complete industry-grade receipt", assetQualityVerdict.ok, assetQualityVerdict.errors.join("; "));
  const objOnlyReceipt: ThreeDAssetQualityReceipt = {
    ...completeAssetQualityReceipt,
    evidence: {
      ...completeAssetQualityReceipt.evidence,
      exports: { obj: "asset-quality/generated.obj" },
    },
  };
  const objOnlyVerdict = verifyThreeDAssetQualityReceipt(objOnlyReceipt, { baseDir: proofRoot });
  check("3D asset quality gate rejects OBJ-only industry-grade placeholder", objOnlyVerdict.ok === false && objOnlyVerdict.errors.some((e) => e.includes("OBJ-only") || e.includes("GLB")));
  const missingPbrReceipt: ThreeDAssetQualityReceipt = {
    ...completeAssetQualityReceipt,
    evidence: {
      ...completeAssetQualityReceipt.evidence,
      pbrMaterialMapPaths: { baseColor: "asset-quality/baseColor.png" },
    },
  };
  const missingPbrVerdict = verifyThreeDAssetQualityReceipt(missingPbrReceipt, { baseDir: proofRoot });
  check("3D asset quality gate rejects missing PBR/UV/topology evidence", missingPbrVerdict.ok === false && missingPbrVerdict.errors.some((e) => e.includes("PBR material map")));

  console.log("\nResearchAssetMaker (personal-research-only procedural artifact):");
  const assetRoot = mkdtempSync(join(tmpdir(), "solo-smoke-asset-"));
  const researchAsset = makeResearchOnlyAsset({
    goal: "Create a personal research scaffold from a filtered spacecraft seat functional spec.",
    projectId: "kestrel-seat",
    outputDir: assetRoot,
    functionalSpec: "Seat_Spec:\n  Primary: load-bearing shell\n  Support: four-point bracket\n  Padding: dual-density foam\n",
    deconstructionReceiptPath: "proof/component-breakdown.json",
    generatedAt: "2026-06-24T00:00:00.000Z",
  });
  const assetVerdict = verifyResearchAssetManifest(researchAsset, { baseDir: assetRoot });
  check("research asset maker emits verified OBJ artifact", assetVerdict.ok && researchAsset.output.primaryAssetPath.endsWith(".obj"), assetVerdict.errors.join("; "));
  check("research asset maker keeps commercial/deployment decision user-owned", researchAsset.restrictions.personalResearchOnly === true && researchAsset.restrictions.humanUseApproved === false && researchAsset.restrictions.exactReplicaExport === false && researchAsset.restrictions.commercialDeploymentDecision.owner === "user" && researchAsset.restrictions.commercialDeploymentDecision.agentApproval === false);
  const unsafeAsset = clone(researchAsset);
  unsafeAsset.source.rawReplicaUsed = true as false;
  unsafeAsset.restrictions.exactReplicaExport = true as false;
  unsafeAsset.restrictions.humanUseApproved = true as false;
  unsafeAsset.restrictions.commercialDeploymentDecision.owner = "agent" as "user";
  unsafeAsset.restrictions.commercialDeploymentDecision.agentApproval = true as false;
  unsafeAsset.proof.containsMeshFromReplica = true as false;
  const unsafeAssetVerdict = verifyResearchAssetManifest(unsafeAsset, { baseDir: assetRoot });
  check("research asset maker rejects raw replica, exact export, agent commercial approval, and human-use claims", unsafeAssetVerdict.ok === false && unsafeAssetVerdict.errors.some((e) => e.includes("raw replica")) && unsafeAssetVerdict.errors.some((e) => e.includes("exactReplicaExport")) && unsafeAssetVerdict.errors.some((e) => e.includes("human use")) && unsafeAssetVerdict.errors.some((e) => e.includes("commercial/deployment")) && unsafeAssetVerdict.errors.some((e) => e.includes("mesh from replica")));

  console.log("\nEngineeringInventionHarness (study replica -> first-principles -> safety proof):");
  const engineeringHarness = makeEngineeringInventionHarness({
    goal: "Invent an urgent safety-critical replacement part from previous models without exporting a protected exact replica.",
    riskLevel: "safety_critical",
    urgency: "emergency",
    generatedAt: "2026-06-24T00:00:00.000Z",
  });
  const engineeringVerdict = verifyEngineeringInventionHarness(engineeringHarness);
  check("engineering harness allows exact study replica only in non-export sandbox", engineeringVerdict.ok && engineeringHarness.sandboxPolicy.exactReplicaAllowedForStudy && engineeringHarness.sandboxPolicy.replicaExportAllowed === false, engineeringVerdict.errors.join("; "));
  check("engineering harness blocks final generator from raw replica", engineeringHarness.sandboxPolicy.rawReplicaReadableByFinalGenerator === false && engineeringHarness.stages.find((stage) => stage.id === "original-design-export")?.canAccessRawReplica === false);
  check("engineering harness requires hazard, simulation, engineer approval, and export verdict", ["hazard-analysis-receipt", "simulation-test-receipt", "human-engineer-approval", "export-eligibility-verdict"].every((receipt) => engineeringHarness.safetyPolicy.productionUseBlockedUntil.includes(receipt)));
  check("engineering break-glass records external override but never passes it", engineeringHarness.breakGlassPolicy.canRecordExternalOverrideRequest === true && engineeringHarness.breakGlassPolicy.overrideCanProducePassingVerdict === false);
  const unsafeEngineeringHarness = clone(engineeringHarness);
  unsafeEngineeringHarness.sandboxPolicy.replicaExportAllowed = true;
  unsafeEngineeringHarness.safetyPolicy.urgentModeDoesNotRelaxGates = false;
  unsafeEngineeringHarness.breakGlassPolicy.overrideCanProducePassingVerdict = true;
  const unsafeEngineeringVerdict = verifyEngineeringInventionHarness(unsafeEngineeringHarness);
  check("engineering harness rejects replica export, emergency gate relaxation, and passing break-glass", unsafeEngineeringVerdict.ok === false && unsafeEngineeringVerdict.errors.some((e) => e.includes("export must be blocked")) && unsafeEngineeringVerdict.errors.some((e) => e.includes("must not relax")) && unsafeEngineeringVerdict.errors.some((e) => e.includes("must not produce a passing")));
  const medicalHarness = makeEngineeringInventionHarness({
    goal: "Invent a life-support fixture from previous reference models.",
    riskLevel: "medical_or_life_support",
    urgency: "urgent",
    generatedAt: "2026-06-24T00:00:00.000Z",
  });
  const medicalVerdict = verifyEngineeringInventionHarness(medicalHarness);
  check("medical/life-support harness requires regulatory scope review", medicalVerdict.ok && medicalHarness.safetyPolicy.productionUseBlockedUntil.includes("regulatory-scope-review"), medicalVerdict.errors.join("; "));
  const deconstructionReceipt = makeFirstPrinciplesDeconstructionReceipt({
    goal: "Deconstruct a prior crew-seat reference into a clean functional spec.",
    projectId: "kestrel-seat",
    sourceDescription: "user-supplied photogrammetry of a third-party crew seat reference",
    generatedAt: "2026-06-24T00:00:00.000Z",
    originalInputHash: "sha256:abc123",
  });
  deconstructionReceipt.referenceSource.rightsClassification.copyrightStatus = "likely_protected";
  deconstructionReceipt.referenceSource.rightsClassification.trademarkStatus = "scrubbed";
  const deconstructionVerdict = verifyFirstPrinciplesDeconstructionReceipt(deconstructionReceipt);
  check("first-principles deconstruction receipt passes study-only clean-room shape", deconstructionVerdict.ok && deconstructionVerdict.warnings.some((warning) => warning.includes("patent")), deconstructionVerdict.errors.join("; "));
  const unsafeDeconstruction = clone(deconstructionReceipt);
  unsafeDeconstruction.replicaSandbox.exportCapability = true as false;
  unsafeDeconstruction.replicaSandbox.finalGeneratorCanAccessReplica = true as false;
  unsafeDeconstruction.functionalSpec.containsMeshData = true as false;
  unsafeDeconstruction.notices.notLegalOpinion = false as true;
  const unsafeDeconstructionVerdict = verifyFirstPrinciplesDeconstructionReceipt(unsafeDeconstruction);
  check("first-principles deconstruction rejects replica export, mesh leakage, and legal overclaim", unsafeDeconstructionVerdict.ok === false && unsafeDeconstructionVerdict.errors.some((e) => e.includes("exportCapability=false")) && unsafeDeconstructionVerdict.errors.some((e) => e.includes("must not access")) && unsafeDeconstructionVerdict.errors.some((e) => e.includes("must not contain mesh data")) && unsafeDeconstructionVerdict.errors.some((e) => e.includes("notLegalOpinion")));

  const fullProofPack = makeFullProofPack({
    goal: "fresh founder 3D proof",
    runId: "proof_smoke",
    deployedUrl: "https://example.com/solo-3d-proof",
    createdAt: "2026-06-24T00:00:00.000Z",
  });
  for (const artifact of fullProofPack.artifacts) {
    const body = artifact.kind.includes("video") || artifact.kind === "playwright-trace"
      ? "0".repeat(2048)
      : artifact.kind === "deployed-url"
        ? "https://example.com/solo-3d-proof\n"
        : JSON.stringify({ ok: true, artifact: artifact.id, frameInspection: true, video: true }).repeat(3);
    touch(artifact.path, body);
  }
  const fullProofVerdict = verifyFullProofPack(fullProofPack, { baseDir: proofRoot });
  check("full proof pack requires video/trace/deploy/assets/reopen/scorecard/trust evidence", fullProofVerdict.ok, fullProofVerdict.errors.join("; "));
  const noVideoProof = clone(fullProofPack);
  noVideoProof.artifacts = noVideoProof.artifacts.filter((artifact) => artifact.kind !== "fullscreen-video");
  const noVideoProofVerdict = verifyFullProofPack(noVideoProof, { baseDir: proofRoot });
  check("full proof pack rejects missing full-screen video", noVideoProofVerdict.ok === false && noVideoProofVerdict.errors.some((e) => e.includes("fullscreen-video")));

  const freshUserPlan = makeFreshUserEmulationPlan({
    caseId: "fresh-3d-001",
    userPrompt: "I want an AI app that can create 3D models from pictures for games and construction parts.",
    githubUrl: "https://github.com/example/fresh-founder-app",
  });
  const freshEvidence: Record<string, string> = {};
  for (const choice of freshUserPlan.requiredSetupChoices) freshEvidence[`choice:${choice}`] = touch(`fresh-user/choice-${choice}.json`, "{\"ok\":true}");
  for (const evidence of freshUserPlan.requiredEvidence) freshEvidence[evidence] = touch(`fresh-user/${evidence}.json`, "{\"ok\":true}");
  const freshUserReceipt: FreshUserEmulationReceipt = { ...freshUserPlan, actualEvidence: freshEvidence, completed: true };
  const freshUserVerdict = verifyFreshUserEmulationReceipt(freshUserReceipt, { baseDir: proofRoot });
  check("fresh-user emulation requires setup choices and proof evidence", freshUserVerdict.ok, freshUserVerdict.errors.join("; "));
  const missingFreshChoice = clone(freshUserReceipt);
  delete missingFreshChoice.actualEvidence["choice:database"];
  const missingFreshChoiceVerdict = verifyFreshUserEmulationReceipt(missingFreshChoice, { baseDir: proofRoot });
  check("fresh-user emulation rejects missing DB/provider choice evidence", missingFreshChoiceVerdict.ok === false && missingFreshChoiceVerdict.errors.some((e) => e.includes("database")));

  const trustRoot = makeTrustRootReceipt({
    runId: "proof_smoke",
    verifierCommand: "ci verify-proof proof_smoke",
    signedArtifacts: ["proof-verdict.json", "heldout-manifest.sig"],
    createdAt: "2026-06-24T00:00:00.000Z",
  });
  const trustRootVerdict = verifyTrustRootReceipt(trustRoot);
  check("trust root keeps held-out salt and verdict outside agent process", trustRootVerdict.ok, trustRootVerdict.errors.join("; "));
  const badTrustRoot = { ...trustRoot, agentCanWriteVerdict: true };
  const badTrustRootVerdict = verifyTrustRootReceipt(badTrustRoot);
  check("trust root rejects agent-writable verdicts", badTrustRootVerdict.ok === false && badTrustRootVerdict.errors.some((e) => e.includes("final verdict")));

  // ---------------- Build-to-delete: rework ledger ----------------
  console.log("\nReworkLedger (build-to-delete learning preservation):");
  const reworkLedger: ReworkLedger = makeReworkLedger({
    projectId: "smoke",
    entries: [
      {
        id: "empty-provider-tool-schema",
        oldApproach: "Advertise production tools with empty object schemas.",
        whyItSeemedRight: "The backend implementation had validation, so the provider schema looked secondary.",
        failureMode: "Model called tools without required query/sourceArtifactId/ops fields.",
        failureReceiptPath: touch("failures/fr-010-schema-loss.json", "{\"ok\":false}"),
        newApproach: "Generate provider-facing schemas from canonical contracts and test required args.",
        whyItSurvived: "Provider now sees required arguments before tool call generation.",
        proofReceiptPaths: [touch("proofs/provider-schema-parity.json", "{\"ok\":true}")],
        deletedArtifacts: ["empty tool schema fallback"],
        keptArtifacts: ["canonical tool implementation"],
        lesson: "The model only sees the provider contract; backend correctness is not enough.",
      },
    ],
  });
  const reworkVerdict = verifyReworkLedger(reworkLedger, { baseDir: proofRoot });
  check("rework ledger passes complete build-to-delete entry", reworkVerdict.ok, reworkVerdict.errors.join("; "));
  const noDeletionLedger: ReworkLedger = clone(reworkLedger);
  noDeletionLedger.entries[0].deletedArtifacts = [];
  const noDeletionVerdict = verifyReworkLedger(noDeletionLedger, { baseDir: proofRoot });
  check("rework ledger rejects entries that do not delete/deprecate anything", noDeletionVerdict.ok === false && noDeletionVerdict.errors.some((e) => e.includes("deleted")));

  // ---------------- Executable loop runner: phase receipt enforcement ----------------
  console.log("\nLoopRunner (phase receipts and proof-verdict enforcement):");
  const loopReceipt: LoopRunReceipt = makeLoopRunReceipt({
    projectPath: proofRoot,
    goal: "prove a fresh-room 3D app flow",
    createdAt: "2026-06-24T00:00:00.000Z",
  });
  check("loop phase order verifies before iterate", loopPhases.join(" -> ") === "discover -> benchmark -> setup -> build -> adapter -> verify -> iterate");
  const loopFiles: Record<string, string> = {};
  const makeLoopFile = (name: string, body = "ok") => {
    loopFiles[name] = touch(`loop/${name}`, body);
    return loopFiles[name];
  };
  for (const phase of loopReceipt.phases) {
    phase.status = "completed";
    phase.memoryReceiptPath = makeLoopFile(`${phase.phase}-memory.json`, "{\"ok\":true}");
  }
  loopReceipt.phases.find((phase) => phase.phase === "discover")!.artifacts = {
    "graph-context": makeLoopFile("graph-context.json"),
    "research-intake": makeLoopFile("research-intake.json"),
  };
  loopReceipt.phases.find((phase) => phase.phase === "benchmark")!.artifacts = {
    "benchmark-choice": makeLoopFile("benchmark-choice.json"),
    "heldout-manifest": makeLoopFile("heldout-manifest.json"),
  };
  loopReceipt.phases.find((phase) => phase.phase === "setup")!.artifacts = {
    "setup-gate": makeLoopFile("setup-gate.json"),
  };
  loopReceipt.phases.find((phase) => phase.phase === "build")!.artifacts = {
    "agent-api-contract": makeLoopFile("agent-api-contract.md"),
    "design-quality": makeLoopFile("design-quality.json"),
    "agent-chat-ux": makeLoopFile("agent-chat-ux.json"),
    "asset-quality": makeLoopFile("asset-quality.json"),
  };
  loopReceipt.phases.find((phase) => phase.phase === "adapter")!.artifacts = {
    "adapter-contract": makeLoopFile("adapter-contract.json"),
    "official-scorer-binding": makeLoopFile("official-scorer-binding.json"),
  };
  loopReceipt.phases.find((phase) => phase.phase === "iterate")!.artifacts = {
    "failure-hypothesis": makeLoopFile("failure-hypothesis.json"),
    "rework-ledger": makeLoopFile("rework-ledger.json"),
  };
  loopReceipt.phases.find((phase) => phase.phase === "verify")!.artifacts = {
    "proof-verdict": makeLoopFile("proof-verdict.json", "{\"ok\":true}"),
    "fresh-room-receipt": makeLoopFile("fresh-room-latest.json"),
    "design-quality": makeLoopFile("verify-design-quality.json"),
    "agent-chat-ux": makeLoopFile("verify-agent-chat-ux.json"),
    "asset-quality": makeLoopFile("verify-asset-quality.json"),
  };
  const loopVerdict = verifyLoopRunReceipt(loopReceipt, { baseDir: proofRoot });
  check("loop runner passes only when every phase receipt exists", loopVerdict.ok, loopVerdict.errors.join("; "));
  const noMemoryLoop = clone<LoopRunReceipt>(loopReceipt);
  noMemoryLoop.phases.find((phase) => phase.phase === "build")!.memoryReceiptPath = undefined;
  const noMemoryVerdict = verifyLoopRunReceipt(noMemoryLoop, { baseDir: proofRoot });
  check("loop runner rejects phase completion without memory receipt", noMemoryVerdict.ok === false && noMemoryVerdict.errors.some((e) => e.includes("memoryReceiptPath")));
  const badProofVerdictLoop = clone<LoopRunReceipt>(loopReceipt);
  writeFileSync(join(proofRoot, badProofVerdictLoop.phases.find((phase) => phase.phase === "verify")!.artifacts["proof-verdict"]!), "{\"ok\":false}", "utf8");
  const badProofVerdict = verifyLoopRunReceipt(badProofVerdictLoop, { baseDir: proofRoot });
  check("loop runner refuses done without passing proof-verdict.json", badProofVerdict.ok === false && badProofVerdict.errors.some((e) => e.includes("proof-verdict")));

  // ---------------- Nested phase RALPH: every major phase has its own gates ----------------
  console.log("\nPhaseRalph (nested R/A/L/P/H per loop phase):");
  const phaseRoot = mkdtempSync(join(tmpdir(), `solo-phase-ralph-${process.pid}-`));
  const missingVerifyGate = verifyPhaseRalph(phaseRoot, assertLoopPhase("verify"), "P");
  check("nested phase RALPH rejects missing verify proof receipts", missingVerifyGate.ok === false && missingVerifyGate.missing.some((item) => item.includes("proof-verdict")));
  for (const gate of phaseRalphGates.verify) {
    for (const receipt of gate.requiredReceipts) {
      completePhaseRalphReceipt(phaseRoot, { phase: "verify", stage: gate.stage, receiptId: receipt });
    }
  }
  const completeVerifyGate = verifyPhaseRalph(phaseRoot, "verify");
  check("nested phase RALPH accepts complete verify receipts", completeVerifyGate.ok, completeVerifyGate.errors.join("; "));
  const routeReceipt = makePhaseFailureRouteReceipt({
    toPhase: "build",
    reason: "verified UI proof showed the chat action protocol cannot express viewer edits",
    evidenceRefs: ["proof-verdict.json", "playwright-trace.zip"],
    createdAt: "2026-06-24T00:00:00.000Z",
  });
  check("phase route sends verified failures back to earlier phase", routeReceipt.fromPhase === "verify" && routeReceipt.toPhase === "build" && routeReceipt.evidenceRefs.length === 2);

  // ---------------- RALPH Loop Ledger: resumable milestone state ----------------
  console.log("\nRalphLoopLedger (.solo loop-state + events + receipt gates):");
  const ralphRoot = mkdtempSync(join(tmpdir(), `solo-ralph-${process.pid}-`));
  const ralph = createRalphLedger({
    repoPath: ralphRoot,
    goal: "build agent for this app",
    now: "2026-06-24T00:00:00.000Z",
    budgets: { maxUsd: 5, maxModelCalls: 20 },
  });
  const ralphLedgerPaths = ralphPaths(ralphRoot);
  check("RALPH init writes .solo/loop-state.json", existsSync(ralphLedgerPaths.statePath));
  check("RALPH init writes events.jsonl", existsSync(ralphLedgerPaths.eventsPath));
  check("RALPH init creates milestone receipt dirs", existsSync(join(ralphLedgerPaths.receiptsDir, "P-proof-run")));

  const blockedLiveBuild = startRalphMilestone(ralphRoot, "L");
  check("RALPH start-anywhere blocks when prior receipts are missing", blockedLiveBuild.verification.ok === false && blockedLiveBuild.verification.missing.some((item) => item.includes("A:benchmark-choice")));

  const ralphReceipt = (relative: string, body = "ok") => {
    const abs = join(ralphLedgerPaths.soloDir, relative);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, body, "utf8");
    return relative;
  };
  completeRalphMilestone(ralphRoot, "R", [
    ralphReceipt("receipts/R-reality/capability-spec.json"),
    ralphReceipt("receipts/R-reality/research-spine.json"),
    ralphReceipt("receipts/R-reality/graph-context.json"),
  ]);
  completeRalphMilestone(ralphRoot, "A", [
    ralphReceipt("receipts/A-acceptance-bar/benchmark-choice.json"),
    ralphReceipt("receipts/A-acceptance-bar/rubric.json"),
    ralphReceipt("receipts/A-acceptance-bar/heldout-split-policy.json"),
  ]);
  const liveBuildStart = startRalphMilestone(ralphRoot, "L");
  check("RALPH can start Live Build after R/A receipts exist", liveBuildStart.verification.ok, liveBuildStart.verification.errors.join("; "));

  completeRalphMilestone(ralphRoot, "L", [
    ralphReceipt("receipts/L-live-build/agent-api-contract.json"),
    ralphReceipt("receipts/L-live-build/design-brief.md"),
    ralphReceipt("receipts/L-live-build/build-note.md"),
  ]);
  completeRalphMilestone(ralphRoot, "P", [
    ralphReceipt("receipts/P-proof-run/fresh-room-receipt.json"),
    ralphReceipt("proof-verdict.json", "{\"ok\":false}"),
  ]);
  const badRalphProof = verifyRalphMilestone(ralphRoot, "P");
  check("RALPH proof milestone rejects failing proof-verdict", badRalphProof.ok === false && badRalphProof.errors.some((e) => e.includes("proof-verdict")));
  ralphReceipt("proof-verdict.json", "{\"ok\":true}");
  const goodRalphProof = verifyRalphMilestone(ralphRoot, "P");
  check("RALPH proof milestone accepts passing proof-verdict", goodRalphProof.ok, goodRalphProof.errors.join("; "));

  // ---------------- CLI command center: event bus + dashboard + agent matrix ----------------
  console.log("\nCommandCenter (events, hooks, dashboard):");
  const soloEvent = recordSoloEvent(ralphRoot, {
    event: "tool.post",
    agentHost: "codex",
    milestone: "P",
    phase: "verify",
    status: "ok",
    message: "smoke proof event",
    source: "smoke",
  });
  const soloEvents = readSoloEvents(ralphRoot, 10);
  check("universal SoloEvent appends to .solo/events.jsonl", soloEvent.id.startsWith("evt_") && soloEvents.some((event) => event.id === soloEvent.id));

  const matrix = makeAgentMatrixRows();
  const matrixText = formatAgentMatrix(matrix);
  check("agent matrix includes hook-native and proof-only hosts", ["codex", "claude-code", "windsurf", "generic"].every((id) => matrix.some((row) => row.id === id)) && matrix.some((row) => row.id === "generic" && row.selfReportedCompletionAllowed === false));
  check("agent matrix renders as CLI table", matrixText.includes("host | family") && matrixText.includes("self-report"));

  const codexHookPlan = makeHookInstallPlan("codex", "2026-06-24T00:00:00.000Z");
  check("hook plan writes shared recorder and Codex hook files", codexHookPlan.files.some((file) => file.path === ".solo/bin/record-event") && codexHookPlan.files.some((file) => file.path === ".codex/config.toml"));
  check("hook plan writes concrete lifecycle hook scripts", [".codex/hooks/solo-pre-tool.js", ".codex/hooks/solo-post-tool.js", ".codex/hooks/solo-stop.js"].every((path) => codexHookPlan.files.some((file) => file.path === path && file.executable === true)));
  check("hook plan carries no-self-report warning", codexHookPlan.warnings.some((warning) => warning.includes("Generic/no-hooks agents")));

  const piHookPlan = makeHookInstallPlan("pi", "2026-06-24T00:00:00.000Z");
  check("Pi hook plan writes YAML pack plus fresh judge bins", piHookPlan.files.some((file) => file.path === ".pi/hook/hooks.yaml") && piHookPlan.files.some((file) => file.path === ".solo/bin/sfn-session-idle-judge.js"));
  const hermesHookPlan = makeHookInstallPlan("hermes", "2026-06-24T00:00:00.000Z");
  check("Hermes hook plan writes shell hooks plus plugin scaffold", hermesHookPlan.files.some((file) => file.path === ".hermes/hooks.yaml") && hermesHookPlan.files.some((file) => file.path === ".hermes/plugins/solo_founder/plugin.py"));
  const openClawHookPlan = makeHookInstallPlan("openclaw", "2026-06-24T00:00:00.000Z");
  check("OpenClaw hook plan writes session-memory hook and plugin scaffold", openClawHookPlan.files.some((file) => file.path === ".openclaw/hooks/solo-session-memory/HOOK.md") && openClawHookPlan.files.some((file) => file.path === ".openclaw/plugin/solo-founder/plugin.ts"));
  const traeHookPlan = makeHookInstallPlan("trae", "2026-06-24T00:00:00.000Z", { mode: "generic-until-verified" });
  check("Trae hook plan stays generic-until-verified", traeHookPlan.files.some((file) => file.path === ".trae/rules/solo-founder-agent-builder.md") && traeHookPlan.warnings.some((warning) => warning.includes("generic-until-verified")));

  const noLoopJudgeRoot = mkdtempSync(join(tmpdir(), `solo-no-loop-judge-${process.pid}-`));
  const noLoopJudge = judgeCurrentLoop({ projectPath: noLoopJudgeRoot, lastAssistantMessage: "done" });
  check("fresh-context judge blocks completion without loop-state", noLoopJudge.verdict.verdict === "blocked" && noLoopJudge.verdict.blockClaim && noLoopJudge.verdict.missingReceipts.includes(".solo/loop-state.json"));

  const noComponentLedgerRoot = mkdtempSync(join(tmpdir(), `solo-no-component-ledger-${process.pid}-`));
  const noComponentLedger = createRalphLedger({ repoPath: noComponentLedgerRoot, goal: "prove a coherent 3D asset pipeline", now: "2026-06-24T00:00:00.000Z" });
  const noComponentReceipt = (relative: string, body = "ok") => {
    const abs = join(noComponentLedger.paths.soloDir, relative);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, body, "utf8");
    return relative;
  };
  completeRalphMilestone(noComponentLedgerRoot, "R", [
    noComponentReceipt("receipts/R-reality/capability-spec.json"),
    noComponentReceipt("receipts/R-reality/research-spine.json"),
    noComponentReceipt("receipts/R-reality/graph-context.json"),
  ]);
  completeRalphMilestone(noComponentLedgerRoot, "A", [
    noComponentReceipt("receipts/A-acceptance-bar/benchmark-choice.json"),
    noComponentReceipt("receipts/A-acceptance-bar/rubric.json"),
    noComponentReceipt("receipts/A-acceptance-bar/heldout-split-policy.json"),
  ]);
  completeRalphMilestone(noComponentLedgerRoot, "L", [
    noComponentReceipt("receipts/L-live-build/agent-api-contract.json"),
    noComponentReceipt("receipts/L-live-build/design-brief.md"),
    noComponentReceipt("receipts/L-live-build/build-note.md"),
  ]);
  startRalphMilestone(noComponentLedgerRoot, "P");
  completeRalphMilestone(noComponentLedgerRoot, "P", [
    noComponentReceipt("receipts/P-proof-run/fresh-room-receipt.json"),
    noComponentReceipt("proof-verdict.json", "{\"ok\":true}"),
  ]);
  const missingComponentLedgerJudge = judgeCurrentLoop({ projectPath: noComponentLedgerRoot, lastAssistantMessage: "done" });
  check(
    "fresh-context judge blocks 3D parent proof without component ledger",
    missingComponentLedgerJudge.verdict.verdict === "not_done" && missingComponentLedgerJudge.verdict.missingReceipts.includes(".solo/ledgers/component-ralph.json"),
    missingComponentLedgerJudge.verdict.reason,
  );

  const judgeRoot = mkdtempSync(join(tmpdir(), `solo-judge-${process.pid}-`));
  const judgeLedger = createRalphLedger({ repoPath: judgeRoot, goal: "prove a coherent 3D asset pipeline", now: "2026-06-24T00:00:00.000Z" });
  const missingResearchJudge = judgeCurrentLoop({ projectPath: judgeRoot, lastAssistantMessage: "done" });
  check("fresh-context judge routes missing discover receipts to research", missingResearchJudge.verdict.verdict === "needs_research" && missingResearchJudge.verdict.blockClaim && missingResearchJudge.verdict.missingReceipts.some((receipt) => receipt.includes("research-spine")));
  const judgeReceipt = (relative: string, body = "ok") => {
    const abs = join(judgeLedger.paths.soloDir, relative);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, body, "utf8");
    return relative;
  };
  completeRalphMilestone(judgeRoot, "R", [
    judgeReceipt("receipts/R-reality/capability-spec.json"),
    judgeReceipt("receipts/R-reality/research-spine.json"),
    judgeReceipt("receipts/R-reality/graph-context.json"),
  ], "2026-06-24T00:01:00.000Z");
  const notWholeLoopDoneJudge = judgeCurrentLoop({ projectPath: judgeRoot, lastAssistantMessage: "done" });
  check("fresh-context judge refuses whole-loop done after only R receipts", notWholeLoopDoneJudge.verdict.verdict === "not_done" && notWholeLoopDoneJudge.verdict.blockClaim && notWholeLoopDoneJudge.verdict.requiredNextActions.some((action) => action.command?.includes("loop start --from A")));

  const dashboard = renderDashboard(ralphRoot, { eventLimit: 8 });
  const dashboardSnapshot = makeDashboardSnapshot(ralphRoot, { eventLimit: 8 });
  check("dashboard renders loop, proof, metrics, and agent hosts", dashboard.includes("SOLO FOUNDER COMMAND CENTER") && dashboard.includes("Proof:") && dashboard.includes("Agent Hosts:"));
  check("dashboard snapshot exposes proof and event metrics", dashboardSnapshot.activeProof.status === "pass" && dashboardSnapshot.metrics.eventCount >= 1);

  const doctor = doctorRalphLoop(ralphRoot);
  check("loop doctor passes complete local command-center layout", doctor.ok && doctor.proofVerdict === "pass", doctor.errors.join("; "));
  const paused = pauseRalphLoop(ralphRoot, { message: "waiting for human provider key", nextAction: "npm run sfn -- setup gate" });
  check("loop pause records resumable blocker", paused.loop.status === "blocked" && paused.loop.milestones[paused.loop.currentMilestone].blockedOn?.nextAction.includes("setup gate") === true);

  // ---------------- SoloControlPlane: durable loop control ----------------
  console.log("\nSoloControlPlane (durable control plane):");
  const controlDb = join(tmpdir(), `solo-smoke-control-${process.pid}-${Date.now()}.db`);
  const control = new SoloControlPlane({ dbUrl: `file:${controlDb}` });
  await control.init();

  const missingContextLoop = await control.startLoop({ projectId: "smoke", goal: "missing context should block", budgetUsd: 1 });
  let missingContextBlocked = false;
  try {
    await control.startPhase(missingContextLoop.loopId, "benchmark");
  } catch {
    missingContextBlocked = true;
  }
  check("post-discover phase requires graph context", missingContextBlocked);

  const trigger = await control.ingestTrigger({
    source: "cron",
    idempotencyKey: "nightly-1",
    projectId: "smoke",
    goal: "run unattended loop",
    budgetUsd: 1,
    payload: { schedule: "nightly" },
  });
  const triggerAgain = await control.ingestTrigger({
    source: "cron",
    idempotencyKey: "nightly-1",
    projectId: "smoke",
    goal: "run unattended loop",
    budgetUsd: 1,
    payload: { schedule: "nightly" },
  });
  check("event trigger is idempotent", trigger.duplicate === false && triggerAgain.duplicate === true && trigger.loopId === triggerAgain.loopId);

  await control.attachContext(trigger.loopId, graphReceipt);
  const discover = await control.startPhase(trigger.loopId, "discover");
  await control.checkpointPhase(discover.phaseRunId, { graphReport: graphReceipt.reportPath });
  await control.completePhase(discover.phaseRunId, { graphReady: true });
  const benchmark = await control.startPhase(trigger.loopId, "benchmark");
  check("phase checkpoint starts after graph context", benchmark.attempt === 1);

  const approval = await control.requestApproval(trigger.loopId, "setup", { command: "pip install -r run/requirements.txt", spendUsd: 0 });
  check("approval request pauses loop", (await control.getLoop(trigger.loopId))?.status === "paused");
  await control.decideApproval(approval.approvalId, { decision: "approve", note: "local install allowed" });
  check("approval decision resumes loop", (await control.getLoop(trigger.loopId))?.status === "queued");

  const spendOk = await control.spend(trigger.loopId, 0.2, "model smoke");
  const trace = await control.recordTraceSpan(trigger.loopId, {
    phase: "iterate",
    name: "held-out clean probe",
    status: "error",
    startedAt: 100,
    endedAt: 175,
    tokens: 1200,
    costUsd: 0.1,
    attrs: { failureCluster: "missing exporter selector" },
  });
  const improve = await control.proposeImprovement({
    loopId: trigger.loopId,
    sourceTraceId: trace.traceId,
    title: "Make live-browser selector contract explicit",
    hypothesis: "The verifier failed because the app adapter guessed selectors.",
    patchHint: "Add selector receipts to the live browser adapter.",
  });
  const spendBlocked = await control.spend(trigger.loopId, 2, "overspend");
  check("budget meter allows in-policy spend", spendOk.allowed === true);
  check("budget meter blocks overspend", spendBlocked.allowed === false && (await control.getLoop(trigger.loopId))?.status === "paused");
  check("trace-sourced improvement is queued", improve.improvementId.startsWith("improve_"));

  const lease = await control.leaseWorktree(trigger.loopId, "reviewer", "D:/tmp/reviewer", "codex/reviewer");
  let duplicateLeaseBlocked = false;
  try {
    await control.leaseWorktree(trigger.loopId, "reviewer", "D:/tmp/reviewer2", "codex/reviewer2");
  } catch {
    duplicateLeaseBlocked = true;
  }
  await control.releaseWorktree(lease.leaseId);
  check("active worktree leases are exclusive per purpose", duplicateLeaseBlocked);

  const resumedControl = new SoloControlPlane({ dbUrl: `file:${controlDb}` });
  await resumedControl.init();
  const resumed = await resumedControl.resumeSummary(trigger.loopId);
  check("control state survives a fresh instance", resumed.loop.context?.status === "ready" && resumed.traceSummary.count === 1 && resumed.improvements.length === 1);

  console.log(`\n=== ${pass} passed, ${fail} failed ===\n`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
