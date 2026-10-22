# Change

## ID

`0167-gemini-guard-denies-with-json-instead-of-exit-2`

## Type

Fix

## Objective

Change 0166's real Gemini CLI 0.64.0 run showed that the approval guard's exit-2 block is reported
as a hook failure (`Hook execution for BeforeTool: 0 succeeded, 1 failed`, `[WARNING] Hook(s)
[aief-approval-guard] failed`), although the edit is blocked. Gemini's hook docs make exit 0 with
`{"decision": "deny", "reason": ...}` the preferred way to block on purpose. Use it for Gemini
events; keep Claude Code's exit 2.

## Scope

### In scope

- `aief-approval-guard.mjs`: for Gemini tool names (`write_file`, `replace`), print
  `{"decision":"deny","reason":<message>}` on stdout and exit 0 when blocking; nothing else changes.
- The 0166 template hash added to `previous-versions.json`.
- Tests; re-run against a real Gemini CLI.

### Out of scope

- Claude Code's block mechanism (exit 2 + stderr, unchanged).
- The stale `CLAUDE.md` fallback sentence in `docs/configuration.md` (separate documentation fix).
- Codex/Cursor (ADR-042).

## Depends on

- 0166-gemini-approval-guard

## Success Criteria

- A blocked Gemini edit is reported as a denial, not a hook failure, and the file is unchanged.
- Claude Code events behave exactly as before.
- `npm test`, `npm run lint`, `git diff --check`, `aief verify --strict` pass.

## Status

Closed (2026-10-22)
