# Evidence

## Summary

Product validation of the complete adoption experience (capabilities up to 0019) on Flux Portal, as a first-time user, through the full loop `doctor → adopt → verify → analyze → prompt → simulated implementation → verify → close`. **The loop closed end-to-end for the first time**: the Analysis Change was completed by the assistant role and `aief close --yes` closed it on the first attempt. Command time to a useful prompt: under 2 seconds across 5 commands (realistic wall time with reading: ~10–15 minutes). Eight frictions recorded, one of them new and now the top quick win: the adoption Change stays "in progress" forever because `adopt` performs the work but leaves its own evidence as a placeholder for the human.

## Activities Performed

- Verified the portal had no AIEF structure (user had cleaned it), then ran the full flow with timings and full output captured.
- Evaluated each step against the six validation questions (right / expected / manual / automatable / missing docs / redundant info).
- Acted as the assistant for the simulated implementation: confirmed the seeded Detected Context file-by-file, completed the portal's 0002 evidence (analysis only) and tasks, then exercised governance (`verify`, `close` report, `close --yes`, post-close `verify`).
- Compiled the validation report (Executive Summary, step-by-step, prioritized Quick Wins) delivered with this Change.

## Verification

- Portal `git status` throughout: only untracked AIEF additions; zero tracked files modified by AIEF; application code untouched.
- Portal `aief verify` post-close: PASS with `0002 (closed)`.
- aief-next `git diff`: only `changes/0020-*` (no product changes).
- Timings: doctor 0.30s; every other command sub-second.

## Findings

**Worked well (new capabilities validated on real project):** standards creation chose frontend+backend correctly for the fullstack Next.js app and was purely additive; analyze seeded 10 accurate signals, 6 skills and 6 standards — the assistant started from a verified map, not a blank page; the 57-line prompt carried standards and per-skill risks that directly shaped the analysis; the close cycle (report → --yes → status in change.md) worked first try; verify's calm ○ tone read correctly during work-in-progress.

**Frictions (all detailed in the report):**
1. **NEW — adoption Change never closes itself:** `adopt` does the work but leaves evidence.md as "Pending.", so `verify` flags it forever and the user must document what the machine did. The machine knows exactly what it did.
2. verify still prints no `Next:` hint (docs/cli.md claims every command does — doc/behavior mismatch persists).
3. doctor's embedded status still warns about framework-repo artifacts (Navigator, Profiles, adapters) the adopted project will never have; `! openspec` lacks an "(optional)" label.
4. Signals are printed three times in one session (doctor, adopt, seeded change.md) — redundant in sequence, though the change.md copy is the only persistent one.
5. `prompt` still defaults to the developer profile for Analysis Changes; the analyze hint saves you only if you copy it verbatim.
6. `aiRoadmap` still fires from "llm" in CLAUDE.md (assistant-instructions file, not product roadmap) — the simulated assistant had to spend judgment discarding it.
7. Profiles remain referenced but contentless in the adopted project ("Act as the architect profile" with no profiles/architect.md) — mitigated by standards+skills context, but the reference is still hollow.
8. Nothing tells the user *when* to adapt the standards' `(adapt)` lines; only the adoption tasks mention it, inside a Change nobody re-opens (see friction 1).

**Manual work observed:** writing the analysis evidence (expected — that is the assistant's job) and, in principle, the adoption evidence (not expected — see friction 1). Nothing blocked the flow.

## Risks

- Single-project validation again (Node/Next.js); detection and standards conditionals remain unexercised on non-Node stacks.
- The simulated implementation was analysis-only; a feature-implementation Change (code + tests) hasn't been driven through the loop yet.

## Recommendations

Prioritized Quick Wins (full table in the report): (1) adopt self-documents its own adoption Change and closes it — Bug/UX, low effort; (2) verify prints `Next:` — trivial, fixes the doc mismatch; (3) status context-awareness — UX, low-medium; (4) "(optional)" label for openspec in doctor — trivial; (5) Analysis Changes default to the architect profile — low; (6) compact adopt output — low-medium; (7) exclude assistant-instruction files from aiRoadmap — low; (8) ship or embed profile content — medium (Feature). Future features should come only from this list.

## Artifacts Produced

- Validation report (delivered in session with this Change).
- In the portal: fresh adoption structure, 6 standards, completed & closed `0002-analyze-current-architecture`, open `0001-adopt-aief` (left open deliberately as evidence of friction 1).

## Lessons Learned

- The 0018 seeding changed the nature of the assistant's work from discovery to confirmation — visible in how the simulated analysis was written.
- Frictions repeat until fixed: five of the eight were already known from the 0016/fresh-user validations and are still present; a validation program only pays off if its output drives the next Changes.

## Next Change

`0021-adoption-self-evidence` (top quick win): adopt documents and closes its own adoption Change; include the verify `Next:` hint and the openspec "(optional)" label as companion trivial fixes.
