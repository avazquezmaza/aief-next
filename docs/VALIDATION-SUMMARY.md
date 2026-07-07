# AIEF Validation Summary

Evidence from the two validations that gate AIEF's pilot approval. Improvements to AIEF come only from findings like these, never from assumptions ([ADR-008](../knowledge/decisions.md)).

The full per-run reviews (`architecture-review.md`) live in the validation project repositories; this document summarizes their findings for the AIEF repo.

---

## What was validated

| # | Validation | Project | Stack | Purpose |
|---|---|---|---|---|
| 1 | Greenfield | `aief-sdd-test-calculator` | Java 21, Spring Boot, Apache Camel, OpenAPI, tests | Prove the full workflow end-to-end on a new project |
| 2 | Brownfield | `trk-orchestrator-portal` | Next.js, TypeScript, Postgres, Cognito, n8n, multitenant, RBAC | Prove architecture discovery on a real, complex existing project |

---

## Greenfield validation result

**Result: successful end-to-end workflow.**

The full AIEF workflow (Change → Spec → Tasks → Build → Verify → Evidence) ran to completion on a Spring Boot + Camel + Java 21 + OpenAPI project with tests.

**What worked**
- The workflow completed end-to-end with no dead ends.
- The **evidence / verify loop is the strongest product capability** — verification and governance are AIEF's real differentiation.
- The orchestrator positioning held: AIEF succeeded where it stayed in its lane.

**Friction observed**
- AIEF and OpenSpec had **disconnected change stores**.
- `spec.md` / `tasks.md` initially arrived **empty**.
- **Active Change selection was confusing.**
- **Prompt execution required manual copy/paste.**
- SpecBoot appeared as **copied template residue**, not a live standards provider.
- **Profiles** were conceptually important but under-materialized (addressed by [ADR-012](../knowledge/decisions.md); implementation deferred).

---

## Brownfield validation result

**Result: successful architecture discovery.**

`aief analyze` correctly detected the technologies of a real multitenant production-shaped codebase and produced a useful discovery envelope — safely and non-destructively.

**What worked**
- Correct technology detection across a complex stack.
- A **useful discovery envelope** was produced.
- AIEF was **safe and non-destructive** — zero destructive actions on a production-like repo. This is a trust asset.

**Friction observed**
- `doctor` detected a missing `AGENTS.md`, yet the prompt **still referenced `AGENTS.md`**.
- `analyze` created a **seeded** Change while `new-change` created an **empty** one — inconsistent shapes.
- Detected context **did not flow** from `analyze` into the worked Change.
- **Duplicate Changes were created silently.**
- Inferred risks were **not reconciled** against repository evidence.
- There was **no strong machine gate** for evidence completeness / scope containment.

**One-line verdict:** *The parts are strong; the seams are weak.*

---

## What worked (across both)

- The core **workflow runs end-to-end** (greenfield) and **discovery works on real complexity** (brownfield).
- The **evidence/verify loop** is the validated differentiator.
- AIEF is **safe and non-destructive** — no code was damaged in either validation.
- The **orchestrator boundaries** (AIEF vs OpenSpec vs SpecBoot vs assistant) held up under real use.

## What friction remains

The remaining friction is concentrated in the **seams between commands**, not the commands themselves:

1. **Fragmented Change identity** — disconnected stores, silent duplicates, confusing active-Change selection.
2. **No context flow** — detected context does not reach `new-change` or `prompt`; scaffolds arrive empty.
3. **Prompt diverges from verified reality** — prompts reference artifacts `doctor` knows are missing; execution needs manual copy/paste.
4. **No machine gate on closability** — no automated check for evidence completeness, scope containment or risk reconciliation.

These four map directly to the Workflow Cohesion workstreams in [docs/ROADMAP-TO-1.0.md](ROADMAP-TO-1.0.md).

---

## Current approval status

**Pre-1.0 internal pilot.**

**Approved for now:**
- Guided internal use.
- Brownfield discovery.
- Greenfield validation projects.
- Developer-team pilot usage.

**Not yet approved:**
- Unsupervised delegated implementation.
- External open-source publication as a stable 1.0.
- Autonomous assistant execution without human review.

See [docs/AIEF-1.0-READINESS.md](AIEF-1.0-READINESS.md) for the conditions that lift these restrictions, and [docs/TEAM-USAGE-GUIDE.md](TEAM-USAGE-GUIDE.md) for how to work within them safely.
