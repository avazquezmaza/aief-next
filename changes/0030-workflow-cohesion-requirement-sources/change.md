# Change

## ID

`0030-workflow-cohesion-requirement-sources`

## Type

General (CLI feature + documentation; base of a larger Workflow Cohesion workstream)

## Objective

Introduce the **Requirement Source** concept and a provider-agnostic **Normalized Requirement** model, plus the minimal `aief enrich` command and the extensible flow it needs, so AIEF can start a Change from an external requirement — Jira today, Notion/GitHub/Azure DevOps/Markdown/manual tomorrow — without coupling the workflow engine to any single tool.

## Motivating Findings

- Greenfield validation (Spring Boot + Camel + Java 21) and brownfield validation (trk-orchestrator-portal) both showed AIEF's workflow starting from `aief new-change` or `aief analyze` — never from where real work actually begins.
- A third, real validation against a Jira ticket (**INGENIERIA-519**, Intelligent Support Assistant) showed that real enterprise work starts in a requirement-tracking tool, not in the CLI. The requirement's facts, context and open questions live in Jira, not in AIEF.
- Product decision: AIEF must not couple to Jira specifically. Tomorrow's source may be Notion, Azure DevOps, GitHub Issues, ServiceNow, Confluence, a Markdown file, an email, or a transcript. The fix is a **contract** (Requirement Source → Normalized Requirement), not a Jira integration.
- **Architecture review follow-up (same day):** an Architecture Review Board pass over this Change's initial implementation found three real design gaps before approval — (1) `aief propose` could not continue an Enrichment Change, forking a disconnected new Change instead; (2) provider-specific logic (`if (provider === "jira")`) was scattered across three functions in `cli.js` instead of behind a uniform adapter contract, blocking future providers; (3) the new enrichment flow was documented as a standalone diagram competing with `docs/Workflow.md`, the canonical model ADR-011 requires all other documents to summarize. All three were fixed in this same Change (see Scope and Evidence) before Architecture Approval.

## Scope

### In scope

- `cli/src/requirement.js` — the Normalized Requirement shape (`emptyRequirement`), the provider catalog (`PROVIDERS`, description-only), and a Jira-shaped mapper (`normalizeJira`).
- `cli/src/requirement-providers/` — the adapter layer: `manual.js`, `jira.js` and `index.js` (`retrieveRequirement`, `hasAdapter`, `implementedProviders`). This is the single place with provider-specific logic; `cli.js` calls only the uniform contract and never branches on a provider name.
- `aief enrich <provider> <source-id>` command:
  - `aief enrich manual <source-id>` — fully implemented.
  - `aief enrich jira <issue-key> [--file path]` — implemented as a **local-export placeholder adapter**: reads a local JSON file in Jira's own issue shape; no network call, no live Jira connection, no credentials. Falls back to an honest placeholder Change (with an Open Question) when no export file is present.
  - Unimplemented providers (`notion`, `github`, `azure-devops`, `markdown`) fail loudly, naming what is and isn't available — never a silent fallback.
- Change-creation behavior: creates `changes/<next-id>-<provider>-<source-id>/` with `change.md`, `spec.md`, `tasks.md`, `evidence.md`; refuses to create a duplicate Change for a `provider`/`source-id` pair already enriched (points at the existing Change instead).
- Requirement content, always classified as **Fact `[H]`** / **Inference `[I]`** / **Assumption `[S]`**, with an always-present **Open Questions** section.
- A **Human Review Gate**, expressed as a `Requires Human Review` status in `change.md`, enforced through the *existing* gates (not new ones): `aief close --yes` refuses while Human Review tasks in `tasks.md` are unchecked; `aief prompt` recognizes an Enrichment Change (via the shared `changeType()` helper, also used for Analysis) and instructs the assistant not to implement application code or touch the source.
- **`aief propose --change <change-id>`** — continues an existing Change (typically after `aief enrich` + Human Review) by adding/keeping `proposal.md` inside it, without creating a new Change and without touching `change.md`/`spec.md`/`tasks.md`. Plain `aief propose "<idea>"` (no `--change`) is unchanged — it still creates a new Change.
- Minimal phase-aware `aief verify`: `README.md` is not required while every open/closed Change is Enrichment or the `adopt-aief` Change (no implemented product yet); each Enrichment Change is checked for a Requirement Source section, an explicit read-only marker, an Open Questions section, and the `Requires Human Review` status.
- `docs/Workflow.md` updated as the canonical workflow source: `aief enrich` is positioned in Level 1 (mermaid diagram, text diagram, a new "Starting from a Requirement Source" subsection, and the all-levels lifecycle diagram); `docs/enrichment-workflow.md` rewritten to defer to it (a smaller enrich-specific diagram plus a pointer, not a competing full lifecycle).
- Documentation: `docs/requirement-sources.md`, `docs/enrichment-workflow.md`; updates to `docs/Workflow.md`, `docs/TEAM-USAGE-GUIDE.md` and `README.md`.
- CLI test coverage for `enrich`, `propose --change`, the requirement-providers adapter contract (direct unit tests, mirroring `detect.test.js`'s precedent), the phase-aware parts of `verify`, and the `prompt`/`close` gate behavior on Enrichment Changes.

### Out of scope

- Real network integration with Jira, Notion, GitHub Issues, Azure DevOps or any other tool (no live API/MCP calls in this Change).
- Any credential storage or handling.
- Full unified Change identity across AIEF and OpenSpec (tracked separately in the Workflow Cohesion roadmap — this Change only prevents duplicate creation for the same `provider`/`source-id`).
- A complete evidence-completeness / scope-containment closability contract (only the Human Review-specific gate is added here).
- Declaring AIEF 1.0, or claiming production readiness for any of the planned providers.
- Modifying any accepted ADR. (Recommendation, not a blocking requirement: a future ADR should formalize the Requirement Source contract the way ADR-002/003 formalized OpenSpec/SpecBoot integration — see Evidence → Recommendations.)

## Success Criteria

- `aief enrich manual <id>` and `aief enrich jira <id>` (with and without a local export) work end-to-end and are covered by tests.
- Generated Changes are correctly classified `[H]`/`[I]`/`[S]`, carry Open Questions, and are marked `Requires Human Review`.
- `aief close --yes` refuses an Enrichment Change until Human Review tasks are checked; `aief prompt` never tells the assistant to implement an Enrichment Change.
- `aief propose --change <id>` continues an existing Change (no new Change created, `change.md`/`spec.md` untouched); plain `aief propose <idea>` still creates a new Change.
- `cli.js` contains no `provider ===` branching; every provider-specific behavior lives in `cli/src/requirement-providers/`.
- `docs/Workflow.md` names `aief enrich` as part of Level 1; `docs/enrichment-workflow.md` defers to it instead of presenting a competing flow.
- `aief verify` does not fail a Discovery/Enrichment-only project for missing `README.md`, and still enforces the Enrichment-specific checks.
- `npm test` green; `aief verify` PASS on this repository.
- No credentials, no real Jira/Notion/GitHub network calls, no accepted ADR modified, 1.0 not declared.

## Status

Closed (2026-07-08)
