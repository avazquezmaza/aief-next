# Evidence

## Summary

Resolved documentation drift across repository README files:
1. Updated root `README.md` to specify Node.js >= 22 (aligning with `package.json`, `cli/package.json`, CI, and Change 0126).
2. Updated `cli/README.md` to replace references to the obsolete `aief adopt` command with `aief bootstrap` (replacing the legacy command introduced in AIEF 3.1, Change 0052).

## Activities Performed

- `README.md`: updated `Requires Node.js >= 18` to `Requires Node.js >= 22`.
- `cli/README.md`:
  - Updated overview text from `(context: doctor/adopt/analyze/prompt)` to `(context: doctor/bootstrap/analyze/prompt)`.
  - Updated existing project flow and command group examples from `aief adopt` to `aief bootstrap`.
  - Updated section title `### Adoption` to `### Bootstrap`.
  - Updated Skills and standards descriptions to reference `aief bootstrap`.
  - Updated test suite description to reference `bootstrap idempotence`.

## Verification

- `grep -in "node.*18" README.md`: 0 matches.
- `grep -in "aief adopt" cli/README.md`: 0 matches.
- Automated link integrity check across all repository README files: all links resolve successfully.
- `npm test`: 1126/1126 tests passed.
- `npm run lint`: passed with 0 errors.
- `node cli/bin/aief.js verify --change 0142-fix-readme-drift-and-node-version --strict`: PASS.
- `git diff --check`: clean.

## Findings

- `README.md` was missed during Change 0126 when `cli/README.md` and `examples/todo-app/README.md` were bumped to Node >= 22.
- `cli/README.md` preserved references to `aief adopt` despite the CLI throwing an error directing users to `aief bootstrap`.

## Risks

- None. Documentation updates only.

## Recommendations

- Periodically run doc validation scripts to check CLI command mentions against `aief help` vocabulary.

## Artifacts Produced

- `README.md`
- `cli/README.md`
- `changes/0142-fix-readme-drift-and-node-version/` (`change.md`, `spec.md`, `tasks.md`, `evidence.md`)

## Lessons Learned

- Housekeeping changes that update version prerequisites or rename CLI entry points should check all `README.md` occurrences across root and subpackages in a single coordinated change.

## Next Change

- None required immediately; project is in clean and verified state.
