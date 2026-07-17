# Deliverable 3 — Metrics

> Objective, each with an exact definition and a measurement method. A metric that two observers would score differently is not on this list.

## Reading the table

- **How measured:** the ground-truth source. Timings come from the screen recording + terminal timestamps, not the moderator's memory.
- **Target:** the value AIEF 2.0 aims for. **These are hypotheses to test ([hypotheses.md](hypotheses.md)), not pass/fail bars** — a miss is a finding, not a failure of the study.

## Time metrics (per session, from the recording)

| ID | Metric | Definition — clock starts at handover (t=0) | How measured | Target |
|---|---|---|---|---|
| **M-T1** | Time to first Change | t=0 → a Change directory exists on disk | terminal + filesystem timestamp | **< 5 min** |
| **M-T2** | Time to first `verify` | t=0 → `aief verify` (or equivalent gate) runs, whatever its result | terminal history | **< 12 min** |
| **M-T3** | Time to correct close | t=0 → a Change is correctly closed (evidence complete, gate green) | terminal + repo final state | **< 15 min** (Scenario A) |
| **M-T0** | Time to first AIEF command | t=0 → the first `aief …` invocation | terminal history | reported, no target |
| **M-TSTUCK** | Longest single stall | max continuous time on one obstacle with no progress | recording | reported |
| **M-IDLE** | **Total idle time** | **cumulative time during which the participant takes no action because they do not know what the next step should be.** Sum of all such spells across the session (M-TSTUCK is the single longest; M-IDLE is the total) | recording: mark idle-start when action stops and the think-aloud reveals "I don't know what to do next"; idle-end at the next deliberate action or hint | **as low as possible; reported per session and as a % of M-T3** |

`M-T3` is the headline: it is the 15-minute criterion made measurable. For B and C, `M-T3` is reported without a target (those tasks are not the 15-minute claim).

**M-IDLE is the purest discoverability number.** Time lost to *not knowing the next step* — distinct from time spent thinking, reading, or doing the work — is exactly what the main flow is supposed to eliminate. A high M-IDLE with a low error count means the participant wasn't wrong, just lost. Idle spells are not interrupted before the hard-block threshold ([protocol.md §6](protocol.md)); the idle is the measurement.

## Count metrics (per session)

| ID | Metric | Definition | How measured |
|---|---|---|---|
| **M-DOCS** | Documents opened | distinct doc/README/help files the participant opens | recording; list each, in order |
| **M-DOCS-Q** | Documents that answered | of those, how many resolved the question they opened it for | recording + think-aloud |
| **M-DEC** | Decisions taken | distinct points where the participant had to choose (which command, which artifact, whether to write a spec, which assistant, etc.) | observation sheet, logged live |
| **M-DEC-BLIND** | Blind decisions | of those, how many they made without understanding the options | think-aloud ("I'll just pick this, not sure why") |
| **M-ERR** | Errors | actions that produced a wrong result, an error message, or an undo | recording; each tagged with M-ERR-TYPE |
| **M-ABANDON** | Main-flow abandonments | times the participant left `INTAKE→…→CLOSE` — a hint-ladder rung ≥3, a detour into internals, or doing the work outside AIEF | observation sheet, per event with location |
| **M-HINT** | Hint-ladder rungs climbed | total interventions by rung (1–4) | observation sheet |

## Discovery metrics (per session, aggregated across sessions)

| ID | Metric | Definition | How measured |
|---|---|---|---|
| **M-CMD-FOUND** | Commands discovered spontaneously | AIEF commands the participant found and used **without** a hint | terminal history vs hint log |
| **M-CMD-HINTED** | Commands reached only via hint | commands used only after a rung-3/4 intervention | hint log |
| **M-CMD-MISSED** | Commands never found | commands the scenario's correct path needed but the participant never located | correct-path (scenarios.md) minus terminal history |
| **M-CMD-WRONG** | Wrong commands tried | invocations of non-existent or misapplied commands | terminal history |

## Concept metrics (per session, aggregated)

| ID | Metric | Definition | How measured |
|---|---|---|---|
| **M-CON-EXPLAIN** | Concepts needing external explanation | AIEF concepts the participant had to look up, ask the assistant about, or that the debrief reveals they never grasped | think-aloud + debrief |
| **M-CON-USED** | Concepts actually used | AIEF concepts that appeared in the participant's successful path | recording |
| **M-CON-UNUSED** | Concepts never touched | AIEF concepts present in the product that never entered the session at all | recording vs the concept inventory below |

**Concept inventory** (the checklist for M-CON-*): Change · evidence · verify · close · adopt/init · Track · Type · spec · tasks · ADR · OpenSpec · SpecBoot · profile/Role · skill · standard · Requirement Source · the 3 levels · governance conventions · human/review gates.

## Problem classification (applied to every observed problem)

Every problem logged on the observation sheet is tagged with **exactly one** primary class (the user's required taxonomy):

| Class | Meaning | Signature in the data |
|---|---|---|
| **discoverability** | the capability exists but the participant couldn't find it | M-CMD-MISSED, hint rung ≥3, "I didn't know that existed" |
| **naming** | a word meant something different to the participant than to AIEF | M-CON-EXPLAIN, "I thought Change meant a git commit" |
| **excess documentation** | too much to read, or the answer buried across many docs | M-DOCS high, M-DOCS-Q low |
| **excess decisions** | the participant was forced to choose where they shouldn't have to | M-DEC high, M-DEC-BLIND > 0 |
| **missing automation** | the participant did by hand what the tool could have done | observation, "why do I have to write this myself?" |
| **onboarding** | the participant couldn't get started / find the entry point | high M-T1, wrong first command, opened ≥3 docs before acting |
| **other** | anything the six classes don't fit | free text; if this class fills up, the taxonomy is wrong |

A problem may have **secondary** tags, but exactly one primary — otherwise aggregation across sessions is meaningless.

## Derived, cross-session figures (in the consolidation)

- **Discoverability rate** = M-CMD-FOUND / (needed commands). Low = the CLI doesn't lead.
- **Doc dependence** = median M-DOCS to reach `close`. The 15-min goal implies this trends toward 0–1.
- **Decision load** = median M-DEC before first Change. The "one question" goal implies ~1–2.
- **Concept surplus** = |M-CON-UNUSED| / |inventory|. High = the product carries concepts users never need — the surface the redesign should shed.
- **Abandonment map** = every M-ABANDON location, plotted on the 6-step flow. Clusters name where the flow breaks.
