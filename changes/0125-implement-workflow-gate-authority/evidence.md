# Evidence

## Summary

Implements ADR-037 (Change 0124): `aief close` now enforces `review`/`approval`/
`security_review` Workflow Gates for a Change that declares a `track`, resolved from explicit
`(gate:<id>)` `tasks.md` labels — while a Change with no `track` closes exactly as before
(verified byte-identical by the full, unmodified pre-existing test suite passing). Also adds the
`(review)`-specific `--strict` message (D4), corrected in scope during implementation — see
Findings.

## Activities Performed

- `gate-evaluator.js`: replaced `notYetBuiltGate()` for `review`/`approval`/`security_review`
  with `taskLabelGate(id, changeDir)`, resolving each from its own `(gate:<id>)` tasks.md line.
  Unconfigured (no matching line) → `pending`; unchecked → `failed`; checked → `passed`. Never
  fabricates "passed" for an absent task (WF-R8, same discipline as before).
- `close.js`: for a Change whose manifest declares a recognized `track`, readiness is now
  decided by `workflow-service.js`'s `nextAction()` — reused as-is, not reimplemented. A
  Change with no track keeps calling `checkChangeReadiness()` directly, unchanged code path.
- `change-verifier.js`: added a `(review)`-specific message to `checkStrictCompleteness()`,
  mirroring the existing `(human)` one.
- `AGENTS.md` **and** `cli/templates/agents/AGENTS.md` (the canonical template — found via the
  pre-existing `agents-canonical.test.js` guard, which failed until both were updated
  identically) document the new `(gate:<id>)` label.
- Updated `gate-evaluator.js`'s header comment to describe the new mechanism.

## Verification

- `npm test` (cli/): 1070/1070 passed (was 1067/1070 mid-implementation — 3 failures were
  pre-existing tests that had asserted the pre-ADR-037 behavior as the deliberately-correct
  design; both were rewritten to assert the corrected behavior, and the canonical-template
  drift was fixed).
- `npm run lint`: clean.
- `node cli/bin/aief.js verify --change 0125-implement-workflow-gate-authority --strict`: PASS.
- `git diff --check`: clean.
- New test file `cli/tests/cli-close-workflow-gates.test.js` (6 tests) covers: a `governed`
  Change blocked by an unresolved `(gate:approval)` task; the same Change closing once resolved;
  a gate with no matching task at all (never fabricated "passed"); a `standard`-track nuance
  (see Findings); a Change with no track fully unaffected.

## Findings

- **D4 was corrected before implementation** (flagged to and confirmed by the project owner):
  the ADR described `(review)` tasks as not blocking `close` at all. Verified against the code
  directly: `checkChangeReadiness()`'s generic `openTasksCount` check already blocks `close` on
  *any* unchecked `tasks.md` line, `(review)` included — proven with a live reproduction
  (`checkChangeReadiness()` on a Change with only an unchecked `(review)` task returned
  `["1 unchecked task(s) in tasks.md"]`). The real, narrower gap implemented here: `(human)`
  had a specific, named `--strict` message that `(review)` lacked. This Change closes that
  message-quality gap, not a (nonexistent) blocking gap.
- **A stage-ordering interaction, discovered while writing the close tests**: `resolveState()`
  (unchanged, pre-existing) walks a track's stages in their declared order and reports only the
  first blocked stage. In `standard`/`governed`, `verify` (the `readiness` gate) precedes
  `review`/`security_review`. Since an unchecked `(gate:review)` line is itself an unchecked
  `tasks.md` line, it is caught by `readiness`'s generic `openTasksCount` check *first* — so the
  named `review`/`security_review` gate's own message can only ever surface distinctly when the
  matching task is **missing entirely**, not merely unchecked (the `approval` gate, which
  precedes `verify` in `governed`, is unaffected by this and surfaces normally either way).
  `close` always still correctly refuses in every case — this only affects which exact reason
  is shown when two problems coexist. Documented with a dedicated, passing test
  (`cli-close-workflow-gates.test.js`); no code change made for it — reordering
  `workflows/*.json`'s stages was explicitly out of scope for this Change.

## Risks

- None blocking. The stage-ordering finding above is a message-clarity nuance, not a
  correctness gap — `close` never fabricates "passed" and never closes a Change with an
  unresolved gate, in any case exercised.

## Recommendations

- If the stage-ordering nuance above is found confusing in practice, a future Change could
  either reorder `governed.json`'s `security_review`/`review` stages ahead of `verify`, or have
  `resolveState()` surface all currently-blocked stages instead of only the first — both are
  changes to shared, pre-existing engine behavior, out of scope here.
- The `dependsOn`/Graph question (should Graph dependencies also block `close`?) and the
  `specification` gate (Requirement Verification governing `close`) remain open, as scoped out
  of ADR-037/this Change.

## Artifacts Produced

- `cli/src/core/services/gate-evaluator.js`, `cli/src/commands/close.js`,
  `cli/src/core/services/change-verifier.js` (implementation).
- `AGENTS.md`, `cli/templates/agents/AGENTS.md` (documentation, kept byte-identical).
- `cli/tests/cli-close-workflow-gates.test.js` (new), plus updates to
  `cli/tests/gate-evaluator.test.js`, `cli/tests/verify-strict.test.js`,
  `cli/tests/change-verifier.test.js`, `cli/tests/cli-definition-enrichment.test.js`.

## Lessons Learned

- A "the code is byte-identical to a template elsewhere" guard test caught a real omission
  (the canonical `AGENTS.md` template) that would otherwise have silently drifted — worth
  grepping for `canonical`/`template` guard tests whenever editing a file that ships as one.
- Verifying an audit's claim against the actual code before implementing it (the D4 correction)
  avoided building a fix for a problem that, in its strongest form, didn't exist — the weaker,
  real version was still worth fixing, but the distinction mattered for scoping the work
  correctly.

## Next Change

- None required by ADR-037 itself. Optional follow-ups noted in Recommendations above, deferred
  until a real need is observed (matching this project's own "no observed need, no abstraction"
  discipline, applied elsewhere to the Graph and the multi-agent-runtime question).
