# Component RALPH

Component RALPH is the nested loop for compositional products. Parent RALPH proves the product. Component RALPH proves the production-critical parts. No component proof, no parent claim.

Use it when the target output cannot be judged as one blob: 3D assets, multi-tab workbooks, multi-file reports, UI systems, agent harnesses, data pipelines, simulations, marketplace products, or any deliverable with parts that can independently fail.

Do not decompose every button, helper function, CSS tweak, mesh triangle, or one-off mock constant. Decompose only components that affect final user value, have external quality standards, can independently fail, are part of an exported deliverable, or create trust, safety, performance, deployment, or legal risk.

## Commands

```bash
npm run sfn -- component init --domain 3d --goal "build image-to-3D asset app" --project .
npm run sfn -- component decompose --input "wooden chair from image" --domain 3d --out component-tree.json
npm run sfn -- component status --project .
npm run sfn -- component run --id chair.seat --phase A --receipt component-ralph/chair.seat/A-acceptance.json --project .
npm run sfn -- component judge --id chair.seat --project .
npm run sfn -- component proof --all --project .
```

`component init` writes `.solo/ledgers/component-ralph.json` by default. Parent stop/idle/final-answer hooks call `judge current`; the judge checks the component ledger whenever the goal is compositional or a ledger exists.

## Required Receipts

Each required component has its own `R/A/L/P/H` receipts:

- `R` Reality: role, constraints, source-backed research, and non-claims.
- `A` Acceptance: proof gates and failure modes.
- `L` Live Build: artifact/build/refinement receipt.
- `P` Proof: actual output/UI/export/runtime evidence.
- `H` Harden: rework, blocked claims, and next-loop memory.

Parent proof is blocked when a required component is missing any completed stage or required proof gate.

## Assembly Coherence Boundary

Component RALPH proves production-critical parts. It does not prove that those parts compose into a
professional workflow or artifact. After component proof, run:

```bash
npm run sfn -- assembly init --goal "<goal>" --domain <domain> --project .
npm run sfn -- assembly verify --receipt .solo/ledgers/assembly-coherence.json --base .
```

Assembly Coherence must name subassemblies, required interfaces, no-floating/no-orphan checks, and
export/runtime/proof binding. This is the gate that catches failures such as a 3D model with named
hinges and arms that are not actually attached, or a dashboard whose filter, chart, and export do not
share state.

Clean rule: no assembly/interface proof, no professional workflow claim.

## 3D Adapter

The 3D part-research RALPH adapter remains domain-specific. It uses Component RALPH as the parent contract, then adds 3D-specific gates for part graph, geometry, topology, UV/PBR material, GLB/glTF export, viewer interaction, DCC/reopen proof when configured, provider/comparator receipts, and proof runner evidence.

The 3D rationale is research-backed:

- P3D-Bench evaluates parametric 3D generation on executability, geometry, topology, constraints, multiview semantic alignment, and part-level structure.
- HY3D-Bench includes structured part-level decomposition for fine-grained perception and controllable editing.
- glTF 2.0 is the default interoperability proof target because it covers runtime asset delivery concepts such as nodes, meshes, materials, textures, cameras, animation, and GLB.
- PBR material quality is a separate gate because material decomposition, roughness, and metallic consistency can fail even when shape looks plausible.

## Doctrine

```text
If the output is compositional:
  create .solo/ledgers/component-ralph.json
  run nested Component RALPH for production-critical components
  block parent L/P/H claims until required component receipts pass
```

Generated visuals are not proof by themselves. Proof requires receipt files.
