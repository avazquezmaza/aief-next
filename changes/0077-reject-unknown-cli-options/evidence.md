# Evidence

## Summary

Fixed Finding F7/H4: AIEF's hand-rolled `parseArgs()` silently accepted unknown/misspelled flags.
Migrated to `node:util.parseArgs()` with per-command explicit option schemas and `strict: true`,
via a shared `parseCommandArgs()`/`KNOWN_FLAGS` wrapper. Every one of the 10 command handlers that
parses flags now rejects an unrecognized option with exit 1 and a clear message, while every
previously-valid invocation continues to work identically. No new dependency.

## Activities Performed

- Wrote 8 new regression tests in `cli/tests/cli.test.js` first: the 5 confirmed unknown-flag
  cases from the audit (`verify --verboes`, `doctor --verbos`, `status --nex`,
  `new-change --typ enrichment`, `close --yess`), one additional case on a flag-free command
  (`analyze --bogus`), one "valid flags still work" sanity test, and one `--help`/`help`/
  `--version` unchanged test.
- Confirmed 6 of the 8 correctly failed against the unmodified parser (one test had its own bug —
  calling `status --next` before any Change existed — fixed before re-verifying; not a production
  bug).
- Added `parseCommandArgs(command, args, schema)`, wrapping `node:util.parseArgs()` with
  `strict: true` and `allowPositionals: true`, translating a thrown error into AIEF's existing
  `console.error` + `process.exitCode = 1` style, returning `null` on rejection.
- Added `KNOWN_FLAGS`, one entry per command, enumerated from the exact `parsed.<flag>` reads
  already present in each handler (no flag added, none removed, including `enrich`'s previously-
  implicit `--file`, which was never explicitly declared anywhere before this Change since it was
  forwarded generically to the provider layer).
- Migrated all 10 call sites (`new-change`, `enrich`, `analyze`, `prompt`, `close`, `verify`,
  `status`, `doctor`, `bootstrap`, `propose`), each with an `if (!parsed) return;` guard
  immediately after parsing, preserving each command's exact prior ordering relative to any
  output already printed before the parse call (e.g. `propose` still prints its banner before
  parsing, exactly as before — not "fixed" as an unrelated cleanup).
- Removed the old hand-rolled tokenizer entirely — nothing calls it anymore.
- Ran `cli.test.js` alone (the large, slow integration-test file): **221/221 pass**.
- Ran the full suite: **834/834 pass**.

## Verification

- `node --test tests/cli.test.js`: **221/221 pass** (0 failures) — 213 pre-existing + 8 new.
- `npm test` (full suite): **834/834 pass** (0 failures) — 826 from Change 0076's baseline + 8 new.
- `node cli/bin/aief.js verify` (repo root): `Result: PASS`.
- `git diff --check`: clean.
- Manual spot-check: `aief verify --verboes`, `aief status --nex` both produce
  `aief <command>: Unknown option '--<flag>'. ...` on stderr, exit 1.
- Manual spot-check: `aief --version` unchanged (`aief 3.1.0`).
- Compatibility check: grepped `.github/workflows/ci.yml` and
  `cli/templates/ci/aief-verify.yml` for any `aief` flag usage — both invoke `aief verify` with
  zero flags, entirely unaffected by this Change.
- `git diff --stat`: exactly the two intended files changed (`cli/src/cli.js`,
  `cli/tests/cli.test.js`).

### Behavior before / after

| Scenario | Before | After |
|---|---|---|
| `aief verify --verboes` | Exit 0, byte-identical to `aief verify` (flag silently ignored) | Exit 1, `Unknown option '--verboes'` |
| `aief doctor --verbos` | Exit 0, verbose mode never activated | Exit 1, same pattern |
| `aief status --nex` | Exit 0, `--next` behavior never activated | Exit 1, same pattern |
| `aief new-change --typ enrichment "x"` | Exit 0, Change created as type "General" (intended type silently dropped) | Exit 1, no Change created |
| `aief close --yess --change <id>` | Exit 0, silently behaved like a dry run (no `--yes`) | Exit 1, Change state unchanged |
| Every previously-valid flag/positional combination | Worked | Unchanged |
| `--help` / `help` / `--version` | n/a | Unchanged (dedicated test) |

This is an intentional, documented behavior change for every unknown-flag case (per this Change's
own `change.md`) — no known legitimate usage relied on unknown flags being silently ignored, since
that behavior was never documented or promised anywhere.

## Findings

None beyond the fixed finding.

## Risks

The main compatibility risk (per the remediation design phase's own analysis) is any external
script or automation that types a flag AIEF doesn't recognize and currently relies on it being
silently ignored. This repository's own CI/templates were checked and are unaffected. No other
consumer's scripts could be checked from within this repository.

## Recommendations

None beyond this Change's own scope.

## Artifacts Produced

- `cli/src/cli.js` (parser migrated).
- `cli/tests/cli.test.js` (8 new regression tests).

## Lessons Learned

Running the large `cli.test.js` file requires a multi-minute timeout (~200s observed
consistently across this entire remediation program) — every validation step in this Change
budgeted for that up front, avoiding the false "hang" diagnosis Change 0073 hit initially.

## Next Change

Proceed to the next approved remediation batch (nested bootstrap protection).
