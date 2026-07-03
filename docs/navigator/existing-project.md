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

## Step 2: Add agent instructions

Copy or create:

```text
AGENTS.md
```

Optional:

```text
CLAUDE.md
GEMINI.md
CODEX.md
CURSOR.md
```

## Step 3: Add Changes

```bash
mkdir -p changes
```

Create the first adoption Change:

```text
changes/0001-adopt-aief/
├── change.md
├── spec.md
├── tasks.md
└── evidence.md
```

## Step 4: Add Knowledge

```bash
mkdir -p knowledge
```

Use it for:

- decisions,
- constraints,
- lessons learned,
- recurring patterns.

## Step 5: Use AIEF for the next real change

Do not backfill every old feature.

Start with the next real piece of work.

## What Not to Do

Avoid:

- moving all source code,
- rewriting docs unnecessarily,
- creating many empty folders,
- forcing OpenSpec or Specboot before the team understands AIEF.

## Recommended First Change

```text
changes/0001-adopt-aief/
```

Objective:

```text
Adopt AIEF structure and agent instructions without changing application behavior.
```
