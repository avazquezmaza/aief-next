# Change

## ID

`0026-product-identity-consolidation`

## Type

Documentation / Product Architecture

## Objective

Make the repository explain the product correctly. Consolidate the product identity — what AIEF is, what it is not, how it relates to OpenSpec, SpecBoot and AI assistants — so the repo reads as a mature open-source product ready for external evaluation. Documentation is the visible expression; a consistent product architecture is the deliverable.

## Scope

### In scope

- Rewrite `README.md` to answer: what/why/what-not, relation to OpenSpec/SpecBoot/assistants, lifecycle, install, bootstrap, executing a Change — readable in under ten minutes.
- New canonical docs: `docs/VISION.md`, `docs/architecture.md`, `docs/ecosystem.md`, `docs/principles.md`, `docs/lifecycle.md`.
- Consolidate superseded docs into pointers to the canonical ones (`Vision-and-Principles.md`, `project-lifecycle.md`, `tooling.md`) — one source of truth per topic.
- Update pre-CLI ("copy starter-project manually") era docs to the implemented CLI flow: `Getting-Started.md`, `first-30-minutes.md`, `learning-path.md`, `mental-model.md`, `choosing-your-workflow.md`, `navigator/README.md`, `navigator/new-project.md`.
- Update `docs/roadmap.md` to reflect completed work (no new roadmap items invented).
- ADR consistency review: documentation must match accepted ADRs; inconsistencies documented here and in evidence, ADRs untouched.
- Update `docs/index.md` and `CHANGELOG.md`.

### Out of scope

- New commands, CLI behavior changes, runtime changes of any kind.
- Modifying accepted ADRs.
- Modifying OpenSpec or SpecBoot (or their adapters' behavior).
- Deleting `starter-project/`, `specs/` or navigator content (kept; repositioned as manual alternative / v1 reference).
- New architecture. Everything documented reflects what is implemented.

## Architecture decisions applied (spec vs accepted ADRs)

The incoming spec for this Change conflicted with accepted ADRs in three places. Per the precedent set in Change 0025, accepted ADRs take precedence; the deviations are documented here:

1. **SpecBoot ownership.** The spec's responsibility matrix assigns AGENTS.md, Standards and Skills to SpecBoot. The implemented architecture says otherwise: AIEF creates and owns these artifacts in adopted projects (`aief adopt`); SpecBoot is integrated *conceptually*, never at runtime (ADR-003, ADR-004, ADR-010). The docs follow the ADRs and credit SpecBoot as the conceptual source.
2. **"Runtime" naming.** The spec calls AIEF an "AI Engineering Runtime". The implemented and ADR-backed identity is **Workflow Engine** (ADR-001: "AIEF is a Workflow Engine, not a specification generator"). The docs keep "Workflow Engine" as the product identity; "runtime" appears in `docs/VISION.md` only as a possible long-term direction.
3. **Principles list.** The spec's eight principles are documented in `docs/principles.md`, each mapped to the ADR(s) that already embody it — they are a re-statement of accepted architecture, not new principles.

Additional inconsistency found during the ADR review (documented, not fixed — ADRs are not modified):

- ADR-012 names its future implementation Change `0025-operational-profiles`; ID 0025 was later used by the bootstrap experience. The Profiles implementation will receive the next free ID when it starts.

## Success Criteria

- README presents the product correctly and is readable in under ten minutes.
- Vision, architecture, ecosystem, principles and lifecycle each have one canonical document.
- Responsibility boundaries (AIEF / OpenSpec / SpecBoot / assistant / humans) are explicit and consistent everywhere.
- No documentation contradicts accepted ADRs; found inconsistencies are documented.
- All command examples match the Bootstrap Experience (root install, `aief init`).
- No runtime functionality introduced or changed; CLI test suite untouched and green.

## Status

Closed (2026-07-07)
