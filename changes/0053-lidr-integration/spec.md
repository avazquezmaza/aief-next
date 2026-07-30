# Specification

## Goal

A pure, dependency-free domain module that discovers `ai-specs/skills/*.md` and
`ai-specs/standards/*.md` in a project directory, and resolves them against a caller-supplied list
of AIEF built-in resources under one fixed precedence rule — project wins, never merged, always
reported. The module is unwired: no command calls it in this Change.

## Non-goals (this Change)

- Wiring into `recommendSkills()`, `listStandards()`, `bootstrap`, `analyze`, `prompt`, or any
  other command (see `change.md` "Out of scope").
- Any parsing schema beyond "filename stem is the id, file content is opaque text" — no
  front-matter, no YAML, no per-skill detector logic.
- Harness, Loop, Graph Engineering, new commands, UX changes.

## Requirements

- **R1 — Discovery is a no-op when `ai-specs/` is absent.** `discoverAiSpecs(cwd)` returns
  `{ present: false, root, skills: [], standards: [] }` when `<cwd>/ai-specs` does not exist. No
  filesystem write ever happens; no exception is thrown.
- **R2 — Discovery finds skills and standards independently.** When `ai-specs/skills/` and/or
  `ai-specs/standards/` exist (independently — either, both, or neither may be present under an
  existing `ai-specs/`), each `.md` file's basename (without extension) is its id; its full text
  content is read verbatim. A missing subdirectory (`ai-specs/` present but `skills/` or
  `standards/` absent) yields an empty array for that resource type — never an error, never a
  crash ("directorios incompletos").
- **R3 — Every discovered resource carries a state.** `present` (read successfully, non-empty),
  `empty` (file exists, zero/whitespace-only content), `read_error` (the file or its containing
  directory could not be read — e.g. `ai-specs/skills` existing as a file instead of a
  directory), or `duplicate`
  (a second file in the same directory resolves to an id already claimed by an earlier one, e.g.
  `foo.md` and `foo.MD` on a case-sensitive filesystem). None of these ever throw — every failure
  mode is a reported result.
- **R4 — `resolveResources()` is generic, not coupled to any specific resource shape.** Its first
  argument (`builtins`) is any array of objects carrying an `id` string; its second
  (`projectResources`) is `discoverAiSpecs()`'s `skills` or `standards` array (or any array shaped
  like it). It has no knowledge of the Skill Catalog's detector/`promptContext` fields or of
  `knowledge/standards/`'s file-based convention.
- **R5 — Precedence: project wins, never merged.** If a project resource's id matches a built-in's
  id, the resolved entry is the project's resource in full — never a field-by-field merge of the
  two. A warning string is recorded for every override (naming the id and the project file path).
- **R6 — A project-only id is added, not treated as an override.** An id present only in
  `projectResources` (absent from `builtins`) is included in the result with no warning — it is
  new content, not a collision.
- **R7 — `read_error`/`duplicate`/`empty` project entries never silently win.** A project resource
  in one of these states is excluded from the resolved set (the built-in, if any, is kept
  untouched) and produces a warning explaining why — an unreadable or empty project file must
  never silently shadow a working built-in.
- **R8 — Deterministic.** Same `cwd`/inputs, same result, every call — no caching, no state
  between calls.
- **R9 — Zero coupling to any existing command.** No file under `cli/src/cli.js`, `cli/src/detect.js`,
  or any existing command path imports or calls this module in this Change. `templates/specboot/`
  additions are visible files, never read or copied by any command.

## Acceptance Criteria

- [x] `discoverAiSpecs(cwd)` on a project with no `ai-specs/` returns `present: false`, empty
      arrays, no exception.
- [x] `discoverAiSpecs(cwd)` on a project with `ai-specs/skills/*.md` and
      `ai-specs/standards/*.md` returns both arrays populated with correct id/content/state.
- [x] `discoverAiSpecs(cwd)` on a project with only `ai-specs/skills/` (no `standards/`) returns
      `standards: []`, no error — and vice versa.
- [x] A resource directory (`ai-specs/skills` or `ai-specs/standards`) that exists as a file
      instead of a directory is reported with `state: "read_error"`, never thrown.
- [x] Two files resolving to the same id within one directory are reported: the first as normal,
      the second with `state: "duplicate"`.
- [x] An empty `.md` file is reported with `state: "empty"`.
- [x] `resolveResources(builtins, projectResources)`: a project id matching a built-in id resolves
      to the project's resource, with a warning naming the override.
- [x] `resolveResources()`: a project-only id is added with no warning.
- [x] `resolveResources()`: a `read_error`/`duplicate`/`empty` project resource does not override
      its built-in counterpart (or add itself, if project-only) — a warning is recorded and the
      built-in (or nothing) is kept.
- [x] `resolveResources([], [])` returns an empty result with no warnings (degenerate case).
- [x] Determinism: calling either function twice with the same inputs yields identical output.
- [x] Full CLI test suite passes; `aief verify` and `aief status` output are unchanged (nothing in
      this Change is imported by any existing command).
