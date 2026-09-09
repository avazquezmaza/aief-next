# Evidence

## Summary

`docs/architecture.md`'s layer model (CLI Commands → Application Services → Domain Models →
Repository) is now enforced by `npm run lint`, not only documented, via three ESLint fitness
functions added with no new dependency. Verified zero existing violations before writing each
rule; all three are exercised by an automated test file, not a manual check.

## Activities Performed

- Grepped every `^import` line in `cli/src/core/domain/*.js` and `cli/src/core/services/*.js`
  for a match against `services`/`commands` before writing any rule — confirmed zero real
  violations (only comments mention the service layer by name; no actual `import` does).
- Grepped every `cli/src/hooks/*.js` file for a filesystem-mutating `fs` call — confirmed zero.
- Added to `cli/eslint.config.js` (no new dependency — ESLint core's own
  `no-restricted-imports`/`no-restricted-properties`):
  1. Domain Models (`src/core/domain/**`) forbidden from importing Application Services or
     CLI Commands.
  2. Application Services (`src/core/services/**`) forbidden from importing CLI Commands.
  3. Hooks (`src/hooks/**`) forbidden from calling any filesystem-mutating `fs` method.
- Added `cli/tests/architecture-fitness.test.js` (8 tests): exercises the ESLint config via its
  Node API against synthetic, in-memory probe source for the violating and the legitimate case
  of each rule, plus a whole-tree test confirming the real `cli/src` has zero violations.
- Manually confirmed each rule fires (before writing the automated test) by linting throwaway
  probe files with `npx eslint` directly, then deleting them — the automated test in
  `architecture-fitness.test.js` supersedes that manual step for future runs.

## Verification

- `npm test` (cli/): 1079/1079 passed (8 new).
- `npm run lint`: clean — the new rules find nothing on the current tree, confirming R5.
- `node cli/bin/aief.js verify --change 0128-architecture-fitness-functions-for-layer-boundaries --strict`: PASS.
- `git diff --check`: clean.

## Findings

- The Registries/Providers layer (Hooks, Verification rules) does **not** cleanly follow the
  diagram's strict one-directional arrow: `hooks/post-verify-next-action.js` imports
  `deriveNextAction` from `core/services/workflow-service.js`, and
  `verification-rules/requirement-has-traceability.js` imports from
  `core/services/verification-evidence.js`. Both are real, existing, presumably intentional
  reuse of pure functions — not obviously wrong, but not matching the diagram either. Left
  alone deliberately (see change.md's Out of scope): writing a fitness function against an
  unresolved architectural question would either force an unreviewed refactor or encode the
  wrong rule. Recorded here so it isn't silently forgotten.

## Risks

- None for what shipped. The unresolved Registries-vs-Services relationship (above) is a risk
  only in the sense that it remains undocumented as a deliberate exception — worth a follow-up
  Change if it recurs or grows.

## Recommendations

- If more Registries/Providers files start depending on Services, revisit whether that's an
  accepted, intentional exception to the diagram (and update `docs/architecture.md` to say so
  explicitly) or a drift that should be reversed — don't leave it ambiguous indefinitely.
- The audit's other suggestion (`verification-rules/` forbidden from executing shell commands)
  is a reasonable future addition once/if a concrete case motivates it — no violation exists
  today to guard against, so it wasn't added speculatively here.

## Artifacts Produced

- `cli/eslint.config.js`, `cli/tests/architecture-fitness.test.js`.

## Lessons Learned

- Verifying zero violations before writing a fitness rule — rather than writing the rule and
  seeing what breaks — meant this Change touched no application code at all, keeping it exactly
  as small as "add a guardrail" should be.
- ESLint's own `no-restricted-imports`/`no-restricted-properties` covered every case this
  Change needed without a plugin (e.g. `eslint-plugin-import`'s `no-restricted-paths`) — worth
  checking core rules before reaching for a plugin dependency.

## Next Change

- None required now. See Recommendations for the Registries/Providers question if it recurs.
