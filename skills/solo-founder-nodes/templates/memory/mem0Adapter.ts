// SoloMemory — OPTIONAL Mem0 adapter (portable template).
// Mem0 is a sync target for SAFE cross-project / founder-preference memory ONLY — never the authority.
// isSafeForMem0() is the gate: it blocks held-out, redacted, private, keys, and PII before any sync.
import type { MemoryRecord } from "./types";

export type Mem0AdapterArgs = {
  apiKey?: string;
  baseUrl?: string;
  appId?: string;
  agentId?: string;
};

export class Mem0Adapter {
  private readonly apiKey?: string;
  private readonly baseUrl: string;
  private readonly appId: string;
  private readonly agentId: string;

  constructor(args: Mem0AdapterArgs = {}) {
    this.apiKey = args.apiKey ?? process.env.MEM0_API_KEY;
    this.baseUrl = args.baseUrl ?? process.env.MEM0_BASE_URL ?? "https://api.mem0.ai";
    this.appId = args.appId ?? process.env.MEM0_APP_ID ?? "solo-founder-nodes";
    this.agentId = args.agentId ?? process.env.MEM0_AGENT_ID ?? "solo-founder-nodes";
  }

  enabled() {
    return Boolean(this.apiKey);
  }

  async syncSafeMemory(record: MemoryRecord) {
    if (!this.enabled()) {
      return { skipped: true, reason: "MEM0_API_KEY not set" };
    }

    if (!isSafeForMem0(record)) {
      return { skipped: true, reason: `not safe for Mem0: ${record.benchmarkSafety}` };
    }

    const res = await fetch(`${this.baseUrl}/v3/memories/add/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        app_id: this.appId,
        agent_id: this.agentId,
        user_id: record.userId,
        infer: false,
        messages: [
          {
            role: "user",
            content: renderMem0Message(record),
          },
        ],
        metadata: {
          source: "solo-memory-local",
          projectId: record.projectId,
          memoryId: record.id,
          phase: record.phase,
          kind: record.kind,
          tags: record.tags,
          visibility: record.visibility,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Mem0 sync failed: ${res.status} ${await res.text()}`);
    }

    return await res.json();
  }

  async getMem0Memories(filters: Record<string, unknown>) {
    if (!this.enabled()) {
      return { skipped: true, reason: "MEM0_API_KEY not set" };
    }

    const res = await fetch(`${this.baseUrl}/v3/memories/?page=1&page_size=50`, {
      method: "POST",
      headers: {
        Authorization: `Token ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filters }),
    });

    if (!res.ok) {
      throw new Error(`Mem0 get failed: ${res.status} ${await res.text()}`);
    }

    return await res.json();
  }
}

function isSafeForMem0(record: MemoryRecord) {
  if (record.benchmarkSafety === "heldout_forbidden") return false;
  if (record.benchmarkSafety === "redacted") return false;
  if (record.visibility === "private_user") return false;

  const text = `${record.summary}\n${record.content}`;
  if (/sk-[a-zA-Z0-9]/.test(text)) return false;
  if (/api[_-]?key/i.test(text)) return false;
  if (/password/i.test(text)) return false;

  return true;
}

function renderMem0Message(record: MemoryRecord) {
  return [
    `Project: ${record.projectId}`,
    `Phase: ${record.phase}`,
    `Kind: ${record.kind}`,
    `Summary: ${record.summary}`,
    `Content: ${record.content}`,
    `Tags: ${record.tags.join(", ")}`,
  ].join("\n");
}
