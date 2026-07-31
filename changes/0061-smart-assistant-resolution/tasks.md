# Tasks

## Implementation

- [x] Create `cli/src/core/domain/assistant-resolver.js`: `ASSISTANT_FILES`, `hasAssistant()`,
      `assistantIds()`, `assistantConfigPath()`, `readProjectAssistantConfig()`,
      `resolveAssistant()`.
- [x] Remove the inline `ASSISTANT_FILES` declaration from `cli.js`; import it from the resolver
      instead (AR-R10).
- [x] Wire `resolveAssistant()` into `prompt()` for the no-explicit-assistant path only; leave the
      explicit-override path untouched (AR-R7).
- [x] Add the TTY-interactive / non-interactive-error branch for ambiguous passive detection
      (AR-R5/AR-R6).
- [x] Add `--set-assistant`, `--show-assistant`, `--clear-assistant` flags to `prompt()`.

## Documentation

- [x] Update `COMMAND_HELP.prompt` (purpose/reads/writes/example) and the top-level `aief help`
      usage banner.
- [x] Update `docs/cli.md` with the resolution order and the three new flags.
- [x] Update `docs/configuration.md` to document `AIEF_ASSISTANT` (developer-local) vs
      `knowledge/assistant.json` (versioned project preference).
- [x] Add ADR-031 to `knowledge/decisions.md` recording: why this stayed a flag set on `prompt`
      instead of a new `use-assistant` command (ADR-013/ADR-022 relationship).

## Verification

- [x] `cli/tests/assistant-resolver.test.js` — unit tests for `resolveAssistant()` covering all
      precedence layers, invalid config, invalid env, symmetry across all four assistants,
      ambiguous detection, and the zero-signal case.
- [x] `cli/tests/cli.test.js` — CLI-level tests for the flags, the fixed asymmetry, the
      interactive/non-interactive branches, and a "prompt never writes" filesystem-snapshot test.
- [x] Update the one existing test whose assertion encoded the old CLAUDE.md-biased fallback
      (`"prompt --assistant selects the matching instruction file"`).
- [x] `npm test` passes (full suite — 747/747).
- [x] `node cli/bin/aief.js verify` passes.
- [x] `node cli/bin/aief.js verify --change 0061-smart-assistant-resolution` passes.

## Evidence

- [x] Update evidence.md
