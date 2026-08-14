# Evidence

## Summary

Added a first-class `Definition` Change type: a dedicated pre-implementation scaffold plus
matching `aief prompt` guidance. Reuses the existing `## Type` surface, the existing `(human)`
task-marker gate, and `knowledge/decisions.md` — no new command, no new approval mechanism, no
verifier changes.

## Activities Performed

- Added `definitionChangeFiles(id, slug, title)` in `cli/src/cli.js` producing `change.md` /
  `spec.md` / `tasks.md` / `evidence.md` with every section required (Context, Business/Product
  Constraints, Known Requirements, Assumptions, Open Questions, Decisions Required, Options
  Considered, Recommendation, `## Decision (human)`, Rationale, Consequences, NFRs,
  Security & Compliance, Data & Domain, Integrations, Deployment & Operations, Implementation
  Prerequisites, Follow-up Changes).
- Wired `createChange()` to dispatch `options.type === "definition"` to the new scaffold, leaving
  the `analysis`/default branches untouched.
- Added `isDefinition` to `prompt()` with its own instruction block: forbid implementing
  application code, walk through Context → Open Questions → Decisions Required → Options
  Considered → Recommendation, forbid self-filling `## Decision (human)` or self-checking
  `(human)` tasks, and require recording approved decisions in `knowledge/decisions.md`.
- Documented `--type definition` in `aief help new-change` (purpose, when, example).
- `changeType()`/`changeTypeFromContent()` needed no change — already free-text and
  case-insensitive.

## Verification

- `node --test --test-name-pattern="Definition" cli/tests/cli.test.js` — 4/4 pass:
  scaffold creation, prompt instructions, close refusal on unchecked `(human)` task, verify
  parity with other typed Changes.
- `node --test cli/tests/cli.test.js` — 231/231 pass (no regression in Analysis/Enrichment/
  General `new-change`/`prompt`/`verify`/`close` behavior).
- `npm test` (full suite) — 844/844 pass, 0 fail.
- `node cli/bin/aief.js verify` — Result: PASS.
- `git diff --check` — clean (exit 0).

## Findings

- No Definition-specific readiness logic was needed in `checkChangeReadiness()`/
  `verifyProject()`/`verifyChange()` — the existing open-tasks rule already blocks `close` on an
  unchecked `(human)` task, and the existing missing/empty/evidence rules already apply uniformly
  across types. This confirms the doc's own instruction not to build a second approval mechanism.

## Risks

- `--type` still accepts arbitrary free text (e.g. `--type defintion`, misspelled) and silently
  falls back to the generic scaffold, exactly like today's `analysis`/`enrichment` behavior for a
  misspelled value. Out of scope for this Change (would be a behavior change to `--type` itself,
  affecting all three recognized values, not specific to Definition) — noted as a candidate for a
  future Change if it proves to be a real source of confusion.

## Recommendations

- Change 0080 (project maturity detection) should route `aief analyze` to this scaffold when a
  repository is classified `Definition`, rather than introducing a second scaffold-selection path.

## Artifacts Produced

- `cli/src/cli.js`: `definitionChangeFiles()`, `createChange()` dispatch, `prompt()`
  `isDefinition` branch, `new-change` help text.
- `cli/tests/cli.test.js`: 4 new regression tests.
- `changes/0079-add-definition-change-type/`: this Change's own artifacts.

## Lessons Learned

- The `(human)` task-marker convention (already used in Changes 0038/0039/0042/0044) is a
  reusable, zero-code approval gate — worth citing explicitly in future Changes that need human
  governance instead of re-deriving the idea.

## Next Change

Change 0080 — project maturity detection and `aief analyze` routing (Definition / Implemented /
Ambiguous).
