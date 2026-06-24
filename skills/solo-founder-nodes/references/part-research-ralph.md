# Part-Research RALPH for 3D Assets

The first-principles component tree is not enough. A 3D app can list plausible parts and still output
a nonsense mesh if the agent never researches what each part must do, how it attaches, or what proof
would make it usable. For 3D generation, run a nested `R/A/L/P/H` loop per component before composing
the final asset.

## Required Loop

For every component:

- `R` - research the part's function, accepted vocabulary, and source-backed constraints.
- `A` - identify neighboring parts and assembly/interface constraints.
- `L` - choose local geometry, dimensions, and material from the functional spec, not copied
  expression.
- `P` - prove the part exists in the mesh/viewer/export and can be inspected or reopened.
- `H` - label blocked claims: exact replica, human use, physical use, industry-grade, CAD-native,
  motion/rigging, or commercial deployment.

The whole asset cannot pass while any required component loop is missing or incomplete.

## CLI

```bash
npm run sfn -- 3d part-research-plan --goal "build a coherent eyewear-style 3D asset" --out part-research.json
npm run sfn -- 3d part-research-verify --receipt part-research.json --base docs/proof
```

Use `--components <file>` when the app already produced a component tree. Use `--completed` only when
each stage has real evidence files.

## Research Anchors

- PartNet / recursive part decomposition: hierarchical part annotations and part-level reasoning.
- SAMPart3D: open-vocabulary part discovery across 3D shapes.
- P3D-Bench: part-aware 3D/assembly scoring, not just a single aesthetic score.
- Text2CAD and HistCAD: explicit operations and geometric constraints for editable CAD-like assets.
- Domain references such as ophthalmic frame anatomy and frame requirements when the object category
  is eyewear.

## Enforcement

Template and verifier: [`../templates/threeD/partResearchRalph.ts`](../templates/threeD/partResearchRalph.ts).
The verifier fails on:

- missing source IDs,
- missing functional requirements,
- missing composition interfaces,
- missing `R/A/L/P/H` stages,
- planned stages used as completed proof,
- missing evidence files,
- exact replica export,
- human-use approval, or
- agent-owned commercial/deployment approval.

This is a research-backed composition gate. It does not claim the generated asset is industry-grade;
that separate claim still requires the 3D asset quality gate.
