# Deliverable 2 — Test scenarios

> Three representative tasks, one per level of the risk gradient the framework must handle: a bug, a feature, a migration. Each is described to the participant in **business terms** — never in AIEF vocabulary — so that any AIEF concept they invoke is one they *discovered*, not one we planted.

## How to read a scenario

- **Repo state:** what the target repository looks like at handover.
- **TASK.md (verbatim):** the exact text the participant reads. Business language only. No word from AIEF's glossary.
- **The correct main-flow path:** what a fully-successful run looks like — the yardstick, not something shown to the participant.
- **Expected artifacts:** how many AIEF artifacts a *correct* result requires. This tests the "minimum artifacts" promise.
- **Abandonment watch points:** the specific moments the participant is most likely to leave the main flow. The observer watches these.
- **Concept exposure:** which AIEF concepts the task *should* need — and which it must **not** need. A task that drags in ADR/OpenSpec/SpecBoot for a bug fix is a finding.

---

## Scenario A — Fix a bug (the smallest change)

- **Repo state:** a small, working Node/TypeScript service with a real, reproducible defect (e.g. a list endpoint returns rows for the wrong tenant / an off-by-one in pagination). AIEF already adopted (the repo has `AGENTS.md`, `changes/`, the CI gate). Tests exist and one is red, or the bug is manually reproducible.
- **TASK.md (verbatim):**
  > *"The executions list is showing rows from other tenants. It should only show the current tenant's rows. Fix it and leave evidence that it's fixed."*
- **The correct main-flow path:**
  `aief` (discover state / next step) → create a Change (INTAKE) → the tool supplies context (CONTEXT) → no plan artifact needed (PLAN is empty for a bug) → fix + test (IMPLEMENT) → run the gate (VERIFY) → write evidence, close (CLOSE).
- **Expected artifacts (correct result):** **one** — a Change with evidence inside. No `spec.md`, no `tasks.md`, no ADR, no OpenSpec.
- **Abandonment watch points:**
  - Do they even use AIEF, or just fix the code and stop? (If AIEF isn't on the path, they'll skip it entirely — the central Flux Portal finding, on a fresh user.)
  - After fixing, do they know to run `verify`? Do they *find* `verify`?
  - Do they know what "leave evidence" maps to (`evidence.md`)?
  - Do they try to create a spec/tasks because the tool asked for them?
- **Concept exposure:**
  - **Should need:** Change, evidence, verify, close.
  - **Must NOT need:** ADR, OpenSpec, SpecBoot, profile, skill, Type, Track, the three levels.

## Scenario B — Add a feature (the standard change)

- **Repo state:** same service, AIEF adopted. A small feature with an observable surface (e.g. add a `status` filter to the executions endpoint; the response shape changes).
- **TASK.md (verbatim):**
  > *"Add the ability to filter the executions list by status (active, failed, done). Callers will pass `?status=active`. Make sure it's specified and verified."*
- **The correct main-flow path:**
  `aief` → create a Change (INTAKE) → context (CONTEXT) → because the response shape changes, a spec/acceptance is warranted (PLAN) → implement + test (IMPLEMENT) → verify (VERIFY) → evidence, close (CLOSE).
- **Expected artifacts (correct result):** a Change + a specification of the new behavior + evidence. Whether the participant reaches for OpenSpec, an AIEF `spec.md`, or just writes acceptance criteria is **itself a measurement** (the `spec.md` vs OpenSpec ambiguity the audit flagged).
- **Abandonment watch points:**
  - The word "specified" — do they find how AIEF wants a spec, or invent their own?
  - Do they hit the `spec.md`/OpenSpec/`propose` fork, and does it confuse them?
  - Does the CONTEXT step (detected stack, standards, skills) reach them, or arrive empty?
  - Do they know when the feature is "done enough" to close?
- **Concept exposure:**
  - **Should need:** Change, spec/acceptance criteria, evidence, verify, close.
  - **May encounter (watch how):** OpenSpec (only if a contract feels needed), the notion of an observable contract.
  - **Must NOT need:** SpecBoot, ADR, profiles, skills internals, the knowledge-dimension taxonomy.

