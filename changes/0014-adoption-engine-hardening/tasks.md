# Tasks

## Implementation

- [x] Create `cli/src/skills-catalog.json` (detectors + skills data).
- [x] Create `cli/src/detect.js` (detection engine with reasons).
- [x] Rewire `cli/src/cli.js` to use the catalog; remove hardcoded detectors.
- [x] Fix `adopt` Change ID collision.
- [x] Add OpenSpec runtime contract validation and noisy fallback in `propose`.
- [x] Expand `COMMAND_HELP` to all commands with six fields.
- [x] Make `prompt` Analysis detection CRLF-safe.
- [x] Make `release`/`writeFile` messages honest.
- [x] Add placeholder warning to `verify`.
- [x] Align `templates/change/evidence.md` with the standard evidence structure.

## Documentation

- [x] Add `knowledge/decisions.md`.
- [x] Document OpenSpec CLI contract in `adapters/openspec/README.md`.
- [x] Update `docs/cli.md` and `cli/README.md`.

## Verification

- [x] Add `cli/tests/` with `node --test`; add `test` script and `engines` to `cli/package.json`.
- [x] Run `npm test` in `cli/` (20/20 pass).
- [x] Run `aief verify` at repo root (PASS).
- [x] Run todo-app example tests (3/3 pass, regression clean).

## Evidence

- [x] Update evidence.md
