# Dogfooding Findings

> A concise historical ledger of what AIEF learned by governing real migrations — not an operational state file. Each row records a finding, its evidence, the decision, the action taken, and the horizon (now vs later). New evidence appends rows; decisions change only with new evidence (ADR-008).
>
> Case study: **Flux Portal** (`trk-orchestrator-portal`) — a real Next.js / TypeScript / Postgres / Cognito / multitenant frontend migration governed with AIEF. Cited as empirical source only; no secrets or unnecessary content from that repository are reproduced here.

## Findings ledger

| Finding | Evidence | Decision | Action | Horizon |
|---|---|---|---|---|
| Workflow Cohesion — commands could implicitly select the wrong open Change | Flux Portal (multiple open Changes during migration) | Accepted | Change 0034 — explicit `--change` selection across status/prompt/verify/close | Now |
| Human gates distinct from developer tasks | Flux Portal | Accepted as convention | Change 0035 — `(human)`/`(review)` task labels ([governance-conventions §1](governance-conventions.md#1-tasks-gates-and-reviews)) | Now |
| OpenSpec ↔ AIEF traceability (draft/mock vs real-backend closure) | Flux Portal | Accepted as convention | Change 0035 — OpenSpec↔AIEF rule ([governance-conventions §3](governance-conventions.md#3-openspec--aief)) | Now |
| Harness declaration (project owns execution, AIEF records results) | Flux Portal | Experiment / document | Change 0035 — optional Validation Harness section ([governance-conventions §4](governance-conventions.md#4-harness-engineering)) | Now |
| Deferred / moved / blocked work needs traceable, non-blocking markers | Flux Portal | Accepted as convention | Change 0035 — `[-]` deferred-work vocabulary ([governance-conventions §2](governance-conventions.md#2-deferred-and-moved-work)) | Now |
| Increments within large Changes | Flux Portal | Accepted as convention | Change 0035 — increment convention ([governance-conventions §6](governance-conventions.md#6-increments-within-large-changes)) | Now |
| Architecture Checkpoints at phase boundaries | Flux Portal (foundation → functional) | Accepted as optional template | Change 0035 — optional checkpoint section ([governance-conventions §7](governance-conventions.md#7-architecture-checkpoints)) | Now |
| Initiative (long-running arc, derived view of related Changes) | n=1 | Deferred | Reassess after the frontend migration completes ([knowledge/backlog.md](../knowledge/backlog.md)) | Later |
| Parent-Child Changes | n=1 | Deferred | More dogfooding | Later |
| Checkpoint as a CLI Change Type | n=1 | Deferred | Template first (§7); promote only with evidence | Later |
| Contract hashes | insufficient evidence | Deferred | SDD experiment | Later |
| Evidence / requirement-traceability parser | insufficient evidence | Deferred | Traceability dogfooding | Later |

## How to read this

- **Now** = materialized in this cycle (Changes 0034/0035) as CLI behavior (Workflow Cohesion) or as conventions/templates (Governance Conventions).
- **Later** = deliberately deferred; each names what evidence would move it. Nothing here is a commitment — it is a filter, applying ADR-008 so AIEF grows from what real projects reveal rather than from speculation.

---

# Closure-phase findings (Flux Portal, 2026-07-16)

> **New evidence class.** Every row above came from *governing* the migration. These six come from **closing** it — a phase the ledger had never observed: the migration reached `READY`, and a full governance reconciliation then re-derived the truth of every Change, ADR and contract from the repository.
>
> **What that phase revealed is not a feature gap.** AIEF already detected most of what went wrong; it was **never run**, and where it did run it **answered wrongly in silence**. F1–F3 are therefore **correctness and adoption defects, not new capabilities** — they are `committed` because the evidence is deterministic and reproducible (n=13 on one project, but the failure is mechanical, not statistical: ADR-008's `n=1 → defer` gate exists to filter *speculative features*, not to postpone a parser that provably misreads real files).
>
> Reproduce any evidence below with the commands given; the case-study repository is `trk-orchestrator-portal` at its post-reconciliation state.

## Ledger

| ID | Severity | Finding | Decision | Horizon | State |
|---|---|---|---|---|---|
| **F1** | **P0** | Status parser is format-brittle and silently answers `false` — 13/13 genuinely closed Changes read as open | Fix (bug) | Now | **committed** — [Change 0036](../changes/0036-governance-signal-integrity/) |
| **F2** | **P0** | `aief verify` is never run by adopted projects — it would have FAILED from Change 0008, two days before cutover | Deliver the gate at adoption | Now | **committed** — [Change 0036](../changes/0036-governance-signal-integrity/) |
| **F3** | **P1** | Evidence-placeholder heuristic false-positives on complete evidence (688-line file flagged "not completed") | Fix (bug) | Now | **committed** — [Change 0036](../changes/0036-governance-signal-integrity/) |
| **F4** | **P1** | No mandatory `ADR:` / `OpenSpec:` declaration — an architectural decision shipped with no ADR, unnoticed | Design first, implement later | Next | **proposed** — [design](proposals/f4-adr-openspec-declaration.md) |
| **F5** | **P2** | Change status is binary (`closed` / not); real closure needed CLOSED · ARCHIVED · SUPERSEDED · OPEN | Record evidence only | Later | **deferred** (evidence only) |
| **F6** | **P2** | No stale-status detection — 11/13 Changes carried a status contradicted by their own evidence | Record evidence only | Later | **deferred** (evidence only) |

---

## F1 — The status parser answers `false` in silence · P0 · committed

- **Evidence (reproducible).** Against `trk-orchestrator-portal`, whose 13 Changes were **all explicitly reconciled to CLOSED**:
  ```bash
  node cli/bin/aief.js verify        # in the Flux repo
  # every Change prints without the "(closed)" suffix → all read as OPEN
  ```
  `isClosedContent()` returns `false` for **13 of 13**.
- **Impact.** The entire governance reconciliation is **invisible to AIEF**. `openChangeDirs()` treats every closed Change as open, so `verify`'s "Next:" hint, `prompt` and `close` all reason from a false premise. Worse than a wrong answer: a *confident* wrong answer.
- **Cause.** `/^##\s*status\s*(\r?\n)+\s*closed/im` only recognises **the exact string `aief close` itself writes** (`## Status` + `Closed (date)`). Both formats humans actually write fail:
  - `## Status` + `**CLOSED** (2026-07-11)` — bold emphasis (Flux 0004–0007);
  - `> **Status: CLOSED (reconciled 2026-07-16).**` — blockquote (Flux 0001–0003, 0008–0013).
  The parser is a *round-trip check on its own output*, not a reader of Markdown.
- **Why this is the important one.** It is the **same failure class** the same migration found in OpenSpec (`validate --all` reported `4 passed` while silently skipping an entire change): **a tool that returns a plausible-but-wrong answer instead of failing loudly.** Two independent tools, one bug shape. A parser that cannot determine the truth must **say so**, not guess `false`.
- **Decision.** Fix. Parse a *declared* status tolerantly (emphasis, blockquote, dates, trailing prose), reject qualified decoys (`Status (orig):`), refuse ambiguity, and **error loudly when a status is declared but not interpretable**.
- **Horizon.** Now — Change 0036.

## F2 — Nothing runs `aief verify` in adopted projects · P0 · committed

- **Evidence (reproducible).**
  ```bash
  node cli/bin/aief.js verify ; echo $?   # in the Flux repo -> Result: FAIL, exit 1
  ls -d /path/to/trk-orchestrator-portal/.github   # -> does not exist
  ```
  `verify` correctly reports six missing `spec.md` (Changes 0008–0013) and exits `1`. Those files went missing **at Change 0008 and stayed missing through the cutover** — the signal existed for days and nobody saw it.
- **Impact.** The single most valuable AIEF capability was **built, correct, and unused**. AIEF's own CI runs `aief verify` on itself (`.github/workflows/ci.yml`); **adopted projects inherit nothing** — `runAdoption()` creates `AGENTS.md`, `changes/`, `knowledge/`, `profiles/`, standards and skills, but **no gate**.
- **Cause.** Adoption delivers *structure*, not *enforcement*. Governance was left to human discipline, and discipline decayed exactly where throughput mattered most (Change 0008 opened in "throughput mode").
- **Decision.** Deliver the gate **at adoption**. No new core capability is required — `verify` already exits non-zero; what is missing is a workflow file and the documented mechanism.
- **Horizon.** Now — Change 0036.

## F3 — Complete evidence classified as a placeholder · P1 · committed

- **Evidence (reproducible).**
  ```bash
  grep -cE '^Pending\.\s*$' changes/0003-frontend-backend-separation/evidence.md   # -> 3
  wc -l changes/0003-frontend-backend-separation/evidence.md                        # -> 688
  node cli/bin/aief.js verify   # -> "○ changes/0003… — in progress (evidence not completed yet)"
  ```
  Same for Change 0005 (3 `Pending.` lines in **496** lines of real evidence).
- **Impact.** Two fully-evidenced Changes are reported as unfinished, and `verify`'s "Next:" hint sends the user to `aief prompt` (do the work) instead of `aief close` (the work is done). `checkChangeReadiness()` then **blocks `close`** on evidence that is demonstrably complete — the tool obstructs the correct action.
- **Cause.** `isEvidencePlaceholderContent()` counts `^Pending\.$` lines and fires at `>= 3` **regardless of how much real content surrounds them**. The generated template has **nine** such lines, so "3" was meant as "mostly untouched" — but it measures the wrong thing: **absolute placeholders instead of placeholder dominance**. Residual `Pending.` markers in a finished document are normal and honest.
- **Decision.** Fix. Classify the **whole document**: `placeholder` (untouched template) · `partial` (placeholders dominate) · `complete` (real evidence, residual pendings allowed), and route the hint accordingly.
- **Horizon.** Now — Change 0036.

## F4 — An architectural decision shipped with no ADR · P1 · proposed

- **Evidence.** Flux Portal Change `0012-n8n-tenancy-mode` introduced `N8N_TENANCY_MODE` — an **isolation posture** with fail-closed semantics (`shared_legacy` provides *no* n8n-level tenant isolation) — and referenced **no ADR**. The gap surfaced only during the closure reconciliation, days later, and had to be repaired retroactively (the portal's ADR-007 was reconstructed and then human-ratified). In the same project, **five mutation domains** (users, roles, tenants, credentials, audit) reached production with **no contract**, by the same mechanism.
- **Impact.** The most consequential decisions are the easiest to lose: nothing ever asks "did this Change decide something architectural?". A blank field is indistinguishable from a considered "none".
- **Cause.** A Change declares `## Type` and (for Enrichment) `## Requirement Source`, but nothing declares **ADR** or **OpenSpec** linkage. Absence is silent and costless.
- **Distinct from the existing ledger row.** "OpenSpec ↔ AIEF traceability" ([governance-conventions §3](governance-conventions.md#3-openspec--aief)) standardises **how to reference** a contract once you have one. F4 is about **requiring the declaration to exist at all**, with `none` as an explicit, recorded answer.
- **Decision.** **Design first, do not implement.** Mandatory fields are cheap to add and expensive to get wrong: not every Change needs an ADR or a contract, and a rule that cries wolf will be satisfied with `N/A` and teach people to lie to the tool. Obligation must be evidence-backed and designed before it ships.
- **Horizon.** Next — [design proposal](proposals/f4-adr-openspec-declaration.md). Not in Change 0036.

## F5 — Change status is binary · P2 · deferred (evidence only)

- **Evidence observed.** Closing Flux Portal required **four** states, and the distinctions were load-bearing:
  - `CLOSED` — work finished (11 Changes);
  - `CLOSED · ARCHIVED` — historical, deliberately out of active agent context (Change 0001);
  - `CLOSED` **but explicitly not archivable** — Change 0002's `evidence.md` is cited normatively by three ADRs and `openspec/config.yaml`; **archiving it would have broken those citations**;
  - `SUPERSEDED` — defined in the convention, unused in the end.
  AIEF models exactly one bit: `closed` or not (`isClosedContent`).
- **Possible heuristics.** Extend the status vocabulary the F1 parser already normalises (it reads the declared token, so `ARCHIVED`/`SUPERSEDED` would be a vocabulary addition, not a new parser); derive "archivable" from inbound-reference analysis rather than a label.
- **False-positive risks.** *Archived* is the dangerous one: a tool that hides or relocates a Change on a label can break exactly the citations Flux found (three ADRs). Any archive semantics must prove **nothing references the target** before acting — a reference-checker AIEF does not have and should not grow speculatively.
- **Evidence needed to promote.** A **second** project that needs more than `closed`/open, plus a concrete consumer of the distinction (e.g. context scoping for assistants). n=1 today → **defer**, per ADR-008.

## F6 — No stale-status detection · P2 · deferred (evidence only)

- **Evidence observed.** At the moment of a **successful, verified cutover**, **11 of 13** Flux Changes carried a status their own evidence contradicted — most starkly Change `0011`, still declaring `IN PROGRESS` after its work had shipped *and* passed through the cutover. Changes `0005`/`0006`/`0007` still said `PROPOSED` while live in production. Three mutually incompatible status conventions coexisted across the 13.
- **Possible heuristics.** A Change cannot be "in progress" when (a) its `evidence.md` records a PASS, or (b) a **later** Change that depends on it is closed, or (c) its tasks are fully checked while its status says otherwise. Each is a *contradiction* between two facts already inside the repository — no new state required.
- **False-positive risks.** Real. "PASS" appears in prose that is not a verdict; Change numbering does not imply dependency (Flux's 0009/0010/0011 were parallel recovery passes, not a chain); a Change may legitimately be open after a partial PASS (Flux's own increments convention, [governance-conventions §6](governance-conventions.md#6-increments-within-large-changes), makes per-increment PASS explicitly *not* a closure). A detector that nags on legitimate states gets muted, and a muted detector is worse than none.
- **Evidence needed to promote.** A second project exhibiting drift, plus a heuristic validated against **both** repositories with a measured false-positive rate. Note F1 is a **prerequisite**: staleness cannot be detected while the parser cannot read the status at all. n=1 today → **defer**, per ADR-008.

## How to read these six

- **committed** (F1–F3) = fixed in [Change 0036](../changes/0036-governance-signal-integrity/). All three are **defects in existing behaviour**, not new capability — the ADR-008 evidence gate governs *what AIEF grows*, not whether it repairs what provably misreads real files.
- **proposed** (F4) = designed, **not implemented**; obligation needs design + evidence before it ships.
- **deferred / evidence only** (F5, F6) = recorded so a future n=2 can decide. **Nothing here is a commitment.**

> **The through-line.** AIEF's capabilities were ahead of its adoption: the validator existed and was right; it was never invoked (F2), and where it did run it answered wrongly without saying so (F1, F3). The first move is not to detect more — it is to **run automatically, read reality correctly, and fail loudly when the truth cannot be determined**.
