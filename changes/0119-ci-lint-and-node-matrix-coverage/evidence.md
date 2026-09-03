# Evidence

## Summary

CI now runs ESLint (`eslint:recommended`, flat config) over `cli/src`/`cli/bin` before the test
steps, and tests against Node `[18, 20, 22]` instead of just the two matrix endpoints `[18, 22]`.
Both gaps found during an independent audit review. Running lint against the current tree surfaced
21 real, pre-existing violations — fixed here to give CI a clean starting baseline, several of them
genuine (if minor) bugs rather than pure style issues.

## Activities Performed

- Added `eslint` (v10.9.1) and `@eslint/js` as `cli/` `devDependencies`.
- `cli/eslint.config.js`: `js.configs.recommended`, Node globals (`console`, `process`, `Buffer`,
  etc.), `no-unused-vars` configured with an `^_`-prefix escape hatch for intentionally-unused
  args/catch bindings (this codebase's existing convention).
- `cli/package.json` gains `"lint": "eslint src bin"`; root `package.json` gains `"lint": "npm
  --prefix cli run lint"`, mirroring the existing `test` delegation.
- `.github/workflows/ci.yml`: new `Lint` step (`npm run lint`, `working-directory: cli`) before the
  `CLI tests` step; `node-version` matrix widened from `[18, 22]` to `[18, 20, 22]`.
- Fixed the 21 violations `eslint:recommended` found on the existing tree:
  - **Duplicate object keys** in `hook-service.js`, `skill-service.js`, `verification-service.js`
    (9 total): each `baseResult()` intentionally re-asserted `hook`/`event`/`skill`/`version`/
    `rule`/`requirement`/`effects` *after* spreading `...overrides`, to guarantee those fields are
    never taken from a Hook/Skill/Rule's own return value (HK-R32/SK-R7/VR-R31). A duplicate key in
    an object literal is legal JS (last one wins) and this was intentional, but `no-dupe-keys`
    correctly flags it as fragile — refactored to spread `overrides` alone, then explicitly
    reassign those fields as separate statements after the literal. Same final object, same
    behavior, no longer relying on duplicate-key-shadowing to enforce it.
  - **Unnecessary regex escapes** (`verification-evidence.js`, 3 occurrences): `\-` inside a
    character class where `-` was already positioned so it needed no escaping.
  - **Dead initial assignments** (`no-useless-assignment`, 5 occurrences across `bootstrap.js`,
    `shared.js`, `project-maturity.js` x2, `detect.js`): a `let x = 0` (or `""`/`{}`) immediately
    followed by a `try { x = ... } catch { x = <same-or-different> }` where every path reassigns
    `x` before any read — the initializer was genuinely dead. Changed each to `let x;` (no
    initializer); behavior unchanged since the initializer was never observably used.
  - **Unused variables/imports** (4 occurrences): an unused `printNext` import in `bootstrap.js`;
    an unused `event` destructured parameter in `harness-service.js`'s `formatHookLogSection()`
    (renamed `event: _event` to keep documenting the caller's object shape without triggering the
    rule); a dead `artifactState()` function and an unused `files` destructured binding in
    `local.js` (both removed — `files` genuinely unused, `artifactState()` genuinely dead code with
    no callers).

## Verification

- `npm run lint` (root): exits 0 on the current tree.
- Manually verified (not committed) that a deliberately introduced unused variable in `detect.js`
  makes `npm run lint` exit non-zero with a clear error.
- `npm test`: 1043/1043 pass after every lint fix — zero behavior change (no new/changed tests
  needed; existing coverage already exercises every touched function).
- `node cli/bin/aief.js verify --strict --change 0119`: PASS.
- `git diff --check`: no whitespace errors.

## Findings

The duplicate-key pattern in `hook-service.js`/`skill-service.js`/`verification-service.js` worked
correctly (JS object literals resolve duplicate keys left-to-right, last wins) but was fragile:
reordering the keys, or a future edit adding a key between the spread and the reassignment, could
silently break the guarantee those comments describe. The refactor to explicit post-literal
assignment makes the enforcement mechanism itself checkable by a linter going forward, not just
correct by construction.

## Risks

None identified — every fix is either a pure dead-code removal or a behavior-preserving refactor,
confirmed by the full test suite passing unchanged.

## Recommendations

None — this closes out the 0114-audit-review Change backlog (0114–0119, formerly the "0116–0120"
plan, renumbered after 0114 absorbed the original High-severity fix).

## Artifacts Produced

- `cli/eslint.config.js` (new).
- Diff to `cli/package.json`, root `package.json`, `.github/workflows/ci.yml`.
- Diff to `cli/src/commands/bootstrap.js`, `shared.js`, `cli/src/core/domain/project-maturity.js`,
  `cli/src/core/services/harness-service.js`, `hook-service.js`, `skill-service.js`,
  `verification-evidence.js`, `verification-service.js`, `cli/src/detect.js`,
  `cli/src/sdd-providers/local.js`.

## Lessons Learned

Adding a linter to a codebase that never had one surfaces its own small backlog of findings —
budgeting time to fix them (not just add the tool with violations suppressed) is part of the same
Change, not a follow-up, or the new CI gate starts red on day one.

## Next Change

None queued — this was the last item in the audit-review backlog.
