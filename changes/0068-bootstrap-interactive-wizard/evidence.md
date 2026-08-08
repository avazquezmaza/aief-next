# Evidence

## Summary

Added `aief bootstrap --interactive`: after the same detection/adoption/SDD-provider steps as
plain `bootstrap`, it asks one question (analyze / new-change / skip) and runs the chosen command
directly, instead of printing the static "Next steps" list. Plain `aief bootstrap` (no flag) is
unchanged. Also documented the new flag in `docs/cli.md`.

## Activities Performed

- Read `bootstrapHere()`, `initProject()`, `bootstrap()`, `analyze()`, `newChange()` and the
  existing `promptSync()`/`configureSddProvider()` interactive precedent before designing, to reuse
  the established pattern rather than inventing a new one.
- Threaded an `opts` object (`{ interactive }`) from `bootstrap(args)` → `initProject(name, opts)`
  → `bootstrapHere(opts)`, touching only the no-name branch of `initProject` — the new-project
  skeleton branch ignores `opts` entirely, confirmed unaffected by manual test.
- Implemented `bootstrapInteractiveNextStep()`, gated by `opts.interactive === true`, called only
  at the exact point the static "Next steps" block would otherwise print.
- **Found and fixed a real bug during manual testing**: a naive implementation using the existing
  `promptSync()` (single blocking `fs.readSync` per call) loses the second answer when both are
  piped in one write (e.g. `"n\nmy first feature\n"` sent as a single chunk) — the first read
  consumes the whole buffer including the second line, and the second `promptSync()` call gets
  nothing. Root cause: pipes don't do canonical (per-line) buffering the way a real TTY does, and
  `--interactive` deliberately has no `isTTY` gate (the flag itself is the opt-in, unlike
  `configureSddProvider()`'s ambiguous-provider prompt). Fixed by adding `makeLineReader()`, a
  small buffered line reader used only by the new wizard — `promptSync()` itself, and its one
  existing caller, are untouched.
- Verified manually, before writing automated tests: plain bootstrap, `--interactive` with "s",
  with "a", with "n"+name (both in one piped write, to specifically exercise the bug above), and
  `bootstrap <name> --interactive` (confirmed no prompt, no hang).
- Added 7 tests to `cli/tests/cli.test.js`, including one that pipes both answers in a single write
  specifically to cover the bug found above.
- Documented `--interactive` in `docs/cli.md`'s bootstrap table.

## Verification

- `node --test cli/tests/cli.test.js`: 196/196 passing (189 existing + 7 new).
- `npm test` (root, full suite): see final run below.
- `node cli/bin/aief.js verify` (full repo) and `--change 0068-bootstrap-interactive-wizard`: PASS.
- `git diff --check`: clean.
- Manually confirmed `aief bootstrap` (no flag) prints no mention of "Create your first Change
  now?" and still prints "Next steps:" — the non-interactive path is untouched.

## Findings

- The existing `promptSync()` helper's single-blocking-read design is correct for its one real
  caller (`configureSddProvider()`'s ambiguous-provider case, always gated by `isTTY`) but would
  have silently misbehaved if reused as-is for a multi-question, non-TTY-safe flow — worth keeping
  in mind for any future interactive CLI addition that doesn't have an `isTTY` gate.

## Risks

- None identified for the non-interactive path (byte-identical, confirmed). For `--interactive`,
  the only new write paths are `analyze()`/`newChange()` themselves, both pre-existing and
  unmodified — this Change only adds a new caller of each.

## Artifacts Produced

- `cli/src/cli.js` (`bootstrap`, `initProject`, `bootstrapHere`, new `makeLineReader`,
  `bootstrapInteractiveNextStep`)
- `cli/tests/cli.test.js` (`aiefWithInput` helper + 7 new tests)
- `docs/cli.md` (new table row)

## Lessons Learned

- Manually exercising an interactive flow with piped input before writing automated tests caught a
  real bug (the multi-line-in-one-read issue) that a naive test using only single-answer scenarios
  would not have caught — worth doing for any future Change adding stdin interaction.

## Next Change

Fase 2 (wizard + status/message UX) is now complete per the agreed roadmap. Next up: Fase 3
(#8 evidence capture from a file-based report, #11 smarter Skills detection).
