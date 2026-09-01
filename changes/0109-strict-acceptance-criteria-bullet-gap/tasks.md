# Tasks

## Implementation

- [x] `cli/src/core/services/change-verifier.js`: replaced the exact-string check
      `acceptanceCriteria === "- [ ]"` with `/^[-*+] \[ \]$/.test(acceptanceCriteria)`.

## Documentation

- [x] Inline comment explains the gap and cites Change 0075/0107 as the established precedent for
      this tolerance.

## Verification

- [x] Reproduced the gap before the fix: `aief verify --strict` on a Change with `* [ ]` as the
      only Acceptance Criteria line passed silently, while `- [ ]` correctly failed with
      "spec.md Acceptance Criteria is empty".
- [x] Added two regression tests (`*` and `+` bullets) in `cli/tests/verify-strict.test.js`.
- [x] Re-ran the manual reproduction after the fix: `* [ ]` now correctly fails the same way.
- [x] `npm test` (repo root) — 1019/1019 passing.
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] Confirmed the existing `- [ ]` and filled-in-content tests still pass unchanged.

## Evidence

- [x] Update evidence.md
