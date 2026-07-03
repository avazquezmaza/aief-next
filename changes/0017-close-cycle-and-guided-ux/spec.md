# Specification

## Goal

The Change lifecycle closes naturally from the CLI without introducing hidden state, and every command guides the user to the next step with one consistent voice.

## Requirements

- `aief close` (no flags): prints a readiness report — missing/empty files, unchecked tasks count, placeholder evidence — and the next step. Writes nothing.
- `aief close --yes`: marks the Change Closed (dated `## Status` section in change.md) only if all checks pass; exits 1 otherwise. `--change <id>` selects a specific Change.
- Closed detection is CRLF-tolerant and derived exclusively from change.md.
- `latestChangeDir()` returns the latest open Change; `prompt`/`close` report "No open Change found" when none exist.
- `verify`: `○ <change> — in progress` for open Changes with pending evidence; `! <change> is closed but evidence.md was never completed` for closed ones; `✓ <change> (closed)` for completed closed ones.
- One `printNext(...commands)` helper used by adopt, analyze, status, doctor, propose, new-change, prompt (error path) and close.
- README: integrations section moved after the core flow; guarantees updated for close semantics.
- ADR-009 documents the rejected state-file recommendation.

## Acceptance Criteria

- [ ] `close` on a fresh Change reports pending evidence and unchecked tasks; `close --yes` refuses with exit 1.
- [ ] `close --yes` on a ready Change writes `## Status / Closed (date)`; verify shows `(closed)`; `prompt` moves on.
- [ ] Fresh-change verify output contains `○ … in progress` and no `✗`.
- [ ] All suite tests pass; `aief verify` at repo root passes.
- [ ] Evidence updated.
