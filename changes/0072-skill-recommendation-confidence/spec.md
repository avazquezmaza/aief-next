# Specification

## Goal

An assistant reading a generated prompt can tell, for any recommended Skill, whether it was
triggered by a real dependency (high confidence) or only by a keyword found in a doc file (worth
double-checking) — without AIEF inventing any new signal, only surfacing what `detect.js` already
computes.

## Requirements

- `recommendSkills(project, catalog)` (`cli/src/detect.js`):
  - For each non-fallback recommendation, compute `confidence`: `"strong"` if
    `triggers.some((id) => signalById.get(id).signal === "strong")`, else `"weak"` (every trigger
    is `signalById.get(id).signal === "weak"` — a recommendation with zero triggers never reaches
    this branch, per the existing `if (!triggers.length) continue;` guard).
  - The fallback recommendation (`catalog.skills.find((s) => s.fallback)`) gets `confidence: null`.
  - Sort the final `recommendations` array: `"strong"` before `"weak"`/`null`, stable (catalog
    order preserved within each group) — e.g. `Array.prototype.sort` with a comparator that only
    distinguishes strong-vs-not (never reorders two entries of the same confidence relative to each
    other, since `Array.prototype.sort` is guaranteed stable in the JS engines this project targets,
    Node >= 18).
- `prompt()` (`cli.js`): in the Skill-context mapping already introduced by Change 0069 (builtin
  fields reattached by id after `resolveSkillRecommendations()`), when a builtin-sourced item's
  `confidence === "weak"`, add `tag: " (weak signal — confirm before relying on this)"`. Builtin
  items with `confidence === "strong"` or `null` get no `tag` (or `tag: ""`, matching the existing
  `${s.tag || ""}` template usage from Change 0069 — untagged is the byte-identical case).
  Project-sourced (`ai-specs/skills/`) items keep their existing `[project]`/`[project override]`
  tag from Change 0069, unaffected.
- No change to `evaluateDetector()`, `containsKeyword()`, `detectProject()`'s signal computation,
  or the Skill Catalog's own JSON shape (`signal` field already exists on every detector).

## Acceptance Criteria

- [x] A recommendation triggered by at least one `strong` signal has `confidence: "strong"`.
- [x] A recommendation triggered only by `weak` signal(s) has `confidence: "weak"`.
- [x] The fallback (`project-architecture-reviewer`) recommendation has `confidence: null`.
- [x] `recommendSkills()`'s output is ordered strong before weak/fallback, with catalog order
      preserved within each group (verified against the existing catalog's real detector/skill
      ordering, not a synthetic one).
- [x] `aief prompt` shows ` (weak signal — confirm before relying on this)` next to a Skill
      recommended only from a weak signal (e.g. a project whose README mentions "multi-tenant" with
      no matching dependency).
- [x] `aief prompt` for a project with only strong signals, or no signals at all (fallback), is
      byte-identical to before this Change.
- [x] `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass.
