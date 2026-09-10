# Specification

## Goal

`aief verify` names every numeric-ID collision among the project's Change directories,
non-blockingly, so a human notices before (or after) it merges instead of a bare
`--change <id>` reference silently becoming ambiguous.

## Requirements

- R1: `detectDuplicateChangeIds(basenames)` groups basenames by the leading numeric id (the
  substring before the first `-`); ignores a basename with no leading digits (never throws);
  returns only groups of size > 1, each as `{ id, basenames: string[] }` (basenames sorted),
  the outer array sorted by `id`.
- R2: Whole-project `aief verify` calls it against every Change directory's basename
  (`getChangeDirs()`) and, when non-empty, prints a `"Changes sharing a numeric ID
  (non-blocking):"` section listing each collision and its basenames, with a one-line
  explanation that a bare numeric `--change` reference is ambiguous.
- R3: This never changes `verifyProject()`'s own `passed`/exit-code decision — mirrors Change
  0095's manifest-status-drift note exactly in that respect.
- R4: `changes/0130-codex-external-audit/evidence.md`'s Findings Status table marks C0130-F2 as
  Resolved (for the detection half; the allocation-side alternative is explicitly not pursued —
  see change.md's Out of scope), pointing at this Change.

## Acceptance Criteria

- [ ] `detectDuplicateChangeIds(["0122-a", "0122-b", "0123-c"])` returns exactly one group for
      `"0122"` containing both basenames, sorted.
- [ ] `aief verify` run against this repository's own current state reports the real `0122-*`
      collision, with `Result: PASS` unaffected.
- [ ] `aief verify` run against a project with no colliding ids prints no such section at all.
- [ ] `npm test`, `npm run lint`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0135-detect-duplicate-change-id-collisions --strict`
      all pass.
