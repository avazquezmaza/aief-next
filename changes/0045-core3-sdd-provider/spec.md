# Specification — Entrega 3: SDD Provider

## Goal

The Core can answer, for any Change, "which SDD provider governs it, where its artifacts are,
whether they exist and are valid, what requirements and tasks they contain, and whether they're
ready" — without any caller (Workflow Engine, `status`, a future command) containing a single path
literal or format assumption specific to OpenSpec or to AIEF's own local shape. Both providers
answer through the same normalized contract. Nothing this Entrega adds changes `verify`, `close`,
or any existing gate's behavior.

## Requirements

### Provider interface

- **SDD-R1 — Plain modules, not classes.** `SddProvider` is not an ES6 class. Each provider is a
  module exporting the same set of named functions, registered in a plain object registry —
  mirroring `requirement-providers/index.js`'s `ADAPTERS` pattern exactly. (Justification: zero
  classes exist in `cli/src/` today; see ADR-017.)
- **SDD-R2 — Every method is read-only in this Entrega.** No function in the provider contract
  writes a file, modifies a manifest, or mutates project state. `archive()` is defined in the
  contract shape (for future use) but has no implementation that performs archival in this Entrega.
- **SDD-R3 — Required vs. optional capabilities are declared, not assumed.** A provider states
  which operations it actually supports (a capabilities object or equivalent); a caller must be
  able to determine "can this provider do X" without calling X and catching a failure.

### Detection

- **SDD-R4 — OpenSpec detection reuses, not reimplements, `openspecInfo()`'s logic.** Binary
  presence (`commandExists("openspec")`), version, and `propose` support are already correctly
  detected in `cli.js`; `OpenSpecProvider`'s detection relocates this logic, it does not
  re-derive it independently.
- **SDD-R5 — Project-structure detection is separate from binary detection.** `openspec/` (or
  `.openspec/`) directory presence is checked independently of the CLI binary — a project can have
  OpenSpec-shaped artifacts committed without the CLI installed locally (e.g. CI, a fresh clone).
- **SDD-R6 — Detection never executes a mutating command.** Detection may run `openspec --version`/
  `--help` (read-only, already how `openspecInfo()` works) but never `openspec init` or any command
  that could alter project state.

### Selection and precedence

- **SDD-R7 — Deterministic precedence, one order, no exceptions.**
  `manifest.sdd.provider` (explicit) → project-level configuration (if any exists — see design.md
  for whether this Entrega defines one) → unambiguous OpenSpec detection → `LocalSddProvider`
  (default). The same Change, read twice with nothing changed on disk, resolves to the same
  provider both times.
- **SDD-R8 — An explicit `manifest.sdd.provider` always wins**, including over a detected OpenSpec
  project — a human's explicit declaration is never second-guessed by inference.
- **SDD-R9 — An unknown declared provider is an explicit, actionable error**, never silently
  mapped to a known one and never silently ignored in favor of detection.
