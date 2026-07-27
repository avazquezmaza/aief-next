# Specification — Entrega 6: Hooks Runtime

## Goal

A small, fixed set of internal, versioned Hooks can be registered once, resolved deterministically,
ordered deterministically, matched against a closed two-event catalog grounded in real CLI emission
points, evaluated purely (never writing, never executing a command, never reaching the network), and
— for exactly one allowlisted case — invoke the Skill Service (Entrega 5) without bypassing its
enforcement, all without any Hook redefining what a gate/transition/provider/readiness/Change
selection means, and without `status`/`status --next`/`close`/`propose`/`prompt`/`prompt --skill`/
`verify`'s PASS-FAIL changing behavior for any Change without an applicable Hook result.

## Requirements

### Event contract and catalog

- **HK-R1 — A closed, two-event catalog this Entrega**: `prompt.prepared` and `verify.completed`,
  each with a confirmed CLI emission point (`design.md` §3) and `phase: "post"`. No other event is
  emitted, matched, or documented as active this Entrega.
- **HK-R2 — An event is `{id, phase, timestamp, operation}`.** `id` is one of the closed catalog's
  two values; `phase` is `"pre"` or `"post"` (only `"post"` is reachable this Entrega); `timestamp`
  is informational only — never used to order or deduplicate Hook results (SK-R-style determinism
  restated as HK-R14 below).
- **HK-R3 — An unknown event id is rejected** at the Hook Service boundary — a caller error (thrown),
  never silently matched against zero Hooks.
- **HK-R4 — `close.requested`/`change.closed`/`change.created`/`change.inspected` are not part of
  this Entrega's catalog.** Their real emission points are documented in `design.md` as identified,
  not adopted — a future Change may add them as a separate, explicit decision.

### Hook descriptor, identity, versioning

- **HK-R5 — One descriptor shape, functional, not a class.** Every Hook is a plain exported object,
  no `class Hook`, mirroring `requirement-providers/*.js`/`sdd-providers/*.js`/`skills/*.js`.
