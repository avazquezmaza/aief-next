# Existing Project Path

Use this path when you already have a project and want to adopt AIEF.

## Principle

Do not reorganize the whole project on day one.

Adopt AIEF gradually.

## Step 1: Create a checkpoint

```bash
git status
git add .
git commit -m "checkpoint before adopting AIEF"
```

## Step 2: Let the CLI adopt the project

From your project's root ([install the CLI first](../bootstrap.md)):

```bash
aief doctor    # environment + readiness, writes nothing
aief init      # or `aief adopt` — same guarantees
```

This creates everything the manual path used to require — `AGENTS.md` (if missing), `changes/` with the adoption Change (evidence auto-generated), `knowledge/` with starter standards matched to your stack, `profiles/` — without touching application code and without overwriting anything.

Optional assistant files you can add yourself:

```text
CLAUDE.md
GEMINI.md
CODEX.md
CURSOR.md
```

## Step 3: Verify and analyze

```bash
aief verify    # confirm the structure
aief analyze   # Analysis Change seeded with everything doctor detected
aief prompt claude --profile architect   # hand the analysis to your assistant
```

## Step 4: Grow the knowledge

`knowledge/` is yours to extend:

- decisions,
- constraints,
- lessons learned,
- recurring patterns.

Edit the starter standards in `knowledge/standards/` — the `(adapt)` lines are meant to be replaced with your project's reality.

## Step 5: Use AIEF for the next real change

Do not backfill every old feature.

Start with the next real piece of work.

## What Not to Do

Avoid:

- moving all source code,
- rewriting docs unnecessarily,
- creating many empty folders,
- forcing OpenSpec or SpecBoot before the team understands AIEF.

## Recommended First Change

```text
changes/0001-adopt-aief/
```

Objective:

```text
Adopt AIEF structure and agent instructions without changing application behavior.
```
