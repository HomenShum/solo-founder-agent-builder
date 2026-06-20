# setup — Stand Up the Eval Environment (Phase 3)

## What this phase does
Turns "I picked a benchmark" into "the runner, the dataset, and the verifier are installed, pinned to a disk, and prove-able with a single smoke task" — without the agent silently installing Docker, pulling tens of GB of weights, or burning judge-API money. The agent does the typing; the human approves every heavy step and steers by comment. The output is a reproducible, disk-pinned environment that later phases (run, score, transfer-verify) call into.

## Inputs (what it reads)
- The chosen benchmark + its official contract from Phase 2 (e.g. `docs/eval/bankertoolbench-official-contract.json`): dataset id, runner repo, container image, verifier spec, metric.
- The target disk + free-space budget (ask if unset; the dogfood pins `D:`).
- Which secrets the verifier needs (judge model API keys) and where they live (the dogfood reads them from Convex env, masked, never to disk).
- Host facts: OS, Docker presence/version, Python, available disk — gathered read-only before proposing anything.

## Outputs (the artifact it produces)
- A **disk-pinned env script** modeled on `scripts/bankertoolbench-d-disk-env.ps1` (sets `DOCKER_*`, `HF_HOME`, `PIP_CACHE_DIR`, `XDG_CACHE_HOME`, `PYTHONUTF8=1` to the chosen disk).
- A **secrets loader** modeled on `scripts/bankertoolbench-load-secrets-from-convex.ps1` (loads judge keys into the process env, masked in logs, never written to disk).
- A pulled/built container image + downloaded dataset, located on the pinned disk.
- A `SETUP.md` (or appended section) recording exact versions, image digests, dataset revision, disk paths, and the one-line smoke command — so Phase "honest provenance" can trace every later number back to this environment.

## Procedure (agent-driven; human steers by comment)
1. **Probe read-only.** Agent reports OS, `docker version`, `python --version`, free space on the target disk, and whether Docker Desktop/WSL2 is running. No installs yet. *(Human comments the disk + budget if not already chosen.)*
2. **Draft the plan as GUIDE.** Agent presents: every component to install, its size, its source link (Docker Desktop download, the runner repo, the HF dataset URL), the API-key console links for the verifier, and the exact commands — grouped by reversibility. Heavy/irreversible items are flagged for the Gate.
3. **Pin the disk.** Generate the env script from the `bankertoolbench-d-disk-env.ps1` pattern, pointed at the chosen disk. This is reversible — run it first so every later pull/cache lands off `C:`. *(Human comments to redirect a path.)*
4. **Wire secrets.** Generate the loader from `bankertoolbench-load-secrets-from-convex.ps1`; confirm with the human which judge keys are needed and that they exist in the source (Convex env / env file). Verify masking — keys appear as `sk-…****` in logs and are never echoed or written to disk.
5. **Dry-run.** Where the tool supports it, show `--dry-run` / `docker pull --quiet` size estimates / `huggingface-cli download --dry-run` so the human sees the byte cost before approving.
6. **GATE → execute** the heavy steps (see Gate) only after explicit approval: pull/build the image, download the dataset to the pinned disk, install the runner.
7. **Smoke one task.** Run a single benchmark task end-to-end through the harness + verifier to prove the wiring (the dogfood: one BTB task through the Harbor runner with the LLM judge). Confirm the verifier returns a real score, not a stub.
8. **Record provenance.** Write `SETUP.md` with image digest, dataset revision, tool versions, disk paths, and the smoke result. *(Human comments to approve the recorded baseline.)*

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
- **CRLF → LF on `.sh`.** Shell scripts pulled on Windows get CRLF and fail inside Linux containers with `\r`-mangled shebangs. Normalize before mounting — reuse `scripts/bankertoolbench-normalize-shell-scripts.ps1`.
- **`PYTHONUTF8=1`** must be set (the env script does this) or dataset/judge I/O can mis-decode on Windows codepages.
- **Disk pinning is mandatory**, not cosmetic — HF + Docker default to `C:\Users\…`; the env script redirects `HF_HOME`, `DOCKER_*`, and pip/XDG caches to the chosen disk so a 30 GB pull does not fill the system drive.
- Paths with spaces (e.g. `D:\VSCode Projects\…`) must be quoted in every generated command.

## Reuse (existing assets — real paths)
- `scripts/bankertoolbench-d-disk-env.ps1` — the disk-pinning env template (worked example: BTB Harbor env on `D:`).
- `scripts/bankertoolbench-load-secrets-from-convex.ps1` — masked secrets loader, keys never written to disk.
- `scripts/bankertoolbench-normalize-shell-scripts.ps1` — CRLF→LF fix for `.sh` before container mount.
- `docs/eval/bankertoolbench-official-contract.json` — the Phase-2 contract this phase reads (dataset/runner/verifier/metric).
- Dogfooded worked example end-to-end: the BankerToolBench Harbor runner + LLM judge, pinned to `D:`, smoke-tested on a single task before any sweep.
