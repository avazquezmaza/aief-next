# Specification — Entrega 7: Verification Engine

## Goal

For each requirement a Change declares, a deterministic, evidence-grounded verdict (never AI, never
test execution, never network) can be computed — distinguishing "evidence exists and passes,"
"evidence exists and fails," "no evidence yet," "the check doesn't apply," "the capability needed
isn't available," and "the input itself is broken" — aggregated into one honest Change-level status,
reachable only through `aief verify`'s existing surface via a single opt-in flag, without changing
`aief verify`'s default output, exit code, or `verify.completed`'s Hook contract, and without any
rule approving a gate, closing a Change, or claiming evidence that was never actually found.

## Requirements

### Structural vs. Requirement Verification boundary

- **VR-R1 — Structural Verification (`change-verifier.js`) is untouched.** Zero diff lines this
  Entrega; `checkChangeReadiness()`/`verifyProject()`/`verifyChange()` keep their exact current
  behavior, byte-for-byte.
- **VR-R2 — Requirement Verification never re-derives a structural fact** — `missing`/`empty`/
  `evidenceState`/`statusState` are read from the same already-loaded Change object Structural
  Verification uses, never recomputed a second way.
- **VR-R3 — Review remains explicitly out of scope.** No Verification Rule interprets, summarizes, or
  communicates a verdict to a human beyond its own structured result fields — that composition is
  Entrega 8's job.

### Evidence Model

- **VR-R4 — Six named evidence types, two supported this Entrega**: `artifact_state` (reuses the SDD
  Provider's own normalized states, Entrega 3) and `file_assertion` (a Change-relative path,
  containment-checked, resolved to a real filesystem state) are SUPPORTED; `test` and
  `manual_attestation` are DEFINED but never sufficient alone (`test`: no reliable requirement↔test
  link exists yet, UNSUPPORTED; `manual_attestation`: inherently unverifiable, informational only);
  `command_result` and `external_reference` are REJECTED this Entrega (require execution/network).
- **VR-R5 — An evidence item's structure is `{type, ref, source, confidence}`.** `ref` is
  type-specific (a path for `file_assertion`, an SDD artifact key for `artifact_state`); `source`
  names where it was found (`verification.md`, SDD provider); `confidence` is `"deterministic"` for
  the two supported types, `"unverifiable"` for `manual_attestation` — never a numeric score (no
  false precision).
- **VR-R6 — Absence of evidence is never treated as passing evidence.** A rule with no evidence to
  evaluate returns `blocked` (missing evidence, applicable) or `not_applicable`/`unsupported` per
  VR-R20 — never `passed`.
- **VR-R7 — `manual_attestation` alone can never produce a `passed` rule result** — it may only
  contribute to `warnings`, never to a `passed` verdict, enforced by the Verification Service, not by
  a rule's own discipline.

### Requirement Verification Model

- **VR-R8 — The SDD Provider's `Requirement` contract (`{id, title, text, source}`, Entrega 3) is not
  modified.** Verification wraps it: `VerifiableRequirement` is `{requirement, evidenceRefs,
  ruleResults}` — a new shape, referencing the original by `id`, never mutating it.
- **VR-R9 — No requirement↔task/test link is invented.** `Task.requirements` (always `[]`, SDD-R21)
  is read as-is, never populated by a heuristic guess.

### Verification Rule, descriptor, identity, versioning

- **VR-R10 — One descriptor shape, functional, not a class.** Every rule is a plain exported object,
  no `class VerificationRule`, mirroring `requirement-providers/*.js`/`sdd-providers/*.js`/
  `skills/*.js`/`hooks/*.js`.
- **VR-R11 — `id`/`version` reuse the same stable rules Skills/Hooks already use** (ADR-019's
  `ID_PATTERN`/`VERSION_PATTERN`) — not reinvented a third time.
- **VR-R12 — `scope` declares what a rule evaluates**: `"requirement"` (evaluated once per
  requirement) is the only scope this Entrega ships; a `"change"`-scoped rule (evaluated once per
  Change) is a defined, unused vocabulary slot for a future rule that doesn't need a specific
  requirement (forward-compatible, same "adopted but unused" treatment as Skills'
  `deterministicExecution`).
- **VR-R13 — Every rule declares `capabilities` explicitly**, one boolean per capability
  (`design.md` §7) — absence is denial, identical discipline to every prior Entrega's own registry.

### Capabilities and effects (restrictive by default)

- **VR-R14 — `writeFiles`/`executeCommands`/`network: true` cannot be registered** — the Verification
  Registry rejects any descriptor claiming one of these three, at module-load time, identical
  mechanism to Skills'/Hooks' `FORBIDDEN_CAPABILITIES`.
