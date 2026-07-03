# Tasks

## Implementation

- [x] Critical analysis of the 5 Gemini recommendations (4 accepted, 1 rejected with rationale).
- [x] `isClosed()` + `markClosed()` + latest-open `latestChangeDir()` in `cli/src/cli.js`.
- [x] Rewrite `close`: readiness checks, `--yes`, `--change`, honest refusal.
- [x] `verify` tone: `○ in progress` for open Changes, real warning only for closed-but-incomplete.
- [x] `printNext()` helper; replaced ad-hoc hints in adopt, analyze, status, doctor, propose, new-change, prompt.
- [x] Update `COMMAND_HELP.close` and general usage text.

## Documentation

- [x] README: move integrations after the core flow; update guarantees and commands; document close cycle.
- [x] `docs/cli.md` and `cli/README.md` aligned.
- [x] ADR-009 (no hidden state) in `knowledge/decisions.md`.
- [x] CHANGELOG: entries for 0016 and 0017.

## Verification

- [x] 3 new/updated tests (close refusal, close --yes lifecycle, verify tone); suite 24/24.
- [x] Dogfood: closed Changes 0013–0016 with `aief close --change <id> --yes`.
- [x] `aief verify` at repo root passes.

## Evidence

- [x] Update evidence.md
