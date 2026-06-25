# Prometheus Mode

Prometheus Mode is the versioned engineering wrapper around RALPH.

It is not a claim that the model retrains itself, replaces industrial simulation, or becomes a physical-world foundation model. It means the system repeatedly improves the artifact and its harness through proof receipts:

```text
goal
  -> version 0
  -> proof 0
  -> failure analysis
  -> improvement plan
  -> version 1
  -> proof 1
  -> replay / comparison
```

Use this when the user wants a product that should get better over attempts, or when the demo value is the visible improvement curve, not only the final artifact.

## Required Behavior

1. Create or resume a Prometheus run before claiming a self-improving engineering loop.
2. Each version must carry:
   - hypothesis
   - changes
   - component gates
   - proof artifact references
   - score
   - failure analysis
   - next-version actions
3. The latest version cannot be called done unless required gates pass.
4. If the latest version does not pass, there must be an improvement plan.
5. Publish a replay when the user asks to prove the loop.

## CLI

```bash
npm run sfn -- prometheus init --goal "<goal>" --target agent-app --project .
npm run sfn -- prometheus run --goal "<goal>" --iterations 3 --record --project .
npm run sfn -- prometheus status --project .
npm run sfn -- prometheus compare --project .
npm run sfn -- prometheus publish --project .
```

## Domains

The primitive is generic:

- `3d-web-asset`
- `finance-workflow`
- `spreadsheet-model`
- `agent-app`
- `mobile-app`
- `dashboard`
- `data-pipeline`
- `deck-report`

Each domain maps to production-critical gates. For example, a 3D web asset needs part graph, export/reopen, browser viewer, performance, and live proof. A finance workflow needs source evidence, spreadsheet tie-out, and review-ready exports.

## Doctrine

Prometheus Mode = build, prove, learn, rebuild with receipts.

No passing proof, no final claim.
