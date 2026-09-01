# Tasks

## Implementation

- [x] `detectManifestStatusDrift(change)` — pure comparator, no I/O — in
      `cli/src/core/domain/manifest-status-drift.js`.
- [x] Expose `change.md`'s raw content on the manifest branch (`changeMdRaw`)
      in `cli/src/core/domain/change-loader.js`, without touching `.closed`.
- [x] `manifestStatusDriftChanges()` helper in `cli/src/commands/shared.js`,
      mirroring `invalidManifestChanges()`.
- [x] `aief status` — overview section + `--change` per-Change warning line.
- [x] `aief verify` — non-blocking note for `--change <id>` and whole-project.

## Documentation

- [x] `docs/concepts.md`'s "Current limitation" paragraph updated to describe
      detection, without claiming the underlying gap (no writer) is resolved.

## Verification

- [x] Unit tests for `detectManifestStatusDrift()` (no manifest, no
      declaration, agreement, drift, unparseable status, invalid manifest,
      zero-drift regression over every real Change).
- [x] CLI-level tests: byte-identical baseline with no manifest-backed
      Change; a manifest-backed Change closed via `aief close --yes` surfaces
      the warning from `status` (overview + `--change`) and `verify`
      (`--change` + whole-project), PASS/exit code unaffected, manifest.json
      unchanged.
- [x] `npm test`, `node cli/bin/aief.js verify`, `git diff --check`.

## Evidence

- [x] Update evidence.md
