# AIEF Starter Project

This is a copy-ready starter project for AIEF.

Use it when you want to start a new software project where humans and AI assistants collaborate through a simple specification-driven workflow.

## Quick Start

Copy this folder:

```bash
cp -R starter-project my-project
cd my-project
```

Then create your first Change:

```bash
mkdir -p changes/0001-my-first-change
cp ../templates/change/* changes/0001-my-first-change/
```

If you copied only this starter project and do not have the root templates, duplicate `changes/0000-example-change/` and rename it.

## Workflow

```text
Idea -> Spec -> Tasks -> Build -> Verify -> Evidence
```

## Project Structure

```text
.
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── GEMINI.md
├── CODEX.md
├── CURSOR.md
├── docs/
├── changes/
├── knowledge/
├── src/
└── tests/
```

## How to Work

1. Create a folder under `changes/`.
2. Write the goal in `change.md`.
3. Define requirements in `spec.md`.
4. Break work into `tasks.md`.
5. Implement in `src/`.
6. Verify with tests or manual checks.
7. Capture results in `evidence.md`.

## AI Assistants

Use `AGENTS.md` as the primary instruction file.

Assistant-specific files are included for convenience:

- `CLAUDE.md`
- `GEMINI.md`
- `CODEX.md`
- `CURSOR.md`

## Minimum Definition of Done

A Change is done when:

- requirements are implemented,
- tasks are complete or remaining work is documented,
- verification was performed,
- evidence was updated,
- the human owner approves the result.
