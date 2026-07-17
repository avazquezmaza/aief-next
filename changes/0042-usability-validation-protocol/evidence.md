# Evidence

## Summary

A complete, runnable usability-validation protocol — six deliverables — that tests whether a fresh developer can complete a correct change using **only the main flow**, with no AIEF training. It **builds the instrument; it runs nothing and proposes nothing**. No product surface was touched.

The protocol is deliberately adversarial toward AIEF: its central scenario (a bug fix) is the exact case where the audit predicted a fresh user would either finish in one artifact or abandon AIEF entirely — and H6 puts F2 ("nobody runs verify") on trial against a person who was never taught the discipline.

## Activities Performed

1. Designed the plan: participant profile, allowed-knowledge boundary, moderator protocol (think-aloud + hint ladder), session procedure, ethics.
2. Wrote three business-language scenarios (bug / feature / migration-start) with correct paths and abandonment watch points.
3. Defined eleven+ objective metrics with exact definitions and ground-truth sources.
4. Built a per-session observation sheet and a cross-session consolidation format.
5. Stated twelve hypotheses with pre-committed confirm/refute conditions.
6. Wired the seven-class problem taxonomy through the metrics, the observation sheet and the consolidation.

## Verification

```bash
ls changes/0042-usability-validation-protocol/
#   change.md spec.md tasks.md evidence.md
#   protocol.md scenarios.md metrics.md observation-sheet.md consolidation.md hypotheses.md
node cli/bin/aief.js verify --change 0042-usability-validation-protocol   # -> PASS

# no product surface modified by this Change
git status --short cli/ docs/ templates/ AGENTS.md | grep -v "^?? changes/"   # (only pre-existing 0036/0040 work; nothing from 0042)
```

**Scope containment.** This Change created `changes/0042-usability-validation-protocol/` only. It modified no command, no template, no doc, no Type/Track code. Nothing deleted or renamed. OpenSpec and SpecBoot untouched.

## Findings

Design-time observations (the study proper produces the real findings):

