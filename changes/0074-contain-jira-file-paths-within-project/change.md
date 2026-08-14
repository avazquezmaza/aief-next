# Change

## ID

`0074-contain-jira-file-paths-within-project`

## Type

General

## Objective

Fix Finding F2 from the completed technical audit: `aief enrich jira <id> --file <path>` has no
path-containment check and can read a file outside the project root, embedding its content
verbatim into a new Change's `spec.md`/`change.md`/`evidence.md`. `sdd-providers/openspec.js`
already has a reviewed `isPathWithin()` fix for the structurally identical risk.

## Scope

### In scope

- `requirement-providers/jira.js`'s `retrieve()`: reject a `--file` path that resolves (directly
  or via a symlink) outside the project root, before any read, mirroring the existing
  `isPathWithin()` pattern in `sdd-providers/openspec.js` and the symlink-aware
  `realPathIfWithin()` pattern in `core/services/verification-evidence.js`.
- Regression tests in `cli/tests/requirement-providers.test.js` covering: project-local path
  (unchanged), `../` escape, absolute-path escape, symlink escape, boundary-adjacent legitimate
  path, nonexistent-inside-project path (unchanged existing behavior).

### Out of scope

- `aief close --evidence-from <path>` (Finding F5) — deliberately NOT given the same containment.
  The remediation design phase established that CI-produced JUnit reports routinely and
  legitimately live outside the project root (temp directories, CI artifact mounts), so applying
  Jira's containment policy there would break a legitimate, documented use case
  ("already produced by your own test runner/CI" — `docs/cli.md`). F5 is addressed by
  documentation only, in a separate Change.
- The default (no `--file`) path construction, which uses `sourceId` rather than `options.file` —
  noted below as a separate observation, not fixed in this Change (see "Notes" in evidence.md).
- Any other audit finding.
- A shared, centralized path-containment helper module. This Change follows the codebase's own
  existing precedent (`verification-evidence.js` already duplicates `openspec.js`'s
  `isPathWithin()` rather than importing it, with an explanatory comment) — a third small,
  reviewed duplication, not a new cross-module dependency.

## Success Criteria

- A project-local `--file <path>` continues to work exactly as before.
- A `--file <path>` that resolves outside the project root (via `../`, an absolute path, or a
  symlink) is rejected before any read, with a clear, actionable message.
- No new runtime dependency.

## Status

Closed (2026-08-13)
