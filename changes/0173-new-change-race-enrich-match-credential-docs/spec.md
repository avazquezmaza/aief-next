# Specification

## Goal

`new-change` never reports a Change it did not create, `enrich` never mistakes a different Change
for its own, and the documentation states what the credential deny rules actually cover.

## Requirements

- R1 (B1): after the branch step, `createChange()` creates `changes/<id>-<slug>` with a
  non-recursive `mkdir`. If it already exists, it prints an error naming the directory and the
  likely cause (another `new-change` at the same time), sets exit code 1, writes nothing and
  returns `null`.
- R2 (B1): if any scaffold file is not written, `createChange()` reports it as an error instead of
  printing "Created Change".
- R3 (B3): `enrich` treats a Change as its own only when the basename without its numeric prefix
  equals the requirement slug exactly.
- R4 (S3): `docs/configuration.md` describes the deny rules as covering the listed paths for
  Claude Code's file tools, and says other credential files and shell commands are not covered.
- R5: `evidence.md` records the live guard test (commands, Claude Code version, outcome).
- R6 (D1): implement the outcome of decision D1 in `tasks.md`.

## Acceptance Criteria

- [x] R1–R3 implemented with tests: existing target directory → exit 1, nothing written, no
      "Created"; `enrich` next to a suffix-sharing Change creates its own; exact duplicate still
      detected.
- [x] R4–R6 done.
- [x] `npm test`, `npm run lint`, `git diff --check` and `aief verify --strict --change 0173` pass.
- [x] (human) Owner reviews the diff before merge.
