// Turnkey proof of the local substrates. Run: npm i && npm run smoke
// Every S-mechanism is a pass/fail assertion; the process exits non-zero if any fails.
import { createClient } from "@libsql/client";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SoloLedger } from "./ledger/ledger";
import { SoloMemory } from "./memory/localMemory";
import { sealGold, contentGate } from "./ledger/contentGate";
import { sha256 } from "./ledger/hash";
import { inspectGraphContext, graphQueryPlan } from "./context/graphContext";
import { SoloControlPlane } from "./control/controlPlane";
import { make3dAgentResearchPack, top3dComparisonRubric, verifyResearchPack, type ResearchPack } from "./research/researchSpine";
import { designSkillRegistry, makeDesignFullFlow, recommendDesignSkills, verifyDesignFullFlow, verifyDesignSkillPlan, type DesignFullFlowPlan } from "./design/designSkillBridge";
import { gstackRoleRegistry, recommendGstackLanes, verifyGstackPlan, type GstackReviewPlan } from "./gstack/gstackBridge";

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

  // ---------------- Research spine: research-backed implementation gate ----------------
  console.log("\nResearchSpine (research-backed decisions + proof target):");
  const researchPack = make3dAgentResearchPack({
    goal: "Fresh founder asks for an AI app that creates 3D models from pictures.",
    generatedAt: "2026-06-23T00:00:00.000Z",
  });
  const researchVerdict = verifyResearchPack(researchPack, { now: new Date("2026-06-23T12:00:00.000Z") });
  check("complete 3D-agent research pack passes", researchVerdict.ok, researchVerdict.errors.join("; "));

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
  unsupportedClaim.claims[1].proofArtifactIds = [];
  unsupportedClaim.claims[1].sourceIds = [];
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
