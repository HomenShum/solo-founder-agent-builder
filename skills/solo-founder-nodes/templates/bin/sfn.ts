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
import {
  make3dAgentResearchPack,
  researchDomains,
  top3dComparisonRubric,
  verifyResearchPack,
  type ProofArtifact,
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
  gstackRiskLevels,
  gstackRoleRegistry,
  recommendGstackLanes,
  soloLoopPhases,
  verifyGstackPlan,
  type GstackRiskLevel,
  type SoloLoopPhase,
} from "../gstack/gstackBridge";

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

function firstPositional(args: string[], fallback: string) {
  for (let i = 0; i < args.length; i++) {
    const prev = args[i - 1];
    if (!args[i].startsWith("--") && !(prev && prev.startsWith("--"))) return args[i];
  }
  return fallback;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJson(path: string, value: unknown) {
  writeFileSync(path, `${JSON.stringify(value, jbig, 2)}\n`, "utf8");
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

function parseSoloPhase(value?: string): SoloLoopPhase {
  if (value && soloLoopPhases.includes(value as SoloLoopPhase)) return value as SoloLoopPhase;
  throw new Error(`unsupported phase '${value ?? ""}' (expected one of: ${soloLoopPhases.join(", ")})`);
}

function parseGstackRisk(value?: string): GstackRiskLevel {
  if (value && gstackRiskLevels.includes(value as GstackRiskLevel)) return value as GstackRiskLevel;
  throw new Error(`unsupported gstack risk '${value ?? ""}' (expected one of: ${gstackRiskLevels.join(", ")})`);
}

const HELP = `sfn — Solo Founder Nodes local CLI   (run via: npm run sfn -- <cmd>)

  doctor                      check node + deps readiness
  smoke                       run the substrate proof (expect all assertions to pass)
  conformance                 run the cross-agent portability probe (PASS + receipt)
  context inspect [root]      inspect Graphify-style graph context receipt
  control start --project <p> --goal <g> [--budget <n>] [--root <path>]
  control status <loopId>     print durable loop status/resume summary
  control trigger --source <s> --key <k> --project <p> --goal <g> [--budget <n>]
  research init --goal <g> --domain <d> [--out <file>]
  research verify [file] [--max-age-days <n>]
  proof init --goal <g> --domain <d> [--out <dir>]
  proof start --run <dir>
  proof collect --run <dir> --artifact <id> --path <path> [--sha256 <hash>]
  proof verdict --run <dir>
  compare top3d [--out <file>]  print/write the 3D provider comparison rubric
  design registry [--out <file>]
  design recommend --surface <kind> [--stack <s>] [--runtime <r>] [--style <preset>] [--platform <p>] [--animation] [--visuals] [--mobile] [--shadcn] [--shadcn-mcp] [--out <file>]
  design flow --surface <kind> [--category <c>] [--stack <s>] [--runtime <r>] [--style <preset>] [--platform <p>] [--animation] [--visuals] [--mobile] [--shadcn] [--shadcn-mcp] [--out <file>]
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
    case "research": {
      const sub = rest[0];
      if (sub === "init") {
        const goal = flag(rest, "--goal");
        const domain = parseDomain(flag(rest, "--domain", "3d-generation"));
        const out = resolve(flag(rest, "--out") ?? "research-spine.json");
        if (!goal) {
          console.error("research init --goal <g> --domain <d> [--out <file>]");
          process.exit(2);
        }
        const pack = make3dAgentResearchPack({ goal, domain });
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
        if (!goal) {
          console.error("proof init --goal <g> --domain <d> [--out <dir>]");
          process.exit(2);
        }
        const stamp = new Date().toISOString().replace(/[:.]/g, "-");
        const out = resolve(flag(rest, "--out") ?? join("proof-runs", `${slugify(goal)}-${stamp}`));
        mkdirSync(out, { recursive: true });
        const pack = make3dAgentResearchPack({ goal, domain });
        const manifest = {
          schemaVersion: 1,
          goal,
          domain,
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
      if (sub === "verdict") {
        const runDir = flag(rest, "--run");
        if (!runDir) {
          console.error("proof verdict --run <dir>");
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
      console.error("proof: init | start | collect | verdict");
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
      console.error("design: registry | recommend | flow");
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
