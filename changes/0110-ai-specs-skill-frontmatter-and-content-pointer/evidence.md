# Evidence

## Summary

Validated whether an externally-authored, Claude Code / Kiro-style Skill package (YAML
frontmatter `SKILL.md` + `references/` + `scripts/audit.sh`) can be adopted into an AIEF project.
Confirmed the right integration point is AIEF's existing `ai-specs/skills/<id>/SKILL.md`
discovery (built for exactly this — LIDR/specboot-style, project-owned Skills, ADR-023's "AIEF
consumes, never copies") rather than either of AIEF's own internal Skill mechanisms. Found and
fixed two real gaps in that discovery path by reproducing it end-to-end with real content
(`camel-quarkus`/`camel-spring-boot`, a real, mutually-exclusive Skill pair from an external
`.kiro/skills/` directory).

## Design note: why not the Skills Runtime or Skills Catalog

Two other AIEF mechanisms could plausibly host Skill content; both were evaluated and rejected:

- **Skills Runtime** (`cli/src/skills/*.js`, e.g. `architecture-definition.js`): every existing
  Skill there is scoped to Definition Changes (`appliesTo()` requires `context.change.type ===
  "definition"`) — a code-review Skill like camel-quarkus needs to apply during implementation
  work, not AIEF's pre-implementation Definition phase. The contract doesn't fit.
- **Skills Catalog** (`skills-catalog.json`): mechanically could add a `camel`/`quarkus` detector
  (the existing `spring` detector's `searchFiles: ["pom.xml","build.gradle"]` + `keywords`
  precedent would work), but its `promptContext` field is a short paragraph, not a document —
  condensing ~250 lines of runtime-specific tables, code snippets and verifiable rules into that
  shape would discard most of the actual value. More fundamentally, both of these mechanisms live
  in AIEF's own repository — baking one team's Java/Camel/OpenShift playbook into AIEF's own
  codebase couples a domain-agnostic orchestrator to one team's stack, and does not scale (every
  team's own Skill would need a PR against AIEF itself).

`ai-specs/skills/` avoids both problems: the Skill content stays entirely in the adopting
project's own repository, versioned by the team that owns it, and AIEF only ever discovers and
points at it — never copies or re-derives it.

## Activities Performed

- Copied the real `camel-quarkus` and `camel-spring-boot` Skill directories (each: `SKILL.md`
  with YAML frontmatter, a `references/` folder with 5 files, `scripts/audit.sh`) into a test
  project's `ai-specs/skills/`.
- Ran `aief doctor --verbose`: confirmed structural discovery works (both Skills listed, `because`/
  `path` correct — the `path`/`because` correctness itself only holds because of Change 0107's
  earlier fix), but `description` showed `---` for both.
- Ran `aief prompt`: confirmed the Skills block rendered the generic "no operational content yet
  — treat it as a topic to keep in mind" for both, with no mention of where their actual content
  (the concurrency/XXE/timeout rules) lives.
- Confirmed `aief verify` is unaffected by `ai-specs/` presence (it isn't part of Change
  structure validation) and that AIEF never executes `scripts/audit.sh` itself — consistent with
  Skills being instructions-only, informational content.
- Fixed both gaps:
  - `deriveResourceDescription()` now recognizes a leading `---...---` frontmatter block and
    prefers its own `description:` field (stripping surrounding quotes); falls back to the
    existing first-line logic (applied to the post-frontmatter body) otherwise. A mid-document
    `---` (a Markdown thematic break, not frontmatter) is correctly left alone by requiring the
    match to start at position 0.
  - `prompt.js` now carries a project-sourced Skill's resolved `path` through to `skillsBlock`;
    when there is no `promptContext`, the rendered line points the assistant at the real file
    (mirroring `standardsBlock`'s existing precedent for project standards, two lines above it in
    the same function).
- Re-ran the same reproduction after both fixes: `doctor` now shows the real one-line
  description from each Skill's frontmatter; `prompt` now says "recommended for this project —
  read ai-specs/skills/camel-quarkus/SKILL.md for its full instructions before starting."

## Verification

- `npm test` (repo root): 1023/1023 passing (was 1019 before this Change's tests).
- `node cli/bin/aief.js verify`: PASS.
- `git diff --check`: clean.
- Updated 2 existing tests in `cli/tests/cli-skills-and-maturity.test.js` whose assertions
  described the pre-fix "no operational content yet" text for a project-sourced Skill with a
  real, resolvable path — this is the intended behavior change, not a regression; confirmed the
  builtin-fallback case (`project-architecture-reviewer`, no project path) these tests are
  distinct from still renders unchanged.
- Added 4 new tests for `deriveResourceDescription()`'s frontmatter handling, covering: a
  present `description:` field, a quoted one, an absent one (fallback), and a mid-document `---`
  (must not be mistaken for frontmatter).

## Findings

- No YAML frontmatter parsing existed anywhere in AIEF before this Change — `stripFrontmatter()`
  is deliberately minimal (a single-line `description:` scalar only; block scalars `>`/`|` are
  not parsed) rather than a general YAML parser, matching the project's existing "narrow,
  deterministic extraction, never a general-purpose parser" discipline (the same one
  `verification-evidence.js`'s path-token regex and `definition-enrichment.js`'s section splitter
  already follow).

## Risks

- None introduced. Both fixes are purely additive for the case they target (frontmatter-led
  content; a project-sourced Skill with a resolvable path) and fall through to unchanged
  existing behavior in every other case, confirmed by the updated/new tests.

## Recommendations

- None outstanding for AIEF itself. For the camel-quarkus/camel-spring-boot Skills specifically:
  copying them into a target project's `ai-specs/skills/camel-quarkus/` and
  `ai-specs/skills/camel-spring-boot/` (unchanged, as authored) is now sufficient — `doctor` will
  show a real description and `prompt` will point the assistant at the right file for any Change
  in that project.

## Artifacts Produced

- `cli/src/core/domain/ai-specs.js` (fix)
- `cli/src/commands/prompt.js` (fix)
- `cli/tests/ai-specs.test.js` (4 new regression tests)
- `cli/tests/cli-skills-and-maturity.test.js` (2 tests updated for the intended behavior change)
- `changes/0110-ai-specs-skill-frontmatter-and-content-pointer/` (this Change)

## Lessons Learned

- Validating "is X integrable" by actually copying real, unmodified third-party content into a
  disposable test project and running the real commands against it surfaced two gaps that reading
  the code alone did not — the `---` frontmatter delimiter and the missing content-pointer only
  became visible by looking at real `doctor`/`prompt` output.

## Next Change

None required.
