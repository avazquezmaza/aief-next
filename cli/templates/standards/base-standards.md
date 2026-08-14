# Base Standards

> Project-wide rules every contributor — human or AI — follows.
> Created by `aief adopt`. Edit each "(adapt)" line to match how this project actually works.

## Applies now

Governance rules that hold whether or not application code exists yet — including during a
Definition Change (see `aief new-change --type definition`), before any implementation.

- Small changes, one at a time; every meaningful unit of work is an AIEF Change.
- No change is complete without verification and evidence.
- Architecture or product decisions get explicit human approval and a durable record — never
  assumed. Before implementation, that record is a Definition Change's `Decision (human)` section
  and `knowledge/decisions.md`; after, the same file continues to be the source of truth.

### Definition of Done (governance)

- [ ] Acceptance criteria in spec.md are met.
- [ ] evidence.md completed.
- [ ] Documentation updated when behavior changed.

## Applies once implementation starts

Concrete, code-level rules — meaningless before there is code to apply them to.

### Naming and style

- Prefer readable code over clever code.
- (adapt) Naming conventions for files, variables and branches.
- (adapt) Linter / formatter configuration to respect, if one exists.

### Git conventions

- (adapt) Branch naming, commit message format, PR expectations.
- Never commit secrets or environment files.

### Definition of Done (implementation)

- [ ] Tests pass (see testing-standards.md).
