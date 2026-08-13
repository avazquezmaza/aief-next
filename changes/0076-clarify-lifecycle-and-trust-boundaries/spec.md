# Specification

## Goal

Documentation accurately describes today's observed runtime behavior for manifest lifecycle,
`--evidence-from`'s trust boundary, verify-vs-close semantics, and project-root expectations —
none of it aspirational.

## Requirements

- R1 — `docs/concepts.md` states plainly that no AIEF command today creates, writes, or
  synchronizes `manifest.json`'s `status` field, and that `aief close --yes` writes only
  `change.md`.
- R2 — `docs/cli.md`'s `--evidence-from` row states the path is not required to be project-local
  and names why (CI-produced reports commonly live outside the checked-out project).
- R3 — `docs/cli.md`'s verify rows explain, in one added sentence, why `aief verify` can PASS on a
  Change that `aief close` still reports as blocked (different questions: structural completeness
  vs. full readiness).
- R4 — `docs/getting-started.md`'s existing root-directory guidance is reinforced with the
  consequence of not following it, without claiming any enforcement mechanism that does not exist.
- R5 — No implementation of manifest write-back, dual-write sync, `--evidence-from` containment,
  or a bootstrap guard is included in this Change.

## Acceptance Criteria

- [ ] `docs/concepts.md`'s manifest section contains the new paragraph; existing content is
      otherwise untouched.
- [ ] `docs/cli.md`'s `--evidence-from` and `verify` rows are updated; no other row is touched.
- [ ] `docs/getting-started.md`'s root-directory answer is extended by one sentence; no other
      content is touched.
- [ ] No source code file (`cli/src/**`) is modified by this Change.
- [ ] `node cli/bin/aief.js verify` passes.
- [ ] `git diff --check` passes.
