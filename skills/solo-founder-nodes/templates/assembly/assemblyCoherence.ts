import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

export type AssemblyInterfaceStatus = "planned" | "pass" | "partial" | "blocked";
export type AssemblyInterfaceKind =
  | "attached"
  | "contained"
  | "aligned"
  | "feeds"
  | "calls"
  | "owns-state"
  | "export-bound"
  | "proof-bound"
  | "non-floating";

export type AssemblyComponentInput = {
  id: string;
  label: string;
  kind?: string;
  parent?: string;
  required?: boolean;
  interfaces?: string[];
};

export type AssemblyInterfaceInput = {
  id: string;
  label: string;
  kind?: AssemblyInterfaceKind;
  from: string;
  to: string;
  status?: AssemblyInterfaceStatus;
  required?: boolean;
  evidencePaths?: string[];
  tolerance?: string;
};

export type AssemblySubassembly = {
  id: string;
  label: string;
  role: string;
  componentIds: string[];
  requiredInterfaceIds: string[];
};

export type AssemblyInterfaceGate = {
  id: string;
  label: string;
  kind: AssemblyInterfaceKind;
  from: string;
  to: string;
  status: AssemblyInterfaceStatus;
  required: boolean;
  tolerance: string;
  evidencePaths: string[];
};

export type AssemblyCoherenceReceipt = {
  schemaVersion: 1;
  receiptKind: "assembly-coherence";
  goal: string;
  domain: string;
  generatedAt: string;
  doctrine: {
    flatComponentsAreNotEnough: true;
    parentCannotPassWithoutInterfaces: true;
    proofMustInspectComposedArtifact: true;
  };
  subassemblies: AssemblySubassembly[];
  interfaces: AssemblyInterfaceGate[];
  globalConstraints: string[];
  blockedClaims: string[];
};

export type AssemblyCoherenceVerdict = {
  ok: boolean;
  errors: string[];
  warnings: string[];
  missingProofs: string[];
};

export const assemblyCoherenceRelativePath = ".solo/ledgers/assembly-coherence.json";

export function assemblyCoherencePath(projectPath: string) {
  return resolve(projectPath, assemblyCoherenceRelativePath);
}

export function makeAssemblyCoherenceReceipt(input: {
  goal: string;
  domain?: string;
  generatedAt?: string;
  components?: AssemblyComponentInput[];
  interfaces?: AssemblyInterfaceInput[];
  status?: AssemblyInterfaceStatus;
}): AssemblyCoherenceReceipt {
  const domain = input.domain ?? "general";
  const components = input.components?.length ? input.components : defaultAssemblyComponents(domain, input.goal);
  const interfaces = input.interfaces?.length ? input.interfaces : defaultInterfaces(components, input.status ?? "planned");
  return {
    schemaVersion: 1,
    receiptKind: "assembly-coherence",
    goal: input.goal,
    domain,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    doctrine: {
      flatComponentsAreNotEnough: true,
      parentCannotPassWithoutInterfaces: true,
      proofMustInspectComposedArtifact: true,
    },
    subassemblies: defaultSubassemblies(components, interfaces, domain),
    interfaces: interfaces.map((edge) => ({
      id: edge.id,
      label: edge.label,
      kind: edge.kind ?? inferInterfaceKind(edge),
      from: edge.from,
      to: edge.to,
      status: edge.status ?? input.status ?? "planned",
      required: edge.required ?? true,
      tolerance: edge.tolerance ?? toleranceFor(domain, edge),
      evidencePaths: edge.evidencePaths?.length
        ? edge.evidencePaths
        : [`assembly/${edge.id}/proof.json`],
    })),
    globalConstraints: [
      "Component RALPH proves child components; Assembly Coherence proves those children work together.",
      "A parent deliverable cannot claim professional quality when required interfaces are missing, floating, unbound, or unverified.",
      "The proof runner must inspect the composed artifact, not only isolated component receipts.",
    ],
    blockedClaims: [
      "professional workflow match",
      "industry-grade output",
      "production-ready deployment",
      "real-user task completion",
    ],
  };
}

