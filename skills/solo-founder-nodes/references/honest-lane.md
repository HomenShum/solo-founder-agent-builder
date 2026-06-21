# Honest lane — the clean-probe doctrine

The same task scores **wildly differently** depending on *how* it ran. Conflating those
runs **is** the measurement bug. This doctrine is the sharpened form of **NO ANSWER-KEYS**:
measure the **general agent** honestly, never a per-task shim. Benchmark-agnostic — applies
to any harness, any deliverable shape. Vocabulary: a **task-specific / family writer** is the
hardcoded per-task answer-key (`detect-task → emit-canned-package`); a **generic writer**
renders the model's *own* plan; **clean-probe mode** forces the generic writer with the model
proven in the loop.

## The three run configs

The centerpiece. **Never report a number without saying which config produced it.**

| Config | What runs | Verdict |
|---|---|---|
| **MODEL-OFF** | Planner never engages — **0 tokens**, ~$0, no real tool-call | **Degenerate FLOOR, NOT capability.** A zero-token run is a **HARNESS FAILURE**, not a low score — never record its near-floor number as a result. |
| **MODEL-IN-LOOP + GENERIC** | Model planner runs (**tokens > 0**); every task-specific/family writer **declines**; a **generic writer** renders the model's own plan | **The REAL capability signal.** This is the only config that goes in the headline. |
| **TASK-SPECIFIC / FAMILY WRITER** | A hardcoded per-task or family-gated writer **fires** (0 model calls, deterministic template) | **ANSWER-KEY. Fake.** Excluded from the headline by construction. |

## The non-general guard

Adding or extending **any** task-specific / family-gated writer is **excluded from the
headline by construction** — it is overfitting, not capability. A run counts as a capability
measurement **IFF** all three hold:
1. **Generic only** — only the generic writer produced output; no family/per-task writer fired.
2. **Model in the loop** — tokens > 0 and a real planner transport (not `none`).
3. **Held-out** — it ran on a held-out task never used to tune any writer.

Otherwise tag it `answer-key | model-off | replay` and **EXCLUDE** it.

A harness/tool/context change **COUNTS** iff it raises the held-out clean-probe mean via a
**shared/generic** layer — a more expressive generic writer, a source-reading tool the planner
calls, long-context management, an in-app pre-submit self-check, an app-UI affordance. It **does
NOT count** if it adds another per-task writer.

## Clean-probe mode (operational)

1. **Disable ALL task-specific/family writers** — force the generic writer.
2. **ASSERT the model is in the loop** — a clean-probe trial that finishes with 0 tokens
   **FAILS LOUDLY** as harness-error; never record its ~floor score as capability.
3. **Run only on held-out tasks** (n ≥ 10), never the tuning set; keep tuned vs off-distribution splits separate.
4. **Report the full distribution** — per-task rewards + n, not just the mean.

## The held-out headline

1. **Headline = mean reward over the held-out clean-probe set**, reported with the full
   distribution and n. Replay, answer-key, and model-off rows are **always excluded**.
2. **n ≥ ~10** held-out clean-probe runs before claiming a general number; **n = 1 is
   encouragement, not a headline.**
3. **Report the real number even if it is low.** Honest provenance: every number traces to a
   recorded run.
4. **Emit a side-by-side scorecard** over slices: `TUNED on/off` (writer regression floor) |
   `HELD-OUT off` (the real number) | `OFF-DISTRIBUTION off` (generalization). Columns:
   `slice | writers(on/off) | n | mean_reward | formula% | cited% | fabrication`. Headline cells
   are **held-out-off** and **off-distribution-off**; everything else is a footnote.

## Self-classifying runs (checklist)

Instrument every run so classification is **automatic, not forensic**:
- [ ] **`mode`** recorded (clean-probe | replay | full).
- [ ] **which writer fired** (generic vs the specific family/task writer name).
- [ ] **`tokensUsed`** + the **planner transport** (proves model-in-loop vs model-off).
- [ ] **`cleanGeneralProbe`** — one boolean: all three guard conditions met.
- [ ] **slice membership** (tuned | held-out | off-distribution) — by hash, never contents.

## Derive, don't accept — the substrate enforces it, not the agent

