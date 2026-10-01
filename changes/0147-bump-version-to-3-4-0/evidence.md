# Evidence

## Summary

Version bumped to 3.4.0 in both packages and both lockfiles; `README.md` `## Status` now says
"AIEF 3.4" (C0146-F4). No behavior change beyond the version string.

## Activities Performed

1. `npm version 3.4.0 --no-git-tag-version` at the repo root and with `--prefix cli`. It updates
   `package.json` and the lockfile's own version fields; no dependency entry changed and no network
   was used. Unlike the 0103 precedent's `npm install`, it cannot pull in unrelated lockfile churn.
2. `README.md:193`: "AIEF 3.3 is implemented" → "AIEF 3.4 is implemented".
3. Pre-tag check (`docs/maintainer.md` "Releasing"): `grep -rn "AIEF 3\.3\b\|3\.3\.0" README.md
   docs/*.md cli/README.md` matches only the historical note in `docs/maintainer.md:186`, which
   describes the 3.2 → 3.3 incident and stays as written.

4. Release notes: `aief release 3.4.0` scaffolded `releases/v3.4.0.md`; filled with upgrade notes,
   a themed summary of 0105–0147 (from the 0146 inventory) and verification. Combined with the bump
   at the owner's request (0103 + 0104 precedents in one Change).
5. Diagrams: `python3 scripts/diagrams/generate_all.py` regenerated every SVG byte-identical.
   `docs/images/adoption-workflow.png` came out 233,357 → 235,896 bytes, a re-rasterization by the
   local renderer with no source change. It was reverted to the committed file.

## Verification

```bash
node cli/bin/aief.js --version   # aief 3.4.0
npm test                         # 1126/1126 pass
npm run lint                     # clean
node cli/bin/aief.js verify      # PASS
git diff --check                 # clean
```

Lockfile diff: exactly the four root-package `"version"` lines (two per lockfile), 3.3.0 → 3.4.0.

## Findings

None.

## Risks

None beyond the precedent's.

## Recommendations

- After merge: tag `v3.4.0` on the merge commit, push the tag, and create the GitHub Release from
  `releases/v3.4.0.md`, only with owner confirmation.

## Artifacts Produced

- `package.json`, `cli/package.json`, `package-lock.json`, `cli/package-lock.json`, `README.md`
- `releases/v3.4.0.md`

## Lessons Learned

- `npm version --no-git-tag-version` is a narrower, offline way to bump than `npm install`.

## Next Change

None. Remaining: tag and GitHub Release (owner-confirmed actions, not a Change).
