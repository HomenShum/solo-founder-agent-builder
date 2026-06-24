export const researchSourceKinds = ["paper", "official-doc", "product", "benchmark", "dataset"] as const;
export type ResearchSourceKind = (typeof researchSourceKinds)[number];

export const researchDomains = ["agent-loop", "coding-agent", "3d-generation", "deployment", "eval"] as const;
export type ResearchDomain = (typeof researchDomains)[number];

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  kind: ResearchSourceKind;
  domain: ResearchDomain;
  verifiedAt: string;
}

export interface ResearchRequirement {
  id: string;
  userNeed: string;
  deliverable: string;
  evidence: string;
}

export interface EvalMetric {
  id: string;
  name: string;
  grader: string;
  sourceIds: string[];
}

export interface ProofArtifact {
  id: string;
  kind:
    | "fullscreen-video"
    | "terminal-transcript"
    | "playwright-trace"
    | "playwright-video"
    | "deployed-url"
    | "generated-asset"
    | "provider-costs"
    | "scorecard"
    | "decision-log"
    | "recording-audit";
  description: string;
  required: boolean;
  path?: string;
  sha256?: string;
}

export interface ImplementationDecision {
  requirementId: string;
  chosenApproach: string;
  rejectedAlternatives: string[];
  researchSourceIds: string[];
  inspirationSourceIds: string[];
  evalMetricIds: string[];
  risk: string;
}

export interface ResearchClaim {
  id: string;
  requirementId: string;
  claimType: "plan" | "capability" | "result";
  claim: string;
  status: "supported" | "unsupported_assumption" | "rejected";
  risk: "minor" | "major";
  sourceIds: string[];
  proofArtifactIds: string[];
}

export interface ResearchPack {
  schemaVersion: 1;
  goal: string;
  domain: ResearchDomain;
  generatedAt: string;
  requirements: ResearchRequirement[];
  sources: ResearchSource[];
  decisions: ImplementationDecision[];
  claims: ResearchClaim[];
  evalMetrics: EvalMetric[];
  proofArtifacts: ProofArtifact[];
  assumptions: string[];
}

export interface ResearchVerificationOptions {
  now?: Date;
  maxSourceAgeDays?: number;
  requireProofArtifactPaths?: boolean;
}

export interface ResearchVerificationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    sources: number;
    requirements: number;
    decisions: number;
    claims: number;
    evalMetrics: number;
    proofArtifacts: number;
  };
}

const verifiedAt = "2026-06-23";
const msPerDay = 24 * 60 * 60 * 1000;

function source(
  id: string,
  title: string,
  url: string,
  kind: ResearchSourceKind,
  domain: ResearchDomain,
): ResearchSource {
  return { id, title, url, kind, domain, verifiedAt };
}

