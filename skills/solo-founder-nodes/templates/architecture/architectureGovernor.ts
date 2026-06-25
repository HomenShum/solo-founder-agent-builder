import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type SystemMapNodeKind =
  | "ui"
  | "agent"
  | "tool"
  | "data"
  | "storage"
  | "proof"
  | "research"
  | "deployment"
  | "external";

export type SystemMapNode = {
  id: string;
  label: string;
  kind: SystemMapNodeKind;
  path?: string;
  owner?: string;
};

export type SystemMapEdge = {
  from: string;
  to: string;
  relation: string;
};

export type SystemMapGraph = {
  schemaVersion: 1;
  generatedAt: string;
  projectGoal: string;
  nodes: SystemMapNode[];
  edges: SystemMapEdge[];
  governance: {
    architectureGovernorRequired: true;
    updateRequiredWhenDirectionChanges: true;
    ciShouldFailOnStaleGraph: true;
  };
};

export type SystemMapVerdict = {
  ok: boolean;
  errors: string[];
  warnings: string[];
};

export function makeSystemMapGraph(input: {
  projectGoal: string;
  generatedAt?: string;
  nodes?: SystemMapNode[];
  edges?: SystemMapEdge[];
}): SystemMapGraph {
  const nodes = input.nodes?.length ? input.nodes : defaultNodes();
  const edges = input.edges?.length ? input.edges : defaultEdges();
  return {
    schemaVersion: 1,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    projectGoal: input.projectGoal,
    nodes,
    edges,
    governance: {
      architectureGovernorRequired: true,
      updateRequiredWhenDirectionChanges: true,
      ciShouldFailOnStaleGraph: true,
    },
  };
}

export function validateSystemMapGraph(graph: SystemMapGraph): SystemMapVerdict {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (graph.schemaVersion !== 1) errors.push("system map schemaVersion must be 1");
  if (!graph.projectGoal?.trim()) errors.push("system map requires projectGoal");
  if (!graph.nodes?.length) errors.push("system map requires nodes");
  if (!graph.edges?.length) errors.push("system map requires edges");
  if (graph.governance?.architectureGovernorRequired !== true) errors.push("architecture governor must be required");
  if (graph.governance?.updateRequiredWhenDirectionChanges !== true) errors.push("direction changes must require graph updates");
  const ids = new Set((graph.nodes ?? []).map((node) => node.id));
  for (const edge of graph.edges ?? []) {
    if (!ids.has(edge.from)) errors.push(`edge references unknown from node: ${edge.from}`);
    if (!ids.has(edge.to)) errors.push(`edge references unknown to node: ${edge.to}`);
  }
  for (const requiredKind of ["ui", "agent", "proof", "research"]) {
    if (!graph.nodes.some((node) => node.kind === requiredKind)) warnings.push(`system map has no ${requiredKind} node`);
  }
  return { ok: errors.length === 0, errors, warnings };
}

export function renderSystemMapMermaid(graph: SystemMapGraph): string {
  const lines = ["flowchart LR"];
  for (const node of graph.nodes) {
    lines.push(`  ${safe(node.id)}["${node.label} (${node.kind})"]`);
  }
  for (const edge of graph.edges) {
    lines.push(`  ${safe(edge.from)} -->|"${edge.relation}"| ${safe(edge.to)}`);
  }
  return `${lines.join("\n")}\n`;
}

export function readSystemMapGraph(path: string): SystemMapGraph {
  return JSON.parse(readFileSync(resolve(path), "utf8")) as SystemMapGraph;
}

export function writeSystemMapGraph(path: string, graph: SystemMapGraph) {
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, `${JSON.stringify(graph, null, 2)}\n`, "utf8");
  return abs;
}

export function systemMapExists(path: string) {
  return existsSync(resolve(path));
}

function safe(id: string) {
  return id.replace(/[^a-zA-Z0-9_]/g, "_");
}

function defaultNodes(): SystemMapNode[] {
  return [
    { id: "user-ui", label: "User-facing app UI", kind: "ui", path: "src/" },
    { id: "agent-loop", label: "Coding/agent loop", kind: "agent", path: ".solo/" },
    { id: "research-spine", label: "Research spine and briefs", kind: "research", path: "docs/research/" },
    { id: "proof-registry", label: "Proof registry and verdicts", kind: "proof", path: ".solo/receipts/" },
    { id: "component-ledger", label: "Component RALPH ledger", kind: "proof", path: ".solo/ledgers/component-ralph.json" },
  ];
}

function defaultEdges(): SystemMapEdge[] {
  return [
    { from: "user-ui", to: "agent-loop", relation: "captures user actions and prompts" },
    { from: "agent-loop", to: "research-spine", relation: "must cite before decisions" },
    { from: "agent-loop", to: "component-ledger", relation: "must prove components" },
    { from: "component-ledger", to: "proof-registry", relation: "feeds parent proof verdict" },
    { from: "research-spine", to: "proof-registry", relation: "defines proof obligations" },
  ];
}
