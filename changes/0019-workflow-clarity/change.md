# Change

## ID

`0019-workflow-clarity`

## Type

General

## Objective

Explain the complete workflow clearly as three levels — AIEF Context Workflow, OpenSpec / Assistant Feature Workflow, AIEF Governance Workflow — taking inspiration from the clarity of Specboot/OpenSpec while preserving AIEF's architecture. Documentation and textual UX only.

## Scope

### In scope

- Rewrite `docs/Workflow.md` as the canonical workflow document (reusing the existing file to avoid a case-insensitive filesystem collision with a new `docs/workflow.md`).
- Documental optimizations: three-level Mermaid diagram, AIEF/OpenSpec/Specboot/Assistant responsibilities table, with/without OpenSpec guide, `aief close` vs `/archive` comparison, "What AIEF does not do" section.
- Align README.md, docs/cli.md, cli/README.md, adapters/openspec/ (README + workflow.md), docs/navigator/workflows.md to summarize the canonical document.
- Document only the verified OpenSpec workflow (Explore → Propose → Apply → Archive); present enrich-us / adversarial review as Specboot-style skill examples, never as official OpenSpec commands.
- ADR-011 in knowledge/decisions.md.

### Out of scope

- Any CLI behavior change, new command, new state or functional code.
- Copying Specboot or OpenSpec content.
- Claiming validation against an installed OpenSpec release.

## Success Criteria

- The three levels are clearly distinguished and every workflow description points to one canonical source.
- `aief close` ≠ `/archive` is explicit; the local no-OpenSpec path is documented as normal.
- Tests still pass; `aief verify` passes; CLI behavior byte-identical.

## Status

Closed (2026-07-03)
