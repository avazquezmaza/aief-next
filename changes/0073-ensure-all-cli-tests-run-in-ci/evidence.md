# Evidence

## Summary

Fixed Finding F4: `cli/tests/assistant-resolver.test.js` (17 tests) was omitted from `npm test`'s
hardcoded 39-file list and therefore never ran under CI. Replaced the hardcoded list with Node's
native `node --test` directory-based discovery, which picks up every `*.test.js` file under
`cli/tests/` automatically, closing the whole class of "file exists but isn't listed" bug rather
than only this one instance.

## Activities Performed

- Confirmed `cli/tests/` contains only `*.test.js` files (40 total), no fixtures or helper files
  that a discovery-based script could accidentally sweep in.
- Changed `cli/package.json`'s `test` script from an explicit 39-file list to `node --test`
  (Node's default recursive test-file discovery, run from `cli/`).
- Diagnosed and ruled out a false "hang": `node --test tests/` (with an explicit directory path
  argument) fails immediately with `MODULE_NOT_FOUND` because Node's test runner tries to
  `require()` the path as a module, not scan it as a directory. The correct invocation is bare
  `node --test` (no path argument) from `cli/`, which uses Node's default recursive test-file
  discovery. A separate, unrelated false alarm during diagnosis was `cli.test.js` appearing to
  "hang" under a short timeout — it does not hang; it is legitimately slow (213 tests, each
  spawning a real `aief` subprocess via `spawnSync`), taking ~187 seconds on this machine. This
  was confirmed by re-running with a longer timeout, which completed cleanly with 213/213 passing,
  and separately by confirming the *unmodified, original* hardcoded-list script exhibits the exact
  same apparent slowness up to the same test, proving it is pre-existing behavior of the test
  suite's own runtime cost, not something this Change introduced.

## Verification

- `cd cli && npm test` (new script): **816/816 tests pass, 0 failures**, across all 40 files
  (confirmed via `duration_ms: 188865` / `# tests 816` / `# pass 816` / `# fail 0` summary).
- Confirmed `assistant-resolver.test.js`'s 17 tests specifically appear in the run and all pass
  (verified by grepping the run's output for its known test names — 17 matches, all `ok`).
- `node cli/bin/aief.js verify` (repo root): `Result: PASS`.
- `git diff --check`: clean, no output, exit 0.
- `.github/workflows/ci.yml` requires no change — it already invokes `npm test` with
  `working-directory: cli`, so the fix applies transparently to CI.
- No file under `cli/tests/` other than the intended 40 `*.test.js` files was executed.

## Findings

None beyond the one this Change fixes. One process note recorded for future reference (not a
code finding): the full `npm test` run takes ~3.5 minutes end-to-end on this machine, dominated by
`cli.test.js`'s subprocess-spawning integration tests — anyone diagnosing a future "test hang"
should budget for this before assuming a real hang.

## Risks

None identified. This is a build-script-only change with no runtime code touched.

## Recommendations

None beyond this Change's own scope.

## Artifacts Produced

- `cli/package.json` (`test` script updated).

## Lessons Learned

Node's `--test` runner requires a bare invocation (no path argument) to use its default recursive
directory discovery; passing an explicit directory path is interpreted as a module to `require()`,
which fails. This distinction was not obvious from a first read of Node's own `--test` flag
description and cost significant diagnostic time before being isolated with a minimal
reproduction.

## Next Change

Proceed to the next approved remediation batch (Jira `--file` path containment, Finding F2).
