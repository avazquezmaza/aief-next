# Change

## ID

`0028-developer-handoff-package`

## Type

Documentation (handoff package; one README section added). No runtime behavior changes.

## Objective

Close the validation phase and produce the minimum documentation package a development team needs to start using AIEF safely on real projects, at **pre-1.0 internal-pilot** readiness. Convert the two validation reviews and the Workflow Cohesion roadmap decision into an operational handoff, without redesigning the product, adding features, or declaring 1.0.

## Scope

### In scope

- `docs/TEAM-USAGE-GUIDE.md` — practical developer guide (what AIEF is/is not, when to use/not, required tools, setup, adopt, new Change, prompt, manual assistant work, evidence, verify, close, common mistakes, required human review points).
- `docs/VALIDATION-SUMMARY.md` — greenfield and brownfield results, what was validated, what worked, remaining friction, approval status, allowed/forbidden uses.
- `docs/AIEF-1.0-READINESS.md` — pre-1.0 status, conditions for 1.0, required Workflow Cohesion fixes, Definition of Done, Go/No-Go, explicit "1.0 not declared" statement.
- `docs/DEVELOPER-CHECKLIST.md` — one-page checklist (before starting, during Change, before implementation, before close, before commit/push).
- `docs/ROADMAP-TO-1.0.md` — frozen roadmap: the four Workflow Cohesion workstreams only; explicit deferrals.
- `README.md` — new "Current Status" section near the top.
- `CHANGELOG.md` — entry for this Change.
- This Change (`changes/0028-developer-handoff-package/`).

### Out of scope

- Any runtime / CLI behavior change; no new commands.
- Any architectural redesign or new ADR; accepted ADRs are not modified.
- Implementing the Workflow Cohesion fixes (deferred to future Changes).
- Declaring AIEF 1.0 or claiming external production readiness.
- The Operational Profiles implementation (ADR-012) and other deferred workstreams.

## Success Criteria

- All five handoff docs exist and are internally consistent.
- README "Current Status" states pre-1.0 pilot, guided internal use, one greenfield + one brownfield validation, not yet 1.0, and links to the usage guide and readiness doc.
- No runtime behavior changed; no new command; no ADR modified; 1.0 not declared.
- `npm test` green; `aief verify` PASS.

## Status

Closed (2026-07-06)
