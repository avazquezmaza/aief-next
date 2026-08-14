# Tasks

## Implementation

- [x] Add `cli/src/core/domain/project-maturity.js` — `classifyMaturity(rootDir)`.
- [x] Wire `classifyMaturity()` into `analyze()`, routing `definition`/`implemented`/`ambiguous`.
- [x] Add `--maturity` override flag to `analyze`'s `KNOWN_FLAGS` entry.
- [x] Reject an unrecognized `--maturity` value explicitly, before any write.

## Tests

- [x] `classifyMaturity()` unit tests: PRD-only, PRD + tooling-only metadata, real Node app, real
      non-Node app, sparse ambiguous repo, AIEF itself, source-wins-over-definition-content,
      config-file-under-src-excluded, node_modules-never-scanned.
- [x] `aief analyze` on a PRD-only repo creates a Definition Change.
- [x] `aief analyze` on a real Node app is unchanged (still Analysis, no Definition note).
- [x] `aief analyze` on a sparse/ambiguous repo still creates an Analysis Change, with an explicit
      ambiguity note (regression check against the existing test suite's own fixtures).
- [x] `aief analyze --maturity definition` / `--maturity implemented` force routing.
- [x] `aief analyze --maturity bogus` is rejected, no Change created.
- [x] Full existing `cli.test.js` suite passes with zero fixtures modified.

## Verification

- [x] `npm test`
- [x] `node cli/bin/aief.js verify`
- [x] `git diff --check`

## Evidence

- [x] Update evidence.md
