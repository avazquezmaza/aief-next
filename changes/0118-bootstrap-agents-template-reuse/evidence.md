# Evidence

## Summary

`aief bootstrap <name>` now writes the canonical `AGENTS.md` template (`AGENTS_TEMPLATE`), the same
one `aief bootstrap` (no name, adopt-in-place) already uses — instead of a hardcoded two-line stub
that omitted the ~40 collaboration rules, the `(human)`/`(review)` gates, and the per-assistant
pointer. This is the exact class of gap Change 0040 fixed once for the adopt-in-place path,
reintroduced for the new-project-by-name path. Found by an independent audit review.

## Activities Performed

- `cli/src/commands/bootstrap.js`'s `initProject()`: replaced the inline
  `"# Project Agent Instructions\n\nAI assists. Humans decide.\n"` string with
  `fs.readFileSync(AGENTS_TEMPLATE, "utf8")`.
- `cli/tests/agents-canonical.test.js`: added two tests mirroring the existing no-name-path
  coverage for `bootstrap <name>` (byte-identical to canonical; contains 100% of
  `CANONICAL_RULES`). Also fixed a pre-existing test whose name claimed to compare "bootstrap with
  vs without a name" but actually ran `bootstrap` twice with no name — it now genuinely compares a
  named run's `AGENTS.md` to a no-name run's.

## Verification

- `npm test`: 1043/1043 pass (1041 before this Change; +2 new tests, zero regressions).
- `node cli/bin/aief.js verify --strict --change 0118`: PASS.
- `git diff --check`: no whitespace errors.

## Findings

- The pre-existing test "no adoption path produces a divergent AGENTS.md (bootstrap with vs
  without a name)" never actually exercised the named path — both calls omitted a name. Fixed as
  part of this Change's own verification (see Activities Performed); flagging here since it means
  this specific regression would previously have gone undetected by that test's name suggesting
  otherwise.

## Risks

None — `initProject()`'s skeleton (`README.md`, `changes/`, `knowledge/`, `src/`, `tests/`) is
unchanged; only the `AGENTS.md` content source changed, in the byte-identical direction the
no-name path already used.

## Recommendations

- `initProject()` still only writes skeleton + `AGENTS.md` — it does not run `createStandards()`,
  detect project maturity, or create a CI gate the way `runAdoption()` (no-name path) does. Whether
  `bootstrap <name>` should eventually converge fully with `runAdoption()` is a separate, larger
  decision (raised, not decided, here).

## Artifacts Produced

- Diff to `cli/src/commands/bootstrap.js`.
- Diff to `cli/tests/agents-canonical.test.js`.

## Lessons Learned

Two code paths documented as producing "the same AGENTS.md" need a test that actually compares
their outputs to each other and to the canonical source — a test that runs the same path twice
(as the pre-existing one did) verifies determinism, not parity between paths.

## Next Change

`0119-ci-lint-and-node-matrix` (add lint to CI, widen the Node version matrix).
