# Backend Standards

> Server-side rules for this project.
> Created by `aief adopt` because backend signals were detected. Edit to match reality.

## API design

- (adapt) API style (REST / GraphQL / RPC), versioning strategy, error format.
- Validate every input at the boundary; never trust client data.
- Return consistent error shapes; never leak internals or stack traces.

## Data access

- (adapt) ORM / query layer and migration workflow.
- Every tenant-scoped query filters by tenant (if the project is multitenant).
- Migrations are reviewed like code.

## Security

- Authorization is enforced server-side on every route — the UI is not a security boundary.
- Secrets come from the environment or a secret manager, never from the repository.
- Details in security-standards.md.

## Testing

- Business logic is unit-tested; critical flows have integration tests.
- Details in testing-standards.md.
