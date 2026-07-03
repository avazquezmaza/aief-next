# AIEF Mental Model

## One sentence

**AIEF coordinates the engineering workflow.**

It does **not** replace OpenSpec, Specboot or your AI assistant.

## The flow

```text
Idea
  ↓
Create a Change
  ↓
change.md
spec.md
tasks.md
evidence.md
  ↓
Need help writing?
  ├── No → edit manually
  └── Yes → use OpenSpec
             ↓
Choose an AI assistant
             ↓
AGENTS.md + Profile
             ↓
Implement
             ↓
Verify
             ↓
Update evidence.md
             ↓
Merge / Release
```

## What do I read first?

1. README.md
2. docs/learning-path.md
3. examples/todo-app/

## What do I copy?

- starter-project/
- templates/change/

## What does the AI use?

- AGENTS.md
- CLAUDE.md / GEMINI.md / CODEX.md / CURSOR.md
- profiles/
- active Change

## What do I edit?

- change.md
- spec.md
- tasks.md
- evidence.md
- source code
- tests

## What should I avoid changing?

- AGENTS.md (unless improving global rules)
- profiles/ (unless role definitions change)
- adapters/ (unless integration changes)
