# Tasks

## Implementation

- [x] Verify zero existing violations for all three rules before writing them (grep every
      `^import` line in `core/domain/`/`core/services/`, and every `fs.<mutator>` call in
      `hooks/`).
- [x] Add the Domain-Models-vs-Services/Commands `no-restricted-imports` block (R1).
- [x] Add the Services-vs-Commands `no-restricted-imports` block (R2).
- [x] Add the Hooks-observation-only `no-restricted-properties` block (R3).

## Documentation

- [x] Header comment in `eslint.config.js` explains the fitness-function intent and points to
      `docs/architecture.md`.

## Verification

- [x] `cli/tests/architecture-fitness.test.js`: violation + clean case per rule, plus a
      whole-tree zero-violations test (R6).
- [x] Run `npm test`, `npm run lint`, `git diff --check`.
- [x] Run `node cli/bin/aief.js verify --change 0128-architecture-fitness-functions-for-layer-boundaries --strict`.

## Evidence

- [x] Update evidence.md
