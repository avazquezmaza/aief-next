# AIEF 1.0 Readiness

The path from the current internal pilot to a declared 1.0.

---

## Current status: pre-1.0 internal pilot

**AIEF 1.0 is not declared.**

AIEF has completed one greenfield and one brownfield validation (see [docs/VALIDATION-SUMMARY.md](VALIDATION-SUMMARY.md)) and is approved for **guided internal use, brownfield discovery, greenfield validation and developer-team pilots**. It is **not** approved for unsupervised delegated implementation, autonomous assistant execution, or external publication as a stable 1.0.

The validations proved the thesis (evidence-gated workflow orchestration) and the parts work. What blocks 1.0 is the **seams between commands**, grouped into the Workflow Cohesion workstreams below.

---

## Conditions required before declaring 1.0

1. All four **Workflow Cohesion fixes** (below) implemented and their Changes closed under the closability contract itself.
2. Both validations **re-run** — greenfield and brownfield — with **no manual seam-bridging** (no empty specs, no store reconciliation by hand, no raw copy/paste to get a usable prompt).
3. **No regression** on the non-negotiables: still zero destructive actions; no hidden state; AGENTS.md remains highest authority; AIEF stays assistant-agnostic.
4. Team-usage docs updated to reflect the cohesive workflow.
5. Explicit owner **Go** decision recorded.

## Required Workflow Cohesion fixes

Only these four workstreams gate 1.0. Everything else is deferred (see [docs/ROADMAP-TO-1.0.md](ROADMAP-TO-1.0.md)).

| # | Workstream | Closes friction |
|---|---|---|
| 1 | **Unified Change identity** | Disconnected stores, silent duplicates, confusing active-Change selection |
| 2 | **Context flow (analyze → Change → prompt)** | Detected context lost between commands; empty scaffolds |
| 3 | **Prompt reality consistency** | Prompts reference missing files; manual copy/paste execution |
| 4 | **Closability / verify contract** | No machine gate for evidence completeness, scope containment, risk reconciliation |

## Definition of Done for 1.0

1.0 is done when **all** of the following are true, verified by evidence, not assertion:

- [ ] Unified Change identity: one canonical Change ID and one store; duplicate creation is refused (overridable, logged); `aief status` names the active Change unambiguously.
- [ ] Context flow: on a repo with a prior `analyze`, `new-change` seeds from detected context and the prompt names the detected stack — no manual re-entry of known facts.
- [ ] Prompt reality consistency: the prompt renders only artifacts `doctor` confirms exist (honest fallback otherwise); at least one assistant can consume the prompt without manual clipboard work.
- [ ] Closability contract: a Change missing declared evidence cannot close silently; `verify` reports evidence completeness, files-touched-vs-scope, and open unreconciled risks; the verify report is a plain visible file.
- [ ] Greenfield re-validation passes with no manual seam-bridging.
- [ ] Brownfield re-validation passes: detected context is present in the worked Change and prompt; duplicate creation refused; close blocked until the evidence contract is met.
- [ ] Zero silent operations: every refusal, fallback and staleness condition is loud and visible.
- [ ] No destructive-action regression on the brownfield repo.
- [ ] Team-usage docs updated; owner records the Go decision.

## Go / No-Go criteria

**Go for 1.0** only when every DoD box above is checked **and** both re-validations pass without human seam-bridging.

**No-Go** — hold at pre-1.0 pilot — if **any** of these is true:
- Any Workflow Cohesion workstream is incomplete or unvalidated.
- Either re-validation still requires manual store reconciliation, empty-scaffold fixes, or copy/paste to make the prompt usable.
- Any regression in safety (a destructive action), hidden state, or assistant-agnosticism.
- The closability gate can be bypassed silently.

## Explicit statement

**AIEF 1.0 is not declared and this document does not declare it.** AIEF is a pre-1.0 internal pilot. No external production readiness is claimed. 1.0 will be declared only after the Definition of Done above is fully met and the owner records an explicit Go.
