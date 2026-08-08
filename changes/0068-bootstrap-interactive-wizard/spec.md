# Specification

## Goal

A user who runs `aief bootstrap --interactive` in an existing project is asked one question and
ends up with their first Change already created — no separate `aief analyze`/`aief new-change`
invocation required. A user who runs plain `aief bootstrap` sees no difference from today.

## Requirements

- `bootstrap(args)` parses `--interactive` (boolean flag, via the existing `parseArgs()` — no new
  parsing mechanism) and passes it through to `initProject(name, { interactive })`.
- `initProject(name, opts)`: the `!name` branch (current-directory bootstrap) passes `opts` to
  `bootstrapHere(opts)`. The new-project-skeleton branch (`name` given) ignores `opts` — unaffected.
- `bootstrapHere(opts = {})`: all existing detection/`runAdoption()`/`configureSddProvider()` logic
  is unchanged. At the point where the function currently prints the static "Next steps:" block:
  - If `opts.interactive` is not `true`: print the existing static block, unchanged — byte-identical
    to today.
  - If `opts.interactive === true`: call a new `bootstrapInteractiveNextStep()` that prompts (via
    the existing `promptSync()`, unconditionally — no `isTTY` gate, since `--interactive` is itself
    the explicit opt-in, unlike the ambiguous-SDD-provider case which triggers without one) with
    one question offering three choices: analyze this project, start a new Change, or skip.
    - `"a"`/`"analyze"` → call `analyze([])` directly, then return (its own `printNext()` output
      stands in for the static block).
    - `"n"`/`"new-change"` → prompt for a Change name; if given, call `newChange([name])` directly,
      then return; if empty, fall through to the static block (nothing was created, so the
      user still needs a next step).
    - anything else (including empty input, `"s"`/`"skip"`) → fall through to the static block,
      unchanged text.
- No change to `analyze()`'s or `newChange()`'s own implementation.

## Acceptance Criteria

- [x] `aief bootstrap` (no `--interactive`) output is byte-identical to before this Change, in
      both the empty-project and already-bootstrapped cases.
- [x] `aief bootstrap --interactive` with a simulated "a" answer runs `analyze()` and an Analysis
      Change is created — verified by reading `changes/`.
- [x] `aief bootstrap --interactive` with a simulated "n" answer and a name creates a new Change
      with that name via `newChange()`.
- [x] `aief bootstrap --interactive` with a simulated "s" (or empty) answer prints the same static
      "Next steps" block as the non-interactive path.
- [x] `aief bootstrap <project-name> --interactive` (new-skeleton case) is unaffected — no prompt,
      same output as without the flag.
- [x] `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass.
