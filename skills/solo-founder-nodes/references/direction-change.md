# Direction Change Protocol

Direction-changing user input is not a normal feature tweak. Treat it as a new outer loop that decides whether to adopt, adapt, park, or reject the new inspiration before code changes.

Triggers include: change direction, instead of, not integrate, make our own, OSS, open-source, learn from, gold standard, new architecture, new pipeline, replace, pivot, rethink, Spline, Emergent, Bruno Simon, Igloo, Architecture Governor, Research Governor, Proof Registry.

Required flow:

1. `sfn direction intake` records the source text and classifies each inspiration into product direction, technical architecture, visual/interaction quality, proof/eval, agent process, or risk/constraint.
2. `sfn direction propose` writes old direction, proposed direction, target quality tier, new receipts, invalidated receipts, non-claims, and Direction RALPH obligations.
3. `sfn direction decide` records the user-level decision: accepted, parked, or rejected.
4. `sfn direction apply` writes `.solo/receipts/R/direction-change-receipt.json` and updates the parent loop obligations.
5. Resume the parent RALPH loop from the earliest affected milestone, usually `R`.

Direction RALPH:

- R Reality: what actually changed and what is merely inspiration?
- A Acceptance: what quality tier and proof bar now count?
- L Live Build: what code, architecture, hooks, schemas, and tools must change?
- P Proof Run: what live UI, artifact, benchmark, export, or trace proves it?
- H Harden: what old claims are deprecated, what memory/rework survives, and what judge rerun closes the pivot?

Non-negotiable: product inspiration never grants rights to copy proprietary assets. It can shape the product strategy, proof bar, or interaction model only after Adopt/Adapt/Park/Reject classification.
