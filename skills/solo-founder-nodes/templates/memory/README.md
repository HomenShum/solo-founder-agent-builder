# SoloMemory — local-first, audit-safe memory substrate (template)

A seven-phase loop without memory becomes a long prompt. With memory it becomes a reusable
operating system for solo founders. This folder is the **contract + policy**; the full engine is a
small, copyable reference implementation (see "Files" below).

> Remember decisions, constraints, proofs, and preferences — **not benchmark answers.**

See [`../../references/memory.md`](../../references/memory.md) for the doctrine. This README is how
to wire it.

## The four memory levels

| Level | Scope | Stores |
|---|---|---|
| **L0** phase-scratch | current run | temporary notes/commands; discarded after the phase |
| **L1** project | this app/repo | capability spec, benchmark choice, stack facts, approved decisions, setup env, commands, design constraints, UI surfaces, runner paths |
| **L2** evaluation | benchmark loop | split **hashes**, tuned/held-out/generalization policy, run IDs, scorecards, failure clusters, fixes, provenance |
| **L3** founder-preference | founder, cross-project | preferred stack, disk paths, design style, approval rules, budget limits, model preferences |

**Quarantine (non-negotiable):** held-out task **contents** never enter L1/L3. Only split hashes,
aggregate scores, and failure classes may be remembered. This is what stops memory from becoming an
answer-key leak.

## The safe stack (local-first)

```
SQLite/libSQL   source of truth
FTS5            cheap keyword recall (the default path)
embeddings      optional semantic recall
RRF + rerank    fuse keyword + vector, rerank by importance/recency/exactness
low-conf reject do NOT hallucinate memory — return nothing when confidence is low
JSONL           append-only audit ledger (every write/retrieve/delete)
OKF export      portable Markdown + YAML frontmatter
Mem0 adapter    OPTIONAL cross-project/founder-preference sync — NOT the authority, and filtered
```

Inspiration: **MemX** (local-first libSQL, FTS5, RRF, rerank, low-confidence rejection) and **Mem0**
(latency/token savings vs. full-context). Solo Founder Nodes owns the safety policy locally;
the cloud layer is opt-in and filtered to exclude held-out content, PII, keys, and private data.

## Files

Provided here (the contract you copy first):
- [`types.ts`](types.ts) — the `SoloMemoryEvent` / `RememberInput` contract (zod).
- [`solo-memory.schema.json`](solo-memory.schema.json) — the same contract as JSON Schema (for non-TS agents).
- [`memory-policy.md`](memory-policy.md) — the allow/forbid + benchmark-safety + retrieval rules to hand your agent.

The reference **engine** (copy into your app, e.g. `src/<agent>/memory/`) ships in this folder,
ready to copy — keep each one honest to the policy above:
- `schema.ts` — the SQLite/libSQL DDL: `memories`, `memory_fts` (FTS5 contentless), `memory_vectors`, `memory_events`.
- `localMemory.ts` — `remember()` / `search()` / `forget()`; enforces `heldout_forbidden` rejection on write.
- `retrieval.ts` — FTS tokenization, Reciprocal Rank Fusion, recency/exactness scoring, rerank, low-confidence rejection.
- `eventLog.ts` — append-only JSONL audit ledger.
- `embedding.ts` — optional embedding provider (e.g. local Ollama `bge-m3`) + cosine similarity.
- `okfExport.ts` — export memories to Open Knowledge Format (Markdown + YAML frontmatter).
- `mem0Adapter.ts` — optional, filtered cloud sync (`isSafeForMem0` blocks held-out/redacted/private/keys/PII).

## Wiring (per phase)

```ts
// phase start — load safe project memory
const pack = await memory.search({ projectId, query: "decisions setup benchmark constraints rejected fixes", phase, limit: 8 });

// phase end — write a decision/provenance event
await memory.remember({
  projectId, phase, kind: "decision",
  summary: "Use a design brief + human approval before any Figma MCP write.",
  content: "...",
  tags: ["design-bridge", "human-gate"],
  importance: 0.8, visibility: "project", benchmarkSafety: "safe",
  evidenceRefs: [{ type: "file", ref: "skills/solo-founder-nodes/references/design-bridge.md" }],
  metadata: { approved: true },
});

// iterate — held-out content is REJECTED by design
await memory.remember({ /* benchmarkSafety: "heldout_forbidden" */ }); // throws — store split hash + failure class instead
```
