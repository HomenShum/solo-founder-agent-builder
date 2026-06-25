# Local 3D model RALPH

Use this gate whenever a task claims that a first-party or self-hosted model lane produced a 3D asset.
Providers such as Meshy, Tripo, Rodin, Luma, or GMI AgentBox may be comparators or deployment lanes,
but Hunyuan3D-2.0 and TRELLIS are local/self-hosted model lanes that need their own RALPH receipts.

The receipt must prove:

- `R` Research: official model docs, model IDs, runtime requirements, input/output formats, and current
  source/research references.
- `A` Alignment: rights/provenance receipt, brush/source-crop receipt when image-derived, no secret
  logging, output directory, and clear install/run contract.
- `L` Live run: command transcript, runtime probes, CUDA/Torch/Hugging Face access status, and raw
  model output location.
- `P` Proof: generated GLB/OBJ/mesh, mesh validation, DCC/viewer reopen proof, screenshot/video of the
  asset inside the actual app UI, and scorecard hooks.
- `H` Hardening: blocked claims, failure reason, next runtime step, and no model-generated claim until
  output proof exists.

Executable gate:

```bash
npm run sfn -- 3d model-plan --goal "<goal>" --model hunyuan3d-2.0 --status blocked_compute --out hunyuan-local-model.json
npm run sfn -- 3d model-verify --receipt hunyuan-local-model.json --no-files
npm run sfn -- 3d model-plan --goal "<goal>" --model trellis --status blocked_compute --out trellis-local-model.json
npm run sfn -- 3d model-verify --receipt trellis-local-model.json --no-files
```

Pass/fail rule:

```bash
npm run sfn -- 3d model-verify --receipt hunyuan-local-model.json --require-pass
```

`--require-pass` is allowed only after the receipt includes an output asset path, runtime log, mesh
validation file, DCC/viewer reopen proof, and viewer screenshot. A blocked receipt can still be useful
because it proves the loop did the setup/preflight honestly, but it cannot support “Hunyuan-generated,”
“TRELLIS-generated,” “industry-grade,” “game-ready,” “CAD-ready,” or “customer-ready” claims.

Current model lane anchors:

- Hunyuan3D-2.0: official repo `https://github.com/Tencent-Hunyuan/Hunyuan3D-2`, Hugging Face model
  `tencent/Hunyuan3D-2`, image/multi-image to mesh outputs, shape generation around 6 GB VRAM in the
  official README, shape plus texture around 16 GB VRAM.
- TRELLIS: official repo `https://github.com/microsoft/TRELLIS`, Hugging Face model
  `microsoft/TRELLIS-image-large`, image/text-derived structured 3D outputs, official README tested
  on Linux with NVIDIA GPUs of at least 16 GB memory.

Secret policy:

- The receipt may record `HF_TOKEN` as an env var name and whether it is present.
- The receipt, command transcript, UI, logs, and proof pack must never record a value beginning with
  `hf_`.
- If a pasted token appears in any file, shell transcript, screenshot, or receipt, the run fails and
  the user should rotate the token.

Design implication:

Local model RALPH does not replace component RALPH or the 3D asset quality gate. It proves model
execution. Component RALPH proves the asset is decomposed into functional parts. Assembly coherence
proves the parts work together. The asset quality gate proves mesh/material/export quality. All four are
needed before a professional 3D asset claim is allowed.

Remote fallback:

If local preflight is blocked by CPU-only Torch, missing VRAM, missing Linux, or missing model runtime,
the loop must not stop. Add a remote compute setup lane and keep the same proof contract:

- Hugging Face Jobs GPU for repeatable batch generation. Pass the token only as `HF_TOKEN` and submit
  it with `hf jobs run --secrets HF_TOKEN`; never put the token value on the command line.
- Hugging Face hosted Spaces, such as the Tencent Hunyuan3D-2 Space or Microsoft TRELLIS.2 Space, for
  the fastest manual or semiautomated model-generated mesh/GLB when the laptop cannot run inference.
  Hosted Spaces require a privacy/provenance receipt because source images are processed off-machine;
  use only non-sensitive, user-owned/licensed, public-domain, or clean-room source images.
- Hugging Face Inference Endpoints, RunPod, Modal, Lambda, GMI, or similar GPU runtimes when TRELLIS
  needs a Linux/16GB+ CUDA environment or when the product needs a persistent API.

The remote lane still cannot pass until it produces the same output proofs: runtime log, generated
asset, mesh validation, reopen proof, UI screenshot, cost/latency or hosted-run receipt, and
blocked-claim verdict. For TRELLIS.2 Space specifically, require the uploaded-source screenshot or
receipt, `Generate` run evidence, `Extract GLB` downloaded asset, mesh validation, reopen proof, and
the asset loaded back into the actual product UI before saying "TRELLIS.2-generated."

Tiered hosted proof:

- `generated-output`: passes only when the hosted lane returns a concrete GLB/OBJ/mesh, hash, source
  policy, runtime/hosted-run receipt, and no-secret transcript.
- `app-import`: passes only when that exact output is loaded in the actual product UI and the proof
  run captures screenshot/video/trace evidence.
- `asset-quality`: remains blocked until mesh validation is clean or repaired, DCC reopen passes, UV
  and PBR material receipts exist, topology/retopology is inspected, and the target-domain benchmark
  scorecard passes.

Do not turn a hosted GLB into a professional asset claim just because it looks good in the viewer. If
validation reports zero-length normals, bufferView issues, non-manifold geometry, missing UVs, missing
materials, or weak topology, record those findings and keep industry-grade/game-ready/CAD-ready claims
blocked.
