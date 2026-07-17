# 11 · Incremental roadmap

> Deliverable 11. **Nothing here is authorized.** Each stage names the evidence that unlocks it ([ADR-008](../../knowledge/decisions.md)) and the decision a human must make first.

## The rule that governs every stage

> **A stage deletes before it adds. A stage with pending removals is not complete, regardless of what it shipped.**

This is not tidiness. [01 §7](01-vision.md#7-the-honest-risk) names this study's own failure mode: AIEF 2.0 ships *on top of* AIEF 1.x, everything survives "for compatibility", the surface grows, and v4 happens again wearing a new name. The rule is the only thing standing between this roadmap and that outcome.

---

## Stage 0 — Read reality correctly · **done**

[Change 0036](../../changes/0036-governance-signal-integrity/): F1 (tolerant status parser), F2 (CI gate at adoption), F3 (evidence classification). Accepted.

**Everything downstream depends on this.** A tool that cannot read the truth cannot orchestrate anything — and Stage 1 is an experiment that only runs because F2 put the gate on the path.

---

## Stage 1 — The experiment that decides the rest

**Ships nothing new.** Watches what Stage 0 already shipped.

| | |
|---|---|
| **Action** | Adopt AIEF on **one** real project with the F2 CI gate. Change nothing else. Watch for 2+ weeks. |
| **Question** | Do they satisfy the gate, or route around it? |
| **If satisfied** | [Law 4](01-vision.md#law-4--a-disproportionate-gate-gets-bypassed-and-a-bypassed-gate-is-worse-than-none) is **refuted**. Tracks are unnecessary. Delete [06-profiles.md](06-profiles.md). The problem was adoption, exactly as F2 says, and this study over-thought it. |
| **If routed around** | (disabled, `continue-on-error`, red builds ignored) → Law 4 holds. Stage 3 is justified. |
| **Also measures** | The M1–M8 baseline against **1.x** ([05 §4.2](05-user-flow.md#42-the-test)) — otherwise 2.0 gets measured against numbers this study invented |
| **Gate** | None. This *is* the gate. |

**Do not skip this.** Building Tracks and the CI gate together makes the result uninterpretable — and shipping structure no observation demanded is precisely the v4 failure mode ADR-008 exists to prevent.

---

## Stage 2 — Delete

Pure removal. No new capability. Unlocks nothing, blocks nothing, and is the highest-confidence work in this roadmap: every item is [classified LEGACY](02-current-map.md#10-classification) on evidence.

| Delete / fix | Evidence |
|---|---|
| **3 of 4 `AGENTS.md`** → one canonical version, delivered to adopted projects | 4 divergent copies; adopters get the 14-line stub. **Violates ADR-004 today** |
| 5 of 7 entry points → one | 7 doors, 5 under a heading called "Start Here" |
| `docs/navigator/` (8 files) | 90 documented paths before any code |
| `specs/` (4 files) | Self-declared superseded |
| 3 tombstone docs | Self-declared |
| `reference-implementation/` | A 1-line placeholder |
| `starter-project/` (20 files) | Duplicates `templates/project/` + `examples/todo-app` |
| `Understand → Plan → Build` in AGENTS.md | Contradicts ADR-011 |

**Gate:** none. These are duplicates, tombstones and self-declared corpses.
**Risk:** broken links. Mitigation: they're already tombstoned; finish the job.

> **Stage 2 is where this roadmap is most likely to die.** Deleting 40 files ships no feature and demos badly. Do it first anyway — every stage after is cheaper for it, and a roadmap that can't complete Stage 2 has already answered whether it can complete Stage 5.

---

## Stage 3 — One door

**The single highest-leverage change in this study.**

| | |
|---|---|
| **Ship** | `aief` with no arguments → derives state, prints **one** next action and why ([05 §2](05-user-flow.md#2-the-first-15-minutes)). Two-question intake. `npx`, no clone. |
| **Delete** | INTAKE's 4 doors collapse to 1 (`new-change`/`analyze`/`enrich`/`propose` — 3 had 0 uses) |
| **Why here** | **The CLI ran once because nothing ever told anyone to run it again.** This is the fix for the audit's central finding, and it's independent of Stage 1's result |
| **Gate** | Stage 1's M1–M8 baseline exists |
| **Needs first** | ADR amending **ADR-006** ([03 §5.3](03-proposed-map.md#53-adr-006-the-cli-must-be-guided-and-educational--genuine-tension)) — progressive teaching, not explain-everything-every-time |
| **Success** | M1 < 5 min · M4 = 2 · M5 = 0 |

---

## Stage 4 — Declare (F4)

| | |
|---|---|
| **Ship** | `ADR:` and `OpenSpec:` as mandatory lines in `change.md`, `none` a valid recorded answer. Tolerant readers, loud on ambiguity (Laws 2 + 5). [Design already exists](../proposals/f4-adr-openspec-declaration.md) |
| **Why** | Flux's ADR-007 shipped with no ADR, was lost, and was repaired retroactively at cost. Five mutation domains reached production with no contract |
| **Gate** | F4's own: the design is accepted by a human. **Already staged as "Next"** in the findings ledger |
| **Risk** | The cry-wolf failure — a rule that nags gets satisfied with `none` and teaches people to lie to the tool. Measure: what fraction of `none` answers are honest? If `ADR: none` is universal, the field is theater |

---

## Stage 5 — Proportionality · **only if Stage 1 said so**

| | |
|---|---|
| **Ship** | `Track:` in `change.md`; `verify` demands per Track ([06](06-profiles.md)) |
| **Gate** | **Stage 1 observed a project routing around the gate** |
| **Needs first** | The Profile/Track naming decision ([03 §5.1](03-proposed-map.md#51-adr-012-operational-profiles--terminology-collision-not-a-contradiction)); an ADR for the 6-step flow vs ADR-011 ([03 §5.2](03-proposed-map.md#52-adr-011-three-level-workflow--needs-superseding-or-the-6-step-flow-must-not-ship)) |
| **Risk** | `basic` as universal escape hatch. Measure the distribution; if everything is basic, the Track failed |

---

## Stage 6+ — Only what evidence demands

Nothing below is planned. Each is listed with the observation that would start the conversation — and the honest default is that most never happen.

| Candidate | Unlocks when |
|---|---|
| Harness slots in the prompt ([07](07-harness.md)) | Prompt-size friction materializes (Change 0024's watch item) |
| Slot 09 Recovery (rollback) | A **second** migration needs it |
| Slot 11 Handoff (checkpoints) | A **second** multi-phase Change loses context at a boundary |
| Slot 01 Identity (role Profiles, ADR-012) | ADR-012's own gate: re-validation on a real project. **0 uses in one full migration** |
| Standards → SpecBoot ([09](09-specboot.md)) | A **second** adoption leaves standards unedited. Try the honesty message first — one line, no ADR |
| F5 (status vocabulary) · F6 (stale detection) | n=2. Already correctly deferred |
| Initiative · Parent/Child · contract hashes · traceability parser | Already deferred. **Out of scope** |

---

## Sequence

```text
Stage 0  ✓ read reality correctly            (0036 — done)
Stage 1  ⟳ observe: is the gate satisfied?   ← everything waits on this
Stage 2  ✂ delete                            (parallel — needs no gate)
Stage 3  ▸ one door                          (the central fix)
Stage 4  ▸ declare ADR / OpenSpec            (F4 — design exists)
Stage 5  ? proportionality                   (only if Stage 1 says so)
Stage 6+ ∅ nothing, until something breaks
```

**Stages 2 and 3 carry the study's value.** Stage 5 is the one everyone will want to build first, and it is the one that must wait — because it is the only stage whose premise might be wrong, and Stage 1 costs nothing but patience to find out.

## Decisions required before any of this

Six, all human, none resolved by this study:

1. **Is AIEF 2.0 a redesign or an addition?** If addition, stop — [01 §7](01-vision.md#7-the-honest-risk).
2. **Profile or Track?** ([03 §5.1](03-proposed-map.md#51-adr-012-operational-profiles--terminology-collision-not-a-contradiction))
3. **Does the 6-step flow supersede ADR-011's three levels, or stay a study artifact?** ([03 §5.2](03-proposed-map.md#52-adr-011-three-level-workflow--needs-superseding-or-the-6-step-flow-must-not-ship))
4. **Is ADR-006 amended to progressive teaching?** ([03 §5.3](03-proposed-map.md#53-adr-006-the-cli-must-be-guided-and-educational--genuine-tension))
5. **Does ADR-010 survive?** — needs n=2 ([09 §4](09-specboot.md#4-the-honest-counter-argument))
6. **Does ADR-012 get implemented, or reconsidered?** — 0 uses across a full migration ([03 §5.1](03-proposed-map.md#51-adr-012-operational-profiles--terminology-collision-not-a-contradiction))
