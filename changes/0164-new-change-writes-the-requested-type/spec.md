# Specification

## Goal

The `## Type` that `aief new-change --type` writes is the type the user asked for, from the closed
list `normalizeChangeType()` already defines.

## Requirements

- R1: `new-change` normalizes `--type` with `normalizeChangeType()` before choosing the branch
  prefix and the scaffold. Without `--type` the type is `general`, as today.
- R2: The generic scaffold's `## Type` is the normalized type, capitalized (`General`, `Fix`,
  `Feature`, `Documentation`). `analysis` and `definition` keep their own scaffolds.
- R3: An unrecognized `--type` (or an empty one) exits 1 with the list of valid types, before any
  branch switch or file write.
- R4: `--type enrichment` exits 1 before any branch switch or file write and points to
  `aief enrich --file <source>`.
- R5: Tests cover R1–R4; `docs/cli.md` documents `--type`.

## Acceptance Criteria

- [x] R1–R5 implemented with tests.
- [x] `npm test`, `npm run lint`, `git diff --check`, `aief verify --strict` pass.
- [x] (human) Owner reviews the diff before merge.
