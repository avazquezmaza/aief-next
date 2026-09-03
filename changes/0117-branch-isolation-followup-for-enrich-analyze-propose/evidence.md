# Evidence

## Summary

Completes the branch-isolation follow-up Change 0114 explicitly left open: `aief enrich` now
switches off `main`/`dev` onto `enrichment/<id>-<slug>` before writing any Change file, via its own
`ensureChangeBranch()` call (its file templates don't fit `createChange()`'s generic/analysis/
definition set, so it can't reuse that function directly). `analyze` and `propose` already
auto-branched through `createChange()` but lacked `--no-branch`; both now have it, symmetric with
`new-change`. Found during an independent audit review.

## Activities Performed

- `cli/src/commands/enrich.js`: added a call to `ensureChangeBranch(id, slug, "enrichment", { skip })`
  before any `writeFile`, wrapped in the same try/catch `ChangeBranchError` abort pattern
  `createChange()` uses (Change 0114) — a failed checkout aborts with no scaffolding written.
- `cli/src/commands/shared.js`'s `KNOWN_FLAGS`: added `"no-branch"` to `enrich`, `analyze`,
  `propose`.
- `cli/src/commands/analyze.js` / `propose.js`: threaded `noBranch: parsed["no-branch"]` through
  their existing `createChange()` calls.
- Updated `docs/maintainer.md`'s Change-0114 note and `AGENTS.md` (+ its byte-identical template
  copy `cli/templates/agents/AGENTS.md`) to describe the completed contract.
- Added 5 tests to `cli/tests/git-branch.test.js`: enrich auto-branch, enrich `--no-branch`, enrich
  failed-checkout-aborts-with-no-scaffolding, analyze `--no-branch`, propose `--no-branch`.

## Verification

- `npm test`: 1041/1041 pass (1036 before this Change; +5 new tests, zero regressions).
- `node cli/bin/aief.js verify --strict --change 0117`: PASS.
- `git diff --check`: no whitespace errors.

## Findings

None beyond the pre-existing gap this Change fixes.

## Risks

None beyond the pre-existing risk `ensureChangeBranch()` already carries (Change 0114): a plain
`git checkout -b`, never destructive, with `--no-branch` as the escape hatch.

## Recommendations

None — this closes out the branch-isolation follow-up; `new-change`, `analyze`, `propose`, and
`enrich` all share the exact same contract now.

## Artifacts Produced

- Diff to `cli/src/commands/enrich.js`, `analyze.js`, `propose.js`, `shared.js`.
- Diff to `docs/maintainer.md`, `AGENTS.md`, `cli/templates/agents/AGENTS.md`.
- Diff to `cli/tests/git-branch.test.js`.

## Lessons Learned

A shared contract (auto-branch + `--no-branch`) documented against "every command that scaffolds a
Change" needs its own audit of which commands actually go through the shared function — `enrich`
looked covered by the prose but wasn't, because it never called `createChange()` at all.

## Next Change

`0118-bootstrap-agents-template-reuse` (initProject() should use AGENTS_TEMPLATE).
