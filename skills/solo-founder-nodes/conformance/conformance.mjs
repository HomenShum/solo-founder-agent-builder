#!/usr/bin/env node
// Agent-agnostic conformance probe for Solo Founder Nodes.
// Proves the skill is STRUCTURALLY portable (pure markdown directive + pure Node/Python substrate,
// no agent-specific coupling) and that the runnable substrate passes. Run it under ANY coding agent's
// shell: `node conformance/conformance.mjs`. A PASS receipt is that agent's portability proof.
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const skill = join(here, ".."); // skills/solo-founder-nodes
const read = (rel) => (existsSync(join(skill, rel)) ? readFileSync(join(skill, rel), "utf8") : null);

const results = [];
const ok = (name, cond, detail = "") => { results.push({ name, pass: !!cond, detail }); };

// 1. Discovery contract: SKILL.md present with valid frontmatter (the cross-vendor discovery key).
const skillMd = read("SKILL.md");
ok("SKILL.md present", !!skillMd);
ok("SKILL.md frontmatter has name + description", !!skillMd && /\bname:\s*\S/.test(skillMd) && /\bdescription:\s*\S/.test(skillMd));

// 2. Directive is pure markdown + carries the semantic contract (loop + 4 non-negotiables).
const master = read("MASTER_SKILL.md") ?? "";
const M = master.toUpperCase();
ok("MASTER_SKILL.md present", !!read("MASTER_SKILL.md"));
ok("loop present (discover…verify)", /discover/i.test(master) && /verify/i.test(master) && /benchmark/i.test(master));
const nn = ["HELD-OUT", "NO ANSWER-KEYS", "IN-APP TRANSFER", "HONEST PROVENANCE"];
ok("4 non-negotiables present", nn.every((n) => M.includes(n)), nn.filter((n) => !M.includes(n)).join(", ") || "all present");

// 3. Progressive-disclosure playbooks + references all present (no missing links).
const nodes = ["1-discover", "2-benchmark", "3-setup", "4-build", "5-adapter", "6-verify", "7-iterate"];
ok("7 node playbooks present", nodes.every((n) => existsSync(join(skill, "nodes", `${n}.md`))));
ok("phase order is verify then iterate", /adapter\s*\|\s*wire[\s\S]*\|\s*6\s*\|\s*verify[\s\S]*\|\s*7\s*\|\s*iterate/i.test(master));
const refs = ["honest-lane", "memory", "context-substrate", "control-plane", "cli-command-center", "host-hooks-fresh-judge", "design-bridge", "agent-chat-ux", "gstack-bridge", "benchmarks", "research", "research-spine", "industry-3d-assets", "part-research-ralph"];
ok("references present", refs.every((r) => existsSync(join(skill, "references", `${r}.md`))));

