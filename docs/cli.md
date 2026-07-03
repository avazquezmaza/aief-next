# AIEF CLI

The AIEF CLI removes manual folder creation.

## Basic commands

```bash
node cli/bin/aief.js help
node cli/bin/aief.js init my-project
node cli/bin/aief.js new-change add-login
node cli/bin/aief.js verify
```

## Recommended workflow

```bash
aief init my-project
cd my-project
aief new-change add-login
aief use-profile developer
aief verify
```

## Why this exists

AIEF should be easy to use.

The CLI helps users avoid asking:

- Where do I put files?
- What files does a Change need?
- How do I start?
