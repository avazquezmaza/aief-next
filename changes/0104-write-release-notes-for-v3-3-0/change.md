# Change

## ID

`0104-write-release-notes-for-v3-3-0`

## Type

General

## Objective

`aief release 3.3.0` scaffolds `releases/v3.3.0.md` with empty Summary/Verification placeholders
(per `docs/maintainer.md`'s "Releasing" section) — fill it in with what Changes 0090–0103 actually
delivered and how it was verified, now that tag `v3.3.0` is already pushed.

## Scope

### In scope

- `releases/v3.3.0.md` — Summary (grouped by theme: Expert Definition Skills validation,
  manifest-drift detection, usability study + ADR-015 thaw, skills-catalog expansion, CLI polish,
  documentation accuracy, version bump) and Verification (test/verify/diagnostic results actually
  observed across 0090–0103).

### Out of scope

- Any further code or doc change — this Change only records what already shipped and was already
  verified in Changes 0090–0103's own evidence.
- Re-tagging or re-pushing — `v3.3.0` was already tagged and pushed in a prior, separately
  confirmed step.

## Success Criteria

- `releases/v3.3.0.md` accurately summarizes 0090–0103, with real verification evidence, not
  placeholder text.
- `npm test`, `node cli/bin/aief.js verify`, `git diff --check` all pass.

## Status

Closed (2026-09-01)
