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
- Follow-up fix (post-review, before close): `ensureChangeBranch()` originally logged and returned
  `null` when `git checkout -b` itself failed — indistinguishable, at the call site, from every
  benign no-op (no git repo, already on a feature branch, `--no-branch`). `createChange()` ignored
  the return value entirely, so a failed checkout on `main`/`dev` (e.g. the target branch name
  already existed) silently wrote the Change's scaffolding onto the protected branch anyway —
  exactly the outcome this Change's own spec.md promises never happens. Fixed by adding
  `ChangeBranchError` (thrown only for that one case) and wrapping the call in `createChange()`
  (`commands/shared.js`) to abort — print the error, set `process.exitCode = 1`, write nothing —
  before any Change file exists.
- Extended `process-utils.js`'s `run()` to forward `options.cwd` (needed for tests to target a temp
  repo; every existing caller is unaffected since none of them pass `cwd`).
- Wired `ensureChangeBranch()` into `createChange()` in `commands/shared.js`, before file writes —
  `analyze` and `propose` get the behavior automatically since they call the same function.
- Added `--no-branch` to `new-change`'s `KNOWN_FLAGS`, threaded through `new-change.js`.
- Documented once, at the point every assistant already reads: `AGENTS.md` (and its byte-identical
  template copy `cli/templates/agents/AGENTS.md` — a pre-existing test enforces they match),
  `docs/maintainer.md`, and `.kiro/skills/aief-change/SKILL.md`.
- Added `cli/tests/git-branch.test.js` (now 7 tests): main→branch, dev→branch, existing branch left
  untouched, `--no-branch`, no-git no-op, failed-checkout-aborts-with-no-scaffolding (added in the
  follow-up fix above), `analyze` shares the behavior.

## Verification

- `npm test`: 1033/1033 pass (1026 before this Change; +6 from the original slice, +1 from the
  follow-up fix; zero regressions). One transient failure ("root AGENTS.md is byte-identical to the
  canonical template") caught the template drift immediately — fixed by copying `AGENTS.md` to
  `cli/templates/agents/AGENTS.md`; suite passed clean afterward.
- `node cli/bin/aief.js verify --strict --change 0114`: PASS.
- `git diff --check`: no whitespace errors.

## Findings

- Independent audit review (2026-09-03) flagged that `createChange()` ignored
  `ensureChangeBranch()`'s failure return, letting a failed checkout write scaffolding onto a
  protected branch — a direct contradiction of this Change's own spec.md acceptance criteria.
  Confirmed and fixed before close (see Activities Performed).

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