- **SDD-R10 — A declared-but-unavailable provider does not fall back silently.** If
  `manifest.sdd.provider: "openspec"` is declared but OpenSpec is not installed/detectable, this is
  reported as a blocked/invalid state — it does not quietly resolve to `LocalSddProvider` as if
  nothing were declared (that would silently discard the human's explicit choice).
- **SDD-R11 — Ambiguous detection never silently guesses.** If OpenSpec's project structure is
  ambiguous (see design.md for what "ambiguous" means concretely, grounded in real structures this
  Entrega can construct), the result is a warning or actionable error — never a coin-flip default.

### OpenSpec provider

- **SDD-R12 — Artifact paths match the real, documented OpenSpec shape.** `openspec/changes/<name>/
  {proposal.md, tasks.md, design.md, specs/<capability>/spec.md}`, per `adapters/openspec/
  mapping.md` (cross-checked against the upstream project). `OpenSpecProvider` never invents a path
  shape.
- **SDD-R13 — Specifications are a list, never assumed singular.** OpenSpec Changes may have zero,
  one, or many `specs/<capability>/spec.md` files. The normalized artifact model represents
  `specifications` as an array from the start (never a single optional field later widened).
- **SDD-R14 — The AIEF Change and the OpenSpec Change are linked, never merged.** The link is
  `manifest.sdd.change_id` (a name/slug under `openspec/changes/`) — no OpenSpec file is copied
  into the AIEF Change directory, and no AIEF file is copied into the OpenSpec directory.

### Local provider

- **SDD-R15 — `LocalSddProvider` reproduces existing behavior exactly, not a reimplementation.**
  It wraps `readChangeFiles()`/`loadChange()` (`change.js`, unchanged) — the same functions
  `loadChangeUnified()` already uses. A zero-drift regression (Change 0043's own technique) proves
  every real Change resolves identically through the new provider path as through direct calls.
- **SDD-R16 — The local artifact set matches AGENTS.md's actual documented convention, not the
  vision document's assumed one.** Required: `change.md`, `spec.md`, `tasks.md`, `evidence.md`
  (`CHANGE_FILES`, unchanged). Optional, per AGENTS.md's own "Working with Changes" section:
  `design.md`, `adr.md`, `notes.md`. **Correction during this Entrega's own planning**: an earlier
  draft of this requirement cited `proposal.md`/`verification.md` as established convention —
  inspection of AGENTS.md shows they are not; they are files this same planning effort (Entregas 1
  and 2) introduced for its own Changes, not a pre-existing, documented convention. `LocalSddProvider`
  must resolve the AGENTS.md-documented optional set (`design.md`/`adr.md`/`notes.md`); whether it
  also recognizes `proposal.md`/`verification.md` is a design decision to make explicitly, not
  inherit silently from this session's own recent habit.

### Artifact resolution

- **SDD-R17 — Every artifact result distinguishes five states explicitly**: absent, empty, invalid
  (fails a structural check the provider can perform), not-applicable (e.g. `design.md` for a
  provider/track where it's genuinely optional), and read-error (I/O failure) — never collapsed
  into a boolean or an empty list standing in for "couldn't tell."
- **SDD-R18 — No artifact content is fabricated.** A provider that cannot determine something
  (e.g. OpenSpec's `design.md` is genuinely optional per OpenSpec's own convention) reports
  `not_applicable`, never a guessed value.

### Requirements and tasks

- **SDD-R19 — Extraction is scoped to what's deterministically extractable.** Before adopting any
  requirement/task shape, `design.md` documents exactly what each provider's real Markdown
  convention allows extracting without heuristics (e.g. a checkbox line is deterministic; inferring
  which requirement a paragraph "is about" is not). What cannot be extracted deterministically is
  marked `unsupported`, not attempted with a best-effort parser.
- **SDD-R20 — No AI is used to parse artifacts in this Entrega.** Every extraction rule is a fixed
  pattern (heading, checkbox, list item) applied identically every time — the same discipline
  `checkChangeReadiness()`/`parseChangeStatus()` already use.
- **SDD-R21 — A task's linked requirements are preserved only when the source text actually links
  them explicitly** (e.g. an inline reference to a requirement id already present in the same
  Markdown). **Not yet grounded in a real convention**: no Change in this repository's `changes/`
  today links tasks to requirement ids in `tasks.md` (confirmed by inspection — the vision
  document's `Requirements: AUTH-R1` example, `docs/aief-core-3-claude-code-prompt.md` §15, has no
  real precedent here). `design.md` must either find a real pattern to extract or mark this
  capability `unsupported` rather than inventing a convention this Entrega would be the first to
  require. Never inferred from proximity or wording either way.

### Readiness

- **SDD-R22 — Provider readiness and Workflow Engine readiness are two distinct, sequential
  contracts, never merged into one.** `SddProvider.validate()` answers "are the SDD artifacts
  present and valid" (`ready`/`not_ready`/`invalid`/`unsupported`). The Workflow Engine's
  (designed-but-not-wired) `specification` gate would *consume* that result — it does not
  reimplement the question, and provider `ready` does not, by itself, make the gate `passed`
  (Change 0044 review finding R1's exact lesson: an existence/detection fact must never silently
  substitute for a real evaluated status).
- **SDD-R23 — Provider readiness `blocker`/`warning`/`info` are structurally distinct**, matching
  the gate contract's `blocking` field discipline already established in Change 0044.

### Errors

- **SDD-R24 — Every error case the commissioning instruction lists is distinguishable and
  actionable**: unknown provider, configured-but-unavailable provider, ambiguous OpenSpec
  structure, referenced OpenSpec Change missing, required artifact missing/empty/unreadable/
  unsupported format, requirements/tasks not deterministically parseable, unsupported provider
  operation, provider command failure (with exit code/stdout/stderr recorded, when a command was
  actually run).
- **SDD-R25 — No silent fallback ever hides an error.** Every fallback (declared-provider-
  unavailable, ambiguous detection) is reported as a visible warning/error, never silently resolved
  to a different provider without saying so (SDD-R10/R11, restated here as the general rule).

### Manifest

- **SDD-R26 — `sdd` is optional; its absence is never an error**, for any Change — legacy,
  Entrega-1-era, or Entrega-2-era. All three continue resolving through `LocalSddProvider` by
  default (SDD-R7's fallback step), exactly as `propose()`'s existing fallback already behaves.
- **SDD-R27 — `sdd.provider`, when present, must be a known provider id** (`"openspec"` \|
  `"local"`) — validated the same way `change-manifest.js` validates `status`'s enum today.
- **SDD-R28 — `sdd.change_id`, when present without a valid `sdd.provider`, is not silently used.**
  A `change_id` only means something in the context of a specific provider; declaring one without a
  resolvable provider is reported, not guessed at.

### Compatibility

- **SDD-R29 — Legacy Changes are untouched.** No code path this Entrega adds is reachable for a
  Change with no manifest.
- **SDD-R30 — Entrega-1/2-era manifests are untouched.** A manifest with `status`/`track` but no
  `sdd` resolves through `LocalSddProvider` with `ready` semantics unchanged from today's implicit
  behavior — no new blocker appears for any real Change (zero of which set `sdd` today).
- **SDD-R31 — No unexpected writes.** No test or real invocation of any provider function in this
  Entrega may modify a project file. Verified the same way Change 0043 verified it: a fixture's
  files are byte-compared before/after every provider call under test.

### Workflow integration

- **SDD-R32 — The `specification` gate is designed, not enabled.** `gate-evaluator.js`'s
  `KNOWN_GATE_IDS` and gate-function shape are extended to support a `specification` gate
  consuming a provider's `validate()` result, but no shipped workflow definition
  (`lite.json`/`standard.json`/`governed.json`) references it — it is unreachable from any real
  invocation until a later, explicit Change enables it.
- **SDD-R33 — `resolveState()` (`transition-engine.js`) requires no change.** The `specification`
  gate, once wired, is just another gate result in the array `resolveState()` already consumes
  generically — this Entrega's design must not require touching `resolveState()`'s algorithm.

### `status` integration

- **SDD-R34 — Additive only.** Any new `status` output (SDD provider, SDD Change link, SDD
  readiness) appears only for a Change whose manifest declares `sdd` — zero Changes in this
  repository today, so the byte-identical guarantee holds unconditionally at time of writing,
  proven the same way Entregas 1–2 proved it (real `aief status` diff, before/after).

### Determinism and assistant-neutrality

- **SDD-R35 — Every provider function is a pure function of the filesystem** (plus, for OpenSpec
  detection only, the read-only `openspec --version`/`--help` calls already used today) — same
  Change, same disk state, same result, from any process, with no cache.
- **SDD-R36 — No function in this Entrega is callable only by a specific AI assistant.** Every
  provider function is plain JavaScript, callable identically by a human, a script, or any
  assistant — consistent with every existing command in this codebase.

### Rollback

- **SDD-R37 — Every artifact this Entrega adds is a new file or a small additive edit.** No
  existing function's behavior changes for any input that exercised it before this Entrega (the
  zero-drift regressions for both `LocalSddProvider` and the unchanged `readiness` gate are the
  proof). Rollback is a plain code revert with no data migration to undo.

## Acceptance Criteria

- [x] SDD-R1–R3 (interface): `sdd-providers/{local,openspec}.js` are plain modules registered in
      `sdd-providers/index.js`; `CAPABILITIES` checked without invoking the operation
      (`sdd-model.test.js`'s `callCapability` tests).
- [x] SDD-R4–R6 (detection): `OpenSpecProvider.detect()` filesystem-first (fixed during review, R3);
      matches `propose()`'s real baseline behavior (captured live, evidence.md Etapa A).
- [x] SDD-R7–R11 (selection/precedence): `sdd-provider-registry.test.js` — explicit-wins,
      unknown-errors, unavailable-does-not-fall-back, deterministic repeat calls.
- [x] SDD-R12–R14 (OpenSpec provider): `sdd-provider-openspec.test.js` — real
      `openspec/changes/<id>/...` shape; `specifications` array tested with 0/1/3 entries.
- [x] SDD-R15–R16 (local provider): `sdd-provider-local.test.js` — zero-drift regression across
      every real Change; optional set resolved per the project owner's explicit approval.
- [x] SDD-R17–R18 (artifact resolution): `sdd-model.test.js`/provider tests — present/missing/
      empty/read_error/not_applicable each covered by a dedicated fixture.
- [x] SDD-R19–R21 (requirements/tasks): extraction rules verified against real repository content;
      independent review (R2) found and fixed a false-positive extraction bug against real content
      in `changes/0041-*/spec.md` before this criterion could be honestly marked done.
      Task-to-requirement linking confirmed `unsupported` (`requirements: []` always).
- [x] SDD-R22–R23 (readiness): `gate-evaluator.test.js` — specification gate never `"passed"`
      without `validate()` itself reporting `ready` (also the subject of review item R1 — see
      "never resolves 'passed' merely because a provider was detected").
- [x] SDD-R24–R25 (errors): each error case in design.md §11 has a distinguishable, tested message
      across the provider/resolver/manifest test files.
- [x] SDD-R26–R28 (manifest): `change-manifest.test.js` — absence-is-not-error (existing corpus
      unmodified), unknown provider, invalid `change_id`, orphaned `change_id`.
- [x] SDD-R29–R31 (compatibility): zero-drift regression; byte-comparison-before-after-every-call
      in both provider test files.
- [x] SDD-R32–R33 (workflow integration): `gate-evaluator.test.js` confirms `lite.json`/
      `standard.json`/`governed.json` byte-unchanged and none declares `"specification"`.
- [x] SDD-R34 (status integration): real `aief status` before/after diff, byte-identical —
      re-confirmed after the review's fixes, not only before them.
- [x] SDD-R35–R36 (determinism/neutrality): `resolveSddProvider` determinism test; grep-verified no
      AI/model import anywhere in the new code.
- [x] SDD-R37 (rollback): confirmed by the diff's shape — new files + small additive edits only.
- [x] `npm test` (from `cli/`) passes: 251/251. Every pre-existing assertion that changed
      (`sdd-provider-openspec.test.js`'s `cliPresent` expectation, post-R3-fix) is named with the
      finding that justified it.
- [x] (human) Approve ADR-017, or amend it — **Approved as `Accepted`**, 2026-07-25.
- [x] (human) Approve this spec.md and `design.md`, or amend either — **Approved**, 2026-07-25.
- [x] (review) Independent review — performed post-implementation; see `evidence.md`'s "Adversarial
      Review." Verdict: `ready_to_close`, after fixing one blocking (security) and two high findings.
