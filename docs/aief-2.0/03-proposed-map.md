# 3 · Map of the proposed framework + conceptual architecture

> Deliverables 3 and 5. Read [02-current-map.md](02-current-map.md) first — this document is its answer.

## 1. The one-sentence design

**AIEF 2.0 is nine CORE components, one entry point, one declared Change, and a gate that asks only for what the work needs.**

Everything in AIEF 1.x that is not one of those nine is delegated (SpecBoot, OpenSpec, the assistant), demoted (appears on demand), or deleted.

## 2. The proposed map

```text
                            aief
                              │
                    "what should I do next?"
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
   ORCHESTRATION                              GOVERNANCE
   what comes next                          is this finished?
        │                                           │
   ┌────┴────┐                              ┌───────┴───────┐
   │ the     │                              │ tolerant      │
   │ Change  │◄─── declares ── Track ──────►│ readers       │
   │         │                (basic/       │ proportional  │
   │ + evidence                standard/    │ gates         │
   └────┬────┘                 migration)   └───────┬───────┘
        │                                           │
        │  composes the brief (harness slots)       │  runs automatically (CI)
        ▼                                           ▼
   the assistant ──────────────────────────► evidence.md
        │
        ├──► SpecBoot   creates the scaffolding   (day 0, invoked, not copied)
        └──► OpenSpec   validates the contract    (on demand, referenced, never duplicated)
```

Three things changed, and only three:

1. **One door.** `aief` with no arguments answers *"what should I do next?"*. Every other command becomes something you learn later, or never.
2. **The Change declares its Track.** One line in `change.md`. That line is the progressive-complexity mechanism — it decides which artifacts exist and what the gate demands.
3. **The gate is proportional and automatic.** It runs in CI (Law 3) and asks only for what the Track requires (Law 4).

## 3. Conceptual architecture

Six layers. Each has one job, and the boundaries are the point — this is where AIEF 1.x's `prompt` command went wrong by doing four jobs at once.

### Layer 1 — Surface: the next-step engine

**Job:** turn "I don't know what to do" into one command.

`aief` reads the repository, derives state ([ADR-009](../../knowledge/decisions.md): the files are the truth), and prints **one** recommended action and why. Not a menu. Not 90 paths. One action, with an escape hatch.

```console
$ aief
AIEF · trk-orchestrator-portal

  Change 0008-user-management-mutations (standard) — open, 6 days
  Evidence is complete. Tasks are done. One human gate is unchecked.

Next:
  aief close --change 0008-user-management-mutations

  (aief help — everything else)
```

The 15 commands are not removed on day one; they are **removed from the path**. Discovery replaces memory. This is the direct answer to the audit's core finding: the CLI ran once because after day 0, nothing ever told anyone to run it again.

### Layer 2 — The Change: the unit of governed work

**Job:** hold one unit of work and declare its shape.

```markdown
# Change 0008 — User management mutations

Track: standard
ADR: none
OpenSpec: user-management-mutations

## Goal
...
```

Four declarations, each a single line, each with `none` as a legitimate recorded answer. `Track` decides what else must exist. `ADR` and `OpenSpec` are [F4](../dogfooding-findings.md)'s design, and they are the reason Flux's ADR-007 would not have been lost.

**Unchanged from 1.x:** it is a directory of Markdown; it is the only source of truth; there is no state file. Law 6 stands.

### Layer 3 — Readers: tolerant in, loud on ambiguity

**Job:** determine the truth from what humans wrote.

This layer exists because of Law 2, and it is the layer AIEF 1.x did not know it had — F1's parser was an implementation detail scattered inside `cli.js`. Making it a named layer with one rule is the fix:

> **A reader accepts every reasonable human format, rejects decoys, and errors loudly when a declaration exists but cannot be interpreted. It never guesses `false`.**

Every reader (`Track`, `ADR`, `OpenSpec`, status, evidence completeness) obeys it. [Change 0036](../../changes/0036-governance-signal-integrity/) already built this for status and evidence; 2.0 generalizes the rule rather than re-deriving it per field.

### Layer 4 — Gates: proportional and automatic

**Job:** refuse to let work be called done when it isn't — and stay silent when it is.

Two properties, both non-negotiable:

- **Automatic** (Law 3): delivered by `adopt` as a CI workflow. Never "remember to run `verify`".
- **Proportional** (Law 4): the gate asks what the Track declares. A `basic` Change is never asked for a spec. This is what makes automation survivable — an automatic gate that demands the wrong artifact isn't governance, it's a broken build everyone learns to ignore.

### Layer 5 — Composition: the harness

**Job:** assemble the brief the assistant receives — and know which slots are empty.

Eleven slots, each answering exactly one question. Full design: [07-harness.md](07-harness.md). Its architectural value is diagnostic: it makes "the prompt says *act as the architect profile* and nothing defines that" a **visibly empty slot** instead of undefined behavior.

### Layer 6 — Delegation

**Job:** call the tools that already solved the problem.

**SpecBoot creates. AIEF guides. OpenSpec validates.** ([08-openspec.md](08-openspec.md), [09-specboot.md](09-specboot.md).)

### The dependency rule

Layers depend downward only. Specifically: **the gate must never depend on the composer.** In 1.x, `prompt` (Layer 5) and `verify` (Layer 4) both parse Changes with their own logic — which is how F1 and F3 could be true of one and not the other. One reader layer, many consumers.

