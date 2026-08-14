# Specification

## Goal

`aief bootstrap` no longer silently creates a nested, duplicate AIEF structure inside an
already-bootstrapped project; it refuses explicitly unless the user opts in with `--force`.

## Requirements

- R1 — Before any write, `bootstrapHere()` checks ancestor directories (above `process.cwd()`,
  walking up to the filesystem root) for the coexistence of `AGENTS.md` and `changes/`.
- R2 — The check only triggers refusal when the *current* directory does NOT already have both
  markers itself — an ordinary re-run of `bootstrap` in an already-bootstrapped directory (the
  existing idempotency behavior) is entirely unaffected.
- R3 — On refusal: exit 1, zero files/directories created, message names the ancestor project's
  path and states `--force` as the explicit override.
- R4 — `--force` (new, `bootstrap`-only boolean flag) bypasses the check, proceeding exactly as
  `bootstrap` did before this Change.
- R5 — `aief bootstrap <name>` (new-project-elsewhere path) is entirely unaffected — the check
  only applies to the no-argument, current-directory path.
- R6 — No change to any other command's working-directory resolution.

## Acceptance Criteria

- [ ] `aief bootstrap` from the real project root → unchanged success.
- [ ] `aief bootstrap` from a directory with no AIEF ancestor at any depth → unchanged success.
- [ ] `aief bootstrap` from a subdirectory of an already-bootstrapped project → exit 1, zero
      writes, message names the ancestor path.
- [ ] `aief bootstrap --force` in that same subdirectory → succeeds, creates the nested structure
      (today's prior behavior, now opt-in).
- [ ] `aief bootstrap` re-run in an already-bootstrapped directory (idempotency case) → unchanged,
      still reports "already bootstrapped, nothing new to create" — the guard does not fire here.
- [ ] `aief bootstrap <name>` (new project elsewhere) → unchanged, unaffected by the guard.
- [ ] `docs/getting-started.md`'s Change-0076 sentence is updated to describe the guard's actual
      behavior instead of "no guard exists yet."
- [ ] `node cli/bin/aief.js verify` and `git diff --check` both pass.
