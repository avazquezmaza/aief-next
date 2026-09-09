# Change

## ID

`0128-architecture-fitness-functions-for-layer-boundaries`

## Type

Fix

## Objective

`docs/architecture.md` documents a layer model (CLI Commands → Application Services → Domain
Models / Registries & Providers → Repository) as prose only — nothing prevents a future edit
from quietly reversing a dependency (e.g. a Domain Model importing a Service). An external
audit recommended making this executable: "Architecture documentation becomes Architecture
executable constraints," suggested as ESLint rules plus import tests, specifically now that the
CLI's own big refactor (Commands → Services → Domain, confirmed in Change 0126's docs-drift
fix) has already landed.

Verified before implementing: the repository already has **zero violations** of the two
clearest layer rules (Domain Models never import Services or Commands; Services never import
Commands) — confirmed by grepping every `^import` line in `cli/src/core/domain/*.js` and
`cli/src/core/services/*.js` for a match against `services`/`commands`. This Change makes that
already-true property enforced, not merely documented.

Also enforces a related, already-stated invariant found in `docs/architecture.md`/`AGENTS.md`
prose: Hooks are observation-only, never execution — verified with zero existing violations
the same way (grepped every `hooks/*.js` for a filesystem-mutating call).

## Scope

### In scope

- `cli/eslint.config.js`: three new fitness rules, scoped by `files` glob, no new dependency
  (ESLint's own built-in `no-restricted-imports` and `no-restricted-properties` — no plugin):
  1. Domain Models (`src/core/domain/**`) must not import Application Services
     (`src/core/services/**`) or CLI Commands (`src/commands/**`).
  2. Application Services (`src/core/services/**`) must not import CLI Commands
     (`src/commands/**`).
  3. Hooks (`src/hooks/**`) must not call a filesystem-mutating `fs` method (`writeFileSync`,
     `appendFileSync`, `unlinkSync`, etc.) — reading is unaffected.
- `cli/tests/architecture-fitness.test.js`: exercises the ESLint config itself (via its Node
  API) against synthetic probe source for each rule — both the violation and the legitimate
  case — plus one test confirming the real `cli/src` tree has zero violations today.

### Out of scope

- The Registries/Providers layer's relationship with Services: grepping found `hooks/` and
  `verification-rules/` files that legitimately import from `core/services/` (e.g. a pure
  function reused across layers) — the diagram's strict one-directional arrow does not hold
  there today, and resolving that is a separate design question, not a fitness function to add
  blindly. Not touched by this Change.
- `verification-rules/` executing shell commands — the audit's suggestion, but no violation
  exists to guard against and no dedicated npm script/rule was designed for it in this pass;
  candidate for a future, separately-scoped Change.
- Any refactor of existing code — this Change adds guardrails only; zero violations exist
  today, so zero application-code files change.

## Success Criteria

- `npm run lint` still passes cleanly on the unmodified `cli/src` tree (the new rules find
  nothing, because nothing violates them).
- A synthetic probe file violating each of the three rules is confirmed, by an automated test
  (not a manual check), to fail lint with a clear, rule-specific message naming
  `docs/architecture.md`'s layer model.
- A synthetic probe file exercising the legitimate case for each layer is confirmed clean.
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0128-architecture-fitness-functions-for-layer-boundaries --strict`, and `git diff --check` all pass.

## Status

Closed (2026-09-09)
