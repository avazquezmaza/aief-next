# Tasks

## Design (this Change)

- [x] Re-inspected `recommendSkills()` (`detect.js:82`) and all four call sites in `cli.js`
      (`printSkills` → `doctor`; `skillsDoc` → `bootstrap`; `analyze`'s context; `prompt`'s
      `skillsBlock`) to confirm `printSkills`/`doctor` is the single, write-free, low-risk
      integration point.
- [x] Confirmed `printSkills()` has exactly one caller (`doctor()`), so scoping the change there
      cannot leak into `bootstrap`/`analyze`/`prompt`.
- [x] Decided the CLI experience (default tag-only output; `--verbose` for path/source/overrides/
      warnings) and presented it for review before implementing.
- [x] Wrote ADR-024, `change.md`, `spec.md`, `tasks.md`.

## Implementation

- [x] `cli/src/core/domain/ai-specs.js`: added `deriveSkillDescription(content)` and
      `resolveSkillRecommendations(builtins, cwd)`, reusing `discoverAiSpecs()`/
      `resolveResources()` — no re-implementation of discovery or precedence. Returns a separate
      `invalidCount` (genuinely unusable project resources) distinct from `warnings` (which also
      includes informational override notices) — a correction made during manual verification
      (see "Findings" in evidence.md).
- [x] `cli/src/cli.js`: imported `resolveSkillRecommendations`; `printSkills(project, options)`
      gained `options.verbose`; `doctor(args)` parses `--verbose` via the existing `parseArgs()`
      and passes it through. No other function touched.
- [x] `docs/cli.md`: documented `--verbose` on the `doctor` row.
- [x] `knowledge/decisions.md`: ADR-024.

## Tests

- [x] `cli/tests/ai-specs.test.js`: 6 new unit tests for `resolveSkillRecommendations`/
      `deriveSkillDescription` — no `ai-specs/skills/` (pass-through), project-only skill,
      override of a built-in, combination of built-in + override + project-only, invalid
      resources (duplicate/empty) excluded with a separate `invalidCount`, repeated-call
      determinism. Plus 3 for `deriveSkillDescription` itself.
- [x] `cli/tests/cli.test.js`: 9 new end-to-end tests — no-ai-specs default output unchanged,
      no-ai-specs `--verbose` shows `source: builtin` only, project-only skill shown, override
      shown (built-in fields absent), `--verbose` detail (source/path/overrides), invalid resource
      → one default hint line (no raw diagnostic), `--verbose` → full diagnostic (no stack trace),
      override alone does not trigger the "ignored" hint, `bootstrap`/`analyze`/`prompt`
      unaffected.
- [x] Ran `cd cli && npm test`: **578/578 passing** (560 pre-existing + 9 in `ai-specs.test.js` +
      9 in `cli.test.js`), 0 regressions.
- [x] `aief verify` (whole project): PASS.
- [x] `aief status` diffed before/after (via `git stash`, code changes only): no difference —
      `status` itself is untouched by this Change.

## Close

- [x] `evidence.md`: test transcript, `aief doctor` manual walkthrough (project-only, override,
      combination, invalid-resource cases), the `invalidCount`-vs-`warnings` correction.
- [x] Verified every acceptance criterion in `spec.md`.
- [x] `aief close --yes --change 0054-lidr-skill-recommendations`.
