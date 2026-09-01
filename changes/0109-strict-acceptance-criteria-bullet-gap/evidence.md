# Evidence

## Summary

Fixed a gap in `aief verify --strict`'s Acceptance Criteria placeholder check: it only recognized
the exact string `"- [ ]"` as the untouched scaffold placeholder, so a `spec.md` using `* [ ]` or
`+ [ ]` — equally valid CommonMark bullets, and the same tolerance `change.js`'s
`countOpenTasks()` already applies to `tasks.md` since Change 0075 — was silently accepted as real
content, letting `--strict` pass where it should have failed. Found during a follow-up sweep for
this exact bug class (found and fixed once already in `definition-enrichment.js`, Change 0107)
elsewhere in the codebase.

## Activities Performed

- Grepped the codebase for other exact-bullet-character checks (`\[ \]` patterns) after fixing
  Change 0107, to check whether the same class of gap existed elsewhere. Found
  `change-verifier.js`'s `acceptanceCriteria === "- [ ]"`.
- Reproduced before the fix: created a Change with `spec.md`'s Acceptance Criteria section holding
  only `* [ ]`. `aief verify --change <id> --strict` reported PASS (exit 0) — no
  "Acceptance Criteria is empty" line — while the same Change with `- [ ]` instead correctly
  reported the problem (exit 1).
- Replaced the exact-string check with `/^[-*+] \[ \]$/.test(acceptanceCriteria)`.
- Checked `isPlaceholderContent()`'s other exact-match check (`content === "-"`, used for Success
  Criteria/In scope/Out of scope/Requirements) for the same class of gap — confirmed it does NOT
  have one: those sections' placeholder has no checkbox, so any non-`-` bullet replacing it is
  already real content (correctly treated as "known" either way), not a second placeholder shape
  to miss.
- Added two regression tests (`*` and `+` bullets) to `cli/tests/verify-strict.test.js`.

## Verification

- Re-ran the manual reproduction after the fix: `* [ ]` now correctly reports
  "spec.md Acceptance Criteria is empty" and `aief verify --strict` exits 1, same as `- [ ]`.
- `npm test` (repo root): 1019/1019 passing (was 1017 before the two new tests).
- `node cli/bin/aief.js verify`: PASS.
- `git diff --check`: clean.
- Confirmed the existing `- [ ]` test and the "filled-in Change reports no objective gaps" test
  (which uses `- [ ] Real, checkable criterion.`) both still pass unchanged.

## Findings

- No other instance of this bullet-character gap was found in the codebase — the only two places
  matching a specific bullet character exactly were `definition-enrichment.js` (fixed Change 0107)
  and this one.

## Risks

- None introduced. The fix only widens what counts as "still the placeholder" (more Changes now
  correctly flagged under `--strict`, an opt-in check); no previously-correct verdict changes.

## Artifacts Produced

- `cli/src/core/services/change-verifier.js` (fix)
- `cli/tests/verify-strict.test.js` (2 new regression tests)
- `changes/0109-strict-acceptance-criteria-bullet-gap/` (this Change)

## Lessons Learned

- Grepping for the same pattern class after fixing one instance (here: `\[ \]` bullet-character
  exact-matches) found a second, real instance the original fix's scope didn't cover — worth doing
  as a matter of course after any "only recognizes one bullet character" fix.

## Next Change

None required.
