# Evidence

## Summary

Hardened the Adoption Engine: fixed the `adopt` Change ID collision, moved technology detection into a data catalog with word-boundary matching and explained recommendations, added runtime validation of the OpenSpec contract with a loud fallback, completed `help <command>` coverage for all commands, made Analysis detection CRLF-safe, unified the evidence template, and added a 20-test CLI suite. No new dependencies; OpenSpec and Specboot remain optional.

## Activities Performed

- Created `cli/src/skills-catalog.json` (12 detectors, 7 skills; each detector declares id, description, signal strength, dependency/file/keyword sources).
- Created `cli/src/detect.js`: evaluates the catalog against a project root, returns signals with human-readable reasons; `recommendSkills` maps signals to skills with a "because" trail.
- Rewired `cli/src/cli.js`: removed hardcoded `detectProject`/`recommendedSkills`/`searchText`; `adopt` now uses `nextChangeId()`; `propose` validates OpenSpec (installed → version → `--help` scan for `propose`) before delegating; `COMMAND_HELP` covers 13 commands with purpose/when/reads/writes/example/next; `prompt` uses a CRLF-tolerant Analysis regex and validates `--profile`/`--change` types; `verify` warns on placeholder evidence; `release` and `writeFile` report honestly when files already exist; `getChangeDirs` tolerates dangling symlinks.
- Aligned `templates/change/evidence.md` with the standard 9-section structure (Summary, Activities Performed, Verification, Findings, Risks, Recommendations, Artifacts Produced, Lessons Learned, Next Change).
- Added `cli/tests/detect.test.js` (6 tests) and `cli/tests/cli.test.js` (14 tests), real `test` script and `engines: node >= 18`.
- Added `knowledge/decisions.md` (ADR-001..008) and updated `adapters/openspec/README.md`, `docs/cli.md`, `cli/README.md`.

## Verification

- `npm test` in `cli/`: 20/20 pass (Node 22, Linux).
- `examples/todo-app` `npm test`: 3/3 pass (regression clean).
- `node cli/bin/aief.js verify` at repo root: PASS (warnings for placeholder evidence in 0013, by design).
- End-to-end scenario in a sandbox project with `changes/0001-existing/`, application code in `src/`, and a README mentioning tenant/n8n/RBAC: `adopt` created `0002-adopt-aief` (no collision), did not touch `src/`, and every recommended skill printed its reason; `propose` without OpenSpec announced the local fallback explicitly.
- Confirmed the fixed false positive: a README containing only "maintainability and plain code" produces zero signals (previously triggered `aiRoadmap` via substring "ai").

## Findings

- The directory form `node --test tests/` fails on Node 22.22 in this environment; the test script lists the two test files explicitly for POSIX/Windows compatibility.
- The old evidence template (`templates/change/evidence.md`) and the CLI's built-in template had diverged; they now share one structure.
- OpenSpec delegation paths (missing binary, binary without `propose`, delegation exit != 0) are all covered by tests using simulated `openspec` executables.

## Risks

- The real OpenSpec CLI has not been validated against; the runtime `--help` scan is a heuristic. Documented as "not yet validated" in `adapters/openspec/README.md`.
- `verify` placeholder warnings are informational only; incomplete evidence still passes (kept non-fatal for backward compatibility; consider a `--strict` mode later).
- Windows-specific behavior (`shell: true` in `run()`) is unchanged and untested on a real Windows host.

## Recommendations

- Validate `aief propose` against a real OpenSpec release and record the version in the adapter contract table.
- Add a GitHub Actions workflow running both test suites and `aief verify`.
- Complete the pending evidence for Change 0013 (the architecture analysis exists in session output but was never captured).
- Consider `verify --strict` to fail on placeholder evidence.

## Artifacts Produced

- `cli/src/skills-catalog.json`, `cli/src/detect.js` (new)
- `cli/tests/detect.test.js`, `cli/tests/cli.test.js` (new)
- `knowledge/decisions.md` (new)
- `cli/src/cli.js`, `cli/package.json`, `templates/change/evidence.md`, `adapters/openspec/README.md`, `docs/cli.md`, `cli/README.md` (updated)

## Lessons Learned

- Substring keyword matching in adoption tooling is worse than no detection: it produces confident, wrong recommendations. Word boundaries plus explicit reasons make weak signals honest.
- Hardcoded IDs anywhere in a sequential-ID system will eventually collide; always derive from the same source of truth (`nextChangeId`).
- Silent fallbacks hide broken integrations; a one-line explicit message is cheap insurance.

## Next Change

`0015-ci-and-openspec-validation`: add a CI workflow (both test suites + verify) and validate the OpenSpec contract against a real release, updating the adapter table.
