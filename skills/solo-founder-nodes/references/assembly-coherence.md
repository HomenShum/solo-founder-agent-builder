# Assembly Coherence Governor

Component RALPH is necessary but not sufficient. A deliverable can have every required component named,
researched, built, and separately proven while the final product is still incoherent because the parts do
not attach, hand off data, share state, export together, or survive the live proof as one artifact.

Run Assembly Coherence for compositional deliverables after Component RALPH and before whole-parent proof.

```bash
npm run sfn -- assembly init --goal "<goal>" --domain <domain> --project .
npm run sfn -- assembly verify --receipt .solo/ledgers/assembly-coherence.json --base .
```

## Required Receipt

`.solo/ledgers/assembly-coherence.json` must include:

- subassemblies: named groups of production-critical components,
- interfaces: required edges between components or subassemblies,
- status for every required interface,
- evidence paths for each interface,
- a no-floating/no-orphan gate,
- blocked claims when the composed artifact has not been proven.

The generic invariant:

`component receipt -> interface receipt -> composed artifact proof -> parent claim`

## Domain Examples

- 3D assets: frame-to-hinge attachment, lens containment, UV/PBR binding, GLB/export/reopen binding,
  no floating primary parts, DCC/viewer proof.
- Agent apps: user input feeds planner, planner calls tools through typed schema, tool results update
  durable state, UI displays the same run state, proof verdict binds trace/video/artifacts.
- Dashboards: filters update tables and charts, data source matches metric definitions, export/reopen
  preserves the same values, empty/error/loading states stay coherent.
- Data pipelines: source schema feeds transform, transform feeds storage, storage feeds API/UI, replay
  and backfill proofs bind to the same run.

## Failure Modes

- flat component lists with no relationships,
- component proofs that are never inspected together,
- generated 3D parts that float or intersect nonsensically,
- UI panels that do not share state,
- exported artifacts that differ from the live preview,
- proof receipts that test isolated mocks but not the assembled workflow.

The judge blocks parent `L/P/H` claims for compositional goals when the assembly ledger is missing or
incomplete.

Doctrine: **No assembly/interface proof, no professional workflow claim.**
