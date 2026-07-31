# Evidence

## Summary

`cli/src/core/domain/ai-specs.js` implemented: `discoverAiSpecs(cwd)` and `resolveResources()`,
a pure, unwired discovery + precedence resolver for a project's `ai-specs/skills|standards/`
directory, per ADR-023. Nothing in the existing CLI imports or calls this module — every existing
command's observable behavior is unchanged, confirmed by regression evidence below.

## Activities Performed

- `cli/src/core/domain/ai-specs.js` (new): `discoverAiSpecs()`, `discoverResourceDir()`,
  `resolveResources()`.
- `templates/specboot/README.md` (new): documents the `ai-specs/` convention and the honest
  "unwired" status.
- `templates/specboot/ai-specs/skills/example-skill.md`, `.../standards/example-standard.md`
  (new): illustrative templates.
- `cli/tests/ai-specs.test.js` (new): 17 tests.
- `cli/package.json`: registered the new test file in the `test` script.
- `knowledge/decisions.md`: ADR-023 added, ahead of implementation.

No file under `cli/src/cli.js`, `cli/src/detect.js`, or any existing test/doc referencing an
existing command was touched.

## Verification

- `cd cli && npm test`: **560/560 passing** (543 pre-existing + 17 new in `ai-specs.test.js`),
  0 failing, 0 regressions.
- `aief verify` (whole project): **PASS**.
- `aief status` diffed against the post-Change-0052 baseline: the only differences are the
  expected ones (Change count 51→52, `0053-lidr-integration` appearing as the new active Change)
  — no existing Change's line changed, no command's output format changed.
- Manual confirmation: `grep -rn "ai-specs" cli/src/cli.js cli/src/detect.js` returns nothing —
  zero coupling to any existing command, as required by R9/ADR-023.

## Findings

None blocking. No spec deviations beyond the one recorded inline in `spec.md`/`design.md`: the
concrete `read_error` test targets the resource directory itself being a file (`ai-specs/skills`
as a file, not a directory) rather than a stray `.md`-named subdirectory inside it — the latter is
correctly filtered out by the `isFile()` check before ever reaching a read, so it is not a read
error at all, and testing it as one would have asserted the wrong behavior.

## Risks

- Filename-as-id remains a deliberately simple contract (design.md §7) — no richer schema
  (front-matter, detectors) is introduced; a future Change extending this would need its own
  evidence-based justification (ADR-008), not a silent addition here.
- This module is inert until a future Change wires it into a real command — that Change will need
  to decide, separately, which command surfaces project `ai-specs/` content and how (design.md
  §4, ADR-023).

## Recommendations

Next Change (not started here): wire `discoverAiSpecs`/`resolveResources` into one real consumer
— most likely `recommendSkills()` (Skill Catalog, ADR-010) or `listStandards()`/`createStandards()`
— scoped and reviewed on its own, per ADR-023's explicit deferral.

## Artifacts Produced

- `cli/src/core/domain/ai-specs.js`.
- `templates/specboot/README.md`, `templates/specboot/ai-specs/skills/example-skill.md`,
  `templates/specboot/ai-specs/standards/example-standard.md`.
- `cli/tests/ai-specs.test.js`.
- `cli/package.json` (test script entry).
- `knowledge/decisions.md` (ADR-023).
- `changes/0053-lidr-integration/` (this Change).

## Lessons Learned

- Writing the design's file-system-error test case in `design.md` before implementing exposed a
  wrong assumption early (a `.md`-named subdirectory vs. the resource directory itself being a
  file) — cheaper to correct in a test than to discover once a later Change depends on the wrong
  contract.
- Keeping `resolveResources()` generic over `{ id, ... }` (rather than coupling it to the Skill
  Catalog's real shape) kept this Change's diff at zero lines in `cli.js`/`detect.js`, which was
  the single hardest constraint to satisfy given the commissioning instruction.

## Next Change

Wire this resolver into one real command (Skill Catalog or `knowledge/standards/`), as its own,
separately-scoped Change — see "Recommendations".
