# Specification

## Goal

A development team can pick up AIEF and use it safely on real projects from documentation alone, understanding exactly what it is approved for (guided internal use, brownfield discovery, greenfield validation, team pilots) and what it is not (unsupervised delegated implementation, autonomous execution, external stable 1.0) — with the path to 1.0 frozen to the four Workflow Cohesion workstreams.

## Requirements

- **Team usage guide** is operational, not theoretical: covers what AIEF is / is not, when to use / not use, required tools, first-time setup, adopting an existing project, starting a Change, generating a prompt, working manually with Claude/Gemini/Codex/Cursor, capturing evidence, verifying, closing, common mistakes, and required human review points. Uses the real CLI commands (`doctor`, `init`/`adopt`, `verify`, `analyze`, `new-change`, `prompt <assistant>`, `close --yes`).
- **Validation summary** records both validations (greenfield: Spring Boot + Camel + Java 21 + OpenAPI + tests; brownfield: trk-orchestrator-portal), what worked, remaining friction, current approval status, and the allowed vs forbidden uses. Notes the full `architecture-review.md` files live in the validation repos.
- **1.0 readiness** states current status is pre-1.0 internal pilot; lists conditions for 1.0, the four required Workflow Cohesion fixes, a Definition of Done, Go/No-Go criteria, and an explicit statement that 1.0 is not declared.
- **Developer checklist** is one page with sections: before starting, during Change, before implementation, before close, before commit/push.
- **Roadmap to 1.0** contains only the four workstreams (unified Change identity; context flow; prompt reality consistency; closability/verify contract) and explicitly defers Operational Profiles, full SpecBoot live integration, MCP, VS Code extension, GitHub Action, npm publication, assistant-native execution automation.
- **README** gains a "Current Status" section near the top with: pre-1.0 internal pilot; ready for guided internal use; validated on one greenfield and one brownfield; not yet 1.0; links to `docs/TEAM-USAGE-GUIDE.md` and `docs/AIEF-1.0-READINESS.md`.
- No runtime behavior changes; no new commands; no accepted ADR modified; 1.0 not declared; no external production readiness claimed.

## Acceptance Criteria

- [x] `docs/TEAM-USAGE-GUIDE.md` exists and covers every required subsection.
- [x] `docs/VALIDATION-SUMMARY.md` exists with both validation results and approval status.
- [x] `docs/AIEF-1.0-READINESS.md` exists, states pre-1.0, and explicitly does not declare 1.0.
- [x] `docs/DEVELOPER-CHECKLIST.md` exists as a one-page checklist with all five stages.
- [x] `docs/ROADMAP-TO-1.0.md` exists with only the four workstreams and the explicit deferrals.
- [x] `README.md` has a "Current Status" section linking the usage guide and readiness doc.
- [x] No runtime behavior changed (docs + README + Change files + CHANGELOG only).
- [x] Relative links in the new docs resolve.
- [x] `npm test` green.
- [x] `aief verify` PASS.
