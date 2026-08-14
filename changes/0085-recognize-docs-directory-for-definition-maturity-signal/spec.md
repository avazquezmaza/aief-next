# Specification

## Goal

`classifyMaturity()`'s definition signal recognizes PRD/requirements/architecture content under
`docs/`/`documentation/`, not only specially-named files at the repository root, closing a real
false-negative found by pre-merge review — with the same determinism, no new dependency, no
scoring.

## Requirements

- `findDefinitionDocuments(rootDir)` combines: (a) root-level files matching
  `DEFINITION_FILENAME` (unchanged), and (b) every file directly inside `docs/` or
  `documentation/` (one level, not recursive) whose extension is `.md` or `.txt` — any filename.
- Word counts from both sources are summed into the same `words` total; `files` lists both,
  `docs/`-sourced entries prefixed with their directory (`docs/prd.md`).
- `Implemented` precedence is untouched — a repository with real source under a recognized source
  directory is still `implemented` regardless of `docs/` content.
- No recursion beyond one level into `docs/`/`documentation/`; a nested directory (`docs/adr/`,
  `docs/images/`) is not scanned.
- Non-`.md`/`.txt` files under `docs/` (images, JSON, etc.) never count.

## Acceptance Criteria

- [ ] A repository with a short root README and substantial `docs/prd.md` +
      `docs/security.md` + `docs/architecture-options.md` (no source) classifies `definition`.
- [ ] `documentation/` (alternate name) is also recognized.
- [ ] A file under a nested `docs/` subdirectory is not scanned.
- [ ] A non-document file (e.g. an `.svg`) under `docs/` does not count.
- [ ] An implemented project (real source + a `docs/` folder) still classifies `implemented`.
- [ ] Every pre-existing `project-maturity.test.js` test still passes.
- [ ] `npm test`, `node cli/bin/aief.js verify`, `git diff --check` all pass.
