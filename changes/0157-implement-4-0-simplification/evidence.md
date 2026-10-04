# Evidence

## Summary

AIEF 4.0 implemented as decided in Change 0156 (ADR-038). Every manifest-gated feature is gone.
Dependencies live in `change.md`'s `## Depends on`, written by `new-change --depends-on`, read by
`status --graph`/`--next`, and `close` warns while one is open. A leftover `manifest.json` is
named by `verify` as no longer read. Version 4.0.0 with release notes.

`cli/src`: 8,946 → 5,431 lines (−39%), 70 → 47 files. Tests: 1,152 → 699, all passing.

## Activities Performed

1. **Removed modules** (`git rm`): `change-manifest.js`, `manifest-status-drift.js`,
   `change-loader.js`, `loop-service.js`, `harness-service.js`, `workflow-definition.js`,
   `gate-evaluator.js`, `transition-engine.js`, `workflow-service.js`, `workflows/*.json`,
   `sdd-model.js`, `sdd-provider-resolver.js`, `sdd-providers/*`, `ai-specs.js`,
   `verification-service.js`, `verification-context.js`, `verification-evidence.js`,
   `verification-rule.js`, `verification-rules/*`, `skills/requirements-analysis-instructions.js`,
   `hooks/prompt-skill-suggestion.js`, `templates/specboot/ai-specs/`.
2. **Added** `core/services/next-action.js`: the single "what's next" (`checkChangeReadiness()` →
   `aief prompt` or `aief close`), replacing the workflow engine for `status`, `prompt`, Skills and
   the verify Hook. `parseDependsOn()` and `hasLegacyManifest` in `change.js`.
3. **Commands:** `verify` (no Loop/Harness/requirements/drift; legacy-manifest notice), `close`
   (one readiness path; open-dependency notice), `status` (no Track/Stage/SDD/Harness/manifest
   sections; shows `Depends on`), `prompt` (no ai-specs/Workflow/SDD blocks), `doctor` (no
   ai-specs/Harness/Loop/SDD group; `--verbose` lists Hooks), `bootstrap` (no SDD provider setup or
   OpenSpec/SpecBoot detection), `propose` (no OpenSpec delegation), `new-change --depends-on`,
   help texts in `misc.js`. Hook result rendering moved into `hook-service.js`.
4. **Tests:** 20 files for removed subsystems deleted; mixed files trimmed to the kept behavior;
   dependency tests converted from manifest `dependsOn` to `## Depends on`
   (`declareDependsOn()` helper); new `depends-on.test.js` (8) and an updated `propose` test
   proving no external binary runs.
5. **Docs:** `AGENTS.md` and template ("Tasks and approvals", `## Depends on`), `README.md`,
   `docs/{workflow,concepts,architecture,configuration,cli,getting-started,security-model,
   cheat-sheet,examples,maintainer}.md`, adapters and SpecBoot templates marked "conceptual
   reference, not supported in 4.0". Six diagram generators updated and diagrams regenerated.
6. **Release:** version 4.0.0 (root and `cli/`), `releases/v4.0.0.md`, `changes/README.md` 4.0.0
   section, Analysis 0154's Findings Status (B1–B4, F1–F3 resolved).

## Verification

| Check | Result |
|---|---|
| `npm test` in `cli/` | 699 pass, 0 fail |
| `npm run lint` | clean |
| `node --test tests/diagrams.test.js` | 9 pass |
| Every module in `cli/src` imports without error | yes |
| `aief verify --strict` on this repository | only this Change's own pending owner review |
| `aief verify` / `aief status` on 9 local projects | PASS, no errors |
| `aief --version` | `aief 4.0.0` |

## Findings

| ID | Finding | Status |
|---|---|---|
| F1 | `aief propose` delegated to OpenSpec (ran an external binary), not in 0156's inventory | Removed under D5 ("OpenSpec integration"); noted here |
| F2 | The `prompt-skill-suggestion` Hook only suggested the SDD-only Skill; 0156 listed both Hooks as kept | Removal approved by the owner on 2026-10-04 after independent review flagged it; one Hook remains (`post-verify-next-action`) |
| F6 | D7 in 0156 says "Root `AGENTS.md` stays byte-identical", which reads as "unchanged". The intent was byte-identical *to the template* (the `agents-canonical` test enforces it): D7's own first sentence cuts a paragraph from the template, so the root had to change with it | Clarified here; root and template are identical |
| F3 | `AGENTS.md` lost only 10 lines (218 → 208): D7 removed tracks/gates; halving it was 0154's target, not an approved decision | Open: wave 2, with the Claude Code skill |
| F4 | README title said "Workflow Engine", contradicting ADR-038 | Resolved: owner chose "AIEF — Assistant-Agnostic AI Engineering Framework" (2026-10-04) |
| F5 | Lighter `Fix` Changes for this repository (0154 F8) were not part of 0156 | Open |

## Independent review

An independent review of the diff (2026-10-04) raised three points, all resolved before close:
the out-of-scope Hook removal (F2, approved by the owner), the D7 wording (F6, clarified), and new
files missing from `git diff main` because they were untracked (now added). It also confirmed
`npm test` 699/699, lint, `verify --strict` and `git diff --check`.

## Risks

- Breaking for anyone on 3.x using tracks, Loop, Harness, SDD, `--requirements` or `ai-specs`. No
  such user exists on this machine (Analysis 0154), and AIEF has not been released more widely.
- `docs/history/` and closed Changes still describe the removed features; they are historical
  records and were left as written.

## Recommendations

- Tag `v4.0.0` after merge, only with the owner's confirmation.
- Wave 2 next (Analysis 0154): Claude Code skill (with a shorter `AGENTS.md`), guardrails as
  configuration, private mode.

## Artifacts Produced

- Code, tests, docs and diagrams listed above; `releases/v4.0.0.md`.

## Lessons Learned

- An import-graph inventory still missed a runtime behavior (`propose` → OpenSpec) that only a
  string search over help texts and docs surfaced. Search docs for removed concepts, not only code.

## Next Change

Wave 2 from Analysis 0154.