## 4. What the map deliberately does not have

| Not in the map | Why |
|---|---|
| Initiative, Parent/Child | n=1, deferred, out of scope per the brief |
| Contract hashes | Insufficient evidence |
| Traceability parser | Insufficient evidence |
| Role profiles (architect/developer/…) | **0 observed use.** See §5 |
| A state file | ADR-009. Rejected once, stays rejected |
| Agent orchestration | Prime Directive |
| A fifth knowledge dimension | ADR-012's orthogonality holds |
| New commands | The brief's out-of-scope list, and Law: 2.0's surface must shrink |

## 5. Conflicts with accepted ADRs

Accepted ADRs outrank this study. Where this design touches one, the conflict is named here and left for a human decision — none is resolved by this document.

### 5.1 ADR-012 (Operational Profiles) — **terminology collision, not a contradiction**

**The collision is real and must be fixed before anything ships.** [ADR-012](../../knowledge/decisions.md) defines a **Profile** as *role reasoning* — architect, developer, reviewer; "how should I reason?". The brief asks for three **profiles** named Basic / Standard / Migration, which are *complexity tiers* — "how much governance does this work need?".

These are orthogonal concepts. An architect can work on a `basic` Change; a junior developer can work on a `migration` one. Two meanings for one word in the ubiquitous language ([domain-model.md](../domain-model.md)) is exactly the degradation `external-harness-patterns.md §5.8` warned about when rejecting imported terminology — and here AIEF would be doing it to itself.

> **Recommendation: call them Tracks.** This study uses **Track** throughout and keeps "Profile" reserved for ADR-012's meaning. [06-profiles.md](06-profiles.md) carries the brief's title so the deliverable is findable, and uses "Track" in the design. **This is a naming decision for a human**, not a fait accompli.

**On implementation:** ADR-012 is accepted and unimplemented, and explicitly says *"Acceptance of this ADR is the milestone — implementation (0025) is a separate decision, not yet started."* So classifying role Profiles as EXPERIMENTAL and **not** implementing them in 2.0's first stage contradicts nothing. But the study does surface an uncomfortable fact for whoever revisits ADR-012: **the profile concept has now had 0 uses across a full real migration**, and the one place it appears in AIEF's output ("act as the architect profile") is a promise pointing at an empty directory. ADR-012 requires re-validation on a real project before acceptance of its implementation; that gate is unmet and this study does not propose meeting it.

### 5.2 ADR-011 (three-level workflow) — **needs superseding, or the 6-step flow must not ship**

ADR-011 made *one* canonical workflow model (3 levels) precisely to end four competing phrasings. The brief's `INTAKE → CONTEXT → PLAN → IMPLEMENT → VERIFY → CLOSE` is a **fifth** phrasing.

They are compatible in substance — levels answer *who owns this*, steps answer *when does this happen*, and [05-user-flow.md §3](05-user-flow.md#3-the-six-steps-mapped-to-todays-commands) maps every step onto ADR-011's levels without contradiction. But shipping both as canonical recreates ADR-011's original problem.

> **Required: a new ADR that makes the 6-step flow the canonical *user-facing* model and demotes the 3 levels to the *responsibility* model** — or the flow stays a study artifact. Not this study's call.

### 5.3 ADR-006 (the CLI must be guided and educational) — **genuine tension**

ADR-006 requires every command to explain purpose, when to use it, what it reads, what it writes, an example, and the next step. That is why `aief prompt` prints a paragraph before doing anything. **The teaching goal is right; the mechanism competes with "must feel simple"** — explaining everything every time is how a 15-command CLI feels like a 15-command CLI.

> **Proposed reconciliation:** ADR-006's intent is served by *progressive* teaching — explain on first use and on `--help`, not on every invocation. This narrows a documented decision and therefore needs an ADR amendment, not a code change.

### 5.4 ADR-010 (standards are contextual knowledge AIEF creates) — **tension with delegation**

ADR-010 has `aief adopt` create `knowledge/standards/`. The audit found those 6 files created and **never edited** on the only real adoption, and `VALIDATION-SUMMARY.md` already called SpecBoot "copied template residue". [09-specboot.md](09-specboot.md) argues standards are SpecBoot's job.

> **This directly narrows an accepted ADR.** Evidence: n=1 (0 edits / 6 files). Per ADR-008 that is a signal, not a mandate. **Gate: a second adoption that also leaves standards unedited** → then amend ADR-010. Until then, standards stay OPTIONAL and untouched.

### 5.5 ADR-004 (AGENTS.md is the rule root) — **currently violated in practice**

No conflict with 2.0 — but the audit found **4 divergent `AGENTS.md`**, and adopted projects receive the 14-line stub while the authoritative 170-line version stays in AIEF's repo. ADR-004 is not wrong; the implementation drifted from it. Fixing that is a bug fix, not a redesign, and it needs no new decision.

### 5.6 Reaffirmed without change

ADR-001 (not a spec generator) · ADR-002 (OpenSpec integrated) · ADR-003 (SpecBoot conceptual) · ADR-005 (adoption is the primary case) · ADR-007 (tech knowledge is data) · ADR-008 (evidence gates everything, including this study) · **ADR-009 (no hidden state — the strongest bet 1.x made)**.
