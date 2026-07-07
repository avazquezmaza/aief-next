# New Project Path

Use this path when you are starting from zero.

## Goal

Create a new AIEF-compatible project quickly.

## Option A: Use the CLI (recommended)

Install once from the AIEF repository root ([bootstrap guide](../bootstrap.md)):

```bash
npm install && npm link
```

Then anywhere:

```bash
aief init my-project
cd my-project
aief new-change my-first-change
aief verify
```

## Option B: Copy the starter project (manual alternative)

```bash
cp -R starter-project my-project
cd my-project
```

Then create your first Change:

```bash
mkdir -p changes/0001-my-first-change
```

Add:

```text
change.md
spec.md
tasks.md
evidence.md
```

## What to Read

1. `README.md`
2. `AGENTS.md`
3. `changes/README.md`

## What to Edit

For your first Change, edit:

```text
changes/0001-my-first-change/change.md
changes/0001-my-first-change/spec.md
changes/0001-my-first-change/tasks.md
changes/0001-my-first-change/evidence.md
```

## What the AI Uses

Give your AI assistant:

```text
AGENTS.md
profiles/developer.md
changes/0001-my-first-change/
```

## Done When

- Implementation is complete.
- Verification is complete.
- `evidence.md` is updated.
- Human owner approves.
