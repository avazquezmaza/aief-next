# Change

## ID

`0142-fix-readme-drift-and-node-version`

## Type

General

## Objective

Fix documentation drift across repository README files:
1. Update root `README.md` to reflect the Node >= 22 prerequisite established in Change 0126 and declared in `package.json`.
2. Update `cli/README.md` to replace references to the obsolete `aief adopt` command with the current `aief bootstrap` command (established in Change 0052 / AIEF 3.1).

## Scope

### In scope

- `README.md`: update `Requires Node.js >= 18` to `Requires Node.js >= 22`.
- `cli/README.md`: replace occurrences of `aief adopt` with `aief bootstrap`, update section header `### Adoption` to `### Bootstrap`, and update test description mention from `adoption idempotence` to `bootstrap idempotence`.

### Out of scope

- Application code changes.
- Modifying historical documents in `docs/history/` or test study fixtures in `changes/0096-run-usability-validation-study/fixtures/`.

## Success Criteria

- No active README references Node 18 or the obsolete `aief adopt` command.
- All internal markdown links continue to resolve properly.
- `npm test`, `npm run lint`, and `node cli/bin/aief.js verify --change 0142-fix-readme-drift-and-node-version --strict` all pass.
