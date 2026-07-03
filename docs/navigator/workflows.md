# Workflows

All variants below are combinations of the same [three-level AIEF workflow](../Workflow.md): AIEF context (level 1), assistant/OpenSpec feature work (level 2), AIEF governance (level 3).

Choose the smallest workflow that works.

## Workflow A: AIEF Only

Best for:

- solo projects,
- small teams,
- simple features,
- documentation changes.

Use:

```text
change.md
spec.md
tasks.md
evidence.md
```

## Workflow B: AIEF + OpenSpec

Best for:

- formal specs,
- review-heavy teams,
- architecture-sensitive changes.

Use:

```text
OpenSpec proposal/spec/tasks
AIEF evidence
```

## Workflow C: AIEF + Specboot

Best for:

- multiple AI assistants,
- teams using Claude, Gemini, Codex, Cursor, or Copilot together,
- stronger agent rules.

Use:

```text
AGENTS.md
assistant-specific files
profiles/
```

## Workflow D: Full AIEF Stack

Best for:

- repeatable team workflows,
- AI-assisted delivery,
- projects that need traceability.

Use:

```text
AIEF CLI
OpenSpec
Specboot-style instructions
profiles
evidence
```

## Rule

Do not start with the most advanced workflow.

Start simple and grow only when needed.
