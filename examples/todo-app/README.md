# Todo App Example

This is a minimal executable example that demonstrates AIEF.

It shows how a small feature can move from:

```text
Idea -> Spec -> Tasks -> Code -> Tests -> Evidence
```

## Requirements

- Node.js 18 or newer

## Run Tests

```bash
npm test
```

## Structure

```text
examples/todo-app/
├── README.md
├── package.json
├── src/
│   └── todo.js
├── tests/
│   └── todo.test.js
└── changes/
    └── 0001-create-task/
        ├── change.md
        ├── spec.md
        ├── tasks.md
        └── evidence.md
```

## What this example teaches

- How to document a Change.
- How to turn a specification into tasks.
- How to implement only the requested scope.
- How to verify behavior.
- How to capture evidence.

## Change

See:

```text
changes/0001-create-task/
```
