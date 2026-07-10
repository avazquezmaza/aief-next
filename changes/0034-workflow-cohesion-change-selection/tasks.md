# Tasks

## Implementation

- [x] Add `matchChanges(selector, dirs)` to `cli/src/core/domain/change.js` (deterministic tiers: exact name → numeric id → substring).
- [x] Add `verifyChange(change, cwd)` and factor `addChangeLines()` in `core/services/change-verifier.js`; change the whole-project multi-open "Next:" hint to require explicit selection.
- [x] Add `openChangeDirs()`, `resolveExplicitChange()`, `resolveImplicitChange()` shared helpers to `cli.js`.
- [x] Rewire `prompt`, `close`, `propose --change`, `verify` (with `--change` mode) and `status` onto the shared resolver.
- [x] Update next-step hints in `new-change`, `analyze`, `enrich`, and the adoption tasks note to name the target Change.
- [x] Update `COMMAND_HELP` (status/prompt/verify/close) and the usage banner for `--change`.

## Documentation

- [x] Update `docs/cli.md`, `docs/Workflow.md`, `README.md` to the explicit-selection model (drop "latest open is automatically active").

## Verification

- [x] Add `cli/tests/change-selection.test.js` (matchChanges unit tests + the 12 required CLI scenarios + status listing) and register it in `cli/package.json`.
- [x] Update the two existing `prompt` tests that relied on implicit multi-open selection to pass `--change` explicitly.
- [x] Root `npm test` green (93/93).
- [x] CLI `npm test` green (93/93).
- [x] Example tests green (examples/todo-app: 3/3).
- [x] `node cli/bin/aief.js verify` PASS.
- [x] Backward compatibility confirmed (scenario 12; existing Change dirs unaffected).

## Evidence

- [x] Update evidence.md
