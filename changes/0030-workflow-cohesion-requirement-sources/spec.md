# Specification

## Goal

A developer can start a Change from any requirement source — Jira today, Notion/GitHub/Azure DevOps/Markdown tomorrow — through one command and one normalized model, with the external source always read-only and a human always reviewing before implementation begins.

## Requirements

- **Model** (`cli/src/requirement.js`): `emptyRequirement(provider, sourceId)` returns the full Normalized Requirement shape (provider, sourceId, sourceUrl, title, description, status, priority, reporter, assignee, labels, comments, attachments, links, metadata, retrievedAt, readOnly). `PROVIDERS` is a description-only catalog (id + summary) — it does not track what is implemented. `normalizeJira(raw, sourceId)` maps a Jira REST-shaped issue (including Atlassian Document Format descriptions/comments) into the Normalized Requirement.
- **Adapter layer** (`cli/src/requirement-providers/`): `manual.js` and `jira.js` each export `retrieve(sourceId, options)` returning the uniform shape `{ requirement, retrieved, openQuestions, riskNotes, consoleNotes }`; `index.js` exports `retrieveRequirement(provider, sourceId, options)` (dispatches, throws for an unregistered provider), `hasAdapter(provider)` (the single source of truth for "is this implemented"), and `implementedProviders()`. `cli.js` never contains a `provider === "..."` branch — every provider-specific string or behavior lives in that provider's adapter file. Adding notion/github/azure-devops/markdown means adding one adapter file and one `ADAPTERS` entry, not editing `enrich()`, `enrichmentChangeFiles()`, or any workflow command.
- **Command** `aief enrich <provider> <source-id> [--file path]`:
  - Unknown provider → error listing known providers, exit code 1.
  - Known but unimplemented provider (`notion`, `github`, `azure-devops`, `markdown`) → error naming what is implemented, exit code 1.
  - Missing `source-id` → error with an example, exit code 1.
  - Existing Change for the same `provider`/`source-id` slug → reused, not duplicated; points at the existing Change.
  - `manual` → creates the Change immediately from an empty Normalized Requirement seeded with `sourceId` as a placeholder title.
  - `jira` → reads `--file` or `requirements/jira/<source-id>.json` if present and normalizes it; otherwise creates an honest placeholder Change and reports the missing export file as an Open Question. No network call, no credentials, in either case.
- **Change artifacts** for every `enrich` call:
  - `change.md`: `## Type` → `Enrichment`; a `## Requirement Source` section with provider, source ID, source URL, retrieved-at, and an explicit "Read-only: yes" statement; a `## Review Status` section stating `Requires Human Review`.
  - `spec.md`: the Normalized Requirement; `[H]` Facts (fields present), `[I]` Inferences (empty by default — a deliberate human/assistant addition), `[S]` Assumptions (fields absent, explicitly marked unknown); an always-present `## Open Questions` section.
  - `tasks.md`: a **Human Review** checklist (unchecked) listed before the enrichment steps AIEF already performed (checked).
  - `evidence.md`: real evidence generated immediately — what was retrieved, that the source stayed read-only, that no application code was touched — never left as placeholder "Pending." text.
- **Human Review Gate**, using existing mechanisms:
  - `aief close --yes` refuses while `tasks.md` has unchecked items (already true for every Change type — no new logic needed, verified by test).
  - `aief prompt` detects the Change's `## Type` via the shared `changeType(changeDir)` helper (CRLF-tolerant; also used for Analysis detection, replacing the two previously-duplicated regexes) and, for `Enrichment`, tells the assistant: do not implement application code, do not modify the external source, do not check off Human Review tasks itself.
