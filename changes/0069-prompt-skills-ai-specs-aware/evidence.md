# Evidence

## Summary

`aief prompt`'s Skill context now resolves through `resolveSkillRecommendations()`, closing the
one real asymmetry found: `ai-specs/skills/` was already visible in `aief doctor` (Change
0054/ADR-024) and `ai-specs/standards/` was already visible in both `doctor` and `prompt` (Change
0055/ADR-025), but `prompt`'s Skill context — the content actually sent to an assistant — still
used raw `recommendSkills()`, unaware of `ai-specs/`. Built-in Skills keep their full
`promptContext`/`commonRisks` fields; project-sourced entries get the existing honest fallback
text and a `[project]`/`[project override]` tag, mirroring `standardsBlock` in the same function.

## Activities Performed

- Read `resolveSkillRecommendations()`/`resolveResourceRecommendations()` (`ai-specs.js`) and both
  existing callers (`printSkills()` in `doctor`, `resolveStandardRecommendations()` in `prompt`)
  before designing, to find the real, narrow gap rather than re-wiring from scratch.
- Found that naively swapping `recommendSkills(project)` for
  `resolveSkillRecommendations(recommendSkills(project), cwd()).items` in `prompt()` would silently
  drop every built-in Skill's `promptContext`/`commonRisks` — `resolveResourceRecommendations()`'s
  generic builtin branch only carries `id`/`description`/`because`/`source`/`path`/
  `overridesBuiltin`. Fixed by reattaching each builtin's full original object by id after
  resolving, touching only `prompt()`'s call site — the shared `ai-specs.js` module and `doctor`'s
  own rendering are untouched.
- Manually verified, before writing automated tests, in a throwaway project: baseline (no
  ai-specs), a new ai-specs skill (`pair-programming`), and an override of a real built-in id
  (`ai-workflow-governance`) — confirmed the override truly replaces (never merges) the built-in's
  `promptContext`, matching ADR-023's "wholly one or the other, never merged" rule.
- Corrected one incorrect assumption caught by a failing test: a duplicate-id case (two files
  claiming the same id) does **not** exclude that id entirely — the first-sorted file still
  resolves normally as a valid project resource; only the second file is the "duplicate" that gets
  ignored. Fixed the test to assert exactly one occurrence, matching the pre-existing `doctor` test
  for the same scenario (`cli.test.js`, Change 0054's own tests) rather than assuming the id
  vanishes.
- Renamed one Change-0054-era test whose title claimed "prompt... unaffected" but whose body never
  actually exercised `prompt` — updated the title to say so honestly and point at this Change's own
  new tests, rather than leaving a now-inaccurate claim in place (its assertions themselves were
  never about `prompt` and needed no change).
- Added 6 new tests to `cli/tests/cli.test.js` covering: byte-identical baseline, new-id addition,
  override (built-in content not leaking), non-overridden built-in unaffected, the duplicate-id
  edge case, and cross-command confirmation that `doctor`'s Skills report and `prompt`'s Standards
  block stay unaffected (no shared code touched).
- Documented nothing further in `docs/` — `docs/cli.md`'s `aief prompt` row already describes
  standards' ai-specs behavior generically enough to cover this without an edit (confirmed by
  reading it); Skills' ai-specs behavior is already documented for `doctor` and this Change brings
  `prompt` to parity rather than introducing new documented surface.

## Verification

- `node --test cli/tests/cli.test.js`: 202/202 passing (196 existing + 6 new).
- `npm test` (root, full suite): see final run in this evidence's Verification section update.
- `node cli/bin/aief.js verify` (full repo) and `--change 0069-prompt-skills-ai-specs-aware`: PASS.
- `git diff --check`: clean.
- Manual verification (see Activities Performed) preceded the automated tests, per this project's
  own established discipline for stdin/file-resolution-sensitive changes.

## Findings

- The asymmetry existed because Changes 0054 and 0055 were each deliberately scoped narrowly (0054:
  Skills into `doctor` only; 0055: Standards into `doctor` *and* `prompt`) — neither Change's own
  scope included "finish the same wiring for Skills in `prompt`". Worth checking, for any future
  resource type added to `ai-specs/`, whether it's wired into every command that reads the
  equivalent built-in list, not just the first one a Change happened to target.

## Risks

- None identified for the no-`ai-specs/skills/` path (confirmed byte-identical). For a project
  using `ai-specs/skills/`, the only behavior change is that `prompt` now shows what `doctor`
  already showed — no new write path, no new capability, no change to Skill *execution*
  (`--skill <id>` is untouched).

## Artifacts Produced

- `cli/src/cli.js` (`prompt()`'s Skill-context resolution and `skillsBlock` template)
- `cli/tests/cli.test.js` (1 test title corrected, 6 tests added)

## Lessons Learned

- Checking the shared resolver's actual field-carrying behavior before wiring it into a second
  call site caught a real content-loss bug before it shipped — worth doing whenever reusing a
  "generic over builtins' shape" helper (as `ai-specs.js` explicitly documents itself to be) in a
  context that relies on builtin-specific fields the generic shape doesn't carry.

## Next Change

Fase 4 continues with #17a (finish `propose()`'s consolidation onto the SDD Provider boundary,
ADR-017's own documented follow-up) and #17b (real OpenSpec artifact reading) per the agreed
roadmap.
