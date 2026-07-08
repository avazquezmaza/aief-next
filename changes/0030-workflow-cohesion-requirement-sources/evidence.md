# Evidence

## Summary

Change 0030 introduces the Requirement Source / Normalized Requirement model and the `aief enrich` command, implemented on 2026-07-08, so AIEF can start a Change from an external requirement (Jira today; Notion, GitHub Issues, Azure DevOps and Markdown planned) without coupling to any specific tool. Only `manual` and a Jira local-export placeholder are implemented; the Human Review Gate and phase-aware `verify` reuse existing AIEF mechanisms rather than adding new ones.

**Architecture Review follow-up (same day):** an Architecture Review Board pass over the initial implementation found three confirmed design gaps and one plausible one — see "Architecture Review Follow-up" below. All four were fixed in this same Change before Architecture Approval: `aief propose --change <id>` now continues an Enrichment Change instead of forking a new one; provider-specific logic moved out of `cli.js` into a `cli/src/requirement-providers/` adapter layer; `docs/Workflow.md` became the canonical home for the enrich workflow (per ADR-011), with `docs/enrichment-workflow.md` deferring to it; Analysis/Enrichment `## Type` detection was deduplicated into one `changeType()` helper.

## Activities Performed

- Created `cli/src/requirement.js`: `PROVIDERS` registry, `providerList()`, `emptyRequirement(provider, sourceId)` (the Normalized Requirement shape), and `normalizeJira(raw, sourceId)` (maps a Jira REST-shaped issue, including ADF descriptions/comments, into the Normalized Requirement).
- Added `aief enrich <provider> <source-id> [--file path]` to `cli/src/cli.js`: provider/source-id validation with loud failure for unknown or not-yet-implemented providers; a duplicate-Change guard (`findChangeBySlugSuffix`) that reuses rather than recreates a Change for the same `provider`/`source-id`; `retrieveRequirement()` (manual — immediate; jira — reads a local export file or falls back to an honest placeholder); `enrichmentChangeFiles()` rendering `change.md` (Requirement Source section, read-only marker, `Requires Human Review` status), `spec.md` (`[H]`/`[I]`/`[S]` classification, Open Questions), `tasks.md` (Human Review checklist first), and real `evidence.md` (not placeholder "Pending." text).
- Wired `enrich` into `main()`, `COMMAND_HELP`, and the `help()` usage banner.
- Extended `aief prompt` to detect an Enrichment Change (`isEnrichmentChange`, CRLF-tolerant, same pattern as the existing Analysis detection) and instruct the assistant: no application code, no touching the source, never mark Human Review tasks itself.
- Made `aief verify` phase-aware: computed `discoveryOnly` (every Change directory is Enrichment or `adopt-aief`) to make `README.md` optional in that phase; added `checkEnrichmentChange()` requiring a Requirement Source section, a "read-only" marker, an Open Questions section, and the `Requires Human Review` status per Enrichment Change.
- Wrote `docs/requirement-sources.md` and `docs/enrichment-workflow.md`; updated `docs/TEAM-USAGE-GUIDE.md`, `README.md` (new section + Commands list) and `CHANGELOG.md`.
- Added 10 new tests to `cli/tests/cli.test.js` covering: manual enrichment content, provider/source-id validation, duplicate-Change prevention, Jira placeholder and real-export normalization, verify's phase-awareness (both directions), the close Human Review refusal, and the prompt no-implementation guidance. Extended the help-coverage test list with `enrich`.

## Architecture Review Follow-up

An Architecture Review Board pass (separate conversation turn, same day) evaluated this Change's initial implementation for separation of concerns, extensibility, and consistency with ADR-010/011/012. Verdict: **not approved** on first pass — 2 confirmed findings, 1 confirmed workflow-continuity gap, 1 plausible finding. All four were fixed here, in this Change, before re-review:

