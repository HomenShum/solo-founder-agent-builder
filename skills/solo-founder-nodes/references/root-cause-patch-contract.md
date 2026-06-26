# Root-Cause Patch Contract

Every Reflex RALPH repair needs this contract before merge or promotion.

```md
# Repair Contract

## User-visible symptom
What did the user or visual judge see?

## Evidence
Trace, screenshot, receipt, failing selector, exact error.

## Violated invariant
What should always have been true?

## Root cause
Why did the architecture permit this?

## Systemic fix
What common layer is being corrected?

## Why this is not a one-task special case
Which other tasks/workflows benefit?

## Compatibility
What old behavior remains supported?

## Regression fixture
What failed before the patch and now passes?

## Live canary
Which real app flow proves the repair?

## Humanized UI impact
What will users now see instead of the raw failure?

## Architecture/proof updates
Which graph, domain pack, tool contract, or proof gate changed?

## Rollback
How is the change disabled or reverted?
```

The verifier rejects contracts that miss an invariant, evidence, regression fixture, live canary,
humanized UI impact, architecture/proof update, or rollback. It also rejects task-specific or
answer-key-like fixes.

Copyable implementation: `templates/reflex/patchContract.ts`.
