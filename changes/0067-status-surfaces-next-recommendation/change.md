# Change

## ID

`0067-status-surfaces-next-recommendation`

## Type

General

## Objective

`aief status`'s default output, when 2+ Changes are open, tells the user a Change must be picked
explicitly but never mentions `aief status --next` — the exact feature Change 0059/ADR-029 built
to recommend one deterministically. Confirmed by running `aief status` against this repository's
own 21 open Changes: the "Multiple Changes in progress" line and the final `Next:` block both stop
at "pick one with `--change <id>`", with no path to the command that already exists to help pick.
A user only discovers `--next` by reading `docs/workflow.md` — the CLI itself doesn't surface its
own solution to the exact problem it just described.

## Scope

### In scope

- `statusOverview()`'s "Multiple Changes in progress" line (`cli.js`, inside the `open.length`
  block) gains a pointer to `aief status --next`.
- The `open.length > 1` branch of `statusOverview()`'s final `Next:` block gains
  `aief status --next` as its first suggested command, ahead of the existing
  `aief prompt --change <id>` / `aief close --yes --change <id>`.

### Out of scope

- `statusNextSmart()` itself (the `--next` command's own selection/output) — Change 0059/ADR-029
  already covers it; this Change only makes it discoverable from the command that doesn't use it.
- `aief status --change <id>` (deep single-Change inspection) — unaffected, different branch.
- Reformatting or truncating the "Open Changes" list — a separate, larger UX decision, not needed
  to fix this specific discoverability gap.
- Any CLI/runtime behavior beyond these two printed lines — no new command, no new flag.

## Success Criteria

- Running `aief status` with 2+ open Changes prints `aief status --next` as a discoverable next
  step, both inline and in the `Next:` block, without requiring the user to consult docs.
- `aief status` with 0 or 1 open Changes is byte-identical to before this Change (different code
  branches, untouched).
- No test's existing assertion on this output breaks; new assertions cover the added text.

## Status

Closed (2026-08-08)
