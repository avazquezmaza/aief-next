# Evidence

## Summary

The "No veo las Skills" friction is closed: `aief adopt` now writes `knowledge/skills.md` — a readable, never-overwritten artifact listing only the Skills recommended for the detected project, each with why it was recommended (the real detection trail), when to use it, related standards, prompt context, common risks and evidence expectations, with an honest "No operational content yet." for content-less Skills. Adopt output was compacted accordingly (one `Detected:` line instead of the triple signal/skill dump — also resolving quick win #6 from the 0020 validation), and `analyze`/`prompt` reference the file when present. Skills remain context, never commands; the catalog remains the technical source.

## Activities Performed

- Added `skillsDoc(project, skills)` in `cli/src/cli.js`: renders the recommended Skills (full content passed through by `recommendSkills` since 0018) with a header stating it is generated during adoption and that Skills are not commands and are never executed.
- Wired into adopt after standards creation: `writeFile` non-overwrite semantics; prints `Skills documented: knowledge/skills.md` on creation or `Skills documentation already exists: knowledge/skills.md` when present; the file joins the adoption evidence artifact list (0021 integration) when created.
- Compacted adopt output: replaced `printSignals` + final `printSkills` with a single `Detected: <signal ids> (details: aief doctor, knowledge/skills.md)` line; doctor keeps the full explained dump.
- `analyze`: the seeded Detected Context now ends its Recommended Skills section with `Full Skill knowledge: knowledge/skills.md` when the file exists. `prompt`: lists `- knowledge/skills.md` under "Read these files first" when it exists — the embedded Skill-context block (the honest "included as context, not executed" section) is unchanged.
- One-paragraph doc update in docs/cli.md; CHANGELOG entry.

## Verification

- CLI suite: **37/37 pass** (3 new tests: skills.md content — reasons with the real keyword trail, related standards, evidence expectations, honesty header; no-overwrite with "already exists" reporting; analyze/prompt references plus the context-not-commands note preserved).
- Regression: adopt idempotence, ID-collision safety, app-code-untouched, standards no-overwrite, 0021 self-evidence tests — all green in the same run.
- `aief verify` at repo root: PASS (run after closing this Change).

## Findings

- Everything needed was already computed at adopt time (skills with `because` trails since 0018); the visible artifact cost one rendering function and one write — no new detection, no new state.
- The fallback Skill (`project-architecture-reviewer`) exercises the "No operational content yet." path naturally on no-signal projects.

## Risks

- `knowledge/skills.md` is a snapshot at adoption time; if the stack changes later, it can drift from what doctor detects. Mitigation documented in the file itself (delete and re-run adopt to regenerate, or edit manually).

## Recommendations

- Re-run the fresh-user validation on Flux Portal to measure 0021+0022 together against the 0020 friction list (expected: frictions #1, #2, #3, #4 and #6 gone; #5, #7, #8 still open).

## Artifacts Produced

- `cli/src/cli.js` (skillsDoc, adopt wiring + compact output, analyze/prompt references)
- `cli/tests/cli.test.js` (+3 tests)
- `docs/cli.md`, `CHANGELOG.md`

## Lessons Learned

- "Visible" beat "new system": one generated markdown file answered the friction without commands, plugins or hierarchy changes — the restrictions in the Change brief did their job.

## Next Change

Re-validation on Flux Portal (0021+0022 together), then the remaining 0020 quick wins: Analysis profile default (#5), aiRoadmap semantic false positive (#7), profile content (#8).
