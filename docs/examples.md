# Examples

## Todo App — a minimal executable example

[`examples/todo-app/`](../examples/todo-app/README.md) is a small real project with its own test
suite and its own `changes/0001-create-task/`, showing a complete cycle:
`Idea -> Spec -> Tasks -> Code -> Tests -> Evidence`. Run it yourself:

```bash
cd examples/todo-app
npm test
```

Read `changes/0001-create-task/change.md`, `spec.md`, `tasks.md`, and `evidence.md` in order to see
what a well-formed, closed Change looks like end to end.

## A full worked walkthrough

Starting from an idea, using the standard (no-OpenSpec) path:

```bash
aief new-change add-rate-limiting
```
```text
Created Change: changes/0007-add-rate-limiting/
```

Edit `change.md` (objective, scope, success criteria) and `spec.md` (requirements, acceptance
criteria), then:

```bash
aief prompt claude --profile developer --change 0007-add-rate-limiting
```

This prints a ready-to-paste prompt carrying `AGENTS.md`, `CLAUDE.md`, the `developer` profile,
your project's standards, and any recommended Skills. Paste it into Claude; the assistant
implements only what `change.md`/`spec.md` scope, then updates `evidence.md`.

```bash
aief verify --change 0007-add-rate-limiting
```
```text
Result: PASS
```

```bash
aief close --yes --change 0007-add-rate-limiting
```
```text
✓ Closed changes/0007-add-rate-limiting.
```

## A worked example with a `track`

Add `manifest.json` to opt a Change into the Workflow Engine:

```json
{
  "schema": "aief.change/v1",
  "id": "0007-add-rate-limiting",
  "slug": "add-rate-limiting",
  "title": "Add rate limiting",
  "status": "open",
  "track": "standard"
}
```

Now `aief status --change 0007-add-rate-limiting` narrates stage and gates:

```text
Track: standard
Stage: verify
Blockers:
  - readiness: pending — evidence.md is still a placeholder
```

Once evidence is real and `aief verify` passes, the same command reports stage `review`, then
`close`, matching `standard.json`'s stage sequence (see [Configuration](configuration.md)).

## A worked example starting from a ticket

```bash
aief enrich manual TICKET-42
```
```text
Created Change: changes/0008-manual-ticket-42/
Source: manual:TICKET-42 (read-only; nothing was written back to manual).

This Change requires human review before any implementation.
```

Fill in `spec.md`'s Normalized Requirement and answer its Open Questions, check off the Human
Review tasks in `tasks.md`, then continue with `aief propose --change 0008-manual-ticket-42` or
straight to `aief prompt`.

## Requirement Verification

```bash
aief verify --change 0007-add-rate-limiting --requirements
```
```text
Requirement Verification: INCOMPLETE
  R1 — requirement-has-traceability: failed — not cited in verification.md
```

See [Workflow — Verification](workflow.md#verification) for what each aggregate status means.
