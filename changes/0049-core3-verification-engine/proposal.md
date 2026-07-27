# Proposal — Entrega 7: Verification Engine

## Problem

`aief verify` (`cli/src/core/services/change-verifier.js`, 143 lines) answers exactly one question:
*is this Change's repository structure intact?* — required files present and non-empty, `manifest.json`
consistent with legacy `## Status`, `evidence.md` classified `placeholder`/`partial`/`complete` by a
whole-document heuristic (ratio of "Pending." markers to substantive lines — Change 0043's
`classifyEvidence()`), open task count, Enrichment-specific structural checks. It answers nothing
about *whether the requirements a Change declared were actually addressed* — it has no concept of a
requirement's own evidence, a linked test, or a per-requirement verdict. This is a real, felt gap:
Entregas 3–6 of this very project each shipped `spec.md` files with 20–56 numbered requirements
(SDD-R*, WF-R*, UX-R*, SK-R*, HK-R*) and a `verification.md` scenario table citing them — entirely by
this session's own convention, checked by nothing but a human (or an AI assistant) reading both files
side by side. `aief verify` would report PASS on a Change whose `spec.md` requirements were never
addressed at all, as long as the four required files are non-empty and `evidence.md` isn't a raw
template.

## Existing capabilities inspected

- **`change-verifier.js`** (fully re-read this session): `checkChangeReadiness()` (the four
  structural readiness rules `close()` also uses — missing/empty files, status, evidence
  classification, open task count), `verifyProject()`/`verifyChange()` (render the same facts as a
  `VerificationReport`: `{lines, errors, warnings, passed, next}` — a single boolean `passed`,
  flipped by any `"error"`-level line, no distinction between "structurally broken" and "requirements
  unaddressed" because the second concept doesn't exist).
- **`classifyEvidence()`** (`change.js`): a whole-document heuristic over `evidence.md`'s prose —
  counts residual "Pending." markers against substantive line count. **Not** structured, **not**
  per-requirement, **not** contractual — a document can be classified "complete" while never once
  mentioning a specific requirement id. This is real evidence of *effort*, not of *coverage*.
  Confirmed: `evidence.md` must remain human-authored prose; this Entrega does not (and should not)
  make it an authoritative, machine-checked source.
- **`sdd-model.js`'s `parseRequirements()`/`parseTasks()`** (Entrega 3, unchanged since): a
  `Requirement` is `{id, title, text, source}` — no `status`, no `verification` field. A `Task` is
  `{id, text, completed, requirements: [], source}` — `requirements` is **always `[]`**, documented
  explicitly (SDD-R21) as "no Change in this repository links a task to a requirement id in any
  machine-checkable way." **This is the single most consequential inspection finding**: any rule that
  assumes a requirement↔task or requirement↔test link would be inventing a convention with zero
  existing adoption, and would systematically fail (or silently no-op on) every real Change in this
  repository today.
- **The one convention that DOES exist, organically, in this session's own Changes**: every
  `verification.md` produced for Entregas 2–6 contains a scenario table whose middle column cites the
  `spec.md` requirement id(s) each scenario covers (e.g. `| 16 | ... | HK-R11 | ... |`). This is a
  real, consistent, machine-searchable citation pattern — not invented by this Entrega, just
  recognized. It proves a requirement was *considered* in verification planning; it does not prove
  the requirement was *satisfied*.
- **`WorkflowService`, SDD Provider, Skill Service, Hook Service** (Entregas 4–6): each already
  computes exactly the facts a Verification Context would otherwise have to re-derive — `change`,
  `workflow` (stage/gates/blockers), `sdd` (provider/readiness/artifacts/requirements/tasks). Reusing
  `workflow-service.js`'s `explain()` output (already the pattern Skill Context and Hook Context both
  follow) avoids a third independent Change/Workflow/SDD computation.
