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

Research anchors:

- Production-ready 3D asset research argues that visual plausibility alone is insufficient; usable
  assets need topology, UVs, PBR materials, editability/rigging where relevant, and engine metadata.
- Hunyuan3D 2.1 separates shape generation from mesh-conditioned PBR texture generation, including
  albedo/baseColor, metallic, and roughness maps.
- P3D-Bench evaluates executability, geometric fidelity, topology, semantic alignment, constraints,
  and part-level structure.
- AssetGen-style evaluation inspects final mesh, texture, UV layout, and wireframe in an interactive
  3D viewer.
- glTF/glTF PBR and engine docs set practical interchange/import expectations; game-ready claims need
  runtime metadata such as LOD, collision, and pivot receipts.

Executable gate:

```bash
npm run sfn -- 3d quality-plan --goal "<goal>" --target game --industry-grade --out asset-quality-plan.json
npm run sfn -- 3d quality-verify --receipt asset-quality-receipt.json --base .
```

Fail-closed rules:

- OBJ-only export cannot pass `prototype` or `industry-grade`.
- A random primitive pile cannot pass without semantic part graph evidence and mesh stats.
- A visually plausible mesh cannot pass `industry-grade` without topology, UV, PBR, reopen, and
  scorecard evidence.
- A game/CAD/customer/marketplace claim cannot pass if the output only proves a research scaffold.
- Exact replica export and source-derived protected mesh/texture remain blocked unless rights,
  provenance, and user-owned approval are explicitly proven outside the agent.
