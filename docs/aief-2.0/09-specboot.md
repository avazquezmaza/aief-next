# 9 · Relationship with SpecBoot

> Deliverable 10. **SpecBoot is not modified.** This document says how AIEF should lean on it.

## 1. The rule

> **SpecBoot creates. AIEF guides. OpenSpec validates.**

Three verbs, three tools, no overlap. The brief states it; the audit explains why it hasn't been true.

## 2. What went wrong

[ADR-003](../../knowledge/decisions.md) said: adopt SpecBoot's *concepts*, never copy its files — copying creates a fork to maintain. Correct decision. What happened next was subtler than a violation, and worse:

**AIEF re-implemented the concept.** `aief adopt` writes 6 standards templates of AIEF's own making. Not copied from SpecBoot — *reinvented*. ADR-003's letter was honored; its spirit was not.

The result, measured on the only real adoption:

```bash
cd trk-orchestrator-portal
ls knowledge/standards/                          # -> 6 files, created by adopt
git log --diff-filter=M -- knowledge/standards/  # -> (empty)
```

**Six files created. Zero ever edited.** The adoption Change's task — *"Edit knowledge/standards/ so the (adapt) lines match this project"* — was never done. `docs/VALIDATION-SUMMARY.md` had already smelled it and written it down: *"SpecBoot appeared as copied template residue, not a live standards provider."*

The reason is structural, not lazy: **a template AIEF wrote about a project AIEF doesn't know is generic by construction.** It arrives as homework. Nobody does homework a tool assigned itself. SpecBoot's standards are not better templates — they are a *provider*, which is a different kind of thing.

## 3. The proposed division

| | SpecBoot | AIEF |
|---|---|---|
| **Verb** | Creates | Guides |
| **When** | Day 0, once | Every day, forever |
| **Owns** | Instruction scaffolding, project standards, the instruction hierarchy | The Change, evidence, closure, orchestration |
| **Artifact** | `AGENTS.md`, assistant files, standards | `changes/<id>/`, the gate |
| **Posture** | AIEF **invokes** it (or documents how) | — |
| **AIEF must never** | Re-implement it, vendor it, or require it | — |

### Concretely

- **`aief adopt` stops writing standards it invented.** It detects SpecBoot, invokes it, or tells the human plainly: *"Standards: none. SpecBoot generates these — or write your own. AIEF will not pretend to know your project."*
- **`AGENTS.md` gets one version.** The audit found [4 divergent copies](02-current-map.md#6-duplication), and the adopted project receives the 14-line stub — the worst one. Whether the canonical version comes from SpecBoot or AIEF is open; **that there is exactly one is not.**
- **The instruction hierarchy stays AIEF's** (ADR-004): `AGENTS.md → assistant file → profile → standards → skills → active Change`. SpecBoot inspired it; AIEF documents it; the *content* at each level is delegable.

## 4. The honest counter-argument

**This narrows [ADR-010](../../knowledge/decisions.md)**, which decided AIEF creates `knowledge/standards/` as contextual knowledge. That ADR is accepted, and per [ADR-precedence](../../AGENTS.md) it outranks this study.

ADR-010 has a real argument on its side: standards created by `adopt` are **editable project property** that exists from minute one, and a project with mediocre standards may beat a project with none. Delegating to SpecBoot means adding a dependency (optional today, ADR-003) to get something AIEF currently ships in the box.

**Evidence for narrowing it: n=1** — 6 files, 0 edits, one project. Per ADR-008 that is a signal, not a mandate.

> **The gate: a second adoption that also leaves standards unedited.** Then amend ADR-010. **Until then, standards stay OPTIONAL and untouched** — no deletion, no delegation, no change to `adopt`. This document proposes a hypothesis and the observation that would settle it, nothing more.

A cheaper experiment worth running first, because it costs one line and no ADR: **have `adopt` report the standards it created as unadapted** — *"6 standards created from generic templates; they describe no project until you edit them"* — and see whether honesty alone moves the number. If it does, ADR-010 was right and only its silence was wrong.

## 5. What AIEF must never do

- **Vendor SpecBoot files.** ADR-003. Forks rot.
- **Require SpecBoot.** Optional, permanently. No-SpecBoot is a normal path, not a degradation.
- **Modify SpecBoot.** Out of scope.
- **Re-implement it again** — under any name. That is the mistake this document exists to name, and it will look reasonable the next time too.
- **Claim standards describe a project when they are untouched templates.** Law 5. An unadapted standard injected into a prompt as project context is a confident wrong answer.
