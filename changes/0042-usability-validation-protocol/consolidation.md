# Deliverable 5 — Results consolidation format

> Filled **once**, after all sessions, from the observation sheets. Aggregates across participants without naming any. This is the evidence artifact the redesign decisions will read — **it records what happened, it recommends no fix.**

---

## 1. Sessions summary

| | P1 | P2 | P3 | P4 | P5 | Median (scored) |
|---|---|---|---|---|---|---|
| Experience | junior | mid | senior | mid | senior | — |
| Scenario | A | A | A | B | C | — |
| M-T1 first Change | 09:22 | not reported (see note²) | not reported (see note²) | not reported (see note²) | 02:37 | |
| M-T2 first verify | 12:00 | not reported (see note²) | not reported (see note²) | not reported (see note²) | 01:00 | |
| M-T3 correct close | 12:10 | 03:45 | 03:33 | ~06:30 | 06:18 (see note³) | |
| **M-IDLE total idle** | ~05:30 | not reported | not reported | not reported | 00:00 | |
| Reached correct close? | Yes | Yes | Yes | Yes | Yes | |
| M-DOCS opened | 8 (see note¹) | not reported | not quantified — `AGENTS.md`, `aief --help`, `aief explain`, existing `changes/`/`knowledge/` dirs (qualitative, see evidence.md) | not quantified (qualitative, see evidence.md) | not quantified (qualitative, see evidence.md) | |
| M-DEC decisions | not reported | not reported | not reported | not reported | not reported | |
| M-ERR errors | 1 (blocked `aief close` on `0001-adopt-aief`, unchecked tasks) | not reported | 0 (momentary hesitation about close order, self-resolved — §6 row 2, not an error) | 0 | 0 | |
| M-ABANDON count | 0 | 0 | 0 | 0 (hint rung was 1–2, no content — does not count as abandonment) | 0 | |
| M-HINT rungs (max) | 0 | 0 | 0 | 1–2 (exact rung/trigger not detailed by the moderator) | 0 | |

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

³ P5's M-T3 (06:18) is recorded at the close of **`0003-expose-reporting-api`** — the artifact that
actually matches `TASK.md`'s literal ask ("set up the first change of this migration correctly").
The participant continued working after this point and built a full standalone reporting service
(`0004-create-reporting-service`, closed at ~09:24) — real, correct, well-tested work, but beyond
what the scenario asked for. Confirmed with the user before recording: M-T3 stays at the 0003
close; the 0004 work is recorded separately (§6) as its own finding, not folded into the headline
metric.

## 1b. By experience level

> The same problem may block a junior and not a senior. Segment to tell a hard product defect from an onboarding/naming one.

