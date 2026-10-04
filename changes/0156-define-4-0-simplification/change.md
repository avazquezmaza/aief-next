# Change

## ID

`0156-define-4-0-simplification`

## Type

Definition

## Objective

Define exactly what AIEF 4.0 removes, rescues and merges, following the verdicts approved in
Analysis 0154, before any code is deleted. The owner approves each decision here, and the
implementation Change (0157) follows this list and nothing else.

## Scope

### In scope

- One decision per component, with options, a recommendation and the files, flags, tests and
  docs it affects.
- A superseding ADR draft (ADR-038).
- Implementation prerequisites and the follow-up Change.

### Out of scope

- Deleting or changing any code, test or doc (that is Change 0157).
- Components Analysis 0154 kept: Change files, `verify`, `close`, `prompt`, `(human)`/`(review)`
  labels, Skills, detection, the two informational Hooks.

## Context

Analysis 0154 measured 11 local projects (93 Changes) and this repository. None has a
`manifest.json`, so every feature that needs one has never been used outside its own tests.
AIEF has no users outside the owner's machine (owner, 2026-10-04), so removals need no
deprecation release.

Inventory of what the manifest gates, by real `import` graph:

| Group | Source files | Lines | Tests |
|---|---|---|---|
| Manifest | `core/domain/change-manifest.js`, `core/domain/manifest-status-drift.js`, manifest branch of `core/domain/change-loader.js` | ~200 | `change-manifest`, `manifest-status-drift` |
| Loop | `core/services/loop-service.js` | 93 | `loop-service`, part of `cli-harness-and-loop` |
| Harness | `core/services/harness-service.js` | 144 | `harness-service`, part of `cli-harness-and-loop` |
| Tracks and gates | `core/domain/workflow-definition.js`, `core/services/gate-evaluator.js`, `core/services/transition-engine.js`, `core/services/workflow-service.js`, `workflows/{lite,standard,governed}.json` | ~650 | `workflow-definition`, `workflow-service`, `gate-evaluator`, `transition-engine`, `cli-close-workflow-gates` |
| SDD providers | `core/domain/sdd-model.js`, `core/domain/sdd-provider-resolver.js`, `sdd-providers/{index,local,openspec}.js`, `configureSddProvider()` in `commands/bootstrap.js`, `knowledge/sdd-provider.json` | ~560 | `sdd-model`, `sdd-provider-local`, `sdd-provider-openspec`, `sdd-provider-registry` |
| Requirement verification (`verify --requirements`) | `core/services/verification-service.js`, `core/services/verification-context.js`, `core/services/verification-evidence.js`, `core/domain/verification-rule.js`, `verification-rules/*.js` | ~650 | `verification-service`, `verification-context`, `verification-evidence`, `verification-registry`, `verification-rule-model` |
| `ai-specs` | `core/domain/ai-specs.js`, its use in `commands/{doctor,prompt,shared}.js`, `templates/specboot/ai-specs` | 305 | `ai-specs` |
| Dependencies | `core/domain/change-graph.js`, `core/services/next-change-service.js` | ~270 | `change-graph`, `next-change-service`, part of `cli-graph-and-verification` and `cli-next-change-and-runtime` |

Total proposed for removal: about 2,600 source lines (29% of `cli/src`) and about 350 of 1,152
tests. Dependencies are rescued, not removed.

Coupling to handle: `workflow-service.js` is imported by `commands/{prompt,status,verify,close}.js`,
`core/services/skill-context.js` and `hooks/post-verify-next-action.js`. For a Change with no
track it already falls back to `checkChangeReadiness()`. That fallback becomes the only path.

## Business / Product Constraints

- No external users: breaking changes are free now and expensive after release.
- Zero runtime dependencies, repository as the source of truth, recommendation never execution
  (unchanged).

## Known Requirements

- Keep everything Analysis 0154 marked "keep".
- 0 `manifest.json` files exist in the 11 projects or this repository, so no data migration.
- 3 `(gate:*)` task lines exist in this repository's history, and 0 in the projects.

## Assumptions

- A1: Requirement verification is unused. It reads `sdd.requirements` from the manifest, and
  there are 0 manifests.
- A2: No one outside this machine depends on OpenSpec or `ai-specs` (owner, 2026-10-04).

## Open Questions

- Q1: Should `adapters/openspec/` and `adapters/specboot/` (docs only) stay as "conceptual
  references, not supported in 4.0", or be deleted? See D5. **Resolved: keep.**
- Q2: Should closing a Change whose dependency is still open warn or block? See D3.
  **Resolved: warn.**

## Decisions Required

