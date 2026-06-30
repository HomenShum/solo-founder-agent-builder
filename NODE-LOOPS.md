# NODE-LOOPS.md — solo-founder-agent-builder

> This repo's self-improving-loop manifest. Companion to CLAUDE.md. Spec: https://github.com/HomenShum/noderl/blob/main/spec/node-loops.md

CLAUDE.md says how the agent behaves. This file says what the loop *is*: the goal, the
inner act/observe/judge cycle, and the outer self-heal cycle. Everything below is grounded in
this repo's real files — the [`solo-founder-nodes`](skills/solo-founder-nodes/) skill (a
benchmark-driven loop-engineering skill suite), its phase playbooks in
[`nodes/`](skills/solo-founder-nodes/nodes/), and its loop references in
[`references/`](skills/solo-founder-nodes/references/).

The loop this repo encodes is **RALPH** (Reality → Acceptance → Live Build → Proof → Harden),
run across seven phases, with the gates that flip a claim blocked→passed *derived from committed
evidence* rather than self-asserted. The skill also declares a **NodeRL bridge**
([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md), L9–L13): this loop generates the
trajectories NodeRL records, scores, and turns into durable proof.

---

## 1. Goal & milestones

**Goal (verbatim intent from the skill):** turn "I have an idea / prototype / half-built app and an
agent that demos but does not hold up" into **"an agent that completes real benchmark tasks IN the
live app, browser-verified, without cheating"**
([`SKILL.md`](skills/solo-founder-nodes/SKILL.md) frontmatter;
[`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L1–L7).

The one non-negotiable, restated from the skill: *a coding agent told to "pass the benchmark" will
cheat — hardcode answers, detect-and-template the graded tasks, report a high score with zero real
capability.* This loop is the honesty conscience a solo founder cannot staff
([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L15–L22).

**Milestones = the four non-negotiables every phase obeys**
([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L24–L28):

- **HELD-OUT** — never tune on the tasks you score on; keep a held-out split + an off-distribution slice.
- **NO ANSWER-KEYS** — no per-task detectors or hardcoded outputs; a fix that only lifts the tuned tasks is reverted.
- **IN-APP TRANSFER** — a score counts only if the same task through the real app UI reproduces it (browser-verified).
- **HONEST PROVENANCE** — every number traces to a recorded run; report the real number even if it is low.

**The proof of "done"** ([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) Output,
L693–L696): a scorecard (tuned / held-out / generalization, each with its honesty state) **plus** an
in-app transfer proof (browser evidence) **plus** a one-line verdict — *real capability or overfitting.*

The autonomy goal: under a founder autonomy policy the agent runs the **whole** loop unattended, but
**never grades, seals, or verifies itself** — maximum autonomy on the work, zero autonomy on the
scoring ([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L35–L42;
[`references/autonomy.md`](skills/solo-founder-nodes/references/autonomy.md);
[`references/trust-root-api.md`](skills/solo-founder-nodes/references/trust-root-api.md)).

---

## 2. Inner loop — RALPH per phase (act / observe / judge)

The macro loop is seven phases run in order
([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L576–L588):

| # | Phase | Goal | Playbook |
|---|---|---|---|
| 1 | discover | deep-read the app + web-search → capability spec | [`nodes/1-discover.md`](skills/solo-founder-nodes/nodes/1-discover.md) |
| 2 | benchmark | pick the benchmark matching the deliverable shape + author the rubric | [`nodes/2-benchmark.md`](skills/solo-founder-nodes/nodes/2-benchmark.md) |
| 3 | setup | stand up the eval env (Docker/Harbor/HF/verifier) | [`nodes/3-setup.md`](skills/solo-founder-nodes/nodes/3-setup.md) |
| 4 | build | build the missing agent + UI/UX (calls the Design Bridge) | [`nodes/4-build.md`](skills/solo-founder-nodes/nodes/4-build.md) |
| 5 | adapter | wire the app's real agent into the harness (no answer-keys) | [`nodes/5-adapter.md`](skills/solo-founder-nodes/nodes/5-adapter.md) |
| 6 | verify | run the same task in the live app UI; browser-confirm transfer | [`nodes/6-verify.md`](skills/solo-founder-nodes/nodes/6-verify.md) |
| 7 | iterate | route proof failures back to an earlier phase, apply one fix, re-verify | [`nodes/7-iterate.md`](skills/solo-founder-nodes/nodes/7-iterate.md) |

**ACT — the inner coding agent runs the task.** The user's own coding agent (Claude Code, Codex,
OpenClaw, Hermes, Trae) drives each phase; the user steers by comment
([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L30–L33). Inside each phase the agent
runs that phase's own `R/A/L/P/H` gates — not just the macro loop — and each gate must produce a
concrete anchor artifact before the next can begin (**Anchored RALPH: "No anchor artifact, no next
phase"** — [`references/anchored-ralph.md`](skills/solo-founder-nodes/references/anchored-ralph.md)).

**OBSERVE — browser proof, not build-green.** Phase 6 closes the loop between an offline harness score
and a real user outcome by driving the *same task* through the live app UI exactly as a user would,
then verifying with a concrete DOM signal + screenshot
([`nodes/6-verify.md`](skills/solo-founder-nodes/nodes/6-verify.md), "What this phase does"). The
Fresh-Room Live Browser Contract makes this executable as seven receipts: fresh room → real upload →
real composer ask → DOM-observable readiness → real export → **the benchmark's own official scorer,
unchanged** → one derived ledger row ([`nodes/6-verify.md`](skills/solo-founder-nodes/nodes/6-verify.md),
"Fresh-Room Live Browser Contract").

**JUDGE — fresh context, not the author.** The verdict is rendered by a **fresh-context judge** that
reads *only* durable evidence (`.solo/loop-state.json`, `.solo/events.jsonl`, `.solo/receipts`,
`.solo/proof-verdict.json`, and the RALPH receipt requirements) and returns
`done | not_done | blocked | needs_research | needs_verification`. `done` is legal only when the full
RALPH loop is complete ([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L103–L111;
[`references/host-hooks-fresh-judge.md`](skills/solo-founder-nodes/references/host-hooks-fresh-judge.md)).
The scored path uses the benchmark's **official verifier with no LLM on the scored path**
([`references/ralph-anchors.md`](skills/solo-founder-nodes/references/ralph-anchors.md),
`benchmark-choice.json` → `"scorer": "<official verifier; no LLM on the scored path>"`). The judge is
the referee, kept out of the building agent's reach
([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L40–L42).

**REWARD = the proof verdict, evidence-derived.** A run counts as capability **iff** the generic
writer alone produced output, the model was genuinely in the loop (tokens > 0 / real transport), AND
it ran on a held-out task — otherwise it is tagged `answer-key | model-off | replay` and excluded
(the **NON-GENERAL GUARD**, [`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L26;
[`references/honest-lane.md`](skills/solo-founder-nodes/references/honest-lane.md)). The headline gate
is `counts_toward_headline = clean && live_browser_room_passed` — a harness-only pass cannot promote
to the headline mean ([`nodes/6-verify.md`](skills/solo-founder-nodes/nodes/6-verify.md), "Ledger bit
& headline gate"). **ENFORCE, DON'T REQUEST:** the substrate must *derive* the gate from observed
evidence; a self-set clean-probe flag is itself an answer-key.

---

## 3. Outer loop — RALPH repair (self-heal)

The outer loop runs **after** live verification, because the point is to improve the system from real
evidence, not a pre-proof hunch: *no Phase 6 proof, no Phase 7 fix*
([`nodes/7-iterate.md`](skills/solo-founder-nodes/nodes/7-iterate.md), L1–L9, Honesty Guardrail).

**Failure taxonomy → route.** Each verified failure is classified to the earliest broken phase —
`discover` (wrong user need), `benchmark` (the rubric/scorer measured the wrong thing), `setup`
(environment/provider/deploy facts missing), `build` (the app/UI cannot express the capability),
`adapter` (the harness path diverges from the product path), or `verify` (the proof capture itself
failed) ([`nodes/7-iterate.md`](skills/solo-founder-nodes/nodes/7-iterate.md) Procedure step 1;
[`nodes/6-verify.md`](skills/solo-founder-nodes/nodes/6-verify.md) step 7 writes the route without
fixing yet).

**Strategy delta — one shared fix, never a per-task patch.** The agent applies **one** research-backed
fix that improves a *reusable* tool, context substrate, generic writer, API contract, UI affordance,
provider/setup, or proof harness — **never** a per-task writer, benchmark detector, or hidden product
path ([`nodes/7-iterate.md`](skills/solo-founder-nodes/nodes/7-iterate.md) step 4). The hypothesis
cites research sources and the metric expected to move, and lists rejected alternatives (step 3).

**Repair lane — isolated, no hot-patch.** Continuous repair runs through **Reflex RALPH**: it consumes
`.solo/events.jsonl`, classifies incidents as transient / task-specific / systemic / security /
progress-stall, retries transient provider failures, quarantines bad fixtures, and pauses only the
affected *future* lanes for systemic defects. **No hot-patch** — active lanes stay pinned to their
`RunGeneration`; repair roles run in an isolated next generation
([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L278–L297;
[`references/reflex-ralph.md`](skills/solo-founder-nodes/references/reflex-ralph.md)). Every repair
must satisfy the **Root-Cause Patch Contract** (symptom, evidence, violated invariant, root cause,
systemic fix, why it is not a one-task special case, negative regression fixture, live canary, rollback)
([`references/root-cause-patch-contract.md`](skills/solo-founder-nodes/references/root-cause-patch-contract.md)).

**Promotion gate.** A fix is accepted only if live UI proof improves or holds on
**held-out and off-distribution** evidence without weakening fresh-room / export-reopen /
design-quality / official-scorer proof; if only tuned/easy cases improve, **revert** — you found an
answer-key ([`nodes/7-iterate.md`](skills/solo-founder-nodes/nodes/7-iterate.md) steps 6–7;
[`references/ralph-anchors.md`](skills/solo-founder-nodes/references/ralph-anchors.md), "Phase 6
promotion gate"). Promotion adopts the new generation only for queued/future lanes and leaves the
already-running generation auditable (step 6a). Deletions/deprecations are logged in a build-to-delete
rework ledger ([`references/build-to-delete.md`](skills/solo-founder-nodes/references/build-to-delete.md)).

**Versioned outer loop (optional):** when the proof story is "watch the artifact get better,"
Prometheus Mode wraps the parent loop — each version records hypothesis, changes, proof refs, score,
failure analysis, and a next-version plan; *every failed proof needs a next-version plan*
([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L263–L276;
[`references/prometheus-mode.md`](skills/solo-founder-nodes/references/prometheus-mode.md)).

---

## 4. Context anchors

- **Entry / master directive:**
  [`skills/solo-founder-nodes/SKILL.md`](skills/solo-founder-nodes/SKILL.md) (cross-vendor discovery
  entry) → [`skills/solo-founder-nodes/MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md)
  (full directive).
- **Phase playbooks (progressive disclosure, read on entering each phase):**
  [`nodes/1-discover.md`](skills/solo-founder-nodes/nodes/1-discover.md) …
  [`nodes/7-iterate.md`](skills/solo-founder-nodes/nodes/7-iterate.md).
- **Machine-readable loop state (drop under `.solo/anchors/`):**
  [`references/ralph-anchors.md`](skills/solo-founder-nodes/references/ralph-anchors.md) —
  `capability-spec.json`, `benchmark-choice.json`, `held-out-split.json`, `setup-provenance.json`,
  `memory-quarantine.json`. These are the anchors NodeRL consumes to gate the loop and audit honesty.
- **Anchored RALPH phase gates:**
  [`references/anchored-ralph.md`](skills/solo-founder-nodes/references/anchored-ralph.md) +
  the anchor schemas in
  [`templates/anchors/`](skills/solo-founder-nodes/templates/anchors/) (`R-system-context`,
  `A-proof-contract`, `L-implementation-map`, `P-proof-ledger`, `H-hardening-ledger`).
- **Honesty doctrine:**
  [`references/honest-lane.md`](skills/solo-founder-nodes/references/honest-lane.md) (clean-probe /
  model-in-loop / non-general guard).
- **Judge + hooks:**
  [`references/host-hooks-fresh-judge.md`](skills/solo-founder-nodes/references/host-hooks-fresh-judge.md),
  [`references/cli-command-center.md`](skills/solo-founder-nodes/references/cli-command-center.md).
- **Repair + safety:**
  [`references/reflex-ralph.md`](skills/solo-founder-nodes/references/reflex-ralph.md),
  [`references/root-cause-patch-contract.md`](skills/solo-founder-nodes/references/root-cause-patch-contract.md),
  [`references/trust-root-api.md`](skills/solo-founder-nodes/references/trust-root-api.md),
  [`references/autonomy.md`](skills/solo-founder-nodes/references/autonomy.md).
- **Deterministic grader + worked example (no LLM):**
  [`docs/eval/nonbtb/`](docs/eval/nonbtb/) (`grade.py` + tasks + self-test fixtures),
  [`docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md`](docs/eval/BTB_GENERALIZATION_DIAGNOSTIC.md).
- **Memory substrate (loop hydration, audit-safe):**
  [`references/memory.md`](skills/solo-founder-nodes/references/memory.md) — each phase reads safe
  project memory at start and writes decision/provenance memory at end; held-out task **contents** are
  quarantined out of persistent memory (the memory-side mirror of NO ANSWER-KEYS).

---

## 5. Verification protocol

**No-proof-no-claim.** Build success, `git push`, CLI exit codes, and CI-green are **not** proof.
"Verified in-app" requires a live rendered DOM signal + screenshot, or it did not transfer
([`nodes/6-verify.md`](skills/solo-founder-nodes/nodes/6-verify.md), Honesty guardrail). Every "match"
must cite a recorded run + a captured DOM signal + a screenshot; any verdict missing all three is
flagged `unverified` and never reported as a pass.

**Separate, fresh-context judge.** The agent that wrote the code does not grade it. The fresh-context
judge reads only durable receipts and the official scorer runs the benchmark's own verifier unchanged
(no "our own grader that's basically the same") — see Inner-loop JUDGE above and
[`nodes/6-verify.md`](skills/solo-founder-nodes/nodes/6-verify.md) Fresh-Room step 6. The referee
(seal salt, gate derivation, sealed-gold, independent verifier) lives outside the agent process
([`references/trust-root-api.md`](skills/solo-founder-nodes/references/trust-root-api.md)).

**Held-out promotion gate.** A fix is kept only if **held-out and off-distribution** hold or rise;
verification samples must span both, not just the tuned tasks
([`references/ralph-anchors.md`](skills/solo-founder-nodes/references/ralph-anchors.md), "How the loop
consumes them"; [`nodes/6-verify.md`](skills/solo-founder-nodes/nodes/6-verify.md) HELD-OUT guardrail).

**Anti-cheat — generic-only, no answer-keys.** Headline runs are `headlineMode: "generic-only"`
([`references/ralph-anchors.md`](skills/solo-founder-nodes/references/ralph-anchors.md)). The honest
lane scores the same task three ways and conflating them *is* the bug: **model-off** (0 tokens) is a
harness failure not a score; a **task-specific / family writer** firing is a fake answer-key; only
**model-in-loop + the generic writer on a held-out task** is real capability
([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L26). Held-out task contents must never
enter persistent memory — only split hashes, aggregate scores, and failure classes
([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L666–L671;
[`references/ralph-anchors.md`](skills/solo-founder-nodes/references/ralph-anchors.md)
`memory-quarantine.json`). Red-team the substrate itself as a recurring phase; the claim is "cheating
is detectable and expensive," never "impossible."

**Portability is proved, not asserted.** Each coding agent runs the conformance probe and records a
PASS receipt in the matrix — evidence, not assertion
([`conformance/PROBE.md`](skills/solo-founder-nodes/conformance/PROBE.md);
[`conformance/PORTABILITY.md`](skills/solo-founder-nodes/conformance/PORTABILITY.md)).

- **PROVE-BEFORE-CLAIM** (agent-side gate) — never assert done/pass/fixed/blocked/absent/"root cause" from a *proxy* (an affordance, a keyword/template echo, a rendered shell, or a prior-based hypothesis); name the artifact that proves it and check THAT, independent-confirm anything that "looks done", and treat no gate as real until the autonomous path is tried. Canonical gate + observed failure signals: https://github.com/HomenShum/noderl/blob/main/spec/prove-before-claim.md

---

## 6. Reward & safety

**Reward signal** = the proof verdict, derived from committed evidence — `clean &&
live_browser_room_passed` for headline credit, with `done` returned by the fresh-context judge only on
a complete RALPH loop. Self-reported fields are never accepted; the substrate derives which writer
fired, whether the model was in the loop, and held-out membership.

**Safety gates (hard):**
- **Permission gates** — phases that install heavy infra (Docker/Harbor/HF), spend API money, or mutate
  the codebase are *guide → generate → gate*: present plan + exact commands + links, dry-run if possible,
  get explicit approval before executing
  ([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L46–L48).
- **External setup gate** — API keys, OAuth, billing, storage, and prod provider setup are human gates;
  the agent finishes every deterministic part first and never exposes provider keys via
  `VITE_*`/`NEXT_PUBLIC_*`, screenshots, logs, or chat
  ([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L50–L61;
  [`references/honest-lane.md`](skills/solo-founder-nodes/references/honest-lane.md)).
- **Referee out of reach** — the agent does every step and produces every proof but never grades, seals,
  or verifies itself ([`references/trust-root-api.md`](skills/solo-founder-nodes/references/trust-root-api.md)).
- **No hot-patch** — Reflex repairs are generational; active lanes stay pinned, promotion needs a
  Root-Cause Patch Contract + negative regression fixture + live canary
  ([`references/reflex-ralph.md`](skills/solo-founder-nodes/references/reflex-ralph.md)).
- **Memory quarantine** — held-out/off-distribution task contents must never be written to persistent
  memory ([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L666–L671).

---

## 7. Status / receipts

Honest status, grounded in this repo's own proof docs. No invented pass-rates.

**PROVEN (local / in-repo):**
- The skill itself ships: master directive, 7 phase nodes, references, templates, conformance probe,
  and smoke suite exist in this repo
  ([`docs/PUBLIC_CLAIM_PROOF.md`](docs/PUBLIC_CLAIM_PROOF.md), "I shipped a skill" row → *Proven locally*).
- **Benchmark-driven development for AI agents** as a *skill design* is proven: `MASTER_SKILL.md`
  encodes discover → benchmark → setup → build → adapter → verify → iterate with held-out and
  provenance gates ([`docs/PUBLIC_CLAIM_PROOF.md`](docs/PUBLIC_CLAIM_PROOF.md), "Benchmark-driven
  development" row → *Proven as skill design*).
- **Substrate smoke** is the live receipt of record. The conformance probe expects
  `160 passed, 0 failed` on the current substrate
  ([`conformance/PROBE.md`](skills/solo-founder-nodes/conformance/PROBE.md), step 2); an earlier
  recorded figure in the claim matrix was `135 passed, 0 failed`
  ([`docs/PUBLIC_CLAIM_PROOF.md`](docs/PUBLIC_CLAIM_PROOF.md)). Run
  `node skills/solo-founder-nodes/conformance/conformance.mjs --run-smoke` to regenerate the PASS
  receipt before quoting a number.
- **Portability (partial):** Codex has a current local conformance receipt; OpenClaw (OpenRouter /
  DeepSeek V4 Flash) and Hermes (OpenRouter / Qwen3 Coder Next) returned prior PASS receipt
  `311d4ca418744ba5` on the older 74-test substrate
  ([`docs/AGENT_PORTABILITY_PROOF.md`](docs/AGENT_PORTABILITY_PROOF.md);
  [`docs/PUBLIC_CLAIM_PROOF.md`](docs/PUBLIC_CLAIM_PROOF.md)). Trae is **not** independently driven in
  this repo.

**OPEN (not proven as written — do not publish as fact):**
- The headline "0.96 → 0.008" incident sentence is **unproven until the incident bundle is linked**.
  The repo holds *adjacent* NodeRoom receipts (selected/family-writer BTB around `0.9608` / `0.9638`,
  an older pre-materializer signal `0.009`, a separate SpreadsheetBench smoke row `0.008333`, and a
  current full-100 clean-probe mean `0.251875`) — these are *adjacent evidence, not one sealed public
  proof* and must not be combined in public copy
  ([`MASTER_SKILL.md`](skills/solo-founder-nodes/MASTER_SKILL.md) L15–L22;
  [`docs/PUBLIC_CLAIM_PROOF.md`](docs/PUBLIC_CLAIM_PROOF.md), Verdict + Claim Matrix row 1).
- **Per-app proof is not transferable.** The loop is proven as a *process*; the "works on your app"
  claim becomes real only after the proof pack contains the live UI trace + verdict for *that* app
  ([`docs/PUBLIC_CLAIM_PROOF.md`](docs/PUBLIC_CLAIM_PROOF.md), "It runs one honest loop on your app" row).
- **Required rule (verbatim):** if a post includes a number, the number needs its run path, task
  count + split, materializer/writer state, model-transport proof, whether the gate was
  substrate-derived or provisional, and live-UI proof status. **No receipt, no number.**
  ([`docs/PUBLIC_CLAIM_PROOF.md`](docs/PUBLIC_CLAIM_PROOF.md), "Required Rule").
