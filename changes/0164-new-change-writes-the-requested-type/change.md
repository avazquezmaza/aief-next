# Change

## ID

`0164-new-change-writes-the-requested-type`

## Type

Fix

## Objective

`aief new-change <name> --type <type>` writes the requested type in `change.md`. Found while
opening Change 0163: `--type feature` named the branch `feature/...` but wrote `Type: General`. The
value is also used raw — `--type Definicion` gets the generic scaffold, and `--type bogus` creates
a `bogus/...` branch — although `normalizeChangeType()` (Change 0161) already defines the closed
list and its aliases.

## Scope

### In scope

- `new-change` normalizes `--type` with `normalizeChangeType()` (case, accents, aliases).
- The generic scaffold writes the normalized type: `General`, `Fix`, `Feature`, `Documentation`.
- An unknown `--type` fails before any branch or file is created, listing the valid types.
- `--type enrichment` fails the same way and points to `aief enrich` (an Enrichment Change needs a
  Requirement Source that the generic scaffold does not have, so it would fail `verify`).
- Tests; `docs/cli.md` row for `new-change`.

### Out of scope

- `propose`, `analyze` and `enrich` (they pass fixed types or write their own files).
- Fixing the type of Changes already created.
- Worktree-aware Change IDs and guardrail parity (later Changes).

## Success Criteria

- `new-change x --type fix|feature|documentation|general` writes that type; `--type FIX` and
  `--type bugfix` write `Fix`; `--type definicion` creates the Definition scaffold.
- `--type bogus` and `--type enrichment` exit 1 and leave no branch and no files.
- `npm test`, `npm run lint`, `git diff --check`, `aief verify --strict` pass.

## Status

Closed (2026-10-22)
