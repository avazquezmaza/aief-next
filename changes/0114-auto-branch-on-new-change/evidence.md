# Evidence

## Summary

`createChange()` (shared by `new-change`, `analyze`, and `propose`) now switches off `main`/`dev`
onto `<type>/<id>-<slug>` automatically, before writing any Change file, via a new
`cli/src/core/services/git-branch.js`. This closes the actual gap that caused a Gemini session to
create a Change directly on `main`: the "branch before touching files" rule previously existed only
as prose (a private memory, `CLAUDE.md`) that other assistants never read. The rule is now enforced
by the CLI itself, which every assistant target invokes identically.

## Activities Performed

- Added `cli/src/core/services/git-branch.js`: `currentBranch()`, `changeBranchName()`,
  `ensureChangeBranch()`.
- Extended `process-utils.js`'s `run()` to forward `options.cwd` (needed for tests to target a temp
  repo; every existing caller is unaffected since none of them pass `cwd`).
- Wired `ensureChangeBranch()` into `createChange()` in `commands/shared.js`, before file writes —
  `analyze` and `propose` get the behavior automatically since they call the same function.
- Added `--no-branch` to `new-change`'s `KNOWN_FLAGS`, threaded through `new-change.js`.
- Documented once, at the point every assistant already reads: `AGENTS.md` (and its byte-identical
  template copy `cli/templates/agents/AGENTS.md` — a pre-existing test enforces they match),
  `docs/maintainer.md`, and `.kiro/skills/aief-change/SKILL.md`.
- Added `cli/tests/git-branch.test.js` (6 tests): main→branch, dev→branch, existing branch left
  untouched, `--no-branch`, no-git no-op, `analyze` shares the behavior.

## Verification

- `npm test`: 1032/1032 pass (was 1026 before this Change; +6 new tests, zero regressions). One
  transient failure ("root AGENTS.md is byte-identical to the canonical template") caught the
  template drift immediately — fixed by copying `AGENTS.md` to
  `cli/templates/agents/AGENTS.md`; suite passed clean afterward.
- `node cli/bin/aief.js verify`: PASS.
- `git diff --check`: no whitespace errors.

## Findings

None beyond the pre-existing gap this Change addresses.

## Risks

- `ensureChangeBranch()` runs `git checkout -b` unconditionally when on `main`/`dev` with no prompt
  — mitigated by it never being destructive (a plain branch creation, not a reset/push/delete) and
  by the `--no-branch` escape hatch on `new-change`.
- `aief enrich` does not go through `createChange()` and so does not yet get auto-branch — left
  explicitly out of scope (see change.md) rather than silently gapped.

## Recommendations

- Follow-up Change: give `enrich` the same behavior, either by routing it through `createChange()`
  or by calling `ensureChangeBranch()` directly from `enrich.js`.
- Consider whether `propose` also warrants a `--no-branch` flag, symmetric with `new-change`.

## Artifacts Produced

- `cli/src/core/services/git-branch.js`
- `cli/tests/git-branch.test.js`
- Diffs to `cli/src/process-utils.js`, `cli/src/commands/shared.js`, `cli/src/commands/new-change.js`
- Diffs to `AGENTS.md`, `cli/templates/agents/AGENTS.md`, `docs/maintainer.md`,
  `.kiro/skills/aief-change/SKILL.md`

## Lessons Learned

A cross-assistant convention that lives only in one assistant's memory/instruction file is not a
convention the others follow — it needs either a shared, assistant-agnostic doc (`AGENTS.md`) or,
better where feasible, enforcement in the tool every assistant actually runs.

## Next Change

`aief enrich` auto-branch (see Recommendations).
