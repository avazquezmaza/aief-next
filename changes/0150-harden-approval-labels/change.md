# Change

## ID

`0150-harden-approval-labels`

## Type

Fix

## Objective

Implement the decision recorded in Change 0149 (Option 1+ with the non-blocking adjustment):
make `(human)` and `(review)` approvals as hard to bypass silently as `(gate:<id>)` approvals
already are, make the approvals a Change relies on visible at close time, and document the
platform controls for teams and the accepted residual risk.

## Scope

### In scope

- One shared parser for approval lines in `tasks.md`: `(human)`, `(review)`, `(gate:<id>)`, each
  with state checked `[x]`, unchecked `[ ]` or abandoned `[-]`.
- `checkChangeReadiness()` (used by `close`, and by the Workflow Engine's `readiness` gate for
  tracked Changes): an abandoned `(human)` or `(review)` line is a readiness problem.
- `checkStrictCompleteness()`: the same problem, named, under `verify --strict`.
- `verify --strict`: a non-blocking notice for an Analysis or Definition Change with no `(human)`
  line.
- `aief close`: when readiness passes, print the approval lines it relies on (or say there are none)
  before closing; also shown without `--yes`.
- Tests for each behavior.
- Docs: `docs/security-model.md` (Known Gaps: what is enforced now, team platform controls, residual
  risk), `docs/cli.md` (`close` and `verify --strict` rows), `AGENTS.md` and its template
  `templates/agents/AGENTS.md` (one sentence: `[-]` does not resolve an approval),
  `docs/history/governance-conventions.md` §2 (same rule).

### Out of scope

- Identity verification of any kind; git provenance; signing; an `aief approve` command (rejected
  in 0149).
- Detecting a deleted approval line in ordinary Changes (no history is read).
- Changing ADR-037 or gate behavior.

## Success Criteria

- `- [-] (human) …` and `- [-] (review) …` block `close` and fail `verify --strict` with a clear message.
- `close` lists the approvals it relies on.
- `verify --strict` shows a non-blocking notice for Analysis/Definition Changes without `(human)`;
  project-wide `verify --strict` result is unchanged by it.
- No closed Change in this repository changes verdict.
- `npm test`, `npm run lint`, `aief verify` and `git diff --check` pass.

## Status

Closed (2026-10-01)
