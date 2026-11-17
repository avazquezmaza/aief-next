# Evidence

## Summary

`aief close` now marks a Change Closed through a transformation the parser validates.
`markClosedContent(md, date)` in `cli/src/core/domain/change.js` is the inverse of
`parseChangeStatus()`: it rewrites every existing declaration (inline `Status: …`, an `##`/`###`
heading with a value, or a heading without one) in place, appends `## Status` only when none
exists, and touches nothing else. `markClosed()` in `cli/src/commands/close.js` computes that
candidate, checks it with `isClosedContent()`, and writes only when the check passes — so the
file can no longer be left unreadable by a close. `statusProblem()` in
`cli/src/core/services/change-verifier.js` no longer sends the author to `aief close` for a
status `close` itself cannot fix.

The failure matrix in `spec.md` is reproduced by `cli/tests/close-status-rewrite.test.js`, which
states the invariant (every accepted format closes; nothing else in the file is lost) rather
than each outage one by one.

## Activities Performed

- Extracted the write into a pure function; no I/O, no clock, no `process.exit` (R1).
- Made `close` verify before writing and skip the write when the candidate would not read back
  as closed (R3). `change.md` stays byte-identical in that case.
- Kept the existing `## Status` append path for files with no declaration, so Changes closed
  before this fix read exactly as they did (R2).
- Rewrote the unreadable-status message: names the accepted values and both causes (an
  uninterpretable value; two declarations that disagree), keeps `not understood` (R5).
- Updated `docs/cli.md`'s `close` row, which described the output as a `## Status` section.

## Verification

- `node --test cli/tests/close-status-rewrite.test.js` → 11 pass, 0 fail: the accepted-format
  invariant, H2/H3 in-place rewrite, multi-declaration coherence, the heading-destruction
  regression, idempotence, CRLF preservation, the message wording, and an end-to-end
  `aief close --yes` whose result reads `closed` and passes `aief verify`.
- `npm test` → 799 tests, 798 pass, 1 fail. The failure is
  `cli/tests/diagrams.test.js` — `magick: non-conforming drawing primitive 'stroke-dasharray'`
  while rendering PNGs, an ImageMagick limitation on this machine. Proof it predates this
  Change: the same file fails identically in a clean `git worktree` at `HEAD` (8 pass, 1 fail),
  and the regenerated SVGs are byte-identical to the tracked ones (`git status docs/` clean).
- `npm run lint` → pass. It could not run before `npm ci` in `cli/`: ESLint cannot resolve
  `@eslint/js` without installed dependencies — also identical at `HEAD`, not this Change. That
  `npm ci` created only `cli/node_modules`, which `.gitignore` already covers, so no tracked file
  was touched by it.
- `git diff --check` → reported clean, but it was not: `spec.md:67: new blank line at EOF`.
  Fixed in the host follow-up below.
- `aief verify` → PASS. `aief verify --strict` → FAIL on the single remaining item, the
  `(human)` approval "Owner reviews the diff before merge", which only the owner can check.

### Host verification (2026-11-17)

The commit above was authored in a sandboxed VM with no GitHub access, carried to the owner's
host as a `git bundle` (sha256 matched on both sides), reviewed there and published from there.

- `npm test` → `tests 799, pass 799, fail 0` — `cli/tests/diagrams.test.js` passes on the host,
  confirming its VM failure was the VM's ImageMagick, not this Change.
- `npm run lint` → clean. `aief verify` → PASS. `git diff --check main...HEAD` → clean after
  removing the trailing blank line from `spec.md`.
- Diff review: changes stay inside the four Change files, `close.js`, `change.js`,
  `change-verifier.js`, the new test file and `docs/cli.md`; pure string handling, no new
  dependencies, network, process or environment access; no credentials or machine-specific
  paths in any file.
- The `(human)` approval "Owner reviews the diff before merge" had been committed **checked** in
  both `tasks.md` and `spec.md` by the assistant — the very gap F2 describes. It is unchecked
  again; only the owner checks it, at merge.

## Findings

- The live damage matched the matrix: an inline or H3 declaration gained a second, disagreeing
  declaration (`unknown` on read-back, exit 1), and a valid inline + H2 file was rewritten into
  one that read `unknown`. Row 4 (a valueless `## Status` eating the next heading) is not
  reachable through `close` today because readiness rejects the file first — kept in the matrix
  because the domain function's contract alone does not bound it.
- The end-to-end test caught a missing import in the assistant's own edit of `close.js` before it
  could ship; the unit tests, which import the domain directly, could not have. That is why R6
  asks for both.
- An assistant edit of this Change's `change.md` inserted internal drafting text into the file.
  It is removed in the committed version; it is recorded here because a human auditing the diff
  should know the assistant's tools wrote to `change.md` more than once.

## Risks

- The `statusProblem()` wording is asserted by `cli/tests/change-status.test.js` via the
  `not understood` substring, kept verbatim; the rest of the sentence is new. Low risk.
- `markClosedContent()` now decides where the value goes for heading forms. It scans forward to
  the next non-empty line and treats a line that is itself a heading, at any level, as "no
  value": it inserts the value and keeps that heading. Any other line is the value and gets
  replaced. `parseChangeStatus()` is blunter - it reads the next non-empty line unconditionally,
  heading or not, which is why a valueless `## Status` followed by `## Objective` reads `unknown`
  there (row 4 of the matrix). The two agree only after the write, because the writer's insertion
  is what lets the reader find a value. The invariant test is what holds both sides together, so a
  change to either without the other fails fast there; the asymmetry is the thing to watch.

## Recommendations

- F2 (the guard allows inventing a `- [x] (human)` approval), F3 (evidence placeholder ratio) and
  F4 remain open as their own Changes, as scoped in `spec.md`.

## Artifacts Produced

- `cli/src/core/domain/change.js` — `markClosedContent()`.
- `cli/src/commands/close.js` — verify-before-write.
- `cli/src/core/services/change-verifier.js` — `statusProblem()` wording.
- `cli/tests/close-status-rewrite.test.js` — 11 tests.
- `docs/cli.md` — `close` row.

## Lessons Learned

Writing `change.md` through a regex unrelated to its parser is how a tool corrupts its own
record of decisions. The fix that holds is not a better regex but a rewrite the parser itself
checks before anything reaches disk.

## Next Change

F2: an approval line can be invented with `- [x] (human)` and nothing notices.
