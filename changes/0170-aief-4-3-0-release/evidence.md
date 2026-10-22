# Evidence

## Summary

AIEF 4.3.0 prepared on top of `v4.2.0`: version bumped, `releases/v4.3.0.md` written, release index
updated. Nine Changes (0161–0169) plus this one. Tag and GitHub release follow after merge, with the
owner's confirmation.

## Activities Performed

1. **v4.2.0 tagged first (owner-approved, before this Change).** 4.2.0 had been bumped and noted in
   Change 0160 but never tagged. Verified at `00f36d3`: both `package.json` files at 4.2.0,
   `releases/v4.2.0.md` present, `aief --version` → `aief 4.2.0`, repo-root `npm test` → 725 tests,
   717 pass, 0 fail, 8 skipped. Then `git tag -a v4.2.0 00f36d3 -m "AIEF 4.2.0"`, pushed, and
   `gh release create v4.2.0` with those notes:
   https://github.com/avazquezmaza/aief-next/releases/tag/v4.2.0
2. **R1 — integration.** 0161–0169: every `change.md` says Closed, and each Change directory's last
   commit is an ancestor of `main`.
3. **R2 — version.** `npm version 4.3.0 --no-git-tag-version` at the root and in `cli/` (also
   updates both `package-lock.json`). `node cli/bin/aief.js --version` → `aief 4.3.0`.
4. **R3 — notes.** `aief release 4.3.0` scaffolded `releases/v4.3.0.md`; filled with upgrade notes
   (guardrails command, Gemini skill and guard, the `new-change --type` behavior change, worktree-
   aware IDs, closed `## Type` list, doctor reports), a per-Change summary and verification. It also
   records that v4.2.0's "725/725 passing" was 717 passing + 8 skipped.
5. **R4 — index.** `changes/README.md`: new "4.3.0 — 0161–0170" section; "Unreleased (after 4.3.0)"
   section opened.
6. **R5 — drift.** `grep -rn "AIEF 4\.2\|4\.2\.0" README.md docs/` (excluding `docs/history/`) → no
   hits. `README.md` `## Status` speaks of "AIEF 4.0" as the release line and was left as in 4.1.0
   and 4.2.0. `python3 scripts/diagrams/generate_all.py` → every SVG identical to the committed one;
   `docs/images/adoption-workflow.png` re-rasterized with the same dimensions (2031×968) but
   different bytes, identically on two runs — a local rasterizer difference, not content drift.
   Restored, not committed.

## Verification

- `npm test` (repo root) → 788 tests, 788 pass, 0 fail, 0 skipped.
- `npm run lint` → clean. `git diff --check` → clean. `aief verify` → PASS.
- `aief verify --change 0170 --strict` → fails only on the open `(human)` release-readiness approval.

## Findings

- A prepared version can go untagged without anyone noticing: 4.2.0's bump and notes merged in
  Change 0160, but no tag followed.

## Risks

- None functional; this Change only changes version strings, notes and the index.

## Recommendations

- After merge: `git tag -a v4.3.0 <merge commit> -m "AIEF 4.3.0"`, push the tag, and
  `gh release create v4.3.0 --notes-file releases/v4.3.0.md` — with the owner's confirmation.

## Artifacts Produced

- `package.json`, `package-lock.json`, `cli/package.json`, `cli/package-lock.json`
- `releases/v4.3.0.md`, `changes/README.md`

## Lessons Learned

Tag in the same step as merging a release Change, or the next release has to repair it.

## Next Change

None queued.
