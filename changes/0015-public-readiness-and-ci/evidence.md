# Evidence

## Summary

Made the repository presentable and trustworthy for first-time users: README rewritten as the entry point for the AI Engineering Workflow Engine, CI added (both suites + `aief verify` on Node 18/22), `aief prompt --assistant` implemented so the documented flow is real, MIT license text completed, CHANGELOG aligned with reality, and Change 0013's evidence captured retroactively with an explicit honesty note.

## Activities Performed

- Rewrote `README.md`: problem statement, separation of responsibilities (AIEF / OpenSpec / Specboot / assistants / Skills), instruction hierarchy, adoption-first quick start with per-command explanations, guarantees, install via `npm link`, commands reference, testing/validation, status (roadmap Phase 2), short roadmap, doc links table, CI badge.
- Added `--assistant` option to `aief prompt` (`cli/src/cli.js`): selects CLAUDE.md / GEMINI.md / CODEX.md / CURSOR.md; warns on unknown values; falls back to CLAUDE.md. Covered by a new test (21 total).
- Added `.github/workflows/ci.yml`: matrix Node 18/22; runs CLI tests, todo-app tests and `aief verify`.
- Completed `LICENSE` with the full MIT text (MIT was already declared in README, LICENSE header, cli/package.json and examples/todo-app/package.json — this fills in the missing legal text, it does not choose a new license).
- Updated `CHANGELOG.md`: Unreleased section (0014, 0015), honest note that `releases/v0.1.0.md` and `releases/v1.0.0.md` describe the same starter milestone.
- Filled `changes/0013` evidence retroactively, labeled as such, using only findings that were actually produced and verified during the analysis session; marked its tasks complete.
- Aligned `docs/cli.md` and `cli/README.md` (install section, `--assistant` in flows, prompt row).

## Verification

- `cd cli && npm test`: 21/21 pass (Node 22, Linux).
- `cd examples/todo-app && npm test`: 3/3 pass.
- `node cli/bin/aief.js verify` at repo root: PASS; no placeholder-evidence warnings remain except during this Change's own drafting.
- `aief prompt --assistant gemini` verified by test: lists GEMINI.md, not CLAUDE.md; unknown assistant warns.
- CI workflow not yet exercised on GitHub (will run on next push) — the same three commands it runs were executed locally.

## Findings

- `adapters/openspec/README.md` already met every requirement (optional, contract, runtime validation, loud fallback, unvalidated-release note) since Change 0014; no edits needed.
- The repo declared MIT in four places but shipped no license text — worth checking in any project template.

## Risks

- The CI badge and workflow are unverified until the first push; if the repo's default branch protection or Actions settings differ, the workflow may need a tweak.
- `releases/` history remains ambiguous (v0.1.0 vs v1.0.0 describing the same milestone); documented in CHANGELOG rather than rewritten.

## Recommendations

- Push and confirm the first CI run goes green; fix the badge if the workflow name changes.
- Decide the real current version (recommendation: treat the next release as v0.2.0 per roadmap Phase 2) and reconcile `releases/`.
- Still pending from earlier analysis: Windows robustness (`shell: true`), OpenSpec validation against a real release, optional `verify --strict`.

## Artifacts Produced

- `.github/workflows/ci.yml` (new)
- `README.md`, `LICENSE`, `CHANGELOG.md`, `docs/cli.md`, `cli/README.md`, `cli/src/cli.js`, `cli/tests/cli.test.js` (updated)
- `changes/0013-analyze-current-architecture/{evidence.md,tasks.md}` (completed retroactively)

## Lessons Learned

- Documented flows must be executable as written; adding `--assistant` was cheaper than documenting around its absence.
- Retroactive evidence is salvageable when the underlying work was verified, but it must be labeled — the note preserves trust in the evidence system.

## Next Change

`0016-real-project-validation`: run `aief adopt` + `analyze` on a real existing project (e.g. the original ai-engineering-framework v4 repo), record every friction as evidence, and validate the OpenSpec contract against a real release.