| # | Observation | Why it shaped the protocol |
|---|---|---|
| **F1** | The central risk is **AIEF not being used at all** — a fresh user may just fix the code and stop | Scenario A's first abandonment watch point is "do they even use AIEF?"; the outcome sheet has an explicit "completed outside AIEF" box |
| **F2** | "Zero prior knowledge" is fragile — one leaked term contaminates a participant | Added a pre-session disqualification check and a TASK.md jargon review by a fresh reader |
| **F3** | Think-aloud distorts absolute timings | Targets are treated as hypotheses; comparisons are between conditions, never against a stopwatch |
| **F4** | A study that confirms everything on n=4 is suspect | hypotheses.md states the desired result is a **clear split**, not universal confirmation |
| **F5** | The problem taxonomy only aggregates if each problem has **one** primary class | Enforced a one-primary-class rule across all three data instruments |
| **F6** | H6 is the highest-value hypothesis: it tests whether F2 (the whole redesign's premise) generalizes beyond Flux Portal | If a fresh user runs verify spontaneously, the premise needs revising — recorded as such |

## Risks

| Risk | Severity | Mitigation |
|---|:-:|---|
| Moderator coaches / leaks hints | **High** | Silent-observer rule; hint ladder logged; bias-check box on every sheet; moderator ≠ AIEF author |
| n=4 over-read as precise rates | Med | Threats-to-validity section; systematic problems only |
| The protocol author also moderates | Med | Independence flagged as a `(review)` gate; ideally a different person runs it |
| Scenarios leak AIEF vocabulary | Med | Fresh-reader jargon check on every TASK.md before the study |
| Results get used to justify a pre-decided redesign | **High** | This Change forbids solutions; the consolidation forbids "therefore we should"; redesign is a separate, later stage |
| The study never runs | Med | The instrument is complete and self-contained; running it needs only approval + participants, not more design |

## Recommendations

*(About executing the study — not about AIEF's design, which this Change may not touch.)*

1. **Run Scenario A first and in full** before B/C. If the bug-fix flow fails the 15-minute criterion, that is the headline and the rest is secondary.
2. **Use a moderator who is neither the AIEF author nor this protocol's author.** The independence is the study's main validity asset.
3. **Recruit for the OS spread** — at least one Windows participant, since the install path is under scrutiny.
4. **Treat H6 as the pivotal result.** It tests whether the redesign's founding premise (F2) holds for a stranger.

## Artifacts Produced

| # | Deliverable | File |
|---|---|---|
| 1 | Plan | [protocol.md](protocol.md) |
| 2 | Scenarios | [scenarios.md](scenarios.md) |
| 3 | Metrics | [metrics.md](metrics.md) |
| 4 | Observation template | [observation-sheet.md](observation-sheet.md) |
| 5 | Consolidation format | [consolidation.md](consolidation.md) |
| 6 | Hypotheses | [hypotheses.md](hypotheses.md) |

## Lessons Learned

1. **The hardest part of a usability test is not letting the tool's authors help.** Half this protocol is machinery to keep the moderator silent and the participant fresh — because the failure mode of an internal study is a moderator who "just nudges."
2. **A protocol that can only confirm is not a test.** Building the "if refuted, this means…" column for every hypothesis is what makes the study capable of telling the redesign something it did not already believe.
3. **The instrument encodes the whole redesign as bets.** H1–H8 are the AIEF 2.0 vision's laws, made falsifiable. If they survive contact with four strangers, the redesign has evidence; if they don't, it has direction. Either way it stops being a spreadsheet argument.

## Extensions after approval (2026-07-17)

Approved, then extended the same day by project-owner direction:

| Addition | Where | Note |
|---|---|---|
| **Independent moderator charter** | [moderator.md](moderator.md) (deliverable 7) | 4 independence criteria (not an AIEF author, not Flux Portal, not Changes 0036–0042, not the map); function limited to deliver · measure · hint-ladder · record; never suggest/teach/interpret/correct |
| **≥ 5 scored participants, experience-spread** | protocol §2, scenarios §5, consolidation §1b | ≥1 junior, ≥2 mid, ≥1 senior. **Experience is a measured variable** — a problem that blocks only juniors is an onboarding/naming defect; one that blocks all levels is a hard product defect |
| **M-IDLE — total idle time** | metrics.md, observation-sheet idle log, consolidation | Cumulative time the participant does nothing because they don't know the next step. The purest discoverability number |
| **H-DISC** | hypotheses.md, consolidation | Doc-sourced discovery = discoverability defect. **Requested as "H7"; H7 was already taken** (vocabulary), so recorded as H-DISC with that provenance — flagged rather than silently renumbered |
| **Mandatory Q7** | observation-sheet debrief, consolidation §7b | *"If you had to do this same task again tomorrow, what would you do differently?"* — every participant |

## Freeze recorded (ADR-015)

The study now has **priority over the simplification**. Frozen until this study's consolidation exists: Candidate DELETEs (R10/R11/R13/R14), the R12 ARCHIVE, Type↔Track, onboarding, new commands, documentation simplification. Change 0038's status is marked FROZEN. **Reason:** an apparently-dead artifact can become evidence of a discoverability problem if a fresh participant reaches for it — deleting it first destroys that evidence. No AIEF change may be made from a single observation; redesign waits for the full consolidation.

## The H7 label collision — surfaced, not hidden

The approved direction named the new hypothesis "H7". This document's hypotheses list already had an H7 (core vocabulary understood without explanation), referenced by the consolidation's outcome table. Renumbering would have silently broken those references — the exact kind of quiet drift this whole programme exists to catch. So the new hypothesis is recorded as **H-DISC**, explicitly annotated "requested as H7", and added as its own consolidation row.

**Resolved (2026-07-17):** the project owner ratified keeping **H-DISC** and **not renumbering** — preserving existing references outranks a tidy numbering; the "requested as H7" annotation is sufficient. No renumber will be done.

## Next Change

**None proposed.** This Change delivers the instrument only.

The next action is a **human decision** to approve the protocol and run the study. Redesign — of Type, Track, onboarding, commands, docs or templates — begins only after the consolidation exists. Validate first, redesign later.
