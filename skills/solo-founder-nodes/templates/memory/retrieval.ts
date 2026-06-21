// SoloMemory — MemX-style retrieval: FTS + optional vector + RRF + rerank + low-confidence rejection.
import type { MemoryHit, MemoryRecord } from "./types";

export function tokenizeForFts(query: string) {
  const tokens =
    query
      .toLowerCase()
      .match(/[a-z0-9_./:-]{2,}/g)
      ?.slice(0, 12) ?? [];

  // Quote terms to avoid unsafe FTS syntax. Example: "benchmark" OR "held-out"
  return tokens.map((t) => `"${t.replaceAll('"', '""')}"`).join(" OR ");
}

export function reciprocalRankFusion(args: {
  ftsIds: string[];
  vectorIds: string[];
  k?: number;
}) {
  const k = args.k ?? 60;
  const scores = new Map<string, { score: number; trace: string[] }>();

  function add(id: string, rankIndex: number, source: "fts" | "vector") {
    const inc = 1 / (k + rankIndex + 1);
    const current = scores.get(id) ?? { score: 0, trace: [] };
    current.score += inc;
    current.trace.push(`${source}:rank=${rankIndex + 1},rrf=${inc.toFixed(4)}`);
    scores.set(id, current);
  }

  args.ftsIds.forEach((id, idx) => add(id, idx, "fts"));
  args.vectorIds.forEach((id, idx) => add(id, idx, "vector"));

  return scores;
}

export function recencyScore(createdAtIso: string, halfLifeDays = 30) {
  const ageMs = Date.now() - new Date(createdAtIso).getTime();
  const ageDays = Math.max(0, ageMs / 86_400_000);
  return Math.pow(0.5, ageDays / halfLifeDays);
}

export function exactnessScore(query: string, record: MemoryRecord) {
  const q = new Set((query.toLowerCase().match(/[a-z0-9_./:-]{2,}/g) ?? []));
  if (q.size === 0) return 0;

  const text = [
    record.summary,
    record.content,
    record.tags.join(" "),
    record.phase,
    record.kind,
  ]
    .join(" ")
    .toLowerCase();

  let hits = 0;
  for (const token of q) {
    if (text.includes(token)) hits += 1;
  }

  return hits / q.size;
}

export function rerankMemoryHits(args: {
  query: string;
  records: MemoryRecord[];
  rrf: Map<string, { score: number; trace: string[] }>;
}) {
  const maxRrf = Math.max(0.00001, ...[...args.rrf.values()].map((v) => v.score));

  const hits: MemoryHit[] = args.records.map((record) => {
    const fused = args.rrf.get(record.id) ?? { score: 0, trace: [] };

    const rrfNorm = fused.score / maxRrf;
    const recency = recencyScore(record.createdAt);
    const importance = record.importance;
    const exactness = exactnessScore(args.query, record);

    // Conservative rerank: rank is useful, but exactness/importance/recency
    // prevent weird embedding-only recalls.
    const final =
      0.46 * rrfNorm +
      0.22 * exactness +
      0.20 * importance +
      0.12 * recency;

    return {
      ...record,
      scores: {
        rrf: rrfNorm,
        recency,
        importance,
        exactness,
        final,
      },
      retrievalTrace: [
        ...fused.trace,
        `rerank:rrf=${rrfNorm.toFixed(3)}`,
        `rerank:exactness=${exactness.toFixed(3)}`,
        `rerank:importance=${importance.toFixed(3)}`,
        `rerank:recency=${recency.toFixed(3)}`,
        `rerank:final=${final.toFixed(3)}`,
      ],
    };
  });

  hits.sort((a, b) => b.scores.final - a.scores.final);
  return hits;
}

export function applyLowConfidenceRejection(hits: MemoryHit[], minScore: number) {
  if (hits.length === 0) return [];

  const best = hits[0];

  // If exactness is high, tolerate a lower blended score.
  const hasStrongExactness = best.scores.exactness >= 0.65;
  if (best.scores.final >= minScore || hasStrongExactness) {
    return hits;
  }

  return [];
}
