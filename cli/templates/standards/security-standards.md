# Security Standards

> Security rules for this project. Created by `aief adopt`. Edit to match reality.

## Applies now

Security is a set of decisions made before code exists, not a review performed after — resolve
these during Definition, with explicit human approval for anything architectural.

- Classify the data this project will handle (public / internal / confidential / regulated) and
  record who owns each category — a Definition Change's Data & Domain section is where this
  belongs before implementation.
- Decide the authentication and authorization model (who can act as whom, what a role can do) as
  an explicit, human-approved decision — record it in `knowledge/decisions.md`, not inferred later
  from whatever the code happens to enforce.
- If multitenant: decide the tenant-isolation model (shared schema, schema-per-tenant, …) as a
  Definition-stage decision, not an implementation detail discovered afterward.
- (adapt) Compliance/regulatory constraints (e.g. data residency, retention) that apply to this
  project, and who signs off on them.

## Applies once implementation starts

### Secrets

- Secrets live in the environment or a secret manager — never in the repository, prompts or
  evidence files. This includes API tokens, cloud/provider keys (e.g. AWS), bot tokens (e.g.
  Telegram), and PINs — any value that grants access on its own.
- `.env*` files are gitignored; a documented `.env.example` carries no real values.

### Inputs and outputs

- Validate and sanitize every external input at the boundary.
- Errors shown to users never include stack traces, queries or internal paths.

### Authorization

- Authorization is enforced server-side for every operation, per the model decided during
  Definition.
- (adapt) Roles/permissions model and where it is enforced.
- If multitenant: every data access is tenant-scoped; cross-tenant access is a critical bug.

### Dependencies

- (adapt) Audit policy (e.g. `npm audit`) and how often dependencies are reviewed.
- New dependencies require justification in the Change that adds them.
