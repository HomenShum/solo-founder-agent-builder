// SoloMemory — local-first memory engine (portable template).
// SQLite/libSQL is the source of truth; FTS5 is the default recall path; embeddings optional.
// Enforces the held-out quarantine on write (benchmarkSafety='heldout_forbidden' is rejected).
import { createClient, type Client } from "@libsql/client";
import { nanoid } from "nanoid";
import path from "node:path";
import {
  type EmbeddingProvider,
  type MemoryHit,
  type MemoryRecord,
  type MemorySearchOptions,
  rememberInputSchema,
  type RememberInput,
} from "./types";
import { MEMORY_SCHEMA_SQL } from "./schema";
import { JsonlEventLog } from "./eventLog";
import {
  applyLowConfidenceRejection,
  reciprocalRankFusion,
  rerankMemoryHits,
  tokenizeForFts,
} from "./retrieval";
import { cosineSimilarity } from "./embedding";

type SoloMemoryArgs = {
  dbUrl?: string;
  eventLogPath?: string;
  embeddingProvider?: EmbeddingProvider;
};

export class SoloMemory {
  private readonly db: Client;
  private readonly events: JsonlEventLog;
  private readonly embeddingProvider?: EmbeddingProvider;

  constructor(args: SoloMemoryArgs = {}) {
    this.db = createClient({
      url: args.dbUrl ?? process.env.SOLO_MEMORY_DB_URL ?? "file:.solo-memory/memory.db",
    });

    this.events = new JsonlEventLog(
      args.eventLogPath ?? path.join(".solo-memory", "memory.events.jsonl"),
    );

    this.embeddingProvider = args.embeddingProvider;
  }

  async init() {
    await this.db.executeMultiple(MEMORY_SCHEMA_SQL);
  }

  async remember(input: RememberInput) {
    const parsed = rememberInputSchema.parse(input);
    this.assertBenchmarkSafe(parsed);

    const id = `mem_${nanoid(12)}`;
    const now = new Date().toISOString();

    const tagsJson = JSON.stringify(parsed.tags);
    const evidenceRefsJson = JSON.stringify(parsed.evidenceRefs);
    const metadataJson = JSON.stringify(parsed.metadata);

    const contentForEmbedding = this.renderForEmbedding(parsed);

    const inserted = await this.db.execute({
      sql: `
        INSERT INTO memories (
          id, project_id, user_id, phase, kind,
          summary, content, tags_json,
          importance, visibility, benchmark_safety,
          evidence_refs_json, metadata_json,
          created_at, updated_at, access_count
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
        RETURNING rowid
      `,
      args: [
        id,
        parsed.projectId,
        parsed.userId ?? null,
        parsed.phase,
        parsed.kind,
        parsed.summary,
        parsed.content,
        tagsJson,
        parsed.importance,
        parsed.visibility,
        parsed.benchmarkSafety,
        evidenceRefsJson,
        metadataJson,
        now,
        now,
      ],
    });

    const rowid = Number(inserted.rows[0]?.rowid);
    if (!rowid) throw new Error("Failed to insert memory.");

    await this.db.execute({
      sql: `
        INSERT INTO memory_fts(rowid, summary, content, tags)
        VALUES (?, ?, ?, ?)
      `,
      args: [rowid, parsed.summary, parsed.content, parsed.tags.join(" ")],
    });

    if (this.embeddingProvider) {
      const embedding = await this.embeddingProvider.embed(contentForEmbedding);

      await this.db.execute({
        sql: `
          INSERT INTO memory_vectors(memory_id, model, dim, embedding_json, created_at)
          VALUES (?, ?, ?, ?, ?)
        `,
        args: [
          id,
          this.embeddingProvider.model,
          embedding.length,
          JSON.stringify(embedding),
          now,
        ],
      });
    }

    await this.insertEvent({
      memoryId: id,
      projectId: parsed.projectId,
      eventType: "remember",
      payload: parsed,
    });

    return { id, rowid };
  }

