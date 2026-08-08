# Change

## ID

`0069-prompt-skills-ai-specs-aware`

## Type

General

## Objective

`ai-specs/skills/*.md` (LIDR/specboot-style project resources, ADR-023) is already wired into
`aief doctor` (Change 0054/ADR-024), and `ai-specs/standards/*.md` is wired into both `aief doctor`
and `aief prompt` (Change 0055/ADR-025). Inspection of `prompt()` (`cli.js`) found the one real
asymmetry left: its `skillsBlock` — the Skill context actually sent to an assistant — still calls
raw `recommendSkills(project)` directly, never `resolveSkillRecommendations()`. A project's
`ai-specs/skills/` directory can add or override a Skill in `aief doctor`'s report, but that
override never reaches the prompt an assistant actually receives. This Change closes that one gap.

## Scope

### In scope

- `prompt()`'s Skill context resolves through `resolveSkillRecommendations()`, exactly like
  `printSkills()` (`doctor`) already does — so an `ai-specs/skills/` addition or override is
  visible to both commands, not just one.
- Builtin-sourced Skills keep every field the Skill Catalog gives them (`promptContext`,
  `commonRisks`, `name`) — `resolveSkillRecommendations()`'s generic output only carries
  `id`/`description`/`because`/`source`/`path`/`overridesBuiltin`, which would silently drop
  `promptContext`/`commonRisks` for every builtin Skill if swapped in naively. This Change
  reattaches the full builtin entry by id after resolving, so no operational content is lost.
- A Skill that exists only as an `ai-specs/skills/<id>.md` file (no matching built-in id) renders
  with the exact fallback text the prompt template already has for a Skill with no `promptContext`
  — honest, since a raw Markdown file is not a structured Skill Catalog entry.
- A `[project]`/`[project override]` tag on such entries, mirroring `standardsBlock`'s own existing
  tag convention in the same function.

### Out of scope

- `resolveResourceRecommendations()`/`resolveSkillRecommendations()`'s shared shape — unmodified;
  the fix lives entirely at `prompt()`'s call site, so `doctor`'s Skills/Standards reports and
  `prompt`'s Standards block (already wired) are unaffected.
- `aief bootstrap`'s adoption-time Skill/Standard seeding (`runAdoption()`) and `aief analyze`'s
  context seeding — both still call `recommendSkills()`/`listStandards()` directly, unaffected.
  (Noted as a possible later, separately-scoped Change — not needed to close this asymmetry.)
- Surfacing `ai-specs` warnings/invalid-resource counts in `prompt()` — the existing Standards
  wiring in the same function already doesn't do this either (diagnostics stay `doctor`'s job); no
  new precedent needed.
- Any change to a Skill's own runtime behavior (`aief prompt --skill <id>`) — untouched.

## Success Criteria

- With no `ai-specs/skills/` present, `aief prompt`'s output is byte-identical to before this
  Change.
- An `ai-specs/skills/<id>.md` overriding a built-in id, or adding a new one, is visible in
  `aief prompt`'s Skill context — matching what `aief doctor` already showed.
- No builtin Skill's `promptContext`/`commonRisks` content is lost in the process.
- No existing test breaks; new tests cover both the addition and override cases for `prompt`.

## Status

Open
