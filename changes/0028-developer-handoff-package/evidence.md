# Evidence

## Summary

Developer handoff package created on 2026-07-06 to close the validation phase and prepare AIEF for developer-team pilot use at **pre-1.0 internal-pilot** readiness. Documentation-only: five new docs, one README section, one CHANGELOG entry, and this Change. No runtime, CLI, ADR or architectural changes; 1.0 is not declared.

## Activities Performed

- **`docs/TEAM-USAGE-GUIDE.md`** — operational guide: what AIEF is / is not, when to use / not use, required tools, first-time setup, adopting an existing project, starting a Change, generating a prompt, working manually with Claude/Gemini/Codex/Cursor, capturing evidence, verifying, closing, common mistakes, and required human review points. Uses the real CLI commands and flags (`doctor`, `init`/`adopt`, `verify`, `analyze`, `new-change`, `prompt <assistant>` with `--profile`, `close --yes`). Flags the known pilot seam limitations (context not auto-flowing, silent duplicates, prompt referencing missing files) with pointers to the roadmap.
- **`docs/VALIDATION-SUMMARY.md`** — greenfield (Spring Boot + Camel + Java 21 + OpenAPI + tests) and brownfield (trk-orchestrator-portal) results, what worked, remaining friction grouped into the four seams, current approval status, allowed vs forbidden uses. Notes the full `architecture-review.md` files live in the validation repos.
- **`docs/AIEF-1.0-READINESS.md`** — current status pre-1.0 internal pilot; conditions for 1.0; the four required Workflow Cohesion fixes; a checkbox Definition of Done; Go/No-Go criteria; explicit statement that 1.0 is not declared.
- **`docs/DEVELOPER-CHECKLIST.md`** — one-page checklist: before starting, during Change, before implementation, before close, before commit/push.
- **`docs/ROADMAP-TO-1.0.md`** — frozen roadmap containing only the four workstreams (unified Change identity; context flow; prompt reality consistency; closability/verify contract) with explicit deferrals (Operational Profiles, full SpecBoot live integration, MCP, VS Code extension, GitHub Action, npm publication, assistant-native execution automation).
- **`README.md`** — added a "Current Status" section near the top (pre-1.0 pilot; guided internal use; one greenfield + one brownfield validation; not yet 1.0; links to the usage guide and readiness doc).
- **`CHANGELOG.md`** — entry for Change 0028 under Unreleased.

## Verification

```
npm test                                 -> 50 tests, 50 pass, 0 fail
aief verify                              -> PASS (after this evidence.md written)
git status (runtime paths)               -> no changes under cli/, adapters/, profiles/, templates/
relative link check (5 new docs + README)-> 0 broken
accepted ADRs (knowledge/decisions.md)   -> unmodified
"1.0" declaration                        -> none (readiness doc explicitly states 1.0 not declared)
```

Baseline before the Change: `aief verify` PASS, `npm test` 50/50. Interim `verify` reported FAIL only because `evidence.md` was not yet written (expected); it returns PASS once this file exists.

## Findings

- The four remaining frictions from both validations collapse cleanly into four Workflow Cohesion workstreams; the handoff docs and the roadmap share one vocabulary so a developer reading the usage guide and the roadmap sees the same four seams.
- No runtime change was needed to make the usage package coherent — the CLI commands already support the documented flow (validated by reading `aief help` for each command and by the green test suite).

## Risks

- None to runtime: no logic touched (verified via git status over `cli/`, `adapters/`, `profiles/`, `templates/`).
- Documentation risk: the docs describe pilot limitations that will change once Workflow Cohesion lands; the roadmap and readiness docs are the single place those statuses are tracked, so future Changes update them rather than every doc.

## Recommendations

- Sequence the four workstreams (identity → context flow → closability → prompt reality) as separate Changes; update `docs/AIEF-1.0-READINESS.md` Definition-of-Done checkboxes as each closes.
- Re-run both validations before flipping any Go/No-Go, per the readiness doc.

## Artifacts Produced

- New: `docs/TEAM-USAGE-GUIDE.md`, `docs/VALIDATION-SUMMARY.md`, `docs/AIEF-1.0-READINESS.md`, `docs/DEVELOPER-CHECKLIST.md`, `docs/ROADMAP-TO-1.0.md`.
- Edited: `README.md` (Current Status section), `CHANGELOG.md` (0028 entry).
- `changes/0028-developer-handoff-package/` (this Change: change.md, spec.md, tasks.md, evidence.md).

## Lessons Learned

- Packaging for handoff is mostly a naming-and-boundaries exercise: the value was in stating plainly what AIEF is approved for and what it is not, and freezing the roadmap to four items so the pilot does not drift into feature work.

## Next Change

First Workflow Cohesion workstream: unified Change identity (disconnected stores, silent duplicates, active-Change selection).
