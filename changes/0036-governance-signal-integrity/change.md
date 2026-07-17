# Change

## ID

`0036-governance-signal-integrity`

## Type

Implementation

## Objective

Make AIEF's **existing** governance signals trustworthy and automatic, before adding
any new capability. Three defects found by **closing** a real migration
([Flux Portal](../../docs/dogfooding-findings.md#closure-phase-findings-flux-portal-2026-07-16)):
AIEF **misread real statuses in silence** (F1), **was never executed** by the adopted
project (F2), and **classified complete evidence as an unfinished placeholder** (F3).

> **This Change adds no new capability.** F1 and F3 repair behaviour that already
> exists and answers wrongly; F2 delivers a gate for a command that already works and
> already exits non-zero. The goal is not for AIEF to detect *more* — it is for AIEF to
> **run automatically, read reality correctly, and fail loudly when it cannot determine
> the truth**.

## Why now

`aief verify` run against Flux Portal — a migration that closed **READY**, with all 13
Changes explicitly reconciled to CLOSED — reports:

- **13 of 13 Changes as open.** The status parser only recognises the exact string
  `aief close` writes; `**CLOSED**` and `> **Status: CLOSED**` both read as `false`.
- **FAIL, exit 1**, for six `spec.md` missing since Change 0008 — a correct signal that
  **existed for two days before the cutover and that nothing ever ran**.
- Two Changes with **688 and 496 lines of real evidence** as *"evidence not completed
  yet"*, because each contains three literal `Pending.` lines.

The first is the same failure class the same migration found in OpenSpec (`validate
--all` printing `4 passed` while silently skipping an entire change): **a plausible,
confident, wrong answer**. Governance that answers wrongly in silence is worse than no
governance, because it is trusted.

## Scope

### In scope

- **F1 — status parsing.** Tolerant reader for the formats humans really write
  (`## Status` + `Closed`/`**CLOSED**`, `> **Status: CLOSED …**`, with dates or trailing
  prose); reject qualified decoys (`Status (orig):`); refuse contradictory
  declarations; **error explicitly when a status is declared but not interpretable**.
- **F2 — the gate.** `aief adopt` delivers a CI workflow that runs `aief verify`;
  document the adoption mechanism, including for projects not on GitHub Actions.
- **F3 — evidence classification.** Judge the **whole** document:
  `placeholder` / `partial` / `complete`; residual `Pending.` lines in real evidence are
  normal. Route `verify`'s "Next:" hint to the correct action.
- Unit tests for F1 and F3 built from the **real** Flux Portal formats and fixtures.
- Evidence proving the before/after and that existing valid Changes still pass.

### Out of scope

- **F4** (mandatory `ADR:` / `OpenSpec:` fields) — **design only**, in
  [docs/proposals/f4-adr-openspec-declaration.md](../../docs/proposals/f4-adr-openspec-declaration.md).
  Not implemented here.
- **F5** (richer status vocabulary) and **F6** (stale-status detector) — **evidence
  only**, recorded in
  [docs/dogfooding-findings.md](../../docs/dogfooding-findings.md); n=1, deferred per
  ADR-008. F1 is a prerequisite for F6 in any case.
- Initiative · Parent-Child Changes · contract hashes · traceability parser — all
  deferred by ADR-008, untouched.
- **OpenSpec and SpecBoot** — not modified in any way.
- Any new Change state, entity, command or hidden state (ADR-009 holds: no `.aief/`).
- Unrelated refactoring.

## Success Criteria

- [x] `isClosedContent` (F1) reads **13/13** real Flux Portal Changes as closed, across
      all three real formats, and is **not** fooled by `Status (orig):`,
      `Status confirmed by …` or `*Status field added …*`.
- [x] A declared-but-uninterpretable status produces an **explicit `verify` error**,
      never a silent `false`. Contradictory declarations are an error, not a guess.
- [x] AIEF's own 36 Changes and its CI (`aief verify` on itself) keep passing —
      `Closed (2026-07-03)` must not regress.
- [x] `aief adopt` writes a CI workflow running `aief verify`; the mechanism is
      documented; it is never overwritten if present.
- [x] Demonstrated: the gate **fails** on missing artifacts (Flux Portal, exit 1) and
      **passes** on a healthy project (AIEF itself).
- [x] Flux Portal Changes 0003/0005 (688 / 496 lines, 3 `Pending.` each) classify as
      **complete**, and `verify`'s hint points to `aief close`, not `aief prompt`.
- [x] An untouched `evidenceTemplate()` still classifies as **placeholder**.
- [x] `npm test` (cli) passes, with new unit tests for F1 and F3.
- [x] No `git add` / `commit` / `push`.
