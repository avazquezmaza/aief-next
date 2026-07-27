# Proposal — Documentation Architecture and System Map (AIEF Core 3.0)

> **Note:** this Change's commissioning instruction was later refined toward an explicit
> Information Architecture framing (audience model, concept ownership matrix, canonical surface,
> Change 0051 blueprint). `design.md` was rewritten accordingly and is the authoritative artifact for
> this Change's actual deliverables. This proposal's problem statement and evidence below remain
> valid as supporting findings and are cited from `design.md` where still relevant; its "System Map"
> and "two-layer model" framing was not carried forward as the target shape.

## Problem

The repository contains **382 Markdown files**. Reading only their filenames overstates the problem:
221 of them (58%) are `changes/` artifacts (`change.md`/`spec.md`/`tasks.md`/`evidence.md`, plus
`design.md`/`proposal.md`/`verification.md` for Entregas 4–7) — Change history, not documentation a
newcomer reads to understand the system. Another 62 (templates/`starter-project/`/most of
`examples/`) are boilerplate shipped *into* adopted projects, not AIEF's own documentation. Excluding
both, the real "documentation surface" a human might read is **≈114 files** (`docs/` 69, root 12,
`profiles/` 11, `knowledge/` 2, `adapters/` 6, `specs/` 4, `releases/` 4, `reference-implementation/`
1, `examples/*/README.md` 2, `docs/aief-2.0/` 12 already counted inside the 69) — still a lot for a
ten-minute onboarding goal, but a different, more tractable problem than "382 files."