  async search(options: MemorySearchOptions): Promise<MemoryHit[]> {
    const limit = options.limit ?? 8;
    const minScore = options.minScore ?? 0.38;

    const visibilityWhere = options.includePrivateUser
      ? `('local', 'project', 'private_user', 'public_safe')`
      : `('local', 'project', 'public_safe')`;

    const ftsIds = await this.keywordRecall(options, visibilityWhere, limit * 4);
    const vectorIds = this.embeddingProvider
      ? await this.vectorRecall(options, visibilityWhere, limit * 4)
      : [];

    const rrf = reciprocalRankFusion({ ftsIds, vectorIds });
    const candidateIds = [...rrf.keys()].slice(0, limit * 6);

    if (candidateIds.length === 0) {
      await this.insertEvent({
        projectId: options.projectId,
        eventType: "retrieve",
        payload: { query: options.query, count: 0, rejected: true },
      });
      return [];
    }

    const records = await this.getRecordsByIds(candidateIds);
    const reranked = rerankMemoryHits({
      query: options.query,
      records,
      rrf,
    });

    const accepted = applyLowConfidenceRejection(reranked, minScore).slice(0, limit);

    if (accepted.length > 0) {
      await this.markAccessed(accepted.map((h) => h.id));
    }

    await this.insertEvent({
      projectId: options.projectId,
      eventType: "retrieve",
      payload: {
        query: options.query,
        ftsIds,
        vectorIds,
        acceptedIds: accepted.map((h) => h.id),
        rejected: accepted.length === 0,
      },
    });

    return accepted;
  }

  async getById(id: string): Promise<MemoryRecord | null> {
    const rows = await this.db.execute({
      sql: `SELECT rowid, * FROM memories WHERE id = ?`,
      args: [id],
    });

    const row = rows.rows[0];
    return row ? this.rowToMemory(row) : null;
  }

  async forget(id: string, projectId: string) {
    await this.db.execute({
      sql: `DELETE FROM memories WHERE id = ? AND project_id = ?`,
      args: [id, projectId],
    });

    await this.insertEvent({
      memoryId: id,
      projectId,
      eventType: "delete",
      payload: { id },
    });
  }

  async listRecent(projectId: string, limit = 50) {
    const rows = await this.db.execute({
      sql: `
        SELECT rowid, * FROM memories
        WHERE project_id = ?
        ORDER BY created_at DESC
        LIMIT ?
      `,
      args: [projectId, limit],
    });

    return rows.rows.map((r) => this.rowToMemory(r));
  }

  private async keywordRecall(
    options: MemorySearchOptions,
    visibilityWhere: string,
    limit: number,
  ) {
    const ftsQuery = tokenizeForFts(options.query);
    if (!ftsQuery) return [];

    const phaseFilter = options.phase ? `AND m.phase = ?` : "";
    const args: unknown[] = [ftsQuery, options.projectId];

    if (options.phase) args.push(options.phase);

    const rows = await this.db.execute({
      sql: `
        SELECT m.id, bm25(memory_fts) AS rank
        FROM memory_fts
        JOIN memories m ON m.rowid = memory_fts.rowid
        WHERE memory_fts MATCH ?
          AND m.project_id = ?
          AND m.visibility IN ${visibilityWhere}
          AND m.benchmark_safety != 'heldout_forbidden'
          ${phaseFilter}
        ORDER BY rank
        LIMIT ${Number(limit)}
      `,
      args,
    });

    return rows.rows.map((r) => String(r.id));
  }