export function verifyAssemblyCoherenceReceipt(
  receipt: AssemblyCoherenceReceipt,
  options: { baseDir?: string; requireFiles?: boolean; requireCompleted?: boolean } = {},
): AssemblyCoherenceVerdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingProofs: string[] = [];
  const baseDir = options.baseDir ?? process.cwd();
  const requireFiles = options.requireFiles ?? true;
  const requireCompleted = options.requireCompleted ?? true;

  if (receipt.schemaVersion !== 1) errors.push("assembly coherence schemaVersion must be 1");
  if (receipt.receiptKind !== "assembly-coherence") errors.push("assembly coherence receiptKind must be assembly-coherence");
  if (!receipt.goal?.trim()) errors.push("assembly coherence requires goal");
  if (!receipt.domain?.trim()) errors.push("assembly coherence requires domain");
  if (receipt.doctrine?.flatComponentsAreNotEnough !== true) errors.push("assembly coherence must reject flat component proof");
  if (receipt.doctrine?.parentCannotPassWithoutInterfaces !== true) errors.push("assembly coherence parent gate must fail closed");
  if (receipt.doctrine?.proofMustInspectComposedArtifact !== true) errors.push("assembly coherence must require composed-artifact proof");
  if ((receipt.subassemblies ?? []).length === 0) errors.push("assembly coherence requires at least one subassembly");
  if ((receipt.interfaces ?? []).length === 0) errors.push("assembly coherence requires at least one interface");

  const interfaceIds = new Set((receipt.interfaces ?? []).map((edge) => edge.id));
  const componentIds = new Set<string>();
  for (const subassembly of receipt.subassemblies ?? []) {
    if (!subassembly.id || !subassembly.label || !subassembly.role) errors.push("subassembly requires id, label, and role");
    if ((subassembly.componentIds ?? []).length === 0) errors.push(`subassembly ${subassembly.id} requires componentIds`);
    if ((subassembly.requiredInterfaceIds ?? []).length === 0) errors.push(`subassembly ${subassembly.id} requires interface ids`);
    for (const componentId of subassembly.componentIds ?? []) componentIds.add(componentId);
    for (const interfaceId of subassembly.requiredInterfaceIds ?? []) {
      if (!interfaceIds.has(interfaceId)) {
        errors.push(`subassembly ${subassembly.id} references missing interface ${interfaceId}`);
        missingProofs.push(`assembly.subassembly:${subassembly.id}:${interfaceId}`);
      }
    }
  }

  for (const edge of receipt.interfaces ?? []) {
    if (!edge.id || !edge.label || !edge.from || !edge.to) errors.push(`interface ${edge.id || "<missing>"} requires id, label, from, and to`);
    if (edge.required && requireCompleted && edge.status !== "pass") {
      errors.push(`required assembly interface ${edge.id} is not pass`);
      missingProofs.push(`assembly.interface:${edge.id}`);
    }
    if ((edge.evidencePaths ?? []).length === 0) errors.push(`interface ${edge.id} needs evidence paths`);
    if (requireFiles) {
      for (const evidencePath of edge.evidencePaths ?? []) {
        if (!existsSync(resolve(baseDir, evidencePath))) {
          errors.push(`interface ${edge.id} evidence file does not exist: ${evidencePath}`);
          missingProofs.push(`assembly.interface:${edge.id}:${evidencePath}`);
        }
      }
    }
  }

  const interfaceParticipants = new Set<string>();
  for (const edge of receipt.interfaces ?? []) {
    for (const id of [edge.from, edge.to].flatMap((value) => value.split("/"))) interfaceParticipants.add(id);
  }
  const floatingComponents = [...componentIds].filter((id) => !interfaceParticipants.has(id));
  if (floatingComponents.length > 0) {
    warnings.push(`components without interface participation: ${floatingComponents.join(", ")}`);
  }

  const hasNoFloatingGate = (receipt.interfaces ?? []).some((edge) => edge.kind === "non-floating" || /floating/i.test(edge.label));
  if (!hasNoFloatingGate) {
    errors.push("assembly coherence requires a no-floating or equivalent composed-artifact gate");
    missingProofs.push("assembly.interface:no-floating");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    missingProofs: [...new Set(missingProofs)],
  };
}

export function readAssemblyCoherenceReceipt(projectPath: string): AssemblyCoherenceReceipt | undefined {
  const path = assemblyCoherencePath(projectPath);
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, "utf8")) as AssemblyCoherenceReceipt;
}

