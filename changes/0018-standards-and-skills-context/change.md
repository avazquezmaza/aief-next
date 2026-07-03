# Change

## ID

`0018-standards-and-skills-context`

## Type

General

## Objective

Incorporate the useful ideas from LIDR Specboot — modular project standards and operational skill knowledge — into AIEF as contextual knowledge for prompts, without copying Specboot, without reimplementing OpenSpec's Proposal → Spec → Tasks workflow, and keeping AIEF a simple workflow engine.

## Scope

### In scope

- Review LIDR Specboot (concepts only) and the real OpenSpec repository (workflow facts).
- Starter standards templates (`cli/templates/standards/`: base, documentation, testing, security, frontend, backend).
- `aief adopt` creates `knowledge/standards/` matched to detected signals; never overwrites; registers it in the adoption Change.
- `aief analyze` seeds the Analysis Change with detected signals, recommended Skills, available standards, inferred risks (marked as inference) and open questions.
- Skills carry operational content in the catalog: name, whenToUse, standardsToRead, promptContext, commonRisks, evidenceExpectations — keeping detector / recommendation / content as distinct concepts.
- `aief prompt` includes standards and Skill context honestly (context, not execution; explicit note when a Skill has no operational content).
- OpenSpec adapter documents the official workflow and the slash-command finding; ADR-010; user docs.

### Out of scope

- Copying Specboot files or structure.
- Reimplementing OpenSpec proposal/spec/task generation or archiving.
- Executable Skills or plugin systems.
- New dependencies.

## Success Criteria

- The flow works with no OpenSpec and no Specboot installed.
- Adopted projects get a useful, editable knowledge base.
- `analyze` is no longer a generic template.
- `prompt` uses standards and Skills as context without overclaiming.
- Full suite passes; `aief verify` passes.

## Status

Closed (2026-07-03)
