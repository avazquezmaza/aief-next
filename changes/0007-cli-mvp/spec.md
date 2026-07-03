# Specification

## Goal
Make AIEF easier to use by automating the most common file operations.

## Requirements
- CLI must run with Node.js and no external dependencies.
- `aief init <project-name>` creates an AIEF project.
- `aief new-change <name>` creates a new Change folder.
- `aief use-profile <profile>` prints a ready-to-copy assistant instruction.
- `aief verify` checks required AIEF files.
- `aief release <version>` creates a release note draft.

## Acceptance Criteria
- [ ] CLI files exist under `cli/`.
- [ ] CLI can be run locally with `node cli/bin/aief.js`.
- [ ] CLI creates project structure.
- [ ] CLI creates Change structure.
- [ ] CLI validates minimum required files.
- [ ] CLI docs exist.
