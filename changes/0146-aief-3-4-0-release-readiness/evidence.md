# Evidence

## Summary

AIEF 3.4.0 readiness verified: the 42 Changes since `v3.3.0` (0105–0145) are closed and on `main`.
The documentation audit found three real gaps, now fixed, and one version-string item for the bump
Change.

## Activities Performed

1. Integration check: for each `changes/0105`–`0145` directory, confirmed a `Closed` status in
   `change.md` and that its last commit is an ancestor of `main`. 42 Changes (two share `0122`), no
   exceptions.
2. Documentation audit (same method as Changes 0101/0102, extended to this release's themes):
   - `docs/*.md` reference scan over `cli/src`, `docs/*.md`, `README.md`, `cli/README.md`,
     `AGENTS.md`: one hit, `docs/navigator/README.md`. It is an optional-file existence probe in
     `cli/src/commands/status.js`, not a link, so it is a false positive.
   - Version strings: `README.md:193` "AIEF 3.3 is implemented…" (bump Change). The remaining "AIEF
     3.1" hits in `docs/cli.md` are historical provenance ("AIEF 3.1, Change 0052"), correct as written.
   - Node version: `docs/getting-started.md` still said `>= 18` (Change 0142 fixed only the README).
   - Gates: `docs/workflow.md` still described gates as "read-only narration" and said `close` runs
     its checks "regardless of track", which has been stale since Change 0125 (ADR-037). `docs/cli.md`'s
     `close` row did not mention gate enforcement.
   - Branch per Change (0114/0117): documented only in `AGENTS.md` and `docs/maintainer.md`; the
     `docs/cli.md` `new-change` row did not mention the branch switch or `--no-branch`.
   - Kiro (0112), `verify --json` (0138): documented in `docs/cli.md`, `README.md`,
     `docs/assistant-workflow.md`. No gap.
   - Skills count: `docs/workflow.md` says "Five Skills"; `cli/src/skills/` registers five. No gap.
3. Fixed the three gaps (see Artifacts).

## Verification

```bash
npm test                      # 1126/1126 pass
npm run lint                  # clean
node cli/bin/aief.js verify   # PASS
git diff --check              # clean
```

Documentation-only change; no behavior change.

## Findings

- **C0146-F1:** `docs/workflow.md` contradicted ADR-037 on gate enforcement. Fixed.
- **C0146-F2:** `docs/getting-started.md` Node requirement stale (`>= 18`). Fixed.
- **C0146-F3:** `docs/cli.md` did not document the automatic branch switch, `--no-branch`, or
  gate enforcement in `close`. Fixed.
- **C0146-F4:** `README.md` `## Status` says "AIEF 3.3". Handed to the bump Change.

## Risks

- The audit is targeted at this release's themes, not a full re-read of every document.

## Recommendations

- Bump Change (`0147`): set 3.4.0 in `package.json`, `cli/package.json`, `package-lock.json`;
  update `README.md:193`; re-run `grep -rn "AIEF 3.3" README.md docs/` before tagging.
- After the bump: `aief release 3.4.0`, fill `releases/v3.4.0.md`, then tag and publish only with
  owner confirmation. Release notes should call out Node >= 22 as the main upgrade note.

## Artifacts Produced

- `docs/workflow.md` (Tracks: gate enforcement)
- `docs/getting-started.md` (Node.js >= 22)
- `docs/cli.md` (`new-change` and `close` rows)

## Lessons Learned

- A behavior change (0125) can leave an older doc paragraph saying the opposite. The audit caught
  it because it checked each release theme against the docs, not only the links.

## Next Change

`0147-bump-version-3-4-0` (proposed).
