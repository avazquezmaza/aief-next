# Evidence

## Summary

Definition of approval-guard parity across assistants. Capability matrix, options and a
recommendation are in `change.md`. The owner chose every Recommendation (D1–D5) on 2026-10-21;
transcribed into `Decision (human)` and recorded as ADR-042. No code was written.

## Activities Performed

1. **Gemini CLI 0.64.0 (verified locally).** Read the docs bundled with the installed CLI
   (`@google/gemini-cli/bundle/docs/`), which match the installed version:
   - `hooks/index.md`, `hooks/reference.md`: `BeforeTool` fires before a tool; input `tool_name`,
     `tool_input`; exit 2 blocks with stderr as the reason ("The turn continues"), or exit 0 with
     `{"decision": "deny", "reason": ...}`. Config in `.gemini/settings.json` under `hooks`;
     `$GEMINI_PROJECT_DIR` available; example matcher `write_file|replace`.
   - `tools/file-system.md`: `write_file` (`file_path`, `content`); `replace` (`file_path`,
     `instruction`, `old_string`, `new_string`, `allow_multiple`).
   - `hooks/best-practices.md`: project hooks are "Untrusted by default"; a hook whose `command`
     changes is treated as new and warned again.
   - `reference/policy-engine.md`: "The **Workspace** tier (project-level policies) is currently
     non-functional" (issue #18186) — so no project-level declarative deny list.
   - `cli/gemini-ignore.md`: `.geminiignore` applies only to "tools that support this feature".
   - `gemini skills list` / `gemini hooks --help` (Change 0163): project skills and hooks are
     disabled in untrusted folders; `gemini hooks migrate` converts Claude Code hooks.
2. **Codex (official docs; CLI not installed here).** `https://developers.openai.com/codex/hooks`
   (redirects to `https://learn.chatgpt.com/docs/hooks`): `PreToolUse` can deny; for file edits
   `tool_name` is `"apply_patch"` with the patch text in `tool_input.command`; block with exit 2 +
   stderr or `hookSpecificOutput.permissionDecision: "deny"`; config `hooks.json` or `[hooks]` in
   `config.toml`, user `~/.codex/` or project `<repo>/.codex/`; project hooks load only when the
   `.codex/` layer is trusted and each non-managed hook is trusted by hash via `/hooks`; "Treat tool
   hooks as a useful guardrail, not a complete enforcement boundary."
3. **Cursor (official docs; not installed here).** `https://cursor.com/docs/hooks`: `preToolUse`
   can deny (matcher `Write` listed); no `beforeFileEdit`; `afterFileEdit` runs after the edit;
   `beforeReadFile` can deny reads; deny with exit 2 or `{"permission": "deny"}`; non-zero other
   exits fail open unless `failClosed: true`; project config `.cursor/hooks.json`. The `tool_input`
   fields for `Write` are not documented, and the doc does not confirm CLI parity.
4. **Claude Code.** Current behavior from ADR-041 / Change 0162 (`cli/templates/guardrails/
   aief-approval-guard.mjs`, `claude-deny.json`).

Third-party pages consulted during search but not relied on for any cell:
codex.danielvaughan.com (Codex hooks posts), blog.gitbutler.com/cursor-hooks-deep-dive,
forum.cursor.com thread on Cursor CLI hooks.

## Verification

- Before the decision: `aief verify --change 0165 --strict` → FAIL ("Decisions Required has content
  but Decision (human) records no outcome yet" + the two `(human)` tasks).
- After transcribing the decision and adding ADR-042: `aief verify --change 0165 --strict` → FAIL
  only for the two unchecked `(human)` tasks (the owner's confirmation). `aief verify` → PASS;
  `npm test` → 771 pass (no code changed).
- `git diff --check` → clean.
- No tests run: no code changed (R5).

## Findings

- Gemini's edit hook protocol differs from Claude's only in tool names (`write_file`/`replace` vs
  `Write`/`Edit`/`MultiEdit`) and `allow_multiple` vs `replace_all` — one script can serve both.
- Codex can block edits, but needs the guard to read a patch instead of old/new strings.
- Cursor can block edits only through `preToolUse`, with undocumented input fields.
- Every assistant's edit hook is bypassable by a shell command.
- Project-level credential deny exists declaratively only in Claude Code.

## Risks

- Codex and Cursor rows rest on documentation, not observed events.
- Docs move quickly (Change 0163 found ADR-039 outdated within weeks); the follow-up must re-check
  versions at implementation time.

## Recommendations

See `change.md` › Recommendation (D1–D5).

## Artifacts Produced

- `changes/0165-define-guardrail-parity-across-assistants/` (this Definition).

## Lessons Learned

The installed CLI's bundled docs are the most reliable source for its own version.

## Next Change

Gemini approval guard (`feature`), per ADR-042.
