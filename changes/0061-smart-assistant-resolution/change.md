# Change

## ID

`0061-smart-assistant-resolution`

## Type

General

## Objective

Fix `aief prompt`'s asymmetric assistant resolution and reduce the friction of naming an
assistant on every invocation, without weakening `prompt`'s "writes nothing" contract and without
adding a new command verb.

## Inventory of what already exists (read before touching anything)

- `aief prompt` **already** resolves an assistant when none is given on the command line — but
  the fallback (`cli.js`'s old `assistantFile` line) checked `CLAUDE.md` only. `GEMINI.md`,
  `CODEX.md` and `CURSOR.md` were invisible to that fallback even when present and even when
  `CLAUDE.md` did not exist. This Change corrects that asymmetry; it does not invent passive
  detection from nothing.
- `knowledge/sdd-provider.json` (Change 0045/0052, `sdd-provider-resolver.js`) is the existing
  precedent for a small, versioned, project-level JSON preference file with a deterministic
  precedence function, an explicit "invalid config is an error, never silently replaced" rule, and
  a TTY-gated interactive write performed by the calling command, never by the resolver itself.
  `knowledge/assistant.json` and `assistant-resolver.js` mirror that shape exactly — no new
  pattern is introduced.
- `ASSISTANT_FILES` (`{ claude: "CLAUDE.md", gemini: "GEMINI.md", codex: "CODEX.md", cursor:
  "CURSOR.md" }`) was declared inline in `cli.js` and was the only registry of known assistants.
  It is now the single export of `assistant-resolver.js`; nothing duplicates it.
- ADR-022 thaws ADR-015's "no new commands" freeze for AIEF 3.1, but restates that ADR-013 (name
  what you remove/merge) still applies to every 3.1 Change individually. This Change removes
  nothing and does not introduce a new command verb — it extends the existing `aief prompt`
  surface with three flags (`--set-assistant`, `--show-assistant`, `--clear-assistant`), the same
  additive-flag pattern already used for `--list-skills`/`--skill` (0047), `--graph`/`--next`
  (0058/0059) and `doctor --verbose`.

## Scope

### In scope

- `cli/src/core/domain/assistant-resolver.js` (new): `ASSISTANT_FILES` (the canonical assistant
  registry, moved here from `cli.js`), `resolveAssistant()` (pure precedence function — explicit /
  env / project config / passive detection), `readProjectAssistantConfig()`, `assistantConfigPath()`.
  No filesystem writes, no CLI dependency, independently unit-testable — mirrors
  `sdd-provider-resolver.js`.
- `cli.js`: `prompt()` calls `resolveAssistant()` only when no explicit assistant was given
  (positional or `--assistant` keeps its exact prior behavior, byte-for-byte). Adds
  `--set-assistant <name>`, `--show-assistant`, `--clear-assistant` as flags on the existing
  `prompt` command. Ambiguous passive detection (2+ native files, no env/config signal) prompts
  interactively on a TTY (never persisted) or fails with an actionable, non-zero-exit error off a
  TTY — it never silently defaults to Claude.
- `COMMAND_HELP.prompt` and the top-level usage banner (`aief help`), `docs/cli.md`,
  `docs/configuration.md` (or the closest existing home for project-level config files).
- Tests: `cli/tests/assistant-resolver.test.js` (new, resolver unit tests) and additions to
  `cli/tests/cli.test.js` (CLI-level behavior, including the flags and the fixed asymmetry).

### Out of scope

- `doctor`, `bootstrap`, and the adoption flow — untouched.
- The assistant template files themselves (`CLAUDE.md`, `GEMINI.md`, `CODEX.md`, `CURSOR.md`) —
  never read for content, only checked for existence, exactly as before.
- Type↔Track (Change 0039) — still frozen by ADR-022; no new Change-type taxonomy is introduced.
  `isAnalysis`/`isEnrichment` branching in `prompt()`'s rendered text is untouched.
- Automatically executing or invoking any assistant.
- Any new hidden state — `AIEF_ASSISTANT` is documented explicitly as developer-local, non-versioned
  configuration, distinct from the repository's own source of truth (`knowledge/assistant.json`).

## Success Criteria

- `aief prompt` with no arguments resolves the assistant deterministically through explicit
  override → `AIEF_ASSISTANT` → `knowledge/assistant.json` → passive detection, symmetrically
  across all four registered assistants.
- Multiple native files with no other signal never resolve silently — interactive on a TTY
  (not persisted), an actionable non-zero-exit error otherwise.
- `aief prompt claude` / `aief prompt gemini` / `--assistant <name>` behave exactly as before.
- Plain `aief prompt` (including its interactive branch) writes nothing. Only `--set-assistant`
  and `--clear-assistant` write, and each says so.
- `npm test`, `node cli/bin/aief.js verify`, and `node cli/bin/aief.js verify --change
  0061-smart-assistant-resolution` all pass.

## Status

Closed (2026-08-04)
