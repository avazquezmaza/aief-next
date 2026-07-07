# Migration Guide

Use this guide to adopt AIEF in an existing project. The CLI does the structural work; you keep full control of what changes.

## Principle

Do not reorganize the whole project on day one. Adopt AIEF gradually, starting with the next real piece of work.

## Step 1: Create a checkpoint

```bash
git add .
git commit -m "checkpoint before adopting AIEF"
```

## Step 2: Let the CLI adopt the project

From your project's root ([install the CLI first](bootstrap.md)):

```bash
aief doctor    # environment + readiness report — writes nothing
aief init      # or `aief adopt` — same logic, same guarantees
```

This creates everything the manual path used to require:

- `AGENTS.md` (if missing) — the rules every assistant follows,
- `changes/` with an adoption Change (evidence auto-generated),
- `knowledge/standards/` starter standards matched to your stack,
- `profiles/`.

Guarantees: never modifies application code, never overwrites existing files, idempotent.

Optional assistant files you can add yourself: `CLAUDE.md`, `GEMINI.md`, `CODEX.md`, `CURSOR.md`.

## Step 3: Start with one Change

Do not migrate everything. Analyze first, then take the next real piece of work:

```bash
aief analyze                 # Analysis Change seeded with detected context
aief prompt claude --profile architect
```

## Step 4: Close with evidence

When a Change is complete, its `evidence.md` says what actually happened:

```bash
aief verify
aief close --yes
```

## Step 5: Grow knowledge over time

Edit `knowledge/standards/` so the `(adapt)` markers match your project, and add decisions or lessons to `knowledge/` only when they are worth keeping.

## Full lifecycle

Stage-by-stage detail: [lifecycle.md](lifecycle.md) · Existing-project walkthrough: [navigator/existing-project.md](navigator/existing-project.md)
