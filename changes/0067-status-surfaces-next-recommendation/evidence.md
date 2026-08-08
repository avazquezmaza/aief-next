# Evidence

## Summary

`aief status` now surfaces `aief status --next` as a discoverable recommendation whenever 2+
Changes are open — both in the inline "Multiple Changes in progress" note and as the first line of
the `Next:` block. Confirmed the gap first by running `aief status` against this repository's own
21 open Changes before the fix: the CLI described the problem (need `--change <id>`) but never
mentioned the command (`--next`, Change 0059/ADR-029) that already solves it.

## Activities Performed

- Reproduced the gap: ran `aief status` and `aief status --next` against this repo (21 open
  Changes at the time) to confirm `--next` works and is genuinely useful, but is never mentioned by
  plain `status`.
- Located the two exact lines in `statusOverview()` (`cli/src/cli.js`) responsible: the inline
  `open.length > 1` note, and the `printNext(...)` call in the same branch of the function's
  trailing `Next:` logic.
- Edited both to add `aief status --next`, keeping the pre-existing "explicit --change <id>" fact
  intact rather than replacing it (both are true).
- Added a new test (`cli/tests/change-selection.test.js`) asserting both mentions appear and that
  `aief status --next` is listed first in the `Next:` block.
- Confirmed the two pre-existing tests touching this output (`"status lists all open Changes and
  flags multiplicity"`, test 11) still pass unmodified — both use partial regex matches unaffected
  by the appended text.

## Verification

- `npm test` (root): 757/757 passing (was 756 before this Change's one new test).
- `node cli/bin/aief.js verify` (full repo): PASS.
- `node cli/bin/aief.js verify --change 0067-status-surfaces-next-recommendation`: PASS.
- `git diff --check`: clean.
- Manual run of `aief status` in this repo confirmed both new lines render as designed.

## Findings

- `statusNextSmart()` (Change 0059/ADR-029) was fully correct and useful but effectively hidden —
  the one command most likely to describe the problem it solves (`status` itself, when multiple
  Changes are open) never referenced it.

## Risks

- None identified. Two lines of printed text changed; no behavior, exit code, or file write
  changed. `status` with 0 or 1 open Changes is untouched (different code branches).

## Artifacts Produced

- `cli/src/cli.js` (2 lines changed)
- `cli/tests/change-selection.test.js` (1 test added)

## Lessons Learned

- A feature can be fully built and correct (Change 0059) and still fail to reduce real friction if
  the command most likely to trigger the user's need for it never mentions it exists — worth a
  quick "does the CLI's own output point at the feature that solves the problem it just described?"
  check on future UX-facing Changes.

## Next Change

Fase 2 continues with #7 (wizard `bootstrap --interactive`) per the agreed roadmap.