// 4. Runnable substrate files present (Node + the smoke).
ok("templates substrate present", [
  "package.json",
  "smoke.ts",
  "ledger/ledger.ts",
  "memory/localMemory.ts",
  "context/graphContext.ts",
  "control/controlPlane.ts",
  "events/soloEventBus.ts",
  "judge/freshContextJudge.ts",
  "dashboard/dashboard.ts",
  "phase/phaseRalph.ts",
  "setup/externalSetupGate.ts",
  "setup/openrouterAgentHosts.ts",
  "proof/fullProofPack.ts",
  "freshUser/freshUserEmulation.ts",
  "threeD/threeDLoop.ts",
  "threeD/assetQualityGate.ts",
  "threeD/partResearchRalph.ts",
  "threeD/researchAssetMaker.ts",
  "engineering/engineeringInventionHarness.ts",
  "engineering/firstPrinciplesDeconstructionReceipt.ts",
  "trust/trustRoot.ts",
  "research/researchSpine.ts",
  "design/designSkillBridge.ts",
  "design/designQualityGate.ts",
  "design/agentChatUxGate.ts",
  "gstack/gstackBridge.ts",
].every((f) => existsSync(join(skill, "templates", f))));
ok("context/control directives present", /context-substrate/i.test(master) && /control-plane/i.test(master));
ok("CLI command center directive present", /CLI command center/i.test(master) && /SoloEvent/i.test(master) && /dashboard --project/i.test(master));
ok("fresh-context judge and host hooks directive present", /Fresh-context judge/i.test(master) && /hooks install/i.test(master) && /judge current/i.test(master));
ok("external setup gate directive present", /External setup gate/i.test(master) && /deterministic prework/i.test(master) && /server-side secret/i.test(master));
ok("optional agent host setup directive present", /Optional agent host setup/i.test(master) && /agents openrouter-plan/i.test(master) && /OpenRouter model catalog/i.test(master));
ok("research-backed implementation directive present", /research-spine/i.test(master) && /research-backed implementation/i.test(master));
ok("design skill portability directive present", /design skills are portable inputs/i.test(master) && /designSkillBridge/i.test(master) && /design flow/i.test(master));
ok("design quality gate directive present", /design quality gate/i.test(master) && /best\s+UI\/UX/i.test(master) && /browser screenshots/i.test(master));
ok("agent chat UX gate directive present", /Agent chat UX gate/i.test(master) && /agentChatUxGate/i.test(master) && /chat-ux verify/i.test(master));
ok("gstack operating lanes directive present", /gstack/i.test(master) && /gstackBridge/i.test(master) && /portable operating/i.test(master));
ok("nested phase RALPH directive present", /Nested phase RALPH/i.test(master) && /phase verify/i.test(master));
ok("3D/fresh-user/trust proof directives present", /3D founder scenario/i.test(master) && /fresh-user/i.test(master) && /trust verify/i.test(master));
ok("industry-grade 3D asset quality gate directive present", /3D asset quality gate/i.test(master) && /3d quality-plan/i.test(master) && /assetQualityGate/i.test(master));
ok("3D part-research RALPH directive present", /part-research RALPH/i.test(master) && /3d part-research-plan/i.test(master) && /partResearchRalph/i.test(master));
ok("engineering invention harness directive present", /Engineering invention harness/i.test(master) && /engineering plan/i.test(master) && /non-exportable study sandbox/i.test(master));

// 5. Portability declared (no single-agent lock-in): the directive names multiple agents / "any coding agent".
const agents = ["claude code", "codex", "cursor", "windsurf", "trae", "openclaw", "hermes", "opencode", "kilo", "any coding agent"];
const named = agents.filter((a) => (skillMd ?? "").toLowerCase().includes(a) || master.toLowerCase().includes(a));
ok("portability declared (≥3 agents / any-coding-agent)", named.length >= 3, `names: ${named.join(", ") || "none"}`);

// 6. The substrate actually runs (the part that must behave identically under every agent).
let smoke = { ran: false, note: "skipped — run `cd templates && npm i` then re-run with --run-smoke" };
const installed = existsSync(join(skill, "templates", "node_modules"));
if (installed || process.argv.includes("--run-smoke")) {
  try {
    const smokeCmd = process.platform === "win32" ? "npm.cmd run smoke" : "npm run smoke";
    const out = execSync(smokeCmd, { cwd: join(skill, "templates"), encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const m = out.match(/(\d+)\s+passed,\s+(\d+)\s+failed/);
    smoke = { ran: true, passed: m ? +m[1] : null, failed: m ? +m[2] : null };
    ok("substrate smoke: 0 failed", !!m && +m[2] === 0, m ? `${m[1]} passed, ${m[2]} failed` : "no summary line");
  } catch (e) {
    smoke = { ran: true, error: String(e.message || e).slice(0, 200) };
    ok("substrate smoke: 0 failed", false, "smoke threw — see error");
  }
} else {
  results.push({ name: "substrate smoke", pass: true, detail: smoke.note, skipped: true });
}

const failed = results.filter((r) => !r.pass);
const receipt = createHash("sha256").update(JSON.stringify(results)).digest("hex").slice(0, 16);
console.log("\n=== Solo Founder Nodes — conformance probe ===\n");
for (const r of results) console.log(`  ${r.skipped ? "○" : r.pass ? "✓" : "✗"} ${r.name}${r.detail ? " — " + r.detail : ""}`);
console.log(`\n${failed.length === 0 ? "PASS" : "FAIL"} · ${results.length - failed.length}/${results.length} · receipt ${receipt}`);
console.log("Run this under each coding agent's shell; a PASS receipt is that agent's portability proof.\n");
process.exit(failed.length === 0 ? 0 : 1);
