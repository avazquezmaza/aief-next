# AI Assistants

AIEF works with any AI assistant.

## Source of Truth

```text
AGENTS.md
```

Assistant-specific files extend `AGENTS.md`.

They should not duplicate it.

## Claude Code

Use:

```text
AGENTS.md
CLAUDE.md
profiles/<role>.md
changes/<active-change>/
```

Suggested prompt:

```text
Follow AGENTS.md and CLAUDE.md.
Act as the Developer profile.
Work only on changes/0001-add-login.
```

## Gemini

Use:

```text
AGENTS.md
GEMINI.md
profiles/<role>.md
changes/<active-change>/
```

## Codex

Use:

```text
AGENTS.md
CODEX.md
profiles/developer.md
changes/<active-change>/
```

## Cursor

Use:

```text
AGENTS.md
CURSOR.md
changes/<active-change>/
```

## ChatGPT or Other Assistants

Use:

```text
AGENTS.md
profiles/<role>.md
change.md
spec.md
tasks.md
```

## Common Rule

The AI should always know:

1. Which Change is active.
2. Which profile it should follow.
3. What the acceptance criteria are.
4. Where to write evidence.
