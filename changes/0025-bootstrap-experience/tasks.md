# Tasks

## Implementation

- [x] Inspect the repo; confirm the CLI already exists in `cli/` and reuse it (no new CLI structure).
- [x] Add root `package.json` with `bin.aief -> cli/bin/aief.js` (npm-link compatible).
- [x] Implement `--help`/`-h`/`--version`/`-v` in `main()`.
- [x] Rework `aief doctor` environment report: grouped levels (required/recommended/optional), versions, summary, non-zero exit only when required tools are missing.
- [x] Extract `runAdoption()` from `adopt` and implement `aief init` (no argument) for the current directory: detection report, visible structure only, OpenSpec/SpecBoot guidance, next steps.
- [x] Record the rejection of the `.aief/` layout (ADR-009 precedence) in change.md.

## Documentation

- [x] `docs/bootstrap.md` (new).
- [x] README "Get the CLI" + adopt section mention of `aief init`.
- [x] `docs/cli.md` (init row, --help/--version, root `npm test`).
- [x] `cli/README.md` install section.
- [x] CHANGELOG entry.

## Verification

- [x] `npm install` and `npm link` from the repo root.
- [x] `aief --help`, `aief --version`, `aief doctor` on the AIEF repo.
- [x] `aief init` in a clean temp directory with application code present (code untouched, no `.aief/`).
- [x] 7 new tests; full suite green (50 tests) from root and from `cli/`.

## Evidence

- [x] Update evidence.md