- **HK-R6 — `id` follows the same stable, kebab-case, unique-across-registry rule Skills already
  use (ADR-019's `ID_PATTERN`)** — reused, not reinvented.
- **HK-R7 — `version` is metadata only**, same discipline as SK-R3 — no semver library.
- **HK-R8 — `events` is a non-empty array of ids from the closed catalog (HK-R1) only.** A descriptor
  naming an event outside the catalog is rejected at registration.
- **HK-R9 — Every Hook declares `capabilities` explicitly**, one boolean per capability
  (`design.md` §5) — absence is denial, identical discipline to SK-R4/R5.

### Capabilities and effects (restrictive by default)

- **HK-R10 — `writeFiles`/`executeCommands`/`network: true` cannot be registered** — the Hook
  Registry rejects any descriptor claiming one of these three, at module-load time, identical
  mechanism to Skills' `FORBIDDEN_CAPABILITIES` (SK-R6).
- **HK-R11 — `block: true` is only ever honorable for a `phase: "pre"` event.** Since neither event in
  this Entrega's catalog is `"pre"` (HK-R1), no Hook this Entrega can produce an honored `blocking:
  true` result — the Hook Service enforces this regardless of what a Hook's own `evaluate()` returns,
  the same "the Service decides, never the reaction" discipline SK-R24 already established for
  Skills' `ready`/`completed`.
- **HK-R12 — A Hook that does not declare `capabilities.block: true` cannot return a non-empty
  `blockers` array** — the Hook Service strips it and records an error, never silently honoring it.
- **HK-R13 — A Hook's declared `effects` are always `[]` this Entrega** — identical mechanism and
  reasoning to SK-R7.
- **HK-R14 — `capabilities.invokeSkill: true` requires a non-empty, explicit `allowedSkills` array**
  in the descriptor; a Hook may only call the Skill Service for an `id` present in its own
  `allowedSkills` — an attempt to invoke any other Skill id is rejected by the Hook Service before the
  Skill Service is ever called.

### Registry

- **HK-R15 — One static registry, mirroring `requirement-providers/index.js`/`sdd-providers/
  index.js`/`skills/index.js` exactly**: a plain, statically-imported module list, `hasHook(id)`,
  `getHook(id)`, `hookIds()`, `hooksForEvent(eventId)` — no directory scan, no dynamic `import()`.
- **HK-R16 — Duplicate `id` is rejected at registry-construction time** — same mechanism as SK-R9.
- **HK-R17 — An invalid descriptor is rejected at registry-construction time** (missing `id`, missing
  `capabilities`, an event outside the catalog, `invokeSkill: true` with no `allowedSkills`, or
  HK-R10's forbidden-capability case).
- **HK-R18 — `getHook()` for an unknown `id` returns a distinguishable "not found," never
  `undefined` propagated silently** — same discipline as SK-R11.
- **HK-R19 — Hook ordering is deterministic and documented** — id, alphabetical, the registry's own
  literal array order — never filesystem order, never registration-timing-dependent (mirrors SK-R30;
  no numeric priority is introduced this Entrega, since no real case among the two initial Hooks
  needs tie-breaking beyond alphabetical `id`).

### Hook Context

- **HK-R20 — The Hook Context Builder never re-derives `change`/`workflow`/`sdd` — it accepts
  already-computed values from the calling operation** (`prompt()`/`verify()`), which themselves
  already called `workflow-service.js`'s `explain()`/the Skill Context Builder for their own
  rendering — a second `explain()`/`buildSkillContext()` call within the same CLI invocation is a
  defect, not a stylistic preference (contrast with the Skill Context Builder, which *does* fetch —
  documented explicitly in `design.md` §4 so the asymmetry is intentional, not an inconsistency).
- **HK-R21 — Context shape is `{event, project, change, workflow, sdd, skill, operation}`.** `skill`
  is `null` unless the triggering CLI operation already ran a Skill itself (e.g. `prompt --skill`)
  and is that Skill's already-computed Normalized Result, read-only — never re-invoked by the Hook
  Context Builder. `operation` is `{input, result}` — whatever the calling operation already computed
  (e.g. `verify.completed`'s `operation.result` is the `report` object; `prompt.prepared`'s
  `operation.result` is `null`, since nothing has rendered yet).
- **HK-R22 — Building a Hook Context performs zero additional file reads or provider calls** beyond
  what the calling operation already did — verified by a call-count/spy assertion, not only by
  byte-comparison (byte-comparison alone cannot distinguish "zero new reads" from "same reads
  performed twice").
- **HK-R23 — Manifest errors, provider errors, and SDD readiness states reaching Hook Context are
  preserved exactly as the calling operation's own already-computed `workflow`/`sdd` values carry
  them** — never re-classified, never silently downgraded to a healthier-looking state.

### Hook Service

- **HK-R24 — `evaluateEvent(event, context)` -> aggregated Hook results.** Resolves every Hook
  registered for `event.id` (via `hooksForEvent`), in HK-R19's deterministic order, builds nothing
  itself (context is passed in, HK-R20), checks each Hook's `appliesTo(event, context)`, applies
  capability policy, calls `evaluate(event, context)` (and the Skill Service, if `invokeSkill` and
  allowlisted), normalizes each into a Hook Result, and aggregates.
- **HK-R25 — Aggregation is deterministic**: results are returned in the same order Hooks were
  evaluated (HK-R19); a final `warnings`/`blockers` list is the concatenation of every individual
  Hook's own (capability-filtered) contribution, in that same order — never re-sorted, never
  deduplicated by content.
- **HK-R26 — `evaluateEvent()` is distinct from any future effect-executing call** — nothing in this
  Entrega's Hook Service can cause a Hook's `evaluate()` result to trigger a write, a command, or a
  network call; no such capability can even be registered (HK-R10).
- **HK-R27 — No Event Bus, no listener registration, no async dispatch, no background job.**
  `evaluateEvent()` is a synchronous, pure-input function — same discipline as `runSkill()`.

### Applicability and results

- **HK-R28 — `appliesTo(event, context)` is deterministic and AI-free** — same discipline as SK-R19.
- **HK-R29 — Six distinguishable `status` values**: `matched`, `not_applicable`, `blocked`,
  `unsupported`, `invalid`, `failed` — never collapsed, and never including a `completed`-shaped
  value (a Hook does not "execute," it evaluates — `matched` is its terminal success state, the
  direct analog of Skills' `ready`).
- **HK-R30 — A non-applicable Hook returns a normalized result, never throws** — same discipline as
  SK-R21.
- **HK-R31 — A Hook's `appliesTo()` may only select `not_applicable`/`blocked`/`unsupported` as its
  non-applicable status** — the Hook Service whitelists exactly these three, exactly the fix Entrega
  5's own adversarial review applied to Skills (SK-R20-equivalent, restated here proactively rather
  than found again by a future review).
- **HK-R32 — One normalized result shape**: `{hook, event, status, blocking, summary, warnings,
  blockers, instructions, skillResults, evidence, errors, effects}`. `hook`/`event` are always set by
  the Hook Service from the descriptor/event actually invoked — never taken from a Hook's own return
  value (mirrors SK-R7's "the Service decides, never the reaction" discipline for `skill`/`version`).
- **HK-R33 — A post-phase Hook cannot retroactively alter the operation it observed.** No field in
  the Hook Result or any Hook Service function can change `operation.result`, re-run the operation, or
  change its exit code — a Hook failing (`status: "failed"`) never flips a `verify` PASS to FAIL or
  vice versa.
- **HK-R34 — `failed` is reserved for an unexpected runtime error**, caught and structured by the Hook
  Service (never an uncaught exception) — distinguished from `invalid` (a descriptor/context problem
  known before invocation).

### Skill integration

- **HK-R35 — A Hook never imports a Skill module directly** — every Skill-shaped fact reaches a Hook
  only through the Skill Service's own `runSkill()`/`listSkills()`, called by the Hook Service on the
  Hook's behalf (never by the Hook itself), per HK-R14's allowlist.
- **HK-R36 — A Hook cannot alter a Skill's context or falsify its result.** The Hook Service passes
  the Skill Service's returned Normalized Skill Result through unedited into `skillResults`; nothing
  in the Hook Service or a Hook's own `evaluate()` can change a Skill's `status`/`instructions`/
  `effects` after the fact.
- **HK-R37 — A Skill's `ready` status is never re-reported as `completed` by a Hook** — the same
  distinction SK-R24 already enforces at the Skill Service layer is preserved, not re-derived, when
  a Hook Result embeds a `skillResults` entry.
- **HK-R38 — Hook→Skill→Hook recursion is structurally impossible.** The Skill Service does not emit
  events and has no reference to the Hook Service — confirmed by inspection (Entrega 5's
  `skill-service.js` imports nothing from a Hook module, and this Entrega adds no such import).

### Security

- **HK-R39 — No Hook reads the filesystem directly** — same discipline as SK-R32; all file-derived
  facts reach a Hook only through the already-computed `context` (HK-R20/R21).
- **HK-R40 — Path traversal remains rejected** through any Hook that consumes `context.sdd` — reuses
  Change 0045's fix, unchanged, exercised again via the same fixture pattern as Entrega 4/5.
- **HK-R41 — The inherited Entrega-3 symlink-escape gap is not expanded.** No Hook this Entrega
  performs a new filesystem read of any kind — confirmed by inspection and restated as a design
  constraint (`design.md` §11), not merely observed.
- **HK-R42 — Repository content (a requirement's title, a Change's spec text) reaching a Hook's
  output is treated as data, never as a runtime directive** — same fencing/labeling discipline
  Skills' `requirements-analysis-instructions` already established, reused via `skillResults`
  passthrough (HK-R36), never re-rendered by a Hook itself.
- **HK-R43 — A manipulated/duplicated Hook `id` or event `id` never resolves to an unintended Hook**
  — resolution is a static-object lookup by exact string match (mirrors SK-R35).

### `prompt` integration

- **HK-R44 — `prompt.prepared` is emitted after every existing context block is computed, before the
  final render** — Hook results are strictly additive, appended after `skillSection`, each in its own
  clearly-labeled section (`hook: <id>`).
- **HK-R45 — `prompt` without any applicable Hook result is byte-identical to Entrega 5's output** —
  true for every real Change in this repository today (none carries `sdd`).
- **HK-R46 — `prompt --skill <id>`'s own behavior and output are unchanged** by this Entrega — Hook
  results are appended after, never instead of, the Skill section.

### `verify` integration

- **HK-R47 — `verify.completed` is emitted after the `report` object is computed, before
  `renderReport()` prints it** — a Hook result is one additional, clearly-labeled line appended after
  `renderReport()`'s own output.
- **HK-R48 — A Hook cannot change `verify`'s PASS/FAIL result or exit code** — `renderReport()`'s own
  `report.passed`-derived exit code is computed and set before any Hook result is even requested.

### `close` integration

- **HK-R49 — `close()` gains no event this Entrega.** No `close.requested`/`change.closed` event is
  emitted; `close()`'s behavior, output, and write path are entirely unchanged (verified by `git
  diff` showing zero lines touching `close()`/`markClosed()`).

### Compatibility, determinism, rollback

- **HK-R50 — `status`/`status --next`/`propose` are byte-unchanged** (`git diff` contains zero lines
  touching those functions).
- **HK-R51 — No new persisted state; no new write path.**
- **HK-R52 — No existing command's exit-code behavior changes** beyond `prompt --skill`'s own
  existing policy (Entrega 5, unmodified).
- **HK-R53 — Every Hook Service function is a pure function of its inputs** — same event/context,
  same aggregated result, every call.
- **HK-R54 — Hook listing/ordering/aggregation never depends on filesystem order, object-property
  enumeration order left undocumented, global mutable state, or a timestamp** — `event.timestamp` is
  informational only (HK-R2).
- **HK-R55 — Rollback is a plain code revert** — every artifact this Entrega adds is new, or a small
  additive edit to `prompt()`/`verify()`.

### Assistant neutrality

- **HK-R56 — Every Hook function is callable identically by a human, a script, or any assistant** —
  no Hook's contract or `capabilities` depends on which AI (if any) is driving the CLI.

## Acceptance Criteria

- [x] HK-R1–R4 (event catalog): exactly two events, both with confirmed emission points; an unknown
      event id rejected; the four not-adopted events documented, not wired.
- [x] HK-R5–R9 (descriptor): plain object, no class; `id`/`version` reuse Skills' validation rules;
      `events` restricted to the catalog; `capabilities` explicit.
- [x] HK-R10–R14 (capabilities/effects): forbidden capabilities rejected at registration; `block`
      only honorable for `phase: "pre"` (unreachable this Entrega); unauthorized blockers stripped;
      `effects` always `[]`; `invokeSkill` requires and enforces `allowedSkills`.
- [x] HK-R15–R19 (registry): mirrors existing registries exactly; duplicate/invalid descriptors
      rejected at load; unknown id lookup distinguishable; deterministic order.
- [x] HK-R20–R23 (context): built from already-computed values, never re-derived; exact shape;
      zero additional reads (call-count assertion); errors/readiness preserved unedited.
- [x] HK-R24–R27 (service): resolve/order/apply/aggregate; deterministic aggregation; no event bus,
      no async, no background job.
- [x] HK-R28–R34 (applicability/results): deterministic and AI-free; six statuses; non-applicable
      status whitelist; one result shape with Service-owned `hook`/`event`; post-phase cannot alter
      the observed operation; `failed` reserved for unexpected errors.
- [x] HK-R35–R38 (Skill integration): no direct Skill import; no context/result tampering; `ready`
      never becomes `completed`; Hook→Skill→Hook recursion structurally impossible.
- [x] HK-R39–R43 (security): zero direct filesystem access; traversal still rejected; symlink debt
      not expanded; repository content never a directive; static id resolution only.
- [x] HK-R44–R46 (`prompt` integration): correct emission point; byte-identical without an
      applicable result; `--skill` unaffected.
- [x] HK-R47–R48 (`verify` integration): correct emission point; PASS/FAIL/exit code unchanged.
- [x] HK-R49 (`close`): zero diff lines, no event emitted.
- [x] HK-R50–R55 (compatibility/determinism/rollback): `status`/`status --next`/`propose` untouched;
      zero new state/writes/exit-code changes; pure functions; deterministic ordering; plain revert.
- [x] HK-R56 (assistant neutrality): grep-confirmed no assistant-specific branching.
- [x] `npm test` (from `cli/`) passes with zero modified assertions not directly justified by a cited
      requirement.
- [x] (human) Approve ADR-020, `spec.md` and `design.md`, or amend any of them.
- [x] (review) Independent review before implementation begins.
