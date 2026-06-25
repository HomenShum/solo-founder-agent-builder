# Research Governor

The Research Governor turns "research backed" from a vague claim into a gate. It classifies sources, writes fresh briefs, and links research to implementation and proof obligations.

Source tiers:

- `primary`: papers, standards, formal benchmark writeups.
- `official`: official docs, SDK docs, specifications.
- `benchmark`: datasets, scorer specs, leaderboards.
- `product`: competitor or inspiration products.
- `community`: tutorials and examples.

Rules:

- Major implementation decisions require at least one primary, official, or benchmark source.
- Product inspirations must be Adopt/Adapt/Park/Reject classified before code changes.
- Research sources must have a `verifiedAt` timestamp and stale-check policy.
- A citation is not product proof. The proof registry still needs UI traces, artifacts, export/reopen evidence, scorecards, or benchmark results.
- Unsupported assumptions must be labeled and carried into proof gates.

Commands:

- `sfn research classify --title "<title>" --url <url> [--domain <domain>]`
- `sfn research brief --goal "<goal>" [--domain <domain>] --project .`
- `sfn research verify <brief.json>`

For 3D asset work, practical official anchors include glTF/Khronos for interoperable assets, Blender glTF import/export for DCC reopen proof, three.js GLTFLoader for web runtime proof, and gltfjsx/React Three Fiber for componentized interactive scenes.
