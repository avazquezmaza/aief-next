# Specification

## Goal

The close/verify readiness check treats `- [ ]`, `* [ ]`, and `+ [ ] ` identically as open,
blocking tasks, matching standard CommonMark unordered-list bullet syntax.

## Requirements

- R1 — `countOpenTasks()` matches an unchecked task line starting (after optional leading
  whitespace) with `-`, `*`, or `+`, followed by ` [ ]`.
- R2 — A checked task (`[x]` or `[X]`) using any of the three bullets is not counted, unchanged
  from today.
- R3 — Fenced-code-block content is explicitly NOT addressed by this Change (existing
  over-counting behavior there is unchanged, not a regression to fix here).
- R4 — No other readiness rule (`evidenceState`, `missing`, `empty`, `statusState`) is touched.

## Acceptance Criteria

- [ ] `- [ ] task` → counted as open (unchanged).
- [ ] `* [ ] task` → counted as open (new — the actual bug fix).
- [ ] `+ [ ] task` → counted as open (new).
- [ ] `- [x] task` / `- [X] task` → not counted (unchanged).
- [ ] `* [x] task` → not counted (new coverage, same rule).
- [ ] `+ [x] task` → not counted (new coverage, same rule).
- [ ] A checkbox-looking line inside a fenced code block → still counted (explicitly asserted as
      "no change" so this isn't accidentally altered as a side effect).
- [ ] Every existing `tasks.md` template generator (`genericChangeFiles`, `analysisChangeFiles`,
      the adoption Change's own tasks.md) produces byte-identical readiness results to today.
- [ ] `node cli/bin/aief.js verify` (whole project, this repository's own 72+ Changes) shows no
      unexpected new blocking.
- [ ] `git diff --check` passes.
