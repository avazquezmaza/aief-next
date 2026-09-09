# Evidence

## Summary

Definition Change resolving whether Workflow Gates (`review`/`approval`/`security_review`) are
advisory or enforceable by `aief close`, and how they'd resolve if enforceable. The
recommendation (D1: enforceable, opt-in by declared track; D2: explicit `(gate:<id>)` task
labels; D3: settled by D1; D4: defer the `(review)`-task enforcement gap fix to the follow-up
Change) was approved as written by the project owner (mandara0.ia@gmail.com, 2026-09-09), with
no amendments, recorded in `change.md`'s `## Decision (human)` and as
[ADR-037](../../knowledge/decisions.md#adr-037-workflow-gates-become-enforceable-by-aief-close-opt-in-by-declared-track-resolved-by-explicit-per-gate-task-labels).

## Activities Performed

- Read `cli/src/commands/close.js`, `cli/src/core/services/gate-evaluator.js`,
  `cli/src/core/services/transition-engine.js`, and all three `cli/src/workflows/*.json`
  definitions to confirm, in code, that `close` never calls `evaluateGates()`/`resolveState()`.
- Confirmed `review`/`approval`/`security_review` are permanently `pending`/`blocking: true` by
  `gate-evaluator.js`'s own design (`notYetBuiltGate()`), not an oversight.
- Additionally found and verified, by grepping the whole `cli/src` tree, that `AGENTS.md`'s
  stated rule — `(human)` and `(review)` task labels both block `aief close` while unchecked —
  is only half-implemented: `change-verifier.js` checks for unresolved `(human)` lines but has
  no equivalent check for `(review)`. Recorded as Open Question Q4 / Decision D4, with its own
  recommendation (defer to the follow-up implementation Change, not fixed here).
- Wrote Context, Business/Product Constraints, Known Requirements, Assumptions, Open Questions,
  Decisions Required, Options Considered, Recommendation, Rationale, Consequences, and the
  remaining Definition Change sections in `change.md`.

## Verification

- `node cli/bin/aief.js verify --change 0124-workflow-gate-authority` — confirms the scaffold's
  required sections are present and non-placeholder; expected to report the Change as in
  progress (not closable) until `Decision (human)` is recorded and `knowledge/decisions.md` is
  updated, per the Human Approval and Durable Knowledge tasks below.
- No `npm test` / `npm run lint` run: this Change makes no application-code change (Definition
  Changes propose decisions, they do not implement).

## Findings

- Confirmed exactly the two gaps identified in the audit that prompted this Change: (1) `close`
  has no path to the Workflow Engine at all, for any track; (2) `(review)` task labels are
  documented as blocking but not enforced. Both are cited with file/line evidence in
  `change.md`'s Context.

## Risks

- None outstanding — the Recommendation was approved as written, so no re-scoping is needed
  before the follow-up implementation Change starts.

## Recommendations

- See `change.md`'s own `## Recommendation` section (D1: enforceable, opt-in by declared track;
  D2: explicit `(gate:<id>)` task labels; D3: settled by D1; D4: defer to the follow-up Change).

## Artifacts Produced

- `changes/0124-workflow-gate-authority/change.md`, `spec.md`, `tasks.md` (this Change).
- `knowledge/decisions.md` — ADR-037.

## Lessons Learned

- Scaffolding with `aief new-change ... --type definition` up front (rather than the default
  `general` type, corrected mid-Change here) matters: the Definition scaffold's section
  headings are what `definition-enrichment.js` and `change-verifier.js`'s Definition-specific
  checks key off of — a hand-rolled `change.md` with the right words but the wrong headings
  would not integrate with existing tooling.

## Next Change

- `implement-workflow-gate-authority` (name provisional): wires `close.js` to
  `evaluateGates()`/`resolveState()` for a Change that declares a `track`, adds
  `(gate:<id>)` task-label parsing to `change-verifier.js`, fixes the `(review)`-task
  enforcement gap (D4), and updates `AGENTS.md`/`docs/` to document the new label convention.
  Not started by this Change — Definition Changes propose, they do not implement.
