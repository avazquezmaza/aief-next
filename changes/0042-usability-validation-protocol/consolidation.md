# Deliverable 5 — Results consolidation format

> Filled **once**, after all sessions, from the observation sheets. Aggregates across participants without naming any. This is the evidence artifact the redesign decisions will read — **it records what happened, it recommends no fix.**

---

## 1. Sessions summary

| | P1 | P2 | P3 | P4 | P5 | Median (scored) |
|---|---|---|---|---|---|---|
| Experience | junior | mid | senior | mid | senior | — |
| Scenario | A | A | A | B | C | — |
| M-T1 first Change | | | | | | |
| M-T2 first verify | | | | | | |
| M-T3 correct close | | | | | | |
| **M-IDLE total idle** | | | | | | |
| Reached correct close? | | | | | | |
| M-DOCS opened | | | | | | |
| M-DEC decisions | | | | | | |
| M-ERR errors | | | | | | |
| M-ABANDON count | | | | | | |
| M-HINT rungs (max) | | | | | | |

*(P0 pilot excluded from all aggregates. Five scored sessions, experience-spread per [protocol.md §2](protocol.md).)*

## 1b. By experience level

> The same problem may block a junior and not a senior. Segment to tell a hard product defect from an onboarding/naming one.

| | Junior | Mid | Senior/lead |
|---|---|---|---|
| Median M-T3 | | | |
| Median M-IDLE | | | |
| Median M-DOCS | | | |
| Reached correct close (n) | | | |
| Problems unique to this level | | | |

- **Problems that blocked every level** (hard product defects): ___
- **Problems that blocked only juniors** (onboarding/naming): ___
- **Seniors who "found" a command by *guessing from other tools*, not from AIEF** (discoverability-by-transfer, not by design): ___

## 2. The 15-minute criterion

> The single headline. Scenario A only (P1–P3, three experience levels).

- Participants who reached a **correct close within 15 minutes, main flow only, zero rung-≥3 hints:** __ / 3
- Median M-T3 (Scenario A): __ min
- Median M-IDLE (Scenario A): __ min (__ % of M-T3)
- **Verdict on the criterion:** met / not met / partially — *stated as fact, not excused.*
- **Held across experience levels?** did the junior also make it, or only the senior? ___

## 3. Discovery aggregate

| Command | Found spontaneously (of N who needed it) | Only via hint | Never found |
|---|---|---|---|
| `aief` (no args) | | | |
| `new-change` | | | |
| `verify` | | | |
| `close` | | | |
| `prompt` | | | |
| … | | | |

- **Commands no participant discovered unaided:** ___
- **Commands every participant found:** ___
- **The single hardest step to discover:** ___ (where the most hint rungs were climbed, and the most M-IDLE accumulated)
- **Discoveries that came from a document, not the tool (H-DISC):** list each — command/concept, the doc that was its source, the session. Every entry is a discoverability defect.
- **Total idle time across sessions (Σ M-IDLE), and the flow step that accumulated the most:** ___

## 4. Concept surplus

| Concept | Used by (n) | Needed explanation (n) | Never touched (n) |
|---|---|---|---|
| Change | | | |
| evidence | | | |
| verify / close | | | |
| spec / tasks | | | |
| Type | | | |
| ADR | | | |
| OpenSpec | | | |
| SpecBoot | | | |
| profile / Role | | | |
| skill | | | |

- **Concepts no participant used** (candidate surplus for the redesign to consider — *not decided here*): ___
- **Concepts that needed external explanation to a majority** (naming/onboarding risk): ___

## 5. Abandonment map

Plot every M-ABANDON on the flow. Count per step:

```text
INTAKE    [   ]
CONTEXT   [   ]
PLAN      [   ]
IMPLEMENT [   ]
VERIFY    [   ]
CLOSE     [   ]
```

- **The step where the flow most often broke:** ___
- **Participants who did the work entirely outside AIEF:** __ / __ (the central Flux Portal finding, on fresh users)

## 6. Problem ledger (the core output)

> Every distinct problem observed, across all sessions, with its class and frequency. **No solutions.** Ranked by (frequency × severity).

| # | Problem (what the participant experienced) | Primary class | Sessions affected | Severity (blocked / slowed / annoyed) | Evidence (session + timestamp) |
|---|---|---|---|---|---|
| 1 | | | /4 | | |
| 2 | | | /4 | | |
| 3 | | | /4 | | |
| … | | | | | |

**Class tally:**

| Class | Problem count | Sessions touched |
|---|---|---|
| discoverability | | |
| naming | | |
| excess documentation | | |
| excess decisions | | |
| missing automation | | |
| onboarding | | |
| other | | |

## 7. Hypothesis outcomes

> Cross-reference [hypotheses.md](hypotheses.md). For each: confirmed / refuted / inconclusive, with the evidence.

| Hypothesis | Outcome | Evidence |
|---|---|---|
| H1 first Change < 5 min | | |
| H2 ≤ 1 doc to close | | |
| H3 next step is discoverable | | |
| H4 bug = 1 artifact | | |
| H5 no ADR/OpenSpec/SpecBoot for a bug | | |
| H6 nobody runs verify unprompted | | |
| H7 core names understood without explanation | | |
| H8 correct close < 15 min | | |
| **H-DISC** doc-sourced discovery = discoverability defect | | list each doc-sourced discovery |

## 7b. "What would you do differently tomorrow?" (mandatory Q7)

> Every participant answered. Their answer names the friction they'd route around on a second run — the single most actionable signal about what the first run cost them. **Record verbatim; do not summarize into a solution.**

| Participant | Experience | Verbatim answer | Implied friction | Primary class |
|---|---|---|---|---|
| P1 | junior | | | |
| P2 | mid | | | |
| P3 | senior | | | |
| P4 | mid | | | |
| P5 | senior | | | |

- **Recurring "differently" across participants** (what more than one person would change): ___

## 8. What this study establishes (evidence only)

- Three to five factual statements the sessions support, each with its metric.
- **No recommendations.** The sentence "therefore we should…" does not appear in this document. Redesign is the next stage; this is its input.

## 9. Threats to validity (stated honestly)

- n = 4 scored sessions. Small. Systematic problems surface; rates are indicative, not precise.
- Think-aloud slows timings; treat absolute minutes as generous, comparisons as sound.
- Scenario mix is bug-heavy by design; B and C are n=1 probes.
- Moderator/author independence: note whether the moderator was independent of the protocol author.
