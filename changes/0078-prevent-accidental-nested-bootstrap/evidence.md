# Evidence

## Summary

Fixed the nested-bootstrap finding: `aief bootstrap` from a subdirectory of an already-
bootstrapped AIEF project silently created a second, independent governance structure. Added a
lightweight ancestor-detection guard local to `bootstrapHere()`'s own pre-flight check — not a
general project-root-discovery redesign for any other command — with an explicit `--force`
override. Updated `docs/getting-started.md`'s Change-0076 sentence to describe the guard's actual
behavior.

## Activities Performed

- Wrote 6 new regression tests in `cli/tests/cli.test.js` first, covering every acceptance
  criterion: root bootstrap (unchanged), fresh-directory bootstrap (unchanged), nested-subdirectory
  bootstrap (now refuses), `--force` override (proceeds), idempotent re-bootstrap (unaffected by
  the guard), and `bootstrap <name>` from inside an already-bootstrapped project (unaffected).
- Confirmed 2 of the 6 correctly failed against the unmodified code: the refuse-case (bootstrap
  currently succeeds where it should now refuse) and the `--force` case (currently rejected as an
  unknown flag by Batch 5's strict parser, since `--force` didn't exist yet).
- Added `findAncestorAiefProject()`, walking upward from `process.cwd()` (never including itself)
  checking for `AGENTS.md` + `changes/` coexisting, to the filesystem root.
- Wired the check into `bootstrapHere()`: fires only when the current directory does NOT already
  have both markers itself (so idempotent re-runs are untouched), refusing with exit 1, zero
  writes, and a message naming the ancestor's path, unless `opts.force === true`.
- Added `--force` to `bootstrap`'s `KNOWN_FLAGS` entry (Batch 5's schema) and threaded it through
  `bootstrap()` → `initProject()` → `bootstrapHere()`'s existing `opts` plumbing — no change needed
  to `initProject`'s named-project branch, which never reads `opts` at all.
- Updated `docs/getting-started.md`'s sentence (added by Change 0076) from describing "no guard
  exists yet" to describing the guard's actual new behavior, including the `--force` override.
- Ran the focused test file: 227/227 pass. Ran the full suite: 840/840 pass.

## Verification

- `node --test tests/cli.test.js`: **227/227 pass** (0 failures) — 221 pre-existing + 6 new.
- `npm test` (full suite): **840/840 pass** (0 failures) — 834 from Change 0077's baseline + 6 new.
- `node cli/bin/aief.js verify` (repo root): `Result: PASS`.
- `git diff --check`: clean.
- Manual smoke test (outside the test suite, disposable sandbox): confirmed the exact refuse
  message and `--force` override both behave as designed.
- `git diff --stat`: exactly the three intended files changed (`cli/src/cli.js`,
  `cli/tests/cli.test.js`, `docs/getting-started.md`).
- Adversarial check (monorepo scenario): the guard only fires when an ANCESTOR directory already
  has both AIEF markers — it does not affect independent, sibling bootstraps under a
  non-AIEF-governed root (e.g. `packages/a/`, `packages/b/` each bootstrapped on their own, with
  no AIEF-governed parent above them), which remains entirely unaffected. The one case genuinely
  blocked is exactly the accidental one the audit reproduced, and it remains explicitly reachable
  via `--force` for anyone who wants it deliberately.

### Behavior before / after

| Scenario | Before | After |
|---|---|---|
| `aief bootstrap` at the real project root | Succeeds | Unchanged |
| `aief bootstrap` in a fresh, unrelated directory | Succeeds | Unchanged |
| `aief bootstrap` in a subdirectory of an already-bootstrapped project | Succeeds, silently creates a nested duplicate structure | Exit 1, zero writes, names the ancestor's path |
| `aief bootstrap --force` in that same subdirectory | n/a (flag didn't exist) | Succeeds, creates the nested structure — explicit, deliberate |
| `aief bootstrap` re-run in an already-bootstrapped directory | "already exists" idempotency message | Unchanged |
| `aief bootstrap <name>` from inside an already-bootstrapped project | Creates the new project at `<name>` | Unchanged |

## Findings

None beyond the fixed finding.

## Risks

Low. The guard is narrowly scoped to `bootstrap`'s own pre-flight check and does not alter how
any other command resolves its working directory, per this Change's own explicit non-goal.

## Recommendations

None beyond this Change's own scope.

## Artifacts Produced

- `cli/src/cli.js` (`findAncestorAiefProject()` added, `bootstrapHere()` guarded, `--force` added
  to `KNOWN_FLAGS` and threaded through).
- `cli/tests/cli.test.js` (6 new regression tests).
- `docs/getting-started.md` (Change-0076 sentence updated).

## Lessons Learned

This closes the last of the six approved remediation batches. Every batch in this program
followed the same pattern successfully: write failing regression tests against the real,
unmodified bug first, confirm the failure is for the right reason, implement the smallest correct
fix, then re-verify against the full suite before closing.

## Next Change

None — this is the final approved remediation batch in this program.
