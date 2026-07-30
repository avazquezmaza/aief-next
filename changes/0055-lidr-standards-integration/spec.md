# Specification

## Goal

`aief prompt` consumes a project's `ai-specs/standards/*.md` alongside AIEF's built-in
`knowledge/standards/*.md`, project always winning on id collision, and actually includes the
resolved reference in the real prompt text sent to the assistant. `aief doctor --verbose` gains a
conditional human-facing report of the same resolution. A project without `ai-specs/standards/`
sees byte-identical `aief prompt` output and no new `aief doctor` section at all.

## Non-goals (this Change)

- `bootstrap`, `analyze`, Skills, Harness, Loop, Graph, worktrees, `status --next` — untouched.
- Copying `ai-specs/standards/` content anywhere — AIEF references the file in place.
- A new command, or a `--json` output mode.
- Any change to `createStandards()`/`standardsForProject()` (the built-in standards copy
  mechanism itself) or to `cli/templates/standards/`.

## Requirements

- **R1 — Resolution is pure and reused, not duplicated.** A new internal
  `resolveResourceRecommendations(builtins, projectResources, resourceDirLabel)`
  (`cli/src/core/domain/ai-specs.js`) is shared by `resolveSkillRecommendations()` (Change 0054,
  refactored to use it, zero behavior change) and a new `resolveStandardRecommendations(builtins,
  cwd)`. Neither re-implements `discoverAiSpecs()`/`resolveResources()`'s discovery or precedence.
- **R2 — `deriveSkillDescription` is preserved as a stable alias.** The heading-stripping logic is
  renamed to `deriveResourceDescription`; `deriveSkillDescription` remains exported as
  `= deriveResourceDescription`, identical for every real (`state: "present"`) resource file.
  (Refined during implementation: the unreachable-in-practice empty-content fallback string
  changed from `"Project-defined skill"` to the generic `"Project-defined resource"` — this
  literal never surfaces for an actual Skill file, since `discoverAiSpecs()` already classifies
  empty content as `state: "empty"` before `deriveResourceDescription()` is ever called on it;
  Change 0054's own test asserting the old fallback string was updated to match, documented here
  rather than silently.)
- **R3 — Built-in standards gain an `{id, description, path}` shape.** `cli/src/cli.js`'s new
  `builtinStandardsList()` maps `listStandards()`'s bare filenames into objects `resolveResources()`
  can consume: `id` is the filename without `.md`, `description` is derived from the file's own
  content (`knowledge/standards/<file>`), `path` is that file's absolute path.
- **R4 — `aief prompt`'s `standardsBlock` is provably byte-identical when `ai-specs/standards/`
  contributes nothing.** With no project standard (directory absent, empty, or every entry
  invalid), the rendered block is line-for-line identical to today's
  `- knowledge/standards/<file>` listing — same order, same strings. This is achieved by rendering
  a builtin item as `- knowledge/standards/<id>.md` (reconstructing today's exact string from the
  same id) and only ever adding new lines when a project resource genuinely resolves.
- **R5 — A resolving project standard is rendered with its real path and a tag.** A project-only
  standard renders as `- ai-specs/standards/<id>.md [project]`; a project standard overriding a
  built-in id renders as `- ai-specs/standards/<id>.md [project override]` — critically, the
  **project's own file path** is what appears (not the built-in's `knowledge/standards/` path),
  so an assistant reading the generated prompt is pointed at the file that actually governs.
- **R6 — `aief doctor`'s new Standards report is fully conditional.** `doctor` (with or without
  `--verbose`) prints no "Standards:" section at all when `discoverAiSpecs(cwd).standards` is
  empty — the overwhelming majority of projects, which never saw such a section before this
  Change, see none now either. When at least one project standard resource exists (valid or not),
  the section appears: default output lists every resolved standard (builtin and project, tagged
  as in R5), `--verbose` adds `source`, `path`, `overrides`, and full resolver warning text — same
  discipline Change 0054 established for Skills (`invalidCount`, separate from override notices,
  drives the one-line default hint; never a raw warning dump or stack trace by default).
- **R7 — Invalid project resources never resolve, never crash.** A project standard in state
  `read_error`/`duplicate`/`empty` is excluded from both `prompt`'s block and `doctor`'s report
  (its built-in counterpart, if any, is kept), counted in `invalidCount`, never thrown.
- **R8 — Order is deterministic.** Same as Change 0054's R4: built-ins in `listStandards()`'s
  (alphabetical) order, project-only ids appended in `discoverAiSpecs()`'s filename-sorted order,
  an overriding id keeping its built-in's position.
- **R9 — No write, ever; no copy, ever.** Neither `resolveStandardRecommendations()`,
  `builtinStandardsList()`, `prompt()`'s new rendering, nor `doctor`'s new report writes any file
  or copies `ai-specs/standards/` content anywhere. AIEF references the project's file in place.
- **R10 — `bootstrap`, `analyze`, Skills resolution, and every other command are unaffected.**
  Zero diff in `analyze()`, `createStandards()`, `standardsForProject()`, `bootstrapHere()`,
  `resolveSkillRecommendations()`'s observable output, or `cli/src/detect.js`.

## Acceptance Criteria

- [x] A project with no `ai-specs/standards/` produces `aief prompt` output byte-identical to the
      pre-Change baseline, for every existing `prompt` test.
- [x] A project with no `ai-specs/standards/` produces `aief doctor`/`aief doctor --verbose`
      output with no "Standards:" section at all — byte-identical to before this Change.
- [x] A project with one project-only standard shows it in `aief prompt`'s block as
      `- ai-specs/standards/<id>.md [project]`, alongside unchanged built-in lines.
- [x] A project standard sharing an id with a built-in overrides it in `aief prompt`'s block —
      `- ai-specs/standards/<id>.md [project override]` — the built-in's `knowledge/standards/`
      line for that id does not also appear.
- [x] A project combining built-ins, an override, and a project-only standard resolves all three
      in deterministic order, in both `prompt` and `doctor --verbose`.
- [x] An invalid project standard (unreadable, empty, or duplicate id) never appears in `prompt`'s
      block or `doctor`'s report; `doctor`'s default output gains exactly one hint line;
      `--verbose` shows the full diagnostic, never a stack trace.
- [x] Repeated invocations (same project) produce identical order and content in both commands.
- [x] `bootstrap`, `analyze`, and Skill recommendations (Change 0054) are unaffected — all
      existing tests for them still pass unmodified.
- [x] Full CLI test suite passes; `aief verify` passes; `git diff --check` is clean.
