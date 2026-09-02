# Tasks

## Implementation

- [x] `cli/src/core/domain/ai-specs.js`: added `stripFrontmatter()` and wired it into
      `deriveResourceDescription()`.
- [x] `cli/src/commands/prompt.js`: carried `item.path` through into the `skills` array for
      project-sourced entries; updated `skillsBlock`'s rendering to point at the path when there
      is no `promptContext`.

## Documentation

- [x] Inline comments at both fix sites explain the gap, cite Change 0110's reproduction
      (camel-quarkus/camel-spring-boot), and note the shared (not Camel-specific) nature of both
      fixes.
- [x] `change.md` records the design decision (and why) against integrating these external
      Skills via the Skills Runtime or Skills Catalog instead.

## Verification

- [x] Reproduced both gaps before the fix by copying real external Skill packages
      (camel-quarkus, camel-spring-boot) into a test project's `ai-specs/skills/` and running
      `doctor --verbose` / `prompt` against it.
- [x] Added regression tests: 4 for `deriveResourceDescription()`'s frontmatter handling
      (`cli/tests/ai-specs.test.js`), plus updated 2 existing `prompt` tests in
      `cli/tests/cli-skills-and-maturity.test.js` whose assertions described the old fallback
      text for a project-sourced Skill with a resolvable path.
- [x] Re-ran the manual reproduction after the fix: `doctor` shows the real description;
      `prompt` points at the real `ai-specs/skills/<id>/SKILL.md` path.
- [x] `npm test` (repo root) — 1023/1023 passing.
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] Confirmed the builtin-fallback "no operational content yet" case (no path, no
      promptContext) is unaffected.

## Evidence

- [x] Update evidence.md
