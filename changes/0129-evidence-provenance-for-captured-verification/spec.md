# Specification

## Goal

A captured JUnit verification in `evidence.md` carries machine-verifiable provenance (source
digest, git commit, capture time, producer, verification type) alongside its existing
human-readable summary, without a second store and without changing the pre-0129 output shape
for a caller that doesn't ask for it.

## Requirements

- R1: `evidence-provenance.js` exports `sha256Of(content)` (hex digest, `node:crypto`, no new
  dependency), `gitCommitAt(cwd)` (full HEAD sha, or `null` — never throws, never fabricated,
  when not inside a git work tree or before the first commit), `buildProvenance(sourcePath,
  sourceContent, producer, verificationType, cwd)` (assembles the full record), and
  `renderProvenance(record)` (fixed-label Markdown bullet list, one label per line, so any
  field is extractable with a single fixed regex — the same discipline `junit-report.js`
  already applies to XML extraction).
- R2: `sourceContent` in `buildProvenance()` is hashed exactly as passed by the caller — the
  caller must pass the same string it parsed, never a fresh re-read of the file (avoids a
  window between what was hashed and what was actually parsed/acted on).
- R3: `junit-report.js`'s `renderCapturedVerification(reportPath, report, provenance?)`: the
  third argument is optional; omitting it (or passing `undefined`) reproduces the exact
  pre-0129 return value. Passing a provenance record appends `renderProvenance()`'s output
  after the existing count list, separated by a blank line.
- R4: `close.js`'s `--evidence-from` handler calls `buildProvenance()` with the report path,
  the exact `reportContent` string already read for parsing, `"aief close --evidence-from"` as
  producer, and `"junit-xml"` as verification type — then passes the result into
  `renderCapturedVerification()`.
- R5: The producer string includes the running CLI's own version (read from `cli/package.json`,
  the same value `aief --version` reports), so a captured record names which AIEF build
  produced it.

## Acceptance Criteria

- [ ] `buildProvenance()` inside a real git repository returns the actual `git rev-parse HEAD`
      value for `gitCommit`.
- [ ] `buildProvenance()` outside a git repository (or before the first commit) returns
      `gitCommit: null`, never a thrown error or a fabricated value.
- [ ] `renderCapturedVerification(path, report)` (two arguments) is byte-identical, before and
      after this Change, to what it returned before Change 0129 (regression test).
- [ ] `renderCapturedVerification(path, report, provenance)` appends a `**Provenance:**` block
      naming Source, SHA-256, Git commit, Captured at, Producer, and Verification type.
- [ ] A real `aief close --evidence-from <path>` run's resulting `evidence.md` contains a
      `sha256:` digest and, run inside a real git repo, the real HEAD commit sha.
- [ ] `npm test`, `npm run lint`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0129-evidence-provenance-for-captured-verification --strict`
      all pass.