- **`aief propose --change <change-id>`**: continues an existing Change instead of creating a new one. Writes/keeps `proposal.md` inside that Change only; never touches `change.md`, `spec.md` or `tasks.md`; never overwrites an existing `proposal.md`. Fails loudly (exit code 1) if no Change matches `<change-id>`. `aief propose "<idea>"` without `--change` is unchanged — it still creates a new Change via `createChange`.
- **`aief verify`, phase-aware**:
  - `README.md` is required unless every Change directory is an Enrichment Change (via `changeType`) or the `adopt-aief` Change (i.e., no implemented-product Change exists yet) — in that case it is reported as "not required yet" without failing verify.
  - Each Enrichment Change is additionally checked for: a `## Requirement Source` heading in `change.md`; the word "read-only" somewhere in `change.md`; a `## Open Questions` heading in `spec.md`; the phrase "Requires Human Review" in `change.md`. Any missing item fails verify for that Change.
  - Documented limitation: verify cannot mechanically confirm no application code was modified by an enrichment step (would require diff-against-snapshot, not built here).
- **Documentation**: `docs/Workflow.md` (canonical) positions `aief enrich` in Level 1 (mermaid + text diagrams, a "Starting from a Requirement Source" subsection, and the all-levels lifecycle diagram, including `propose --change`); `docs/requirement-sources.md` (model, provider table, Jira export format, future integration path) and `docs/enrichment-workflow.md` (enrich-specific detail only — points to `docs/Workflow.md` rather than repeating a competing lifecycle diagram) exist; `docs/TEAM-USAGE-GUIDE.md` and `README.md` each gain a concise section pointing to them, including the `propose --change` continuity.
- **Constraints**: no real Jira/Notion/GitHub network integration; no credentials stored; no MCP dependency; no hidden state (everything lives in visible Change files); no accepted ADR modified; no assistant-native execution automation; AIEF does not replace OpenSpec, SpecBoot, Jira, Notion, or any other tool; 1.0 is not declared.

## Acceptance Criteria

- [x] `cli/src/requirement.js` exports `PROVIDERS`, `providerList`, `emptyRequirement`, `normalizeJira` (no `implemented` field — that lives in the adapter registry).
- [x] `cli/src/requirement-providers/index.js` exports `retrieveRequirement`, `hasAdapter`, `implementedProviders`; `manual.js`/`jira.js` each implement the uniform `retrieve()` contract.
- [x] `aief enrich manual TEST-001` creates a Change with source metadata, read-only marker, `[H]`/`[I]`/`[S]` classification, Open Questions, and `Requires Human Review`.
- [x] `aief enrich jira <id>` works both with a local export file (fields correctly mapped) and without one (honest placeholder + Open Question), with no network call.
- [x] `aief enrich <unknown-or-unimplemented-provider>` fails loudly with exit code 1 and guidance.
- [x] Re-running `aief enrich` for the same `provider`/`source-id` does not create a duplicate Change.
- [x] `aief close --yes` refuses an Enrichment Change until its Human Review tasks are checked.
- [x] `aief prompt` on an Enrichment Change instructs the assistant not to implement and not to touch the source.
- [x] `aief propose --change <id>` adds `proposal.md` to the existing Change, creates no new Change directory, and leaves `change.md`/`spec.md` byte-for-byte unchanged; a second run does not overwrite `proposal.md`; an unmatched `--change` value fails with exit code 1; `aief propose "<idea>"` without `--change` still creates a new Change.
- [x] `grep -n 'provider ===' cli/src/cli.js` returns nothing.
- [x] `docs/Workflow.md` names `aief enrich` and `aief propose --change` within Level 1; `docs/enrichment-workflow.md` no longer contains a standalone full-lifecycle diagram, only enrich-specific detail plus a pointer to `docs/Workflow.md`.
- [x] `aief verify` passes on a project with only Discovery/Enrichment Changes and no `README.md`; still requires `README.md` once a non-Enrichment Change exists; fails an Enrichment Change missing any of its four required markers.
- [x] `aief help enrich`, `aief help propose` and `aief --help` document the commands, including `--change`.
- [x] `npm test` green; `aief verify` PASS on this repository.
- [x] No credentials, no live network calls, no accepted ADR modified, 1.0 not declared.
