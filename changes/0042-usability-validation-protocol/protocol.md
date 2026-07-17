# Deliverable 1 — Usability validation plan

> **This builds evidence. It proposes no solutions.** Per the approved direction: validate first, redesign later. Nothing about Type, Track, onboarding, commands, documentation or templates is changed by running this protocol.

## 1. The question under test

> **Can a developer who never participated in Flux Portal complete a correct change using only the main flow — with no prior AIEF training?**

The main flow is fixed: `INTAKE → CONTEXT → PLAN → IMPLEMENT → VERIFY → CLOSE`. Success is not "the framework works" (Flux Portal already proved that). Success is **the participant reaches a correct `close` without needing to learn AIEF's internal architecture.**

If a participant must understand ADRs, OpenSpec, SpecBoot, profiles, skills, the three knowledge dimensions, or the Change lifecycle *in order to start*, AIEF 2.0 has not met its goal — regardless of how the session ends.

## 2. Participant profile

| Attribute | Requirement |
|---|---|
| Role | Working software developer |
| Comfortable with | git, a terminal/CLI, using an AI coding assistant (Claude/Copilot/Cursor/Gemini) |
| **Has never** | used AIEF · read its docs · heard of OpenSpec, SpecBoot, or Flux Portal · seen a Change/evidence workflow |
| Recruited from | outside the AIEF project and outside the Flux Portal team |
| Count | **≥ 5 scored participants** + 1 pilot (6 sessions total) |
| **Experience spread (mandatory)** | the five scored participants must span experience levels — **at least one junior, at least two mid-level, at least one senior/lead**. Experience is a variable under test, not noise: a discoverability problem that blocks a junior but not a senior is still a discoverability problem |
| Diversity | mix of preferred AI assistant; at least one on Windows (the OS-install path is under scrutiny) |

**One participant is a pilot** (session 0): run the full protocol once to shake out logistics, then discard its data from the aggregate. **Five scored sessions remain.**

### Why experience level is a measured variable

The same obstacle reads differently by seniority, and the difference is the finding:

- A **senior** who finds a command fast may be *guessing from other tools' conventions* — that is discoverability by transfer, not by design. Ask, in debrief, whether they knew or guessed.
- A **junior** who stalls exposes what the product actually teaches versus what it assumes.
- If a step blocks every level equally, it is a hard product defect; if it blocks only juniors, it is an onboarding/naming defect. The consolidation ([consolidation.md](consolidation.md)) segments problems by experience level for exactly this reason.

## 3. Allowed prior knowledge

**Allowed:** general software development; git; how to use their AI assistant; how to run a shell command; how to read a README.

**Not allowed (and verified by a pre-session check, §7):** any AIEF concept, any exposure to this repository, any coaching. If a candidate already knows what a "Change" means in AIEF, they are disqualified as a fresh user and rotated to a different role.

## 4. What the participant receives

Deliberately minimal — the test is whether the product carries the rest.

1. A **target repository** with a real, scoped task (the scenario — [scenarios.md](scenarios.md)).
2. **One sentence of framing:** *"This project uses AIEF to govern changes. Use it to make the change described in TASK.md. Work as you normally would with your AI assistant."*
3. **How to obtain the tool:** the single install/invocation line, nothing more.
4. **TASK.md** in the repo describing the change to make (business terms, not AIEF terms).

They receive **no** walkthrough, no command list, no cheat-sheet, no glossary. Everything beyond the four items above is something they must **discover** — and what they discover, and fail to discover, is the measurement.

## 5. What documentation they may consult

**Anything they can find.** They may open README, any file under `docs/`, run `aief help`, ask their AI assistant, or search the web. The protocol does not restrict reading — **it records it.** Which document they open, when, why, and whether it answered them is primary data ([metrics.md](metrics.md) M-DOCS, and the problem class *excess documentation*).

The moderator never points at a document. "It's in the README" is a moderator failure, not a hint.

## 5b. The independent moderator

The moderator is designated and constrained by a dedicated charter: [moderator.md](moderator.md). In summary — they must be independent of AIEF's design, of Flux Portal, of Changes 0036–0042 and of the simplification map; and their function is limited to **deliver the task · measure times · apply the hint ladder · record observations**. They never suggest, teach, interpret or correct. That charter is binding; §6 below is its operational detail.

## 6. Moderator protocol — think-aloud, minimal intervention

