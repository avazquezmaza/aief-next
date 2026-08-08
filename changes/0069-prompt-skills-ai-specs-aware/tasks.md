# Tasks

## Implementation

- [x] `prompt()`: resolve Skills through `resolveSkillRecommendations()`, reattach full builtin
      fields by id, build a tagged fallback object for project-sourced entries.
- [x] `skillsBlock` template: render `${s.tag || ""}` in both branches.

## Tests

- [x] No-`ai-specs/skills/` case: `aief prompt` output byte-identical to before this Change.
- [x] New ai-specs skill (no built-in match): appears in `prompt`'s Skill context, `[project]`
      tag, fallback text.
- [x] Overriding ai-specs skill: appears `[project override]`, built-in's `promptContext`/
      `commonRisks` not shown for that id.
- [x] Non-overridden built-in Skill: `promptContext`/`commonRisks` rendering unchanged.
- [x] Invalid ai-specs skill (duplicate id): excluded, no crash, built-in untouched.
- [x] Confirm `doctor`'s Skills report and `prompt`'s Standards block are unaffected (no shared
      code touched).

## Verification

- [x] `npm test` (root) passes.
- [x] `node cli/bin/aief.js verify` at repo root passes.
- [x] `node cli/bin/aief.js verify --change 0069-prompt-skills-ai-specs-aware` passes.
- [x] `git diff --check` passes.

## Evidence

- [x] Update evidence.md
