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
