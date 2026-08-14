# Evidence

## Summary

Fixed a real false negative in `classifyMaturity()`'s definition signal: PRD/architecture/security
content under `docs/` was invisible to it, so a repository using that (extremely common)
convention classified `ambiguous` instead of `definition`. Found by a focused pre-merge adversarial
review's "Scenario A"; reproduced before any change, fixed, and covered by 5 new regression tests.

## Activities Performed

- Reproduced the reported scenario with a standalone script against unmodified `classifyMaturity()`:
  short root README (~7 words) + substantial `docs/prd.md`/`docs/security.md`/
  `docs/architecture-options.md` (no source) → `ambiguous`. Confirmed the review's finding before
  writing any fix.
- Extended `findDefinitionDocuments()` to also scan `docs/`/`documentation/` (one level, `.md`/
  `.txt` only) and sum their word counts into the same definition signal.
- Re-ran the reproduction script — now `definition`, with `docs/prd.md`, `docs/security.md`,
  `docs/architecture-options.md` all listed in `definitionFiles`.
- Added 5 tests to `project-maturity.test.js`: the reported scenario, the `documentation/`
  alternate name, one-level-only (nested `docs/adr/` excluded), non-document files excluded, and
  Implemented-still-wins-over-docs-content.
- Investigated the 30-word threshold per the review's explicit request (§5): tested 29/30/31-word
  boundaries directly — confirmed it acts as a hard boundary exactly at 30, and that a short,
  generic, non-PRD-like README (e.g. "This is a small library that helps developers format
  dates...") can clear it. Decision: **not changed**. Reasoning recorded in Findings below — this
  was investigated, not ignored.

## Verification

- `node --test cli/tests/project-maturity.test.js` — 15/15 pass (10 pre-existing + 5 new).
- `npm test` (full suite, this Change alongside Change 0086's fix) — 907/907 pass, 0 fail.
- `node cli/bin/aief.js verify` — Result: PASS.
- `git diff --check` — clean.

## Findings

- **The 30-word threshold is not changed, deliberately.** A repository with zero application
  source and only a short, generic README (no `docs/`, no PRD-named file) crossing 30 words now
  classifies `definition` instead of the pre-existing `ambiguous`-falls-back-to-`Analysis`
  behavior. Investigated whether this is a defect: it is not, for two reasons. First, this only
  ever fires when there is **also no application source** — the exact repository shape this whole
  program exists to serve better than "always create an Analysis Change for code that doesn't
  exist" (the problem statement Change 0079 was commissioned to fix). Second, a Definition Change
  is non-destructive: it never writes application code, never blocks anything, and a human
  reviewing it costs little compared to the harm the original problem (Analysis-oriented tasks for
  non-existent code) already caused. Raising the threshold to "fix" this would trade one arbitrary
  number for another without new evidence of real harm — the kind of unjustified framework-adjacent
  change the review explicitly warned against. Classified **NOT A DEFECT** in the review response.

## Risks

- None new.

## Recommendations

- None.

## Artifacts Produced

- `cli/src/core/domain/project-maturity.js`.
- `cli/tests/project-maturity.test.js` (+5 tests).
- `changes/0085-recognize-docs-directory-for-definition-maturity-signal/`.

## Lessons Learned

- Reproducing a review's exact reported scenario as a standalone script, before touching any code,
  turned "investigate this" into a verifiable before/after — worth doing for every review-reported
  defect, not just this one.

## Next Change

Change 0086 — Definition Change close must not succeed while a `Decisions Required` entry has no
`Decision (human)` outcome, even when its `(human)` approval tasks are checked off.
