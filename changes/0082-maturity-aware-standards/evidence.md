# Evidence

## Summary

Restructured `base-standards.md`, `testing-standards.md` and `security-standards.md` with an
explicit `## Applies now` (Definition-stage governance) / `## Applies once implementation starts`
(concrete tooling) split. Content-only change to three template files — no code path touched, no
already-adopted project affected.

## Activities Performed

- `base-standards.md`: "Applies now" covers small-Changes discipline, evidence, and
  human-approved/durably-recorded decisions (before implementation: a Definition Change's
  `Decision (human)` section + `knowledge/decisions.md`); "Applies once implementation starts"
  covers naming/style, Git conventions, and code-level Definition of Done.
- `testing-standards.md`: "Applies now" covers deciding testability/acceptance criteria and trust
  boundaries during Definition, and that a Definition Change's own spec.md acceptance criteria
  must be met before close even with no test runner yet; "Applies once implementation starts"
  keeps the existing commands/what-must-be-tested/rules content.
- `security-standards.md`: "Applies now" adds data classification, an explicit
  human-approved authn/authz decision, and (if multitenant) an explicit tenant-isolation decision
  — all previously absent or only implicit; "Applies once implementation starts" keeps the
  existing secrets/inputs-outputs/authorization/dependencies content.
- Verified every bullet present in the previous version of the three files is still present
  somewhere in the new version (manual diff review, not just test coverage).
- Left `documentation-standards.md`, `frontend-standards.md`, `backend-standards.md` untouched —
  confirmed via `git diff --stat` showing no changes to those files.
- Added 3 regression tests in `cli.test.js`: both-sections-present-and-ordered on the three
  in-scope templates, out-of-scope templates unaffected, and an already-adopted project's own
  standards file is never rewritten.

## Verification

- `node --test --test-name-pattern="maturity-aware|standards are unaffected|already-adopted
  project"` — 3/3 pass.
- `npm test` (full suite) — 876/876 pass, 0 fail (873 before this Change + 3 new).
- `node cli/bin/aief.js verify` — Result: PASS.
- `git diff --check` — clean.
- `git diff --stat` confirms only the three in-scope template files and `cli.test.js` changed —
  zero code files touched.

## Findings

- No code change was needed at all — `createStandards()`'s existing copy-on-bootstrap mechanism
  and `writeFile()`'s existing never-overwrite guarantee already provide everything this Change
  needed for both new-project adoption and backward compatibility. This is the smallest possible
  Change that satisfies the commissioning brief's own "avoid building a policy engine" instruction.

## Risks

- None identified beyond the inherent limitation that these are guidance files, not enforced
  policy — unchanged from before this Change.

## Recommendations

- None — Change 0083 (`aief verify --strict`) is independent of this Change's content.

## Artifacts Produced

- `cli/templates/standards/base-standards.md`, `testing-standards.md`, `security-standards.md`
  (restructured).
- `cli/tests/cli.test.js` (+3 tests).
- `changes/0082-maturity-aware-standards/`.

## Lessons Learned

- A content-only Change against an existing, already-tested copy/never-overwrite mechanism is a
  clean way to add governance value without expanding the code surface — worth preferring over a
  code change whenever the existing mechanism already provides the needed guarantees.

## Next Change

Change 0083 — optional `aief verify --strict` (objective completeness verification).
