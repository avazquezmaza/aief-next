# AIEF Runtime

The Runtime defines how AI assistants work inside an AIEF project.

## Source of Truth

`AGENTS.md` is the universal source of truth.

Assistant-specific files should only add differences:

```text
CLAUDE.md
GEMINI.md
CODEX.md
CURSOR.md
```

## Runtime Responsibilities

AI assistants may:

- summarize requirements,
- propose tasks,
- implement scoped changes,
- update documentation,
- generate evidence,
- identify risks.

AI assistants must not:

- approve releases,
- invent requirements,
- silently expand scope,
- ignore evidence.
