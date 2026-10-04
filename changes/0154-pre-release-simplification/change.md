# Change

## ID

`0154-pre-release-simplification`

## Type

Analysis

## Objective

Before AIEF is released beyond its owner, diagnose which parts of AIEF earn their place, based on
real use, and define the work that leaves the smallest product that does the job. Breaking changes
cost nothing now: AIEF has no users outside this machine (owner, 2026-10-04).

This Change records the diagnosis and the plan. It implements nothing.

Sources: this repository (code, tests, docs, 154 Changes, 37 ADRs), 11 projects on the owner's
machine that use AIEF (93 Changes), a disposable project exercising every opt-in feature, and a
read of ECC (`affaan-m/ECC` v2.2.3, MIT) for ideas worth borrowing.

## Scope

### In scope

- Diagnosis of AIEF against real use: what is used, what is not, and why (not discoverable, not
  needed, or not working).
- Bugs found while exercising the product.
- A verdict for each component: keep, rescue (keep the need, change the design), merge, or remove.
- A plan in three waves, each item sized as a follow-up Change.
- Which ECC ideas fit, and where. ECC material may be used as a starting base, with MIT
  attribution, only where noted.
- A Findings Status table.

### Out of scope

- Implementing any item, including the bug fixes.
- Changing ADRs here. Removals that contradict an accepted ADR get a superseding ADR in the
  Change that removes them.

## Success Criteria

- Every component has a verdict backed by usage data or a reproduction.
- Every bug has a reproduction and a file reference.
- The owner approves or edits the wave plan.
- `node cli/bin/aief.js verify --change 0154-pre-release-simplification --strict` passes after the
  owner's `(human)` review.

## Status

Closed (2026-10-04)
