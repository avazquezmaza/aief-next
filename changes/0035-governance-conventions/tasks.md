# Tasks

## Documentation

- [x] Write `docs/governance-conventions.md` (8 sections + parser-compatibility).
- [x] Write `docs/dogfooding-findings.md` (five-column ledger, Flux Portal case study).

## Templates

- [x] `templates/change/tasks.md`: optional gate-label + `[-]` deferred-work guidance (commented).
- [x] `templates/change/evidence.md`: optional Validation Harness / Increments pointer; "never secrets".
- [x] `templates/change/change.md`: optional Architecture Checkpoint pointer.
- [x] `AGENTS.md`: "Tasks and gates" rule (assistants must not check `(human)`/`(review)`).
- [x] `knowledge/backlog.md`: refine the Initiative deferral.

## Verification

- [x] Empirically confirm `[-]` does not block close and `(human)` `[ ]` does (temp repo).
- [x] Root `npm test` green (93/93) — no executable file changed by this Change.
- [x] Example tests green (3/3).
- [x] `aief verify` PASS; `verify --change 0035` structure PASS.
- [x] Relative links in the two new docs resolve.
- [x] Flux Portal (`trk-orchestrator-portal`) not touched.

## Evidence

- [x] Update evidence.md
