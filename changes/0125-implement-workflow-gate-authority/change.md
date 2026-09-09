# Change

## ID

`0125-implement-workflow-gate-authority`

## Type

Fix

## Objective

Implement the decision recorded in [ADR-037](../../knowledge/decisions.md) (Change 0124):

- **D1/D3**: `aief close` becomes able to actually consult and enforce Workflow Gates
  (`review`, `approval`, `security_review`) for a Change that declares a `track` — opt-in,
  never affecting a Change with no track.
- **D2**: `review`/`approval`/`security_review` resolve from an explicit, repository-visible
  task label: `(gate:review)`, `(gate:approval)`, `(gate:security_review)` in `tasks.md`.
- **D4 (corrected during this Change — see evidence.md)**: the ADR describes `(review)` task
  labels as not blocking `close`. Verified against the code before implementing: this was
  imprecise. `checkChangeReadiness()`'s generic `openTasksCount` already blocks `close` on
  *any* unchecked `tasks.md` line, `(review)` included — so `(review)` was never actually
  unenforced. The real, narrower gap: `(human)` gets a specific, named message under
  `aief verify --strict` ("unresolved required human decision: ..."); `(review)` gets only the
  generic "N unchecked task(s)" count, with no equivalent named message. This Change closes
  that message-quality gap, not a blocking gap.

## Scope

### In scope

- `cli/src/core/services/gate-evaluator.js`: replace the permanent `notYetBuiltGate()` result
  for `review`/`approval`/`security_review` with an evaluator that resolves each from its own
  `(gate:<id>)` task label in the Change's `tasks.md`.
- `cli/src/commands/close.js`: for a Change that declares a `track`, consult
  `workflow-service.js`'s `nextAction()` (already computes the correct tracked-vs-legacy
  answer — see design note in evidence.md) instead of calling `checkChangeReadiness()` as the
  sole gate. A Change with no track keeps calling `checkChangeReadiness()` exactly as before —
  byte-identical behavior.
- `cli/src/core/services/change-verifier.js`: add a specific message for an unchecked
  `(review)` task, mirroring the existing `(human)` one, under `checkStrictCompleteness()`.
- `AGENTS.md`: document the new `(gate:<id>)` label convention alongside `(human)`/`(review)`.
- Tests: `gate-evaluator.test.js` (the `(gate:<id>)` evaluator, replacing the "always pending"
  assertion), `change-verifier.test.js` (the new `(review)` message), `close` command tests (a
  `governed`/`standard` Change blocked by an unresolved gate cannot close; a no-track Change's
  behavior is unchanged), `workflow-service.test.js` if `nextAction()`'s legacy branch needs
  any adjustment (expected: none — it's reused as-is).

### Out of scope

- The `dependsOn`/Graph question (whether Graph dependencies should also block `close`) —
  tracked separately, not part of ADR-037.
- The `specification` gate (SDD/Requirement Verification governing `close`) — deliberately left
  unwired per `gate-evaluator.js`'s own existing design; a distinct, future decision.
- Any change to `cli/src/workflows/*.json`'s stage/transition structure — only what the
  `review`/`approval`/`security_review` gates resolve from changes.
- Renaming or restructuring the `(human)`/`(review)` generic labels — `(gate:<id>)` is
  additive, alongside them.

## Success Criteria

- A `governed` Change with an unresolved `(gate:approval)` task cannot be closed via
  `aief close --yes`, even when every file/evidence/structural check otherwise passes.
- The same Change, once `(gate:approval)`, `(gate:security_review)`, and `(gate:review)` are
  all checked (and structural readiness passes), closes successfully.
- A Change declaring no `track`: `aief close`'s behavior, output, and problem list are
  byte-identical to before this Change (regression tests pass unchanged).
- An unresolved `(review)` task now produces a specific message under `--strict`
  ("unresolved required independent review: ..."), mirroring `(human)`'s existing one — without
  changing whether it blocks `close` (it already did, via `openTasksCount`).
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0125-implement-workflow-gate-authority --strict`, and `git diff --check` all pass.

## Status

Closed (2026-09-09)
