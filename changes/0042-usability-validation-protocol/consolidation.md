# Deliverable 5 — Results consolidation format

> Filled **once**, after all sessions, from the observation sheets. Aggregates across participants without naming any. This is the evidence artifact the redesign decisions will read — **it records what happened, it recommends no fix.**

---

## 1. Sessions summary

| | P1 | P2 | P3 | P4 | P5 | Median (scored) |
|---|---|---|---|---|---|---|
| Experience | junior | mid | senior | mid | senior | — |
| Scenario | A | A | A | B | C | — |
| M-T1 first Change | 09:22 | not reported (see note²) | not reported (see note²) | not reported (see note²) | | |
| M-T2 first verify | 12:00 | not reported (see note²) | not reported (see note²) | not reported (see note²) | | |
| M-T3 correct close | 12:10 | 03:45 | 03:33 | ~06:30 | | |
| **M-IDLE total idle** | ~05:30 | not reported | not reported | not reported | | |
| Reached correct close? | Yes | Yes | Yes | Yes | | |
| M-DOCS opened | 8 (see note¹) | not reported | not quantified — `AGENTS.md`, `aief --help`, `aief explain`, existing `changes/`/`knowledge/` dirs (qualitative, see evidence.md) | not quantified (qualitative, see evidence.md) | | |
| M-DEC decisions | not reported | not reported | not reported | not reported | | |
| M-ERR errors | 1 (blocked `aief close` on `0001-adopt-aief`, unchecked tasks) | not reported | 0 (momentary hesitation about close order, self-resolved — §6 row 2, not an error) | 0 | | |
| M-ABANDON count | 0 | 0 | 0 | 0 (hint rung was 1–2, no content — does not count as abandonment) | | |
| M-HINT rungs (max) | 0 | 0 | 0 | 1–2 (exact rung/trigger not detailed by the moderator) | | |

*(P0 pilot excluded from all aggregates. Five scored sessions, experience-spread per [protocol.md §2](protocol.md).)*

¹ P1's M-DOCS count (8) is the moderator's reported list as given (`TASK.md`, `README.md`,
`AGENTS.md`, `knowledge/standards/*.md`, both Changes' own files, `src/app.ts`,
`test/executions.test.ts`) — not independently re-parsed against `metrics.md`'s strict
"doc/README/help files only" definition (the two source files in that list are code, not docs).
Recorded as reported; the median row should be computed once all five sessions use a
consistently-scoped count.

² P2's moderator report gave a 3-phase breakdown (Diagnóstico 0:30, Implementación 1:30,
Verificación y AIEF 1:45 = 3:45 total) rather than the checkpoint-based M-T1/M-T2 the metric
definitions call for (time to first Change existing on disk; time to first `verify`) — recorded
as `not reported` rather than forced into checkpoints that weren't actually measured that way.
Only the total (mapped to M-T3, the headline metric) is reported with confidence.

## 1b. By experience level

> The same problem may block a junior and not a senior. Segment to tell a hard product defect from an onboarding/naming one.

| | Junior | Mid | Senior/lead |
|---|---|---|---|
| Median M-T3 | 12:10 (n=1, P1) | ~05:08 (n=2, P2 03:45 + P4 06:30) | 03:33 (n=1, P3 — P5 pending) |
| Median M-IDLE | ~05:30 (n=1) | not reported | not reported |
| Median M-DOCS | 8 (n=1, see note¹) | not reported | not quantified (n=1, see §1) |
| Reached correct close (n) | 1/1 | 2/2 | 1/1 (partial — P5 pending) |
| Problems unique to this level | §6 row 1 (blocked `aief close`, resolved) | P4: one low-rung (1–2) hint, trigger not detailed (not abandonment) | §6 row 2 (momentary hesitation, self-resolved) |

- **Problems that blocked every level** (hard product defects): none so far — every §6/hint finding was resolved without reaching rung-≥3, at different levels, not the same problem recurring in the same shape.
- **Problems that blocked only juniors** (onboarding/naming): §6 row 1 (the unchecked-task block on `0001-adopt-aief`) only produced a reported friction for P1; P2 and P4 (both mid) closed the same pre-existing Change without reporting the same friction — P4 in fact named securing that close order first as his own Q7 answer, suggesting awareness rather than confusion — and P3 (senior) never even touched it. Not safe to call this onboarding-specific with 4 of 5 sessions in; revisit once P5 is in.
- **Seniors who "found" a command by *guessing from other tools*, not from AIEF** (discoverability-by-transfer, not by design): **P3, confirmed explicitly.** The moderator's own assessment: P3 navigated by transferring conventions from git/npm-style CLIs and RFC/ADR-style artifact structures, not because AIEF's flow was self-explanatory from zero. Directly relevant to H3/H7 (see §7) — a senior passing tells us less than a junior passing, per `scenarios.md`'s own framing.

## 2. The 15-minute criterion

> The single headline. Scenario A only (P1–P3, three experience levels).

