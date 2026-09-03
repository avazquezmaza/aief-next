# Change

## ID

`0086-close-must-not-bypass-an-unresolved-definition-decision`

## Type

General

## Objective

Fix a real governance bypass found by a focused pre-merge adversarial review of Changes
0079–0084: `aief close --yes` could mark a Definition Change Closed while `## Decision (human)`
still held the untouched "Pending human approval..." scaffold sentence, as long as every `(human)`
approval *task* in `tasks.md` was checked off. Checking a task records that a human looked; it
says nothing about whether the decision the task refers to was actually recorded.

## Defect

**Reproduced** (the review's "Case 2"):

```text
Decision (human): "Pending human approval..." (untouched)
(human) approval tasks: all checked
```

`aief close --yes` succeeded. This directly violates the invariant the whole Definition
capability (Changes 0079–0084) claims to enforce: "a required human decision cannot appear
complete while it is objectively unresolved."

**Root cause.** `checkChangeReadiness()` (`change-verifier.js`), the only function `aief close`
consults, checked `openTasksCount` (did every task get checked) but never inspected what
`## Decision (human)` actually contains. `checkStrictCompleteness()` (Change 0083) already
contained the correct check — but `--strict` is opt-in and `close` never calls it.

**Confirmed not broken:** the other three states in the matrix a focused review specified.

| Decision (human) | Approval task | `close` (before this fix) |
|---|---|---|
| Pending | unchecked | Blocked (open task) — correct |
| Pending | **checked** | **Succeeded — the bug** |
| Recorded | unchecked | Blocked (open task) — correct |
| Recorded | checked | Succeeded — correct |

## Fix

Extracted the existing `Decisions Required has content but Decision (human) records no outcome
yet` check (Change 0083's `checkStrictCompleteness()`) into a standalone, exported
`definitionDecisionOutcomeProblem(change)`, and call it — unconditionally, not opt-in — from
`checkChangeReadiness()`, the single function both `aief close` and `aief verify --change`'s
`Not closed`/readiness inference already share. This is the same "close adds close-specific
questions on top of verify's structural ones" precedent `openTasksCount` already established
(`docs/cli.md`'s existing verify-vs-close note) — not a new mechanism, not the whole of
`--strict` made mandatory (explicitly avoided per the review's own instruction), scoped to exactly
the one invariant the bypass was found in.

## Inventory of what already exists (ADR-013 accounting)

- Reuses `analyzeDefinitionSections()` (Change 0081) and the exact check `checkStrictCompleteness()`
  (Change 0083) already had — no duplicate logic, extracted into one shared function both now call.
- `checkChangeReadiness()`'s only caller is `aief close` (confirmed by inspection — one call site
  in `cli.js`); this fix does not touch default `aief verify`'s output for any Change type.
- No new approval mechanism, no new persistence, no new CLI flag.

## Scope

### In scope

- `definitionDecisionOutcomeProblem(change)`, exported, shared by `checkStrictCompleteness()` and
  `checkChangeReadiness()`.
- `checkChangeReadiness()` always runs it for a Definition Change (not opt-in).
- Regression tests: the full 4-case matrix at the domain level (`checkChangeReadiness()` directly)
  and at the CLI level (`aief close`), plus a non-Definition-Change regression guard.

### Out of scope

- Any other `checkStrictCompleteness()` check (`TODO`/`TBD`, scaffold placeholders, empty Requirements/
  Acceptance Criteria) — these remain `--strict`-only, not close-blocking, per the review's
  explicit instruction not to make the whole of strict verification mandatory at close.
- Any change to default `aief verify`'s output.
- The assistant trust boundary (prompt-level instruction not to self-approve) — unchanged; this
  fix closes the *technical* gap the review found, not the *policy* layer, which was already
  correct (see the final review report's "Assistant Trust Boundary" section).

## Success Criteria

- `aief close --yes` refuses a Definition Change with every `(human)` task checked but
  `Decision (human)` still the untouched placeholder — Case 2, the confirmed bug, now blocked.
- Cases 1, 3, 4 of the matrix remain exactly as they were (already correct).
- No non-Definition Change's `close`/`verify` behavior changes.

## Status

Closed (2026-08-14)
