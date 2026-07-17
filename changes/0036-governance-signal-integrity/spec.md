# Specification

## Goal

AIEF must **read the truth of a real repository correctly, run without being asked, and
fail loudly when it cannot decide** — using only the capabilities it already has.

## Requirements

### F1 — Status parsing

- **R1.1** A Change's status SHALL be read from a **declaration**, in either form:
  - heading: `## Status` followed by the first non-empty line;
  - inline/blockquote: a line whose label is exactly `Status` followed by `:`
    (optionally wrapped in emphasis), e.g. `> **Status: CLOSED (2026-07-16).**`.
- **R1.2** The value SHALL be read tolerantly: surrounding emphasis (`**`, `*`, `_`,
  backticks), blockquote markers, dates and trailing prose SHALL NOT prevent
  recognition. `Closed (2026-07-03)`, `**CLOSED** (2026-07-11; label normalized)`,
  `CLOSED · ARCHIVED (reconciled 2026-07-16).` and
  `CLOSED — CUTOVER EXECUTED, ROLLBACK REHEARSED (2026-07-16).` SHALL all read as closed.
- **R1.3** A **qualified** label SHALL NOT be treated as the status: `Status (orig):`,
  `Status confirmed by …`, `Status field added …`. Only an unqualified `Status:` (or the
  `## Status` heading) declares status.
- **R1.4** Recognition SHALL be **unambiguous**. If two or more unqualified declarations
  disagree, the result SHALL be `unknown` — never "first wins", never a guess.
- **R1.5** A status **declared but not interpretable** SHALL yield `unknown`, and
  `aief verify` SHALL report it as an **explicit error** naming the raw value. Silence is
  forbidden.
- **R1.6** **Absence** of any declaration SHALL remain `open` (not an error) — AIEF's own
  Changes 0001–0012 have no `## Status` and must keep passing.
- **R1.7** The vocabulary SHALL remain **binary in meaning** (`closed` vs `open`); F5
  (ARCHIVED/SUPERSEDED as distinct states) is out of scope. A token leading with
  `CLOSED` is closed, including `CLOSED · ARCHIVED`.

### F2 — The gate

- **R2.1** `aief adopt` SHALL write a CI workflow that runs `aief verify`, and SHALL
  record it as an adoption artifact.
- **R2.2** It SHALL NOT overwrite an existing workflow file (adoption never overwrites —
  the existing guarantee holds).
- **R2.3** It SHALL introduce **no new core capability**: `aief verify` already exits
  non-zero on FAIL. Only a workflow file and documentation are added.
- **R2.4** The adoption mechanism SHALL be documented, **including projects not using
  GitHub Actions** (the gate is one command; the workflow is a convenience).
- **R2.5** It SHALL be demonstrated that the gate **fails** on Flux Portal (missing
  `spec.md` since Change 0008) and **passes** on a healthy project.

### F3 — Evidence classification

- **R3.1** Evidence SHALL be classified over the **whole document**, not by counting
  placeholders in isolation: `placeholder` · `partial` · `complete`.
- **R3.2** `placeholder` SHALL mean *untouched template* — placeholders with no
  substantive content. An unedited `evidenceTemplate()` SHALL classify as `placeholder`.
- **R3.3** `complete` SHALL tolerate **residual** `Pending.` lines. A 688-line
  `evidence.md` containing three of them is **complete**, not a placeholder.
- **R3.4** `partial` SHALL mean placeholders still dominate real content.
- **R3.5** `aief verify`'s **"Next:" hint** SHALL follow the classification: `complete` →
  `aief close`; otherwise → `aief prompt`.
- **R3.6** `aief close` readiness SHALL block only when evidence is **not** `complete`,
  preserving the safety property while removing the false positive.

### Compatibility

- **R4.1** AIEF's own 36 Changes SHALL keep verifying; its CI (`aief verify` on itself)
  SHALL keep passing.
- **R4.2** `markClosed()`'s written format (`## Status` + `Closed (date)`) SHALL keep
  round-tripping.
- **R4.3** `loadChange().closed` and `.evidencePlaceholder` SHALL remain available for
  existing callers.

## Acceptance Criteria

- [x] **Scenario — real closed formats.** Each of the 13 Flux Portal `change.md` files
      reads as **closed**. Before: 0/13. After: 13/13.
- [x] **Scenario — decoys.** A file containing `> **Status: CLOSED …**` *and*
      `> **Status (orig): IN PROGRESS …**` (Flux 0011, verbatim) reads as **closed** —
      the qualified label is ignored, not merged.
- [x] **Scenario — AIEF's own format.** `## Status` + `Closed (2026-07-03)` reads as
      **closed** (regression).
- [x] **Scenario — no status.** A Change with no status section reads as **open**, with
      no error (regression: AIEF Changes 0001–0012).
- [x] **Scenario — uninterpretable.** `## Status` + `Bananas` yields `unknown` and
      `verify` prints an **error** quoting the raw value; the run FAILs.
- [x] **Scenario — contradiction.** Two unqualified declarations, one `CLOSED` and one
      `OPEN`, yield `unknown` and an explicit error.
- [x] **Scenario — complete evidence with residual pendings.** Fixtures derived from
      Flux 0003 and 0005 classify as **complete**; hint → `aief close`; `close` is not
      blocked.
- [x] **Scenario — untouched template.** `evidenceTemplate()` classifies as
      **placeholder**; hint → `aief prompt`; `close` is blocked.
- [x] **Scenario — the gate.** `aief adopt` on a scratch project writes the workflow;
      re-running does not overwrite it; `aief verify` exits 1 on Flux Portal and 0 on a
      healthy project.
- [x] `npm test` in `cli/` passes, including the new F1/F3 tests.

## Open Questions

None blocking. Two are deliberately **not** answered here and are recorded as deferred
evidence in [docs/dogfooding-findings.md](../../docs/dogfooding-findings.md):

- whether `ARCHIVED` / `SUPERSEDED` become real states (**F5**);
- whether staleness is detected mechanically (**F6**) — which needs F1 first.
