# Deliverable 7 — Independent moderator designation

> Added by project-owner decision (2026-07-17). The study's validity rests on the moderator being independent and strictly passive. This charter defines the role; **a human must be named into it** — this document specifies *who qualifies* and *what they may do*, not a person.

## 1. Independence criteria (all mandatory)

The moderator **must not have participated in**:

- the design of AIEF (not an author of the framework, its CLI, its docs, or its ADRs);
- Flux Portal (`trk-orchestrator-portal`) in any role;
- Changes **0036–0042** (this entire stabilization + redesign-study arc);
- the simplification map or either DELETE review.

A candidate who fails any one criterion is disqualified. Independence is not a preference here — a moderator who helped build AIEF cannot un-know where the commands are, and will leak that knowledge through timing, phrasing, or the involuntary nudge.

**Ideal (not mandatory):** the moderator is also not the author of this protocol. If the same person must both write and run it, that dependency is recorded on every observation sheet's bias-check line.

## 2. The moderator's function — exhaustively

The moderator does **only** these four things:

1. **Deliver the task.** Hand over the repo, the one sentence of framing, the install line, and TASK.md ([protocol.md §4](protocol.md)). Nothing more.
2. **Measure times.** Start the clock at handover; capture M-T0/T1/T2/T3, M-IDLE, M-TSTUCK from the recording and terminal log.
3. **Apply the hint ladder.** Only on a hard block, only by the defined rungs ([protocol.md §6](protocol.md)), logging each rung. The ladder is the *only* channel through which the moderator may respond to being stuck.
4. **Record observations.** Fill the observation sheet live and complete it at debrief.

## 3. The moderator must never — exhaustively

| Forbidden | Because |
|---|---|
| **Suggest** | "Have you tried `verify`?" hands the participant a discovery that was supposed to be measured |
| **Teach** | Explaining a concept erases the M-CON-EXPLAIN signal |
| **Interpret** | "I think what you mean is…" substitutes the moderator's mental model for the participant's — corrupting the naming data |
| **Correct** | Letting a wrong path run to its natural end is the data; steering to the right one deletes it |
| Point at a document | "It's in the README" is the exact discoverability failure the study exists to detect |
| Confirm or deny | A nod is a hint. Silence is the instrument |
| React to errors | An error the participant doesn't notice is a finding; flagging it removes it |

**The rule in one line:** the moderator's job is to make the session *happen* and *be recorded* — never to make it *succeed*. A session that fails because the product failed is the study working, not the moderator failing.

## 4. When the moderator is unsure

If the moderator is tempted to help — the participant is visibly frustrated, or about to "waste" the session — the correct action is the hint ladder, nothing outside it. The discomfort of watching someone struggle is the study's most valuable and most endangered signal. **The moderator's restraint is the measurement.**

If a genuinely unanticipated situation arises (a tooling crash, an ambiguous TASK.md, a participant who realizes they know AIEF), the moderator **pauses and notes it** — they do not improvise a fix that alters the conditions. Anomalies are recorded and the session may be discarded, never silently repaired.

## 5. Accountability

- Every observation sheet carries a moderator bias-check ([observation-sheet.md §Moderator notes](observation-sheet.md)): hints given by rung, and an explicit "did I point at a doc or answer? (should be no)".
- If two or more sessions show rung-4 interventions on the *same* step, that is flagged as a probable moderator or protocol defect, not only a product defect, and reviewed before continuing.
- The moderator does not analyze the results or propose redesigns. Delivering the raw sheets is where their role ends.