  private async vectorRecall(
    options: MemorySearchOptions,
    visibilityWhere: string,
    limit: number,
  ) {
    if (!this.embeddingProvider) return [];

    const queryEmbedding = await this.embeddingProvider.embed(options.query);

    const rows = await this.db.execute({
      sql: `
        SELECT
          m.id,
          v.embedding_json
        FROM memory_vectors v
        JOIN memories m ON m.id = v.memory_id
        WHERE m.project_id = ?
          AND m.visibility IN ${visibilityWhere}
          AND m.benchmark_safety != 'heldout_forbidden'
          AND v.model = ?
      `,
      args: [options.projectId, this.embeddingProvider.model],
    });

    const ranked = rows.rows
      .map((r) => {
        const embedding = JSON.parse(String(r.embedding_json)) as number[];
        return {
          id: String(r.id),
          score: cosineSimilarity(queryEmbedding, embedding),
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return ranked.map((r) => r.id);
  }

  private async getRecordsByIds(ids: string[]) {
    if (ids.length === 0) return [];

    const placeholders = ids.map(() => "?").join(",");
    const rows = await this.db.execute({
      sql: `
        SELECT rowid, * FROM memories
        WHERE id IN (${placeholders})
      `,
      args: ids,
    });

    const byId = new Map(rows.rows.map((r) => [String(r.id), this.rowToMemory(r)]));
    return ids.map((id) => byId.get(id)).filter(Boolean) as MemoryRecord[];
  }

  private rowToMemory(row: Record<string, unknown>): MemoryRecord {
    return {
      rowid: Number(row.rowid),
      id: String(row.id),
      projectId: String(row.project_id),
      userId: row.user_id ? String(row.user_id) : undefined,
      phase: row.phase as MemoryRecord["phase"],
      kind: row.kind as MemoryRecord["kind"],
      summary: String(row.summary),
      content: String(row.content),
      tags: JSON.parse(String(row.tags_json)),
      importance: Number(row.importance),
      visibility: row.visibility as MemoryRecord["visibility"],
      benchmarkSafety: row.benchmark_safety as MemoryRecord["benchmarkSafety"],
      evidenceRefs: JSON.parse(String(row.evidence_refs_json)),
      metadata: JSON.parse(String(row.metadata_json)),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      lastAccessedAt: row.last_accessed_at ? String(row.last_accessed_at) : undefined,
      accessCount: Number(row.access_count ?? 0),
    };
  }

  private async markAccessed(ids: string[]) {
    if (ids.length === 0) return;

    const now = new Date().toISOString();
    for (const id of ids) {
      await this.db.execute({
        sql: `
          UPDATE memories
          SET access_count = access_count + 1,
              last_accessed_at = ?
          WHERE id = ?
        `,
        args: [now, id],
      });
    }
  }

  private async insertEvent(args: {
    memoryId?: string;
    projectId: string;
    eventType: "remember" | "retrieve" | "update" | "delete" | "quarantine_reject" | "okf_export" | "mem0_sync";
    payload: unknown;
  }) {
    const id = `evt_${nanoid(12)}`;
    const now = new Date().toISOString();

    await this.db.execute({
      sql: `
        INSERT INTO memory_events(id, memory_id, project_id, event_type, payload_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        args.memoryId ?? null,
        args.projectId,
        args.eventType,
        JSON.stringify(args.payload),
        now,
      ],
    });

    this.events.append({
      id,
      memoryId: args.memoryId,
      projectId: args.projectId,
      eventType: args.eventType,
      payload: args.payload,
      createdAt: now,
    });
  }

  private assertBenchmarkSafe(input: RememberInput) {
    if (input.benchmarkSafety === "heldout_forbidden") {
      this.events.append({
        id: `evt_${nanoid(12)}`,
        projectId: input.projectId,
        eventType: "quarantine_reject",
        payload: {
          reason: "Refused to persist held-out task content.",
          summary: input.summary,
          phase: input.phase,
          kind: input.kind,
        },
        createdAt: new Date().toISOString(),
      });

      throw new Error(
        "Refused to store held-out forbidden memory. Store only split hash, aggregate score, or failure class.",
      );
    }

    if (
      input.benchmarkSafety === "aggregate_only" &&
      typeof input.metadata?.aggregateOnly !== "boolean"
    ) {
      throw new Error(
        "aggregate_only memory must explicitly set metadata.aggregateOnly=true.",
      );
    }
  }

  private renderForEmbedding(input: RememberInput) {
    return [
      `phase: ${input.phase}`,
      `kind: ${input.kind}`,
      `summary: ${input.summary}`,
      `tags: ${input.tags.join(", ")}`,
      input.content,
    ].join("\n");
  }
}
