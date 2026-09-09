# Tasks

## Implementation

- [x] Add `taskLabelGate(id, changeDir)` to `gate-evaluator.js` (R1); wire it for
      `review`/`approval`/`security_review` in `evaluateGates()` (R2).
- [x] Update `close.js` to use `workflow-service.js`'s `nextAction()` for a tracked Change,
      keeping the direct `checkChangeReadiness()` path for a no-track Change (R3, R4).
- [x] Add the `(review)` specific message to `checkStrictCompleteness()` (R5).

## Documentation

- [x] Document `(gate:<id>)` in `AGENTS.md` (R6) — and its byte-identical canonical template,
      `cli/templates/agents/AGENTS.md` (found via `agents-canonical.test.js`).
- [x] Update `gate-evaluator.js`'s header comment: no longer describes
      `review`/`approval`/`security_review` as permanently unbuilt; describes the
      `(gate:<id>)` mechanism instead.

## Verification

- [x] Replace `gate-evaluator.test.js`'s "always pending" test with `(gate:<id>)` coverage
      (unconfigured/pending, unchecked/failed, checked/passed, bullet/case tolerance).
- [x] Add `close` command tests (new file `cli-close-workflow-gates.test.js`): tracked Change
      blocked by an unresolved gate; same Change closing once resolved; a gate with no matching
      task at all; a `standard`-track nuance (see evidence.md); no-track Change unaffected.
- [x] Add the `(review)`-specific-message test to `verify-strict.test.js`, plus a regression
      test in `change-verifier.test.js` confirming an unchecked `(review)` task already blocked
      (and still blocks) `close` via `openTasksCount`, independent of the new message.
- [x] Update the two pre-existing tests (`cli-definition-enrichment.test.js`) that had asserted
      the pre-ADR-037 behavior as correct-by-design — they now assert the corrected behavior.
- [x] Run `npm test` (1070/1070), `npm run lint`, `git diff --check`.
- [x] Run `node cli/bin/aief.js verify --change 0125-implement-workflow-gate-authority --strict`.

## Evidence

- [x] Update evidence.md
