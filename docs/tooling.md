# Tooling

## AIEF only

Use the templates manually.

## AIEF + OpenSpec

Use OpenSpec to generate proposals, specifications and task lists.

```text
Idea
 ↓
OpenSpec proposal
 ↓
spec
 ↓
tasks
```

## AIEF + Specboot

Use Specboot to bootstrap and maintain AI instruction files.

Source of truth remains:

```text
AGENTS.md
```

Assistant-specific files extend AGENTS.md.

## Full Stack

```text
AIEF
  │
  ├── OpenSpec (Specifications)
  ├── Specboot (Agent Instructions)
  └── AI Assistant (Claude/Gemini/Codex/Cursor)
```
