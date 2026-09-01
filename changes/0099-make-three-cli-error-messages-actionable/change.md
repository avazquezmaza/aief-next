# Change

## ID

`0099-make-three-cli-error-messages-actionable`

## Type

General

## Objective

Most `console.error()` calls across `cli/src/commands/*.js` already follow an established
pattern: state the problem, then say what to do about it ("Example:", "Fix this with:", "Known
X:"). Three do not — they state the problem and stop. Bring them in line with the rest of the
codebase's own convention. Audited: `grep -n "console.error" cli/src/commands/*.js cli/src/cli.js`
(32 call sites) — these are the only three missing a next step.

## Scope

### In scope

- `resolveImplicitChange()` in `cli/src/commands/shared.js` — "No open Change found." gains a
  next step (`aief new-change <name>` / `aief status`).
- `createChange()` in `cli/src/commands/shared.js` — "Change name is required." gains an example.
- `initProject()` in `cli/src/commands/bootstrap.js` — "Project already exists: <path>" gains a
  next step (pick another name, or `cd` in and run `aief bootstrap` there).

### Out of scope

- Any of the other 29 `console.error()` call sites — already actionable (verified individually
  before scoping this Change).
- Any change to control flow, exit codes, or which conditions raise an error — text only.
- `aief verify`'s per-line error printing (`verify.js:27`) — those lines are already composed
  with context (readiness problems, drift messages) by their own producers; not a bare message.

## Success Criteria

- The three messages above name a concrete next command/example, matching the tone of
  neighboring errors (e.g. `resolveExplicitChange()`'s "No Change found matching..." right above
  `resolveImplicitChange()` in the same file).
- Existing tests asserting on these messages (`change-selection.test.js`,
  `cli-close-evidence.test.js`, `cli-definition-enrichment.test.js`) still pass unmodified — they
  regex-match a substring, not full equality, so an appended next step does not break them.
- `npm test`, `node cli/bin/aief.js verify`, `git diff --check` all pass.

## Status

Closed (2026-09-01)
