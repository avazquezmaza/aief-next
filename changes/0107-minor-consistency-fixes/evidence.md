# Evidence

## Summary

Fixed three small, independently-verified consistency bugs found during a code review of the
repository, grouped into one Change since each is a self-contained, one-file, low-blast-radius
fix: a fabricated `because` path for folder-shaped ai-specs resources, a bullet-style gap in
Definition item-marker scanning, and a stale version number in `README.md`.

## Activities Performed

### 1. `ai-specs.js` — fabricated `.md` path in `because` for folder skills

Reproduced before the fix: a project with `ai-specs/skills/my-folder-skill/SKILL.md` made
`aief doctor --verbose` print `because: ai-specs/skills/my-folder-skill.md present in project`
(a file that does not exist) while the adjacent `path:` field correctly showed
`ai-specs/skills/my-folder-skill/SKILL.md`. Fixed by deriving the `because` suffix from the
resource's actual discovered `path` (its basename: `SKILL.md` → folder shape,
`<id>/SKILL.md`; anything else → flat `<id>.md`, unchanged from before) instead of a hardcoded
`${id}.md` template. Added a regression test in `cli/tests/ai-specs.test.js`.

### 2. `definition-enrichment.js` — only `-` bullets recognized for item markers

`change.js`'s `countOpenTasks()` was standardized in Change 0075 to accept `-`, `*`, `+` bullets
for `tasks.md`. `definition-enrichment.js`'s item-marker scan (for `(deferred)`/`(ambiguous)`/
`(decision required)`/`(human)` lines in `change.md`) predates that standardization and only
recognized `-`, so a Definition Change author using `*` or `+` bullets had those markers silently
dropped — no crash, no error, the item simply never appeared in `known`/`missing`'s marked
buckets used by `status.js` and the `data-definition`/`architecture-definition` Skills' prompt
context. Verified this does NOT bypass the close-blocking governance gate
(`definitionDecisionOutcomeProblem()` in `change-verifier.js` uses section-heading presence, not
these markers) — informational-display impact only. Fixed by widening the bullet regex to
`/^[-*+]/`, matching `countOpenTasks()`'s convention. Added two regression tests.

### 3. `README.md` — stale "AIEF 3.2" in `## Status`

`package.json` has read `3.3.0` since Change 0103 (bump-version). Change 0102 ("release
readiness... refresh documentation so it stays accurate") did not touch this specific line — its
own evidence.md only notes there was no Skill-count claim to correct, nothing about the version
string. Updated the line to "AIEF 3.3".

## Verification

- Re-ran `doctor --verbose` on a folder-skill project after the fix: `because` now matches
  `path`.
- Ran `analyzeDefinitionSections()` against `*`/`+`-bulleted marker lines after the fix: classified
  identically to the `-` case.
- `npm test` (repo root): 1012/1012 passing (was 1010 before the three new tests).
- `node cli/bin/aief.js verify`: PASS.
- `git diff --check`: clean.
- Confirmed no existing test depended on the old (buggy) `because` text, the `-`-only bullet
  behavior, or the "AIEF 3.2" string.

## Findings

- No further instances of either the `because`/`path` mismatch or the bullet-marker gap were
  found elsewhere in the codebase (searched all callers of `analyzeDefinitionSections` and
  `resolveResourceRecommendations`).
- A broader sweep for other stale version mentions across `docs/` was not performed — out of
  scope for this Change; flagged under Recommendations.

## Risks

- None introduced. All three fixes only correct previously-wrong output; no behavior that was
  correct before is changed (confirmed via the flat-skill and `-`-bullet regression tests, which
  still pass unchanged).

## Recommendations

- A repo-wide grep for other stale version-number mentions (beyond `README.md`'s `## Status`)
  would be worth a follow-up Change, ideally paired with adding a version-bump step to the release
  checklist (Changes 0102-0104) so this class of drift doesn't recur.

## Artifacts Produced

- `cli/src/core/domain/ai-specs.js` (fix)
- `cli/src/core/domain/definition-enrichment.js` (fix)
- `README.md` (fix)
- `cli/tests/ai-specs.test.js` (1 new regression test)
- `cli/tests/definition-enrichment.test.js` (2 new regression tests)
- `changes/0107-minor-consistency-fixes/` (this Change)

## Lessons Learned

- Both code-level bugs are the same shape: a convention was extended in one place
  (`discoverResourceDir()`'s folder-skill support in Change 0053/later; `countOpenTasks()`'s
  multi-bullet support in Change 0075) without sweeping every other place that encoded the older,
  narrower assumption. Worth checking, when standardizing a convention, whether other modules
  parsing the same kind of Markdown line need the same update.

## Next Change

None required — this was a standalone fix found during an independent code review of the
repository (unprompted by a specific ticket).
