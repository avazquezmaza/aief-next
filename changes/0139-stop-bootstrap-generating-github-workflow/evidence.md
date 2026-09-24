# Evidence

## Summary

`aief bootstrap` no longer writes `.github/workflows/aief-verify.yml`. The template is deleted and
current docs explain how to run `aief verify` in any CI without the non-existent `aief` npm package.

## Activities Performed

- `cli/src/commands/bootstrap.js`: removed `CI_TEMPLATE`, `createCiGate()` and its console output;
  left a one-line comment pointing to docs/configuration.md "CI gate".
- Deleted `cli/templates/ci/aief-verify.yml` (deletion explicitly approved by the user).
- `cli/tests/cli-bootstrap-and-standards.test.js`: new test — bootstrap creates no `.github/`, prints
  no "CI gate" line, and leaves an existing `.github/workflows/ci.yml` byte-for-byte untouched.
- Docs: rewrote `docs/configuration.md` "CI gate"; removed the CI gate from bootstrap's artifact
  list in `docs/getting-started.md`, `docs/cli.md`, `docs/examples.md` and `aief help bootstrap`
  (`cli/src/commands/misc.js`); `docs/maintainer.md` now names the command this repo's CI actually
  runs (`node cli/bin/aief.js verify`, `.github/workflows/ci.yml`) instead of `npx aief verify`.
- Diagram: updated the note in `scripts/diagrams/generate_adoption_workflow.py`, regenerated
  `docs/images/adoption-workflow.svg`.

## Verification

- `npm view aief` → `E404 Not Found` (confirms the removed workflow could never succeed).
- `npm test` → 1113 tests, 1113 pass, 0 fail.
- `npm run lint` → clean.
- `git diff --check` → clean.
- `grep -rn "aief-verify\|npx aief\|CI gate" cli docs/*.md scripts README.md` → only the intentional
  hits (the "CI gate" doc section and its references, the code comment, the new test, the warning
  against `npx aief verify`).
- `node cli/bin/aief.js verify` → PASS.
- `node cli/bin/aief.js verify --change 0139 --strict` → FAIL only on the unchecked `(review)` task
  (expected: independent review is not the implementer's to check).

## Findings

- Change 0036's CI gate was GitHub-only and depended on `npx aief`, which resolves to no package:
  on GitHub it failed every push; on other hosts it was an inert file. It was also a
  package-name-squatting exposure (`npx --yes` would run whatever gets published as `aief`).
- No accepted ADR governs the CI gate, so no ADR conflict.

## Risks

- Projects already adopted keep their `aief-verify.yml` (intentionally untouched). On GitHub it
  still fails; teams should delete it or replace its step as in docs/configuration.md.
- Losing the "enforcement by default" Change 0036 aimed for: `aief verify` now only runs in CI if a
  team wires it in.

## Recommendations

- Follow-up (not in scope): publish the CLI to npm or offer opt-in per-host CI snippets
  (e.g. `aief ci --host github|gitlab|bitbucket`), and consider a `doctor` hint for adopted
  projects still carrying the broken `aief-verify.yml`.

## Artifacts Produced

Code, test, docs and diagram changes listed above; no new files outside this Change.

## Lessons Learned

- A generated artifact that assumes a hosting platform and a published package should be tested in
  an adopted project on that platform; neither assumption held.
- `docs/images/adoption-workflow.png` is not produced by the generator nor referenced by any doc;
  left untouched.

## Next Change

Pending — see Recommendations.
