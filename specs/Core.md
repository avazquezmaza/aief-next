# AIEF Core

AIEF Core defines the minimum concepts needed to use the framework.

## Concepts

### Project

A Project is the working context.

It contains documentation, agent instructions, changes, and knowledge.

### Change

A Change is the basic unit of work.

Examples:

- feature,
- bug fix,
- refactor,
- documentation update,
- research spike.

### Knowledge

Knowledge is what the project learns over time.

Examples:

- decisions,
- patterns,
- lessons learned,
- constraints,
- known issues.

## Minimum Project Structure

```text
project/
├── README.md
├── AGENTS.md
├── changes/
└── knowledge/
```

## Minimum Change Structure

```text
change/
├── change.md
├── spec.md
├── tasks.md
└── evidence.md
```
