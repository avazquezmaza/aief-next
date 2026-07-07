# AIEF to SpecBoot Mapping

| AIEF | SpecBoot-style equivalent | Notes |
|---|---|---|
| `AGENTS.md` | Universal agent rules | Source of truth. |
| `CLAUDE.md` | Claude-specific instructions | Only differences from `AGENTS.md`. |
| `GEMINI.md` | Gemini-specific instructions | Only differences from `AGENTS.md`. |
| `CODEX.md` | Codex-specific instructions | Only differences from `AGENTS.md`. |
| `CURSOR.md` | Cursor-specific instructions | Only differences from `AGENTS.md`. |
| `profiles/` | Role guidance | Model-agnostic behavior profiles. |
| `changes/` | Work context | Active implementation boundary. |

## Recommended hierarchy

```text
AGENTS.md
  -> assistant-specific file
  -> optional profile
  -> active Change
```

Example prompt:

```text
Follow AGENTS.md.
Use the Developer profile.
Work only on changes/0001-create-task.
```
