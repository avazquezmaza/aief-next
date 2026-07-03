# Specification

## Goal

Provide a simple adapter for teams that want to use AIEF with OpenSpec.

## Requirements

- The adapter must explain the relationship between AIEF and OpenSpec.
- The adapter must keep AIEF tool-agnostic.
- The adapter must define a clear mapping:
  - AIEF `change.md` to OpenSpec `proposal.md`
  - AIEF `spec.md` to OpenSpec spec deltas
  - AIEF `tasks.md` to OpenSpec `tasks.md`
  - AIEF `evidence.md` remains AIEF-specific
- The adapter must include minimal templates.
- The adapter must include one example.

## Acceptance Criteria

- [ ] `adapters/openspec/README.md` exists.
- [ ] `adapters/openspec/mapping.md` exists.
- [ ] `adapters/openspec/workflow.md` exists.
- [ ] `templates/openspec/change/` includes basic templates.
- [ ] `examples/openspec-mapping/` includes one example mapping.

## Constraints

- Do not require OpenSpec to use AIEF.
- Keep documentation concise.
- Avoid duplicating OpenSpec documentation.
