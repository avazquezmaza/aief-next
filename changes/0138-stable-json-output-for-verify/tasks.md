# Tasks

## Implementation

- [x] `result-envelope.js`: `buildResultEnvelope()` (R1).
- [x] Wire `--json` into `verify.js`'s whole-project path (R2).
- [x] Wire `--json` into `verify.js`'s `--change` path, including the not-found case (R3, R4).
- [x] Confirm `--strict`/`--requirements`/Hooks/Loop are all skipped when `--json` is set (R5).
- [x] Add `json` to `verify`'s known flags in `shared.js`.

## Documentation

- [x] `docs/cli.md`'s reference table documents both envelope shapes.

## Verification

- [x] Found and fixed a real bug while testing manually: the not-found `--change` JSON error
      used `console.error` instead of `console.log`, sending the envelope to stderr instead of
      stdout — caught by manually piping stdout/stderr separately before writing any test.
- [x] New `cli-verify-json.test.js`: stdout-purity tests for every case (whole-project PASS/FAIL,
      a real duplicate-ID collision, `--change` PASS, `--change` not-found, and the
      without-`--json` regression test) — using a dedicated stdout/stderr-split helper, since
      the shared `aief()` test helper merges the two streams.
- [x] Run `npm test` (1110/1110), `npm run lint`, `git diff --check`.
- [x] Run `node cli/bin/aief.js verify --change 0138-stable-json-output-for-verify --strict`.

## Evidence

- [x] Update evidence.md
