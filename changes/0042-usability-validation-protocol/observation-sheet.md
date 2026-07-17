# Deliverable 4 — Observation sheet (per session)

> One copy per participant. The moderator fills it **live** during the session and completes it in the debrief. Pseudonym only (P0–P4). Copy the whole file for each run.

---

## Session header

| Field | Value |
|---|---|
| Participant | P_ |
| **Experience level** | junior / mid / senior-lead |
| Scenario | A / B / C |
| Repo variant | adopted / un-adopted |
| AI assistant used | Claude / Gemini / Codex / Cursor / other |
| OS | |
| Moderator | |
| Date | |
| Recording IDs | screen: ___  audio: ___  terminal-log: ___ |

## Timings (from the recording, filled after)

| Metric | Timestamp / value | Notes |
|---|---|---|
| M-T0 first `aief` command | | |
| M-T1 first Change created | | |
| M-T2 first `verify` run | | |
| M-T3 correct close | | (or: not reached) |
| M-TSTUCK longest stall | | on what obstacle |
| **M-IDLE total idle time** | | sum of "don't know the next step" spells (see idle log below) |
| Total session length | | |

### Idle log (M-IDLE — one row per idle spell)

> An idle spell = the participant takes no action because they don't know what the next step should be. Not thinking, not reading, not working — lost.

| Idle start (mm:ss) | Idle end | Duration | Where on the flow | What broke the spell (own action / hint rung) | Verbatim ("I don't know…") |
|---|---|---|---|---|---|
| | | | | | |
| | | | | | |
| **Σ M-IDLE** | | | | | |

## Event log (live — one row per notable event)

> Log every command tried, every doc opened, every decision, every confusion, every hint. Timestamp each. This is the spine of the analysis.

| t (mm:ss) | Event | Type (cmd / doc / decision / error / confusion / hint / abandon) | Verbatim think-aloud (if any) | Primary class¹ |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

¹ Primary class ∈ {discoverability, naming, excess-docs, excess-decisions, missing-automation, onboarding, other} — only for problem events.

## Command tally (from terminal history)

| Command | Found how (spontaneous / hint rung 1-4 / never) | Times used | Wrong use? |
|---|---|---|---|
| `aief` (no args) | | | |
| `aief adopt` / `init` | | | |
| `aief doctor` | | | |
| `aief new-change` | | | |
| `aief prompt` | | | |
| `aief verify` | | | |
| `aief close` | | | |
| `aief help` / `explain` | | | |
| other: ___ | | | |
| **Needed but never found** (M-CMD-MISSED): | | | |

## Documents opened (M-DOCS)

| Order | Document | Why opened | Did it answer? (Y/N) | Time spent |
|---|---|---|---|---|
| 1 | | | | |
| 2 | | | | |
| … | | | | |

## Concepts (fill during debrief)

| Concept | Used? | Needed explanation? | Participant's (mis)understanding, verbatim |
|---|---|---|---|
| Change | | | |
| evidence | | | |
| verify | | | |
| close | | | |
| adopt / init | | | |
| spec | | | |
| Type | | | |
| ADR | | | |
| OpenSpec | | | |
| SpecBoot | | | |
| profile / Role | | | |
| skill | | | |
| (other surfaced) | | | |

## Main-flow abandonments (M-ABANDON)

| t | Where on the flow (INTAKE/CONTEXT/PLAN/IMPLEMENT/VERIFY/CLOSE) | What they did instead | Hint rung, if any |
|---|---|---|---|
| | | | |

## Outcome

- [ ] Reached a **correct** close (evidence complete, gate green, scope respected)
- [ ] Reached close but **incorrect** (describe: ___)
- [ ] Did not reach close (stopped at: ___)
- [ ] Completed the work **outside** AIEF entirely (the central-finding case)

## Debrief (fixed questions — verbatim answers)

1. **Where did you feel lost or unsure what to do next?**
   >
2. **What did you expect to exist that wasn't there?**
   >
3. **Which words or labels confused you, or meant something different than you assumed?**
   >
4. **What did you do without really understanding it, but it seemed to work?**
   >
5. **What did you never figure out?**
   >
6. **If a colleague started tomorrow, what one thing would you warn them about?**
   >
7. **(mandatory, every participant) If you had to do this same task again tomorrow, what would you do differently?**
   >

## Moderator notes (bias check)

- Hints given (count by rung): 1:__ 2:__ 3:__ 4:__
- Did I (moderator) ever point at a document or answer? (should be "no"): ___
- Anything in the setup that leaked AIEF vocabulary to the participant: ___
