# Evidence

## Summary

`aief new-change --type <type>` now writes the requested type in `change.md`, normalized through
the closed `## Type` list (`normalizeChangeType()`, Change 0161), and refuses an unknown type or
`enrichment` before any branch or file is created.

## Activities Performed

1. **Reproduced.** Opening this Change with `--type fix` wrote `Type: General` (fixed by hand
   above). In a temporary repo on `main`, before the fix:

   | `--type` | Branch created | `## Type` written |
   | --- | --- | --- |
   | `FIX` | `fix/0001-x-fix` | General |
   | `Definicion` | `definicion/0002-x-definicion` | General (generic scaffold) |
   | `bogus` | `bogus/0003-x-bogus` | General |
   | `enrichment` | `enrichment/0004-x-enrichment` | General |

   Cause: `createChange()` used `options.type` only for the branch name and to pick the
   analysis/definition scaffold; `genericChangeFiles()` hard-coded `General`, and `new-change`
   passed `--type` through raw.
2. **Fix.** `cli/src/commands/new-change.js`: `resolveType()` normalizes `--type`, rejects an
   unrecognized or empty value (listing the valid types) and `enrichment` (pointing to
   `aief enrich`), before `createChange()` runs. `cli/src/commands/shared.js`:
   `genericChangeFiles()` takes the type and writes it capitalized (`General` by default, so
   `bootstrap` and `propose` are unchanged).
3. **Docs.** `docs/cli.md` `new-change` row and `aief help new-change` text describe `--type`.
4. **Tests.** New `cli/tests/new-change-type.test.js` (13 tests): every label type plus `FIX`,
   `bugfix`, `Funcionalidad`; no `--type`; `Definición` → Definition scaffold and
   `definition/` branch; `FIX` → `fix/` branch and `Fix`; `bogus`, `""` and `enrichment` → exit 1,
   still on `main`, no new branch, no Change files.

## Verification

- New tests against the pre-fix source (`git stash` of `cli/src`): 2 pass, 11 fail (the two
  passing cases are the `General` ones that already worked). With the fix: 13 pass.
- `npm test` (cli/) → `tests 771, pass 771, fail 0`.
- `npm run lint` → no errors. `git diff --check` → clean.
- `aief verify` (project) → `Result: PASS`.
- `aief verify --change 0164 --strict` → `Result: FAIL`, only for the open approval (expected until
  the owner checks it):

  ```text
  ✗ ... [strict] unresolved required human decision: Owner reviews the diff before merge.
  ✗ ... [strict] unchecked (human) approval in spec.md Acceptance Criteria: Owner reviews the diff before merge.
  ```

- After the owner's `(human)` review (PR #116, merged as `d7f4127`), on `main`: `aief verify --change
  0164 --strict` → `Result: PASS`; `npm test` 771 pass; lint and `git diff --check` clean; PR #116
  CI (lint, test 22/24, CodeQL, dependency-review) green.
- Same reproduction after the fix:

  ```text
  $ aief new-change "x FIX" --type FIX
  Created and switched to branch fix/0001-x-fix            → Type: Fix
  $ aief new-change "x Definicion" --type Definicion
  Created and switched to branch definition/0002-x-definicion → Type: Definition
  $ aief new-change "x bogus" --type bogus
  --type: unknown type "bogus". Valid types: general, analysis, definition, fix, feature, documentation.
    exit=1, still on main
  $ aief new-change "x enrichment" --type enrichment
  --type enrichment: create an Enrichment Change with aief enrich --file <source> instead.
    exit=1, still on main
  ```

## Findings

- Behavior change: `--type <unknown>` used to succeed (as General, with an odd branch name); it now
  fails. No test or doc relied on the old behavior.

## Risks

- A script that passes an arbitrary `--type` now gets exit 1 instead of a General Change.

## Recommendations

- None beyond this Change.

## Artifacts Produced

- `cli/src/commands/new-change.js`, `cli/src/commands/shared.js`, `cli/src/commands/misc.js`
- `cli/tests/new-change-type.test.js`
- `docs/cli.md`

## Lessons Learned

A flag that feeds two outputs (branch name and file content) needs one normalization point; here the
domain already had it (`normalizeChangeType()`), the command just did not use it.

## Next Change

Guardrail parity across assistants (definition), now 0165. The `(human)` review was given on PR #116.