- **Think-aloud.** The participant narrates what they are trying to do, what they expect, and what confuses them. The moderator prompts only with content-free nudges: *"What are you thinking?"* / *"What did you expect to happen?"*
- **Silent otherwise.** The moderator answers no questions about AIEF, gives no hints, confirms nothing.
- **The hint ladder** (used only on a *hard block* — defined below). Each rung is recorded as an escalating intervention; every rung climbed is a discoverability failure:
  1. *"What options have you considered?"* (still content-free)
  2. *"Is there anything the tool has already told you?"* (points back at output, not at an answer)
  3. Name the **category** of the next step, never the command (*"there's a step for checking the work"*).
  4. Give the command. **Session's main-flow autonomy ends here for that step** — logged as an abandonment (M-ABANDON).
- **Hard block =** 5 minutes of no progress on the same obstacle, OR the participant explicitly gives up on a step, OR they are about to damage the repo/task irrecoverably.
- **Idle time is measured, not interrupted.** When the participant stops acting because they don't know the next step, the clock (M-IDLE) runs. The moderator does **not** break an idle spell before it reaches the hard-block threshold — the idle itself is the signal. Ending it early with a hint destroys the measurement.
- **Stop condition.** The session ends at a correct `close`, at 60 minutes elapsed, or on participant request. An unfinished session is data, not a failure of the participant.

## 7. Session procedure

| Phase | Duration | What happens |
|---|---|---|
| Pre-check | 3 min | Confirm the participant meets §2–§3 (fresh user). Consent to recording. |
| Setup | 2 min | Hand over the repo + the one sentence + the install line + TASK.md. Start screen+audio recording. |
| Task | ≤ 60 min | Think-aloud. Moderator observes, fills [observation-sheet.md](observation-sheet.md) live, starts the stopwatch marks (M-T1/T2/T3). |
| Debrief | 10 min | Fixed questions ([observation-sheet.md §Debrief](observation-sheet.md)): where did you feel lost? what did you expect that wasn't there? which words confused you? what did you never understand but worked anyway? **and the mandatory closing question for every participant: "If you had to do this same task again tomorrow, what would you do differently?"** |
| Reset | 5 min | Restore the repo to its pristine state for the next participant. |

Three scenarios (bug / feature / migration) are **not** all run by every participant — that would take hours and exhaust the fresh-user effect. Assignment is in [scenarios.md §5](scenarios.md).

## 8. Recording and data

- Screen recording + audio (think-aloud) + the moderator's live observation sheet.
- The **final state of the repo** (their Changes, evidence, whatever they produced) is captured as an artifact per session.
- Terminal history is saved (which commands they actually typed — ground truth for M-CMD).
- Data is pseudonymous (P0–P4). No participant is named in the consolidation.

## 9. Ethics and validity guards

- **Consent** to recording; right to stop at any time with no reason; data deleted on request.
- **We test the product, not the person.** This is stated to the participant, twice.
- **Moderator-bias guard:** the moderator did not design AIEF and does not defend it. Ideally the moderator also did not write this protocol.
- **Novelty guard:** each participant is single-use — once they have seen AIEF, they are no longer a fresh user.
- **Observer effect:** think-aloud slightly slows people; timings are compared *between conditions*, never against an absolute stopwatch from silent use.

## 9b. Execution discipline (authorized 2026-07-17)

The study is **authorized to run**, and to run **exactly as designed**. Four binding rules govern the run:

1. **The protocol is not modified during execution** — except for operational causes, which must be documented (a tooling failure, a scheduling change, a disqualified participant). No design change to scenarios, metrics, hints or scoring mid-study.
2. **No AIEF improvement ships while sessions are pending.** The framework is frozen (ADR-015) for the study's entire duration, not just between it and the redesign. A fix "discovered" mid-study would change the product under measurement and invalidate later sessions.
3. **Every observation is recorded** — on the observation sheet, in the recording, in the terminal log. Nothing is left to memory.
4. **No single observation authorizes a change.** Individual findings are data, never mandates. Only the **complete consolidation** ([consolidation.md](consolidation.md)) may originate a new Change. Redesign begins after the evidence is whole, not before.

These rules exist so the study measures one fixed product against one fixed protocol. Changing either mid-flight turns evidence into anecdote.

## 10. What this protocol deliberately does not do

- It does not fix anything it finds. Problems are recorded and classified ([observation-sheet.md](observation-sheet.md) classes), never solved in-session or in this Change.
- It does not test AIEF's correctness, safety, or performance — only its **learnability from zero**.
- It does not compare AIEF to another tool. The baseline is the 15-minute criterion, not a competitor.
