export const designAgentRuntimes = [
  "codex",
  "claude-code",
  "cursor",
  "windsurf",
  "copilot",
  "opencode",
  "generic-agent",
] as const;
export type DesignAgentRuntime = (typeof designAgentRuntimes)[number];

export const designSurfaceKinds = [
  "marketing-site",
  "portfolio",
  "dashboard",
  "saas-app",
  "data-app",
  "mobile-app",
  "animation-heavy",
  "3d-app",
  "component-system",
] as const;
export type DesignSurfaceKind = (typeof designSurfaceKinds)[number];

export type DesignSkillKind =
  | "direction"
  | "component-system"
  | "dashboard"
  | "animation"
  | "mobile"
  | "native"
  | "registry"
  | "style-preset"
  | "visual-content"
  | "ios-native"
  | "quality";

export const designStylePresets = ["minimalist", "industrial-brutalist", "all-rounder", "premium"] as const;
export type DesignStylePreset = (typeof designStylePresets)[number];

export const designTargetPlatforms = ["web", "ios", "android", "cross-platform"] as const;
export type DesignTargetPlatform = (typeof designTargetPlatforms)[number];

export interface DesignSkillSource {
  id: string;
  title: string;
  url: string;
  kind: DesignSkillKind;
  origin: string;
  agentLocked: boolean;
  runtimeSupport: DesignAgentRuntime[];
  bestFor: DesignSurfaceKind[];
  useAs: string;
  portabilityNote: string;
}

export interface DesignSkillRecommendationInput {
  surfaceKind: DesignSurfaceKind;
  stack?: string;
  runtime?: DesignAgentRuntime;
  needsAnimation?: boolean;
  needsVisualContent?: boolean;
  needsMobileNative?: boolean;
  usesShadcn?: boolean;
  usesShadcnMcp?: boolean;
  stylePreset?: DesignStylePreset;
  targetPlatform?: DesignTargetPlatform;
}

export interface DesignSkillPlan {
  runtime: DesignAgentRuntime;
  surfaceKind: DesignSurfaceKind;
  selectedSkillIds: string[];
  sequence: string[];
  warnings: string[];
}

export interface DesignSkillVerification {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

export interface DesignFullFlowInput extends DesignSkillRecommendationInput {
  productCategory?: string;
}

export interface DesignFlowStage {
  id: string;
  title: string;
  purpose: string;
  selectedSkillIds: string[];
  requiredArtifacts: string[];
  gates: string[];
}

export interface DesignFullFlowPlan {
  schemaVersion: 1;
  runtime: DesignAgentRuntime;
  surfaceKind: DesignSurfaceKind;
  targetPlatform: DesignTargetPlatform;
  productCategory: string;
  selectedSkillIds: string[];
  sequence: string[];
  stages: DesignFlowStage[];
  requiredArtifacts: string[];
  warnings: string[];
}

export interface DesignFullFlowVerification {
  ok: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    stages: number;
    skills: number;
    artifacts: number;
  };
}

