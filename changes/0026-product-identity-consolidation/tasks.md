# Tasks

## Review

- [x] Inspect the full repository: README, all of docs/, navigator/, specs/, adapters/, knowledge/decisions.md.
- [x] Identify outdated documentation (pre-CLI "copy starter-project" era: Getting-Started, first-30-minutes, learning-path, mental-model, choosing-your-workflow, tooling, navigator guides; stale roadmap).
- [x] Identify architectural inconsistencies vs accepted ADRs (spec's SpecBoot ownership vs ADR-003/004/010; "Runtime" vs ADR-001 "Workflow Engine"; ADR-012's stale `0025-operational-profiles` reference).

## Consolidation

- [x] Rewrite README.md (what/why/what-not/relations/lifecycle/install/bootstrap/execute-a-Change; < 10 min).
- [x] Create docs/VISION.md.
- [x] Create docs/architecture.md (Mermaid; honest Profiles status).
- [x] Create docs/ecosystem.md (responsibility matrix).
- [x] Create docs/principles.md (8 principles + Human-Led; why + ADR mapping).
- [x] Create docs/lifecycle.md (8 stages × responsible/inputs/outputs; knowledge loop).
- [x] Convert superseded docs to pointers: Vision-and-Principles.md, project-lifecycle.md, tooling.md.
- [x] Update pre-CLI docs to the implemented flow: Getting-Started, first-30-minutes, learning-path, mental-model, choosing-your-workflow, navigator/README, navigator/new-project, navigator/existing-project, navigator/tooling.
- [x] Update docs/index.md (canonical docs first; specs/ labeled historical) and docs/roadmap.md (completed statuses).
- [x] docs/cli.md: add `init` to the level-1 command table; docs/Workflow.md: note `init` reuses adopt.
- [x] Update CHANGELOG.

## Verification

- [x] All links in new/changed docs resolve to existing files.
- [x] Command examples match the Bootstrap Experience (root `npm install && npm link`, `aief init`).
- [x] `npm test` — suite untouched and green (no runtime change).
- [x] `aief verify` — PASS.

## Evidence

- [x] Update evidence.md
