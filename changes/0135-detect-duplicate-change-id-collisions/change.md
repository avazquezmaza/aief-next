# Change

## ID

`0135-detect-duplicate-change-id-collisions`

## Type

Fix

## Objective

Resolves the general gap named by external-audit finding **C0130-F2**
(`changes/0130-codex-external-audit/`): `nextChangeId()` derives the next numeric id only from
the current checkout, so two Changes scaffolded on separate branches can allocate the same
numeric prefix — no merge-time or project-level verifier detects it. Lived, not hypothetical:
this exact collision happened twice during this session's own work (`0122-*` and, twice,
`0123-*`).

`aief verify` now names any such collision project-wide — detection only, never blocking, the
same posture Change 0095 already established for manifest/change.md status drift.

## Scope

### In scope

- New `cli/src/core/domain/change-id-collisions.js`: `detectDuplicateChangeIds(basenames)`, a
  pure function grouping Change directory basenames by their leading numeric id and returning
  only groups with more than one basename.
- `cli/src/commands/verify.js`: whole-project `aief verify` (with or without `--strict`) reports
  any such collision as a non-blocking note, mirroring the existing manifest-status-drift
  rendering exactly.
- Tests: unit tests for the pure function; an integration test confirming `aief verify` reports
  a real collision without failing its exit code, and confirms no false positive when every
  Change has a unique id.
- Updates `changes/0130-codex-external-audit/evidence.md`'s Findings Status table: C0130-F2
  marked Resolved.

### Out of scope

- Changing Change-ID *allocation* itself (`nextChangeId()`) so parallel branches structurally
  cannot collide — Codex's own text offered this as an alternative to detection; detection was
  chosen (see Findings Status / rationale in evidence.md) because it requires no cross-branch
  coordination, which this project's "no hidden state" principle would otherwise have to
  reinvent.
- Making the collision blocking (failing `verify`'s exit code, or refusing `close`) — the
  existing `0122-*` collision is already merged, real, and unfixable retroactively without
  renumbering an already-closed, cross-referenced Change; a blocking check would immediately and
  permanently fail this repository's own `aief verify`.
- Surfacing the collision in `aief status`'s overview (only `aief verify` is touched) — a
  reasonable follow-up, not bundled here to keep this Change's diff scoped to one rendering
  location, matching Change 0095's own precedent of adding its drift note to `verify` first.

## Success Criteria

- `aief verify` (default and `--strict`) names any numeric-ID collision among the project's
  Change directories, without changing `Result: PASS`/exit code.
- Running it against this repository's own current state reports the real, pre-existing
  `0122-*` collision.
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0135-detect-duplicate-change-id-collisions --strict`, and `git diff --check` all pass.

## Status

Closed (2026-09-10)
