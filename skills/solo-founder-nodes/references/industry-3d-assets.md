# Industry-grade 3D asset quality gate

This reference exists because a nonblank viewer and an OBJ file are not proof of a coherent 3D asset.
For picture/text/video/reference-media-to-3D work, the loop must classify the output claim before
building or verifying it:

- `personal-research-scaffold`: deterministic, original, non-production proof geometry is allowed, but
  it must stay labeled personal-research-only and not production-ready.
- `prototype`: requires semantic part graph, mesh stats, GLB/glTF export, viewer/reopen proof, and
  enough UI evidence to show the asset can be inspected.
- `industry-grade`: requires semantic part graph, valid mesh stats, topology/retopo report, UV unwrap
  report, PBR maps, GLB/glTF export, DCC/viewer reopen proof, wireframe and UV screenshots, benchmark
  scorecard, and, for games/characters/scenes/marketplace work, LOD/collision/pivot evidence.

Run [`part-research-ralph.md`](part-research-ralph.md) before this quality gate when a task starts
from reference media or first-principles decomposition. The part-research gate proves each component's
function, assembly interfaces, local geometry/material plan, proof evidence, and hardening labels.
This quality gate then proves whole-asset mesh/material/export quality and benchmark performance.
Passing one does not replace the other.

Research anchors:

- [P3D-Bench](https://arxiv.org/abs/2606.11152) evaluates parametric/code-based 3D generation on
  executability, geometric fidelity, topology, text/visual constraints, multiview semantic alignment,
  and part-level structure. That is the right benchmark lens for "does this model make coherent
  parts?" instead of "is there any mesh on screen?"
- [TRELLIS](https://arxiv.org/abs/2412.01506) uses structured 3D latents that can decode to meshes,
  3D Gaussians, and radiance fields, which supports the product requirement to choose the output
  representation and still keep geometry/appearance information aligned.
- [DreamGaussian](https://arxiv.org/abs/2309.16653) shows why a first-party pipeline should convert
  generated 3D Gaussians into textured meshes and refine textures in UV space before downstream use.
- [Hunyuan3D 2.0](https://github.com/Tencent-Hunyuan/Hunyuan3D-2) is the local/self-hosted model lane
  for image and multi-image to mesh proofs. The loop must record runtime, model output, mesh
  validation, and reopen evidence before claiming Hunyuan-generated assets.
- [Hunyuan3D 2.1](https://arxiv.org/html/2506.15442v1) and its public
  [Hunyuan3D-Paint 2.1 notes](https://huggingface.co/spaces/tencent/Hunyuan3D-2.1/blob/main/hy3dpaint/README.md)
  reinforce a two-stage asset bar: shape generation plus mesh-conditioned PBR texture generation
  producing albedo/baseColor, metallic, and roughness maps.
- [MaterialMVP](https://arxiv.org/html/2503.10289v2) reinforces the same PBR requirement: multi-view
  texture generation must align albedo, metallic, and roughness maps across views.
- [glTF 2.0](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) and
  [Khronos glTF PBR](https://www.khronos.org/gltf/pbr/) define practical metallic-roughness PBR
  interchange expectations. [Blender's glTF exporter](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html)
  is the DCC reopen/export sanity check.
- [Unity LOD import](https://docs.unity3d.com/2020.3/Documentation/Manual/importing-lod-meshes.html)
  and [Unreal static mesh pipeline](https://dev.epicgames.com/documentation/unreal-engine/fbx-static-mesh-pipeline-in-unreal-engine?lang=en-US)
  set practical runtime expectations for LOD, collision, sockets/pivots, and importable mesh packages.

Pipeline implication:

1. Decompose first: semantic part graph, dimensions/relations, material intent, and protected-expression
   filter.
2. Generate structure before polish: parametric/part-aware mesh or structured latent output before
   texturing.
3. Convert/refine: mesh extraction, cleanup/retopo, UV unwrap, PBR material maps, and texture
   consistency checks.
4. Prove model execution when applicable: run the local model RALPH receipt for Hunyuan3D-2.0/TRELLIS
   and fail closed if runtime or output proof is missing.
5. Prove utility: GLB/glTF export, Blender/DCC reopen, Three.js viewer proof, wireframe/UV/PBR
   screenshots, and target-specific LOD/collision/pivot/rig receipts.
6. Score held-out: compare against first-party baseline and external providers on semantic alignment,
   mesh validity, topology, editability, texture/PBR quality, latency, cost, and UI completion.

Executable gate:

```bash
npm run sfn -- 3d quality-plan --goal "<goal>" --target game --industry-grade --out asset-quality-plan.json
npm run sfn -- 3d model-plan --goal "<goal>" --model hunyuan3d-2.0 --out local-model-hunyuan.json
npm run sfn -- 3d model-verify --receipt local-model-hunyuan.json --no-files
npm run sfn -- 3d quality-verify --receipt asset-quality-receipt.json --base .
```

Fail-closed rules:

- OBJ-only export cannot pass `prototype` or `industry-grade`.
- A random primitive pile cannot pass without semantic part graph evidence and mesh stats.
- A visually plausible mesh cannot pass `industry-grade` without topology, UV, PBR, reopen, and
  scorecard evidence.
- A game/CAD/customer/marketplace claim cannot pass if the output only proves a research scaffold.
- Hunyuan3D-2.0/TRELLIS output cannot be claimed if the local model RALPH lane is planned, blocked, or
  missing runtime/output/reopen proof.
- Hosted model output cannot pass asset-quality or industry-grade solely from a successful Space/API
  run. Generated-output proof and live app-import proof are lower tiers; clean validation, DCC reopen,
  UV/PBR, topology, target-domain fixtures, and benchmark scorecards are still required.
- Exact replica export and source-derived protected mesh/texture remain blocked unless rights,
  provenance, and user-owned approval are explicitly proven outside the agent.
