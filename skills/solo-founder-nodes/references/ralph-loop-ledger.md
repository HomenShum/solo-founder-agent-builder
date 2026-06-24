# RALPH Loop Ledger

Solo Founder Agent Builder saves progress as a durable local loop, not loose chat or markdown notes.

RALPH milestones:

- `R` - Reality / Research: understand the app, user, stack, references, and code graph.
- `A` - Acceptance Bar: choose benchmark, rubric, held-out split, proof gates, and expected artifacts.
- `L` - Live Build: build the agent layer and UI/UX layer needed to run the task in the actual app.
- `P` - Proof Run: run the same task through the live app UI and collect trace/video/DOM/export/scorer receipts.
- `H` - Harden: store failure clusters, rework decisions, memory, cost data, and next improvement candidates.

Local-first layout:

```text
.solo/
  loop-state.json
  events.jsonl
  memory.db
  receipts/
    R-reality/
    A-acceptance-bar/
    L-live-build/
    P-proof-run/
    H-harden/
  proof-verdict.json
  rework-ledger.md
```

CLI:

```bash
npm run sfn -- loop init --goal "build agent for this app" --project .
npm run sfn -- loop status --project .
npm run sfn -- dashboard --project .
npm run sfn -- loop events --project .
npm run sfn -- loop doctor --project .
npm run sfn -- loop resume --loop-id <id> --project .
npm run sfn -- loop start --from A --project .
npm run sfn -- loop pause --message "waiting on provider key" --project .
npm run sfn -- loop verify --milestone P --project .
npm run sfn -- phase verify --phase verify --stage P --project .
npm run sfn -- phase route --to build --reason "verified UI proof failed at action protocol" --project .
```

Start-anywhere rule:

- Starting `A` requires completed `R` receipts.
- Starting `L` requires completed `R` and `A` receipts.
- Starting `P` requires completed `R`, `A`, and `L` receipts.
- Starting `H` requires completed `R`, `A`, `L`, and `P` receipts.

If required receipts are missing, the ledger blocks the milestone, records a blocker event, and emits
the resume command for the earliest missing milestone. It must not fake progress.

Command-center rule:

- `loop events` reads the mixed event ledger, including RALPH step events and normalized `SoloEvent`
  hook rows.
- `loop doctor` checks local layout health without requiring the founder to inspect `.solo` manually.
- `dashboard` is the visual operating surface: loop state, proof verdict, receipt counts, events,
  agent host policy, and artifacts in one terminal view.
- `phase verify` enforces nested RALPH inside every major phase, so `discover`, `benchmark`, `setup`,
  `build`, `adapter`, `verify`, and `iterate` each require their own reality, acceptance, live,
  proof, and hardening receipts.
- `phase route` writes a verified failure route from Phase 6 back to the earliest broken phase. Phase
  7 iteration must consume this receipt before making a fix.

Operating rule:

> No receipt, no number. No live UI proof, no product claim. No held-out task contents in memory.