export function make3dAgentResearchPack(args: {
  goal: string;
  generatedAt?: string;
  domain?: ResearchDomain;
}): ResearchPack {
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const domain = args.domain ?? "3d-generation";
  const sources: ResearchSource[] = [
    source("react", "ReAct: Synergizing Reasoning and Acting in Language Models", "https://arxiv.org/abs/2210.03629", "paper", "agent-loop"),
    source("toolformer", "Toolformer: Language Models Can Teach Themselves to Use Tools", "https://arxiv.org/abs/2302.04761", "paper", "agent-loop"),
    source("memgpt", "MemGPT: Towards LLMs as Operating Systems", "https://arxiv.org/abs/2310.08560", "paper", "agent-loop"),
    source("webarena", "WebArena: A Realistic Web Environment for Building Autonomous Agents", "https://arxiv.org/abs/2307.13854", "benchmark", "agent-loop"),
    source("osworld", "OSWorld: Benchmarking Multimodal Agents for Open-Ended Tasks in Real Computer Environments", "https://arxiv.org/abs/2404.07972", "benchmark", "agent-loop"),
    source("swe-bench", "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?", "https://arxiv.org/abs/2310.06770", "benchmark", "coding-agent"),
    source("swe-evo", "SWE-EVO: Benchmarking Coding Agents in Long-Horizon Software Evolution", "https://arxiv.org/html/2512.18470v5", "benchmark", "coding-agent"),
    source("coding-agents-e2e", "Benchmarking AI Coding Agents on End-to-End Project Development", "https://arxiv.org/html/2602.01655v1", "benchmark", "coding-agent"),
    source("rigorous-agent-benchmarks", "Establishing Best Practices for Building Rigorous Agentic Benchmarks", "https://arxiv.org/html/2507.02825v5", "paper", "eval"),
    source("dreamfusion", "DreamFusion: Text-to-3D using 2D Diffusion", "https://arxiv.org/abs/2209.14988", "paper", "3d-generation"),
    source("magic3d", "Magic3D: High-Resolution Text-to-3D Content Creation", "https://arxiv.org/abs/2211.10440", "paper", "3d-generation"),
    source("shap-e", "Shap-E: Generating Conditional 3D Implicit Functions", "https://arxiv.org/abs/2305.02463", "paper", "3d-generation"),
    source("gaussian-splatting", "3D Gaussian Splatting for Real-Time Radiance Field Rendering", "https://arxiv.org/abs/2308.04079", "paper", "3d-generation"),
    source("dust3r", "DUSt3R: Geometric 3D Vision Made Easy", "https://arxiv.org/abs/2312.14132", "paper", "3d-generation"),
    source("instantmesh", "InstantMesh: Efficient 3D Mesh Generation from a Single Image", "https://arxiv.org/abs/2404.07191", "paper", "3d-generation"),
    source("trellis", "TRELLIS: Structured 3D Latents for Scalable 3D Generation", "https://arxiv.org/abs/2412.01506", "paper", "3d-generation"),
    source("hunyuan3d-21", "Hunyuan3D 2.1: From Images to High-Fidelity 3D Assets", "https://arxiv.org/html/2506.15442v1", "paper", "3d-generation"),
    source("p3d-bench", "P3D-Bench: Benchmarking MLLMs for Parametric 3D Generation", "https://arxiv.org/html/2606.11152v2", "benchmark", "eval"),
    source("hy3d-bench", "HY3D-Bench: Generation of 3D Assets", "https://arxiv.org/html/2602.03907v1", "benchmark", "eval"),
    source("gpt-eval-3d", "GPTEval3D: Using GPT-4V to Evaluate 3D Asset Generation", "https://arxiv.org/abs/2401.04092", "paper", "eval"),
    source("meshy-api", "Meshy API", "https://www.meshy.ai/api", "product", "3d-generation"),
    source("tripo", "Tripo 3D", "https://www.tripo3d.ai/", "product", "3d-generation"),
    source("hyper3d-rodin", "Hyper3D Rodin", "https://hyper3d.ai/", "product", "3d-generation"),
    source("luma", "Luma AI", "https://lumalabs.ai/", "product", "3d-generation"),
    source("colmap", "COLMAP Tutorial", "https://colmap.github.io/tutorial.html", "official-doc", "3d-generation"),
    source("msplat", "msplat", "https://github.com/rayanht/msplat", "product", "3d-generation"),
    source("depth-anything", "Depth Anything 3 CLI", "https://github.com/ByteDance-Seed/Depth-Anything-3/blob/main/docs/CLI.md", "official-doc", "3d-generation"),
    source("vercel", "Vercel Platform", "https://vercel.com/docs", "official-doc", "deployment"),
    source("supabase", "Supabase Docs", "https://supabase.com/docs", "official-doc", "deployment"),
    source("convex", "Convex Docs", "https://docs.convex.dev/home", "official-doc", "deployment"),
    source("gstack", "garrytan/gstack", "https://github.com/garrytan/gstack", "product", "coding-agent"),
  ];

  const requirements: ResearchRequirement[] = [
    {
      id: "req-fresh-founder-intake",
      userNeed: "A non-technical founder can provide only a GitHub URL plus a vague idea.",
      deliverable: "A written, research-backed capability spec with explicit assumptions and defaults.",
      evidence: "Screenshot-only 3D app need and founder-agent workflow.",
    },
    {
      id: "req-3d-generate",
      userNeed: "Create a real 3D model from a picture or text prompt for objects like cars, planes, game assets, and parts.",
      deliverable: "A generated GLB/USDZ-compatible asset surfaced in a browser viewer.",
      evidence: "Screenshots mention picture-to-3D, game assets, Blender, AutoCAD, and construction parts.",
    },
    {
      id: "req-chat-edit-view",
      userNeed: "Chat with an AI agent that acts inside the 3D viewer instead of just describing.",
      deliverable: "Structured viewer actions such as fly_to, look_at, rotate, zoom, highlight, and reset_view.",
      evidence: "Devpost reference screenshot describes MCP-style JSON camera actions.",
    },
    {
      id: "req-software-export",
      userNeed: "Use the artifact in the user's software of choice.",
      deliverable: "Export/download path plus explicit Blender-friendly and CAD-stretch status.",
      evidence: "Screenshots mention Blender and AutoCAD workflows.",
    },
    {
      id: "req-deploy-use",
      userNeed: "Make the app usable by customers or hackathon judges.",
      deliverable: "A deployed URL with persisted inputs, generated assets, run status, and provider cost ledger.",
      evidence: "Founder proof target requires production deployment and judge/customer use.",
    },
    {
      id: "req-proof-run",
      userNeed: "Prove the app works for a fresh non-technical user session.",
      deliverable: "Full-screen recording, terminal transcript, Playwright trace/video, deployed URL, assets, and scorecard.",
      evidence: "User requested a full end-to-end video and emulated fresh-person flow.",
    },
    {
      id: "req-compare-top3d",
      userNeed: "Evaluate against top companies and inspirational references.",
      deliverable: "Comparator scorecard against Meshy, Tripo, Rodin/Hyper3D, and Luma.",
      evidence: "User asked to evaluate against top companies and top inspirational references.",
    },
  ];

  const evalMetrics: EvalMetric[] = [
    {
      id: "metric-asset-validity",
      name: "Asset validity",
      grader: "Open generated GLB/USDZ, verify loadable geometry/materials, and record file hash.",
      sourceIds: ["hy3d-bench", "p3d-bench"],
    },
    {
      id: "metric-visual-alignment",
      name: "Visual and prompt alignment",
      grader: "Score against input prompt/image using human-aligned 3D eval rubric and screenshot evidence.",
      sourceIds: ["gpt-eval-3d", "hy3d-bench"],
    },
    {
      id: "metric-agentic-ui-completion",
      name: "Real UI task completion",
      grader: "Fresh browser session drives upload/chat/generate/view/export through the deployed app.",
      sourceIds: ["webarena", "osworld", "rigorous-agent-benchmarks"],
    },
    {
      id: "metric-cost-latency",
      name: "Cost and latency",
      grader: "Measure provider runtime, queue time, failure state, and dollar cost per generated asset.",
      sourceIds: ["coding-agents-e2e", "rigorous-agent-benchmarks"],
    },
    {
      id: "metric-editability-export",
      name: "Editability and export utility",
      grader: "Verify the exported artifact can be downloaded and opened in a target viewer; Blender is v1, CAD-native is stretch.",
      sourceIds: ["p3d-bench", "hunyuan3d-21"],
    },
  ];

  const proofArtifacts: ProofArtifact[] = [
    { id: "artifact-fullscreen-video", kind: "fullscreen-video", required: true, description: "Full-screen recording of the fresh founder-style session." },
    { id: "artifact-recording-audit", kind: "recording-audit", required: true, description: "Visual inspection receipt for videos, rejected recordings, and sampled frame checks." },
    { id: "artifact-terminal-transcript", kind: "terminal-transcript", required: true, description: "Terminal transcript from the coding-agent session." },
    { id: "artifact-playwright-trace", kind: "playwright-trace", required: true, description: "Playwright trace proving real UI upload/chat/view/export." },
    { id: "artifact-playwright-video", kind: "playwright-video", required: true, description: "Browser video for the real app flow." },
    { id: "artifact-deployed-url", kind: "deployed-url", required: true, description: "Live deployment URL used by judges/customers." },
    { id: "artifact-generated-assets", kind: "generated-asset", required: true, description: "Generated GLB/USDZ or viewer-compatible asset files." },
    { id: "artifact-provider-costs", kind: "provider-costs", required: true, description: "Provider cost, latency, and failure-state ledger." },
    { id: "artifact-comparator-scorecard", kind: "scorecard", required: true, description: "Scorecard against Meshy, Tripo, Rodin/Hyper3D, and Luma." },
    { id: "artifact-decision-log", kind: "decision-log", required: true, description: "Implementation decisions with research and practical references." },
  ];

  const decisions: ImplementationDecision[] = [
    {
      requirementId: "req-3d-generate",
      chosenApproach: "Build v1 around provider-backed single-image/text-to-3D generation with GLB/USDZ export and a mock lane for deterministic smoke tests.",
      rejectedAlternatives: [
        "Local arbitrary multi-photo reconstruction as the default v1.",
        "Claiming production-ready humanoid rigging or motion tracking before a separate proof lane exists.",
      ],
      researchSourceIds: ["instantmesh", "trellis", "hunyuan3d-21", "hy3d-bench"],
      inspirationSourceIds: ["meshy-api", "tripo", "hyper3d-rodin", "luma"],
      evalMetricIds: ["metric-asset-validity", "metric-visual-alignment", "metric-cost-latency"],
      risk: "Provider APIs and quality vary; arbitrary reconstruction and rigging stay stretch until separately proved.",
    },
    {
      requirementId: "req-chat-edit-view",
      chosenApproach: "Expose a structured viewer action protocol that lets the chat agent return natural language plus JSON camera/viewer actions.",
      rejectedAlternatives: ["Free-form chat that only describes where to look.", "Unstructured DOM scripting without a typed action contract."],
      researchSourceIds: ["react", "toolformer", "webarena", "osworld"],
      inspirationSourceIds: ["gstack"],
      evalMetricIds: ["metric-agentic-ui-completion"],
      risk: "The action protocol proves viewer control; it does not prove semantic 3D understanding unless the UI trace and eval score also pass.",
    },
    {
      requirementId: "req-deploy-use",
      chosenApproach: "Default to Next.js on Vercel with Supabase or Convex persistence and object storage for source images plus generated assets.",
      rejectedAlternatives: ["Local-only demo with no customer URL.", "Ephemeral in-memory assets that disappear after the session."],
      researchSourceIds: ["coding-agents-e2e", "swe-evo", "rigorous-agent-benchmarks"],
      inspirationSourceIds: ["vercel", "supabase", "convex"],
      evalMetricIds: ["metric-agentic-ui-completion", "metric-cost-latency"],
      risk: "Deployment proof must include the actual live URL and persistence receipts, not just build output.",
    },
    {
      requirementId: "req-proof-run",
      chosenApproach: "Treat the proof run as a first-class artifact pack: full-screen video, terminal transcript, Playwright trace/video, deployed URL, assets, costs, and scorecard.",
      rejectedAlternatives: ["A written claim that the app works.", "A harness-only benchmark score without real UI evidence."],
      researchSourceIds: ["webarena", "osworld", "swe-bench", "rigorous-agent-benchmarks"],
      inspirationSourceIds: ["gstack"],
      evalMetricIds: ["metric-agentic-ui-completion", "metric-cost-latency"],
      risk: "An emulation is not a real human study; label it as fresh-user emulation unless a real participant performs the session.",
    },
    {
      requirementId: "req-compare-top3d",
      chosenApproach: "Run a comparator scorecard against Meshy, Tripo, Rodin/Hyper3D, and Luma using the same prompts/images where API access allows.",
      rejectedAlternatives: ["Cherry-picking one provider.", "Ranking by marketing claims instead of artifacts, cost, latency, and UI completion."],
      researchSourceIds: ["hy3d-bench", "p3d-bench", "gpt-eval-3d"],
      inspirationSourceIds: ["meshy-api", "tripo", "hyper3d-rodin", "luma"],
      evalMetricIds: ["metric-asset-validity", "metric-visual-alignment", "metric-cost-latency", "metric-editability-export"],
      risk: "Provider availability and terms can change; every comparison must record the date, API lane, and generated artifacts.",
    },
    {
      requirementId: "req-software-export",
      chosenApproach: "Make Blender-friendly export part of v1 and label CAD-native/AutoCAD workflows as a stretch lane until parametric/CAD evaluation is added.",
      rejectedAlternatives: ["Claiming AutoCAD-native construction-part readiness from a mesh-only demo."],
      researchSourceIds: ["p3d-bench", "hunyuan3d-21", "gaussian-splatting"],
      inspirationSourceIds: ["colmap", "depth-anything", "msplat"],
      evalMetricIds: ["metric-editability-export"],
      risk: "Mesh export can support viewing/reference; CAD-grade parametric solids need a separate benchmark and proof.",
    },
  ];

  const claims: ResearchClaim[] = [
    {
      id: "claim-v1-realistic",
      requirementId: "req-3d-generate",
      claimType: "plan",
      claim: "A realistic v1 is provider-backed image/text-to-3D with export and viewer proof, not arbitrary local reconstruction.",
      status: "supported",
      risk: "major",
      sourceIds: ["instantmesh", "trellis", "hunyuan3d-21", "meshy-api", "tripo"],
      proofArtifactIds: [],
    },
    {
      id: "claim-agent-acts-in-ui",
      requirementId: "req-chat-edit-view",
      claimType: "capability",
      claim: "The agent acts in the viewer only when the real UI trace shows structured actions executed in the browser.",
      status: "supported",
      risk: "major",
      sourceIds: ["react", "toolformer", "webarena", "osworld"],
      proofArtifactIds: ["artifact-playwright-trace", "artifact-playwright-video"],
    },
    {
      id: "claim-deployed-proof",
      requirementId: "req-proof-run",
      claimType: "result",
      claim: "The build is judge/customer usable only after the deployed URL, persistence, generated assets, and full UI trace are present.",
      status: "supported",
      risk: "major",
      sourceIds: ["webarena", "osworld", "rigorous-agent-benchmarks", "vercel"],
      proofArtifactIds: ["artifact-fullscreen-video", "artifact-recording-audit", "artifact-terminal-transcript", "artifact-playwright-trace", "artifact-deployed-url", "artifact-generated-assets"],
    },
    {
      id: "claim-cad-native-stretch",
      requirementId: "req-software-export",
      claimType: "capability",
      claim: "CAD-native construction-part generation is a stretch lane; v1 may show mesh reference viewing, not AutoCAD-grade parametric solids.",
      status: "unsupported_assumption",
      risk: "major",
      sourceIds: ["p3d-bench", "colmap", "gaussian-splatting"],
      proofArtifactIds: [],
    },
  ];

  return {
    schemaVersion: 1,
    goal: args.goal,
    domain,
    generatedAt,
    requirements,
    sources,
    decisions,
    claims,
    evalMetrics,
    proofArtifacts,
    assumptions: [
      "Research backing is mandatory for major architecture and product claims.",
      "Single-image/text-to-3D provider integration is v1; multi-photo reconstruction and humanoid motion tracking are stretch lanes.",
      "gstack is an inspirational review methodology source, not a runtime dependency unless explicitly installed.",
      "Fresh-user emulation is not a real human study; label it as emulation unless an actual participant performs the session.",
    ],
  };
}