1. **Workflow continuity (`enrich` → Human Review → `propose`), confirmed.** `aief propose` always called `createChange(idea)`, forking a brand-new, disconnected Change even when the documented next step after Human Review was "run `aief propose`" on an already-enriched Change. Fixed by adding `aief propose --change <change-id>` (new `proposeForChange()` in `cli/src/cli.js`): it locates the existing Change, writes/keeps `proposal.md` inside it, and never touches `change.md`/`spec.md`/`tasks.md` — so the Requirement Source, Normalized Requirement, `[H]`/`[I]`/`[S]` classification and Human Review record already there are preserved untouched. `aief propose "<idea>"` without `--change` is unchanged.
2. **Provider logic scattered in `cli.js`, confirmed.** `if (provider === "jira")` appeared in three functions (`retrieveRequirement`, `enrichmentChangeFiles`, `enrich`). Fixed by extracting `cli/src/requirement-providers/{manual.js,jira.js,index.js}`: each provider file implements a uniform `retrieve(sourceId, options) -> { requirement, retrieved, openQuestions, riskNotes, consoleNotes }` contract; `index.js` exposes `retrieveRequirement`/`hasAdapter`/`implementedProviders` as the single registry. `cli.js` now contains zero `provider ===` branches (confirmed by `grep`). `requirement.js`'s `PROVIDERS` lost its `implemented` field (previously a second, driftable source of truth) — `providerList()` now takes an `isImplemented` predicate from the caller.
3. **`docs/Workflow.md` bypassed, confirmed.** The new `docs/enrichment-workflow.md` presented its own standalone nine-step flow diagram, never referenced from `docs/Workflow.md` — the single canonical model ADR-011 requires every other document to summarize, adopted specifically to stop workflow-description fragmentation. Fixed by updating `docs/Workflow.md`'s mermaid diagram, Level 1 text diagram, a new "Starting from a Requirement Source" subsection, and the all-levels lifecycle diagram to include `aief enrich` and `aief propose --change`; `docs/enrichment-workflow.md` was rewritten to defer to it (a small enrich-specific diagram plus an explicit "canonical model is docs/Workflow.md" pointer, not a competing lifecycle).
4. **Duplicated Type-detection regex, plausible.** `isAnalysis` (inline regex in `prompt()`) and `isEnrichmentChange()` (a separate function, 3 call sites) parsed the same `## Type` heading independently. Fixed by adding one shared `changeType(changeDir)` helper next to `isClosed`; both Analysis and Enrichment detection, and `verify`'s `discoveryOnly`/`checkEnrichmentChange` calls, now read through it.