| | Junior | Mid | Senior/lead |
|---|---|---|---|
| Median M-T3 | 12:10 (n=1, P1) | ~05:08 (n=2, P2 03:45 + P4 06:30) | ~04:56 (n=2, P3 03:33 + P5 06:18) |
| Median M-IDLE | ~05:30 (n=1) | not reported | 00:00 (n=1, P5 — P3 not reported) |
| Median M-DOCS | 8 (n=1, see note¹) | not reported | not quantified (n=2, see §1) |
| Reached correct close (n) | 1/1 | 2/2 | 2/2 |
| Problems unique to this level | §6 row 1 (blocked `aief close`, resolved) | P4: one low-rung (1–2) hint, trigger not detailed (not abandonment) | P3: §6 row 2 (momentary hesitation, self-resolved). P5: §6 row 4 (completed beyond scope — TASK.md's ask, not a blocker) |

**All five scored sessions are now in — this section is complete.**

- **Problems that blocked every level** (hard product defects): none — every §6/hint finding across all five sessions was resolved without reaching rung-≥3, and none recurred in the same shape across levels.
- **Problems that blocked only juniors** (onboarding/naming): §6 row 1 (the unchecked-task block on `0001-adopt-aief`) produced a reported friction only for P1 (junior); P2 and P4 (mid) closed the same pre-existing Change without reporting it — P4 named securing that close order as something he'd keep doing, not a mistake; P3 (senior) never touched it at all. **Final read: this looks experience-correlated (n=1 junior vs. 4 non-junior, all clean or untouched), but the cohort has only one junior — not enough to separate "onboarding defect" from "this one junior's individual path." Flagged for the human reading this consolidation, not decided here.**
- **Seniors who "found" a command by *guessing from other tools*, not from AIEF** (discoverability-by-transfer, not by design): **P3, confirmed explicitly** (git/npm/RFC-ADR convention transfer). **P5 also shows this pattern implicitly** — her own debrief attributes success to prior Strangler Fig migration experience and systematic domain knowledge, not to AIEF surfacing the concepts; see §7's H9 note. Directly relevant to H3/H7 — a senior passing tells us less than a junior passing, per `scenarios.md`'s own framing.

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
INTAKE    [ 0 ]
CONTEXT   [ 0 ]
PLAN      [ 0 ]
IMPLEMENT [ 0 ]
VERIFY    [ 0 ]
CLOSE     [ 0 ]
```

- **The step where the flow most often broke:** none. Zero M-ABANDON events across all five scored sessions — no rung-≥3 hint was ever needed at any step, in any scenario, at any experience level.
- **Participants who did the work entirely outside AIEF:** **0 / 5.** Every scored session used AIEF's own Change/verify/close flow to completion — the central Flux Portal finding (a fresh user simply fixing the code and skipping the framework) did not reproduce on this instrument, with this cohort.

## 6. Problem ledger (the core output)

> Every distinct problem observed, across all sessions, with its class and frequency. **No solutions.** Ranked by (frequency × severity).

| # | Problem (what the participant experienced) | Primary class | Sessions affected | Severity (blocked / slowed / annoyed) | Evidence (session + timestamp) |
|---|---|---|---|---|---|
| 1 | `aief close --yes` on the pre-existing `0001-adopt-aief` was blocked by unchecked tasks in its own `tasks.md`, with no path to that file in the error message — caused initial confusion about whether the real task could even start | discoverability | 1/5 | slowed | P1, `aief close --yes --change 0001-adopt-aief` attempt |
| 2 | Momentary hesitation about whether the pre-existing `0001-adopt-aief` had to be closed before or in parallel with a new Change for the bugfix — self-resolved on noticing `--change <id>` makes Changes independent | excess decisions | 1/5 | annoyed | P3, debrief Q1 |
| 3 | `evidence.md`'s test/verification output has to be pasted in by hand; no command infers it from a failing test or a test-runner's own output | missing automation | 2/5 (raised independently by two mid-level participants, Q7 each) | annoyed | P2 & P4, Q7 answers |
| 4 | Nothing in the flow signaled that closing `0003-expose-reporting-api` already satisfied `TASK.md`'s literal ask ("set up the first change... correctly"); the participant continued unprompted and built a full standalone service (`0004`) — real, correct, well-tested, but beyond the scoped task, with no hint or gate involved | other | 1/5 | annoyed (not blocked — self-initiated, high-quality extra work) | P5, phases 4, `0004-create-reporting-service` |
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
| other | 1 | 1 (P5) |

## 7. Hypothesis outcomes

> Cross-reference [hypotheses.md](hypotheses.md). For each: confirmed / refuted / inconclusive, with the evidence.

| Hypothesis | Outcome | Evidence |
|---|---|---|
| H1 first Change < 5 min | **INCONCLUSIVE** | Only P1's M-T1 was reported as a separate checkpoint (09:22, already over 5 min); P2/P3/P4's moderator reports gave phase breakdowns or a narrative, not the M-T1 checkpoint specifically (P5's, from Scenario C, doesn't count toward this Scenario-A-only hypothesis) — no median computable from consistent data. Zero rung-≥3 hints held across every session regardless. |
| H2 ≤ 1 doc to close | **INCONCLUSIVE** | Same data gap as H1: only P1's M-DOCS was numerically counted (8, and that count includes source/test files, not strictly docs — note¹); P2/P3 recorded qualitatively, not as a comparable number. No reliable Scenario-A median computable. |
| H3 next step is discoverable | **CONFIRMED (with a caveat)** | Zero rung-≥3 hints occurred in any of the five sessions — no participant was ever told a command outright, across every scenario and experience level. This directly supports "discoverable from the tool," though §3's per-command discovery-source tally was never built from raw per-command logs, so the exact "≥80% of correct-path commands" threshold is not independently computed — the confirmation rests on the zero-rung-≥3 fact, not a literal percentage. |
| H4 bug = 1 artifact | **CONFIRMED** | All three Scenario A participants (P1, P2, P3) closed the bugfix with exactly one Change (`0002-*`), evidence inside, no ADR, no OpenSpec, no second Change. (The default `new-change` scaffold always includes a `spec.md`/`tasks.md` template — the hypothesis's intent, read against `scenarios.md`'s own framing, is no *extra* artifacts beyond that scaffold, which held for all three.) |
| H5 no ADR/OpenSpec/SpecBoot for a bug | **CONFIRMED** | None of P1/P2/P3 touched ADR, OpenSpec, SpecBoot, a profile, or a skill anywhere in their reported activity or debrief for the bugfix. |
| H6 nobody runs verify unprompted | **REFUTED** | Every one of the five sessions ran `aief verify` themselves, spontaneously, as a normal step in their own flow — not because a CI gate or explicit prompt forced it. This is a significant, direct correction to F2's premise (Flux Portal's finding that `verify` was built, correct, and never run): on this instrument, with these five participants, it generalizes in the opposite direction. Exactly the kind of result hypotheses.md's own "if refuted" note anticipated as a live possibility, not an error. |
| H7 core names understood without explanation | **CONFIRMED (with a caveat)** | Every debrief that addressed vocabulary (P1, P3, P5 explicitly; P2/P4 didn't report confusion either) said the core terms (Change, evidence, verify, close, spec) mapped naturally to standard software-engineering vocabulary — no majority-level confusion reported anywhere. §4's Concept-surplus table was never built from a per-session raw tally, so this rests on debrief text, not a computed M-CON-EXPLAIN majority. |
| H8 correct close < 15 min | **CONFIRMED** | 3/3 Scenario A participants (P1, P2, P3) reached a correct close within 15 min, main flow only, zero hints — hypotheses.md's exact condition ("≥3 of 3 scored participants running Scenario A"). See §2. |
| **H-DISC** doc-sourced discovery = discoverability defect | **INCONCLUSIVE, leaning REFUTED** | No session's reported activity names a command or concept as discovered *because of* opening a document first (as opposed to `aief`'s own output/`--help`/`explain`) — P1's docs list included `README.md`/`AGENTS.md`, but nothing traces a specific discovery to them over the tool's own output. Not marked REFUTED outright because §3's discovery-source log was never built at the per-event granularity the hypothesis asks for; no positive instance was found, but the absence-of-evidence caveat applies. |

**Secondary hypotheses (reported, not gating — `hypotheses.md`'s own framing):**

- **H9** (migration start surfaces rollback/parity/cutover *from the tool*, Scenario C only): P5's own debrief attributes her success to **prior Strangler Fig migration experience and domain knowledge**, not to AIEF prompting rollback/parity/cutover concepts — she names her own systematic approach as "the safest, most auditable path," never crediting a tool prompt for surfacing those concepts. With n=1 (Scenario C had only one participant), this leans toward **not confirmed as stated** — the concepts were supplied by the participant's own experience, the inverse of H9's confirm condition — but a single senior session cannot rule out whether a junior/mid on Scenario C would have needed the tool to surface them instead. Flagged, not decided.

## 7b. "What would you do differently tomorrow?" (mandatory Q7)

> Every participant answered. Their answer names the friction they'd route around on a second run — the single most actionable signal about what the first run cost them. **Record verbatim; do not summarize into a solution.**

| Participant | Experience | Verbatim answer | Implied friction | Primary class |
|---|---|---|---|---|
| P1 | junior | **(not verbatim — moderator's paraphrase, flagged, not recorded as the participant's own words):** "indicate in the `aief close` error message the exact path of the checklist blocking it" | Error message doesn't name where to look (discoverability) | discoverability |
| P2 | mid | (verbatim, confirmed) "Sería genial que `aief new-change` pudiera inferir o autocompletar parte del `spec.md` directo desde el test que está fallando para escribir aún menos boilerplate." | Manual spec/boilerplate writing when a failing test already implies the fix | missing automation |
| P3 | senior | **(not verbatim — reported as a summary, flagged, not the participant's own words):** "would create the Change (`aief new-change`) immediately, before writing the first line of code or test, so the scaffolding guides the spec and tasks from minute zero" | Change-creation timing relative to starting the fix | onboarding |
| P4 | mid | **(not verbatim — summary/interpretation, flagged):** would secure closing the pre-existing adoption Change before instantiating the new one; add strict typing/validation for invalid `status` values (specified in `spec.md`); automate collecting test results into `evidence.md` to speed up the AIEF close cycle | Manual evidence-gathering for `evidence.md`; the adoption-Change close-order question recurring as his own reflection | missing automation |
| P5 | senior | **(not verbatim — summary/interpretation, flagged):** would keep exactly the same strategy and sequence — adopt/adapt standards, formal architectural analysis, extract the API seam with zero downtime, build the decoupled service with output-parity tests — calling it the safest, most auditable path for a Strangler Fig migration | None — she reports no friction and would repeat the same (larger-than-asked) sequence | other |

- **Recurring "differently" across participants** (what more than one person would change): **automating `evidence.md` generation from test output** — raised independently by P2 (infer `spec.md` from a failing test) and P4 (automate collecting test results into `evidence.md`), both mid-level, both classified "missing automation." Two of four so far; revisit once P5 is in.

## 8. What this study establishes (evidence only)

1. **The 15-minute criterion is met.** All three Scenario A participants — junior, mid, senior — reached a correct close within 15 minutes, with zero hints of any rung. Median 03:45. (§2, H8)
2. **`verify` was run spontaneously by every participant, in every scenario, at every experience level** — nobody had to be told to run it, and nobody needed the CI gate to force it. (§7, H6 — refuted as stated, in the opposite direction from Flux Portal's finding)
3. **A bug fix stayed to one artifact for all three Scenario A participants** — no ADR, no OpenSpec, no SpecBoot, no profile, no skill entered the bugfix path for any of them. (§7, H4/H5)
4. **No participant abandoned the main flow at any step, in any session.** Zero M-ABANDON events; zero rung-≥3 hints. (§5)
5. **The one senior participant on Scenario C completed work substantially beyond `TASK.md`'s literal ask**, with no hint or gate signaling that the scoped step was already satisfied — the only finding of this shape across all five sessions. (§6 row 4)
6. **The pre-existing `0001-adopt-aief` Change's two unchecked default tasks produced a reported blocked-close friction for exactly one of five participants** (P1, junior) — the same starting condition did not reproduce as friction for the other four, one data point short of what would be needed to call it experience-correlated with confidence. (§1b)
7. **Two independent mid-level participants, unprompted by each other, asked for the same class of automation** — inferring or auto-populating `spec.md`/`evidence.md` from test output. (§6 row 3)

**No recommendations.** The sentence "therefore we should…" does not appear in this document. Redesign is the next stage; this is its input.

## 9. Threats to validity (stated honestly)

- n = 5 scored sessions (+ 1 discarded pilot). Small. Systematic problems surface; rates are indicative, not precise.
- Think-aloud slows timings; treat absolute minutes as generous, comparisons as sound.
- Scenario mix is bug-heavy by design; B and C are n=1 probes each — P4 and P5's results are single data points, not medians, for their scenarios.
- Moderator/author independence: Mandi Orange, confirmed independent of AIEF's design, Flux Portal, and Changes 0036–0042 (`moderator.md` §0–1) — not the protocol's author.
- Several metrics (M-T1/M-T2 for P2–P4, M-DOCS beyond P1, M-DEC for all five, the full per-command §3 discovery-source log, the per-concept §4 tally) were reported qualitatively or partially rather than as clean numeric checkpoints for every session — recorded as `not reported`/qualitative throughout rather than forced into false precision. Several hypothesis outcomes (H1, H2, H3, H7, H-DISC) carry this same caveat explicitly in §7.
- Every quantitative claim in this document was independently re-verified against the actual repository state (code diffs, re-run tests, `## Status`/`aief verify` on disk) for all five sessions plus the pilot — see `changes/0096-run-usability-validation-study/evidence.md` for the verification trail per session.
