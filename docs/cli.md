# AIEF CLI

The CLI makes AIEF easier to use.

## Main commands

```bash
aief doctor
aief status
aief init my-project
aief new-change add-login
aief propose "Add login"
aief verify
aief release 0.1.0
```

## Recommended setup

From the AIEF repository:

```bash
cd cli
npm link
```

Then:

```bash
aief help
```

## Doctor

```bash
aief doctor
```

Checks:

- Git
- Node
- npm
- OpenSpec availability
- AIEF project files

## Status

```bash
aief status
```

Shows:

- AIEF files
- adapters
- profiles
- number of Changes
- recent Changes

## Propose

```bash
aief propose "Add login"
```

Behavior:

1. If OpenSpec is installed, AIEF tries to delegate proposal creation.
2. If not, AIEF creates a local Change skeleton and `proposal.md`.

This keeps AIEF usable with or without OpenSpec.

## Verify

```bash
aief verify
```

Checks the required AIEF structure and each Change folder.

## Philosophy

The CLI should make the simple workflow easier without hiding the AIEF model.
