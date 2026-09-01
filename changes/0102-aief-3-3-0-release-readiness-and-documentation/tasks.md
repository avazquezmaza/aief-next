# Tasks

## Implementation

- [x] Confirmed Changes 0089–0101 reachable from `main`, all closed.
- [x] Full `docs/<name>.md` reference scan (`cli/src/**` + current `docs/*.md`) — zero dangling
      references remain (0101's fix still holds; no new ones introduced by 0098–0101).
- [x] Found and fixed the one real gap: `docs/workflow.md`'s Skills Runtime paragraph undercounted
      ("Four Skills") and omitted `adversarial-review`, the 5th registered Skill (shipped since
      Core 3.0, Changes 0047–0049).

## Documentation

- [x] `docs/workflow.md` — Skills Runtime paragraph corrected to "Five Skills", `adversarial-review`
      named with a one-clause description.

## Verification

- [x] `npm test` — 1009/1009 passing (no behavior change).
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.

## Evidence

- [x] Update evidence.md
- [x] Delete the 4 merged remote branches — user explicitly confirmed; `git push origin --delete`
      run for each, `git branch -r` confirms only `origin/main` remains.
