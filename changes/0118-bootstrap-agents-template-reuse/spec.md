# Specification

## Goal

`aief bootstrap <name>` and `aief bootstrap` (no name) produce byte-identical `AGENTS.md` files,
both sourced from the one canonical template.

## Requirements

- `cli/src/commands/bootstrap.js`'s `initProject()`: replace
  `writeFile(path.join(projectPath, "AGENTS.md"), "# Project Agent Instructions\n\nAI assists. Humans decide.\n")`
  with `writeFile(path.join(projectPath, "AGENTS.md"), fs.readFileSync(AGENTS_TEMPLATE, "utf8"))`.
- No other change to `initProject()`'s skeleton (`README.md`, `changes/`, `knowledge/`, `src/`,
  `tests/` all unchanged).

## Acceptance Criteria

- [ ] `aief bootstrap my-project` writes `my-project/AGENTS.md` byte-identical to
      `cli/templates/agents/AGENTS.md`.
- [ ] `aief bootstrap my-project`'s `AGENTS.md` contains the same canonical rules
      `agents-canonical.test.js`'s `CANONICAL_RULES` already asserts for the no-name path (human/
      review gates, assistant-file pointer, etc.).
- [ ] Existing `bootstrap <name>` behavior (skeleton directories, "already exists" error,
      `--interactive`) is unaffected — regression check.
- [ ] `npm test`, `node cli/bin/aief.js verify --strict`, and `git diff --check` all pass.
