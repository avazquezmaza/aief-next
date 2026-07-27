# Specification — Entrega 5: Skills Runtime

## Goal

A small, fixed set of internal, versioned Skills can be registered once, resolved deterministically
by `id`, checked for applicability without AI, and consumed by `prompt` (this Entrega) — and,
unmodified, by Hooks/Verification/Review later — through one normalized contract and one normalized
result, without any Skill reading `cli.js`/OpenSpec/provider internals directly, without any Skill
writing a file, executing a command, or reaching the network, and without `status`/`verify`/`close`/
`propose`/`prompt`-without-`--skill` changing behavior.

## Requirements

### Descriptor, identity, versioning

- **SK-R1 — One descriptor shape, functional, not a class.** Every Skill is a plain exported object
  (mirrors `requirement-providers/*.js`/`sdd-providers/*.js`) — no `class Skill`, no factory,
  anywhere in `cli/src/`.
- **SK-R2 — `id` is a stable, lowercase-kebab-case string, unique across the registry.** Never
  derived from a filename at runtime beyond the registration site itself (mirrors
  `PROVIDERS`/`ADAPTERS`'s static object literal, not a directory scan).
- **SK-R3 — `version` is metadata only.** A non-empty string (`"1.0.0"`-shaped, unenforced format);
  no semver library; no multi-version resolution; changing a Skill's behavior means changing its
  `version` string, not running two versions side by side.
- **SK-R4 — Every Skill declares `capabilities` explicitly**, one boolean per capability
  (design.md §5's list) — a capability not present in the object is treated as `false`, never
  inferred from the presence of a method.

### Capabilities and effects (restrictive by default)

- **SK-R5 — Absence is denial.** The Skill Service never invokes `execute()` unless
  `capabilities.deterministicExecution === true`; never renders anything claiming a write/command/
  network occurred, because no capability this Entrega authorizes one to occur.
- **SK-R6 — `writeFiles`/`executeCommands`/`network: true` cannot be registered.** The Skill Registry
  validates every descriptor at registration time and rejects (throws, at module-load time — a
  registry bug, not a runtime outcome) any descriptor claiming one of these three capabilities as
  `true`. This is the concrete mechanism for "Model C is deferred," not a convention a Skill author
  could accidentally bypass.
- **SK-R7 — A Skill's declared `effects` are always `[]` this Entrega.** The normalized result's
  `effects` field exists in the contract (for forward compatibility with a future Model C) but every
  Skill this Entrega returns an empty array; the Skill Service asserts this and treats a non-empty
  `effects` array as `status: "invalid"` (a defect, not a normal outcome).

### Registry

- **SK-R8 — One static registry, mirroring `requirement-providers/index.js`/`sdd-providers/index.js`
  exactly**: a plain object of statically-imported Skill modules, `hasSkill(id)`, `getSkill(id)`,
  `skillIds()` — no directory scan, no dynamic `import()` of a path built from user input.
  Registration order is the object literal's own order — the same "deterministic, not alphabetized,
  not filesystem-ordered" precedent `providerIds()` already established.
- **SK-R9 — Duplicate `id` is rejected at registry-construction time**, not silently overwritten by
  "last one wins" and not deferred to first lookup.
- **SK-R10 — An invalid descriptor is rejected at registry-construction time** (missing `id`, missing
  `capabilities`, `capabilities.instructions !== true` with no `buildInstructions`, or SK-R6's
  forbidden-capability case) — the whole registry fails to load rather than exposing a
  partially-valid Skill.
- **SK-R11 — `getSkill()` for an unknown `id` returns a distinguishable "not found," never `undefined`
  silently propagated into a `TypeError` at a later call site.**

### Skill Context

- **SK-R12 — The Skill Context Builder calls `workflow-service.js`'s `explain()` — it never
  re-derives `change`/`workflow`/`sdd` facts independently.** No Skill Context field is computed by
  code outside `workflow-service.js`/`resolveSddProvider` (mirrors UX-R21–R23).
- **SK-R13 — Context adds exactly one field `explain()` does not already provide: `project`**
  (`detectProject()`'s existing output — signals, `packageJson` — the same input `recommendSkills()`
  already consumes) — everything else is `explain()`'s `change`/`workflow`/`sdd`/`action`, passed
  through, not copied or reshaped.
- **SK-R14 — Building a Skill Context is read-only and idempotent** — same Change, same inputs, same
  context, every call (byte-comparison test, same discipline as UX-R31/R17).
- **SK-R15 — A legacy Change (no `track`/`sdd`) builds a partial context** (`workflow: null`,
  `sdd: null` — `explain()`'s existing, unchanged behavior) — never a crash, never a fabricated
  Workflow/SDD opinion for a Change that never opted in.
- **SK-R16 — An invalid manifest produces an actionable context-build failure**, surfaced to the
  Skill Service as a distinguishable outcome (`status: "invalid"`), not silently treated as "no
  manifest" (mirrors UX-R24).
- **SK-R17 — An unknown or unavailable explicit SDD provider never falls back** through Skill Context
  construction (mirrors UX-R25) — `context.sdd`'s `error`/`readiness.status` fields carry the same
  distinctions `workflow-service.js` already makes (`error`, `"invalid"`, `"unsupported"`).
- **SK-R18 — Building N Skills' contexts for the same Change builds the context once, not N times.**
  The Skill Service calls the Context Builder once per Change per invocation and passes the same
  context object to every applicable Skill — never one `explain()` call per Skill (avoids the
  "two callers assumed to agree" risk Change 0043's B1 finding named).

### Applicability

- **SK-R19 — `appliesTo(context)` is deterministic and AI-free** — same context, same applicability
  answer, every call; no Skill's `appliesTo()` may call an external service, a language model, or
  read anything beyond the `context` object it was given.
- **SK-R20 — Applicability, capability-support, and blockage are three distinct outcomes, never
  collapsed.** `not_applicable` (this Skill's own declared condition — stage/track/provider — is not
  met), `unsupported` (the condition is met but the underlying capability the Skill needs is not
  supported by the resolved provider/workflow), and `blocked` (applicable and supported, but a
  precondition currently blocks a useful result — e.g., a required context field is `null`) are each
  a distinct `status` value, never merged into a single "can't do it" outcome (mirrors UX-R7's
  "six distinguishable outcomes" discipline, restated for Skills).
- **SK-R21 — A non-applicable Skill returns a normalized result, never throws.** `appliesTo()`
  returning `false` (or the Skill Service invoking a Skill outside its declared applicability) is a
  normal outcome (`status: "not_applicable"`), not an exception.

### Result model

- **SK-R22 — One normalized result shape** (design.md §7) for every Skill invocation, regardless of
  which capabilities that Skill declares — `{skill, version, status, summary, instructions,
  findings, artifacts, evidence, warnings, errors, effects}`.
- **SK-R23 — Seven distinguishable `status` values**: `ready`, `completed`, `not_applicable`,
  `blocked`, `unsupported`, `invalid`, `failed` — never collapsed into fewer.
- **SK-R24 — `ready` means instructions were built; `completed` means deterministic execution
  actually ran.** A Skill that only implements `buildInstructions()` can never reach `completed`; the
  Skill Service itself enforces this distinction (not left to each Skill's own discipline) — calling
  `buildInstructions()` alone always yields `ready` at most, never `completed`.
- **SK-R25 — `instructions` is never asserted as evidence that work occurred.** Every
  `buildInstructions()` result is rendered with framing text that states it is guidance, not a
  completion claim (mirrors UX-R10, restated for Skills, and enforced the same way — via the shared
  renderer, not per-Skill discipline).
- **SK-R26 — `failed` is reserved for an unexpected runtime error**, caught and structured by the
  Skill Service (never an uncaught exception reaching the CLI layer) — distinguished from `invalid`
  (a descriptor/input/context problem known before invocation) and from `blocked`/`unsupported`
  (expected, named preconditions).

### Errors

- **SK-R27 — Registry-construction errors (SK-R9/R10) are thrown, at module load time — never
  silently downgraded to a runtime `status`.** They are AIEF bugs (a Skill author's mistake caught
  before ship), not a per-invocation outcome a caller must handle.
- **SK-R28 — Every other named error condition (design.md §10's table: unknown Skill, non-applicable,
  blocked, unsupported capability, invalid input, context-build failure, forbidden effect attempted)
  maps to a specific `status` value or a specific CLI-layer message — never a generic
  "something went wrong."**
- **SK-R29 — An unknown `--skill <id>` is an actionable CLI error, exit 1** — never silently ignored,
  never falling back to "no Skill selected."

### Determinism

- **SK-R30 — Skill listing order is deterministic** (registry object literal order, mirrors SK-R8) —
  never filesystem order, never registration-timing-dependent.
- **SK-R31 — Every Skill Service function is a pure function of its inputs** (the loaded Change, the
  Skill Context, the invocation input) — same inputs, same result, every call (mirrors UX-R31).

### Security

- **SK-R32 — No Skill reads the filesystem directly.** Every file-derived fact reaches a Skill only
  through `context` (already built by the Context Builder, which already goes through
  `WorkflowService`/`resolveSddProvider`); a Skill module contains no `fs.*`/`path.resolve` call
  against a Change-controlled path.
- **SK-R33 — Path traversal remains rejected** through any Skill that consumes `context.sdd`
  (Change 0045's `isPathWithin()` fix, exercised again via `context.sdd.error`/`readiness.status`,
  never re-implemented).
- **SK-R34 — Repository content flowing into `buildInstructions()`'s output is treated as data, never
  as an instruction to the Skill Service itself.** Specification/requirement/artifact text
  containing directive-looking language (e.g., "ignore previous instructions") cannot change which
  Skill runs, which capabilities are honored, or what status is returned — it can only appear,
  inertly, as quoted content in the rendered instructions (the same trust boundary `prompt()`
  already has for `spec.md`/`tasks.md`).
- **SK-R35 — A malformed or manipulated `--skill` value never resolves to an unintended Skill or
  causes a dynamic `require`/`import` of an arbitrary path** — resolution is a lookup in `SK-R8`'s
  static object, by exact string match, nothing else.

### Workflow Engine and SDD Provider integration

- **SK-R36 — A Skill can read `stage`/`track`/`gates`/`blockers`/`warnings`/`nextAction` via
  `context.workflow`, but no Skill method can approve a gate, change `track`/`stage`, or execute a
  transition** — the contract has no such method (mirrors UX-R21).
- **SK-R37 — A Skill never fabricates SDD readiness from Workflow readiness or vice versa** —
  `context.workflow` and `context.sdd` stay distinct fields, exactly as `explain()` already keeps
  them (mirrors UX-R22).
- **SK-R38 — A Skill's `capabilities` are never privileged by which SDD provider is resolved** — a
  Skill declaring `capabilities.instructions: true` behaves identically whether `context.sdd`'s
  provider is `local` or `openspec` (mirrors UX-R23).

### `prompt` integration

- **SK-R39 — `prompt` without `--skill`/`--list-skills` is byte-identical to Entrega 4's output.**
- **SK-R40 — `--list-skills` lists every registered Skill's `id`/`title`/applicability for the
  resolved Change, performing zero writes** — read-only, same as every other `prompt` invocation.
- **SK-R41 — `--skill <id>` selects exactly one Skill; an unknown `id` is SK-R29's error; a
  non-applicable Skill's result is rendered honestly (`not_applicable`/`blocked`/`unsupported`), not
  silently omitted** — the human sees why nothing was added, not a blank `prompt` output.
- **SK-R42 — A Skill's rendered section is visually distinct from `prompt`'s existing blocks** (its
  own header, e.g. "Skill: <id> (<status>)") and never claims the Skill "ran," "completed
  implementation," or "verified" anything beyond what its actual `status` says.
- **SK-R43 — Selecting a Skill never suppresses or replaces `prompt`'s existing Workflow/SDD/
  standards/recommended-Skills blocks** — strictly additive, one more optional section.

### Compatibility

- **SK-R44 — `status`, `verify`, `close`, `propose` are byte-unchanged** (`git diff` contains zero
  lines touching those functions, per the same regression discipline as UX-R34).
- **SK-R45 — No new persisted state; no new write path beyond `close`'s existing one.**
- **SK-R46 — No existing command's exit-code behavior changes.**
- **SK-R47 — Rollback is a plain code revert** — every artifact this Entrega adds is new or a small
  additive edit to `prompt()`'s flag parsing; no data migration exists to undo.

### Assistant neutrality

- **SK-R48 — Every Skill function is callable identically by a human, a script, or any assistant** —
  no Skill's contract or `capabilities` depends on which AI (if any) is driving the CLI.

## Acceptance Criteria

- [x] SK-R1–R4 (descriptor/identity/versioning): plain object contract, no class; `id` uniqueness and
      `version` presence enforced at registry-construction time.
- [x] SK-R5–R7 (capabilities/effects): a descriptor claiming `writeFiles`/`executeCommands`/
      `network: true` fails to register; a non-empty `effects` array is treated as `invalid`.
- [x] SK-R8–R11 (registry): mirrors `requirement-providers/index.js`/`sdd-providers/index.js`;
      duplicate/invalid descriptors rejected at load; unknown `id` lookup is distinguishable.
- [x] SK-R12–R18 (context): built via `workflow-service.js`'s `explain()`, `project` added once,
      read-only, idempotent, partial for legacy Changes, built once per Change per invocation.
- [x] SK-R19–R21 (applicability): deterministic, AI-free, three distinct non-`ready` outcomes,
      never throws for a normal non-applicable case.
- [x] SK-R22–R26 (result model): one shape, seven statuses, `ready` vs. `completed` enforced by the
      Skill Service (not per-Skill discipline), `failed` reserved for unexpected errors.
- [x] SK-R27–R29 (errors): registry errors thrown at load; every other condition maps to a named
      status/message; unknown `--skill` is exit 1.
- [x] SK-R30–R31 (determinism): listing order fixed; every Skill Service function pure.
- [x] SK-R32–R35 (security): zero direct filesystem access from a Skill; path traversal still
      rejected; repository content never treated as a directive; `--skill` resolution is a static
      lookup only.
- [x] SK-R36–R38 (Workflow/SDD integration): no gate/stage/track mutation method exists; readiness
      fields stay distinct; capabilities never privileged by provider choice.
- [x] SK-R39–R43 (`prompt` integration): byte-identical without the new flags; `--list-skills`/
      `--skill` read-only, honest about non-applicable outcomes, additive only.
- [x] SK-R44–R47 (compatibility): `status`/`verify`/`close`/`propose` untouched; zero new persisted
      state; zero exit-code regressions; rollback is a plain revert.
- [x] SK-R48 (assistant neutrality): grep-confirmed no assistant-specific branching in any new
      function.
- [x] `npm test` (from `cli/`) passes with zero modified assertions not directly justified by a
      cited requirement.
- [x] (human) Approve ADR-019, `spec.md` and `design.md`, or amend any of them.
- [x] (review) Independent review before implementation begins.
