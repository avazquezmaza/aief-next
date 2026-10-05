# Specification

## Goal

A project can add credential deny rules and an approval guard to Claude Code with one command,
without risk to its existing settings.

## Requirements

- R1: `cli/templates/guardrails/claude-deny.json`: 23 rules (the 18 from `THINGS/neto` plus `~/.ssh`,
  `*.p12`, `*.pfx`, `id_rsa`, `id_ed25519`); `.env.example` stays readable.
- R2: `aief guardrails install` merges missing rules into `.claude/settings.json`
  (`settings.local.json` with `--local`); keeps every other key and rule; refuses an invalid file
  without writing.
- R3: `--approval-hook` installs `.claude/hooks/aief-approval-guard.mjs` (shipped-file rule: never
  overwrite an edited copy) and registers one PreToolUse entry for `Edit|Write|MultiEdit`.
- R4: The hook exits 2 when a `(human)`/`(review)` item in `changes/**/tasks.md` or `spec.md` goes
  from `[ ]` to `[x]`/`[-]` or disappears; exits 0 otherwise.
- R5: `aief doctor` reports rules present and hook state when `.claude/` exists.
- R6: Docs, help, security model, ADR-041.

## Acceptance Criteria

- [x] R1–R6 implemented with tests.
- [x] `npm test`, `npm run lint`, `aief verify --strict` pass.
- [x] (human) Owner reviews the diff before merge.
