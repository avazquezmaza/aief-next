# AIEF

**The simplest way to start an AI Engineering project.**

AIEF helps humans and AI assistants collaborate using a small, repeatable, specification-driven workflow.

- Learn the basics in 10 minutes.
- Start your first project in 15 minutes.
- Work with Claude, Gemini, Codex, Cursor, GitHub Copilot, ChatGPT, or any AI assistant.

---

## Why AIEF?

AI-assisted development often becomes inconsistent:

- different prompts,
- different expectations,
- undocumented decisions,
- missing validation,
- no evidence of what changed.

AIEF keeps the process simple:

```text
Idea -> Spec -> Tasks -> Build -> Verify -> Evidence
```

Every meaningful change has a specification, tasks, and evidence.

---

## Core Principles

1. **Human-Led**: AI assists, humans decide.
2. **Specification-Driven**: do not build before the goal is clear.
3. **Simplicity First**: start small; add complexity only when needed.
4. **Tool Agnostic**: use any AI assistant or development tool.
5. **Evidence over Opinion**: close work with proof, not assumptions.

---

## Quick Start

### 1. Create a project

Copy the project template:

```bash
cp -R templates/project my-project
cd my-project
```

### 2. Create your first Change

```bash
mkdir -p changes/0001-my-first-change
cp ../templates/change/* changes/0001-my-first-change/
```

### 3. Fill the Change files

```text
changes/0001-my-first-change/
├── change.md
├── spec.md
├── tasks.md
└── evidence.md
```

### 4. Work with your AI assistant

Point your assistant to:

```text
AGENTS.md
changes/0001-my-first-change/spec.md
changes/0001-my-first-change/tasks.md
```

### 5. Verify and capture evidence

Update:

```text
changes/0001-my-first-change/evidence.md
```

Done.

---

## Project Structure

```text
project/
├── README.md
├── AGENTS.md
├── changes/
│   └── 0001-example-change/
│       ├── change.md
│       ├── spec.md
│       ├── tasks.md
│       └── evidence.md
└── knowledge/
```

---

## Workflow

```text
Define
  ↓
Design
  ↓
Build
  ↓
Verify
  ↓
Release
```

For small changes, `Design` can be lightweight. The important rule is simple:

> Every change must be understandable, actionable, and verifiable.

---

## AI Assistant Support

AIEF uses `AGENTS.md` as the universal source of truth.

Assistant-specific files only add small adaptations:

```text
AGENTS.md   universal rules
CLAUDE.md   Claude-specific guidance
GEMINI.md   Gemini-specific guidance
CODEX.md    Codex-specific guidance
CURSOR.md   Cursor-specific guidance
```

---

## Example

See:

```text
examples/todo-app/
```

It shows a complete change from idea to evidence.

---

## Dogfooding

AIEF is developed using AIEF.

Every meaningful repository change should include:

```text
changes/<change-id>/
├── change.md
├── spec.md
├── tasks.md
└── evidence.md
```

---

## Roadmap

- `v0.1`: starter repository
- `v0.2`: usable project template and example
- `v0.3`: OpenSpec alignment
- `v0.4`: Specboot alignment
- `v1.0`: stable starter release

---

## License

MIT.
