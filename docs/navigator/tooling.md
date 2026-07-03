# Tooling

AIEF can be used with or without additional tools.

## Level 1: AIEF Only

Use this when you want the simplest workflow.

You need:

```text
AGENTS.md
changes/
templates/change/
```

Use:

```bash
node cli/bin/aief.js new-change add-login
```

## Level 2: AIEF + OpenSpec

Use this when you want help creating proposals, specifications, and task lists.

AIEF remains the workflow.

OpenSpec helps with specification structure.

```text
Idea
  -> OpenSpec proposal/spec/tasks
  -> AIEF Change
  -> Build
  -> Evidence
```

## Level 3: AIEF + Specboot

Use this when you want stronger AI assistant instruction files.

AIEF remains the workflow.

Specboot-style files help AI assistants understand the repository.

```text
AGENTS.md
  -> CLAUDE.md / GEMINI.md / CODEX.md / CURSOR.md
  -> profiles/
  -> active Change
```

## Level 4: Full Stack

```text
AIEF
  ├── CLI for project/change automation
  ├── OpenSpec for structured specs
  ├── Specboot for agent instruction bootstrap
  └── AI assistant for implementation
```

## Recommendation

Start with Level 1.

Add OpenSpec or Specboot only when they solve a real problem.
