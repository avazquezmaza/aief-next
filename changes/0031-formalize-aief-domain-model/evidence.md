# Evidence

## Summary

Created `docs/domain-model.md` on 2026-07-08 as a formal, product-level domain model for AIEF — ubiquitous language, the 11 requested core entities, the Core/Supporting/Infrastructure classification, six bounded contexts, risks of mixing contexts, what does not belong to AIEF's core, and open questions for AIEF 1.x. Documentation only; no functionality added, no folder moved, no CLI behavior changed.

## Activities Performed

- Read README.md, docs/architecture.md, docs/Workflow.md, docs/lifecycle.md, docs/principles.md, docs/ecosystem.md, docs/VISION.md, docs/requirement-sources.md.
- Read all 12 ADRs in `knowledge/decisions.md` in full (not just titles), with particular attention to ADR-012's orthogonality rule (Profile/Standard/Skill/AGENTS.md), ADR-009 (no hidden state, derived Active Change), ADR-007/ADR-010 (Detector/recommendation/content separation for Skills).
- Read `profiles/` — confirmed the current shape is free-form prose (Mission/Responsibilities/Inputs/Outputs/Checklist), not ADR-012's structured model; confirmed no code path in `cli.js` actually reads `profiles/*.md`.
- Read `specs/` (Core.md, Architecture.md, Compliance.md, Runtime.md) — confirmed historical/superseded status per `docs/architecture.md`'s own note; captured the old Kernel/Extensions framing as a "history" data point.
- Read `templates/` (project, change, change-types/analysis, openspec, specboot) and `examples/` (todo-app, openspec-mapping) for structural purpose.
- Read `cli/src/core/domain/change.js`, `core/domain/verification-report.js`, `core/services/change-verifier.js` in full — the newly extracted Change and VerificationReport formalization.
- Read `cli/src/requirement.js` and `cli/src/requirement-providers/{index,manual,jira}.js` in full — the Requirement Source / Normalized Requirement model and its adapter contract.
- Skimmed `cli/src/cli.js` structure (commands dispatched, Artifact-producing functions, the inline Prompt Engine composition in `prompt()`).
- Read `cli/src/skills-catalog.json` shape (detectors + skills) and `adapters/openspec/`, `adapters/specboot/` (pure documentation, integration-boundary content).
- Wrote `docs/domain-model.md` with all required sections (see spec.md Requirements).
- Completed `change.md`, `spec.md`, `tasks.md` for this Change (were left as the generic `new-change` scaffold).

## Verification

```
npm test
  -> 77 tests, 77 pass, 0 fail (no executable file was touched by this Change,
     so this run confirms the baseline is unaffected, not a new-feature check)

git status
  -> Untracked: changes/0031-formalize-aief-domain-model/, docs/domain-model.md
     (nothing else touched)

Manual checks:
  - No file under cli/src/, cli/tests/, adapters/, templates/, examples/, specs/,
    profiles/, or any existing docs/*.md was modified.
  - No accepted ADR modified (knowledge/decisions.md untouched).
  - No folder moved or renamed.
```

## Findings

- The single largest gap between AIEF's documented architecture and its running code is **Profile**: ADR-012 defines a structured reasoning model, but `profiles/*.md` remain free prose and `prompt()`/`useProfile()` inject only a bare role-name string. This is called out explicitly in the domain model rather than glossed over.
- **Prompt Composition has not received the same `core/` extraction treatment** Verification & Governance recently did — it remains ~40 lines of inline string-building inside `cli.js`'s `prompt()`. Flagged as an open question (should it be extracted for the same testability reasons), not treated as a defect.
- Two independent code paths compute "is this Change closed" (`isClosed(changeDir)` in `cli.js` and `loadChange(changeDir).closed` via the domain layer) — both trace to the same underlying rule today, but are two call sites rather than one. Flagged as a minor duplication risk in the "Risks of mixing contexts" section.
- The Requirement Source's `status` field and the Change's `## Status` marker are two genuinely distinct concepts that share a word; `docs/requirement-sources.md` already disambiguates this in prose — captured as an open question about whether the field itself should be renamed.
- `specs/` (v1) used a "Kernel/Extensions" framing that the current `docs/architecture.md` has since replaced with "Workflow Engine/Prompt Engine/Detection Engine" — both agree on the core Change shape, useful as a stable-entity/evolved-architecture data point rather than a contradiction.

## Risks

- This document is a **snapshot interpretation** of the current ADRs and code, written by one contributor's reading — it is not itself an ADR and carries no binding authority; it should be revisited if ADR-012 (Profiles) or the Prompt Composition extraction question are ever formally decided, so the domain model doesn't go stale relative to a real architectural change.
- The "Risks of mixing contexts" and "Open questions" sections name real code-level observations (e.g. the duplicate closed-check, the Requirement Source `status` naming collision) that are technically small enough to fix directly — they were deliberately left as documented observations, not silently fixed, since this Change's scope is documentation only.

## Recommendations

- Treat the ten open questions in `docs/domain-model.md` §7 as a backlog for product/architecture decisions before declaring AIEF 1.0 — several overlap directly with the existing Workflow Cohesion roadmap (docs/ROADMAP-TO-1.0.md), particularly the scope-containment question (§7.10).
- If ADR-012 (Operational Profiles) is ever implemented, this document's Profile section should be updated to remove the "current gap" framing.
- Consider a small follow-up Change to unify the two "is this Change closed" code paths, and to resolve or explicitly accept the Requirement Source `status` naming collision — both are cheap, targeted fixes surfaced by this analysis, not scope for this Change.

## Artifacts Produced

- New: `docs/domain-model.md`.
- `changes/0031-formalize-aief-domain-model/` (this Change: change.md, spec.md, tasks.md, evidence.md).

## Lessons Learned

- Writing the domain model surfaced that AIEF's most valuable ADR (ADR-012's orthogonality rule) is currently enforced entirely by convention and documentation, not by any structural check — worth keeping in mind for any future core/ extraction work, the same way the Verification & Governance extraction turned convention into code.

## Next Change

Candidates from this analysis: extract Prompt Composition into `core/` (mirroring the Verifier extraction); decide the Profile implementation question (build ADR-012's structured model, or reconsider it); or continue the existing Workflow Cohesion roadmap items, several of which overlap with this document's open questions.
