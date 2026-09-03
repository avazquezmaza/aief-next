# Change

## ID

`0117-branch-isolation-followup-for-enrich-analyze-propose`

## Type

General

## Objective

Complete the branch-isolation follow-up Change 0114 explicitly left open (see its
`docs/maintainer.md` note and evidence.md Recommendations): `aief enrich` writes its Change files
directly instead of through `createChange()`, so it never switches off `main`/`dev` the way
`new-change`/`analyze`/`propose` do. Separately, `analyze` and `propose` call `createChange()` (and
so already auto-branch) but never gained the `--no-branch` escape hatch `new-change` has, so a user
or script cannot opt out of the switch for those two commands.

## Scope

### In scope

- `aief enrich` calls `ensureChangeBranch()` directly (its file templates differ from
  `createChange()`'s generic/analysis/definition set, so it cannot reuse `createChange()` itself)
  before writing any Change file, switching off `main`/`dev` onto `enrichment/<id>-<slug>`.
- `enrich`'s `KNOWN_FLAGS` gains `--no-branch`, symmetric with `new-change`.
- `analyze`'s and `propose`'s `KNOWN_FLAGS` gain `--no-branch`, threaded through to
  `createChange({ noBranch })`.
- A failed checkout (the same `ChangeBranchError` case Change 0114 hardened `createChange()`
  against) aborts `enrich` the same way — no scaffolding written on the protected branch.

### Out of scope

- Any change to the branch-naming scheme (`<type>/<id>-<slug>`) or to `PROTECTED_BRANCHES`.
- `enrich`'s "existing Change already covers this source" short-circuit path — no branch switch
  happens there today and none is needed (nothing is written).

## Success Criteria

- Running `aief enrich <provider> <id>` from `main`/`dev` in a git repo switches to
  `enrichment/<id>-<slug>` before any Change file is written, mirroring `new-change`.
- `aief enrich ... --no-branch`, `aief analyze ... --no-branch`, and `aief propose ... --no-branch`
  all opt out, mirroring `new-change --no-branch`.
- `npm test`, `node cli/bin/aief.js verify --strict`, and `git diff --check` all pass.
