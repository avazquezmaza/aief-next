# Specification

## Goal

`base-standards.md`, `testing-standards.md` and `security-standards.md` each read correctly at
two points in a project's life — before implementation exists (Definition) and after
(Implementation) — via one explicit two-section structure, with zero code changes and zero
backward-compatibility risk to already-adopted projects.

## Requirements

- Each of the three templates has, in order: `## Applies now` then
  `## Applies once implementation starts`.
- `## Applies now` content is governance-shaped: decision documentation and human approval,
  testability/acceptance criteria, trust boundaries, data classification, authn/authz and tenancy
  as explicit decisions — things a Definition Change can act on before any code exists.
- `## Applies once implementation starts` content is tooling-shaped: commands, coverage, linters,
  scanners, concrete authorization/secret handling — things that require code to exist.
- No bullet present in the previous version of these three files is dropped; each is relocated
  into the section it belongs to.
- The first line of each file remains `# Base Standards` / `# Testing Standards` /
  `# Security Standards` — `deriveResourceDescription()`'s heading-derived description is
  unaffected.
- No code path changes: `createStandards()`, `standardsForProject()`, `builtinStandardsList()`,
  `resolveStandardRecommendations()`, and `writeFile()`'s never-overwrite guarantee are all
  unmodified.

## Acceptance Criteria

- [ ] `base-standards.md`, `testing-standards.md`, `security-standards.md` each contain both
      sections, `## Applies now` before `## Applies once implementation starts`.
- [ ] `documentation-standards.md`, `frontend-standards.md`, `backend-standards.md` are unchanged
      (no `## Applies now` section, byte-identical to before this Change).
- [ ] A project with a pre-existing `knowledge/standards/base-standards.md` (or
      `security-standards.md`) keeps its own content unchanged after `aief bootstrap`.
- [ ] `npm test`, `node cli/bin/aief.js verify`, `git diff --check` all pass.
