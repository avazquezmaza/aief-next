# Specification

## Goal

Three independently-verified, low-severity consistency bugs are fixed: a misleading `because`
message for folder-shaped ai-specs resources, a bullet-style gap in Definition item-marker
scanning, and a stale version number in the README.

## Requirements

- R1 (`ai-specs.js`): `resolveResourceRecommendations()`'s `because` for a `source: "project"`
  item must be derived from the resource's actual discovered `path` (relative to the resource
  directory), not a hardcoded `${id}.md` template — correct for both the flat `<id>.md` and
  folder `<id>/SKILL.md` conventions `discoverResourceDir()` already supports.
- R2 (`definition-enrichment.js`): the item-marker line scan must accept any of `-`, `*`, `+` as
  the bullet character, matching `change.js`'s `countOpenTasks()` (`/^\s*[-*+] \[ \]/`) — same
  discipline Change 0075 established for `tasks.md`, applied here to `change.md`'s marker lines.
- R3 (`README.md`): the `## Status` section's version mention must read "AIEF 3.3", matching
  `package.json`'s `3.3.0`.

## Acceptance Criteria

- [x] A folder-shaped project resource (`ai-specs/skills/<id>/SKILL.md`) produces
      `because: ["ai-specs/skills/<id>/SKILL.md present in project"]` (or equivalent, matching the
      real path) — not `<id>.md`.
- [x] A flat project resource (`ai-specs/skills/<id>.md`) is unaffected — same `because` text as
      before.
- [x] `analyzeDefinitionSections()` classifies a line marked with `* ... (decision required)` or
      `+ ... (human)` the same as the equivalent `-`-prefixed line.
- [x] `README.md`'s `## Status` section says "AIEF 3.3".
