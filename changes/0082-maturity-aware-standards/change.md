# Change

## ID

`0082-maturity-aware-standards`

## Type

General

## Objective

Make `base-standards.md`, `testing-standards.md` and `security-standards.md` useful before
implementation exists, not only after: each now has an explicit `## Applies now` section
(governance, testability, trust boundaries, data classification, authn/authz and tenancy
decisions, decision documentation and approval) and an `## Applies once implementation starts`
section (concrete tooling — commands, coverage, linters, dependency audits).

## Inventory of what already exists (ADR-013 accounting)

- `createStandards()`/`standardsForProject()` (unchanged) already copy these exact template files
  from `cli/templates/standards/` into a project's `knowledge/standards/` on `aief bootstrap`, and
  `writeFile()` already refuses to overwrite a file that exists (used by every existing "never
  overwrites" adoption guarantee — Change 0009 area). This Change edits only the *content* of
  three template files; the copy mechanism, the "never overwrite an already-adopted project's own
  copy" guarantee, and `resolveStandardRecommendations()`'s consumption of them in `aief prompt`
  are all untouched.
  `documentation-standards.md`, `frontend-standards.md`, `backend-standards.md` are out of scope
  and unedited — the commissioning brief names base/testing/security specifically.
- ADR-013: this Change restructures existing template content into two sections — it does not add
  a new file, new command, or new mechanism; the "Applies now" content synthesizes concerns that
  were previously either absent (data classification, authn/authz as an explicit decision) or
  implicit (testability), replacing an implementation-only reading of these three standards with
  one that also serves the Definition stage. No historical, already-adopted project is affected —
  the "never overwrite" guarantee (unchanged) means a project bootstrapped before this Change keeps
  its own copy exactly as it was.

## Scope

### In scope

- `## Applies now` / `## Applies once implementation starts` sections in `base-standards.md`,
  `testing-standards.md`, `security-standards.md` (templates under `cli/templates/standards/`).
- Every existing bullet from the previous version of these three files preserved, relocated into
  whichever section it belongs to (nothing dropped).

### Out of scope

- `documentation-standards.md`, `frontend-standards.md`, `backend-standards.md`.
- Any policy engine, scoring, or enforcement of these standards — they remain guidance, read by a
  human/assistant via `aief prompt`, never executed.
- Any change to `createStandards()`, `standardsForProject()`, `builtinStandardsList()`, or
  `resolveStandardRecommendations()`.
- `aief verify --strict` — Change 0083.

## Success Criteria

- The three in-scope templates each have both sections, in that order.
- The three out-of-scope standard templates are byte-identical to before this Change.
- A freshly bootstrapped project's `knowledge/standards/` files show the new structure; an
  already-adopted project's own copies are never touched.
- Every bullet present in the previous version of the three templates is still present somewhere
  in the new version.

## Status

Closed (2026-08-14)
