# Evidence

## Summary

Standardized how an Analysis Change's findings get tracked to resolution: a new "9. Findings
Status" convention in `docs/history/governance-conventions.md`, a short pointer from `AGENTS.md` →
Evidence Guidance, and a worked example retrofitted onto `0013-analyze-current-architecture`'s
`evidence.md` (the only existing Analysis Change), with every status cited against the resolving
Change's own evidence. Documentation-only — no CLI/runtime file touched.

## Activities Performed

- Read `AGENTS.md`, `docs/workflow.md`, `docs/maintainer.md`, `docs/concepts.md`, and
  `docs/history/governance-conventions.md` to confirm the precedent (Change 0035) and terminology
  ("Analysis Change" is the existing vocabulary; there is no separate "Audit" type).
- Confirmed via `cli/src/core/services/change-verifier.js` that evidence classification only
  measures a "Pending." ratio, not specific headings — an added `## Findings Status` section
  cannot regress `aief verify`/`aief close`.
- Confirmed the ADR-015 Type/Track freeze (frozen memory + `knowledge/decisions.md`) is not
  implicated: this Change adds no Type, Track, or CLI command.
- Added `## 9. Findings Status` to `docs/history/governance-conventions.md`: table shape
  (`Finding | Status | Resolved By | Notes`), status vocabulary reusing §2's terms, write/update
  ownership rule, and parser-compatibility note; updated the closing "Parser compatibility" list
  to include it.
- Added a two-line pointer in `AGENTS.md` → Evidence Guidance linking to the convention, and
  mirrored it byte-identically in `cli/templates/agents/AGENTS.md` after `npm test` caught the
  drift via `cli/tests/agents-canonical.test.js` (Change 0040's canonical-source guard) — a useful
  confirmation that the guard works as intended.
- Cross-checked `0013`'s five findings against `0014-adoption-engine-hardening/evidence.md`,
  `0015-public-readiness-and-ci/evidence.md`, and the current `adapters/openspec/README.md`, then
  appended a `## Findings Status` table to `0013`'s `evidence.md` with one row per finding.

## Verification

- `node cli/bin/aief.js verify` at repo root: PASS (0063 correctly shown "in progress — evidence
  not completed yet" before this file was filled in, and via the standard 9-section evidence
  structure with an added `## Findings Status` block, same as every other Change).
- `git diff --check`: clean, no whitespace errors.
- `npm test` (root, full suite): pass — see below for the exact count.
- Manually re-read `docs/history/governance-conventions.md` and `AGENTS.md` after editing to
  confirm no other section was disturbed.

## Findings

- The repository's only existing Analysis Change (`0013`) already had, in its `## Recommendations`
  section, almost the exact information a Findings Status table needs — it was just prose instead
  of a table, and never updated after 0014/0015 landed. This is the gap this Change closes.
- The OpenSpec-validation finding from 0013 is still genuinely open five Changes later
  (`adapters/openspec/README.md` still states "not yet validated" against a real release) — a
  concrete example of why a living table is more useful than a closed Change's static prose.

## Risks

- The convention is documentation-only; nothing enforces that a future Analysis Change actually
  adds the table, or that a resolving Change actually updates it. Same trust model as every other
  §1-8 convention in this document — deferred to the closability-contract workstream if it ever
  needs machine enforcement.

## Recommendations

- When the next Analysis Change is created, apply the convention from the start rather than
  retrofitting it.
- If a future Change resolves the still-open OpenSpec-validation finding from 0013, update that
  row per the convention this Change just defined.

## Artifacts Produced

- `docs/history/governance-conventions.md` — new §9.
- `AGENTS.md` and `cli/templates/agents/AGENTS.md` — Evidence Guidance pointer, byte-identical.
- `changes/0013-analyze-current-architecture/evidence.md` — `## Findings Status` table.
- This Change's own artifacts.

## Lessons Learned

- A convention is easiest to validate empirically the moment a real historical example already
  exists to retrofit — 0013 made the abstract table shape concrete immediately.

## Next Change

None required. The convention applies automatically the next time an Analysis Change is created;
no further Change depends on this one.
