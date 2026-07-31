# Specification

## Goal

`aief doctor` shows a project's `ai-specs/skills/*.md` Skills merged with AIEF's built-in Skill
Catalog recommendations, project always winning on id collision, with a simple default output and
full detail behind `--verbose`. A project without `ai-specs/skills/` sees byte-identical output to
today, with or without `--verbose`.

## Non-goals (this Change)

- `bootstrap`/`analyze`/`prompt` are not touched — they keep calling `recommendSkills()` directly.
- `ai-specs/standards/` is not wired anywhere yet (Change 0053 already discovers it; consuming it
  is future work).
- No `--json` output, no new command, no Harness/Loop/Graph/worktree work.
- No change to the Skill Catalog (`skills-catalog.json`, `recommendSkills()`'s detector logic).

## Requirements

- **R1 — Resolution is pure and reused, not duplicated.**
  `resolveSkillRecommendations(builtins, cwd)` (`cli/src/core/domain/ai-specs.js`) calls
  `discoverAiSpecs(cwd)` and `resolveResources(builtins, aiSpecs.skills)` — it does not
  re-implement discovery or precedence.
- **R2 — Absent `ai-specs/skills/` is a strict no-op.** When `discoverAiSpecs(cwd).skills` is
  empty (directory absent, or present but empty), `resolveSkillRecommendations()`'s `items`
  equal `builtins` in the same order, with `source: "builtin"` for every entry and zero warnings.
  `aief doctor`'s **default** (no-flag) printed output is byte-identical to before this Change.
  `--verbose` is a brand-new flag this Change introduces — there is no "before" baseline for it to
  match; its own contract is R7.
- **R3 — Every resolved item carries enough to render both output levels.** Each item is
  `{ id, description, because: string[], source: "builtin" | "project", path: string | null,
  overridesBuiltin: boolean }`. For `source: "builtin"`, `description`/`because` come from the
  catalog entry unchanged; `path` is `null`; `overridesBuiltin` is `false`. For `source:
  "project"`, `description` is derived from the file's content (first non-empty line, a leading
  `#` sequence stripped; `"Project-defined skill"` if the file has no usable first line — should
  not occur for a `state: "present"` resource, but never throws either way), `because` is exactly
  `["ai-specs/skills/<id>.md present in project"]`, `path` is the resource's absolute path, and
  `overridesBuiltin` is `true` iff `id` also appears in `builtins`.
- **R4 — Order is deterministic.** Built-ins appear in `recommendSkills()`'s own (catalog) order;
  project-only ids follow in the filename-sorted order `discoverAiSpecs()` already guarantees. An
  overriding project id keeps the position its builtin id held (Map-based resolution, per
  `resolveResources()`'s existing contract) — same inputs, same order, every call.
- **R5 — Invalid project resources never appear as recommendations, and never throw.** A project
  skill in state `read_error`/`duplicate`/`empty` is excluded from `items` (its built-in
  counterpart, if any, is kept unchanged) and produces one warning string (via
  `resolveResources()`'s existing R7 behavior) — surfaced by `doctor`, never as a raw exception or
  stack trace.
- **R6 — `aief doctor`'s default output stays simple.** `printSkills()`'s per-skill lines gain, at
  most, one bracketed tag (`" [project]"` or `" [project override]"`) after the id — no other
  default-output line changes. `resolveSkillRecommendations()` reports two distinct things: an
  `invalidCount` (project resources in state `read_error`/`duplicate`/`empty` — a real problem)
  and `warnings` (human-readable strings covering *both* invalid resources *and* successful
  overrides — the latter already visible via the `[project override]` tag, not a problem). Only
  `invalidCount > 0` triggers the one extra default-output line (a count and a pointer to
  `--verbose`) — an override alone never does, since it is not something ignored.
- **R7 — `--verbose` reveals full detail.** Per project-sourced skill: `source`, `path` (relative
  to the current directory), and (when applicable) `overrides: built-in skill "<id>"`. Every
  built-in-sourced skill also gets a `source: builtin` line for symmetry. If there are warnings,
  every warning string is printed in full, one per line, under an `ai-specs warnings:` heading.
- **R8 — No write, ever.** Neither `resolveSkillRecommendations()` nor the `--verbose` code path
  writes any file, in any project, with or without a `manifest.json` present anywhere in
  `changes/`. `aief doctor`'s existing "Doctor never modifies your project" guarantee is unchanged.
  (This Change's activation gate is `ai-specs/skills/` directory presence, per ADR-023's existing
  convention — not a Change's `manifest.json`, which this Change does not read anywhere.)
- **R9 — `bootstrap`/`analyze`/`prompt` are unaffected.** None of the three imports or calls
  `resolveSkillRecommendations()`; each still calls `recommendSkills()` directly, exactly as
  before this Change (zero diff in `cli.js` outside `printSkills()`/`doctor()`, zero diff in
  `detect.js`).

## Acceptance Criteria

- [x] `aief doctor` on a project with no `ai-specs/` (or an empty `ai-specs/skills/`) prints
      default output byte-identical to the pre-Change baseline. `--verbose` is new (R2) — it adds
      a `source: builtin` line per skill even without `ai-specs/`, by design (R7).
- [x] `aief doctor` on a project with only project-defined Skills (no matching built-in ids) shows
      each tagged `[project]`, with the derived description and `because` line.
      `aief doctor --verbose` additionally shows `source: project` and the relative `path`.
- [x] `aief doctor` on a project whose `ai-specs/skills/<id>.md` shares an id with a recommended
      built-in shows `[project override]`, the project's own description/content winning — the
      built-in's fields never appear for that id. `--verbose` shows `overrides: built-in skill
      "<id>"`.
- [x] A project combining built-in recommendations, a project override, and a new project-only
      Skill shows all three, in the deterministic order R4 defines.
- [x] A project with an invalid `ai-specs/skills/` entry (unreadable, empty, or duplicate) never
      shows it as a recommendation; default output gains exactly one summary line; `--verbose`
      shows the full warning text, never a stack trace.
- [x] Repeated invocations (same project, unchanged files) produce identical order and content.
- [x] `bootstrap`, `analyze`, `prompt` output is unaffected — existing tests for all three still
      pass unmodified.
- [x] Full CLI test suite passes; `aief verify` passes.
