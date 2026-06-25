import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export const researchSourceTiers = ["primary", "official", "benchmark", "product", "community"] as const;
export type ResearchSourceTier = (typeof researchSourceTiers)[number];

export const researchGovernorDomains = [
  "agent-loop",
  "coding-agent",
  "ui-ux",
  "3d-asset-pipeline",
  "deployment",
  "eval",
  "safety-risk",
  "generic-product",
] as const;
export type ResearchGovernorDomain = (typeof researchGovernorDomains)[number];

export type ResearchGovernorSource = {
  id: string;
  title: string;
  url: string;
  tier: ResearchSourceTier;
  domain: ResearchGovernorDomain;
  verifiedAt: string;
  useFor: string[];
  nonClaims: string[];
};

export type ResearchBrief = {
  schemaVersion: 1;
  briefId: string;
  goal: string;
  domain: ResearchGovernorDomain;
  createdAt: string;
  latestCheckAt: string;
  sources: ResearchGovernorSource[];
  implementationImplications: Array<{
    id: string;
    claim: string;
    sourceIds: string[];
    decisionGate: string;
    proofGate: string;
  }>;
  unsupportedAssumptions: string[];
  staleAfterDays: number;
};

export type ResearchGovernorVerdict = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function classifyResearchSource(input: {
  id?: string;
  title: string;
  url: string;
  domain?: ResearchGovernorDomain;
  verifiedAt?: string;
}): ResearchGovernorSource {
  const url = input.url.trim();
  const domain = input.domain ?? inferDomain(`${input.title} ${url}`);
  const tier = inferTier(url);
  return {
    id: input.id ?? slugify(input.title),
    title: input.title.trim(),
    url,
    tier,
    domain,
    verifiedAt: input.verifiedAt ?? new Date().toISOString(),
    useFor: inferUseFor(`${input.title} ${url}`, domain),
    nonClaims: [
      "A cited source does not prove the implementation works in this repo.",
      "A product inspiration source cannot be copied unless rights and licenses permit it.",
    ],
  };
}

export function makeResearchBrief(input: {
  goal: string;
  domain?: ResearchGovernorDomain;
  briefId?: string;
  sources?: ResearchGovernorSource[];
  createdAt?: string;
  latestCheckAt?: string;
  staleAfterDays?: number;
}): ResearchBrief {
  const domain = input.domain ?? inferDomain(input.goal);
  const sources = input.sources?.length ? input.sources : defaultSourcesFor(domain);
  return {
    schemaVersion: 1,
    briefId: input.briefId ?? `${domain}-brief`,
    goal: input.goal,
    domain,
    createdAt: input.createdAt ?? new Date().toISOString(),
    latestCheckAt: input.latestCheckAt ?? new Date().toISOString(),
    sources,
    implementationImplications: defaultImplications(input.goal, domain, sources),
    unsupportedAssumptions: [
      "Current product market state may change; rerun source verification before public claims.",
      "Prototype proof does not imply production readiness without the named proof gate.",
    ],
    staleAfterDays: input.staleAfterDays ?? 90,
  };
}

