# Tasks

## Implementation

- [x] `detect.js`: `recommendSkills()` computes `confidence` per recommendation and sorts
      strong-before-weak/fallback (stable).
- [x] `cli.js`: `prompt()`'s Skill-context mapping adds the weak-signal `tag` for builtin items.

## Tests

- [x] `detect.test.js`: strong/weak/fallback `confidence` values; sort order (strong before weak);
      stability within each group.
- [x] `cli.test.js`: `aief prompt` tags a weak-signal-only Skill; strong/fallback cases are
      byte-identical to before.

## Verification

- [x] `npm test` (root) passes.
- [x] `node cli/bin/aief.js verify` at repo root passes.
- [x] `node cli/bin/aief.js verify --change 0072-skill-recommendation-confidence` passes.
- [x] `git diff --check` passes.

## Evidence

- [x] Update evidence.md
