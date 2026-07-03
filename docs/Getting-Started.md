# Getting Started

AIEF is designed to be usable in minutes.

## 1. Start from the project template

```bash
cp -R templates/project my-project
cd my-project
```

## 2. Create your first Change

```bash
mkdir -p changes/0001-my-first-change
cp ../templates/change/* changes/0001-my-first-change/
```

## 3. Describe the Change

Edit:

```text
changes/0001-my-first-change/change.md
changes/0001-my-first-change/spec.md
changes/0001-my-first-change/tasks.md
```

## 4. Ask your AI assistant to help

Give the assistant:

```text
AGENTS.md
changes/0001-my-first-change/spec.md
changes/0001-my-first-change/tasks.md
```

## 5. Verify and update evidence

Edit:

```text
changes/0001-my-first-change/evidence.md
```

That is the minimum AIEF loop.