- D1: Loop and harness log.
- D2: Tracks, workflow engine and `(gate:*)` labels.
- D3: Dependencies: where they are declared and what `close` does.
- D4: Manifest.
- D5: SDD providers, OpenSpec, requirement verification.
- D6: `ai-specs`.
- D7: `AGENTS.md` template.
- D8: Superseding ADR and version.

## Options Considered

- **D1**: (a) remove both; (b) keep as opt-in. 0 uses, B1 wrong output.
- **D2**: (a) remove the engine and tracks, and treat existing `(gate:*)` lines as ordinary tasks;
  (b) keep tracks. They duplicate `(human)`/`(review)`, and close gives the same result with or
  without them.
- **D3**: declaration: (a) a `## Depends on` section in `change.md` listing Change ids;
  (b) a `--depends-on` flag on `new-change` that writes that section; (c) both.
  At close: (i) a notice naming the open dependency; (ii) block.
- **D4**: (a) remove, and make `verify` print "manifest.json is no longer read" if one is found;
  (b) remove silently.
- **D5**: (a) remove code, `verify --requirements`, `knowledge/sdd-provider.json` and the
  bootstrap prompt, and keep `adapters/openspec/` as a doc marked "conceptual, not supported in
  4.0"; (b) same, and delete the adapter docs too.
- **D6**: (a) remove code and `templates/specboot/ai-specs`; (b) keep discovery only in
  `doctor`.
- **D7**: cut the track/gate paragraph and ADR references from "Tasks and gates", and keep
  `(human)`/`(review)` (now also valid in `spec.md`, Change 0155). Root `AGENTS.md` stays
  byte-identical.
- **D8**: ADR-038 supersedes ADR-016, 017, 021 (requirement layer only), 023 to 028 and 037,
  and replaces ADR-001's "Workflow Engine" framing. Version 4.0.0.

## Recommendation

- **D1**: (a) remove both.
- **D2**: (a) remove the engine and tracks. `(gate:*)` lines become ordinary tasks.
- **D3**: (c) both: the section is the source, the flag writes it. At close: (i) a notice.
  It keeps ADR-028's non-blocking intent and fixes the silence found in 0154.
- **D4**: (a) remove, with the "no longer read" notice for one release.
- **D5**: (a) remove code, keep the adapter docs marked conceptual.
- **D6**: (a) remove.
- **D7**: as described.
- **D8**: ADR-038 as drafted below, version 4.0.0.

ADR-038 draft:

> **ADR-038: AIEF 4.0 is the Change contract, not a workflow engine.** AIEF records scope,
> evidence and human decisions, and checks them deterministically. Assistants and their harnesses
> supply workflow mechanics. Removed: `manifest.json`, tracks and the workflow engine, Loop,
> the Harness log, SDD providers and requirement verification, `ai-specs`. Dependencies move to a
> `## Depends on` section in `change.md`. Supersedes ADR-016, 017, 021 (requirement layer), 023
> to 028 and 037, and replaces ADR-001's framing. Rule going forward: a feature must be used in
> two real projects within six weeks of shipping, or it is removed.

## Decision (human)

**Approved by the project owner on 2026-10-04** ("de acuerdo", in the session that produced this
Change): every Recommendation D1–D8 as written.

- Q1: keep `adapters/openspec/` and `adapters/specboot/` as docs marked "conceptual reference,
  not supported in 4.0".
- Q2: closing a Change whose dependency is still open prints a notice. It does not block.

## Rationale

- Every removed component has 0 real uses (Analysis 0154, R1/R2).
- Dependencies are the only manifest feature with demonstrated need (12 of 92 Changes).

## Consequences

- About 29% less source and 30% fewer tests to maintain.
- A shorter `AGENTS.md` in every adopting project.
- OpenSpec and `ai-specs` interoperability is gone until a real project asks for it.

## Non-Functional Requirements

- The suite stays green, and `verify --strict` passes on this repository.

## Security & Compliance

- No change to the trust model. Approval enforcement (Changes 0150, 0155) is kept.

## Data & Domain

- `change.md` gains an optional `## Depends on` section.

## Integrations

- OpenSpec and LIDR/`ai-specs` integration removed (D5, D6).

## Deployment & Operations

- Version 4.0.0, with release notes listing removed flags and files.

## Implementation Prerequisites

- Owner approval of D1–D8 and answers to Q1/Q2.
- ADR-038 recorded in `knowledge/decisions.md`.

## Follow-up Changes

- 0157: implement 4.0 (removals, `## Depends on`, close notice, docs, tests, ADR-038, version
  bump, release notes, and Analysis 0154's Findings Status for B3/B4).

## Success Criteria

- Open Questions are resolved or explicitly deferred.
- Every entry in Decisions Required has a human-approved Decision recorded here and in knowledge/decisions.md.
- Implementation Prerequisites and Follow-up Changes are identified.

## Status

Closed (2026-10-04)
