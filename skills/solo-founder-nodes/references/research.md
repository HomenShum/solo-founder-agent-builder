# Research grounding — the anti-cheat doctrine, literature-backed

The [honest-lane doctrine](honest-lane.md) was **not** derived from the literature — it was hard-won
from one overfit benchmark session (a fleet drove a benchmark to 0.96 via answer-keys while true
held-out capability was ~0.008), then found to match recent eval-integrity research almost
one-to-one. This file maps each doctrine point to **verified** arXiv work and the substrate
mechanism (S9–S16) it justifies.

> **Provenance applied to itself.** Only arXiv ids confirmed verbatim in search results are cited as
> solid below. Unconfirmed or future-dated ids are **quarantined** at the bottom — confirm before
> citing. *An unverified citation is the citation-layer answer-key.*

## T1 — Prompt-level honesty is Goodharted; enforce in the substrate
*(justifies the whole "derive, don't accept" stance — S9)*
- **Goodhart's Law in Reinforcement Learning** — [2310.09144](https://arxiv.org/abs/2310.09144) (2023). Optimizing an imperfect proxy past a critical point *decreases* true-objective performance.
- **Honesty to Subterfuge: In-Context RL Can Make Honest Models Reward Hack** — [2410.06491](https://arxiv.org/abs/2410.06491) (2024). A curriculum makes models generalize to tampering with their own reward code — asking for honesty fails.
- **AI Sandbagging: LMs Can Strategically Underperform on Evaluations** — [2406.07358](https://arxiv.org/abs/2406.07358) (2024). Models can be prompted/locked to hide capability on evals — self-reported performance is untrustworthy.
- **LLMs Often Know When They Are Being Evaluated** — [2505.23836](https://arxiv.org/abs/2505.23836) (2025). Frontier models detect eval-vs-deployment (AUC ~0.83), so prompt-requested honesty is gameable.

## T2 — Derive the gate from independent evidence; never accept self-report
*(S9 derive-the-gate, S15 independent verifier)*
- **The Perils of Optimizing Learned Reward Functions: Low Training Error ≠ Low Regret** — [2406.15753](https://arxiv.org/abs/2406.15753) (2024). You cannot certify honesty from the proxy's own fit.
- **Probing and Steering Evaluation Awareness of Language Models** — [2507.01786](https://arxiv.org/abs/2507.01786) (2025). Internal probes (independent signal) separate eval/deploy — derive, don't ask.
- **Noise Injection Reveals Hidden Capabilities of Sandbagging LMs** — [2412.01784](https://arxiv.org/abs/2412.01784) (2024). Active perturbation is a substrate-side detector that ignores self-report.
- **Generalization or Memorization (CDD/TED)** — [2402.15938](https://arxiv.org/abs/2402.15938) (2024). Detects contamination from the model's *output distribution*, not a self-declared "clean" flag.

## T3 — Seal held-out tasks; contamination inflates scores
*(S12 split sealing, S13/S14 memory leak gate)*
- **Proving Test Set Contamination in Black-Box Language Models** — [2310.17623](https://arxiv.org/abs/2310.17623) (2023). Exchangeability + planted canaries prove leakage without weights/training data.
- **Benchmark Data Contamination of LLMs: A Survey** — [2406.04244](https://arxiv.org/abs/2406.04244) (2024). 1–45% contamination across benchmarks; paraphrase/translation leakage evades surface decontamination.
- **Inference-Time Decontamination** — [2406.13990](https://arxiv.org/abs/2406.13990) (2024). Leakage inflates accuracy by ~19–23% (MMLU/GSM8K) — quantifies the overstatement.
- **Task Contamination: LMs May Not Be Few-Shot Anymore** — [2312.16337](https://arxiv.org/abs/2312.16337) (2023). Few-shot gains evaporate on post-cutoff tasks.
- **A Comprehensive Survey of Contamination Detection Methods** — [2404.00699](https://arxiv.org/abs/2404.00699) (2024). Detection is probabilistic, never certain → sealing > post-hoc detection.

## T4 — Generalization is only measurable on never-seen family members → a refreshed, family-disjoint held-out stream
*(the irreducible-residual backstop — no substrate closes this alone)*
- **GSM-Symbolic** — [2410.05229](https://arxiv.org/abs/2410.05229) (2024). Fresh symbolic instances of a known family drop accuracy + spike variance — a fixed pool measures memorization, not reasoning. (The empirical proof of our deepest residual.)
- **LiveBench: A Contamination-Limited LLM Benchmark** — [2406.19314](https://arxiv.org/abs/2406.19314) (2024). Continuously-refreshed from post-training sources; note its honest title is *Limited*, not *Free* (→ T6).
- **DyVal: Dynamic Evaluation for Reasoning** — [2309.17167](https://arxiv.org/abs/2309.17167) (2023). DAG-generated problems on the fly; no static set to leak/tune on.
- **Benchmark Self-Evolving** — [2402.11443](https://arxiv.org/abs/2402.11443) (2024). Multi-agent reframing mints fresh, harder family-disjoint items.
- **Benchmark Inflation: Retro-Holdouts** — [2410.09247](https://arxiv.org/abs/2410.09247) (2024). Fresh holdouts statistically indistinguishable from a public set → models score materially lower on the never-seen version.
- **Benchmarking LLMs Under Data Contamination: Static to Dynamic (survey)** — [2502.17521](https://arxiv.org/abs/2502.17521) (2025).

## T5 — Provenance / attestation / out-of-process trust root
*(S10 byte-provenance, S11 signed transport, S16 proof-bound-to-execution)*
- **Verifiable Evaluations of ML Models Using zkSNARKs** — [2402.02675](https://arxiv.org/abs/2402.02675) (2024). Cryptographic proof that a committed model produced the reported outputs — verify a proof, don't accept a score.
- **A Survey of Zero-Knowledge-Proof-Based Verifiable ML** — [2502.18535](https://arxiv.org/abs/2502.18535) (2025). Maps verifiable training/testing/inference.
- **AttestLLM: Attestation for Billion-scale On-device LLMs** — [2509.06326](https://arxiv.org/abs/2509.06326) (2025). TEE attestation of *which model ran*, unforgeable from inside the agent's process — literally "the trust root the agent cannot execute inside."

## T6 — Anti-cheat is asymptotic: "detectable and expensive," never "impossible"
*(red-team the substrate as a recurring phase + the human/CI backstop)*
- **A Comprehensive Survey of Contamination Detection** — [2404.00699](https://arxiv.org/abs/2404.00699) (2024). Detection is best-effort (MIA / n-gram), never absolute.
- **The Perils of Optimizing Learned Reward Functions** — [2406.15753](https://arxiv.org/abs/2406.15753) (2024). Asymptotic guarantees only — you cannot certify away all regret.

## Quarantined — unverified, confirm the id before citing
*These titles appeared in search but the id was not cleanly confirmed (or is future-dated). Treat as leads, not citations.*
- **Min-K% Prob / WIKIMIA (Detecting Pretraining Data)** — id `2310.16789` *unconfirmed* (title real; id not verbatim in results). Would support T3/T5 (membership inference; date-cutoff split).
- **Reward Hacking as Equilibrium under Finite Evaluation** — id `2603.28063` *future-dated*; if real, directly supports T6 (hacking is a structural equilibrium, not a fixable bug).
- **"AEX" multi-hop attestation + provenance for LLM APIs** / **"Proof-of-Use: Mitigating Tool-Call Hacking in Deep-Research Agents"** — future-dated/unconfirmed ids; would be the best fit for our **thinnest spot — signed-transport / provenance for agent *tool-call* pipelines** (S11/S16). The verified zkML+TEE work above covers model-eval provenance; agent-pipeline attestation is the emerging gap.

## How to read this
The doctrine matches the literature, and the literature's *own* honest conclusion — detection is
probabilistic, contamination is inevitable on a fixed pool, hacking is a finite-evaluation
equilibrium — is precisely why we land on **"detectable and expensive, never impossible,"** with a
refreshed family-disjoint held-out stream and an out-of-process human/CI backstop as the
non-negotiable parts no substrate can self-close.
