# Specification

## Goal

`aief close --evidence-from <path>` turns "manually copy test numbers into evidence.md" into one
flag, without AIEF ever executing a test, a command, or reaching the network, and without ever
silently destroying human-written evidence content.

## Requirements

- New pure function `parseJUnitReport(content)` (e.g. `cli/src/core/domain/junit-report.js`):
  - Finds every `<testsuite ...>` element via a fixed regex (`/<testsuite\b([^>]*)>/gi`), extracts
    `name`/`tests`/`failures`/`errors`/`skipped`/`time` attributes from each via a fixed regex
    (`/(\w[\w:-]*)="([^"]*)"/g`), coercing numeric attributes with `Number(...) || 0`.
  - Returns `null` if no `<testsuite>` element is found (caller reports this as an error).
  - Otherwise returns `{ suiteCount, suiteNames, tests, failures, errors, skipped, time, passed }`
    — sums across every suite found; `passed = tests - failures - errors - skipped` (never
    negative — clamp at 0 if a malformed report reports otherwise).
- New pure function(s) in `cli/src/core/domain/evidence-sections.js` to read/replace a named `##`
  section's body in an evidence.md string, without touching any other section:
  - `replaceOrAppendEvidenceSection(evidenceMd, heading, ownMarkerPrefix, newBody)`: the capture
    always lands as its own `### Captured Test Report` sub-block (uniform shape, so "is this
    already my own capture" is one check regardless of what else is in the section — an earlier
    design that special-cased the placeholder to skip the sub-heading broke idempotency the moment
    the section had prior human prose; caught by testing before shipping, see evidence.md).
    - Section body is exactly `"Pending."` → the sub-block becomes the whole body.
    - Section body already contains a `### Captured Test Report` sub-block whose own content
      starts with `ownMarkerPrefix` (a previous capture) → that exact sub-block is replaced in
      place, wherever it sits in the section — idempotent on repeat, regardless of what precedes
      it (a placeholder or real human prose).
    - Any other existing body (human/assistant prose, no prior capture) → left exactly as is; the
      sub-block is appended below it.
    - `##`-level heading not found at all (a non-standard evidence.md) → a new `## <heading>`
      section (with the sub-block as its body) is appended at the end of the file.
  - Implemented via string indices, not a single regex with a "next heading or end of string"
    lookahead — `(?=\n## |$)` under the `/m` flag needed for `^` to find the heading also makes
    `$` match at *every* line ending, silently truncating a multi-line body when the section is
    last in the file. Caught by testing that exact case before writing any caller code.
- `close(args)` (`cli.js`): parse `--evidence-from <path>` (`parsedEvidenceFrom`, a string). When
  present, before computing `problems`:
  - Resolve `path.resolve(process.cwd(), parsedEvidenceFrom)`; if it doesn't exist or isn't
    readable, print a clear error and `process.exitCode = 1; return` — no write, no further
    processing.
  - Read the file, call `parseJUnitReport()`; if `null`, print a clear error naming the supported
    format and `process.exitCode = 1; return`.
  - Build the captured `## Verification` body text (own marker: `` "Captured from `" ``, so a
    literal path always starts the body — see rendered format below).
  - Read `evidence.md`, call `replaceOrAppendEvidenceSection(...)`, write the result only if it
    differs from the current content (never rewrite a file with identical bytes).
  - Print a one-line confirmation (`Captured N test(s) (F failed) from <path> into
    <changeName>/evidence.md's Verification section.`).
  - Reload `change` (the write may have changed `evidenceState`) before computing `problems`, so
    the rest of `close()`'s existing logic sees the update.
- No other line of `close()`'s existing logic changes. Without `--evidence-from`, `close()`'s
  behavior and output are byte-identical to before this Change.

## Rendered Verification body format

```
Captured from `<path>` (JUnit XML, <suiteCount> suite(s)) — not executed by AIEF.

- Tests: <tests>
- Passed: <passed>
- Failed: <failures>
- Errors: <errors>
- Skipped: <skipped>
- Duration: <time>s
```

## Acceptance Criteria

- [x] `parseJUnitReport()`: single `<testsuite>`, multiple `<testsuite>` (summed), no `<testsuite>`
      (returns `null`), malformed/missing numeric attributes (defaults to 0, never throws/NaN).
- [x] `replaceOrAppendEvidenceSection()`: placeholder → sub-block becomes the whole body;
      human-written content (no prior capture) → sub-block appended below it, untouched above;
      **re-capture after a placeholder-derived capture** → sub-block replaced in place, no
      duplicate; **re-capture after a human-prose-then-appended capture** → sub-block replaced in
      place, human prose still untouched, no duplicate (the case an earlier design broke — see
      evidence.md); missing `##` heading → appended as a new section.
- [x] `aief close --evidence-from <path>` (valid JUnit XML) fills in `## Verification`, prints the
      confirmation line, and proceeds with the normal readiness report.
- [x] `aief close --evidence-from <path>` (missing file / unreadable / no `<testsuite>`) exits 1
      with a clear message, writes nothing.
- [x] Running it twice with an updated report updates the numbers without duplicating the section,
      in both the placeholder-origin and human-prose-origin cases.
- [x] `aief close` without `--evidence-from` is byte-identical to before this Change.
- [x] `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass.
