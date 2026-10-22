# Specification

## Goal

Gemini CLI users get the same approval guard as Claude Code users (ADR-041, ADR-042), from the
same script.

## Requirements

- R1: The hook treats `tool_name` `write_file` like `Write` (`tool_input.content`) and `replace`
  like `Edit` (`old_string`, `new_string`; `allow_multiple: true` replaces every occurrence). It
  resolves a relative `file_path` against `GEMINI_PROJECT_DIR` (else `CLAUDE_PROJECT_DIR`, else the
  working directory), blocks with exit 2 and a reason on stderr, and keeps Claude's behavior.
- R2: The hash of the 0162 template is listed in `cli/templates/guardrails/previous-versions.json`.
- R3: `aief guardrails install --assistant gemini` writes `.gemini/hooks/aief-approval-guard.mjs`
  (shipped-file rule: never overwrite an edited copy) and adds to `.gemini/settings.json`
  `hooks.BeforeTool` one entry `{ matcher: "write_file|replace", hooks: [{ name:
  "aief-approval-guard", type: "command", command: "node \"$GEMINI_PROJECT_DIR/.gemini/hooks/
  aief-approval-guard.mjs\"" }] }` unless one is already registered. Every other setting is kept; an
  invalid settings file stops the install before writing.
- R4: `--assistant` defaults to `claude` (today's output and files unchanged). `--assistant gemini
  --local` and `--assistant codex|cursor|kiro|<unknown>` exit 1 before writing.
- R5: `aief doctor`, when `.gemini/` exists, reports the Gemini guard as installed and registered,
  missing, unregistered, or edited.
- R6: Help text, `docs/cli.md` and `docs/security-model.md` describe the Gemini guard and its
  trusted-folder condition.

## Acceptance Criteria

- [x] R1–R6 implemented with tests.
- [ ] `npm test`, `npm run lint`, `git diff --check`, `aief verify --strict` pass.
- [ ] (human) Owner reviews the diff before merge.
