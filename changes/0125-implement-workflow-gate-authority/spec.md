# Specification

## Goal

`aief close` enforces `review`/`approval`/`security_review` Workflow Gates for a Change that
declares a `track`, resolved from explicit `(gate:<id>)` task labels — while a Change with no
`track` closes exactly as it always has.

## Requirements

- R1: `gate-evaluator.js` gains a `taskLabelGate(id, changeDir)` function: scans `tasks.md` for
  every line matching `^\s*[-*+]\s*\[([ xX])\]\s*\(gate:<id>\)\s*(.+)$`. Zero matches →
  `status: "pending"`, `blocking: true`, reason names that no `(gate:<id>)` task exists yet
  (never fabricates "passed" for an unconfigured gate — same WF-R8 discipline the code it
  replaces already followed). One or more matches, any unchecked → `status: "failed"`,
  `blocking: true`, reason lists the unchecked task text(s). All matched checked →
  `status: "passed"`, `blocking: true`.
- R2: `evaluateGates()` calls `taskLabelGate("review"|"approval"|"security_review", ...)` in
  place of the current `notYetBuiltGate(...)` calls for those three ids. No other gate
  (`readiness`, `status_consistency`, `identity`, `specification`) changes.
- R3: `close.js`: for a Change whose manifest declares a recognized `track`, the readiness
  check is `workflow-service.js`'s `nextAction(changeDir, cwd)` — reused as-is, not
  reimplemented — instead of a direct `checkChangeReadiness()` call. `nextAction()` already
  returns `{ id: "close", status: "available" }` when every gate (including `readiness`,
  which itself wraps `checkChangeReadiness()`) passes, and a blocked/pending result naming the
  stage and blockers otherwise.
- R4: For a Change with no `track` (or an unrecognized one — `workflow.kind !== "resolved"` in
  `workflow-service.js` terms), `close.js`'s behavior is unchanged: it calls
  `checkChangeReadiness()` directly, exactly as before this Change. This is a hard
  backward-compatibility requirement, not a preference.
- R5: `change-verifier.js`'s `checkStrictCompleteness()` gains a regex mirroring the existing
  `(human)` one, for `(review)`: an unchecked `- [ ] (review) ...` line produces
  `"unresolved required independent review: <text>"` under `--strict`. This is additive to,
  not a replacement for, the existing generic `openTasksCount` blocking (R5 does not change
  whether `close` blocks — only what `--strict` names).
- R6: `AGENTS.md` documents `(gate:<id>)` alongside the existing `(human)`/`(review)` labels,
  naming the three valid ids (`approval`, `security_review`, `review`) and that they apply only
  to a Change that declares the corresponding track's gate.

## Acceptance Criteria

- [ ] A `governed`-track Change with `tasks.md` containing an unchecked
      `- [ ] (gate:approval) ...` line: `aief close --yes` refuses, naming the unresolved gate.
- [ ] The same Change with all three `(gate:*)` tasks checked, and structural readiness
      otherwise passing: `aief close --yes` succeeds.
- [ ] A Change with no `track` declared: every existing `close`/`checkChangeReadiness` test
      passes unmodified — zero behavior change.
- [ ] A `standard`/`governed`-track Change whose `tasks.md` has no `(gate:<id>)` line at all
      for a gate its track declares: `aief close --yes` refuses with a "no (gate:<id>) task
      found" reason (never fabricates "passed" for an absent, unconfigured gate).
- [ ] `evaluateGates()`'s existing test asserting `review`/`approval`/`security_review` are
      "always pending, never passed" is replaced with one asserting they resolve via
      `(gate:<id>)` — the old assertion described a permanent design constraint that no longer
      holds after this Change.
- [ ] An unresolved `(review)` task produces the new specific `--strict` message; this is
      verified to be additive (the pre-existing generic `openTasksCount` block is unaffected —
      a test confirms a `(review)`-only unchecked task already blocked `close` before this
      Change and still does, by the same mechanism, after it).
- [ ] `npm test`, `npm run lint`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0125-implement-workflow-gate-authority --strict`
      all pass.
