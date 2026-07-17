# Tasks

## Review method

- [x] Define reference classes: LIVE · CODE · HISTORICAL · SELF — the distinction that decides each verdict.
- [x] Use recursive `grep -r` across the whole repo; no non-recursive globs.
- [x] Search all nine surfaces: code, tests, documentation, templates, CLI, examples, workflows, ADRs, Changes.
- [x] Record every command used.
- [x] Apply "any doubt → ARCHIVE".
- [x] Treat closed Changes as historical records, never as blockers, never rewritten.

## Per-item records

- [x] R1 `aief propose` — **KEEP** (ADR-002 + Change 0030 + 9 tests + enrichment continuation).
- [x] R2 `docs/navigator/` (22 files) — ARCHIVE.
- [x] R3 `starter-project/` (20 files) — ARCHIVE (unique artifacts found).
- [x] R4 `NAVIGATOR.md` — ARCHIVE (coupled to R2).
- [x] R5 `docs/index.md` — MERGE.
- [x] R6 three tombstones — KEEP.
- [x] R7 `use-profile` — ARCHIVE (demote).
- [x] R8 `release` — ARCHIVE (demote).
- [x] R9 `Understand → Plan → Build` — MERGE.
- [x] R10–R14 dead templates + placeholder — DELETE confirmed.

## Evidence checks performed

- [x] Confirm `aief propose --change` is the documented enrichment continuation path (`docs/enrichment-workflow.md:61`, Change 0030 spec §26).
- [x] Confirm ADR-002 names `aief propose` (`knowledge/decisions.md:104`).
- [x] Count `propose` tests → 9.
- [x] Confirm `templates/change-types/analysis/evidence.md` duplicates `evidenceTemplate()` (`cli/src/cli.js:336`).
- [x] Confirm `adopt` generates no PR/issue templates (`grep -c` → 0) — starter-project holds unique artifacts.
- [x] Confirm `navigator/install/windows.md` carries PowerShell-specific content absent from `bootstrap.md`.
- [x] Confirm the three canonical docs back-reference their own tombstones.
- [x] Confirm Change 0026 declared deleting `starter-project/`, `specs/` and navigator out of scope.
- [x] Confirm `cli/src/cli.js:692` couples `status` to the Navigator ⚙.

## Verification

- [x] `aief verify` passes on this Change.
- [x] Nothing deleted, renamed, archived or moved.
- [x] No code changed.
- [x] OpenSpec and SpecBoot untouched.

## Evidence

- [x] Update evidence.md.

## Human gates

- [x] (review) Independent second reader (no access to the map) reviewed R1–R6 → 0 of 6 deletable. Matrix in evidence.md.
- [x] (human) R1 confirmed KEEP (decision 2026-07-17).
- [x] (human) R6 decided KEEP (decision 2026-07-17).
- [x] (review) Second reader for **R10–R14** (dead templates) → 4 of 5 consensus Candidate DELETE (R10/R11/R13/R14), R12 → ARCHIVE. Matrix in evidence.md.
- [x] (human) Map ratified as a *classification* map, not a delete authorization (2026-07-17, ADR-014).
- [ ] Execution of the R10/R11/R13/R14 Approved DELETEs — deferred by instruction; a later, separate Change.

## Deferred

- [-] Link validation on a temporary copy — belongs to the execution Change; nothing has moved yet.
- [-] Onboarding cluster content review — last, and by hand, per the approved order.
- [-] A separate Change to consider merging starter-project's PR/issue templates and knowledge samples into `adopt` (R3).