No ADR was modified (ADR-011's requirement was satisfied by making `docs/Workflow.md` canonical, not by changing the ADR itself). No new integrations, no credentials, nothing outside the approved fix scope.

## Verification

```
Initial pass (before Architecture Review):
  npm test -> 59 tests, 59 pass, 0 fail

After the four architecture fixes:
  npm test -> 69 tests, 69 pass, 0 fail
    (59 previous + 5 new propose --change tests in cli.test.js
     + 5 new adapter-contract unit tests in the new cli/tests/requirement-providers.test.js)
  cli/package.json test script updated to include tests/requirement-providers.test.js

aief --help
  -> lists "aief propose <idea> [--change change-id]" and
     "aief enrich manual|jira <source-id> [--file path]" under Work

aief help enrich / aief help propose
  -> Purpose/When to use it/Reads/Writes/Example/Next step, all six fields present for both;
     propose's entry documents --change and the proposal.md-only write behavior

grep -n 'provider ===' cli/src/cli.js
  -> (no matches) — confirms Fix 2 removed all provider branching from cli.js

Temporary clean project (/tmp, outside the repo):
  aief init                                        -> creates AGENTS.md, changes/0001-adopt-aief, knowledge/*
  aief enrich manual TEST-001                      -> creates changes/0002-manual-test-001, read-only,
                                                       Requires Human Review
  aief propose --change 0002-manual-test-001       -> "Created changes/0002-manual-test-001/proposal.md."
  ls changes/                                      -> 0001-adopt-aief, 0002-manual-test-001 only
                                                       (confirmed: NO 0003-... created)
  find changes -name proposal.md                   -> changes/0002-manual-test-001/proposal.md
                                                       (confirmed: proposal.md lives inside 0002, not a new Change)
  aief verify                                      -> Result: PASS (README.md "not required yet")

This repo:
  aief verify (before evidence.md existed) -> FAIL, correctly reporting
     "changes/0030-workflow-cohesion-requirement-sources/evidence.md missing"
  aief verify (after this file was written) -> PASS
  git status -> modified: CHANGELOG.md, README.md, cli/src/cli.js, cli/tests/cli.test.js,
                cli/package.json, docs/TEAM-USAGE-GUIDE.md, docs/Workflow.md;
                untracked: changes/0030-.../, cli/src/requirement.js, cli/src/requirement-providers/,
                cli/tests/requirement-providers.test.js, docs/enrichment-workflow.md,
                docs/requirement-sources.md
                (no commit made, no push made, per instructions)
```

## Findings

- Reusing the existing `close`/`prompt` gates for Human Review (rather than inventing a new status machine) worked cleanly: an Enrichment Change's `tasks.md` simply lists its Human Review checklist unchecked, and the pre-existing "unchecked task(s)" rule in `close` already refuses it — no new enforcement code was needed.
- The four minimal `verify` markers (Requirement Source section, read-only mention, Open Questions, Requires Human Review) are enough to catch a hand-edited or malformed Enrichment Change without building a full schema validator.
- The Jira mapper's ADF flattening (`adfToText`) is intentionally tolerant — Jira descriptions are sometimes plain strings and sometimes Atlassian Document Format objects; both are handled without throwing.

## Risks

- **Verify cannot mechanically prove "no application code was modified"** by an enrichment step — this Change only guarantees `aief enrich` itself writes solely under `changes/<id>-.../`. A human hand-editing an Enrichment Change afterward to touch source files would not be caught by `verify`. Documented in `docs/enrichment-workflow.md` as a known limitation; a full evidence-completeness / scope-containment contract is future Workflow Cohesion work. **Not addressed by this follow-up** — out of the approved fix scope (fixes #1–#4 only).
- **Duplicate-Change prevention is name-based** (`provider-sourceId` slug suffix match), not a full unified Change identity — sufficient for this Change's scope, but does not yet solve the broader Change-identity fragmentation noted in earlier validations. `propose --change` reuses the same name-based matching convention already used by `prompt --change`/`close --change`, so the pattern is at least now consistent across all three commands.
- **The `jira` provider is a local-export placeholder.** No real Jira connectivity exists; if a team relies on this before a real adapter ships, they must maintain the export files by hand.

## Recommendations

- A future ADR should formalize the Requirement Source contract the way ADR-002/ADR-003 formalized OpenSpec/SpecBoot integration — not done in this Change per the instruction to avoid modifying accepted ADRs, but recommended before real Jira/Notion/GitHub adapters are built.
- **Confirmed by the architecture-review fix:** a real network/MCP-based adapter for any provider now only needs a new file under `cli/src/requirement-providers/` plus one `ADAPTERS` entry in `index.js` — no change to `enrich()`, `enrichmentChangeFiles()`, `cli.js`'s workflow logic, or the Normalized Requirement shape.
- Consider extending the closability contract (tracked in the Workflow Cohesion roadmap) to also cover Enrichment Changes' scope containment, closing the "no application code touched" verification gap noted above.
- Consider adding a genuine unified Change-identity mechanism (tracked in the Workflow Cohesion roadmap) so `prompt --change`, `close --change` and the new `propose --change` share one real identity lookup instead of three independent substring-match implementations.

## Artifacts Produced

- New: `cli/src/requirement.js`, `cli/src/requirement-providers/manual.js`, `cli/src/requirement-providers/jira.js`, `cli/src/requirement-providers/index.js`, `cli/tests/requirement-providers.test.js`, `docs/requirement-sources.md`, `docs/enrichment-workflow.md`.
- Edited: `cli/src/cli.js` (enrich command, `propose --change`/`proposeForChange`, shared `changeType()` helper, prompt/verify phase-awareness, help), `cli/tests/cli.test.js` (15 new/extended tests total), `cli/package.json` (test script), `docs/Workflow.md` (canonical enrich integration), `docs/TEAM-USAGE-GUIDE.md`, `README.md`, `CHANGELOG.md`.
- `changes/0030-workflow-cohesion-requirement-sources/` (this Change: change.md, spec.md, tasks.md, evidence.md).

## Lessons Learned

- Building the contract first (Normalized Requirement) and only one real provider (manual) plus one honest placeholder (jira local-export) kept the scope small while still proving the extensibility point — confirmed by the review: adding Notion/GitHub later is now genuinely a new adapter file plus one registry entry, not a redesign.
- Reusing existing gates (close's unchecked-task refusal, prompt's Analysis-detection pattern) instead of inventing new machinery for the Human Review Gate kept the diff small and the behavior consistent with how AIEF already works.
- An independent architecture review pass, run the same day as the initial implementation and before any commit, caught exactly the kind of gap that "it passes its own tests" cannot: workflow *continuity* across commands (enrich → propose) and *where* logic lives (cli.js vs. an adapter layer) rather than *whether* any single command works in isolation. Worth keeping as a habit for future Requirement Source or workflow-shaped Changes.

## Next Change

Candidates from the Workflow Cohesion roadmap: a real unified Change-identity mechanism (replacing the substring-match convention shared by `prompt --change`/`close --change`/`propose --change`), a full closability/verify contract (would close the "no application code touched" gap), or the first real network/MCP-based provider adapter once an ADR formalizes the Requirement Source contract.
