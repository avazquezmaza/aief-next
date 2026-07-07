# AI Assistants

AIEF works with any AI assistant. No assistant is required, none is special.

## Source of Truth

```text
AGENTS.md
```

Assistant-specific files extend `AGENTS.md`. They should not duplicate it.

## Let AIEF compose the prompt

You do not write assistant prompts by hand — the Prompt Engine composes one from the full context (AGENTS.md, the assistant file, the profile, your standards, the recommended Skills and the active Change):

```bash
aief prompt claude --profile developer     # or: architect, reviewer, ...
aief prompt gemini
aief prompt codex
aief prompt cursor
```

Each command selects the matching instruction file (`CLAUDE.md`, `GEMINI.md`, `CODEX.md`, `CURSOR.md`) when it exists. Unknown assistant names fail with guidance — never a silent fallback.

Paste the generated prompt into the assistant and let it work inside the Change.

## ChatGPT, Copilot or other assistants

Run `aief prompt` (without an assistant, it includes `CLAUDE.md` if present, otherwise just the universal context) and paste the output — the generated prompt is plain text and works in any assistant. The universal rules in `AGENTS.md` apply to all of them.

## Common Rule

Whatever the assistant, the generated prompt always tells it:

1. Which Change is active.
2. Which profile to follow.
3. Which standards and Skills apply.
4. Where to write evidence.

If you ever need to brief an assistant manually, give it the same files the Prompt Engine uses: `AGENTS.md`, the assistant file, `knowledge/standards/`, `knowledge/skills.md` and the active Change directory.