## Scenario C — Start a migration (the large change)

> **Only the *start*.** No participant migrates a system in 60 minutes. We test whether AIEF makes the *beginning* of a migration correct and legible — the phase where Flux Portal invented rollback/parity/cutover by hand.

- **Repo state:** a small monolith with an obvious seam (e.g. a frontend view coupled to a backend module). AIEF adopted. TASK describes separating the two, strangler-style.
- **TASK.md (verbatim):**
  > *"We're going to split the reporting UI out of the monolith into its own service, without downtime, keeping the old one running until the new one matches it. Set up the first change of this migration correctly."*
- **The correct main-flow path:**
  `aief` → create a Change for the first migration step (INTAKE) → context (CONTEXT) → planning that acknowledges two systems running at once, parity, and a rollback posture (PLAN) → set up (not finish) the first increment (IMPLEMENT) → verify what exists (VERIFY) → evidence of the setup, close or leave open with a checkpoint (CLOSE).
- **Expected artifacts (correct result):** a Change that *declares its own weight* — the participant should end up with more structure than the bug task produced, and the question is **whether AIEF told them they needed it or whether they had to know**. This is the direct test of "complexity appears only when needed": does the framework *surface* rollback/parity/cutover, or must the participant already know to ask?
- **Abandonment watch points:**
  - Does anything in AIEF prompt the ideas of parity / rollback / cutover, or does the participant get the same blank Change as a bug fix?
  - Do they reach for ADR (an architectural decision is being made) — and does AIEF ask?
  - Where do they feel the tool stopped helping and they were on their own? (Flux hand-built exactly here.)
- **Concept exposure:**
  - **Should surface (from the tool, ideally):** Change, evidence, verify, and — if the design is working — some signal about rollback/parity/checkpoints.
  - **Will likely need:** ADR, the notion of increments/checkpoints.
  - **Measurement of interest:** how much of the migration's structure the participant had to **supply from their own experience** versus receive from AIEF. High self-supply = the "seams are weak" finding, reproduced.

---

## 5. Assignment across participants

| Participant | Experience | Scenario | Rationale |
|---|---|---|---|
| P0 (pilot, discarded) | any | A | Shake out logistics on the simplest task |
| P1 | **junior** | A | The 15-min claim tested at the level that exposes what the tool assumes |
| P2 | **mid** | A | " |
| P3 | **senior** | A | " — did a senior *know* or *guess* the path? (debrief) |
| P4 | **mid** | B | One feature run |
| P5 | **senior** | C | One migration-start run |

**Five scored sessions** (P1–P5), experience spread mandated in [protocol.md §2](protocol.md): ≥1 junior, ≥2 mid, ≥1 senior.

**Bug-heavy on purpose, and now experience-stratified:** ~90% of real work is small, and the 15-minute criterion is defined on the main flow, which Scenario A exercises most purely. Running A across junior/mid/senior (P1–P3) tests whether the 15-minute claim holds *for the level that has the least prior context to fall back on* — a senior passing tells us less than a junior passing. B and C are single probes for where the flow bends, not the primary measurement. If a second cohort is funded, invert the weighting to stress B and C.

**Every participant is single-use** (novelty guard). No participant runs two scenarios — the second would no longer be a fresh user.

## 6. Repository preparation (identical guarantees for all)

- The target repos are prepared **once**, snapshotted, and restored byte-for-byte between sessions.
- Each has AIEF already adopted, so the test is *using* AIEF, not installing it — **except** one variant of Scenario A that starts un-adopted, to measure the adopt step itself (assign only if a 5th scored session is available).
- TASK.md contains **zero** AIEF vocabulary. A reviewer who is a fresh user checks each TASK.md for leaked jargon before the study.
- No AIEF cheat-sheet, README shortcut, or pinned command exists in the repo beyond what a real adopted project has.
