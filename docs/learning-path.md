# Learning Path

Use this path if you are new to AIEF.

## 1. Read the README

Understand the basic idea:

```text
Idea -> Change -> Spec -> Tasks -> Build -> Verify -> Evidence
```

## 2. Open the Todo App example

```text
examples/todo-app/
```

Run:

```bash
npm test
```

## 3. Install the CLI and initialize a project

```bash
cd aief-next && npm install && npm link
aief init my-project && cd my-project     # or `aief init` inside an existing project
```

## 4. Create your first Change

```bash
aief new-change my-first-change
```

Fill in `change.md`, `spec.md` and `tasks.md`.

## 5. Work with an AI assistant

```bash
aief prompt claude    # or: gemini, codex, cursor
```

The generated prompt gives the assistant `AGENTS.md`, your standards, the recommended Skills and the active Change.

## 6. Capture evidence and close

Update `evidence.md`, then:

```bash
aief verify
aief close --yes
```

That is AIEF. Next: [lifecycle.md](lifecycle.md) for the full stage-by-stage picture, [architecture.md](architecture.md) for how it works inside.