export function verifyResearchBrief(brief: ResearchBrief, input?: { now?: Date; maxSourceAgeDays?: number }): ResearchGovernorVerdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (brief.schemaVersion !== 1) errors.push("research brief schemaVersion must be 1");
  if (!brief.goal?.trim()) errors.push("research brief requires goal");
  if (!researchGovernorDomains.includes(brief.domain)) errors.push("research brief requires valid domain");
  if (!brief.sources?.length) errors.push("research brief requires sources");
  if (!brief.implementationImplications?.length) errors.push("research brief requires implementation implications");
  const ids = new Set((brief.sources ?? []).map((source) => source.id));
  for (const source of brief.sources ?? []) {
    if (!source.title || !source.url) errors.push(`source ${source.id || "<missing>"} requires title and url`);
    if (!researchSourceTiers.includes(source.tier)) errors.push(`source ${source.id} has invalid tier`);
    if (!researchGovernorDomains.includes(source.domain)) errors.push(`source ${source.id} has invalid domain`);
    if (!source.verifiedAt) errors.push(`source ${source.id} requires verifiedAt`);
    const age = sourceAgeDays(source.verifiedAt, input?.now);
    const maxAge = input?.maxSourceAgeDays ?? brief.staleAfterDays;
    if (age > maxAge) errors.push(`source ${source.id} is stale at ${Math.round(age)} days`);
  }
  for (const implication of brief.implementationImplications ?? []) {
    if (!implication.sourceIds?.length) errors.push(`implication ${implication.id} has no sourceIds`);
    for (const sourceId of implication.sourceIds ?? []) {
      if (!ids.has(sourceId)) errors.push(`implication ${implication.id} references unknown source ${sourceId}`);
    }
    if (!implication.decisionGate) errors.push(`implication ${implication.id} needs decisionGate`);
    if (!implication.proofGate) errors.push(`implication ${implication.id} needs proofGate`);
  }
  if (!brief.sources.some((source) => ["primary", "official", "benchmark"].includes(source.tier))) {
    warnings.push("research brief should include at least one primary, official, or benchmark source");
  }
  if (brief.unsupportedAssumptions.length === 0) warnings.push("research brief should list unsupported assumptions");
  return { ok: errors.length === 0, errors, warnings };
}

export function researchBriefPath(projectPath: string, briefId = "direction-change") {
  return join(resolve(projectPath), "docs", "research", "briefs", `${briefId}.json`);
}

export function writeResearchBrief(path: string, brief: ResearchBrief) {
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, `${JSON.stringify(brief, null, 2)}\n`, "utf8");
  return abs;
}

export function readResearchBrief(path: string): ResearchBrief {
  return JSON.parse(readFileSync(resolve(path), "utf8")) as ResearchBrief;
}

export function researchBriefExists(path: string) {
  return existsSync(resolve(path));
}

function inferTier(url: string): ResearchSourceTier {
  if (/arxiv\.org|doi\.org|aclanthology\.org|openreview\.net/i.test(url)) return "primary";
  if (/docs\.|khronos\.org|threejs\.org|blender\.org|github\.com\/pmndrs|github\.com\/KhronosGroup/i.test(url)) return "official";
  if (/benchmark|leaderboard|dataset/i.test(url)) return "benchmark";
  if (/\.ai|spline\.design|emergent|igloo|bruno-simon|meshy|tripo|lumalabs/i.test(url)) return "product";
  return "community";
}

function inferDomain(text: string): ResearchGovernorDomain {
  if (/react three fiber|gltf|glb|blender|spline|3d|webgl|gaussian|mesh|asset/i.test(text)) return "3d-asset-pipeline";
  if (/benchmark|eval|score|held-out|proof/i.test(text)) return "eval";
  if (/deploy|vercel|aws|agentbox|docker|storage/i.test(text)) return "deployment";
  if (/ui|ux|design|shadcn|gsap|mobile|dashboard/i.test(text)) return "ui-ux";
  if (/coding agent|swe-bench|codex|claude code/i.test(text)) return "coding-agent";
  if (/agent loop|react|toolformer|memory|ralph/i.test(text)) return "agent-loop";
  if (/risk|copyright|commercial|safety|hazard/i.test(text)) return "safety-risk";
  return "generic-product";
}

function inferUseFor(text: string, domain: ResearchGovernorDomain): string[] {
  const uses = new Set<string>(["decision receipt"]);
  if (domain === "3d-asset-pipeline") {
    uses.add("asset export");
    uses.add("viewer runtime");
    uses.add("component proof gate");
  }
  if (/benchmark|eval|proof/i.test(text)) uses.add("benchmark or proof gate");
  if (/design|ui|ux|webgl|spline|bruno|igloo/i.test(text)) uses.add("visual interaction quality bar");
  if (/deploy|docker|vercel|aws|agentbox/i.test(text)) uses.add("deployment setup matrix");
  return [...uses];
}

