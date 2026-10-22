# Change

## ID

`0166-gemini-approval-guard`

## Type

Feature

## Objective

Implement ADR-042's first step: the approval guard (ADR-041) for Gemini CLI. The same
`aief-approval-guard.mjs` recognizes Gemini's edit tools, and `aief guardrails install
--assistant gemini` installs and registers it as a Gemini `BeforeTool` hook.

## Scope

### In scope

- `aief-approval-guard.mjs`: Gemini adapter (`write_file` → whole content; `replace` → `old_string`/
  `new_string`, `allow_multiple` = replace all); relative paths resolved against the project dir.
- Previous template hash added to `previous-versions.json`, so unmodified 0162 copies classify as
  an older AIEF version.
- `aief guardrails install --assistant <claude|gemini>`, default `claude` (unchanged behavior).
  For Gemini: copy the script to `.gemini/hooks/aief-approval-guard.mjs` and add one `BeforeTool`
  entry (matcher `write_file|replace`) to `.gemini/settings.json`, only adding, never rewriting.
- `aief doctor` reports the Gemini hook state when `.gemini/` exists.
- Tests, help text, `docs/cli.md`, `docs/security-model.md`.

### Out of scope

- Codex and Cursor guards (ADR-042: after a real installation is available).
- Gemini credential deny rules (ADR-042 D4: recorded gap).
- Shell-command bypass (documented limitation for every assistant).
- `aief update` refreshing hook scripts (not done for Claude either).

## Assumptions

- Gemini has no deny-rule guardrail, so `--assistant gemini` installs the hook without needing
  `--approval-hook` (accepted, redundant). `--local` is Claude-only and is refused for Gemini.
- Codex, Cursor and Kiro are refused with a message pointing to ADR-042.

## Depends on

- 0165-define-guardrail-parity-across-assistants

## Success Criteria

- The hook blocks a Gemini `write_file`/`replace` that checks, abandons or removes an unchecked
  `(human)`/`(review)` item, and allows everything else; Claude behavior unchanged.
- `aief guardrails install --assistant gemini` is idempotent and keeps every existing Gemini setting.
- `npm test`, `npm run lint`, `git diff --check`, `aief verify --strict` pass.
