# Design

## 1. Module placement

`cli/src/core/domain/ai-specs.js` — mirrors Change 0043's own precedent ("extend `core/domain/`,
not create a new top-level folder" for a small, boundary-light domain concept). No registry, no
provider list, no plugin loading: this is two pure functions, not a family of interchangeable
implementations like `sdd-providers/`/`requirement-providers/`.

## 2. Discovery contract

```text
discoverAiSpecs(cwd) -> {
  present: boolean,       // <cwd>/ai-specs exists
  root: string,           // <cwd>/ai-specs (always returned, even when absent, for diagnostics)
  skills: Resource[],     // from ai-specs/skills/*.md, [] if absent or ai-specs itself absent
  standards: Resource[]   // from ai-specs/standards/*.md, [] if absent or ai-specs itself absent
}

Resource = {
  id: string,             // filename stem, e.g. "code-review.md" -> "code-review"
  path: string,           // absolute path to the file
  state: "present" | "empty" | "read_error" | "duplicate",
  content: string | null, // full file text when state is "present"; null otherwise
  diagnostic: string | null // human-readable reason, set for empty/read_error/duplicate
}
```

`.md` files only (case-insensitive extension match), sorted by filename for deterministic
ordering — the same discipline `openspec.js`'s `resolveSpecifications()` already uses ("never the
raw filesystem readdir order").

A directory that cannot be listed (`fs.readdirSync` throws — the concrete case this Change tests
is a `.md` "file" that is actually a directory, giving `ENOTDIR`) yields a single synthetic
`{ id: null, path: dir, state: "read_error", diagnostic }` entry for that resource type, mirroring
`openspec.js`'s `resolveSpecifications()` read-error precedent — never an uncaught exception.

Duplicate ids within one directory (two filenames whose stem collides — same-case collision is
impossible on one filesystem listing, but a case-sensitive filesystem can have `foo.md` and
`foo.MD` as two distinct dirents) are resolved in filename-sort order: the first occurrence is
kept as `present`/`empty`/`read_error` normally; every subsequent occurrence sharing that id is
reported as `state: "duplicate"` and excluded from precedence resolution (R3/R7's "excluded"
clause covers this state too).

## 3. Resolver contract

```text
resolveResources(builtins, projectResources) -> {
  resources: ResolvedResource[],
  warnings: string[]
}

ResolvedResource = { id: string, source: "builtin" | "project", value: object }
```

Algorithm (single pass, `Map` keyed by id, insertion order preserved from `builtins` then
`projectResources`):

1. Seed the map from `builtins` — every entry with a string `id` becomes `{ source: "builtin",
   value: builtin }`.
2. For each `projectResources` entry, in order:
   - `state` is `read_error` or `duplicate` → push a warning, do not touch the map (R7).
   - `state` is `empty` → push a warning naming the project path, do not touch the map (R7) —
     an empty file must not silently blank out a working built-in, and must not be added as a
     usable project-only resource either.
   - `state` is `present` → if the map already has this id, push an override warning naming the
     id and the project's file path, then overwrite the map entry to `{ source: "project", value:
     projectResource }` — the built-in's object is discarded whole, never merged field-by-field
     (R5). If the id is new, insert it as `{ source: "project", value: projectResource }` with no
     warning (R6).
3. Return `{ resources: [...map.values()], warnings }`.

No sorting is imposed on the output order beyond "insertion order" (builtins first, in their
given order, then new project-only ids in filename order) — deterministic, but not a contract a
caller should rely on for anything beyond "same inputs, same order" (R8).

## 4. Why generic over `builtins`

Coupling this function to the Skill Catalog's actual shape (`detector`, `signal`, `promptContext`,
...) or to `knowledge/standards/`'s file-list convention would require touching `detect.js` or
`cli.js` to prepare that exact shape — and this Change's commissioning instruction forbids any
change to those files. A generic `{ id, ...anything }` contract lets this module be built, tested,
and reviewed completely on its own; a future wiring Change passes whatever shape it needs (e.g.
`skillsCatalog.skills.map(s => ({ id: s.id, ...s }))`) without this module changing.

## 5. `templates/specboot/` additions

- `templates/specboot/README.md` — documents the `ai-specs/skills/*.md` /
  `ai-specs/standards/*.md` convention this module reads, the project-wins precedence rule, and
  states explicitly that nothing in AIEF copies these files or auto-generates them today (honest
  about the unwired state — no promise of behavior that doesn't exist yet).
- `templates/specboot/ai-specs/skills/example-skill.md`, `.../standards/example-standard.md` —
  minimal, illustrative content only; never read or copied by any command (they are reference
  material for a human setting up a LIDR-style project by hand, exactly like
  `templates/specboot/agent-file.md`/`profile-prompt.md` already are today).

## 6. Testing strategy

All tests are unit tests directly against `discoverAiSpecs`/`resolveResources` using
`fs.mkdtempSync` fixtures (same pattern as `sdd-provider-registry.test.js`) — no CLI process
spawning needed, since nothing in the CLI calls this module. This directly covers every scenario
the commissioning instruction lists (no `ai-specs/`, with `ai-specs/`, skills loaded, standards
loaded, override, duplicate ids, correct precedence, read errors, incomplete directories,
non-interactive — the last is trivially satisfied since the module never touches stdin/TTY, which
one test asserts explicitly by calling it synchronously with no stdin fixture at all).

## 7. Risks

- **Filename-as-id is a simple, possibly-too-simple contract.** Accepted deliberately (design.md
  §4/ADR-023's alternatives) — no real `ai-specs/` sample exists in this repository to justify a
  richer schema (front-matter, detector predicates) yet; evidence-first (ADR-008).
- **Case-sensitivity of "duplicate" detection is filesystem-dependent** (a case-insensitive
  filesystem would never surface `foo.md`/`foo.MD` as two dirents in the first place — the
  duplicate path is instead reached deterministically in this Change's tests via the OS's own
  behavior, not simulated).
