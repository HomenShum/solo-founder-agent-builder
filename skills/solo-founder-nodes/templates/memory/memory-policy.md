# Memory Policy (Solo Founder Nodes)

Drop this into your project (e.g. `.agent/memory-policy.md`) and have the coding agent obey it.

## Source of truth

Local SQLite/libSQL memory is the source of truth. A cloud memory layer (e.g. Mem0)
is an **optional** sync for safe cross-project / founder-preference memory only — never the authority.

## Allowed memory

Store:
- architecture decisions
- founder-approved assumptions
- benchmark choice and rubric
- setup environment facts
- approved commands
- split **hashes**
- aggregate scores
- failure classes
- design constraints
- in-app transfer proof paths (DOM signal, screenshot, run id, verdict)
- rejected fixes and why

## Forbidden memory

Never store:
- held-out task prompts
- held-out expected answers
- private benchmark answer keys
- API keys
- passwords
- unredacted PII
- private customer data
- any source the founder did not authorize

## Benchmark-safety levels

- `safe` — can be persisted and searched.
- `tuned_only` — can be persisted but must never be used to reason about held-out task contents.
- `aggregate_only` — store metrics, failure classes, and split hashes only (`metadata.aggregateOnly=true`).
- `heldout_forbidden` — **reject** the write.
- `redacted` — may be stored locally if redacted; must **not** sync to any cloud adapter.

## Retrieval / write rule

- **At phase start:** search memory for relevant safe project decisions and constraints.
- **At phase end:** write decision / provenance memory.
- **During iterate:** never write held-out contents — only aggregate score, failure class, and run provenance.
- **During verify:** store DOM signal, screenshot path, run id, and verdict.
- **Before build:** check prior rejected fixes and approved architecture constraints.

## Why this exists

The whole point of Solo Founder Nodes is to stop benchmark cheating. Memory is a new attack
surface: a careless write can leak a held-out answer key or poison a split. This policy keeps the
memory layer **audit-safe** — it mirrors the `NO ANSWER-KEYS` and `HELD-OUT` non-negotiables.

> Remember decisions, constraints, proofs, and preferences — not benchmark answers.