> The checklist above is necessary but a **trap if the agent self-reports it.** A self-set
> `cleanGeneralProbe=true` is itself an answer-key. **The recorder must DERIVE every gate input
> from independently-observed evidence and NEVER accept it from the run payload** — on
> disagreement, **quarantine, don't silently override** (disagreement is signal). Adversarial
> red-teaming proved that a "server gate" which recomputes `cleanGeneralProbe && modelCalls>0`
> from *agent-supplied operands* is **trust-laundering, not enforcement** — it catches nothing.

| Gate input | Must be DERIVED from (never accepted) |
|---|---|
| **which writer fired** | the harness's own execution trace — the call-stack-leaf that emitted each output file, to an append-only receipt the agent can't author — **plus an AST/static check** that the generic writer imports only `write_general` and contains no `is_*_task` / family `write_*_package` symbols. A free-text `firedWriter` label is not provenance. |
| **model-in-loop** | a separate **signed transport ledger** the planner writes directly, keyed by `trialId` + a verifier-issued nonce; assert a *real* plan (≥N reasoning tokens, tool calls consistent with the task). A single no-op token must NOT pass. |
| **held-out membership** | an **out-of-process sealed manifest** (`HMAC(salt, sortedTaskIds)`) + an immutable `taskSplitLedger` (taskId → first-seen split). A task ever seen tuned can never later count as held-out. Kills tune-then-reuse and relabel-an-easy-task forgeries. |
| **`cleanGeneralProbe`** | **recomputed server-side from the above**, never read from the payload. |
| **memory writes** | a **content gate**, not an honor-system label: fingerprint every write against the sealed gold; > k shingle-match → reject *regardless of the caller's `benchmarkSafety` tag*. `aggregate_only` = **numbers only**, kept OUT of the recall indexes. Then **provenance-taint the headline**: record `memoryEventIds` read per scored run; a recalled-gold match → `countsTowardHeadline=false`, flag `memory_leak`. |
| **the score itself** | an **independent, refute-by-default verifier** (different model/lens) that re-derives a random sample *from the raw deliverable* and refutes on **process, not correctness** — a laundered gold answer is "correct"; **correctness ≠ honesty.** Bind in-app proof to a **run-hash chain**; tying DOM→runId alone only proves "the UI rendered row X," never "row X came from a real run." |

## Irreducible residual + the non-negotiable backstop

No substrate closes these — **name them, don't pretend**:
- **Input-corpus laundering** — a branch-free generic writer assembling pre-staged per-family
  fragments. Needs input-corpus hashing; runtime-generated fragments still evade a static check.
- **Family-shape priors** — the agent *must* observe held-out inputs to be scored, and tasks
  telegraph their deliverable. Baking family defaults into the generic writer for the *next*
  held-out task of the same family is real overfitting with **no single catchable event**. A
  fixed, small, family-correlated pool **decays to fully-observed** → the clean mean drifts up.
  **Only a continuously-refreshed, family-disjoint held-out stream measures real generalization.**
- **The signing process is the new trust root** — if the agent controls it, it relabels.

**Backstops the loop cannot self-close (required):** an **out-of-process trust root** (split
manifest + grader the agent can't execute inside); a **refreshed family-disjoint held-out
stream**; a **human/CI re-run of a random clean-row sample per published headline**; and the
headline ships with **n, audit-coverage %, and held-out-pool-age** so a drifting mean over an
exhausted pool is visible as the warning it is.

## Honesty note

Root cause: **if the per-task answer-key writers cannot be turned OFF, there is no measurement
of the general agent at all.** Making the dispatch switchable-off is the *precondition* for any
honest number. The point is not to win the benchmark — it is to expose overfitting. A score you
can only reach by hardcoding is not capability; report the real held-out number, low or not.

**And the claim is always "cheating is detectable and expensive," never "cheating is impossible."**
The loop is only as honest as its *most adversarial* audit — so **red-teaming the substrate itself
is a required, recurring phase**, not a one-time review. The builder *will* overclaim enforcement
that isn't there (this skill's own first substrate did); only an adversary reading the actual data
flow catches it. Derive, don't accept — then have someone try to beat what you derived.

**Grounding:** the recent eval-integrity literature corroborating this doctrine — contamination,
reward hacking, eval-awareness, dynamic benchmarks, verifiable evaluation — is mapped to T1–T6 and
the S9–S16 mechanisms in [`research.md`](research.md).
