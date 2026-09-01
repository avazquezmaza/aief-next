# Tasks

## Implementation

- [x] `jira.js` — repoint 3 references (1 comment, 2 user-facing messages).
- [x] `enrich.js` — repoint 1 user-facing `console.error()`.
- [x] `change-verifier.js` — repoint 1 code comment.
- [x] `bootstrap.js` — repoint 1 code comment.

## Documentation

- [x] No doc edits needed — target docs (`docs/configuration.md`, `docs/workflow.md`) already
      contain the relevant content; only the pointers in code were wrong.

## Verification

- [x] Re-ran the dangling-reference scan (`docs/<name>.md` in `cli/src/**` vs files on disk) —
      zero missing targets.
- [x] `npm test` — 1009/1009 passing (no behavior change, no new tests needed).
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.

## Evidence

- [x] Update evidence.md
