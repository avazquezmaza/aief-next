# AIEF CLI

The AIEF CLI automates the most common AIEF actions.

## Run locally

```bash
node cli/bin/aief.js help
```

## Commands

```bash
node cli/bin/aief.js doctor
node cli/bin/aief.js status
node cli/bin/aief.js init my-project
node cli/bin/aief.js new-change add-login
node cli/bin/aief.js propose "Add login"
node cli/bin/aief.js use-profile developer
node cli/bin/aief.js verify
node cli/bin/aief.js release 0.1.0
```

## Local alias

```bash
alias aief="node /path/to/aief-next/cli/bin/aief.js"
```

Then:

```bash
aief doctor
aief status
aief new-change add-login
```

## npm link

From the repository root:

```bash
cd cli
npm link
```

Then use:

```bash
aief help
aief doctor
aief init my-project
```

## OpenSpec integration

`aief propose` checks if OpenSpec is available.

If OpenSpec is installed, it attempts to delegate proposal creation.

If OpenSpec is not installed, it creates a local AIEF Change with `proposal.md`.

```bash
aief propose "Add login"
```

## Commands explained

### doctor

Checks local tooling and project status.

### status

Shows AIEF repository/project health and recent Changes.

### init

Creates a new AIEF-compatible project.

### new-change

Creates a new Change folder.

### propose

Creates or delegates a proposal.

### use-profile

Prints a ready-to-copy assistant prompt.

### verify

Checks required files and Change structure.

### release

Creates release notes.
