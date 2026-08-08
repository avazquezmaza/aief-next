# Specification

## Goal

A user running `aief status` with 2+ open Changes learns, from the command's own output, that
`aief status --next` exists and will recommend one — without reading `docs/workflow.md` first.

## Requirements

- In `statusOverview()` (`cli/src/cli.js`), the line printed when `open.length > 1` inside the
  `if (open.length)` block changes from:
  `"\nMultiple Changes in progress — commands that act on a Change need an explicit --change <id>."`
  to a version that also names `aief status --next` as the way to get a recommendation, keeping
  the existing "need an explicit --change <id>" fact intact (both are true and useful).
- In the same function's final `Next:` block, the `open.length > 1` branch
  (`printNext("aief prompt --change <id>", "aief close --yes --change <id>")`) gains
  `"aief status --next"` as the first argument, so it prints before the other two.
- No other branch of `statusOverview()`'s `Next:` logic changes (0 Changes, 1 open Change with or
  without a track, missing `AGENTS.md`/`changes/`).
- `statusNextSmart()` (the `--next` implementation) is not modified.

## Acceptance Criteria

- [x] `aief status` with 2+ open Changes prints a line mentioning `aief status --next` in addition
      to the existing "explicit --change <id>" guidance.
- [x] `aief status`'s `Next:` block, with 2+ open Changes, lists `aief status --next` before
      `aief prompt --change <id>` and `aief close --yes --change <id>`.
- [x] `aief status` with 0 or 1 open Changes produces byte-identical output to before this Change.
- [x] Existing test `cli/tests/change-selection.test.js` — `"status lists all open Changes and
      flags multiplicity"` and test 11 (`"no mutating command silently selects..."`) — still pass
      unmodified (both use partial regex matches compatible with the added text).
- [x] New test coverage added asserting `aief status --next` appears in both the inline note and
      the `Next:` block when 2+ Changes are open.
- [x] `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass.
