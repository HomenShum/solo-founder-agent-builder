// SoloMemory — export to Open Knowledge Format (Markdown + YAML frontmatter). Portable template.
import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import type { MemoryRecord } from "./types";
import { SoloMemory } from "./localMemory";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function exportMemoryToOkf(args: {
  memory: SoloMemory;
  projectId: string;
  outDir?: string;
}) {
  const outDir = args.outDir ?? ".solo-memory/okf-memory";
  const memories = await args.memory.listRecent(args.projectId, 10_000);

  fs.mkdirSync(path.join(outDir, "memories"), { recursive: true });

  const indexLines = [
    "---",
    YAML.stringify({
      type: "Memory Index",
      title: `Solo Memory Index · ${args.projectId}`,
      tags: ["solo-founder-nodes", "memory", "okf"],
      timestamp: new Date().toISOString(),
    }).trim(),
    "---",
    "",
    `# Solo Memory Index`,
    "",
  ];

  for (const record of memories) {
    const fileName = `${slugify(record.phase)}-${slugify(record.kind)}-${record.id}.md`;
    const relPath = `memories/${fileName}`;

    writeMemoryConcept(path.join(outDir, relPath), record);
    indexLines.push(`- [${record.summary}](${relPath})`);
  }

  fs.writeFileSync(path.join(outDir, "index.md"), indexLines.join("\n"), "utf8");
  fs.writeFileSync(
    path.join(outDir, "log.md"),
    [
      "---",
      YAML.stringify({
        type: "Memory Export Log",
        title: "Solo Memory export log",
        tags: ["solo-founder-nodes", "memory", "export"],
        timestamp: new Date().toISOString(),
      }).trim(),
      "---",
      "",
      `Exported ${memories.length} memories for project \`${args.projectId}\`.`,
    ].join("\n"),
    "utf8",
  );

  return { outDir, count: memories.length };
}

function writeMemoryConcept(filePath: string, record: MemoryRecord) {
  const frontmatter = {
    type: "Solo Memory",
    title: record.summary,
    description: `${record.phase} · ${record.kind}`,
    resource: `solo-memory://${record.projectId}/${record.id}`,
    tags: record.tags,
    timestamp: record.updatedAt,
    memory: {
      id: record.id,
      projectId: record.projectId,
      phase: record.phase,
      kind: record.kind,
      visibility: record.visibility,
      benchmarkSafety: record.benchmarkSafety,
      importance: record.importance,
      evidenceRefs: record.evidenceRefs,
      metadata: record.metadata,
    },
  };

  const body = [
    "---",
    YAML.stringify(frontmatter).trim(),
    "---",
    "",
    `# ${record.summary}`,
    "",
    "## Content",
    "",
    record.content || "_No expanded content._",
    "",
    "## Evidence",
    "",
    record.evidenceRefs.length
      ? record.evidenceRefs
          .map((e) => `- **${e.type}**: \`${e.ref}\`${e.note ? ` — ${e.note}` : ""}`)
          .join("\n")
      : "_No evidence refs._",
  ].join("\n");

  fs.writeFileSync(filePath, body, "utf8");
}
