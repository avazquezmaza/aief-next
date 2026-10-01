# Evidence

## Summary

Added a release-grouped index of all Changes (`changes/README.md`), corrected history docs that
drifted after ADR-032, and removed 152 MB of gitignored local build artifacts. No Change was
moved, renamed or edited; no CLI behavior, test, template or example changed.

## Activities Performed

- Diagnosed the repository: 151 Changes, all closed; 0 broken relative links in canonical docs
  (README, `docs/`, `knowledge/`, AGENTS, adapters); 41 broken links, all inside Changes < 0100;
  `changes/` 156 MB on disk but 4.9 MB tracked.
- Decided with the owner (2026-10-01): **index, don't move**. Archiving 0001–0042 was rejected
  because:
  - ADR-014/ADR-032 require a second independent review and consensus for any ARCHIVE/DELETE;
  - moving breaks ~289 Change cross-references, 45 ADR references in `knowledge/decisions.md`,
    36 in `docs/`, and code/test comments;
  - the CLI reads only `changes/`, so moved Changes would drop out of `status`, `status --graph`
    and ID-collision detection;
  - `docs/history/README.md` promises `changes/` is the complete, unedited history.
- R1: generated `changes/README.md` (152 entries, seven eras bounded by the version-bump Changes
  0062/0088/0103/0147).
- R2: `docs/history/README.md` — AIEF 2.0 study now records the ADR-032 thaw and the Change 0037
  close (2026-09-01); "Browsing further back" links the index and lists `change.md` (152 of 152
  Changes have it; only 9 have `proposal.md`).
- R3: `CHANGELOG.md` closing note no longer claims "roadmap Phase 2"; points to `releases/`,
  `changes/README.md` and the pre-Core 3 roadmap.
- R4 (owner-authorized): deleted `changes/0096-*/fixtures/{executions-service,executions-service-b,reporting-monolith}/node_modules`
  (55+55+42 MB), `changes/0121-*/__pycache__/`, empty `.codex/`. All were gitignored or
  untracked; each fixture keeps its tracked `package.json`/`package-lock.json`, so `npm ci`
  restores them.

## Verification

| Check | Result |
|---|---|
| `aief status` / `aief verify` output before vs after adding the index | identical (`diff` empty) |
| `nextChangeId()` with the index present | `0153` (correct) |
| Relative link check, all tracked + new `.md` | only the 41 pre-existing breaks in Changes < 0100 |
| `npm test` | 1141 pass, 0 fail |
| `node cli/bin/aief.js verify` | PASS |
| `git diff --check` | clean |
| `du -sh changes` | 156 MB → 4.9 MB |
| `git status --short` | only `CHANGELOG.md`, `docs/history/README.md`, `changes/README.md`, this Change |

## Findings

- Root assistant adapters (`CLAUDE.md`, `CODEX.md`, `GEMINI.md`, `CURSOR.md`) are 10–15 lines
  each, delegate to `AGENTS.md` and do not duplicate it; each assistant loads its own file name.
  No consolidation warranted.
- `docs/history/` already serves as the archive for superseded docs; no further moves needed.

## Risks

- `changes/README.md` is hand-maintained; it will drift if new Changes are not appended. Mitigated
  by the "append to the last section" instruction; nothing in the CLI depends on it.
- Re-running the 0096 study fixtures now needs `npm ci` first.

## Recommendations

Known gaps, recorded, not fixed here:

- `releases/` has no notes between v1.0.0 and v3.3.0 (v2.x, v3.0, v3.1, v3.2). Writing them now
  would be reconstruction, not record; candidate follow-up only if the owner wants them, sourced
  from the release-readiness Changes (0060, 0087).
- Change ID 0122 is shared by two Changes. Already surfaced by `aief status`; renaming would
  break references. Leave as is.
- If the index proves useful, a follow-up Change could have `aief status` or `verify` flag a
  Change missing from `changes/README.md` — a CLI change, so out of scope here.

## Artifacts Produced

- `changes/README.md` (new)
- `docs/history/README.md` (modified)
- `CHANGELOG.md` (modified)
- `changes/0152-repo-cleanup-and-history-index/` (this Change)

## Lessons Learned

- Disk size is not repository size: 97% of `changes/` on disk was gitignored `node_modules`.
- The cheapest navigability fix for an append-only history is an index, not a move.

## Next Change

None required. Optional follow-ups listed under Recommendations.
