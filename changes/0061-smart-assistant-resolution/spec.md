# Specification

## Goal

`aief prompt` resolves which assistant to target deterministically and symmetrically across all
four registered assistants (Claude, Gemini, Codex, Cursor), without ever silently defaulting to
Claude, without persisting anything unless the user explicitly asks it to, and without becoming a
second command verb.

## Requirements

- **AR-R1 (precedence).** With no explicit assistant argument, `aief prompt` resolves in this
  order, stopping at the first layer that produces a signal:
  1. Explicit override (`aief prompt <name>` or `--assistant <name>`) — unchanged from before this
     Change, always wins, never reached by the rest of this spec.
  2. `AIEF_ASSISTANT` environment variable.
  3. `knowledge/assistant.json`'s `defaultAssistant` field.
  4. Passive detection: exactly one of `CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md` present in
     the project root.
  5. Interactive choice, only when stdin is a TTY and step 4 found 2+ candidate files.
  6. A non-zero-exit, actionable error, when step 4 found 2+ candidates and stdin is not a TTY.
- **AR-R2 (symmetry).** Passive detection (step 4) checks every registered assistant's native file
  the same way. No assistant is checked before another, and none is used as a fallback for another
  (the old "falls back to CLAUDE.md" behavior is removed for the *implicit* path — explicit
  overrides keep their existing, unrelated CLAUDE.md-fallback quirk, per AR-R7 below).
- **AR-R3 (zero signal is not an error).** If no override, env var, project config, or native file
  produces a signal, `aief prompt` proceeds exactly as it does today with no assistant: a generic,
  AGENTS.md-only prompt. This is unchanged, valid behavior, not a failure.
- **AR-R4 (invalid input is an error, never silently replaced).** An unknown `AIEF_ASSISTANT`
  value or an unparseable/unknown `knowledge/assistant.json` fails loudly (non-zero exit, message
  naming the problem) — it is never treated as "no signal" and never silently falls through to the
  next layer.
- **AR-R5 (interactive is single-run only).** The TTY prompt (step 5) selects an assistant for that
  invocation only. `aief prompt` never writes `knowledge/assistant.json` as a side effect of the
  interactive choice. The output tells the user how to persist the choice if they want to
  (`aief prompt --set-assistant <name>`).
- **AR-R6 (non-interactive ambiguity fails clearly).** Off a TTY, step 6 exits non-zero and lists:
  the candidates found, and the three ways to resolve the ambiguity (explicit argument,
  `AIEF_ASSISTANT`, `--set-assistant`).
- **AR-R7 (explicit override is untouched).** `aief prompt claude`, `aief prompt gemini`,
  `--assistant <name>`, the unknown-assistant error message, and the existing "note: file not
  found, including CLAUDE.md instead" warning for an explicit-but-missing native file are
  byte-for-byte unchanged by this Change.
- **AR-R8 (persistence is explicit, separate, and named).** `knowledge/assistant.json` is written
  only by `aief prompt --set-assistant <name>` (validates `<name>` against the same registry, then
  creates or overwrites the file) and deleted only by `aief prompt --clear-assistant`. Both print
  that they write/delete a file before doing so. `aief prompt --show-assistant` reports the
  configured preference, the fully resolved assistant, and the resolution source, and writes
  nothing.
- **AR-R9 (no new command verb).** All three flags (`--set-assistant`, `--show-assistant`,
  `--clear-assistant`) live on the existing `prompt` command. No new top-level verb is added.
- **AR-R10 (registry is not duplicated).** `ASSISTANT_FILES` exists in exactly one place
  (`cli/src/core/domain/assistant-resolver.js`); `cli.js` imports it.
- **AR-R11 (out of scope stays out).** `doctor`, `bootstrap`, the assistant template files'
  content, and the Change Type taxonomy are unmodified by this Change.

## Acceptance Criteria

- [ ] With only `GEMINI.md` present and no override/env/config, `aief prompt` includes `- GEMINI.md`
      (today it would silently omit it and fall back to a generic prompt or, with `CLAUDE.md`
      also present, to Claude regardless of which file is actually there).
- [ ] With only `CODEX.md` present, `aief prompt` includes `- CODEX.md`. Same for `CURSOR.md`.
- [ ] `AIEF_ASSISTANT=gemini aief prompt` selects Gemini even when `CLAUDE.md` is also present.
- [ ] A valid `knowledge/assistant.json` (`{"defaultAssistant":"codex"}`) selects Codex even when
      other native files are present, and even without `AIEF_ASSISTANT` set.
- [ ] `AIEF_ASSISTANT` overrides `knowledge/assistant.json` when both are set (AR-R1 order).
- [ ] An invalid `knowledge/assistant.json` (malformed JSON, or an unknown `defaultAssistant`)
      makes `aief prompt` exit non-zero with a message naming the file and the problem — it does
      not silently fall through to passive detection.
- [ ] An unknown `AIEF_ASSISTANT` value exits non-zero with a message naming the problem.
- [ ] With `CLAUDE.md` and `GEMINI.md` both present, no override/env/config, and no TTY, `aief
      prompt` exits non-zero, names both candidates, and never prints a prompt body.
- [ ] The same ambiguous case on a TTY prompts once, accepts a valid choice, prints the prompt
      using that choice, and does not write `knowledge/assistant.json`.
- [ ] With no assistant files present at all and no override/env/config, `aief prompt` succeeds
      exactly as before (generic, AGENTS.md-only prompt, exit 0).
- [ ] `aief prompt claude`, `aief prompt gemini --profile architect`, and `--assistant codex`
      behave exactly as before this Change (existing tests for these keep passing unmodified).
- [ ] `aief prompt --set-assistant claude` creates `knowledge/assistant.json` with
      `defaultAssistant: "claude"` and says it wrote a file.
- [ ] `aief prompt --set-assistant nope` (unknown assistant) exits non-zero and writes nothing.
- [ ] `aief prompt --show-assistant` reports the configured preference (or "not set"), the
      resolved assistant and its source, and exits 0 without touching the filesystem.
- [ ] `aief prompt --clear-assistant` removes `knowledge/assistant.json` if present, and reports
      "nothing to clear" (exit 0, no error) if absent.
- [ ] A plain `aief prompt` run (any resolution path, including the interactive one) never creates,
      modifies, or deletes any file — verified by snapshotting the project directory before and
      after.
- [ ] `npm test`, `node cli/bin/aief.js verify`, and `node cli/bin/aief.js verify --change
      0061-smart-assistant-resolution` all pass.