export function designSkillRegistry(): DesignSkillSource[] {
  return [
    {
      id: "frontend-design",
      title: "Anthropic frontend-design skill",
      url: "https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md",
      kind: "direction",
      origin: "Anthropic skill repository",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "generic-agent"],
      bestFor: ["marketing-site", "portfolio", "saas-app", "3d-app"],
      useAs: "A design-direction brief: distinctive visual point of view, typography, density, and anti-generic choices before code.",
      portabilityNote: "Although authored for Claude skills, the value is the markdown design direction. Any coding agent can read and apply it.",
    },
    {
      id: "shadcn-ui",
      title: "shadcn/ui skills and component guidance",
      url: "https://ui.shadcn.com/docs/skills",
      kind: "component-system",
      origin: "shadcn/ui docs",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "copilot", "opencode", "generic-agent"],
      bestFor: ["dashboard", "saas-app", "data-app", "component-system", "3d-app"],
      useAs: "Component composition, MCP/registry lookup, project-aware shadcn/ui rules, tokens, and install patterns.",
      portabilityNote: "Treat the skill and MCP as shadcn project knowledge. The component rules are independent of the assistant vendor.",
    },
    {
      id: "ui-ux-pro-max",
      title: "UI UX Pro Max",
      url: "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill",
      kind: "dashboard",
      origin: "nextlevelbuilder/ui-ux-pro-max-skill",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "copilot", "generic-agent"],
      bestFor: ["dashboard", "saas-app", "data-app", "mobile-app"],
      useAs: "Industry-aware palette, typography, layout, accessibility, and UX audit intelligence before implementation.",
      portabilityNote: "The project advertises multiple AI-coding-agent targets; consume it as design intelligence, not as a Claude runtime dependency.",
    },
    {
      id: "dashboard-arrangement",
      title: "Dashboard arrangement skill",
      url: "https://github.com/bergside/awesome-design-skills",
      kind: "dashboard",
      origin: "awesome-design-skills dashboard lane",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "copilot", "generic-agent"],
      bestFor: ["dashboard", "data-app", "saas-app"],
      useAs: "Information architecture for dense analytic/product surfaces: grouping, hierarchy, scan paths, chart/table density, and clutter control.",
      portabilityNote: "Use as dashboard reasoning guidance before component implementation; the final contract remains agent-agnostic.",
    },
    {
      id: "gsap-skills",
      title: "GSAP AI Skills",
      url: "https://github.com/greensock/gsap-skills",
      kind: "animation",
      origin: "GreenSock",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "copilot", "generic-agent"],
      bestFor: ["animation-heavy", "marketing-site", "portfolio", "3d-app"],
      useAs: "Animation correctness, timelines, ScrollTrigger, framework usage, and performance rules.",
      portabilityNote: "Official GSAP skills state support for multiple agents including Codex, Cursor, Windsurf, Copilot, and Claude Code.",
    },
    {
      id: "taste-minimalist-ui",
      title: "Minimalist UI taste preset",
      url: "https://www.ui-skills.com/skills/leonxlnx/minimalist-skill/",
      kind: "style-preset",
      origin: "Leonxlnx/taste-skill",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "copilot", "generic-agent"],
      bestFor: ["marketing-site", "portfolio", "saas-app", "component-system"],
      useAs: "Editorial minimal interfaces: monochrome restraint, typographic contrast, flat grids, and fewer decorative effects.",
      portabilityNote: "Use as taste constraints in the brief/contract; do not depend on a Claude-only invocation.",
    },
    {
      id: "taste-industrial-brutalist-ui",
      title: "Industrial Brutalist UI taste preset",
      url: "https://github.com/Leonxlnx/taste-skill",
      kind: "style-preset",
      origin: "Leonxlnx/taste-skill",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "copilot", "generic-agent"],
      bestFor: ["marketing-site", "portfolio", "saas-app", "animation-heavy"],
      useAs: "High-contrast industrial/brutalist visual language when the product needs a deliberately sharp point of view.",
      portabilityNote: "Use as aesthetic constraints, not as permission to ignore usability, accessibility, or product fit.",
    },
    {
      id: "premium-frontend-ui",
      title: "Premium Frontend UI",
      url: "https://github.com/github/awesome-copilot/blob/main/skills/premium-frontend-ui/SKILL.md",
      kind: "style-preset",
      origin: "github/awesome-copilot",
      agentLocked: false,
      runtimeSupport: ["copilot", "codex", "claude-code", "cursor", "windsurf", "generic-agent"],
      bestFor: ["marketing-site", "portfolio", "saas-app", "animation-heavy", "3d-app"],
      useAs: "Immersive premium frontend craft: typography, motion, interaction depth, and high-performance polish.",
      portabilityNote: "Although authored for Copilot, it is an Agent Skill markdown pattern that can be consumed by other agents.",
    },
    {
      id: "frontend-ui-ux",
      title: "Frontend UI UX all-rounder",
      url: "https://www.skillsdirectory.com/skills/code-yeongyu-frontend-ui-ux",
      kind: "style-preset",
      origin: "code-yeongyu/frontend-ui-ux",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "opencode", "generic-agent"],
      bestFor: ["marketing-site", "portfolio", "saas-app", "animation-heavy", "3d-app"],
      useAs: "A clean professional all-rounder when the product needs polished UI/UX without a strong minimalist, brutalist, or premium-luxury direction.",
      portabilityNote: "Use as a taste and craft checklist, not as a Claude-only install target.",
    },
    {
      id: "higgsfield-skills",
      title: "Higgsfield AI Skills",
      url: "https://github.com/higgsfield-ai/skills",
      kind: "visual-content",
      origin: "higgsfield-ai/skills",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "generic-agent"],
      bestFor: ["marketing-site", "portfolio", "animation-heavy", "3d-app"],
      useAs: "Generate or score hero images, product shots, background video clips, and cinematic visual assets when the app needs original media.",
      portabilityNote: "Requires Higgsfield account/CLI/MCP setup behind the normal install/auth/spend gate; the skills are cross-agent markdown skills.",
    },
    {
      id: "awesome-design-skills",
      title: "Awesome Design Skills registry",
      url: "https://github.com/bergside/awesome-design-skills",
      kind: "registry",
      origin: "bergside/awesome-design-skills",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "generic-agent"],
      bestFor: ["marketing-site", "portfolio", "dashboard", "saas-app", "component-system"],
      useAs: "A registry to select a concrete style system only after the product surface and audience are known.",
      portabilityNote: "The registry is explicitly framed for Claude Code, Cursor, Codex, and other agentic tools.",
    },
    {
      id: "material-3",
      title: "Material Design 3 skill",
      url: "https://github.com/hamen/material-3-skill",
      kind: "mobile",
      origin: "hamen/material-3-skill",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "generic-agent"],
      bestFor: ["mobile-app", "component-system"],
      useAs: "Material 3 tokens, components, responsive layout, and MD3 audit checks.",
      portabilityNote: "The repository is Claude-labeled, but the design tokens/audit checklist are portable markdown instructions.",
    },
    {
      id: "mobile-app-ui-design",
      title: "Mobile App UI/UX Design",
      url: "https://github.com/ceorkm/mobile-app-ui-design",
      kind: "mobile",
      origin: "ceorkm/mobile-app-ui-design",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "copilot", "generic-agent"],
      bestFor: ["mobile-app"],
      useAs: "Mobile screen craft: hierarchy, gestures, spacing, empty/loading/error states, and polished app feel.",
      portabilityNote: "Use as a mobile design checklist; do not depend on Claude-specific invocation names.",
    },
    {
      id: "expo-skills",
      title: "Expo Skills",
      url: "https://docs.expo.dev/skills/",
      kind: "native",
      origin: "Expo",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "generic-agent"],
      bestFor: ["mobile-app"],
      useAs: "Expo and React Native UI/deploy/debug guidance when the target app is native or Expo.",
      portabilityNote: "Expo documents these skills as usable with Claude Code, Cursor, Codex, and other AI agents.",
    },
    {
      id: "swiftui-skills",
      title: "SwiftUI skills",
      url: "https://github.com/ameyalambat128/swiftui-skills",
      kind: "ios-native",
      origin: "ameyalambat128/swiftui-skills",
      agentLocked: false,
      runtimeSupport: ["claude-code", "codex", "cursor", "windsurf", "generic-agent"],
      bestFor: ["mobile-app"],
      useAs: "Native iOS/SwiftUI implementation guidance: layout, state, platform conventions, accessibility, and Apple-native UI behavior.",
      portabilityNote: "The installer can target Codex/Claude-style skill paths; use as SwiftUI guidance when the target is truly native iOS.",
    },
  ];
}

