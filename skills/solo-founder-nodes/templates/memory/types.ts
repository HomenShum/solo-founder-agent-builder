// SoloMemory — event contract (portable template).
// Copy into your app and back it with the local-first stack in this folder's README.
// Rule: remember decisions, constraints, proofs, and preferences — NOT benchmark answers.
import { z } from "zod";

export const memoryPhaseSchema = z.enum([
  "discover",
  "benchmark",
  "setup",
  "build",
  "adapter",
  "iterate",
  "verify",
  "runtime",
  "design",
  "coach",
]);

export const memoryKindSchema = z.enum([
  "decision",
  "assumption",
  "approval",
  "rejection",
  "command",
  "env_fact",
  "benchmark_choice",
  "split_policy",
  "run_result",
  "failure_cluster",
  "fix_attempt",
  "in_app_transfer",
  "design_constraint",
  "architecture_rule",
  "user_preference",
  "project_fact",
  "tool_result",
]);

export const memoryVisibilitySchema = z.enum([
  "local",
  "project",
  "private_user",
  "public_safe",
]);

// benchmarkSafety is the anti-cheat axis. heldout_forbidden writes are REJECTED.
export const benchmarkSafetySchema = z.enum([
  "safe",
  "tuned_only",
  "aggregate_only",
  "heldout_forbidden",
  "redacted",
]);

export const evidenceRefSchema = z.object({
  type: z.enum([
    "file",
    "url",
    "command",
    "screenshot",
    "dom_signal",
    "run",
    "trace",
    "okf",
  ]),
  ref: z.string(),
  note: z.string().optional(),
});

export const rememberInputSchema = z.object({
  projectId: z.string(),
  userId: z.string().optional(),

  phase: memoryPhaseSchema,
  kind: memoryKindSchema,

  summary: z.string().min(1),
  content: z.string().default(""),

  tags: z.array(z.string()).default([]),
  importance: z.number().min(0).max(1).default(0.5),

  visibility: memoryVisibilitySchema.default("project"),
  benchmarkSafety: benchmarkSafetySchema.default("safe"),

  evidenceRefs: z.array(evidenceRefSchema).default([]),

  metadata: z.record(z.any()).default({}),
});

export type RememberInput = z.infer<typeof rememberInputSchema>;

export type MemoryRecord = RememberInput & {
  id: string;
  rowid?: number;
  createdAt: string;
  updatedAt: string;
  lastAccessedAt?: string;
  accessCount: number;
};

export type MemoryHit = MemoryRecord & {
  scores: {
    ftsRank?: number;
    vectorRank?: number;
    rrf: number;
    recency: number;
    importance: number;
    exactness: number;
    final: number;
  };
  retrievalTrace: string[];
};

export type MemorySearchOptions = {
  projectId: string;
  query: string;
  phase?: string;
  kinds?: string[];
  tags?: string[];
  limit?: number;
  includePrivateUser?: boolean;
  minScore?: number;
};

export type EmbeddingProvider = {
  model: string;
  dim: number;
  embed(text: string): Promise<number[]>;
};
