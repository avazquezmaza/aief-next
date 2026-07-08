# Requirement Sources

Real work in an enterprise rarely starts with `aief new-change`. It starts in Jira, Notion, GitHub Issues, Azure DevOps, ServiceNow, Confluence, a Markdown file, an email, or a call transcript. This document defines how AIEF ingests any of those without becoming coupled to any one of them.

This is the base laid by Change [0030-workflow-cohesion-requirement-sources](../changes/0030-workflow-cohesion-requirement-sources/change.md) — the model, the contract, and one real command (`aief enrich`). It intentionally does not build every integration.

## Why AIEF does not couple to Jira (or any other tool)

The first validation of this idea used a real Jira ticket (INGENIERIA-519, Intelligent Support Assistant). It worked — but it also proved the wrong lesson would be "AIEF talks to Jira." Tomorrow the source is Notion, or a PDF, or a transcript pasted into a chat. If AIEF hard-codes Jira's shape into its workflow, every new source means new core logic. Instead:

- **AIEF defines one contract: the Requirement Source and the Normalized Requirement.**
- **Every provider (jira, notion, github, azure-devops, markdown, manual, …) maps into the same normalized shape.**
- **AIEF never replaces Jira, Notion, GitHub Issues, Confluence, or any other tool.** They stay the system of record; AIEF only reads from them.

## Requirement Source

A Requirement Source is a **read-only** view of one item in an external system (or a human's own words, for `manual`). Its shape (`cli/src/requirement.js`, `emptyRequirement`):

```text
provider      which system it comes from (jira, notion, github, azure-devops, markdown, manual, ...)
sourceId      the item's identifier in that system (e.g. an issue key)
sourceUrl     a link back to the item, if available
title
description
status        the source's own status field (not AIEF's Change status)
priority
reporter
assignee
labels
comments
attachments
links
metadata      provider-specific extras that do not fit the fields above
retrievedAt   when AIEF read it
readOnly      always true — AIEF never writes back
```

## Normalized Requirement

Every provider produces the **same logical object** — the fields above, filled from whatever the provider actually has. A `manual` requirement and a `jira` requirement are the same shape; only how the fields got filled differs. This is what lets AIEF's workflow (enrich → Change → spec → prompt → implementation) stay identical no matter the source.

## Providers in this Change (0030)

| Provider | Status | Notes |
|---|---|---|
| `manual` | **Implemented** | Human-provided. `aief enrich manual <id>` creates the skeleton; a human fills the facts. |
| `jira` | **Implemented (placeholder adapter)** | Reads a **local export file** (`requirements/jira/<issue-key>.json`, or `--file <path>`) in Jira's own REST issue shape. **No network call, no credentials, no live connection.** If the file is absent, `enrich` still creates an honest placeholder Change and says so — it never pretends to have data it doesn't. |
| `notion` | Planned | Not implemented in this Change. |
| `github` | Planned | GitHub Issues. Not implemented in this Change. |
| `azure-devops` | Planned | Not implemented in this Change. |
| `markdown` | Planned | A requirement described in a local Markdown file. Not implemented in this Change. |

Requesting a planned-but-unimplemented provider fails loudly (`aief enrich notion X-1` → error naming what is and isn't implemented) — never a silent fallback.

### The Jira local-export format

Place the Jira REST API issue JSON (the `fields` object, or the full issue payload) at `requirements/jira/<issue-key>.json`, or point to any path with `--file`:

```bash
aief enrich jira ISSUE-123 --file path/to/export.json
```

The adapter reads `fields.summary`, `fields.description` (plain string or Atlassian Document Format), `fields.status.name`, `fields.priority.name`, `fields.reporter`/`fields.assignee`, `fields.labels`, `fields.comment.comments`, `fields.attachment`, `fields.issuelinks`. Any field the export doesn't have is recorded as an assumption `[S]`, never guessed.

### Future integration path (not built in this Change)

The contract is designed so a real Jira/Notion/GitHub adapter — via their REST APIs or an MCP server — can be added later **without changing the Normalized Requirement shape or the `enrich` command**: only `retrieveRequirement()`'s provider branch changes. No credentials are stored in this repo today, and none should be added without a dedicated ADR covering secret handling.

## Read-only, always

No Requirement Source provider writes back to the external system. AIEF does not comment on your Jira ticket, does not change its status, does not create linked issues. Enrichment output lives entirely in the AIEF Change under `changes/`.

See [docs/enrichment-workflow.md](enrichment-workflow.md) for the full command and workflow, and [docs/TEAM-USAGE-GUIDE.md](TEAM-USAGE-GUIDE.md) for how this fits into day-to-day use.
