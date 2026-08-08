# Change

## ID

`0068-bootstrap-interactive-wizard`

## Type

General

## Objective

`aief bootstrap` (current-directory case) ends by *printing* a numbered "Next steps" list — the
user still has to read it, then manually type the next command themselves (`aief analyze` or
`aief new-change <name>`). Add an opt-in `--interactive` flag that, instead of printing the list,
asks one short question and runs the chosen next step directly — merging the "read steps, then
type a command" two-step manual process into one guided session for users who ask for it. Without
the flag, `aief bootstrap` is byte-identical to before this Change.

## ADR-013 note

Per ADR-022, "onboarding" is thawed for the AIEF 3.1 initiative, but ADR-022 itself does not waive
ADR-013 — each Change must still name what it removes/merges. This Change does not add a new
command verb (it extends `bootstrap`'s existing flag surface, the same pattern ADR-031 used for
`--set-assistant`/`--show-assistant`/`--clear-assistant` on `prompt`). What it merges: for a user
who opts in, the manual two-step flow (read "Next steps" text → separately invoke `aief analyze`
or `aief new-change <name>`) is replaced by one guided prompt that invokes the chosen command
directly. The non-interactive path removes nothing and stays the default.

## Scope

### In scope

- `aief bootstrap --interactive` (current-directory bootstrap only — `aief bootstrap
  <project-name>`, the new-skeleton case, is unaffected and out of scope).
- After the existing detection/adoption/SDD-provider steps (unchanged), ask one question: analyze
  this project, start a new Change, or skip — then call the existing `analyze()` or `newChange()`
  function directly with the answer, instead of printing the static "Next steps" list.
- If the user skips (or gives no usable answer), fall back to the existing static "Next steps"
  list — same text as today, so nothing is silently lost.
- Without `--interactive`, `aief bootstrap`'s output and behavior are byte-identical to before this
  Change.

### Out of scope

- `aief bootstrap <project-name>` (new project skeleton) — no interactive step added there.
- Any new command verb.
- Any change to `aief analyze`/`aief new-change`'s own behavior — this Change only calls them,
  unmodified, from a new entry point.
- A multi-question wizard covering profile/track/SDD-provider choice — this Change is scoped to
  the single highest-friction gap (what do I run next after bootstrap), not a full onboarding
  redesign.

## Success Criteria

- `aief bootstrap --interactive` in a TTY or with piped answers lets a user go from "just
  bootstrapped" to "first Change created" without leaving the one command.
- `aief bootstrap` (no flag) produces output byte-identical to before this Change.
- No existing test breaks; new tests cover the interactive flow (analyze branch, new-change
  branch, skip branch).

## Status

Closed (2026-08-08)
