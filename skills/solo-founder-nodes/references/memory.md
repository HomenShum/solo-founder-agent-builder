# Memory — remember decisions, not benchmark answers

The loop persists across sessions so a founder resuming next day **does not re-derive** the
capability spec, the benchmark choice, the frozen splits, or the approved architecture.
**Local-first and audit-safe** by construction. The single hard rule that protects the whole
anti-overfit design: **held-out task CONTENTS must NEVER enter persistent memory** — store split
hashes and aggregate scores only. This is the memory-side mirror of **NO ANSWER-KEYS**.

## The four levels

| Level | Scope | What it holds | Lifetime |
|---|---|---|---|
| **L0** phase-scratch | current run only | working notes, intermediate state | **discarded after the phase** |
| **L1** project | capability spec, benchmark choice, stack facts, approved decisions, setup env, commands, design constraints, UI surfaces, runner paths | project-scoped | persists |
| **L2** evaluation | split **hashes**, tuned/held-out/generalization policy, run IDs, scorecards, failure clusters, fixes, provenance | project-scoped | persists |
| **L3** founder-preference | preferred stack, disk paths, design style, approval rules, budget limits, model preferences | **cross-project** | persists |

## The quarantine rule (critical)

Held-out + off-distribution task **contents and answers** are **forbidden** in persistent
memory. Store only **split hashes**, **aggregate scores**, and **failure classes**. Otherwise
cross-session memory silently becomes an answer-key leak path that defeats the held-out design.
Memory is a **tuned-signal + scores** store, never a held-out-content store.

## Per-event benchmark-safety level

Every write declares one:

| Level | Meaning |
|---|---|
| **`safe`** | no benchmark contents; persist freely |
| **`tuned_only`** | tuned-side signal only; never held-out |
| **`aggregate_only`** | scores/deltas only — **must set `metadata.aggregateOnly = true`** |
| **`heldout_forbidden`** | held-out task content — **REJECT the write** |
| **`redacted`** | local only — **never sync** (PII, keys, private) |

## The SoloMemoryEvent contract

`eventId` · `projectId` · `userId?` · `phase` (discover|benchmark|setup|build|adapter|iterate|verify|runtime|design|coach) ·
`kind` (decision|assumption|approval|rejection|command|env_fact|benchmark_choice|split_policy|run_result|failure_cluster|fix_attempt|in_app_transfer|design_constraint|architecture_rule|user_preference|project_fact|tool_result) ·
`summary` · `content` · `tags[]` · `importance` (0..1) ·
`visibility` (local|project|private_user|public_safe) · `benchmarkSafety` ·
`evidenceRefs[{type: file|url|command|screenshot|dom_signal|trace|okf, ref, note?}]` ·
`metadata` · `createdAt`.

Tools the skill calls: **`memory_write_event`** · **`memory_search_project`** ·
**`memory_read_phase_summary`** · **`memory_mark_forbidden`** · **`memory_export_scorecard`** ·
**`memory_forget_private`**.

## Phase-start / phase-end protocol

1. **Phase START** — load **safe project memory**: decisions, approvals, benchmark choice,
   setup env, design constraints, **prior rejected fixes**.
2. **Phase END** — write **decision + provenance** memory (what was decided, why, evidence ref).
3. **During ITERATE** — never write held-out contents; write **aggregate scores + failure
   classes** only.
4. **Before BUILD** — check **prior rejected fixes** + **approved architecture constraints**.
5. **During VERIFY** — store the **DOM signal**, **screenshot path**, **run id**, and **verdict**.

## The safe stack (local-first)

1. **SQLite / libSQL** — source of truth.
2. **FTS5** — cheap keyword recall; the **default** retrieval path.
3. **Embeddings** (optional) — semantic recall.
4. **RRF + rerank** — blend importance / recency / exactness; **low-confidence rejection** (do
   NOT hallucinate memory).
5. **JSONL** — append-only audit ledger.
6. **OKF export** — portable Markdown + YAML frontmatter.

**Mem0 is an OPTIONAL adapter** for safe cross-project / user-preference (L3) memory **only —
NOT the authority**. Its sync must be filtered to exclude held-out content, PII, API keys, and
private data. Inspiration: **MemX** (local-first libSQL, FTS5, RRF, rerank, low-confidence
rejection); **Mem0** (latency / token savings vs full-context).

## Templates & live implementation

Copyable templates live at
`skills/solo-founder-nodes/templates/memory/` (`types.ts`, `schema.ts`, `localMemory.ts`,
`retrieval.ts`, `okfExport.ts`, `mem0Adapter.ts`, `solo-memory.schema.json`, `memory-policy.md`).
The full **live** implementation belongs in the founder's own app (e.g. `src/nodeagent/memory/`)
as a separate effort — reference it, do not inline an app into the skill.

## One sentence

**Remember decisions, constraints, proofs, and preferences — not benchmark answers.**
