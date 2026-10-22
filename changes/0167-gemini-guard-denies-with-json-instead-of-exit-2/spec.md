# Specification

## Goal

The approval guard blocks a Gemini edit the way Gemini CLI expects an intentional block, so users
do not see it as a broken hook.

## Requirements

- R1: When the hook blocks an event whose `tool_name` is `write_file` or `replace`, it writes one
  JSON object `{"decision": "deny", "reason": <the same message as today>}` to stdout, nothing to
  stdout before it, and exits 0.
- R2: Claude Code events (`Write`, `Edit`, `MultiEdit`) keep exit 2 with the message on stderr.
- R3: Allowed events of either assistant keep exit 0 with empty stdout.
- R4: The 0166 template's sha256 is listed in `cli/templates/guardrails/previous-versions.json`, so
  an unmodified 0166 copy is refreshed by `aief guardrails install --assistant gemini`.
- R5: Tests cover R1–R4; a real Gemini CLI run shows the denial without a hook-failure warning.

## Acceptance Criteria

- [x] R1–R5 implemented with tests.
- [x] `npm test`, `npm run lint`, `git diff --check`, `aief verify --strict` pass.
- [x] (human) Owner reviews the diff before merge.
