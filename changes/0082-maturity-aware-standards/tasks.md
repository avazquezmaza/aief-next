# Tasks

## Implementation

- [x] Restructure `cli/templates/standards/base-standards.md` with the two sections.
- [x] Restructure `cli/templates/standards/testing-standards.md` with the two sections.
- [x] Restructure `cli/templates/standards/security-standards.md` with the two sections.
- [x] Confirm `documentation-standards.md`/`frontend-standards.md`/`backend-standards.md` are
      untouched.

## Tests

- [x] Both sections present, in order, in the three in-scope templates after `aief bootstrap`.
- [x] Out-of-scope standards have no "Applies now" section (regression guard).
- [x] An already-adopted project's own `base-standards.md`/`security-standards.md` is never
      rewritten (backward compatibility).
- [x] Full existing `cli.test.js` suite passes unmodified.

## Verification

- [x] `npm test`
- [x] `node cli/bin/aief.js verify`
- [x] `git diff --check`

## Evidence

- [x] Update evidence.md
