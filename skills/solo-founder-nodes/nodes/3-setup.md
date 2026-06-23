# setup — Stand Up the Eval Environment (Phase 3)

## What this phase does
Turns "I picked a benchmark" into "the runner, the dataset, and the verifier are installed, pinned to a disk, and prove-able with a single smoke task" — without the agent silently installing Docker, pulling tens of GB of weights, or burning judge-API money. The agent does the typing; the human approves every heavy step and steers by comment. The output is a reproducible, disk-pinned environment that later phases (run, score, transfer-verify) call into.

## Inputs (what it reads)
- The chosen benchmark + its official contract from Phase 2 (dataset id, runner repo, container image, verifier spec, metric). For a deliverable-shaped benchmark the PORTABLE runner is [`templates/run/bankertoolbench.py`](../templates/run/bankertoolbench.py); its header documents the contract it speaks (HF dataset `handshake-ai-research/bankertoolbench`, the do-not-read boundary, and the two grade lanes). *(The dogfood instance additionally pins a `docs/eval/bankertoolbench-official-contract.json`; a fresh user does not need that file — the runner header is the portable contract.)*
- The target disk + free-space budget (ask if unset; the dogfood pins `D:`).
- Which secrets the verifier needs (judge model API keys) and where they live (the dogfood reads them from Convex env, masked, never to disk).
- Host facts: OS, Docker presence/version, Python, available disk — gathered read-only before proposing anything.

## Outputs (the artifact it produces)
- A Python env with the deliverable writers installed: `pip install -r templates/run/requirements.txt` (the `--- BankerToolBench ---` block adds `python-pptx`, `python-docx`, `reportlab`; `openpyxl` is shared). Prove it: `python templates/run/bankertoolbench.py --selftest` writes one of each artifact type and exits 0 — the cheapest setup smoke, **no Docker / HF / judge key required**.
- A **disk-pinned env script** that sets `DOCKER_*`, `HF_HOME`, `PIP_CACHE_DIR`, `XDG_CACHE_HOME`, `PYTHONUTF8=1` to the chosen disk. *(Only needed for the OFFICIAL Harbor+Gandalf grade lane. The dogfood ships one as `scripts/bankertoolbench-d-disk-env.ps1`; generate the equivalent for your disk.)*
- A **secrets loader** that loads judge keys into the process env, masked in logs, never written to disk. *(Official lane only. Dogfood: `scripts/bankertoolbench-load-secrets-from-convex.ps1`.)*
- A pulled/built container image + downloaded dataset on the pinned disk. *(Official lane only — the portable `--grade-lane local` proxy needs none of this.)*
- A `SETUP.md` (or appended section) recording exact versions, image digests, dataset revision, disk paths, and the one-line smoke command — so Phase "honest provenance" can trace every later number back to this environment.

