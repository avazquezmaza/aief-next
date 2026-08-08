# Tasks

## Implementation

- [x] `cli/src/core/domain/junit-report.js`: `parseJUnitReport(content)`.
- [x] Same or a sibling module: `replaceOrAppendEvidenceSection(evidenceMd, heading,
      ownMarkerPrefix, newBody)`.
- [x] `close(args)`: parse `--evidence-from`, resolve/read/parse the report, build the Verification
      body, write evidence.md (only if changed), reload `change`, print confirmation — before the
      existing `problems`/readiness logic.

## Tests

- [x] Unit tests for `parseJUnitReport()`: single suite, multiple suites (summed), no `<testsuite>`
      found, malformed numeric attributes.
- [x] Unit tests for `replaceOrAppendEvidenceSection()`: placeholder replace, own-marker replace
      (idempotent), human-content append (untouched above), missing-heading append.
- [x] CLI tests: valid report fills in Verification and close proceeds; missing/unreadable/
      no-`<testsuite>` path exits 1, no write; re-running updates without duplicating; `aief close`
      without the flag is byte-identical to before.

## Verification

- [x] `npm test` (root) passes.
- [x] `node cli/bin/aief.js verify` at repo root passes.
- [x] `node cli/bin/aief.js verify --change 0071-evidence-capture-from-junit-report` passes.
- [x] `git diff --check` passes.

## Evidence

- [x] Update evidence.md
