# Evidence

## Summary

`aief prompt` now consumes a project's `ai-specs/standards/*.md` in the real assistant-facing
prompt text, alongside AIEF's built-in `knowledge/standards/*.md`, project winning on id collision
and referenced by its own real path. `aief doctor --verbose` gains a conditional "Standards:"
report, absent entirely for the overwhelming majority of projects (no `ai-specs/standards/`).
`bootstrap`, `analyze`, and Skill recommendations (Change 0054) are untouched.

## Activities Performed

- `cli/src/core/domain/ai-specs.js`: shared `resolveResourceRecommendations()` extracted;
  `resolveSkillRecommendations()` refactored onto it; `resolveStandardRecommendations()` added;
  `deriveResourceDescription()` (generalized), `deriveSkillDescription` kept as alias.
- `cli/src/cli.js`: `builtinStandardsList()` added; `prompt()`'s `standardsBlock` rewritten;
  `printStandardsReport()` added, wired into `doctor()`.
- `docs/cli.md`, `docs/configuration.md`, `templates/specboot/README.md`: updated.
- `knowledge/decisions.md`: ADR-025 added, ahead of implementation.
- `cli/tests/ai-specs.test.js`, `cli/tests/cli.test.js`: 16 new tests total; one existing 0054
  test's assertion updated (fallback string).

No change to `cli/src/detect.js`, `analyze()`, `createStandards()`, `standardsForProject()`,
`bootstrapHere()`, or `resolveSkillRecommendations()`'s observable output.

## Verification

- `cd cli && npm test`: **594/594 passing** (578 pre-existing + 16 new), 0 regressions.
- `aief verify` (whole project): **PASS**.
- `aief status` diffed before/after this Change's code diff (via `git stash`): no difference.
- `git diff --check`: clean, exit 0.
- Manual walkthrough (`/tmp/.../standards-demo`):
  - `ai-specs/standards/security-standards.md` (overrides built-in) +
    `ai-specs/standards/api-design.md` (new): `aief prompt claude --change <id>` rendered
    `- ai-specs/standards/security-standards.md [project override]` (built-in's own
    `knowledge/standards/security-standards.md` line absent) and
    `- ai-specs/standards/api-design.md [project]`, both at their real project paths.
  - `aief doctor` (default): full "Standards:" section, tags visible, no path/source (compact).
  - `aief doctor --verbose`: same plus `source`/`path`/`overrides` per entry and the full
    override warning text.
  - A project with no `ai-specs/standards/`: no "Standards:" section from `doctor` at all;
    `prompt`'s block identical to the pre-Change baseline (confirmed by the existing, unmodified
    "prompt includes standards and Skill context honestly" test still asserting
    `knowledge/standards/base-standards.md` verbatim).

## Findings

Two issues found and fixed before closing, both in test design rather than implementation:

1. **Fallback-string exception (expected, documented in `spec.md` R2).** Generalizing
   `deriveSkillDescription` into `deriveResourceDescription` changed the unreachable-in-practice
   empty-content fallback text from `"Project-defined skill"` to `"Project-defined resource"`.
   Change 0054's own test asserting the old string was updated to match — the string is never
   produced for any real Skill file, since `discoverAiSpecs()` already classifies empty content as
   `state: "empty"` before the description function is ever called on it.
2. **Two new CLI tests were wrong, not the implementation.** (a) A duplicate-id test asserted
   *zero* `ai-specs/standards/dup` references in `prompt`'s output — but one of the two colliding
   files (`dup.md`) is a legitimately valid, `state: "present"` resource that correctly resolves;
   only the *second* colliding file is excluded. Fixed to assert exactly one occurrence. (b) A
   deterministic-order test's regex matched bullet lines across *both* `doctor`'s "Recommended
   Skills:" and "Standards:" sections (identical bullet format), picking up an unrelated Skill id.
   Fixed by scoping the regex to the substring after the "Standards:" header.

## Risks

- `printStandardsReport()`'s conditional-appearance design (R6) means `doctor`'s output shape
  genuinely branches on `ai-specs/standards/`'s presence, unlike Skills' always-present section —
  documented explicitly in ADR-025 so a future reader does not mistake the asymmetry for
  inconsistency.
- `builtinStandardsList()` reads every `knowledge/standards/*.md` file's content on each `prompt`/
  `doctor` invocation (to derive a description) — no caching, consistent with every other
  file-system-backed AIEF command (`read()` is already used this way throughout `cli.js`); no
  measurable performance concern at the file counts this repository or realistic projects have.

## Recommendations

Next candidate Change (not started here): wire the same resolver into `bootstrap`/`analyze`, or
extend to a third `ai-specs/` resource type if LIDR/SpecBoot's real convention has one — each as
its own reviewed Change, per ADR-025's explicit deferral.

## Artifacts Produced

- `cli/src/core/domain/ai-specs.js`, `cli/src/cli.js` (modified).
- `cli/tests/ai-specs.test.js`, `cli/tests/cli.test.js` (modified).
- `docs/cli.md`, `docs/configuration.md`, `templates/specboot/README.md` (modified).
- `knowledge/decisions.md` (ADR-025 added).
- `changes/0055-lidr-standards-integration/` (this Change).

## Lessons Learned

- Extracting `resolveResourceRecommendations()` before writing `resolveStandardRecommendations()`
  (rather than copy-pasting Change 0054's Skill logic and adjusting) meant the two resource kinds
  could never silently diverge in their precedence handling — the commissioning instruction's "no
  dupliques la lógica" produced a real, mechanical guarantee, not just a style preference.
  Re-running Change 0054's full test file after the refactor, unmodified, was the actual proof.
- Both test failures caught during verification were assertions that encoded a wrong mental model
  of the resolver's own behavior (partial duplicate resolution; shared bullet formatting across
  sections) — a reminder that a CLI-level regex assertion needs the same scrutiny as the
  implementation it checks.

## Next Change

Wire the Standards/Skill resolver into `bootstrap`/`analyze`, or address a third `ai-specs/`
resource type — either as a separately-scoped Change, per ADR-025.
