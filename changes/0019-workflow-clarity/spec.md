# Specification

## Goal

A reader of any AIEF document understands which level of the workflow they are looking at, what AIEF does and does not do, and how OpenSpec and Specboot relate to it — from one canonical source.

## Requirements

- `docs/Workflow.md` describes: level 1 (Context: doctor → adopt → verify → analyze → prompt; never implements code), level 2 (Feature: verified OpenSpec Explore → Propose → Apply → Archive via assistant slash commands; profile/assistant extras and Specboot-style skills labeled as unofficial extensions; AIEF neither implements nor duplicates it; local fallback = normal path), level 3 (Governance: verify → close; change.md as source of truth; no commits, no PRs).
- Documental optimizations included: Mermaid three-level diagram, responsibilities table (with "Never does" column), with/without OpenSpec command guide, close-vs-archive table, "What AIEF does not do" list.
- README shows a three-line level summary linking to the canonical doc; docs/cli.md maps commands to levels; cli/README.md, both adapter docs and navigator/workflows.md point to the canonical doc; conflicting flow phrasings removed.
- ADR-011 records the model and its constraints.
- Zero changes under `cli/src/` and `cli/tests/`.

## Acceptance Criteria

- [ ] docs/Workflow.md contains the three levels, diagram, tables, guide and "What AIEF does not do".
- [ ] No document presents enrich-us / adversarial review as official OpenSpec.
- [ ] `git diff` touches only documentation and Change files.
- [ ] Test suite passes; `aief verify` passes.
- [ ] Evidence updated; Change closed with `aief close --yes`.