**The real problem, confirmed by reading content, not filenames**: `grep -rl "Core 3.0\|Entrega"` across
`docs/`, `README.md`, `AGENTS.md`, `NAVIGATOR.md`, `knowledge/` returns exactly **four** files:
`docs/architecture.md`, `docs/domain-model.md` (both maintained throughout this session, alongside
every Entrega's own code), `knowledge/decisions.md` (the ADR log, ADR-016 through ADR-021 present),
and `docs/aief-core-3-claude-code-prompt.md` (the original commissioning document). **Every other
file in the repository — including `README.md`, the single most-read entry point — describes AIEF as
it was before Entrega 1, with zero mention of the Workflow Engine, SDD Provider, WorkflowService,
Skills Runtime, Hooks Runtime, or Verification Engine.** A newcomer following `README.md` today would
never learn any of these seven closed Entregas exist. This is not a volume problem; it is a
**currency and navigation** problem — the newest, most-tested, most-reviewed part of the system
(Entregas 1–7, 534 passing tests, seven closed Changes, six ADRs) is the least visible.

**A second, independent finding**: this repository already went through one documentation
consolidation, in Change 0026. `docs/Vision-and-Principles.md` and `docs/project-lifecycle.md` are
already explicitly self-marked `**Superseded.**`, pointing at their replacements
(`docs/VISION.md`+`docs/principles.md`, and `docs/lifecycle.md` respectively). `docs/index.md`
already exists as a working master index with a "Historical Reference" section for `specs/`. This
means the target documentation architecture this proposal designs is **not a green-field
invention** — it is a second application of a pattern this project has used successfully before,
extended to cover Core 3.0.

**A third finding**: several documents disagree with each other and with reality on the project's own
status. `README.md`'s "Current Status" says *"AIEF 2.0 baseline — frozen... first official 2.0
dogfooding."* `docs/TEAM-USAGE-GUIDE.md`/`docs/DEVELOPER-CHECKLIST.md`/`docs/roadmap.md`/
`docs/ROADMAP-TO-1.0.md` all say *"pre-1.0 internal pilot."* None of the four mention that Entregas
1–7 (Workflow Engine, SDD Provider, User Workflow, Skills Runtime, Hooks Runtime, Verification
Engine) have shipped, closed, and are covered by 534 tests. This is a real, user-visible
inconsistency an onboarding reader would hit within the first page.

## Structural vs. navigational: which is it?

**Primarily navigational, with one real currency gap.** The evidence:

- The *volume* most people would react to (382 files) is 78% Change history and boilerplate — normal
  and expected for a project using its own workflow across 49 Changes; deleting or hiding it would
  destroy exactly the audit trail this project's own ADR-008 (evidence discipline) requires.
- The *real* documentation surface (~114 files) already has a working master index (`docs/index.md`)
  and a precedent for superseding old docs cleanly (Change 0026). The mechanism exists; it was never
  re-run after Core 3.0.
- The one genuine *content* gap is narrow and specific: nothing outside four files describes
  Entregas 1–7. Fixing the navigation hierarchy without fixing this would leave a newcomer with a
  clean map pointing entirely at pre-Core-3.0 material.

## Objective

Design (not yet execute) a documentation architecture that: (1) gives Core 3.0 one clear, current
entry point (the System Map) without duplicating any spec, ADR, or requirement list; (2) resolves the
status-framing contradiction; (3) reuses and extends the existing `docs/index.md`/Change-0026
consolidation pattern rather than inventing a parallel one; (4) preserves 100% of Change history and
ADRs, unmoved, presented via a summary index rather than as required onboarding reading.

## Scope

**In scope**: inventory and classification of all 382 files; identification of duplicates,
superseded-but-unlinked, and stale-relative-to-Core-3.0 documents; the two-layer target model; the
System Map's full designed content (as a draft inside `design.md`, not yet published); three required
diagrams; a reading map by audience; a maintenance policy; a staged, reversible future implementation
plan.

**Out of scope**: executing any move/merge/delete/redirect; publishing the System Map as a live file;
Review (Entrega 8); any code, CLI, or test change.

## Initial classification summary (see `design.md` §2 for the full table)

| Category | Approx. count | Examples |
|---|---|---|
| Entry Point | 4 (competing) | `README.md`, `NAVIGATOR.md`, `docs/index.md`, `docs/aief-2.0/README.md` |
| Conceptual Documentation | ~10 | `docs/VISION.md`, `docs/Workflow.md`, `docs/lifecycle.md`, `docs/mental-model.md`, `docs/ecosystem.md`, `docs/principles.md`, `docs/architecture.md` (also Architecture Reference) |
| Operational Documentation | ~15 | `docs/cli.md`, `docs/bootstrap.md`, `docs/Getting-Started.md`, `docs/first-30-minutes.md`, `docs/learning-path.md`, `docs/enrichment-workflow.md`, `docs/requirement-sources.md`, `docs/navigator/**` |
| Architecture Reference | 3 | `docs/architecture.md`, `docs/domain-model.md`, `adapters/**` |
| Decision Record | 2 | `knowledge/decisions.md` (21 ADRs), `knowledge/backlog.md` |
| Change Specification | 55 | Entregas 4–7's `proposal.md`/`spec.md`/`design.md`/`tasks.md`/`verification.md` (Changes 0043–0050) |
| Historical Evidence | ~215 | Changes 0001–0042's four-file sets, Change 0042's protocol/scenario/metrics files, all `evidence.md` |
| Duplicate | 6 | `docs/Vision-and-Principles.md`, `docs/project-lifecycle.md` (both self-marked superseded), `docs/roadmap.md` vs. `docs/ROADMAP-TO-1.0.md`, `NAVIGATOR.md` vs. `docs/navigator/README.md` (legitimate redirect, not harmful) |
| Obsolete | ~35 | Every `docs/*.md` not mentioning Core 3.0 that describes current CLI behavior or project status (see `design.md` §3) |
| Generated/Temporary | ~62 | `templates/**`, `cli/templates/**`, `starter-project/**`, most of `examples/**` |

## Risks

- **Loss of traceability** if a future implementation phase moves a file without updating every
  inbound link — mitigated by the staged plan requiring link validation per stage (`design.md`
  §12/`tasks.md`).
- **Treating historical material as current** (the opposite direction) — mitigated by explicit status
  markers (`Current`/`Historical`/`Draft`/`Deprecated`/`Generated`) on every main document.
- **Overview creep** — the System Map itself becoming another 500-line document — mitigated by its
  own designed size cap (`design.md` §5) and a hard rule against reproducing spec/ADR content.
- **This audit itself going stale** the moment Entrega 8 (Review) starts — mitigated by an explicit
  obsolescence-review trigger list (`design.md` §9) including "at the close of every Entrega."

## Alternatives considered

- **Do nothing; let `docs/architecture.md`/`docs/domain-model.md` keep absorbing Core 3.0 content.**
  Rejected — both are already long, detailed *reference* documents, not onboarding reading; they are
  the right place for contracts, wrong place for a 10-minute overview.
- **Rewrite `README.md` directly, now.** Rejected for this Change — the commissioning instruction is
  explicit: planning only, no file changes yet; `design.md` still fully specifies what the eventual
  `README.md` update should say.
- **Delete `docs/aief-2.0/`, `specs/`, or old Changes to reduce file count.** Rejected — none of them
  are wrong, all are historical evidence this project's own ADR-008 discipline requires preserving;
  the fix is navigation (mark historical, deprioritize in indexes), never deletion.

## Success criteria

- Every file counted and classified; every classification traceable to a real grep/read, not a
  filename guess.
- The System Map's designed content stays within its own size cap and never reproduces spec/ADR
  content verbatim.
- No deletion is recommended for any Change artifact or ADR.
- The staged implementation plan is reversible at every step.
