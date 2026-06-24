export const researchSourceKinds = ["paper", "official-doc", "product", "benchmark", "dataset"] as const;
export type ResearchSourceKind = (typeof researchSourceKinds)[number];

export const researchDomains = ["agent-loop", "coding-agent", "3d-generation", "deployment", "eval", "safety-engineering"] as const;
export type ResearchDomain = (typeof researchDomains)[number];

export const proofScopes = ["production", "local-personal-research"] as const;
export type ProofScope = (typeof proofScopes)[number];

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
    | "component-breakdown-receipt"
    | "study-replica-receipt"
    | "engineering-hazard-analysis"
    | "simulation-test-receipt"
    | "human-engineer-approval"
    | "export-eligibility-verdict"
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
  proofScope: ProofScope;
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
  proofScope?: ProofScope;
}): ResearchPack {
  const generatedAt = args.generatedAt ?? new Date().toISOString();
  const domain = args.domain ?? "3d-generation";
  const proofScope = args.proofScope ?? "production";
  const productionRequired = proofScope === "production";
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
    source("usco-ai", "U.S. Copyright Office: Copyright and Artificial Intelligence", "https://www.copyright.gov/ai/", "official-doc", "eval"),
    source("usco-fair-use", "U.S. Copyright Office: Fair Use Index", "https://www.copyright.gov/fair-use/", "official-doc", "eval"),
    source("uspto-design-definition", "USPTO MPEP 1502: Definition of a Design", "https://www.uspto.gov/web/offices/pac/mpep/s1502.html", "official-doc", "safety-engineering"),
    source("nist-ai-rmf", "NIST AI Risk Management Framework", "https://www.nist.gov/itl/ai-risk-management-framework", "official-doc", "safety-engineering"),
    source("nasa-system-safety", "NASA System Safety", "https://sma.nasa.gov/sma-disciplines/system-safety", "official-doc", "safety-engineering"),
    source("nasa-se-handbook", "NASA Systems Engineering Handbook", "https://www.nasa.gov/wp-content/uploads/2018/09/nasa_systems_engineering_handbook_0.pdf", "official-doc", "safety-engineering"),
    source("iso-14971", "ISO 14971:2019 Medical devices - Risk management", "https://www.iso.org/standard/72704.html", "official-doc", "safety-engineering"),
    source("fda-ai-medical-devices", "FDA Artificial Intelligence-Enabled Medical Devices", "https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-enabled-medical-devices", "official-doc", "safety-engineering"),
    source("youtube-fair-use", "YouTube Help: Fair use on YouTube", "https://support.google.com/youtube/answer/9783148", "official-doc", "eval"),
    source("meshy-api", "Meshy API", "https://www.meshy.ai/api", "product", "3d-generation"),
    source("tripo", "Tripo 3D", "https://www.tripo3d.ai/", "product", "3d-generation"),
    source("hyper3d-rodin", "Hyper3D Rodin", "https://hyper3d.ai/", "product", "3d-generation"),
    source("luma", "Luma AI", "https://lumalabs.ai/", "product", "3d-generation"),
    source("lovart", "Lovart AI", "https://www.lovart.ai/", "product", "3d-generation"),
    source("colmap", "COLMAP Tutorial", "https://colmap.github.io/tutorial.html", "official-doc", "3d-generation"),
    source("msplat", "msplat", "https://github.com/rayanht/msplat", "product", "3d-generation"),
    source("depth-anything", "Depth Anything 3 CLI", "https://github.com/ByteDance-Seed/Depth-Anything-3/blob/main/docs/CLI.md", "official-doc", "3d-generation"),
    source("vercel", "Vercel Platform", "https://vercel.com/docs", "official-doc", "deployment"),
    source("gmi-agentbox", "GMI AgentBox Marketplace Overview", "https://docs.gmicloud.ai/agentbox-marketplace/overview", "official-doc", "deployment"),
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
      id: "req-reference-media-remix",
      userNeed: "Use a screenshot, social post, video frame, movie/game reference, or textbook image as inspiration for a 3D asset.",
      deliverable: "A rights-aware reference-media workflow that either generates a transformed/original 3D asset, asks for proof of rights, or blocks exact extraction.",
      evidence: "Screenshot request mentions taking cool 3D assets from social posts/videos/movies/textbooks and asking if they can 3D print or build it into an app.",
    },
    {
      id: "req-brush-source-selection",
      userNeed: "A founder can brush over the object in a photo and use that crop as the 3D target while leaving the rest as context.",
      deliverable: "A brush/source-selection receipt, crop/context split, and UI proof that the selected object enters the 3D generation lane.",
      evidence: "Latest screenshots request a Lovart-inspired brush feature to remove surroundings or edit a specific part before converting the cropped picture to 3D.",
    },
    {
      id: "req-first-principles-breakdown",
      userNeed: "Before making a 3D asset, break the reference down into every important functional component, primitive shape, material, constraint, and original design delta.",
      deliverable: "A component tree plus functional geometry map, protected-expression filter, educational-purpose note, and originality delta that precedes generation.",
      evidence: "User requested first-principles decomposition before 3D generation and asked whether educational purpose allows original non-copyrighted output.",
    },
    {
      id: "req-engineering-study-replica",
      userNeed: "An engineer may urgently need to invent a safety-critical replacement or improvement from previous models without shipping copied IP or unsafe output.",
      deliverable: "A harnessed engineering mode with non-exportable study replica, first-principles extraction, hazard analysis, simulation/test plan, qualified human review, and export eligibility verdict.",
      evidence: "User requested a life-and-death invention workflow based on previous models for engineers.",
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
      id: "req-shared-scene-voice-camera",
      userNeed: "Generated assets should coexist in one environment, accept voice/chat direction, and prepare a laptop-camera animation lane.",
      deliverable: "A scene manifest, voice transcript handoff, and permission-gated camera animation contract before claiming webcam animation works.",
      evidence: "Latest roadmap asks for generated characters/table/cups in one environment, voice for agents/models, chat transcription, and laptop-camera animation.",
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
      id: "metric-component-originality",
      name: "Component originality",
      grader: "Verify the asset spec is built from decomposed functional/geometric components, records protected-expression removals, and includes an originality delta before generation.",
      sourceIds: ["p3d-bench", "gpt-eval-3d", "usco-fair-use", "usco-ai"],
    },
    {
      id: "metric-engineering-safety-readiness",
      name: "Engineering safety readiness",
      grader: "Verify exact replicas stay non-exportable, final designs come from filtered functional specs, and safety-critical outputs have hazard, simulation/test, human approval, and regulatory-scope receipts when applicable.",
      sourceIds: ["nist-ai-rmf", "nasa-system-safety", "nasa-se-handbook", "iso-14971", "fda-ai-medical-devices"],
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
    {
      id: "metric-rights-provenance",
      name: "Rights and provenance",
      grader: "Verify source manifest, ownership/license mode, blocked exact-extraction state, and similarity/transformative-use notes are present before export.",
      sourceIds: ["usco-ai", "usco-fair-use", "youtube-fair-use"],
    },
    {
      id: "metric-source-isolation-scene-contract",
      name: "Source isolation and scene contract",
      grader: "Verify the live UI records a brush/crop receipt, preserves surrounding media as context, renders a shared scene stack, and labels voice/camera lanes as transcript/permission-gated contracts.",
      sourceIds: ["webarena", "osworld", "gpt-eval-3d"],
    },
  ];

  const proofArtifacts: ProofArtifact[] = [
    { id: "artifact-fullscreen-video", kind: "fullscreen-video", required: productionRequired, description: "Full-screen recording of the fresh founder-style session." },
    { id: "artifact-recording-audit", kind: "recording-audit", required: productionRequired, description: "Visual inspection receipt for videos, rejected recordings, and sampled frame checks." },
    { id: "artifact-terminal-transcript", kind: "terminal-transcript", required: true, description: "Terminal transcript from the coding-agent session." },
    { id: "artifact-playwright-trace", kind: "playwright-trace", required: true, description: "Playwright trace proving real UI upload/chat/view/export." },
    { id: "artifact-playwright-video", kind: "playwright-video", required: true, description: "Browser video for the real app flow." },
    { id: "artifact-deployed-url", kind: "deployed-url", required: productionRequired, description: "Live deployment URL used by judges/customers." },
    { id: "artifact-generated-assets", kind: "generated-asset", required: true, description: "Generated GLB/USDZ or viewer-compatible asset files." },
    { id: "artifact-provider-costs", kind: "provider-costs", required: productionRequired, description: "Provider cost, latency, and failure-state ledger." },
    { id: "artifact-comparator-scorecard", kind: "scorecard", required: productionRequired, description: "Scorecard against Meshy, Tripo, Rodin/Hyper3D, and Luma." },
    { id: "artifact-decision-log", kind: "decision-log", required: true, description: "Implementation decisions with research and practical references." },
    { id: "artifact-rights-provenance", kind: "decision-log", required: true, description: "Source manifest, ownership/license/allowed-use mode, and blocked exact-extraction receipt for reference media." },
    { id: "artifact-component-breakdown", kind: "component-breakdown-receipt", required: true, description: "First-principles component tree, functional geometry/material map, protected-expression filter, and originality delta produced before generation." },
    { id: "artifact-study-replica-sandbox", kind: "study-replica-receipt", required: productionRequired, description: "Non-exportable exact-replica study container, access log, watermark metadata, and purge/seal receipt." },
    { id: "artifact-engineering-hazard-analysis", kind: "engineering-hazard-analysis", required: productionRequired, description: "Hazard log, FMEA/FTA or equivalent, misuse cases, safety margins, mitigations, and residual risk verdict." },
    { id: "artifact-simulation-test", kind: "simulation-test-receipt", required: productionRequired, description: "Simulation report or bench-test plan with acceptance criteria and validation notes." },
    { id: "artifact-human-engineer-approval", kind: "human-engineer-approval", required: productionRequired, description: "Qualified human engineering review with reviewer role, scope, and signoff limitations." },
    { id: "artifact-export-eligibility", kind: "export-eligibility-verdict", required: productionRequired, description: "Verdict proving export is original, not the study replica, and not approved for human use unless safety receipts pass." },
  ];

  const decisions: ImplementationDecision[] = [
    {
      requirementId: "req-reference-media-remix",
      chosenApproach: "Treat social/movie/textbook/video screenshots as reference media with a rights/provenance gate before generation or export.",
      rejectedAlternatives: [
        "Exact extraction of a protected expressive asset from media without proof of rights.",
        "Letting platform availability imply permission to create derivative 3D assets.",
      ],
      researchSourceIds: ["rigorous-agent-benchmarks"],
      inspirationSourceIds: ["usco-ai", "usco-fair-use", "youtube-fair-use", "meshy-api", "tripo", "hyper3d-rodin", "luma"],
      evalMetricIds: ["metric-rights-provenance", "metric-asset-validity", "metric-visual-alignment"],
      risk: "Copyright, trademark, publicity, and platform-term risks vary by source; the product must block unverified exact copying and preserve provenance receipts.",
    },
    {
      requirementId: "req-brush-source-selection",
      chosenApproach: "Add brush/source selection before generation: the marked crop becomes the target object and unmarked pixels remain context for scene/style only.",
      rejectedAlternatives: [
        "Treating the whole screenshot as the target object.",
        "Letting the model infer protected or irrelevant surroundings without a user-visible crop receipt.",
      ],
      researchSourceIds: ["webarena", "osworld", "gpt-eval-3d"],
      inspirationSourceIds: ["lovart", "usco-ai", "usco-fair-use"],
      evalMetricIds: ["metric-source-isolation-scene-contract", "metric-rights-provenance", "metric-component-originality"],
      risk: "Brush selection improves user control but does not remove rights/provenance duties; selected objects still require allowed-use mode and originality delta.",
    },
    {
      requirementId: "req-first-principles-breakdown",
      chosenApproach: "Force a pre-generation decomposition pass that converts references into component trees, functional primitives, material constraints, and an original design spec with explicit deltas from the source.",
      rejectedAlternatives: [
        "Generating a mesh directly from a protected screenshot or video frame without explaining which expressive details were removed.",
        "Treating educational purpose as automatic permission to copy the original asset.",
      ],
      researchSourceIds: ["p3d-bench", "gpt-eval-3d", "rigorous-agent-benchmarks"],
      inspirationSourceIds: ["usco-fair-use", "usco-ai", "meshy-api", "tripo"],
      evalMetricIds: ["metric-component-originality", "metric-rights-provenance", "metric-visual-alignment"],
      risk: "The system can steer original educational modeling, but it cannot guarantee fair use or ownership; exact protected expression stays blocked unless rights are proven.",
    },
    {
      requirementId: "req-engineering-study-replica",
      chosenApproach: "Use a harnessed engineering mode: exact previous models may enter a sealed, non-exportable study sandbox, but exportable designs are generated only from filtered first-principles specs after hazard analysis, simulation/test planning, and qualified human review.",
      rejectedAlternatives: [
        "Letting urgency or life-and-death framing bypass IP provenance.",
        "Letting the final CAD/asset generator read or export the exact study replica.",
        "Treating an AI-generated safety-critical design as deployable without engineering signoff and test evidence.",
      ],
      researchSourceIds: ["rigorous-agent-benchmarks", "coding-agents-e2e"],
      inspirationSourceIds: ["nist-ai-rmf", "nasa-system-safety", "nasa-se-handbook", "iso-14971", "fda-ai-medical-devices", "uspto-design-definition"],
      evalMetricIds: ["metric-engineering-safety-readiness", "metric-component-originality", "metric-rights-provenance"],
      risk: "Urgent engineering can justify faster triage and proof collection, but not unreviewed human use, regulator-facing claims, or exact replica export.",
    },
    {
      requirementId: "req-3d-generate",
      chosenApproach: "Build v1 around a first-party deterministic scaffold plus self-hosted/open-model lanes when compute is available; provider APIs remain optional comparator or acceleration lanes with explicit user approval.",
      rejectedAlternatives: [
        "Making provider API keys mandatory before the core app, UI, receipts, and export proof work.",
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
      requirementId: "req-shared-scene-voice-camera",
      chosenApproach: "Require a scene manifest plus transcript/camera contracts: assets can share one environment, voice becomes a chat transcript, and webcam animation remains gated until camera permission/tracking/rig receipts exist.",
      rejectedAlternatives: [
        "Only generating isolated single meshes with no multi-asset scene state.",
        "Claiming webcam animation works because a button exists.",
      ],
      researchSourceIds: ["webarena", "osworld", "react"],
      inspirationSourceIds: ["lovart", "gmi-agentbox"],
      evalMetricIds: ["metric-source-isolation-scene-contract", "metric-agentic-ui-completion", "metric-editability-export"],
      risk: "The UI may prove the contract and workflow readiness; real webcam motion tracking and rigging still require a separate verified lane.",
    },
    {
      requirementId: "req-deploy-use",
      chosenApproach: "Default to a deployed web app with persistence/object storage; treat GMI AgentBox as an optional packaged-agent deployment and marketplace path, not a required 3D model provider.",
      rejectedAlternatives: ["Local-only demo with no customer URL.", "Ephemeral in-memory assets that disappear after the session."],
      researchSourceIds: ["coding-agents-e2e", "swe-evo", "rigorous-agent-benchmarks"],
      inspirationSourceIds: ["vercel", "supabase", "convex", "gmi-agentbox"],
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
      id: "claim-reference-media-rights-gated",
      requirementId: "req-reference-media-remix",
      claimType: "capability",
      claim: "Reference-media-to-3D is allowed only when source ownership/license/allowed-use mode is recorded; exact extraction of protected expressive assets without rights proof is blocked.",
      status: "supported",
      risk: "major",
      sourceIds: ["usco-ai", "usco-fair-use", "youtube-fair-use"],
      proofArtifactIds: ["artifact-rights-provenance"],
    },
    {
      id: "claim-first-principles-original-asset",
      requirementId: "req-first-principles-breakdown",
      claimType: "capability",
      claim: "The skill may proceed with educational/reference-media 3D generation only after a first-principles breakdown removes protected expressive copying and records an original design delta before generation.",
      status: "supported",
      risk: "major",
      sourceIds: ["p3d-bench", "gpt-eval-3d", "usco-fair-use", "usco-ai"],
      proofArtifactIds: ["artifact-component-breakdown", "artifact-rights-provenance"],
    },
    {
      id: "claim-brush-scene-contract",
      requirementId: "req-brush-source-selection",
      claimType: "capability",
      claim: "The first-party 3D flow supports brush/source isolation and shared-scene proof only when the live UI trace shows crop selection, scene stack state, and transcript/camera contract lanes.",
      status: "supported",
      risk: "major",
      sourceIds: ["webarena", "osworld", "gpt-eval-3d"],
      proofArtifactIds: ["artifact-playwright-trace", "artifact-playwright-video", "artifact-component-breakdown"],
    },
    {
      id: "claim-engineering-harness-safe-export",
      requirementId: "req-engineering-study-replica",
      claimType: "capability",
      claim: "Safety-critical engineering mode may accelerate study and redesign from previous models only when exact replicas remain non-exportable and deployable outputs are blocked until hazard, simulation/test, human approval, and export-eligibility receipts pass.",
      status: "supported",
      risk: "major",
      sourceIds: ["nist-ai-rmf", "nasa-system-safety", "nasa-se-handbook", "iso-14971", "fda-ai-medical-devices"],
      proofArtifactIds: ["artifact-study-replica-sandbox", "artifact-engineering-hazard-analysis", "artifact-simulation-test", "artifact-human-engineer-approval", "artifact-export-eligibility"],
    },
    {
      id: "claim-v1-realistic",
      requirementId: "req-3d-generate",
      claimType: "plan",
      claim: "A realistic v1 proves the product loop with a first-party deterministic asset path and optionally compares provider/self-hosted lanes after user approval; provider API keys must not block the core UI proof.",
      status: "supported",
      risk: "major",
      sourceIds: ["instantmesh", "trellis", "hunyuan3d-21", "hy3d-bench", "p3d-bench"],
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
    proofScope,
    generatedAt,
    requirements,
    sources,
    decisions,
    claims,
    evalMetrics,
    proofArtifacts,
    assumptions: [
      "Research backing is mandatory for major architecture and product claims.",
      "First-party deterministic scaffold and self-hosted/open-model lanes are the core path; paid provider APIs are optional comparator/acceleration lanes.",
      "Brush/source selection and shared-scene composition are required UI proof lanes for screenshot-reference workflows.",
      "Voice transcript handoff can be proved in v1; laptop-camera animation remains a permission-gated stretch lane until tracking and rigging receipts exist.",
      "gstack is an inspirational review methodology source, not a runtime dependency unless explicitly installed.",
      "Fresh-user emulation is not a real human study; label it as emulation unless an actual participant performs the session.",
      "Reference media from movies, games, social posts, videos, or textbooks requires a source manifest and rights/provenance gate before export.",
      "Educational purpose is a factor to record, not an automatic safe harbor; original outputs must come from abstracted components and an originality delta unless rights are proven.",
      "Urgent or life-critical engineering requests accelerate triage and evidence collection; they do not permit exact replica export, unsafe human use, or skipped qualified review.",
      proofScope === "local-personal-research"
        ? "Local personal-research proof can pass without deployment/provider/comparator artifacts, but it must not claim judge/customer readiness."
        : "Production proof requires deployment, chosen-lane cost/comparator receipts, recording, and engineering safety artifacts before customer or judge readiness claims.",
    ],
  };
}

export function top3dComparisonRubric() {
  return {
    competitors: ["Meshy", "Tripo", "Rodin/Hyper3D", "Luma"],
    totalPoints: 100,
    metrics: [
      { id: "asset-validity", points: 18, evidence: "loadable asset, geometry/materials present, file hash" },
      { id: "visual-alignment", points: 16, evidence: "prompt/image alignment screenshot and evaluator note" },
      { id: "component-originality", points: 12, evidence: "component tree, protected-expression filter, and originality delta before generation" },
      { id: "editability-export", points: 12, evidence: "downloaded GLB/USDZ opens in target viewer; CAD-native flagged separately" },
      { id: "agentic-ui-completion", points: 18, evidence: "fresh browser upload/chat/generate/view/export trace" },
      { id: "cost-latency", points: 14, evidence: "provider runtime, queue time, errors, and cost" },
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
