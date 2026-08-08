# Specification

## Goal

`aief prompt`'s Skill context reflects `ai-specs/skills/` the same way `aief doctor` already does
— an addition or override is visible in both, and no built-in Skill's `promptContext`/`commonRisks`
is lost in the process.

## Requirements

- In `prompt()` (`cli.js`), replace `const skills = recommendSkills(project);` with:
  - `const builtinSkills = recommendSkills(project);`
  - `const { items: resolvedSkills } = resolveSkillRecommendations(builtinSkills, process.cwd());`
  - a `builtinById = new Map(builtinSkills.map((s) => [s.id, s]))`
  - `const skills = resolvedSkills.map((item) => item.source === "builtin" ? builtinById.get(item.id) : { id: item.id, name: item.id, tag: item.overridesBuiltin ? " [project override]" : " [project]" });`
- `skillsBlock`'s template gains `${s.tag || ""}` immediately after `${s.name || s.id}` in both of
  its two render branches (with-`promptContext` and fallback), so a project-sourced entry is
  visibly tagged and a builtin entry (no `.tag` field) renders exactly as before (`"" `).
- No change to `resolveSkillRecommendations()`, `resolveResourceRecommendations()`, or
  `resolveResources()` in `ai-specs.js`.
- No change to `printSkills()` (`doctor`) or the Standards path in `prompt()`.

## Acceptance Criteria

- [x] With no `ai-specs/skills/`, `aief prompt`'s full output (including the Skill context block)
      is byte-identical to before this Change.
- [x] An `ai-specs/skills/<new-id>.md` with no matching built-in appears in `aief prompt`'s Skill
      context, tagged `[project]`, using the existing "no operational content yet" fallback text.
- [x] An `ai-specs/skills/<id>.md` matching a built-in id appears tagged `[project override]`,
      and the built-in's own `promptContext`/`commonRisks` are never shown for that id (Skill
      Catalog's ADR-023 replace-wholly-not-merge rule, same as `doctor`).
- [x] A built-in Skill not overridden by any `ai-specs/skills/` file keeps its full
      `promptContext`/`commonRisks` rendering, unchanged.
- [x] An invalid `ai-specs/skills/` entry (e.g. duplicate id) is excluded, never crashes `prompt`,
      and never overrides its built-in (mirrors `doctor`'s existing behavior for the same case).
- [x] `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass.
