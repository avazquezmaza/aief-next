# Change

## ID

`0148-security-model-id-collision-gap`

## Type

Fix

## Objective

Correct a stale Known Gap in `docs/security-model.md`: it still says numeric Change-ID collisions
"are not caught automatically" and that "the general gap remains open", although Changes 0135/0137
made `aief verify` and `aief status` detect them (C0130-F2, resolved as detection). The Change 0146
documentation audit missed it.

## Scope

### In scope

- Rewrite that one bullet so it matches current behavior: detected as a non-blocking notice,
  ambiguous bare-number selectors fail, allocation-side prevention deliberately not pursued.

### Out of scope

- Any code change; preventing collisions at allocation time.
- Renaming the existing duplicate `0122` Changes.

## Success Criteria

- The bullet matches observed behavior of `aief verify`, `aief status` and `--change <number>`.
- `npm test`, `aief verify` and `git diff --check` pass.

## Status

Closed (2026-10-01)
