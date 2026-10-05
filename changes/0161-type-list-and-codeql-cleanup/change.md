# Change

## ID

`0161-type-list-and-codeql-cleanup`

## Type

Fix

## Objective

Two cleanups from the pending list after 4.2.0 (Analysis 0154 A8, and the CodeQL alerts open on
`main`):

- `## Type` becomes a closed list. Real projects write free text, and a Spanish "Definición" was not
  recognized as a Definition Change, so `aief prompt` gave it the general prompt (which allows
  implementation) instead of the Definition guards.
- The four CodeQL alerts open on `main` are resolved.

## Decision (human)

The owner chose on 2026-10-05: a closed list with Spanish aliases, the first word deciding, an
unknown value as a `verify --strict` notice (not an error); and excluding `changes/**/fixtures/**`
from CodeQL rather than dismissing the alerts or changing a closed study's fixtures.

## Scope

### In scope

- Closed list: General, Analysis, Definition, Enrichment, Fix, Feature, Documentation. First word
  decides, case and accents ignored; aliases Definición, Análisis, Enriquecimiento, Corrección,
  Arreglo, Bugfix, Funcionalidad, Documentación, Docs, Implementation, Implementación.
- `verify --strict` notice for an unknown value.
- CodeQL alerts 5 and 6 (incomplete escaping in two tests): plain substring checks.
- CodeQL alerts 2 and 3 (no rate limiting in Change 0096's deliberately flawed sample apps):
  `paths-ignore: changes/**/fixtures/**` in a CodeQL config file.

### Out of scope

- Editing any project's or historical Change's `## Type`.

## Success Criteria

- "Definición" gets the Definition prompt; "Build" gets a strict notice; known values are silent.
- No open CodeQL alert on `main` after merge.
- `npm test`, `npm run lint` and `aief verify --strict` pass.

## Status

Closed (2026-10-05)
