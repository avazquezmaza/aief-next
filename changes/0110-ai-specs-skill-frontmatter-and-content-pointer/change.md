# Change

## ID

`0110-ai-specs-skill-frontmatter-and-content-pointer`

## Type

General

## Objective

Close two gaps found while validating whether a Claude Code / Kiro-style Skill package
(YAML-frontmatter `SKILL.md`, a `references/` folder, an `scripts/audit.sh`) can be adopted into a
project through AIEF's existing `ai-specs/skills/<id>/SKILL.md` discovery convention:

1. `deriveResourceDescription()` took the file's first non-empty line as its description with no
   awareness of a leading YAML frontmatter block — for a frontmatter-led file, that line is the
   opening `---` delimiter itself, surfaced verbatim in `doctor`/`bootstrap` output
   (`camel-quarkus [project]: ---`).
2. `aief prompt`'s Skills block never told the assistant where a project-sourced Skill's actual
   content lives — every such Skill (none of which carries AIEF's own `promptContext` catalog
   field) rendered the same generic "no operational content yet — treat it as a topic to keep in
   mind" line, even though AIEF had already resolved and could report its real file path (exactly
   as `standardsBlock`, two lines above it, already does for project standards).

Both were found and reproduced by actually copying a real external Skill package
(`camel-quarkus`/`camel-spring-boot`, mutually-exclusive sibling Skills that reference each other
by id) into a test project's `ai-specs/skills/` and running `doctor`/`prompt` against it.

## Scope

### In scope

- `cli/src/core/domain/ai-specs.js`: `deriveResourceDescription()` recognizes a leading `---`
  frontmatter block and prefers its own `description:` field; falls back to today's first-line
  logic (applied to the content after the frontmatter block) when there is no frontmatter or no
  `description:` field in it. Shared by Skills, Standards and Agents alike — not Camel-specific.
- `cli/src/commands/prompt.js`: a project-sourced Skill's resolved `path` is carried through to
  `skillsBlock`'s rendering; when there is no `promptContext`, the line now points the assistant
  at the real file to read instead of the generic no-content fallback.
- Regression tests for both, plus updates to the two existing tests whose assertions described
  the old "no operational content yet" behavior for a project-sourced Skill with a real,
  resolvable path.

### Out of scope

- Anything Camel/Quarkus/Spring-Boot-specific — this Change adds no domain knowledge to AIEF
  itself; the actual Skill content stays entirely in the adopting project's own `ai-specs/skills/`,
  per ADR-023 ("AIEF consumes, never copies").
- Parsing YAML block scalars (`description: >` / `description: |`) in frontmatter — only a
  single-line scalar is recognized; a block scalar falls through to the existing first-line
  fallback, same as no frontmatter at all.
- Any change to the Skills Runtime (`cli/src/skills/`) or Skills Catalog
  (`skills-catalog.json`) — evaluated and explicitly rejected as the integration point for
  externally-authored, stack-specific Skill packages (see this Change's design note below).

## Success Criteria

- A project's `ai-specs/skills/<id>/SKILL.md` starting with YAML frontmatter reports its own
  `description:` field in `doctor --verbose` output, not `---`.
- `aief prompt` for a Change in that project points the assistant at
  `ai-specs/skills/<id>/SKILL.md` to read for full instructions, instead of the generic
  "no operational content yet" line.
- The existing builtin-fallback-Skill "no operational content yet" case (a Skill with neither
  `promptContext` nor a resolvable project path) is unchanged.

## Status

Closed (2026-09-01)