function defaultAssemblyComponents(domain: string, goal: string): AssemblyComponentInput[] {
  const text = `${domain} ${goal}`.toLowerCase();
  if (/3d|mesh|model|asset|glb|gltf|cad|blender|game/.test(text)) {
    return [
      component("part-graph", "Part graph", "structure", "asset"),
      component("geometry", "Geometry system", "geometry", "asset"),
      component("topology", "Topology/normal system", "topology", "asset"),
      component("uv-pbr", "UV/PBR material system", "material", "asset"),
      component("export-runtime", "Export/runtime binding", "export", "asset"),
      component("proof-runner", "Live proof runner", "proof", "asset"),
    ];
  }
  if (/dashboard|ui|app|agent|workflow|automation/.test(text)) {
    return [
      component("input-intake", "Input intake", "ui", "product"),
      component("state-store", "State store", "state", "product"),
      component("agent-runtime", "Agent/runtime", "agent", "product"),
      component("action-surface", "Action surface", "ui", "product"),
      component("proof-runner", "Proof runner", "proof", "product"),
    ];
  }
  return [
    component("user-input", "User input", "input", "product"),
    component("core-logic", "Core logic", "logic", "product"),
    component("output-artifact", "Output artifact", "artifact", "product"),
    component("proof-runner", "Proof runner", "proof", "product"),
  ];
}

function defaultInterfaces(components: AssemblyComponentInput[], status: AssemblyInterfaceStatus): AssemblyInterfaceInput[] {
  const edges: AssemblyInterfaceInput[] = [];
  for (let index = 0; index < components.length - 1; index++) {
    const from = components[index];
    const to = components[index + 1];
    edges.push({
      id: `${from.id}-to-${to.id}`,
      label: `${from.label} connects to ${to.label}`,
      from: from.id,
      to: to.id,
      status,
      required: true,
    });
  }
  if (components.length > 0) {
    edges.push({
      id: "assembly.no-floating-primary-components",
      label: "No primary component is floating outside the composed artifact",
      kind: "non-floating",
      from: components.map((componentInput) => componentInput.id).join("/"),
      to: "assembly-graph",
      status,
      required: true,
      tolerance: "all required components participate in a declared interface",
    });
  }
  return edges;
}

function defaultSubassemblies(
  components: AssemblyComponentInput[],
  interfaces: AssemblyInterfaceInput[],
  domain: string,
): AssemblySubassembly[] {
  const byParent = new Map<string, AssemblyComponentInput[]>();
  for (const part of components) {
    const parent = part.parent ?? inferParent(part, domain);
    byParent.set(parent, [...(byParent.get(parent) ?? []), part]);
  }
  return [...byParent.entries()].map(([id, members]) => ({
    id,
    label: titleize(id),
    role: `Composed ${domain} subassembly that must be proven through interface continuity.`,
    componentIds: members.map((member) => member.id),
    requiredInterfaceIds: interfaces
      .filter((edge) => members.some((member) => edge.from.split("/").includes(member.id) || edge.to.split("/").includes(member.id)))
      .map((edge) => edge.id),
  }));
}

function inferParent(part: AssemblyComponentInput, domain: string) {
  const text = `${domain} ${part.id} ${part.label} ${part.kind ?? ""}`.toLowerCase();
  if (/export|runtime|proof|viewer|deploy/.test(text)) return "runtime-proof-assembly";
  if (/material|uv|pbr|texture|topology|geometry|mesh/.test(text)) return "artifact-quality-assembly";
  if (/agent|tool|state|memory|action/.test(text)) return "agent-control-assembly";
  return "primary-product-assembly";
}

function inferInterfaceKind(edge: AssemblyInterfaceInput): AssemblyInterfaceKind {
  const text = `${edge.id} ${edge.label} ${edge.from} ${edge.to}`.toLowerCase();
  if (/export|runtime|proof|reopen/.test(text)) return "export-bound";
  if (/state|store|memory|own/.test(text)) return "owns-state";
  if (/api|call|tool/.test(text)) return "calls";
  if (/float/.test(text)) return "non-floating";
  if (/contain|inside/.test(text)) return "contained";
  if (/align|symmetry|mirror/.test(text)) return "aligned";
  if (/feed|data|input|output/.test(text)) return "feeds";
  return "attached";
}

function toleranceFor(domain: string, edge: AssemblyInterfaceInput) {
  const kind = edge.kind ?? inferInterfaceKind(edge);
  if (kind === "non-floating") return "zero required primary components without interface participation";
  if (/3d|mesh|asset|cad|gltf/.test(domain)) return "measured transform, containment, attachment, or reopen gate within domain tolerance";
  if (kind === "feeds") return "producer output schema matches consumer input schema";
  if (kind === "calls") return "typed API/tool contract passes with error handling evidence";
  return "interface is proven by live artifact, trace, or receipt";
}

function component(id: string, label: string, kind: string, parent: string): AssemblyComponentInput {
  return { id, label, kind, parent, required: true };
}

function titleize(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