- **`verify()`'s call sites** (`cli.js`): `main()`'s dispatcher (`case "verify"`), `runVerifyCompletedHooks()`
  (Entrega 6, reads `report.passed`/`report` only — never a specific field shape beyond that),
  `close()` does **not** call `verify()` (it calls `checkChangeReadiness()` directly, the same
  structural rule, independently — confirmed by re-reading `close()`'s body, `cli.js:806-830`).

## Objective

Introduce a **Requirement Verification** layer, clearly bounded from Structural Verification
(untouched) and Review (out of scope), that evaluates each of a Change's declared requirements
against **only the evidence types this repository can already, deterministically, produce** — no
invented authoring convention, no AI, no test execution, no network — and exposes it through `aief
verify`'s existing surface via one new, justified, opt-in flag, never a new command verb.

## Proposed definition

**Structural Verification** (existing, unchanged): *is the repository/Change internally consistent?*
**Requirement Verification** (new, this Entrega): *for each declared requirement, does citable,
type-classified evidence exist?* — never *"was it correctly implemented,"* which remains Review's
job (Entrega 8, out of scope). A **Verification Rule** answers one narrow, named question about one
requirement using one or more **Evidence** items; the **Verification Service** aggregates every
applicable rule's result per requirement, then an overall Change-level status, never inventing
evidence and never treating its absence as success.

## Evidence Model (see `design.md` §2 for full justification per type)

Six candidate types evaluated; two supported, two defined-but-unsupported (forward-compatible
vocabulary, no live producer), two rejected this Entrega:

- **`artifact_state`** — SUPPORTED. Reuses the SDD Provider's own already-normalized artifact states
  (`present`/`missing`/`empty`/`invalid`/`not_applicable`/`read_error`, Entrega 3) — no new state
  vocabulary, no new file read beyond what `context.sdd` already carries.
- **`file_assertion`** — SUPPORTED, narrowly. A claim that a specific, Change-relative path (no
  traversal, resolved and contained the same way Change 0045's `isPathWithin()` already enforces)
  exists/is non-empty. Distinct from `artifact_state` in that it's evaluated directly by a rule
  against the filesystem via the same guarded read path SDD providers use — not a new, separate
  filesystem-access mechanism.
- **`test`** — DEFINED, UNSUPPORTED this Entrega. No reliable, existing convention links a
  requirement id to a specific automated test (SDD-R21's own finding, restated for tests). The type
  exists in the vocabulary (forward-compatible, same "adopted but unused" treatment ADR-019 gave
  Skills' `deterministicExecution`) so a future Entrega that *does* find or define such a convention
  extends the model, not replaces it.
- **`manual_attestation`** — DEFINED, NEVER SUFFICIENT ALONE. A human's own claim ("I tested this
  manually") is real information but cannot be verified deterministically — recorded as a `warnings`
  contribution only, never enough by itself to produce `passed`.
- **`command_result`** — REJECTED this Entrega. Requires executing a command (Model C, out of scope
  by the commissioning instruction's own preference).
- **`external_reference`** — REJECTED this Entrega. Requires network access to validate (out of
  scope).

## Requirement Verification Model

A `Requirement` (SDD Provider, Entrega 3, `sdd-model.js`) is **not modified** — its contract
(`{id, title, text, source}`) stays exactly as ADR-017/SDD-R19-R21 shipped it, since other consumers
(Skills' `requirements-analysis-instructions`, Entrega 5) already depend on that exact shape. This
Entrega **wraps**, never mutates: a `VerifiableRequirement` is `{requirement, evidenceRefs,
ruleResults}` — evidence and rule results live alongside the requirement, referenced by its `id`,
never written into it.

## Initial rules (see `design.md` §6 for full justification)

Two, chosen for being groundable in real, existing data — not invented conventions:

1. **`requirement-has-traceability`** — checks whether a requirement's own `id` is cited anywhere in
   its Change's `verification.md` (the real, organic citation pattern found by inspection, above).
   Proves the requirement was *considered*, never that it was *satisfied* — exactly the distinction
   the commissioning instruction requires ("No implica que esté cumplido").
2. **`evidence-reference-integrity`** — for any declared evidence reference naming a path
   (`file_assertion`), verifies the resolved path stays within the Change/project boundary (reusing
   Change 0045's path-containment fix) and reports its real state — the security-relevant rule this
   Entrega's own threat model requires being exercised by at least one real rule, not just documented.

**Not included, with reasons**: `requirement-has-test-evidence` (candidate #2 — no reliable
requirement↔test link exists, per the `test` evidence type's own "defined, unsupported" status
above); `verification-scenario-covered` (candidate #3 — would substantially duplicate
`requirement-has-traceability`'s own citation check without new value); `artifact-presence`
(candidate #4 — the commissioning instruction's own text flags this as likely duplicating Structural
Verification; confirmed: `change-verifier.js`'s existing `missing`/`empty` checks already cover this
at the Change-file level, and `artifact_state` evidence already covers it at the SDD-artifact level —
a third, rule-shaped version adds no new information).

## Scope

**In scope:** Evidence Model (six types, two supported), Verification Rule contract, Registry
(mirrors `requirement-providers/`/`sdd-providers/`/`skills/`/`hooks/`), Verification Context (reuses
`workflow-service.js`'s `explain()`; adds exactly one new, safe, fixed-filename read —
`verification.md`, within the already-trusted Change directory), Verification Service (resolve
requirements → resolve evidence → select/order rules → evaluate → aggregate), normalized per-rule and
aggregated results, two initial rules, `aief verify --requirements` (additive, opt-in, no new command
verb), error/outcome model, security threat model, determinism, documentation, adversarial review.

**Out of scope:** AI/semantic analysis, automatic test execution, external process/network access,
automatic remediation or evidence generation, Workflow-gate wiring, `close()` integration, Hook
payload changes (`verify.completed`'s `operation.result` stays exactly the legacy structural report),
Review-as-product, a conversational interface, Entrega 8.

## Relationship to Entregas 1–6

- **Entrega 1–3**: `VerifiableRequirement` wraps Entrega 3's `Requirement` shape unmodified;
  Verification Context reuses `loadChangeUnified()`/`explain()`, never a fourth Change loader.
- **Entrega 4**: Verification Context is built the same way Hook Context is (Entrega 6's own
  "non-fetching where the caller already computed it" precedent) — `verify()` already computes
  `change`/`workflow`/`sdd` once (added in Entrega 6 for the Post-Verify Hook); this Entrega reuses
  that exact value, adding zero new `explain()` calls for the `--change` path, and building it once
  (same call) for the whole-project path when `--requirements` is passed.
- **Entrega 5**: no Skill is invoked by any Verification Rule — Verification is a peer capability, not
  a Skill consumer, avoiding a Verification→Skill→Hook (or reverse) coupling with no evidenced need.
- **Entrega 6**: `verify.completed`'s existing contract (`operation.result` = the legacy structural
  `report`) is preserved byte-for-byte; the Post-Verify Next Action Hook needs no change.

## Relationship to ADR-013 (no capability without removal/merge)

This Entrega **prepares a merge, deferred, not performed**: today, `close()`'s
`checkChangeReadiness()` and `aief verify`'s structural rules already share one implementation
(Change 0043's own consolidation). Requirement Verification is *additive* to that pair, not a third
diverging implementation — but it is **not** wired into `close()`'s own readiness check this Entrega
(see "Close integration," below), so the merge ADR-013 would otherwise require is recorded as a
future obligation, exactly as ADR-017 recorded `propose()`'s un-rewired OpenSpec logic.

## Compatibility

- `aief verify` (no `--requirements`) is byte-identical to Entrega 6's output, including exit code.
- `close`, `propose`, `status`, `status --next`, `prompt`, `prompt --skill`, Skills Runtime, Hooks
  Runtime, WorkflowService, SDD Provider are all untouched — zero diff lines.
- `verify.completed`'s Hook contract (`operation.result` = legacy `report`) is unchanged.
- No new persisted state; no new write path; no new command verb; no migration.

## Risks

- **A citation-based traceability rule could be seen as encouraging "citation theater"** (an id
  mentioned without real coverage) — mitigated by the rule's own honest naming and documentation:
  it proves *consideration*, explicitly not *compliance*, and `design.md`/`spec.md` state this
  distinction as a hard requirement (never phrase the result as "requirement satisfied").
- **`evidence.md` remaining unstructured** means no rule can ever cite it as `file_assertion`-grade
  evidence for a *specific* requirement — an accepted, deliberate limitation (see "evidence.md",
  below), not a gap this Entrega tries to paper over.
- **Two rules is a thin initial set** — accepted, matching Skills'/Hooks' own two-rule/two-Hook
  precedent; a third rule requires the same evidence-grounding bar, not headcount.

## Security

Full threat model in `design.md` §11. Summary: `evidence-reference-integrity` is the rule
specifically built to exercise path-containment (Change 0045's `isPathWithin()`, reused, not
reimplemented) and reports (never silently ignores) an out-of-bounds reference as `invalid`. No
Verification Rule executes a command, reaches the network, or writes a file — `writeFiles`/
`executeCommands`/`network: true` are registry-rejected, identical mechanism to Skills'/Hooks'
`FORBIDDEN_CAPABILITIES`. Repository content (a requirement's own text, `verification.md`'s prose)
reaching a rule's output is treated as data — a rule's `summary`/`findings` never echo raw content as
if it were a runtime instruction. The Entrega-3 symlink-escape gap is not expanded: Verification
Context's one new read (`verification.md`) uses a fixed filename under an already-resolved,
already-trusted `changeDir` — no user-controlled path component, no new class of risk.

## `evidence.md`

Confirmed by inspection: narrative, human-authored, template-guided (`evidenceTemplate()`, `cli.js`),
classified by a whole-document heuristic (`classifyEvidence()`), never structured, never
per-requirement. This Entrega does **not** make it authoritative for rule evaluation and does **not**
introduce a parallel structured evidence file — Option A ("consume, validate, normalize; do not
generate; do not modify") is adopted in full. `evidence.md` stays exactly what it is today: a human
document `prompt()` guards against accidental overwrite (Entrega 1) and `classifyEvidence()`
heuristically classifies (Entrega 1) — Verification Rules never read it as a source of per-requirement
evidence this Entrega, only `verification.md`'s citation pattern and SDD-normalized artifact state
are used.

## Alternatives considered

- **Invent a requirement↔task/test linking convention and retrofit it.** Rejected — would require
  editing four already-closed Changes' `spec.md`/`tasks.md` files to adopt a convention invented after
  the fact, and would misrepresent every Change closed before this Entrega as "non-compliant" by a
  rule that didn't exist when they were written. Exactly the failure mode ADR-008's evidence
  discipline exists to prevent.
  - **A structured `evidence.json`/`evidence.yaml` file (Evidence Model Option B).** Rejected this
  Entrega — no real authoring gap justifies the new persistence surface yet; `verification.md`'s
  existing citation pattern already provides real signal without a new file format or a migration for
  Changes 0043-0048.
- **Wire `--requirements` results into `close()`'s readiness check.** Rejected — `close()` is the
  write-critical path; Entrega 6 already deferred Hook integration there for the same reason, and
  nothing about Requirement Verification's newness changes that risk calculus this Entrega.
- **A class-based `VerificationRule` interface.** Rejected — zero classes exist anywhere in
  `cli/src/`; Verification Rules mirror the same plain-module pattern as `requirement-providers/`/
  `sdd-providers/`/`skills/`/`hooks/`.

## Success criteria

- Every Verification Rule and Evidence type is grounded in real, cited, existing repository behavior
  — not an invented convention imposed retroactively on Changes 0043–0048.
- `aief verify` without `--requirements` is byte-identical to Entrega 6's output, including exit code.
- `verify.completed`'s Hook contract is unchanged.
- Workflow-gate and `close()` integration are explicitly evaluated and deferred with reasoning.
- No new public command verb; ADR-015 respected.
- Registry/Context/Service/Result are each demonstrated against real, reused-not-duplicated data
  sources — never a fourth computation of a fact Entregas 1–6 already compute once.
