# Tasks

## Implementation

- [x] `bootstrap(args)`: parse `--interactive`, pass `{ interactive }` to `initProject`.
- [x] `initProject(name, opts)`: thread `opts` to `bootstrapHere(opts)` on the no-name branch only.
- [x] `bootstrapHere(opts = {})`: guard the static "Next steps" block; add
      `bootstrapInteractiveNextStep()` and call it when `opts.interactive === true`.
- [x] Implement `bootstrapInteractiveNextStep()`: one `promptSync()` question, three branches
      (analyze / new-change / skip-or-anything-else), calling existing `analyze()`/`newChange()`
      unmodified.

## Tests

- [x] New test file or additions to an existing bootstrap test file: non-interactive byte-identical
      output (both empty and already-bootstrapped project states).
- [x] Interactive "analyze" branch: simulate stdin input, assert an Analysis Change directory
      exists after the run.
- [x] Interactive "new-change" branch: simulate stdin input (choice + name), assert the named
      Change directory exists.
- [x] Interactive "skip"/empty branch: assert the static "Next steps" text still appears.
- [x] `aief bootstrap <name> --interactive` (new-skeleton case): assert no prompt/hang, identical
      output to without the flag.

## Verification

- [x] `npm test` (root) passes.
- [x] `node cli/bin/aief.js verify` at repo root passes.
- [x] `node cli/bin/aief.js verify --change 0068-bootstrap-interactive-wizard` passes.
- [x] `git diff --check` passes.

## Evidence

- [x] Update evidence.md