function defaultSourcesFor(domain: ResearchGovernorDomain): ResearchGovernorSource[] {
  const verifiedAt = new Date().toISOString();
  if (domain === "3d-asset-pipeline") {
    return [
      classifyResearchSource({
        id: "khronos-gltf",
        title: "Khronos glTF runtime 3D asset delivery",
        url: "https://www.khronos.org/gltf/",
        domain,
        verifiedAt,
      }),
      classifyResearchSource({
        id: "threejs-gltfloader",
        title: "three.js GLTFLoader documentation",
        url: "https://threejs.org/docs/pages/GLTFLoader.html",
        domain,
        verifiedAt,
      }),
      classifyResearchSource({
        id: "pmndrs-gltfjsx",
        title: "gltfjsx converts glTF assets into React Three Fiber JSX components",
        url: "https://github.com/pmndrs/gltfjsx",
        domain,
        verifiedAt,
      }),
      classifyResearchSource({
        id: "blender-gltf-export",
        title: "Blender glTF 2.0 import and export manual",
        url: "https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html",
        domain,
        verifiedAt,
      }),
    ];
  }
  if (domain === "agent-loop" || domain === "coding-agent") {
    return [
      classifyResearchSource({ id: "react", title: "ReAct: Synergizing Reasoning and Acting in Language Models", url: "https://arxiv.org/abs/2210.03629", domain: "agent-loop", verifiedAt }),
      classifyResearchSource({ id: "swe-bench", title: "SWE-bench: Can Language Models Resolve Real-World GitHub Issues?", url: "https://arxiv.org/abs/2310.06770", domain: "coding-agent", verifiedAt }),
    ];
  }
  if (domain === "ui-ux") {
    return [
      classifyResearchSource({ id: "shadcn-ui", title: "shadcn/ui component registry", url: "https://ui.shadcn.com/", domain, verifiedAt }),
      classifyResearchSource({ id: "gsap-docs", title: "GSAP animation documentation", url: "https://gsap.com/docs/v3/", domain, verifiedAt }),
    ];
  }
  return [
    classifyResearchSource({
      id: "research-policy",
      title: "Project research policy",
      url: "docs/research/research-policy.yaml",
      domain,
      verifiedAt,
    }),
  ];
}

function defaultImplications(goal: string, domain: ResearchGovernorDomain, sources: ResearchGovernorSource[]): ResearchBrief["implementationImplications"] {
  const ids = sources.map((source) => source.id);
  if (domain === "3d-asset-pipeline") {
    const webReadySources = ids.filter((id) => /gltf|gltfjsx|threejs|blender/.test(id));
    const runtimeSources = ids.filter((id) => /threejs|gltfjsx/.test(id));
    return [
      {
        id: "web-ready-asset",
        claim: `${goal} must export an interoperable GLB/glTF asset before calling itself web-ready.`,
        sourceIds: webReadySources.length ? webReadySources : ids.slice(0, 1),
        decisionGate: "ImplementationDecision cites export/runtime sources.",
        proofGate: "Generated asset reopens in a viewer or DCC and renders in the browser.",
      },
      {
        id: "interactive-runtime",
        claim: "Interactive web 3D needs a runtime component boundary, not only a screenshot or static mesh.",
        sourceIds: runtimeSources.length ? runtimeSources : ids.slice(0, 1),
        decisionGate: "R3F/Three.js component contract is documented.",
        proofGate: "Playwright proves camera/input interaction against the live UI.",
      },
    ];
  }
  return [
    {
      id: "research-backed-decision",
      claim: `${goal} requires every major implementation decision to cite at least one relevant source.`,
      sourceIds: ids.slice(0, Math.max(1, Math.min(ids.length, 3))),
      decisionGate: "Decision receipt lists sourceIds and non-claims.",
      proofGate: "Fresh-context judge sees research brief and proof verdict receipts.",
    },
  ];
}

function sourceAgeDays(iso: string, now = new Date()) {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return Number.POSITIVE_INFINITY;
  return (now.getTime() - time) / 86_400_000;
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 72) || "source";
}
