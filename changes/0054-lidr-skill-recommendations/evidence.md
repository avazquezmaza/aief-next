# Evidence

## Summary

`aief doctor` now shows a project's `ai-specs/skills/*.md` alongside AIEF's built-in Skill Catalog
recommendations, project winning on id collision, via `resolveSkillRecommendations()`
(`cli/src/core/domain/ai-specs.js`) — a thin composition of Change 0053's `discoverAiSpecs()`/
`resolveResources()`. `bootstrap`/`analyze`/`prompt` are untouched. Default output is
byte-identical for any project without `ai-specs/skills/`; `--verbose` is a new, additive flag.

## Activities Performed

- `cli/src/core/domain/ai-specs.js`: added `deriveSkillDescription()`, `resolveSkillRecommendations()`.
- `cli/src/cli.js`: `printSkills()` extended with `options.verbose`; `doctor()` parses `--verbose`.
- `docs/cli.md`: `doctor`/`doctor --verbose` rows updated.
- `knowledge/decisions.md`: ADR-024 added, ahead of implementation.
- `cli/tests/ai-specs.test.js`, `cli/tests/cli.test.js`: 18 new tests total.

No change to `cli/src/detect.js`, `skillsDoc()`, `analyze()`, `prompt()`, or `resolveResources()`/
`discoverAiSpecs()`'s existing exports.

## Verification

- `cd cli && npm test`: **578/578 passing** (560 pre-existing + 18 new), 0 regressions.
- `aief verify` (whole project): **PASS**.
- `aief status` diffed before/after this Change's code diff (via `git stash`): no difference.
- Manual walkthrough (`/tmp/.../doctor-demo`, README with "tenant" keyword):
  - Project skill overriding a built-in (`multitenant-saas-architect`): shown as
    `[project override]` with the project's own description; verbose shows `source: project`,
    `path`, `overrides: built-in skill "multitenant-saas-architect"`.
  - Project-only skill (`pair-programming`): shown as `[project]`.
  - An unrelated built-in (`security-rbac-reviewer`) fired by the same signal: shown unchanged,
    untagged.
  - Duplicate id (`dup.md`/`dup.MD`): excluded from recommendations; default output showed exactly
    `⚠ 1 ai-specs resource(s) ignored — see aief doctor --verbose`; `--verbose` showed the full
    diagnostic text, no stack trace.

## Findings

One correctness issue found and fixed during manual verification, before writing the automated
tests: `resolveResources()`'s `warnings` array (reused unmodified from Change 0053) mixes two
different kinds of messages — a successful override notice and a genuine "resource ignored"
diagnostic. An early version of `printSkills()` used `warnings.length` directly to decide whether
to print the default-output hint line, which produced a misleading `"1 ai-specs resource(s)
ignored"` message when the only warning was actually a *successful* override (already visible via
the `[project override]` tag, not a problem). Fixed by having `resolveSkillRecommendations()`
compute a separate `invalidCount` (project resources in state `read_error`/`duplicate`/`empty`
only) for the default-output decision, while `--verbose` still shows the full `warnings` list
(override notices included) as genuinely useful detail. `spec.md` R6 and the acceptance criteria
were updated to describe this distinction precisely rather than the original, incorrect wording.

## Risks

- `deriveSkillDescription()`'s "first non-empty line, `#` stripped" heuristic is simple by design
  (mirrors ai-specs.js's existing filename-as-id simplicity, ADR-023 §"alternatives considered") —
  a project skill file with no usable first line falls back to a fixed string, never throws.
- `--verbose`'s `source: builtin` line on every recommendation (even with no `ai-specs/` at all)
  is intentional (R7, "for symmetry") but means `--verbose` output is never byte-identical to
  default output, even in the simplest project — documented explicitly in `spec.md` R2 so a future
  reader doesn't mistake it for a bug.

## Recommendations

Next candidate Change (not started here): wire `ai-specs/standards/` (already discovered by
Change 0053, unconsumed) into `listStandards()`/`createStandards()`, following the same pattern —
or extend `bootstrap`/`analyze`/`prompt` to the same Skill resolver, each as its own reviewed
Change per ADR-024's explicit deferral.

## Artifacts Produced

- `cli/src/core/domain/ai-specs.js`, `cli/src/cli.js` (modified).
- `cli/tests/ai-specs.test.js`, `cli/tests/cli.test.js` (modified).
- `docs/cli.md` (modified).
- `knowledge/decisions.md` (ADR-024 added).
- `changes/0054-lidr-skill-recommendations/` (this Change).

## Lessons Learned

- Manually walking through the CLI output before writing automated tests caught the
  `invalidCount`-vs-`warnings` conflation immediately — a case where "does this read correctly to
  a human" surfaced a bug that a narrowly-scoped unit test (asserting only `warnings.length > 0`)
  would have happily encoded as correct.
- Reusing `resolveResources()`'s existing, already-tested precedence engine unchanged (per
  ADR-023's own design) meant this Change's entire domain-layer diff was additive — zero risk to
  Change 0053's own guarantees.

## Next Change

`ai-specs/standards/` wiring, or extending Skill resolution to `bootstrap`/`analyze`/`prompt` —
either as a separately-scoped Change, per ADR-024.
