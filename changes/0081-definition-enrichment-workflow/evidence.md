# Evidence

## Summary

Added `analyzeDefinitionSections()` — a deterministic, marker-driven classifier of a Definition
Change's own content into Known/Missing/Ambiguous/Decision required/Human approval
required/Deferred — surfaced through `aief status --change <id>` and explained in `aief prompt`.
No new command, no writes, no overlap with the existing `aief enrich` (Jira/manual) capability.

## Activities Performed

- Added `cli/src/core/domain/definition-enrichment.js`: `DEFINITION_SECTIONS` (the 18 headings
  Change 0079's scaffold writes) and `analyzeDefinitionSections(changeMd)`, combining section-level
  placeholder detection with item-level marker scanning (`(deferred)`, `(ambiguous)`,
  `(decision required)`, `(human)`).
- Added `cli/tests/definition-enrichment.test.js`: 9 unit tests covering the fresh-scaffold case,
  a filled section, a real `Decision (human)` entry, each marker in isolation, the
  no-inference-from-prose guarantee, and CRLF tolerance.
- Added `printDefinitionReadiness()` in `cli.js`, wired into `statusSingleChange()` right after the
  existing Harness block — active only when the Change's `## Type` is `Definition`, printing a
  literal `known/total` section count plus every non-empty marker bucket. No fabricated
  percentage/quality score.
- Extended the Definition instruction block in `prompt()` (Change 0079) with the marker convention
  and a pointer to `aief status --change` for the readiness view.
- Added 5 CLI-level tests in `cli.test.js`: fresh Definition Change (0/18, all missing), a
  partially-filled one exercising all four markers together, a non-Definition Change (regression
  guard — block absent), and the updated prompt instructions.

## Verification

- `node --test cli/tests/definition-enrichment.test.js` — 9/9 pass.
- `node --test --test-name-pattern="status --change on a"` — 3/3 pass; plus the prompt marker test
  run separately — pass.
- `npm test` (full suite) — 873/873 pass, 0 fail (860 before this Change + 13 new).
- `node cli/bin/aief.js verify` — Result: PASS.
- `git diff --check` — clean.
- Confirmed via full-suite run that every existing `aief enrich manual|jira` test still passes
  unmodified — this Change touches no requirement-provider code.

## Findings

- Framing this as an additive `aief status --change` block (rather than a new `aief enrich
  definition` verb) avoided the exact ambiguity the commissioning brief's own adversarial-review
  list warned about ("Can existing Jira enrichment become ambiguous with Definition enrichment?").
  "Enrichment" stays a single concept (external, read-only, Jira/manual) at the command-verb level;
  this Change's classification of a Definition Change's own content is presented as a readiness
  view, not a second Enrichment.

## Risks

- The marker convention depends on the human/assistant actually writing `(deferred)` /
  `(ambiguous)` / `(decision required)` / `(human)` — an unmarked ambiguous item stays invisible to
  `aief status`. This is the deliberate trade-off (explicit over implicit, no prose-guessing); the
  updated `prompt()` instructions are the primary mitigation.

## Recommendations

- Change 0083 (`aief verify --strict`) could reuse `analyzeDefinitionSections()`'s `missing` list
  as one of its objective-incompleteness checks for Definition Changes, rather than re-deriving
  section emptiness.

## Artifacts Produced

- `cli/src/core/domain/definition-enrichment.js`
- `cli/src/cli.js`: `printDefinitionReadiness()`, `statusSingleChange()` wiring, updated
  Definition prompt block.
- `cli/tests/definition-enrichment.test.js` (new), `cli/tests/cli.test.js` (+5 tests).
- `changes/0081-definition-enrichment-workflow/`.

## Lessons Learned

- Reusing an existing read-only inspection command (`aief status --change`) for a new, narrowly
  scoped view is cheaper to reason about under ADR-013 than adding a flag to a command whose name
  ("enrich") already carries a different, established meaning in this codebase.

## Next Change

Change 0082 — maturity-aware standards ("Applies now" / "Applies once implementation starts").
