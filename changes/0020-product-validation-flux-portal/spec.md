# Specification

## Goal

A prioritized, evidence-backed list of improvements derived from real first-time-user adoption of Flux Portal — the sole source for future AIEF features.

## Requirements

- Fresh start: portal carries no prior AIEF structure before the run.
- Execute: doctor → adopt → verify → analyze → prompt → simulated implementation (Analysis evidence completed by the assistant role) → verify → close --yes.
- Per step record: strengths, user expectations, manual work, automation candidates, missing docs, redundant info.
- Report includes Executive Summary (overall experience, time to first useful prompt, top frictions), step-by-step, and Quick Wins with problem / impact / effort / priority.
- No product changes of any kind.

## Acceptance Criteria

- [ ] Full flow completed on the real project, including governance close.
- [ ] Validation report delivered with all required sections.
- [ ] Quick Wins prioritized with problem/impact/effort/priority.
- [ ] `git diff` in aief-next touches only changes/0020-*.
- [ ] Evidence updated; Change closed via `aief close --yes`.