export function recommendDesignSkills(input: DesignSkillRecommendationInput): DesignSkillPlan {
  const runtime = input.runtime ?? "generic-agent";
  const stack = (input.stack ?? "").toLowerCase();
  const targetPlatform = input.targetPlatform ?? "web";
  const ids = new Set<string>();
  const warnings: string[] = [];

  if (["marketing-site", "portfolio", "saas-app", "3d-app"].includes(input.surfaceKind)) {
    ids.add("frontend-design");
  }
  if (input.surfaceKind === "dashboard" || input.surfaceKind === "data-app" || input.surfaceKind === "saas-app") {
    ids.add("ui-ux-pro-max");
  }
  if (input.surfaceKind === "dashboard" || input.surfaceKind === "data-app") {
    ids.add("dashboard-arrangement");
  }
  if (input.usesShadcn || input.usesShadcnMcp || stack.includes("shadcn") || stack.includes("tailwind") || input.surfaceKind === "dashboard" || input.surfaceKind === "saas-app" || input.surfaceKind === "3d-app") {
    ids.add("shadcn-ui");
  }
  if (input.needsAnimation || input.surfaceKind === "animation-heavy") {
    ids.add("gsap-skills");
  }
  if (input.needsVisualContent || stack.includes("higgsfield") || stack.includes("hero image") || stack.includes("background video")) {
    ids.add("higgsfield-skills");
  }
  if (input.stylePreset === "minimalist") ids.add("taste-minimalist-ui");
  if (input.stylePreset === "industrial-brutalist") ids.add("taste-industrial-brutalist-ui");
  if (input.stylePreset === "all-rounder") ids.add("frontend-ui-ux");
  if (input.stylePreset === "premium") ids.add("premium-frontend-ui");

  if (input.surfaceKind === "mobile-app" || input.needsMobileNative || targetPlatform !== "web" || stack.includes("react native") || stack.includes("expo") || stack.includes("swiftui")) {
    ids.add("mobile-app-ui-design");
    if (targetPlatform === "cross-platform" || stack.includes("expo") || stack.includes("react native")) ids.add("expo-skills");
    if (targetPlatform === "android" || stack.includes("android") || stack.includes("material") || stack.includes("flutter")) ids.add("material-3");
    if (targetPlatform === "ios" || stack.includes("ios") || stack.includes("swiftui") || stack.includes("swift")) ids.add("swiftui-skills");
  }
  if (ids.size === 0 || input.surfaceKind === "component-system") ids.add("awesome-design-skills");

  if (input.usesShadcnMcp) warnings.push("shadcn MCP/registry lookup must be verified against the installed project; do not invent unavailable components");
  if (input.needsVisualContent) warnings.push("visual generation requires auth/spend approval and generated media proof before it can count as shipped");

  const registry = designSkillRegistry();
  const selected = [...ids].filter((id) => registry.some((s) => s.id === id));
  const unsupported = selected.filter((id) => {
    const skill = registry.find((s) => s.id === id);
    return skill && !skill.runtimeSupport.includes(runtime) && !skill.runtimeSupport.includes("generic-agent");
  });
  for (const id of unsupported) warnings.push(`skill '${id}' does not declare runtime support for '${runtime}'; use as markdown guidance only`);

  return {
    runtime,
    surfaceKind: input.surfaceKind,
    selectedSkillIds: selected,
    sequence: [
      "design-brief",
      "design-skill-selection",
      "component-contract",
      "implementation",
      "browser-verify",
    ],
    warnings,
  };
}

