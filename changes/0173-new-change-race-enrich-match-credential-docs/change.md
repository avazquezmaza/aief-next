# Change

## ID

`0173-new-change-race-enrich-match-credential-docs`

## Type

Fix

## Objective

Fix two confirmed CLI bugs and one overstated security claim from an external audit
(`Hallazgo 1.txt`, 2026-11-17), and record the live verification of the approval guard that
Change 0162 left open.

- **B1 — false "Created Change".** `createChange()` (`cli/src/commands/shared.js`) ignores
  `writeFile()`'s `false` return. Two `aief new-change` runs with the same name at the same time
  (e.g. two agents in parallel) compute the same id: the second writes nothing and still prints
  `Created Change: changes/<id>-<slug>`, pointing an agent at a Change that holds another's work.
- **B3 — false duplicate in `enrich`.** `findChangeBySlugSuffix()` (`cli/src/commands/enrich.js`)
  matches `basename.endsWith("-" + slug)`: `0001-notes-on-manual-test-001` blocks
  `aief enrich manual TEST-001` with "already exists" and exit 0.
- **S3 — credential wording.** `docs/configuration.md` says the deny rules mean "an assistant
  cannot read credentials". They cover listed paths for Claude Code's file tools only; other files
  (`.envrc`, `.npmrc`, kubeconfig, …) and shell commands such as `cat .env` are not covered.
- **Guard verified live.** The audit's top security item ("the hook may never run in Claude Code
  because the script path is in `args`") was tested with real `claude -p` sessions on Claude Code
  2.1.326: both checking an approval and adding one already resolved were blocked. Not a defect.

## Scope

### In scope

- B1: `createChange()` claims `changes/<id>-<slug>` atomically and fails, without writing and
  without printing "Created", when it already exists.
- B3: `enrich` matches an existing Change by its exact slug after the numeric prefix.
- S3: make `docs/configuration.md` (and any doc repeating it) say what the deny rules cover.
- Record the live guard verification in this Change's evidence.
- Decision D1: whether the guard should allow rewording an approval that is already resolved.

### Out of scope

- `aief help` drift (audit finding 2), the deny-list contents themselves, `shell: true` on win32,
  installer error handling, `approval-history.js` subprocess count — each its own Change if wanted.
- Two concurrent `new-change` runs with *different* names that pick the same id: already reported
  by `aief verify` as a duplicate id.

## Depends on

- 0172-approval-and-evidence-audit-follow-ups

## Success Criteria

- A second concurrent `new-change` with the same name exits 1 with a clear message and never
  prints "Created"; tests cover it.
- `aief enrich manual TEST-001` succeeds next to `0001-notes-on-manual-test-001`; a real duplicate
  is still detected; tests cover both.
- No document claims the deny rules make credentials unreadable.
- D1 decided and, if it changes behaviour, implemented with tests.
- `npm test`, lint, `git diff --check` and `aief verify --strict --change 0173` pass.

## Status

Closed (2026-11-17)
