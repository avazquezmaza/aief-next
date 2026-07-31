# Change

## ID

`0053-lidr-integration`

## Type

General

## Objective

First, deliberately narrow step of LIDR integration: let AIEF **discover and resolve** resources
from a LIDR/specboot-style project's `ai-specs/` directory (`skills/`, `standards/`) against
AIEF's own built-ins, without ever copying a file — "AIEF consume LIDR, nunca lo copia."

This Change does **not** implement all of LIDR. It builds one small, self-contained, correct
domain module (discovery + precedence resolver) and the templates describing the convention. It
does **not** wire that module into any existing command — `aief bootstrap`, `aief analyze`,
`aief prompt` and every other command are byte-for-byte unchanged, with or without a project's
`ai-specs/` directory present. Wiring is explicitly deferred to a later Change (see "Out of
scope").

Governance: [ADR-023](../../knowledge/decisions.md#adr-023-ai-specs-resources-are-discovered-and-resolved-against-aiefs-built-ins-never-copied-project-always-wins-on-id-collision-unwired-dormant-this-change)
records this boundary. ADR-015 is not implicated (no new command, no onboarding change, no
documentation simplification) — its freeze is neither invoked nor needed here.

## Scope

### In scope

- `cli/src/core/domain/ai-specs.js`: `discoverAiSpecs(cwd)` (finds `ai-specs/skills/*.md` and
  `ai-specs/standards/*.md`, filename stem as id) and `resolveResources(builtins,
  projectResources)` (generic precedence merge: project wins on id collision, warns, never
  merges fields; absent `ai-specs/` is a no-op).
- `templates/specboot/`: a `README.md` documenting the `ai-specs/` convention this module reads,
  plus one example skill and one example standard template file (visible, not auto-copied by any
  command).
- Unit tests for the new module only.

### Out of scope (explicitly, per commissioning instruction)

- Wiring `discoverAiSpecs`/`resolveResources` into `recommendSkills()`, `listStandards()`,
  `bootstrap`, `analyze`, or `prompt` — a later, separately-scoped Change.
- LIDR runtime, spec generation, Harness, Loop, Graph Engineering.
- New commands, UX changes, automatic migrations, caching, synchronization, watchers, plugins.
- Any change to `cli/src/cli.js`'s command dispatch or observable output.
- Any change to Change 0052's `bootstrap`/SDD Provider behavior.

## Status

Closed (2026-07-30)
