// SoloMemory — append-only JSONL audit ledger (portable template).
import fs from "node:fs";
import path from "node:path";

export type MemoryEvent = {
  id: string;
  projectId: string;
  memoryId?: string;
  eventType:
    | "remember"
    | "retrieve"
    | "update"
    | "delete"
    | "quarantine_reject"
    | "okf_export"
    | "mem0_sync";
  payload: unknown;
  createdAt: string;
};

export class JsonlEventLog {
  constructor(private readonly filePath: string) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  append(event: MemoryEvent) {
    fs.appendFileSync(this.filePath, JSON.stringify(event) + "\n", "utf8");
  }

  tail(limit = 50): MemoryEvent[] {
    if (!fs.existsSync(this.filePath)) return [];

    const lines = fs
      .readFileSync(this.filePath, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean);

    return lines.slice(-limit).map((line) => JSON.parse(line));
  }
}