- **VR-R15 — `assistantRequired: true` cannot be registered either** — Requirement Verification is
  AI-free by design this Entrega (the commissioning instruction's own Model C exclusion); a rule
  requiring an assistant is a Model-C-shaped rule, rejected the same way.
- **VR-R16 — A rule's declared `effects` are always `[]` this Entrega** — identical mechanism and
  reasoning to Skills' SK-R7/Hooks' HK-R13.
- **VR-R17 — A rule cannot mutate its received context, requirement, or evidence.** All three are
  frozen before being handed to a rule; a mutation attempt throws, caught by the Verification Service,
  surfaced as `status: "error"` for that rule only (mirrors the frozen-context discipline Skills/Hooks
  already established).

### Registry

- **VR-R18 — One static registry, mirroring `requirement-providers/index.js`/`sdd-providers/
  index.js`/`skills/index.js`/`hooks/index.js` exactly**: a plain, statically-imported module list,
  `hasRule(id)`, `getRule(id)`, `ruleIds()`, `rulesForScope(scope)` — no directory scan, no dynamic
  `import()`.
- **VR-R19 — Duplicate `id` and invalid descriptors are rejected at registry-construction time** —
  same mechanism as SK-R9/R10, HK-R16/R17.
- **VR-R20 — Rule ordering is deterministic** — id, alphabetical, the registry's own literal array
  order — never filesystem order (mirrors SK-R30/HK-R19; no numeric priority, no real tie-breaking
  case exists among the two initial rules).

### Verification Context

- **VR-R21 — The Verification Context reuses `workflow-service.js`'s `explain()`** for `change`/
  `workflow`/`sdd` — never a fourth independent computation of those facts (mirrors HK-R20's
  discipline, restated for Verification).
- **VR-R22 — Context adds exactly one new, safe file read**: `verification.md`'s raw content, read
  from a fixed filename under the already-resolved, already-trusted Change directory (no
  user-controlled path component — the same trust level as `change.md`/`spec.md`, not a new class of
  risk). Missing `verification.md` is `null` content, never an error (many older Changes predate this
  session's own convention).
- **VR-R23 — Context shape is `{project, change, workflow, sdd, requirements, tasks,
  verificationDoc, operation}`.** `requirements`/`tasks` are the SDD Provider's own already-parsed
  arrays (`context.sdd.requirements`/`.tasks`, unedited); `verificationDoc` is VR-R22's raw content
  (or `null`); `operation` is `{input, result}`, the calling operation's own already-computed values.
- **VR-R24 — Building a Verification Context performs zero re-derivation of Workflow/SDD facts**
  beyond the one new file read named in VR-R22 — verified by a call-count assertion, not only
  byte-comparison (mirrors HK-R22's reasoning).
- **VR-R25 — Manifest errors, provider errors, and SDD readiness states reaching Verification Context
  are preserved exactly as `explain()` already carries them** — never re-classified.

### Applicability and results

- **VR-R26 — `appliesTo(context, requirement)` is deterministic and AI-free** — same discipline as
  SK-R19/HK-R28.
- **VR-R27 — Seven distinguishable per-rule `status` values**: `passed`, `failed`, `not_applicable`,
  `blocked`, `unsupported`, `invalid`, `error` — never collapsed. `failed` is a genuine new concept
  relative to Skills/Hooks: it is the first capability in this system whose whole job is to render a
  real pass/fail *verdict* about a requirement, not just an observational status.
- **VR-R28 — `error` is reserved for an unexpected engine fault** (a rule's `evaluate()` throwing),
  distinguished from `invalid` (a descriptor/input/evidence-reference problem known before
  evaluation) and from `failed` (the rule ran correctly and determined the requirement's evidence is
  insufficient or contradictory) — three different kinds of "not passed," never merged.
- **VR-R29 — A rule's `appliesTo()` may only select `not_applicable`/`blocked`/`unsupported` for its
  non-applicable outcome** — the Verification Service whitelists exactly these three, applied
  proactively (the same fix Entrega 5's review found reactively for Skills, restated proactively here
  as it was for Hooks' HK-R31).
- **VR-R30 — Missing evidence is `blocked`, never `passed` and never silently `not_applicable`** when
  the rule's own condition for applicability is met but no evidence was found (VR-R6 restated as a
  status-selection rule).

### Result model

- **VR-R31 — One normalized per-rule result shape**: `{rule, requirement, status, summary, findings,
  evidence, missingEvidence, warnings, errors, effects}`. `rule`/`requirement` are always set by the
  Verification Service from the descriptor/requirement actually evaluated — never taken from a rule's
  own return value (mirrors SK-R7/HK-R32's "the Service decides, never the reaction" discipline).
- **VR-R32 — `evidence`/`missingEvidence` are always arrays, never inferred from `status` alone** — a
  human or future Review consumer can answer "what evidence was found" and "what's missing" without
  re-deriving it from the status string.
- **VR-R33 — `effects` is always `[]` this Entrega**, identical mechanism to SK-R7/HK-R13.

### Aggregation

- **VR-R34 — Five overall statuses, checked in a fixed precedence order**: `ERROR` (any rule
  `error`) > `INVALID` (any rule `invalid`, or a structurally invalid input) > `FAIL` (structural
  `passed: false`, or any rule `failed`) > `INCOMPLETE` (no failure, but at least one rule `blocked`)
  > `PASS` (structural passed, every applicable+supported rule `passed`, nothing blocked). The first
  matching condition, in this order, wins — never a simple boolean AND/OR of individual results.
- **VR-R35 — `not_applicable`/`unsupported` never affect the overall status** — they are informational
  exclusions, not failures and not passes.
- **VR-R36 — `INCOMPLETE` is a legitimate, honest outcome** — missing evidence must never be silently
  rounded up to `PASS` (mirrors VR-R6/R30 at the aggregate level).
- **VR-R37 — Per-requirement results are preserved in the aggregated output**, not collapsed into
  only the overall status — a caller can always answer "which specific requirement, which specific
  rule, why."

### Verification Service

- **VR-R38 — `evaluateRequirements(context)` -> aggregated Verification Result.** Resolves
  `context.requirements` (VR-R23), resolves each rule via `rulesForScope("requirement")` (VR-R20's
  order), builds nothing itself (context is passed in, VR-R21/R24), checks applicability per
  requirement per rule, applies capability policy, evaluates purely, normalizes, aggregates
  (VR-R34).
- **VR-R39 — No test is executed, no command is run, no network call is made** — structurally
  impossible (VR-R14/R15), not merely a convention.
- **VR-R40 — `evaluateRequirements()` is a pure function of its inputs** — same context, same
  requirements, same aggregated result, every call.

### `aief verify` integration

- **VR-R41 — `aief verify` without `--requirements` is byte-identical to Entrega 6's output**,
  including exit code, for every invocation shape (`--change <id>` and whole-project).
- **VR-R42 — `--requirements` is the one new, justified flag.** `--evidence`/`--json` are evaluated
  and deferred (no named consumer, mirrors WF-R16/UX-R28/SK-R28's own precedent) — not adopted this
  Entrega.
- **VR-R43 — With `--requirements`, the legacy structural report renders first, unchanged**, followed
  by an additive Requirement Verification section — never interleaved, never replacing the legacy
  lines.
- **VR-R44 — Exit code with `--requirements`**: `0` for aggregate `PASS`/`INCOMPLETE` (an honest,
  actionable answer — mirrors Normalized Action's `blocked`/`pending` precedent, ADR-018 §3); `1` for
  `FAIL`/`INVALID`/`ERROR`. Without `--requirements`, exit code is governed entirely by the legacy
  structural result, unchanged (VR-R41).
- **VR-R45 — `--requirements` triggers zero additional `explain()` calls for the `--change <id>`
  path** — reuses the same `explainWorkflow()` call Entrega 6 already added there for the Post-Verify
  Hook (VR-R21).

### Hooks integration

- **VR-R46 — `verify.completed`'s `operation.result` remains exactly the legacy structural `report`
  object**, whether or not `--requirements` was passed — Requirement Verification's aggregated result
  is not plumbed into the Hook event this Entrega (no shipped Hook needs it; inventing an unused field
  is exactly the kind of unjustified addition this project's discipline avoids).
- **VR-R47 — No Verification Rule invokes the Hook Service, and the Hook Service never invokes
  Verification** — no new coupling direction is introduced (mirrors HK-R38's recursion-prevention
  reasoning, restated for the third capability).

### Workflow relationship

- **VR-R48 — No `verification` Workflow gate is introduced this Entrega** — `gate-evaluator.js`/the
  three workflow definition JSONs gain zero diff lines; the decision is evaluated and deferred
  (`design.md` §9), not even prepared-inert the way Entrega 3's `specification` gate was.
- **VR-R49 — No Verification Rule or Service function can change `track`/`stage`, approve a gate, or
  execute a transition** — no such method exists in any contract this Entrega defines (enforced by
  absence, mirrors UX-R21/HK-R "no Hook approves a gate").

### `close()` relationship

- **VR-R50 — `close()` gains no integration this Entrega.** Zero diff lines in `close()`/
  `markClosed()`/`checkChangeReadiness()`; the decision is evaluated and deferred (`design.md` §10),
  mirroring Entrega 6's own `close.requested` deferral.

### Security

- **VR-R51 — No Verification Rule reads the filesystem directly** except through the one guarded
  mechanism `file_assertion` evidence uses (path-contained, reusing Change 0045's `isPathWithin()`
  fix) — never an arbitrary, rule-authored `fs.*` call.
- **VR-R52 — Path traversal in an evidence reference is rejected**, reusing Change 0045's fix,
  unchanged, exercised again through `evidence-reference-integrity`.
- **VR-R53 — The inherited Entrega-3 symlink-escape gap is not expanded** — the one new read
  (VR-R22) uses a fixed filename with no user-controlled component; `file_assertion` evidence reuses
  the SDD Provider's own existing (non-symlink-aware) read path, not a new one.
- **VR-R54 — Repository content (`verification.md` prose, a requirement's own text) reaching a rule's
  output is treated as data, never as a runtime directive** — no rule's `summary`/`findings` echoes
  raw content in a way that could be mistaken for an instruction to the engine itself.
- **VR-R55 — A manipulated/duplicated rule `id` or requirement `id` never resolves to an unintended
  rule or requirement** — resolution is a static-object/array lookup by exact string match (mirrors
  SK-R35/HK-R43).

### Determinism, compatibility, rollback

- **VR-R56 — `status`, `status --next`, `close`, `propose`, Skills Runtime, Hooks Runtime,
  WorkflowService, SDD Provider are byte-unchanged** (`git diff` contains zero lines touching any of
  them).
- **VR-R57 — No new persisted state; no new write path.**
- **VR-R58 — No existing command's exit-code behavior changes** beyond `--requirements`'s own new,
  opt-in policy (VR-R44).
- **VR-R59 — Rollback is a plain code revert** — every artifact this Entrega adds is new, or a small
  additive edit to `verify()`'s existing flow.

### Assistant neutrality

- **VR-R60 — Every Verification Service/Rule function is callable identically by a human, a script,
  or any assistant** — no contract or `capabilities` depends on which AI (if any) is driving the CLI.

## Acceptance Criteria

- [x] VR-R1–R3 (boundary): zero diff lines in `change-verifier.js`; no structural re-derivation; no
      rule interprets/communicates beyond its own fields.
- [x] VR-R4–R7 (evidence model): exactly six typed evidence kinds, two supported; absence never
      passes; `manual_attestation` never sufficient alone.
- [x] VR-R8–R9 (requirement model): `Requirement` contract unmodified; no invented task/test link.
- [x] VR-R10–R13 (rule descriptor): plain object, no class; shared id/version rules; `scope`
      vocabulary; explicit capabilities.
- [x] VR-R14–R17 (capabilities/effects): forbidden capabilities and `assistantRequired` rejected at
      registration; `effects` always `[]`; frozen inputs, mutation caught safely.
- [x] VR-R18–R20 (registry): mirrors existing registries exactly; duplicate/invalid rejected at load;
      deterministic order.
- [x] VR-R21–R25 (context): reuses `explain()`; exactly one new safe read; exact shape; zero
      re-derivation (call-count assertion); errors/readiness preserved.
- [x] VR-R26–R30 (applicability/results): deterministic, AI-free; seven statuses; `error` vs.
      `invalid` vs. `failed` distinguished; non-applicable status whitelist; missing evidence never
      passes.
- [x] VR-R31–R33 (result model): one shape, Service-owned `rule`/`requirement`; evidence/missing
      arrays always present; `effects` always `[]`.
- [x] VR-R34–R37 (aggregation): five statuses, fixed precedence; not_applicable/unsupported excluded;
      INCOMPLETE preserved honestly; per-requirement detail retained.
- [x] VR-R38–R40 (service): resolve/order/apply/aggregate; zero execution/network; pure function.
- [x] VR-R41–R45 (`verify` integration): byte-identical without the flag; one new flag only; additive
      render order; opt-in exit-code policy; zero new `explain()` calls.
- [x] VR-R46–R47 (Hooks): `verify.completed` contract unchanged; no new Verification↔Hook coupling.
- [x] VR-R48–R49 (Workflow): zero gate wiring; no gate/stage/track mutation method exists.
- [x] VR-R50 (`close`): zero diff lines.
- [x] VR-R51–R55 (security): no direct filesystem access outside the guarded path; traversal
      rejected; symlink debt not expanded; content never a directive; static id resolution only.
- [x] VR-R56–R59 (compatibility/determinism/rollback): named commands/subsystems untouched; zero new
      state/writes/unapproved exit-code changes; plain revert.
- [x] VR-R60 (assistant neutrality): grep-confirmed no assistant-specific branching.
- [x] `npm test` (from `cli/`) passes with zero modified assertions not directly justified by a cited
      requirement.
- [x] (human) Approve ADR-021, `spec.md` and `design.md`, or amend any of them.
- [x] (review) Independent review before implementation begins.
