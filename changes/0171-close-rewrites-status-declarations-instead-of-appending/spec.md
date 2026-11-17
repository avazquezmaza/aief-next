# Specification
## Goal

`aief close` must never leave a Change unreadable. Today `markClosed()` patches
`change.md` with a regex of its own, unrelated to the parser that later reads the result: it
can append a second `Status` declaration that contradicts the first, and it can delete the
heading that follows a valueless `## Status`. After this Change, marking a Change Closed is a
transformation the parser itself validates — the candidate is computed, checked with
`isClosedContent()`, and written only if that check passes.

## Failure matrix

Reproduced on `main` @ `3f6916a` by running `markClosed()`'s logic over each format and feeding
the output back into `parseChangeStatus()`.

| Input form | Today | Outcome | Reachable via `aief close`? |
| --- | --- | --- | --- |
| `Status: In Progress` (inline) | appends `## Status` | 2 disagreeing declarations → `unknown`, exit 1, file corrupted | yes |
| `### Status` + value (H3) | appends `## Status` | 2 disagreeing declarations → `unknown`, exit 1, file corrupted | yes |
| inline `Status: Open` + `## Status`/`Open` (valid, coherent) | rewrites only the heading | was valid → becomes `unknown` | yes |
| `## Status` with no value, followed by `## Objective` | overwrites the next line | `## Objective` destroyed, result reads `closed` | **no** — readiness rejects it first |
| `## Status` with no value at end of file | inserts the value | already works | — |
| `## Status` + value / no declaration at all / `Closed (…)` | — | already work | — |

Row 4 is a latent hazard, not a live bug: `checkChangeReadiness()` reports
`status is declared but not understood: "## Objective"` and `close` stops before writing. It
matters because `markClosedContent()` is a pure, exported transformation whose only contract is
"the returned content reads as closed"; a function that satisfies that contract by deleting a
heading is unsafe to keep, and R3's verify-before-write is what bounds it.
## Requirements

- R1: Add a pure, exported `markClosedContent(md, date)` to `cli/src/core/domain/change.js`. It
  takes the file content and the closing date, returns the new content, and performs no I/O — no
  filesystem, no clock, no `process.exit`.
- R2: Rewrite every existing status declaration in place instead of appending beside it: an inline
  `Status: …` line becomes `Status: Closed (<date>)`; an H2/H3 heading with a value gets that value
  line replaced; an H2/H3 heading with no value followed by another heading gets a value line
  inserted immediately after it. When no declaration exists, append `## Status` + `Closed (<date>)`
  as today. Headings, sections and history keep their order and shape.
- R3: In `cli/src/commands/close.js`, `markClosed()` computes the candidate with
  `markClosedContent()`, verifies it with `isClosedContent()`, and writes `change.md` **only** when
  the verification passes. On failure it returns false leaving the file byte-identical.
- R4: No accepted input may lose content. Every line that is not a rewritten or inserted status
  value survives — in particular the heading following a valueless `## Status`, which row 4 of the
  matrix currently destroys.
- R5: Reword `statusProblem()` in `cli/src/core/services/change-verifier.js` so it stops
  recommending `aief close`, a command that cannot resolve an `unknown` state. The message must
  name the accepted values and both causes — a value that could not be interpreted, and
  declarations that disagree — and must keep the substring `not understood`, which
  `cli/tests/change-status.test.js` asserts.
- R6: Test the invariant, not the enumerations: for every accepted declaration format,
  `isClosedContent(markClosedContent(md, date))` is true and the content survives; a regression test
  covers the heading-destruction case; an end-to-end `aief close --yes` on a Change with an inline
  declaration exits 0, leaves exactly one agreeing declaration and a file that passes `aief verify`.
- Out of scope, each its own Change: F2 (the guard allows inventing a `- [x] (human)` approval),
  F3 (evidence placeholder ratio), F4.

## Acceptance Criteria

- [x] R1–R6 implemented with tests.
- [x] `npm test` introduces no new failures (799/799 on the host; in the VM 798/799 —
      `cli/tests/diagrams.test.js` fails identically at `HEAD` there, ImageMagick rejects
      `stroke-dasharray`), `npm run lint`
      and `git diff --check` pass, and `aief verify --strict` passes once the approval below is
      recorded.
- [x] No existing test is weakened or deleted.
- [ ] (human) Owner reviews the diff before merge.
