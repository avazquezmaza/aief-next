# Security Standards

> Security rules for this project. Created by `aief adopt`. Edit to match reality.

## Secrets

- Secrets live in the environment or a secret manager — never in the repository, prompts or evidence files.
- `.env*` files are gitignored; a documented `.env.example` carries no real values.

## Inputs and outputs

- Validate and sanitize every external input at the boundary.
- Errors shown to users never include stack traces, queries or internal paths.

## Authorization

- Authorization is enforced server-side for every operation.
- (adapt) Roles/permissions model and where it is enforced.
- If multitenant: every data access is tenant-scoped; cross-tenant access is a critical bug.

## Dependencies

- (adapt) Audit policy (e.g. `npm audit`) and how often dependencies are reviewed.
- New dependencies require justification in the Change that adds them.
