# Specification

## Goal

A project-sourced `ai-specs/skills/` (or `standards/`/`agents/`) resource that uses a leading YAML
frontmatter block reports a real description instead of `---`, and `aief prompt` points the
assistant at any project-sourced Skill's real file instead of a generic "no content" message
whenever AIEF has actually resolved its path.

## Requirements

- R1: `deriveResourceDescription(content)` MUST return the leading frontmatter block's own
  `description:` field (single-line scalar, optionally quoted) when present.
- R2: In the absence of frontmatter, or of a `description:` field within it,
  `deriveResourceDescription()` MUST fall back to today's behavior (first non-empty line, heading
  marker stripped) applied to the content after any frontmatter block.
- R3: A `---` appearing mid-document (not at the very start of the file) MUST NOT be mistaken for
  a frontmatter delimiter.
- R4: `aief prompt`'s Skills block, for a `source: "project"` Skill with no `promptContext`, MUST
  render a line naming its real, project-relative path when one is known — not the generic
  "no operational content yet" text.
- R5: A Skill with neither `promptContext` nor a resolvable path (the builtin fallback Skill case)
  MUST keep rendering the existing "no operational content yet" line unchanged.

## Acceptance Criteria

- [x] `deriveResourceDescription()` on a `---\nname: x\ndescription: Real summary.\n---\n\nBody`
      string returns `"Real summary."`.
- [x] A quoted frontmatter description (`description: "Real summary."`) has its quotes stripped.
- [x] A frontmatter block with no `description:` field falls back to the first body line.
- [x] A mid-document `---` (a Markdown thematic break) does not affect the derived description.
- [x] `aief prompt` for a Change in a project with `ai-specs/skills/<id>/SKILL.md` (no
      `promptContext`) renders "recommended for this project — read
      ai-specs/skills/<id>/SKILL.md for its full instructions before starting."
- [x] The no-signals-detected fallback Skill (`project-architecture-reviewer`, a builtin with no
      project path) still renders the original "no operational content yet" line.
