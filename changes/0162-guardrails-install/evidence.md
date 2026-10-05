# Evidence

## Summary

`aief guardrails install` adds 23 Claude Code deny rules for credentials to a project's settings,
only ever adding. `--approval-hook` installs and registers a PreToolUse hook that refuses an edit
checking, abandoning or deleting a `(human)`/`(review)` item (ADR-041). `aief doctor` reports both.

## Activities Performed

1. Confirmed the formats against current Claude Code docs: `permissions.deny` rules such as
   `Read(./.env)`, lists merged across settings files
   ([settings](https://code.claude.com/docs/en/settings)); PreToolUse hooks receive `tool_input`
   (`file_path`, `old_string`/`new_string`, `content`, `edits`) and block with exit code 2
   ([hooks](https://code.claude.com/docs/en/hooks)).
2. Templates: `claude-deny.json`, `aief-approval-guard.mjs`, `previous-versions.json` (empty).
3. `core/domain/guardrails.js`, `core/services/guardrails-installer.js` (pure `mergeDeny`,
   `registerHook`), `commands/guardrails.js`; wired in `cli.js`, flags, help.
4. `aief doctor`: "Guardrails" section when `.claude/` exists.
5. Tests: `guardrails.test.js` (13), including the hook run as a process with real event payloads.
6. Docs (`cli.md`, `configuration.md`, `security-model.md`), ADR-041.

## Verification

| Check | Result |
|---|---|
| `npm test` in `cli/` | 743 pass, 0 fail (was 730) |
| `npm run lint` | clean |
| Copy of `THINGS/neto/.claude/settings.json` in the scratchpad (project untouched) | kept its 18 rules, added 5 (23), registered the hook; second run changed nothing; `doctor` 23/23 and hook registered |
| Hook as a process | blocks check, `[-]`, deletion via Write, MultiEdit, `spec.md`; allows ordinary edits, other files, other tools, malformed input |

Not verified: the hook inside a live Claude Code session (needs a restart of the tool in a real
project; left to the owner).

## Findings

| ID | Finding | Status |
|---|---|---|
| F1 | A blanket `Read(**/.env.*)` would also block `.env.example`; the template lists specific variants instead | Applied |
| F2 | The hook cannot see shell edits (`sed -i`) | Documented in ADR-041 and the security model |

## Risks

- A deny rule may block a file a project legitimately needs the assistant to read. The owner can
  delete it from the settings, but rerunning `aief guardrails install` adds it back, because the
  command cannot tell a deliberately removed rule from a missing one. A project that removes a rule
  should not rerun the command, or should re-delete it afterwards.

## Recommendations

- Try `aief guardrails install --approval-hook` in one project, restart Claude Code, and confirm the
  hook blocks a box check.

## Artifacts Produced

- Templates, code, tests, docs, ADR-041.

## Lessons Learned

- Claude Code merging list settings across files makes "only add, never remove" safe.

## Next Change

0163: private mode (`bootstrap --private`), then release 4.3.0.
