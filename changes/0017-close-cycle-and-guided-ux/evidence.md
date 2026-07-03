# Evidence

## Summary

Third independent review (Gemini) processed critically: 4 of 5 recommendations accepted and implemented, 1 rejected with documented rationale (ADR-009). AIEF now closes the Change cycle natively — `aief close` runs real readiness checks and `--yes` marks the Change Closed inside its own `change.md` — while the active Change is derived from files, `verify` speaks calmly about work in progress, and every command shares one `Next:` voice. No new concepts, no state files, no dependencies.

## Activities Performed

- Analyzed each recommendation against AIEF's philosophy (simple, guided, files as source of truth) before touching code.
- **Rejected** `.aief/state.json`: "active Change" is per-person; a committed state file leaks one developer's context to the team, a gitignored one is invisible state. Implemented the simpler alternative: active = latest Change whose `change.md` has no `Closed` status. Documented as ADR-009.
- **Implemented close cycle**: `isClosed()`, `markClosed()` (dated `## Status` section), rewritten `close` with readiness report (missing/empty files, unchecked task count, placeholder evidence), `--yes` confirmation flag, `--change` selector, honest refusal (exit 1) when not ready.
- **Implemented verify tone**: `○ <change> — in progress (evidence not completed yet; expected until the Change is closed)` for open Changes; `! closed but evidence.md was never completed` for closed ones; `✓ <change> (closed)` when complete.
- **Implemented unified hints**: single `printNext()` used by adopt, analyze, status, doctor, propose, new-change, prompt (no-change path) and close; removed the "Recommended next step"/"Next:" format split.
- **Reorganized README**: responsibilities table, hierarchy and mermaid diagram moved from position 3 to the "How AIEF fits with OpenSpec and Specboot" section after the core flow; new-user path is now problem → CLI → adopt → work with Changes → guarantees → integrations. Nothing deleted.
- Updated `docs/cli.md`, `cli/README.md`, `COMMAND_HELP`, CHANGELOG (0016 + 0017 entries).
- Dogfooding: closed Changes 0013–0016 with `aief close --change <id> --yes`; all passed readiness checks legitimately (their evidence was real).

## Verification

- CLI suite: **25/25 pass** (4 new/updated tests: close refuses incomplete Change with exit 1 and no Status written; close --yes writes dated Status, verify shows `(closed)`, prompt moves to next open Change; fresh-change verify shows `○ in progress` and no `✗`; close works when change.md prose mentions "## Status").
- `aief verify` at repo root: PASS — 0013–0017 shown as `✓ (closed)`, 0001–0012 unchanged.
- Manual dogfood: closed 0013–0017 with the real command.

## Findings

- **Bug caught by dogfooding, fixed same-day:** the first `markClosed` used an unanchored `/##\s*status/i` check, so a change.md whose *prose* mentioned "`## Status`" (like this Change's own scope) took the replace-existing-section branch, replaced nothing, and `close` claimed success without writing. Fixed with line-anchored regexes, `markClosed` now returns whether the Change is actually closed, and `close` reports failure honestly if the write did not take effect. Regression test added.
- The close cycle made the placeholder-evidence heuristic from 0014 more precise for free: "pending evidence" is only a problem when a Change claims to be finished.
- The unified `printNext()` removed three slightly different next-step formats that had accumulated in just four Changes — duplication grows fast even in small CLIs.

## Risks

- Changes 0001–0012 remain open (they predate the close cycle); harmless, but `prompt` would fall back to 0012 if 0017+ were all closed. Optional housekeeping: close them after reviewing their evidence quality.
- The `## Status` section is a convention inside change.md; a future template update should include it (as `Open`) so users discover it naturally.

## Recommendations

- Add `## Status\n\nOpen` to the change.md template in a future Change so the lifecycle is visible from creation.
- Review and close Changes 0001–0012 as housekeeping.
- Keep rejecting state-file proposals unless a real multi-Change workflow friction is observed (per ADR-008/ADR-009).

## Artifacts Produced

- `cli/src/cli.js` (close cycle, verify tone, printNext), `cli/tests/cli.test.js` (+2 tests, 1 updated), `README.md` (reorganized), `docs/cli.md`, `cli/README.md`, `CHANGELOG.md`, `knowledge/decisions.md` (ADR-009), Status sections in changes 0013–0016.

## Lessons Learned

- External reviews are most valuable when filtered through the project's own decision log: the state-file proposal was reasonable in general but wrong for AIEF's philosophy, and having ADRs made the rejection fast and defensible.
- Deriving state from artifacts that already exist beats adding a new artifact — every time so far.

## Next Change

Housekeeping: review and close Changes 0001–0012; add the `Status: Open` field to the change template. Then continue Phase 2 validation (drive Flux Portal's 0002 analysis; cross-stack validation on a non-Node project).
