# Tasks

## Implementation

- [x] Wrap `JSON.parse(fs.readFileSync(filePath, "utf8"))` in `try`/`catch` in `jira.js`'s
      `retrieve()`.
- [x] On catch, return the same placeholder-Change shape the other two error branches use.

## Documentation

- [x] None needed — internal error-handling behavior, no public-facing doc claimed the crash.

## Verification

- [x] `cli/tests/requirement-providers.test.js`: malformed JSON via `--file` is a clean placeholder,
      not a crash.
- [x] `npm test` (full suite).
- [x] `node cli/bin/aief.js verify --strict`.
- [x] `git diff --check`.

## Evidence

- [x] Update evidence.md.
