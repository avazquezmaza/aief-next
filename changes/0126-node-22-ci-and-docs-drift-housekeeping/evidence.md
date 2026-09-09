# Evidence

## Summary

Trivial housekeeping from the same external audit that motivated Changes 0123–0125: raised the
Node baseline to `>=22` (dropping the now-EOL 18/20) across `package.json`, `cli/package.json`,
CI (`.github/workflows/ci.yml`), and the CI template `aief adopt` ships to new projects
(`cli/templates/ci/aief-verify.yml`); fixed `docs/architecture.md`'s layer table, which still
named pre-refactor paths (`cli/src/*-service.js`, `cli/src/change.js`) that no longer exist.

## Activities Performed

- `package.json`, `cli/package.json`: `engines.node` → `">=22"`.
- `.github/workflows/ci.yml`: test matrix `[18, 20, 22]` → `[22, 24]`. Lint job (already on 22)
  untouched.
- `cli/templates/ci/aief-verify.yml`: `node-version: 20` → `22`.
- `docs/architecture.md`: layer table's Application Services / Domain Models rows corrected to
  `cli/src/core/services/*.js` / `cli/src/core/domain/change.js` — verified against the actual
  directory listing (`ls cli/src/core/domain/`) before editing, not assumed.
- `docs/maintainer.md`: CI matrix description updated to match.
- `cli/README.md` (two mentions), `examples/todo-app/README.md`: "Node >= 18"/"Node.js 18"
  updated to 22.

## Verification

- `grep -rn '"node": ">=18"' .` (and equivalent patterns for `node-version`/`Node.js 18`/
  `Node >= 18`) across `.md`/`.json`/`.yml`, excluding lock files: zero remaining hits.
- `npm test` (cli/): 1070/1070 passed — no test pinned the old Node matrix or the old doc paths.
- `npm run lint`: clean.
- `node cli/bin/aief.js verify --change 0126-node-22-ci-and-docs-drift-housekeeping --strict`: PASS.
- `git diff --check`: clean.

## Findings

- None beyond what change.md already named. `package-lock.json`/`cli/package-lock.json` still
  mention 18 in metadata npm itself writes (not `engines`) — left untouched per change.md's
  scope (lock files are npm-regenerated, not hand-edited).

## Risks

- None. No application-code change; CI matrix and docs only.

## Recommendations

- None further on this topic. Node 26 ("Current", not yet LTS) was deliberately not added, per
  the audit's own recommendation to track only current LTS/Active lines.

## Artifacts Produced

- `package.json`, `cli/package.json`, `.github/workflows/ci.yml`,
  `cli/templates/ci/aief-verify.yml`, `docs/architecture.md`, `docs/maintainer.md`,
  `cli/README.md`, `examples/todo-app/README.md`.

## Lessons Learned

- Grepping for the literal old path strings across the CI template directory
  (`cli/templates/ci/`) surfaced a second EOL Node pin (the adopter-facing gate) that the
  original audit finding didn't call out by name — worth checking templates whenever a
  version/config fact changes anywhere else in the repo, since they ship silently to every new
  adopter.

## Next Change

- None required.
