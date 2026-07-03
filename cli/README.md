# AIEF CLI

Minimal CLI for AIEF projects.

## Run locally

From the repository root:

```bash
node cli/bin/aief.js help
```

## Commands

```bash
node cli/bin/aief.js init my-project
node cli/bin/aief.js new-change add-login
node cli/bin/aief.js use-profile developer
node cli/bin/aief.js verify
node cli/bin/aief.js release 0.1.0
```

## Optional local alias

```bash
alias aief="node /path/to/aief-next/cli/bin/aief.js"
```

Then use:

```bash
aief init my-project
aief new-change add-login
aief verify
```

## Future

Later versions may add:

- OpenSpec integration,
- Specboot integration,
- validation of Change files,
- npm publishing.
