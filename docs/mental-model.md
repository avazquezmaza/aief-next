# AIEF Mental Model

> Quick orientation. Canonical references: [architecture.md](architecture.md), [ecosystem.md](ecosystem.md), [lifecycle.md](lifecycle.md).

## One sentence

**AIEF coordinates the engineering workflow.**

It does **not** replace OpenSpec, SpecBoot or your AI assistant.

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

## What do I run?

- `aief init` (existing project) or `aief init <name>` (new project)
- `aief new-change <name>` for each unit of work
- `aief prompt <assistant>` to hand context to the AI
- `aief verify` and `aief close --yes` to govern the outcome

(Manual alternative: copy `templates/change/` yourself.)

## What does the AI use?

Everything `aief prompt` composes for it:

- AGENTS.md
- CLAUDE.md / GEMINI.md / CODEX.md / CURSOR.md
- profile (`--profile`)
- knowledge/standards/ and recommended Skills
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