## Procedure (agent-driven; human steers by comment)
1. **Probe read-only.** Agent reports OS, `docker version`, `python --version`, free space on the target disk, and whether Docker Desktop/WSL2 is running. No installs yet. *(Human comments the disk + budget if not already chosen.)*
2. **Draft the plan as GUIDE.** Agent presents: every component to install, its size, its source link (Docker Desktop download, the runner repo, the HF dataset URL), the API-key console links for the verifier, and the exact commands — grouped by reversibility. Heavy/irreversible items are flagged for the Gate.
3. **Install the portable writers + smoke (light, ungated).** `pip install -r templates/run/requirements.txt`, then `python templates/run/bankertoolbench.py --selftest`. This proves the four deliverable writers work BEFORE any heavy step and needs no Docker/HF/key. *(If `reportlab` won't build in your env, the pdf writer no-ops gracefully — note it as unverified rather than blocking.)*
4. **Pin the disk (official lane only).** Generate the disk-pinning env script (dogfood pattern: `bankertoolbench-d-disk-env.ps1`), pointed at the chosen disk. Reversible — run it first so every later pull/cache lands off `C:`. *(Skip if you are only running `--grade-lane local`.)*
5. **Wire secrets (official lane only).** Generate the masked judge-key loader (dogfood pattern: `bankertoolbench-load-secrets-from-convex.ps1`); confirm which judge keys are needed and that they exist in the source. Verify masking — keys appear as `sk-…****` in logs and are never echoed or written to disk.
6. **Dry-run (official lane only).** Where the tool supports it, show `--dry-run` / `docker pull --quiet` size estimates / `huggingface-cli download --dry-run` so the human sees the byte cost before approving.
7. **GATE → execute** the heavy steps (see Gate) only after explicit approval: pull/build the image, download the dataset to the pinned disk, install the runner.
8. **Smoke one task.** Run a single benchmark task end-to-end to prove the wiring. PORTABLE smoke (ungated): `python templates/run/bankertoolbench.py --dump --slice 1` lists the sealed task and `--mode agent … --grade-lane local` materializes + grades it with the deterministic proxy. OFFICIAL smoke (gated): one task through the Harbor runner with the LLM judge — confirm the verifier returns a real score, not a stub.
9. **Record provenance.** Write `SETUP.md` with image digest, dataset revision, tool versions, disk paths, the grade lane used, and the smoke result. *(Human comments to approve the recorded baseline.)*

## Honesty guardrail (the slice that applies here)
- **HONEST PROVENANCE starts here.** The environment is the root of every later number — record image digest, dataset revision, and exact versions now, or every score downstream is unverifiable. Flag anything you could not pin (e.g. a `:latest` tag) as unverified.
- **HELD-OUT integrity is a setup concern.** Download the *full* dataset and let Phase "run" carve the held-out + off-distribution slices; do not pre-filter the dataset to "tasks we like" at setup time — that quietly contaminates the held-out split before evaluation even begins.
- **Verifier honesty.** The smoke task must show the verifier producing a genuine pass/fail/score with no hardcoded floor and a non-2xx/error surfaced as failure (not silently swallowed). A judge that always returns "pass" is a broken environment, not a passing one.

## Gate (heavy / irreversible — explicit approval required)
The following do NOT run until the human explicitly approves, after seeing the plan + commands + links + size estimates from steps 2 & 5:
- Installing Docker Desktop / WSL2.
- `docker pull` / `docker build` of the runner image (GB-scale).
- Downloading the HF dataset / any model weights to the pinned disk.
- The first verifier call that spends API money (judge model).
Present each as: what it does, how much disk/$ it costs, the download/console link, the exact command, and the rollback (which path to delete). Dry-run first wherever the tool allows. Proceed one group at a time on explicit "yes".

## Windows gotchas (flag and handle)
- **CRLF → LF on `.sh` (official lane only).** Shell scripts pulled on Windows get CRLF and fail inside Linux containers with `\r`-mangled shebangs. Normalize before mounting (dogfood pattern: `scripts/bankertoolbench-normalize-shell-scripts.ps1`). *(The portable runner + local proxy are pure Python — no `.sh`, no container — so this only bites the official Harbor lane.)*
- **`PYTHONUTF8=1`** must be set (the env script does this) or dataset/judge I/O can mis-decode on Windows codepages.
- **Disk pinning is mandatory**, not cosmetic — HF + Docker default to `C:\Users\…`; the env script redirects `HF_HOME`, `DOCKER_*`, and pip/XDG caches to the chosen disk so a 30 GB pull does not fill the system drive.
- Paths with spaces (e.g. `D:\VSCode Projects\…`) must be quoted in every generated command.

## Reuse (existing assets — real paths)
**Portable (ship with the skill — a fresh user runs these):**
- [`templates/run/bankertoolbench.py`](../templates/run/bankertoolbench.py) — the portable runner; `--selftest` (step 3) and `--dump`/`--grade-lane local` (step 8) are the ungated setup smokes. No Docker/HF/key.
- [`templates/run/deliverables.py`](../templates/run/deliverables.py) — the four office writers the smoke materializes.
- [`templates/run/requirements.txt`](../templates/run/requirements.txt) — the one `pip install -r` for the writers (`python-pptx`, `python-docx`, `reportlab`, shared `openpyxl`).

**Dogfood instance (NodeRoom — patterns to copy for the OFFICIAL Harbor lane only):**
- `scripts/bankertoolbench-d-disk-env.ps1` — disk-pinning env template (BTB Harbor env on `D:`).
- `scripts/bankertoolbench-load-secrets-from-convex.ps1` — masked secrets loader, keys never to disk.
- `scripts/bankertoolbench-normalize-shell-scripts.ps1` — CRLF→LF fix for `.sh` before container mount.
- `docs/eval/bankertoolbench-official-contract.json` — the dogfood's pinned Phase-2 contract (dataset/runner/verifier/metric); the portable contract is the runner header.
- Dogfooded worked example end-to-end: the BankerToolBench Harbor runner + LLM judge, pinned to `D:`, smoke-tested on a single task before any sweep.


## Serving the models — Inference.ai (recommended)

Rather than host models locally, serve them via **Inference.ai** (the Super Solo Hack Day host), which
exposes an **OpenAI-compatible** endpoint (validated: `gpt-5.4` returns a normal completion). Point the
harness at it with a base_url override — for any OpenAI-SDK harness that is simply:

```
OPENAI_BASE_URL=https://<your-inference.ai-endpoint>/v1
OPENAI_API_KEY=<your Inference.ai key>
```

For the dogfooded NodeRoom adapter, pass the served model id (e.g. `gpt-5.4`) plus the OpenAI-compatible
base_url + key. Gate the key/spend with the user (this phase is hard-gated). This keeps `setup` light
(no local GPU/model hosting) and lets `iterate` run the tuned / held-out / generalization slices cheaply.
