# Deliverable 6 — Hypotheses under test

> The falsifiable claims this study exists to test. Each has a **confirm** and a **refute** condition stated in advance, so the result cannot be argued after the fact. Most are drawn from the AIEF 2.0 study's own predictions ([the vision's laws and the audit findings]) — this protocol is where those predictions meet a fresh user instead of a spreadsheet.

## How to read a hypothesis

- **Claim:** what AIEF 2.0 predicts about a new user.
- **Confirmed if / Refuted if:** measurable conditions, decided before the sessions.
- **Source:** the finding or law it operationalizes.
- **If refuted:** what it would mean — recorded to keep the study honest, **not** a proposed fix.

---

### H1 — A new developer creates their first Change in under 5 minutes

- **Confirmed if:** median M-T1 (Scenario A) < 5 min AND no participant needed a rung-≥3 hint to create it.
- **Refuted if:** median M-T1 ≥ 5 min OR any participant could not create a Change without being told the command.
- **Source:** the 15-minute criterion; the "one door" claim.
- **If refuted:** the entry point does not lead. Likely class: onboarding or discoverability.

### H2 — The main flow completes with at most one document opened

- **Confirmed if:** median M-DOCS to reach `close` ≤ 1 (Scenario A).
- **Refuted if:** participants must open ≥ 2 documents to finish, or open docs and still fail.
- **Source:** "we don't want more documents, we want less friction"; the 7-entry-point / 90-path finding.
- **If refuted:** the flow is not self-sufficient; the CLI leans on prose. Class: excess documentation or discoverability.

### H3 — The next step is discoverable from the tool, not from docs

- **Confirmed if:** ≥ 80% of the correct-path commands are M-CMD-FOUND (spontaneous), across sessions.
- **Refuted if:** participants routinely reach commands only via hints, or never find them.
- **Source:** the central finding — *the CLI ran once because nothing told anyone to run it again*; the proposed `aief` (no-arg) next-step engine.
- **If refuted:** discoverability is the primary defect, as the audit predicted. Class: discoverability.

### H4 — A bug fix needs exactly one artifact

- **Confirmed if:** a correct Scenario-A close is reached with a single Change (evidence inside) and no `spec.md`/`tasks.md`/ADR/OpenSpec.
- **Refuted if:** participants are pushed to create ≥ 4 artifacts, or the tool blocks close without a spec for a one-line fix.
- **Source:** "minimum artifacts, smallest change = 1"; the Flux Portal spec-abandonment at Change 0008.
- **If refuted:** the artifact floor is too high; governance is disproportionate. Class: excess decisions or missing automation.

### H5 — A bug fix never requires ADR, OpenSpec, SpecBoot, profile or skill

- **Confirmed if:** M-CON-USED for Scenario A excludes all five; participants finish without encountering them.
- **Refuted if:** any of the five is forced into the bug-fix path (the tool asks, a doc requires it, close blocks on it).
- **Source:** "complexity appears only when needed"; progressive complexity.
- **If refuted:** advanced concepts leak into simple work. Class: excess decisions or naming.

### H6 — A fresh user does not run `verify` unless the tool makes them

- **Confirmed if:** without the CI gate or an explicit tool prompt, participants skip `verify` (they don't discover it, or don't see why).
- **Refuted if:** participants run `verify` spontaneously and understand its purpose.
- **Source:** F2 — *verify was built, correct, and never run*. This is F2 tested on a person who was never told the discipline.
- **If refuted (i.e. they DO run it):** F2 was an adoption artifact of Flux Portal specifically, not a general truth — an important correction to the whole redesign premise, and a point for the Law 4 debate.

### H7 — The core vocabulary is understood without external explanation

- **Confirmed if:** Change, evidence, verify, close each score M-CON-EXPLAIN = 0 across a majority of sessions.
- **Refuted if:** any core term needs looking-up or is misunderstood by a majority (e.g. "Change" read as a git commit; "close" as delete).
- **Source:** naming as a first-class problem class; the Track/Type/Role collision work.
- **If refuted:** naming is a barrier at the core, not the edges. Class: naming.

### H8 — A correct close happens in under 15 minutes

- **Confirmed if:** ≥ 3 of 4 scored participants (Scenario A) reach a correct close within 15 min, main flow only.
- **Refuted if:** the majority exceed 15 min or fail to close correctly.
- **Source:** **the success criterion of AIEF 2.0 itself.**
- **If refuted:** AIEF 2.0's stated goal is unmet at the current design — the headline result, whichever way it falls.

---

### H-DISC — Discovery via documentation is a discoverability defect *(the approved-direction hypothesis)*

> Added by project-owner decision (2026-07-17), requested as "H7". Because H7 in this list was already assigned to the vocabulary hypothesis above, this is recorded as **H-DISC** to avoid renumbering references in [consolidation.md](consolidation.md) — the identity is preserved, the label is disambiguated.

- **Claim:** *If a command or concept is discovered only after consulting documentation, a discoverability problem exists.* The main flow should surface the next step from the tool itself; needing a doc to find a step is, by definition, the tool failing to lead.
- **Confirmed if:** for any command/concept on the correct path, the participant reached it **only** after opening a document (not from `aief`/`aief help`/tool output). Each such case is logged as a discoverability problem, with the document and the step.
- **Refuted if:** every command/concept on the correct path was found from the tool's own output, with documentation used only for depth/confirmation, never as the *source* of the discovery.
- **Source:** the approved success criterion — *fewest possible external consultations*; the central audit finding that the CLI does not lead.
- **Measurement:** cross-reference M-CMD-FOUND (spontaneous, from the tool) vs discoveries traced to M-DOCS. A command in M-CMD-FOUND whose discovery event is "opened `docs/cli.md`, then ran it" counts as **doc-sourced**, i.e. confirms H-DISC.
- **If confirmed (the likely case):** discoverability is a primary defect class and the redesign's first target — but **that conclusion waits for the full consolidation**, not any single session.

This hypothesis reframes documentation from a help to a **symptom**: every time a doc was the *source* of a discovery (not merely a reference), the tool failed to lead. It is the operational form of "the fewest possible external consultations."

## Secondary hypotheses (reported, not gating)

| ID | Claim | Confirmed if |
|---|---|---|
| H9 | The migration start (C) surfaces rollback/parity/cutover *from the tool* | the participant encounters these prompted by AIEF, not from their own experience |
| H10 | `adopt`/`init` naming does not confuse | no participant hesitates over which to run, or asks the difference |
| H11 | The `spec.md` vs OpenSpec fork confuses (B) | the participant stalls or makes a blind decision at the specification step |
| H12 | Concept surplus is real | ≥ 1/3 of the concept inventory is M-CON-UNUSED across all sessions |

## What a "good" result looks like

Not "all confirmed." A study where every hypothesis is confirmed on n=4 is more likely a rigged setup than a great product. **A good result is a clear, evidenced split** — the confirmed claims tell the redesign what to keep; the refuted ones, with their problem classes, tell it where to look. The failure mode to avoid is *inconclusive*: vague timings, unlogged hints, unclassified problems. The protocol's rigor exists to make each hypothesis land on confirmed or refuted, not in between.
