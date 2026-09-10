# Tasks

## Implementation

- [x] Add `markManifestClosed(changeDir)` to `change-loader.js` (R1, R2, R3).
- [x] Wire it into `close.js`, before `markClosed()`, for atomicity (R4, R5).

## Documentation

- [x] Header comments on `markManifestClosed()` and its `close.js` call site explain the
      atomicity ordering and cite the audit finding (C0130-F1) this fixes.

## Verification

- [x] `change-loader.test.js`: `markManifestClosed()` unit tests — no-op, success, malformed
      JSON, schema-invalid.
- [x] `cli-graph-and-verification.test.js`: replaced the test that had pinned the bug with the
      corrected expectation; added a separate test preserving drift-detection coverage
      independent of `close`; added the atomicity (malformed manifest aborts before change.md)
      test.
- [x] Confirmed the pre-existing "manifest.json is never touched by close" test
      (`cli-definition-enrichment.test.js`, the blocked-Workflow-gate case) still passes
      unmodified — `markManifestClosed()` is only reached after the blocked-check, so a refused
      close still touches nothing.
- [x] Run `npm test` (1095/1095), `npm run lint`, `git diff --check`.
- [x] Run `node cli/bin/aief.js verify --change 0131-manifest-close-persistence --strict`.

## Evidence

- [x] Update evidence.md
