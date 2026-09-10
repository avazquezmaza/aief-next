# Change

## ID

`0131-manifest-close-persistence`

## Type

Fix

## Objective

Fixes finding **C0130-F1** from the external Codex audit (`changes/0130-codex-external-audit/`):
`aief close --yes` reports success on a manifest-backed Change but never updates
`manifest.json`'s `status` field, while `change-loader.js`'s own contract makes `manifest.json`
the sole authority for whether a Change is closed. Reproduced independently before this Change
was opened (see 0130's evidence.md): closing left the manifest byte-for-byte `"open"`, and
`aief status` immediately afterward reported `Status: open` with a warning that the manifest
still governs — a split-brain lifecycle result, not a documented feature.

## Scope

### In scope

- `cli/src/core/domain/change-loader.js`: new `markManifestClosed(changeDir)` — updates
  `manifest.json`'s `status` to `"closed"` on disk when the file exists and is valid; returns
  `null` (no-op) when there's no manifest at all; returns `false` (never throws, never silently
  proceeds) when the manifest exists but can't be safely read, parsed, or validated.
- `cli/src/commands/close.js`: calls `markManifestClosed()` **before** writing `change.md`, so
  a manifest that can't be safely updated aborts the whole close atomically — never reports
  success while silently skipping the authoritative state, and never leaves `change.md` and
  `manifest.json` disagreeing as a result of `close` itself.
- Updates the one pre-existing test that had pinned the bug as "established behavior"
  (`cli-graph-and-verification.test.js`), replacing it with the corrected expectation and a
  separate test preserving drift-*detection* coverage (a disagreement created independently of
  `close`, e.g. by hand, is still caught non-blockingly).
- New unit tests for `markManifestClosed()` and an atomicity test (a malformed manifest aborts
  before `change.md` is touched).

### Out of scope

- The general numeric-Change-ID-collision gap (C0130-F2) — a distinct finding, its one concrete
  instance already resolved by renaming `0130-codex-external-audit`; the general verifier is a
  separate, future Change if pursued.
- C0130-F3/C0130-F4 (documentation staleness in already-closed Change 0122's evidence) — minor,
  unrelated corrections to different Changes, not bundled here.
- Any change to `manifest.json`'s schema, or to what fields `close` is allowed to touch beyond
  `status` — this Change updates exactly the one field the bug is about.

## Success Criteria

- `aief close --yes` on a manifest-backed Change updates `manifest.json`'s `status` to
  `"closed"`, and no manifest/change.md disagreement results from that close.
- A manifest that exists but can't be safely parsed/validated aborts the close entirely —
  `change.md` is not written either, and the command exits non-zero with a clear message.
- A Change with no `manifest.json` at all: `aief close`'s behavior is unchanged.
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0131-manifest-close-persistence --strict`, and `git diff --check` all pass.

## Status

Closed (2026-09-10)
