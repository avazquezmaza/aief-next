# Change

## ID

`0116-jira-provider-malformed-json-handling`

## Type

General

## Objective

`retrieve()` in `cli/src/requirement-providers/jira.js` calls `JSON.parse()` on a local Jira export
with no `try`/`catch`. A malformed or truncated export file crashes `aief enrich jira <id>` with an
uncaught `SyntaxError` and a raw stack trace, instead of the clean, structured
`{ requirement, retrieved, openQuestions, riskNotes, consoleNotes }` response every other error path
in this same function already returns (path-outside-project-root, file-not-found).

## Scope

### In scope

- Wrap the `JSON.parse(fs.readFileSync(filePath, "utf8"))` call in `jira.js`'s `retrieve()` in
  `try`/`catch`.
- On parse failure, return the same placeholder-Change shape the two existing error branches use
  (`emptyRequirement`, `retrieved: false`, populated `openQuestions`/`riskNotes`/`consoleNotes`)
  instead of throwing.
- Test coverage: a malformed JSON export produces a clean placeholder response, not a crash.

### Out of scope

- Any other requirement provider (`manual.js`, etc.) — only `jira.js` reads/parses a file this way.
- Validating the *shape* of a syntactically-valid-but-semantically-wrong Jira export (e.g. missing
  expected fields) — `normalizeJira()`'s existing tolerance for missing fields is unchanged.

## Success Criteria

- `aief enrich jira <id> --file <malformed.json>` exits cleanly with a placeholder Change and a
  readable error note — no uncaught exception, no stack trace.
- `npm test`, `node cli/bin/aief.js verify --strict`, and `git diff --check` all pass.
