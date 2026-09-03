# Specification

## Goal

A malformed Jira export file never crashes `aief enrich jira` — it produces the same clean
placeholder response shape every other error path in `jira.js`'s `retrieve()` already returns.

## Requirements

- `cli/src/requirement-providers/jira.js`: wrap the `JSON.parse(fs.readFileSync(filePath, "utf8"))`
  call in `try`/`catch`.
- On catch, return:
  `{ requirement: emptyRequirement("jira", sourceId), retrieved: false, openQuestions: [...], riskNotes: [...], consoleNotes: [...] }`
  — same shape as the path-outside-project-root and file-not-found branches, with messages naming
  the file and the parse error.
- No behavior change for a syntactically valid export (the `normalizeJira(raw, sourceId)` success
  path is untouched).

## Acceptance Criteria

- [ ] A file containing invalid JSON (e.g. `{ invalid`) at the resolved path returns
      `retrieved: false` with a populated `openQuestions`/`riskNotes`/`consoleNotes` — no thrown
      exception.
- [ ] A file containing valid JSON still returns `retrieved: true` with the normalized requirement
      (regression check — success path unaffected).
- [ ] `npm test`, `node cli/bin/aief.js verify --strict`, and `git diff --check` all pass.
