# Evidence

## Summary

Fixed B3 and B4 from Analysis 0154.

- **B3**: detection no longer walks into nested repositories. `~/PRS/THINGS/kiro/I5` was detected
  as `docker` because of its cloned `ECC/`. It now reports "No strong signals detected".
- **B4**: `(human)` and `(review)` Acceptance Criteria in `spec.md` now count like approval lines
  in `tasks.md`. `close` refuses while one is unchecked or `[-]`, and lists checked ones marked
  `[spec.md]`. `verify --strict` fails an open Change and adds a notice for a closed one.

The notices show that the gap was real. In this repository, 6 closed Changes (0037, 0040, 0041,
0050, 0096, 0130) were closed with 11 unchecked `spec.md` approvals, and `THINGS/neto` has one
more.

## Activities Performed

1. `cli/src/detect.js`: added `isNestedRepository()` (a `.git` directory or file). `walkProject()`
   skips such subdirectories. The root is never checked.
2. `cli/src/core/domain/change.js`: added `parseSpecApprovalLines()`. It reuses
   `parseApprovalLines()` on the `## Acceptance Criteria` section (including `###` subsections, up
   to the next `##`) and keeps only `(human)` and `(review)`.
3. `cli/src/core/services/change-verifier.js`: added `specApprovalProblems()`.
   `checkChangeReadiness()` includes them, which also covers tracked Changes through the
   readiness gate. `checkStrictCompleteness()` includes them only for open Changes.
   `addChangeLines()` reports them as `!` notices for closed Changes.
4. `cli/src/commands/close.js`: "Approvals relied on" also lists checked `spec.md` approvals,
   suffixed `[spec.md]`.
5. Docs: the "Tasks and gates" paragraph in `AGENTS.md` and `cli/templates/agents/AGENTS.md`
   (kept byte-identical), the `verify --strict` and `close` rows in `docs/cli.md`, and the
   accepted-risk list in `docs/security-model.md`.
6. Tests: `cli/tests/nested-repository-detection.test.js` (4) and
   `cli/tests/spec-approvals.test.js` (7).

## Verification

| Check | Result |
|---|---|
| `node --test` on the two new files | 11 pass, 0 fail |
| `npm test` in `cli/` | 1,152 pass, 0 fail (was 1,141) |
| `npm run lint` in `cli/` | clean |
| `aief status` in `~/PRS/THINGS/kiro/I5` | before: `Detected project type: docker`. After: `No strong signals detected` |
| `aief verify --strict` on this repository | 11 notices on 6 closed Changes. The only error is this Change's own pending `(review)` |
| `aief verify --strict` on 9 local projects | `neto`: 1 closed notice. Open Changes with unchecked `spec.md` approvals now fail `--strict` and cannot close: `neto` 7, `atomic-consulta-saldo` 6, `pcia` 1. All of them are approvals that are still pending |

Test coverage:

- Nested repository with a `.git` directory, nested repository with a `.git` file, root with
  `.git`, plain subdirectory.
- Parser: section bounds, `###` subsection, bullet and case tolerance, three states, `(gate:*)`
  ignored, no section.
- `close`: unchecked blocks, `[-]` blocks, checked is listed and closes, unlabeled criteria do not
  block.
- `--strict`: error when open, notice and PASS when closed.

## Findings

| ID | Finding | Status |
|---|---|---|
| 0154-B3 | Detection walks into nested repositories | Resolved |
| 0154-B4 | `spec.md` approvals not enforced | Resolved |
| F1 | 6 closed Changes in this repository and 1 in `neto` were closed with unchecked `spec.md` approvals | Reported as notices. History is not rewritten |

## Risks

- Projects with open Changes holding unchecked `spec.md` approvals (`neto`, `atomic-consulta-saldo`,
  `pcia`) now need those approvals before `close`. This is the intended behavior. It is a change
  in behavior for those projects.
- A git submodule that is genuinely part of the product is no longer used for detection. Detection
  then relies on root-level signals, as it does for `node_modules` and `vendor`.

## Recommendations

- Update Analysis 0154's Findings Status for B3 and B4 when this merges.

## Artifacts Produced

- Code: `cli/src/detect.js`, `cli/src/core/domain/change.js`,
  `cli/src/core/services/change-verifier.js`, `cli/src/commands/close.js`.
- Tests: `cli/tests/nested-repository-detection.test.js`, `cli/tests/spec-approvals.test.js`.
- Docs: `AGENTS.md`, `cli/templates/agents/AGENTS.md`, `docs/cli.md`, `docs/security-model.md`.

## Lessons Learned

- Real use beats the spec: 97 of 210 closed Changes leave ordinary criteria unchecked, so only the
  labeled ones could be enforced without breaking practice.
- Running a new rule over the existing history found 12 approvals that had slipped through.

## Next Change

The 4.0 removal Change from Analysis 0154's wave 1, with its superseding ADR.
