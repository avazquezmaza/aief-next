# Evidence

## Summary

`## Type` is a closed list with Spanish aliases, the first word deciding; an unknown value is a
`verify --strict` notice. A Change typed "Definición" now gets the Definition guards in `aief
prompt` instead of the general prompt. The four CodeQL alerts open on `main` are resolved: two by
plain substring checks in tests, two by excluding study fixtures from CodeQL.

## Activities Performed

1. `change.js`: `CHANGE_TYPES`, `normalizeChangeType()`, `changeTypeInfo()`;
   `changeTypeFromContent()` now normalizes; `loadChange()` carries `typeInfo`.
2. `change-verifier.js`: strict notice for an unrecognized Type.
3. Tests: `evidence-sections.test.js` and `cli-skills-and-maturity.test.js` compare substrings
   instead of building a RegExp from text (CodeQL alerts 6 and 5).
4. `.github/codeql/codeql-config.yml` with `paths-ignore: changes/**/fixtures/**`, referenced from
   `.github/workflows/codeql.yml` (alerts 2 and 3: Change 0096's deliberately flawed sample apps).
5. New `change-type.test.js` (5). Docs: `concepts.md`, `cli.md`.

## Verification

| Check | Result |
|---|---|
| `npm test` in `cli/` | 730 pass, 0 fail (was 725) |
| `npm run lint` | clean |
| `aief verify --strict` on this repository | no unknown Type in 161 Changes |
| `aief verify --strict` on 7 local projects (read-only) | 3 notices: `GC_China` "Research → Implementation", `THINGS/pcia` "Build" and "Design"; no errors |

Whether CodeQL closes the four alerts is confirmed on the PR and after merge.

## Findings

| ID | Finding | Status |
|---|---|---|
| F1 | "Definición" was read as an unknown type, so a Definition Change got the general prompt | Fixed |
| F2 | Normalizing by first word turns AIEF's own "General (consolidation …)" into General; before, the full text was the type and matched nothing | Fixed as a side effect; no behavior depended on the full text |

## Risks

- The `## Type` of closed Changes is not rewritten; unknown values there stay as notices.

## Recommendations

- None beyond the pending list (wave 2).

## Artifacts Produced

- Code, tests, CodeQL config, docs.

## Lessons Learned

- A free-text field that drives behavior needs a closed list, or language differences silently
  change what the tool does.

## Next Change

Wave 2: guardrails as configuration and private mode.