- Participants who reached a **correct close within 15 minutes, main flow only, zero rung-≥3 hints:** **3 / 3** (P1 12:10, P2 03:45, P3 03:33 — all zero hints of any rung, so trivially zero rung-≥3)
- Median M-T3 (Scenario A): **03:45** (of 12:10 / 03:45 / 03:33)
- Median M-IDLE (Scenario A): not computable — only P1's is reported (~05:30); P2/P3 did not report M-IDLE separately
- **Verdict on the criterion: MET.** All three Scenario A participants reached a correct close within 15 minutes, autonomously, with zero hints of any kind.
- **Held across experience levels? Yes.** The junior (P1) made it too — slower (12:10 vs. 03:33–03:45) and with one self-resolved friction point (§6 row 1), but well inside the 15-minute bound, same as mid and senior.

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
| 1 | `aief close --yes` on the pre-existing `0001-adopt-aief` was blocked by unchecked tasks in its own `tasks.md`, with no path to that file in the error message — caused initial confusion about whether the real task could even start | discoverability | 1/5 | slowed | P1, `aief close --yes --change 0001-adopt-aief` attempt |
| 2 | Momentary hesitation about whether the pre-existing `0001-adopt-aief` had to be closed before or in parallel with a new Change for the bugfix — self-resolved on noticing `--change <id>` makes Changes independent | excess decisions | 1/5 | annoyed | P3, debrief Q1 |
| 3 | `evidence.md`'s test/verification output has to be pasted in by hand; no command infers it from a failing test or a test-runner's own output | missing automation | 2/5 (raised independently by two mid-level participants, Q7 each) | annoyed | P2 & P4, Q7 answers |
| … | | | | | |

**Class tally:**

| Class | Problem count | Sessions touched |
|---|---|---|
| discoverability | 1 | 1 (P1) |
| naming | 0 | 0 |
| excess documentation | 0 | 0 |
| excess decisions | 1 | 1 (P3) |
| missing automation | 1 | 2 (P2, P4) |
| onboarding | 0 | 0 |
| other | 0 | 0 |

## 7. Hypothesis outcomes

> Cross-reference [hypotheses.md](hypotheses.md). For each: confirmed / refuted / inconclusive, with the evidence.

| Hypothesis | Outcome | Evidence |
|---|---|---|
| H1 first Change < 5 min | **INCONCLUSIVE** | Only P1's M-T1 was reported as a separate checkpoint (09:22, already over 5 min); P2/P3's moderator reports gave phase breakdowns or a narrative, not the M-T1 checkpoint specifically — no median computable from consistent data. Zero rung-≥3 hints held for all three regardless. |
| H2 ≤ 1 doc to close | | |
| H3 next step is discoverable | | |
| H4 bug = 1 artifact | | |
| H5 no ADR/OpenSpec/SpecBoot for a bug | | |
| H6 nobody runs verify unprompted | | |
| H7 core names understood without explanation | | |
| H8 correct close < 15 min | **CONFIRMED** | 3/3 Scenario A participants (P1, P2, P3) reached a correct close within 15 min, main flow only, zero hints — hypotheses.md's exact condition ("≥3 of 3 scored participants running Scenario A"). See §2. |
| **H-DISC** doc-sourced discovery = discoverability defect | | list each doc-sourced discovery |

## 7b. "What would you do differently tomorrow?" (mandatory Q7)

> Every participant answered. Their answer names the friction they'd route around on a second run — the single most actionable signal about what the first run cost them. **Record verbatim; do not summarize into a solution.**

| Participant | Experience | Verbatim answer | Implied friction | Primary class |
|---|---|---|---|---|
| P1 | junior | **(not verbatim — moderator's paraphrase, flagged, not recorded as the participant's own words):** "indicate in the `aief close` error message the exact path of the checklist blocking it" | Error message doesn't name where to look (discoverability) | discoverability |
| P2 | mid | (verbatim, confirmed) "Sería genial que `aief new-change` pudiera inferir o autocompletar parte del `spec.md` directo desde el test que está fallando para escribir aún menos boilerplate." | Manual spec/boilerplate writing when a failing test already implies the fix | missing automation |
| P3 | senior | **(not verbatim — reported as a summary, flagged, not the participant's own words):** "would create the Change (`aief new-change`) immediately, before writing the first line of code or test, so the scaffolding guides the spec and tasks from minute zero" | Change-creation timing relative to starting the fix | onboarding |
| P4 | mid | **(not verbatim — summary/interpretation, flagged):** would secure closing the pre-existing adoption Change before instantiating the new one; add strict typing/validation for invalid `status` values (specified in `spec.md`); automate collecting test results into `evidence.md` to speed up the AIEF close cycle | Manual evidence-gathering for `evidence.md`; the adoption-Change close-order question recurring as his own reflection | missing automation |
| P5 | senior | | | |

- **Recurring "differently" across participants** (what more than one person would change): **automating `evidence.md` generation from test output** — raised independently by P2 (infer `spec.md` from a failing test) and P4 (automate collecting test results into `evidence.md`), both mid-level, both classified "missing automation." Two of four so far; revisit once P5 is in.

## 8. What this study establishes (evidence only)

- Three to five factual statements the sessions support, each with its metric.
- **No recommendations.** The sentence "therefore we should…" does not appear in this document. Redesign is the next stage; this is its input.

## 9. Threats to validity (stated honestly)

- n = 5 scored sessions (+ 1 discarded pilot). Small. Systematic problems surface; rates are indicative, not precise.
- Think-aloud slows timings; treat absolute minutes as generous, comparisons as sound.
- Scenario mix is bug-heavy by design; B and C are n=1 probes.
- Moderator/author independence: note whether the moderator was independent of the protocol author.
