# Tasks

## Design (this Change)

- [x] Inventoried every standards-related function (`BASE_STANDARDS`, `standardsForProject()`,
      `createStandards()`, `listStandards()`, `analyze()`'s context, `prompt()`'s `standardsBlock`)
      and confirmed no dedicated "list/validate standards" command exists.
- [x] Confirmed `prompt`'s `standardsBlock` is the one existing surface that already both lists
      and *uses* (consumes) standards in a real, functional way — chosen over `doctor` as the
      primary integration point specifically because `doctor` never showed standards before this
      Change (unlike Skills in 0054), so any `doctor` addition must be conditional to preserve
      compatibility, while `prompt`'s existing per-file bullet line can be reconstructed
      byte-for-byte for the no-ai-specs case.
- [x] Decided the CLI experience (byte-identical `prompt` baseline; tagged, real-path lines when
      `ai-specs/standards/` resolves something; conditional `doctor --verbose` report) and
      presented it for review before implementing.
- [x] Wrote ADR-025, `change.md`, `spec.md`, `tasks.md`.

## Implementation

- [x] `cli/src/core/domain/ai-specs.js`: extracted shared `resolveResourceRecommendations(builtins,
      projectResources, resourceDirLabel)`; refactored `resolveSkillRecommendations()` to use it
      (zero behavior change — Change 0054's 26 tests re-run and passing unmodified, except one
      documented fallback-string refinement, see Findings); added
      `resolveStandardRecommendations(builtins, cwd)`. Renamed the description heuristic to
      `deriveResourceDescription`; `deriveSkillDescription` kept exported as an identical alias.
- [x] `cli/src/cli.js`: added `builtinStandardsList()`; rewrote `prompt()`'s `standardsBlock`
      construction to render through `resolveStandardRecommendations()` (byte-identical
      reconstruction for builtins, real-path tagged lines for project resources); added
      `printStandardsReport(options)`, called from `doctor()` only when
      `aiSpecsStandardsPresent` is true.
- [x] `docs/cli.md`: documented `prompt` consuming `ai-specs/standards/` and the conditional
      `doctor --verbose` Standards report.
- [x] `docs/configuration.md`: noted the `ai-specs/standards/` precedence under
      `knowledge/standards/*.md`.
- [x] `templates/specboot/README.md`: corrected the stale "no AIEF command consumes this module
      yet" status line (already outdated since Change 0054's Skill wiring; now also reflects
      Change 0055's Standards wiring) — a small necessary correction beyond the original file
      estimate, recorded here rather than silently.
- [x] `knowledge/decisions.md`: ADR-025.

## Tests

- [x] `cli/tests/ai-specs.test.js`: 7 new unit tests for `resolveStandardRecommendations` — no
      `ai-specs/standards/` (pass-through), project-only standard, override (real path wins), 3+
      combination, invalid resources (duplicate/empty) excluded with separate `invalidCount`,
      `aiSpecsStandardsPresent` true even for invalid-only discovery, repeated-call determinism.
      Fixed one existing 0054 test's fallback-string assertion (see Findings in evidence.md).
- [x] `cli/tests/cli.test.js`: 9 new end-to-end tests — `prompt` byte-identical baseline,
      project-only standard, override (built-in line absent), invalid resource (resolves at most
      once), `doctor` no-section baseline, `doctor --verbose` report detail, `doctor` invalid
      resource hint/diagnostic, deterministic order across both `doctor` and `prompt`,
      `bootstrap`/`analyze`/Skills unaffected. Two of these needed fixing after first-pass
      failures (see Findings).
- [x] Ran `cd cli && npm test`: **594/594 passing** (578 pre-existing + 16 new), 0 regressions.
- [x] `aief verify` (whole project): PASS.
- [x] `aief status` diffed before/after (via `git stash`, code changes only): no difference.
- [x] `git diff --check`: clean.

## Close

- [x] `evidence.md`: test transcript, `aief prompt`/`aief doctor` manual walkthrough, findings.
- [x] Verified every acceptance criterion in `spec.md`.
- [x] `aief close --yes --change 0055-lidr-standards-integration`.