export function top3dComparisonRubric() {
  return {
    competitors: ["Meshy", "Tripo", "Rodin/Hyper3D", "Luma"],
    totalPoints: 100,
    metrics: [
      { id: "asset-validity", points: 20, evidence: "loadable asset, geometry/materials present, file hash" },
      { id: "visual-alignment", points: 20, evidence: "prompt/image alignment screenshot and evaluator note" },
      { id: "editability-export", points: 15, evidence: "downloaded GLB/USDZ opens in target viewer; CAD-native flagged separately" },
      { id: "agentic-ui-completion", points: 20, evidence: "fresh browser upload/chat/generate/view/export trace" },
      { id: "cost-latency", points: 15, evidence: "provider runtime, queue time, errors, and cost" },
      { id: "provenance", points: 10, evidence: "video, transcript, trace, generated assets, and scorecard hashes" },
    ],
  };
}

export function verifyResearchPack(pack: ResearchPack, options: ResearchVerificationOptions = {}): ResearchVerificationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const now = options.now ?? new Date();
  const maxSourceAgeDays = options.maxSourceAgeDays ?? 365;

  if (pack.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!researchDomains.includes(pack.domain)) errors.push(`domain '${pack.domain}' is not supported`);

  const sourceIds = new Set<string>();
  const sourcesById = new Map<string, ResearchSource>();
  for (const s of pack.sources ?? []) {
    if (!s.id) errors.push("source missing id");
    if (sourceIds.has(s.id)) errors.push(`duplicate source id '${s.id}'`);
    sourceIds.add(s.id);
    sourcesById.set(s.id, s);
    if (!s.title) errors.push(`source '${s.id}' missing title`);
    if (!/^https?:\/\//.test(s.url)) errors.push(`source '${s.id}' must use an http(s) url`);
    if (!researchSourceKinds.includes(s.kind)) errors.push(`source '${s.id}' has unsupported kind '${s.kind}'`);
    if (!researchDomains.includes(s.domain)) errors.push(`source '${s.id}' has unsupported domain '${s.domain}'`);
    const t = Date.parse(s.verifiedAt);
    if (!Number.isFinite(t)) {
      errors.push(`source '${s.id}' has invalid verifiedAt`);
    } else {
      const ageDays = (now.getTime() - t) / msPerDay;
      if (ageDays < -1) errors.push(`source '${s.id}' verifiedAt is in the future`);
      if (ageDays > maxSourceAgeDays) errors.push(`source '${s.id}' is stale (${Math.floor(ageDays)} days old)`);
    }
  }

  const reqIds = new Set((pack.requirements ?? []).map((r) => r.id));
  const metricIds = new Set((pack.evalMetrics ?? []).map((m) => m.id));
  const artifactIds = new Set((pack.proofArtifacts ?? []).map((a) => a.id));

  const checkRefs = (owner: string, ids: string[], allowed?: ResearchSourceKind[]) => {
    for (const id of ids ?? []) {
      const s = sourcesById.get(id);
      if (!s) {
        errors.push(`${owner} references missing source '${id}'`);
      } else if (allowed && !allowed.includes(s.kind)) {
        errors.push(`${owner} source '${id}' has kind '${s.kind}', expected ${allowed.join("/")}`);
      }
    }
  };

  for (const metric of pack.evalMetrics ?? []) {
    if (!metric.id || !metric.name || !metric.grader) errors.push(`eval metric '${metric.id || "<missing>"}' is incomplete`);
    if ((metric.sourceIds ?? []).length === 0) errors.push(`eval metric '${metric.id}' has no research sources`);
    checkRefs(`eval metric '${metric.id}'`, metric.sourceIds);
  }

  for (const artifact of pack.proofArtifacts ?? []) {
    if (!artifact.id || !artifact.kind || !artifact.description) errors.push(`proof artifact '${artifact.id || "<missing>"}' is incomplete`);
    if (options.requireProofArtifactPaths && artifact.required && !artifact.path) {
      errors.push(`required proof artifact '${artifact.id}' has no path`);
    }
  }

  const researchKinds: ResearchSourceKind[] = ["paper", "benchmark", "dataset"];
  const practicalKinds: ResearchSourceKind[] = ["official-doc", "product"];
  for (const decision of pack.decisions ?? []) {
    const label = `decision for '${decision.requirementId}'`;
    if (!reqIds.has(decision.requirementId)) errors.push(`${label} references missing requirement`);
    if (!decision.chosenApproach) errors.push(`${label} missing chosenApproach`);
    if ((decision.researchSourceIds ?? []).length === 0) {
      errors.push(`${label} has no researchSourceIds`);
    }
    if ((decision.inspirationSourceIds ?? []).length === 0) {
      errors.push(`${label} has no practical/inspiration sources`);
    }
    if ((decision.evalMetricIds ?? []).length === 0) {
      errors.push(`${label} has no evalMetricIds`);
    }
    checkRefs(label, decision.researchSourceIds, researchKinds);
    checkRefs(label, decision.inspirationSourceIds, practicalKinds);
    for (const id of decision.evalMetricIds ?? []) {
      if (!metricIds.has(id)) errors.push(`${label} references missing eval metric '${id}'`);
    }
  }

  for (const claim of pack.claims ?? []) {
    const label = `claim '${claim.id}'`;
    if (!reqIds.has(claim.requirementId)) errors.push(`${label} references missing requirement`);
    if (claim.status === "supported") {
      if ((claim.sourceIds ?? []).length === 0) errors.push(`${label} is supported but has no sourceIds`);
      checkRefs(label, claim.sourceIds);
      if (claim.risk === "major" && claim.claimType !== "plan" && (claim.proofArtifactIds ?? []).length === 0) {
        errors.push(`${label} is a major capability/result claim but has no proof artifacts`);
      }
    } else {
      warnings.push(`${label} is labeled ${claim.status}`);
      checkRefs(label, claim.sourceIds ?? []);
    }
    for (const id of claim.proofArtifactIds ?? []) {
      if (!artifactIds.has(id)) errors.push(`${label} references missing proof artifact '${id}'`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      sources: pack.sources?.length ?? 0,
      requirements: pack.requirements?.length ?? 0,
      decisions: pack.decisions?.length ?? 0,
      claims: pack.claims?.length ?? 0,
      evalMetrics: pack.evalMetrics?.length ?? 0,
      proofArtifacts: pack.proofArtifacts?.length ?? 0,
    },
  };
}