export function verifyDesignSkillPlan(plan: DesignSkillPlan): DesignSkillVerification {
  const errors: string[] = [];
  const warnings = [...plan.warnings];
  const registry = designSkillRegistry();
  const byId = new Map(registry.map((s) => [s.id, s]));

  if (!designAgentRuntimes.includes(plan.runtime)) errors.push(`unsupported runtime '${plan.runtime}'`);
  if (!designSurfaceKinds.includes(plan.surfaceKind)) errors.push(`unsupported surface kind '${plan.surfaceKind}'`);
  if (plan.selectedSkillIds.length === 0) errors.push("no design skills selected");

  for (const id of plan.selectedSkillIds) {
    const skill = byId.get(id);
    if (!skill) {
      errors.push(`unknown design skill '${id}'`);
      continue;
    }
    if (skill.agentLocked) errors.push(`design skill '${id}' is marked agent-locked`);
    if (!skill.runtimeSupport.includes(plan.runtime) && !skill.runtimeSupport.includes("generic-agent")) {
      warnings.push(`design skill '${id}' has no explicit '${plan.runtime}' support; use as portable markdown only`);
    }
  }

  const briefIndex = plan.sequence.indexOf("design-brief");
  const implementationIndex = plan.sequence.indexOf("implementation");
  const verifyIndex = plan.sequence.indexOf("browser-verify");
  if (briefIndex < 0) errors.push("sequence missing design-brief");
  if (implementationIndex < 0) errors.push("sequence missing implementation");
  if (verifyIndex < 0) errors.push("sequence missing browser-verify");
  if (briefIndex >= 0 && implementationIndex >= 0 && briefIndex > implementationIndex) {
    errors.push("design-brief must happen before implementation");
  }
  if (verifyIndex >= 0 && implementationIndex >= 0 && verifyIndex < implementationIndex) {
    errors.push("browser-verify must happen after implementation");
  }

  return { ok: errors.length === 0, errors, warnings };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function isFunctionalSurface(surfaceKind: DesignSurfaceKind) {
  return ["dashboard", "saas-app", "data-app", "component-system", "3d-app"].includes(surfaceKind);
}

export function makeDesignFullFlow(input: DesignFullFlowInput): DesignFullFlowPlan {
  const runtime = input.runtime ?? "generic-agent";
  const targetPlatform = input.targetPlatform ?? "web";
  const stack = input.stack ?? "";
  const selected = new Set(recommendDesignSkills(input).selectedSkillIds);
  const warnings = [...recommendDesignSkills(input).warnings];
  const stages: DesignFlowStage[] = [];

  const addStage = (
    id: string,
    title: string,
    purpose: string,
    selectedSkillIds: string[],
    requiredArtifacts: string[],
    gates: string[],
  ) => {
    for (const skillId of selectedSkillIds) selected.add(skillId);
    stages.push({ id, title, purpose, selectedSkillIds, requiredArtifacts, gates });
  };

  addStage(
    "surface-classification",
    "Classify the surface before design",
    "Decide whether this is a marketing/portfolio page, a functional product surface, a dashboard/data surface, a mobile app, or a 3D/animation-heavy app. This prevents landing-page taste from leaking into operational UI and prevents mobile from being treated as small web.",
    [],
    ["surface kind", "audience", "single job", "functional vs marketing decision"],
    ["classification written before design prompt"],
  );

  if (["marketing-site", "portfolio", "3d-app"].includes(input.surfaceKind)) {
    addStage(
      "break-default-direction",
      "Break the default",
      "Force a concrete visual direction before code: subject, audience, page job, materials/vernacular, type direction, density, and explicit anti-default choices.",
      ["frontend-design"],
      ["design direction", "anti-slop checklist", "chosen visual language"],
      ["direction exists before implementation"],
    );
  }

  if (isFunctionalSurface(input.surfaceKind)) {
    addStage(
      "functional-product-system",
      "Functional product system",
      "Treat the app as a product people use repeatedly: states, data density, navigation, empty/loading/error flows, accessibility, and predictable interaction patterns come before decoration.",
      ["ui-ux-pro-max"],
      ["functional UX rules", "state matrix", "accessibility constraints"],
      ["functional states named before UI code"],
    );
  }

  const usesRegistry = input.usesShadcn || input.usesShadcnMcp || stack.toLowerCase().includes("shadcn") || ["dashboard", "saas-app", "data-app", "component-system", "3d-app"].includes(input.surfaceKind);
  if (usesRegistry) {
    addStage(
      "component-registry",
      "Use professional components before inventing them",
      "Use shadcn rules and registry/MCP lookup when available so the agent composes proven components instead of hand-rolling dashboard primitives.",
      ["shadcn-ui"],
      ["component list", "registry lookup receipt", "project-fit notes"],
      ["do not invent unavailable components", "verify installed component paths"],
    );
  }

  if (input.surfaceKind === "dashboard" || input.surfaceKind === "data-app") {
    addStage(
      "dashboard-information-architecture",
      "Arrange dashboard information first",
      "Reason through grouping, scan paths, chart/table density, summary/detail split, and clutter before rendering cards or charts.",
      ["dashboard-arrangement", "ui-ux-pro-max"],
      ["data grouping map", "screen density budget", "chart/table hierarchy"],
      ["dashboard layout reasoned before component placement"],
    );
  }

  if (isFunctionalSurface(input.surfaceKind) || input.productCategory) {
    addStage(
      "industry-fit-engine",
      "Run industry-fit design intelligence",
      "Choose palette, font pairing, layout, and interaction rules from the product category rather than generic taste. This mirrors the UI UX Pro Max flow of searching a style database before code.",
      ["ui-ux-pro-max"],
      ["product category", "palette", "font pairing", "layout rationale"],
      ["category-specific choices recorded in the design brief"],
    );
  }

  if (input.stylePreset) {
    const skillByPreset: Record<DesignStylePreset, string> = {
      minimalist: "taste-minimalist-ui",
      "industrial-brutalist": "taste-industrial-brutalist-ui",
      "all-rounder": "frontend-ui-ux",
      premium: "premium-frontend-ui",
    };
    addStage(
      "taste-preset",
      "Choose exactly one taste preset",
      "Apply one explicit aesthetic lane instead of stacking unrelated styles: minimalist, industrial/brutalist, all-rounder, or premium.",
      [skillByPreset[input.stylePreset]],
      ["chosen style preset", "why this style fits the audience", "what styles were rejected"],
      ["only one taste preset selected"],
    );
  }

  if (input.needsAnimation || input.surfaceKind === "animation-heavy") {
    addStage(
      "motion-plan",
      "Motion plan with performance rules",
      "Use GSAP-style animation patterns only where motion improves comprehension, with transform/opacity-first animation and reduced-motion fallback.",
      ["gsap-skills"],
      ["animation storyboard", "performance rule", "reduced-motion fallback"],
      ["no layout-thrashing animation", "motion is verified in browser"],
    );
  }

  if (input.needsVisualContent || stack.toLowerCase().includes("hero image") || stack.toLowerCase().includes("background video")) {
    addStage(
      "visual-content",
      "Generate real visual assets when needed",
      "Use image/video generation guidance for hero images, product shots, or background clips instead of unrelated stock imagery or gray placeholders.",
      ["higgsfield-skills"],
      ["visual prompt", "asset path", "usage rights/spend note"],
      ["auth/spend approved", "generated asset renders in the UI"],
    );
  }

  if (input.surfaceKind === "mobile-app" || input.needsMobileNative || targetPlatform !== "web" || /react native|expo|swiftui|android|ios/i.test(stack)) {
    const mobileSkills = ["mobile-app-ui-design"];
    if (targetPlatform === "ios" || /ios|swiftui|swift/i.test(stack)) mobileSkills.push("swiftui-skills");
    if (targetPlatform === "android" || /android|material|flutter/i.test(stack)) mobileSkills.push("material-3");
    if (targetPlatform === "cross-platform" || /expo|react native/i.test(stack)) mobileSkills.push("expo-skills");
    addStage(
      "mobile-native-rules",
      "Mobile is not small web",
      "Apply thumb-zone, platform navigation, spacing, font-scale discipline, and native platform conventions before building mobile screens.",
      mobileSkills,
      ["thumb-zone map", "platform design system", "device breakpoint proof"],
      ["mobile proof on device/emulator or mobile viewport"],
    );
  }

  addStage(
    "implementation-proof",
    "Implement from contract and verify in the real UI",
    "Convert decisions into a Design Brief and Component Contract, implement by reusing existing components, then browser/device verify screenshots, DOM signals, interactions, responsive behavior, and token usage.",
    [],
    ["design-brief.md", "component-contract.md", "Playwright screenshot", "DOM signal", "visual diff", "mobile breakpoint"],
    ["implementation happens after design decisions", "browser/device proof required before claim"],
  );

  if (input.usesShadcnMcp) warnings.push("full flow expects a shadcn registry/MCP lookup receipt, not just a component name");
  if (!input.productCategory && isFunctionalSurface(input.surfaceKind)) warnings.push("functional full flow is stronger with --category so palette/font/layout are industry-fit");

  const selectedSkillIds = unique([...selected]).filter((id) => designSkillRegistry().some((s) => s.id === id));
  return {
    schemaVersion: 1,
    runtime,
    surfaceKind: input.surfaceKind,
    targetPlatform,
    productCategory: input.productCategory ?? "unspecified",
    selectedSkillIds,
    sequence: stages.map((stage) => stage.id),
    stages,
    requiredArtifacts: unique(stages.flatMap((stage) => stage.requiredArtifacts)),
    warnings: unique(warnings),
  };
}

export function verifyDesignFullFlow(plan: DesignFullFlowPlan): DesignFullFlowVerification {
  const errors: string[] = [];
  const warnings = [...plan.warnings];
  const registry = designSkillRegistry();
  const byId = new Map(registry.map((s) => [s.id, s]));
  const stageIds = new Set(plan.stages.map((stage) => stage.id));
  const selectedIds = new Set(plan.selectedSkillIds);

  if (plan.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!designAgentRuntimes.includes(plan.runtime)) errors.push(`unsupported runtime '${plan.runtime}'`);
  if (!designSurfaceKinds.includes(plan.surfaceKind)) errors.push(`unsupported surface kind '${plan.surfaceKind}'`);
  if (!designTargetPlatforms.includes(plan.targetPlatform)) errors.push(`unsupported target platform '${plan.targetPlatform}'`);
  if (plan.sequence[0] !== "surface-classification") errors.push("full design flow must start with surface-classification");
  if (plan.sequence[plan.sequence.length - 1] !== "implementation-proof") errors.push("full design flow must end with implementation-proof");
  if (!stageIds.has("implementation-proof")) errors.push("full design flow missing implementation-proof stage");

  for (const skillId of plan.selectedSkillIds) {
    const skill = byId.get(skillId);
    if (!skill) {
      errors.push(`unknown design skill '${skillId}'`);
      continue;
    }
    if (skill.agentLocked) errors.push(`design skill '${skillId}' is marked agent-locked`);
    if (!skill.runtimeSupport.includes(plan.runtime) && !skill.runtimeSupport.includes("generic-agent")) {
      warnings.push(`design skill '${skillId}' has no explicit '${plan.runtime}' support; use as portable markdown only`);
    }
  }

  for (const stage of plan.stages) {
    for (const skillId of stage.selectedSkillIds) {
      if (!selectedIds.has(skillId)) errors.push(`stage '${stage.id}' uses skill '${skillId}' that is not in selectedSkillIds`);
      if (!byId.has(skillId)) errors.push(`stage '${stage.id}' references unknown skill '${skillId}'`);
    }
    if (stage.requiredArtifacts.length === 0) errors.push(`stage '${stage.id}' has no required artifacts`);
    if (stage.gates.length === 0) errors.push(`stage '${stage.id}' has no gates`);
  }

  if ((plan.surfaceKind === "marketing-site" || plan.surfaceKind === "portfolio") && !stageIds.has("break-default-direction")) {
    errors.push("marketing/portfolio flow requires break-default-direction");
  }
  if (isFunctionalSurface(plan.surfaceKind) && !stageIds.has("functional-product-system")) {
    errors.push("functional product flow requires functional-product-system");
  }
  if ((plan.surfaceKind === "dashboard" || plan.surfaceKind === "data-app") && !stageIds.has("dashboard-information-architecture")) {
    errors.push("dashboard/data flow requires dashboard-information-architecture");
  }
  if ((plan.surfaceKind === "dashboard" || plan.surfaceKind === "data-app") && !selectedIds.has("dashboard-arrangement")) {
    errors.push("dashboard/data flow requires dashboard-arrangement skill");
  }
  if (plan.surfaceKind === "mobile-app" && !stageIds.has("mobile-native-rules")) {
    errors.push("mobile app flow requires mobile-native-rules");
  }
  if (plan.targetPlatform === "ios" && !selectedIds.has("swiftui-skills")) errors.push("iOS flow requires swiftui-skills");
  if (plan.targetPlatform === "android" && !selectedIds.has("material-3")) errors.push("Android flow requires material-3");
  if (plan.targetPlatform === "cross-platform" && !selectedIds.has("expo-skills")) errors.push("cross-platform mobile flow requires expo-skills");

  for (const artifact of ["design-brief.md", "component-contract.md", "Playwright screenshot", "DOM signal"]) {
    if (!plan.requiredArtifacts.includes(artifact)) errors.push(`full design flow missing required artifact '${artifact}'`);
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings: unique(warnings),
    summary: {
      stages: plan.stages.length,
      skills: plan.selectedSkillIds.length,
      artifacts: plan.requiredArtifacts.length,
    },
  };
}
