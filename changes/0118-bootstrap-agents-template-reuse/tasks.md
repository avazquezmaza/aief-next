# Tasks

## Implementation

- [x] `initProject()` (`cli/src/commands/bootstrap.js`) writes `AGENTS_TEMPLATE`'s content instead
      of the inline two-line stub.

## Documentation

- [x] None needed — no public-facing doc claimed the stub's content.

## Verification

- [x] `cli/tests/agents-canonical.test.js`: `bootstrap <name>` writes an `AGENTS.md`
      byte-identical to the canonical template, carries every canonical rule, and matches
      `bootstrap` with no name (fixed a previously-misleading test that compared two no-name runs
      to each other instead of a named run to the canonical).
- [x] `npm test` (full suite).
- [x] `node cli/bin/aief.js verify --strict`.
- [x] `git diff --check`.

## Evidence

- [x] Update evidence.md.
