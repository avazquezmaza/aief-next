# Tasks

## Design (this Change)

- [x] Inspect `templates/specboot/` (current: `agent-file.md`, `profile-prompt.md` only, unused
      by any command), `cli/src/skills-catalog.json`, `cli/src/detect.js`'s `recommendSkills()`,
      `cli.js`'s `listStandards()`/`createStandards()`, and `sdd-providers/openspec.js`'s
      `resolveSpecifications()` (read-error precedent to reuse).
- [x] Confirm no existing module already does ai-specs discovery (grep for "ai-specs" across the
      repo — none found outside historical Change 0018 notes and Change 0052's own docs).
- [x] Write ADR-023 (new architectural boundary, unwired this Change) and confirm it does not
      implicate ADR-015.
- [x] Write `change.md`, `spec.md`, `design.md`, `tasks.md`.

## Implementation

- [x] `cli/src/core/domain/ai-specs.js`: `discoverAiSpecs(cwd)`, internal
      `discoverResourceDir(dir)` (present/empty/read_error/duplicate states, sorted, never
      throws), `resolveResources(builtins, projectResources)` (project-wins precedence, warnings,
      never merges; directory-level read errors surfaced as warnings too).
- [x] `templates/specboot/README.md`: documents the `ai-specs/` convention, the precedence rule,
      and the honest "not wired into any command yet" status.
- [x] `templates/specboot/ai-specs/skills/example-skill.md`: minimal illustrative content.
- [x] `templates/specboot/ai-specs/standards/example-standard.md`: minimal illustrative content.

## Tests

New file `cli/tests/ai-specs.test.js` (fixture pattern from `sdd-provider-registry.test.js`),
registered in `cli/package.json`'s `test` script:

- [x] `discoverAiSpecs`: no `ai-specs/` → `present: false`, empty arrays, no throw.
- [x] `discoverAiSpecs`: `ai-specs/skills/*.md` and `ai-specs/standards/*.md` both present → both
      arrays populated with correct id/content/state `"present"`.
- [x] `discoverAiSpecs`: only `skills/` present (no `standards/`) → `standards: []`; and the
      reverse — no error either way ("directorios incompletos").
- [x] `discoverAiSpecs`: a resource directory that is actually a file → that resource type reports
      `state: "read_error"`, no throw (design note: a stray `.md`-named subdirectory inside a
      resource dir is correctly filtered out by `isFile()`, not a read error — the real ENOTDIR
      case is the resource directory itself being a file).
- [x] `discoverAiSpecs`: two filenames colliding on id (`foo.md`, `foo.MD`) → first `"present"`,
      second `"duplicate"`.
- [x] `discoverAiSpecs`: an empty `.md` file → `state: "empty"`.
- [x] `resolveResources`: project id overrides a matching built-in id → resolved entry is the
      project's, `source: "project"`, one warning naming the id and path; built-in fields verified
      absent from the resolved entry (never merged).
- [x] `resolveResources`: project-only id (no built-in match) → added, `source: "project"`, no
      warning.
- [x] `resolveResources`: `read_error`/`duplicate`/`empty` project resources never override their
      built-in counterpart (built-in kept, or nothing added if project-only) — one warning each;
      a directory-level (`id: null`) read error also produces its own warning.
- [x] `resolveResources([], [])` → `{ resources: [], warnings: [] }`.
- [x] Determinism: `discoverAiSpecs`/`resolveResources` called twice with identical inputs →
      identical output (deep-equal).
- [x] Non-interactive: both functions run synchronously to completion with no stdin/TTY
      involvement (documented assertion).
- [x] Ran `cd cli && npm test`: **560/560 passing** (543 pre-existing + 17 new), 0 regressions.

## Documentation

- [x] `templates/specboot/README.md` (new) — no existing doc (`getting-started.md`, `cli.md`,
      `workflow.md`, `concepts.md`) needed editing, per the "no CLI flow change" constraint
      (confirmed: `aief status`/`aief verify` output unchanged except for the new Change itself
      appearing, as expected).

## Close

- [x] `evidence.md`: test run transcript, confirmation that `aief verify`/`aief status`/full CLI
      suite are unchanged, list of new files.
- [x] Verified every acceptance criterion in `spec.md`.
- [x] `aief close --yes --change 0053-lidr-integration`.
