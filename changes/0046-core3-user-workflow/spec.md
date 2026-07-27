# Specification — Entrega 4: User Workflow

## Goal

For any Change, a user (or script) can ask "what's next, and why" through exactly one computation
(`workflow-service.js`), get a read-only, deterministic, actionable answer distinguishing available/
blocked/pending/unsupported/complete, and — only via an explicit, separate write operation this
Entrega does not add — advance the workflow. `status`'s two previously-disagreeing "next" answers
become one. Nothing new is persisted. No command this Entrega touches gains a write path beyond
what `close`/`markClosed()` already have.

## Requirements

### Change selection and identity

- **UX-R1 — One resolver, reused, not rebuilt.** Every Change-oriented operation this Entrega adds
  or extends resolves a Change through the existing `resolveExplicitChange()`/
  `resolveImplicitChange()`/`matchChanges()` (`cli.js`/`change.js`) — no second selection
  implementation is introduced.
- **UX-R2 — Precedence unchanged.** Explicit `--change <id-or-slug>` wins; with no flag, exactly one
  open Change is inferred; zero or multiple open Changes is an actionable error naming them, never
  a guess (Change 0043's existing, tested behavior — restated as a requirement here because this
  Entrega must not regress it).
- **UX-R3 — Filesystem order never affects selection.** `getChangeDirs()`'s existing `.sort()` is
  relied upon, not reimplemented.
- **UX-R4 — Directory basename stays canonical identity.** `manifest.id`/`manifest.slug` mismatches
  against the directory remain warnings (Change 0044's `identity` gate), never used for selection.

### `next` (or its Path-B equivalent)

- **UX-R5 — Read-only, always.** No code path reachable from `next` (or `status --next`) writes any
  file, under any input, including a Change with unresolved blockers.
- **UX-R6 — One computation, shared with `status`.** `workflow-service.js`'s next-action function is
  the only place "what's next" is derived; `status()`'s bottom-line suggestion for a track-carrying,
  unambiguously-selected Change calls the same function `next` calls.
- **UX-R7 — Six distinguishable outcomes**: `available`, `blocked`, `pending` (gate has no
  evaluator yet — Change 0044's `review`/`approval`/`security_review`), `unsupported` (a
  capability the resolved provider doesn't have), `complete` (workflow reached `close`), `invalid`
  (manifest, provider, or workflow definition error) — never collapsed into fewer categories.
- **UX-R8 — A closed Change is reported as closed**, not as "complete" (Change 0044's `resolveState()`
  already returns `{stage: "closed", nextAction: null}` for this — `next` surfaces it distinctly
  from a Change that reached `close` as its next *available* action).
- **UX-R9 — A Change with no `track`/no `sdd` gets an honest, minimal answer** (legacy `close`/
  `verify` readiness only — `checkChangeReadiness()`'s existing output, not a fabricated Workflow
  Engine opinion for a Change that never opted into one).

### `work` (as `prompt`'s evolution)

- **UX-R10 — No claim of work performed.** Extending `prompt`'s output with Workflow/SDD context
  never marks a task complete, never writes evidence, never claims code was generated.
- **UX-R11 — Pending tasks shown when deterministically available.** Reuses
  `LocalSddProvider`/`OpenSpecProvider`'s existing `getTasks()` (Entrega 3) — no new parser.
- **UX-R12 — Unsupported task parsing is stated, not silently omitted** (SDD-R19/R20's existing
  "unsupported, not guessed" discipline, surfaced to the human here for the first time).
- **UX-R13 — Additive to `prompt`'s current output.** For a Change with no `track`/`sdd`, `prompt`'s
  byte output is unchanged from today.

### `start` / Change entry point

- **UX-R14 — No creation.** Whatever surface results from this Entrega's `start` evaluation
  (design.md §4) never creates a Change — creation remains exclusively `new-change`/`propose`'s
  job, preventing two contradictory public paths to begin one (commissioning instruction, directly).
- **UX-R15 — No hidden session state.** No "active Change" is written to disk, environment, or
  memory across invocations. Every entry point re-resolves via UX-R1 every time.

### Read vs. write

- **UX-R16 — Every operation is classified, in `design.md`, as read-only or write**, with write
  operations named explicitly (this Entrega: only `close`'s existing `markClosed()` — no new write
  operation is introduced).
- **UX-R17 — A read-only operation never modifies `manifest.json`, `change.md`, `tasks.md`,
  `evidence.md`, or any SDD artifact**, verified by the same byte-comparison-before/after technique
  Change 0045 used for provider reads.

### Blockers, warnings, explanation

- **UX-R18 — Blocking vs. warning stays structural**, inherited unchanged from `GateResult.blocking`
  (Change 0044) — this Entrega's action contract never re-derives blocking-ness independently.
- **UX-R19 — Every non-`available` outcome names its cause**: which gate, which artifact, which
  provider, which capability — reusing each subsystem's own existing message, never inventing a
  new one (design.md §5's action contract wraps, does not replace, `GateResult.reason`/SDD
  `blockers`/`warnings`).
- **UX-R20 — No AI is used to generate an explanation.** Every explanation is assembled from
  already-computed, deterministic fields (`GateResult`, SDD readiness, `resolveState()`'s output).

### Workflow Engine and SDD Provider integration

- **UX-R21 — `workflow-service.js` calls `evaluateGates()`/`resolveState()`/`isTransitionLegal()`
  exactly as Change 0044 shipped them** — no gate is approved by the service layer; a gate's
  `status` is never overridden.
- **UX-R22 — SDD readiness and gate readiness stay distinct** in the action contract's output, per
  ADR-017 — a `specification` gate result (if ever wired) is consumed like any other `GateResult`,
  never specially privileged.
- **UX-R23 — The service layer never reads OpenSpec paths or Local Change paths directly** — every
  artifact/requirement/task fact comes through `resolveSddProvider()`'s normalized result (Change
  0045, unchanged).

### Manifest / provider / workflow failure states

- **UX-R24 — An invalid manifest never falls back to legacy** through any new surface (Change
  0043's existing guarantee, restated as a requirement here because `next`/`work` are new readers
  of `loadChangeUnified()`'s output and must not regress it).
- **UX-R25 — An unknown or unavailable explicit SDD provider never falls back** through any new
  surface (Change 0045's existing guarantee, restated for the same reason).
- **UX-R26 — Path traversal via `sdd.change_id` stays rejected** (Change 0045's fix, unchanged,
  exercised again by any new surface that reaches `OpenSpecProvider`).
- **UX-R27 — An unrecognized workflow track produces a distinguishable "invalid" outcome**, not a
  crash and not a silent default track.

### Output and exit codes

- **UX-R28 — Human output by default; structured output only if a real consumer is named.** This
  Entrega does not add `--json` unless `design.md` §9 finds a concrete, cited consumer — matching
  Change 0044's own precedent for deferring `status --json`/`--verbose` (WF-R16) without one.
- **UX-R29 — Exit code policy matches ADR-018 §3**: `0` for a successfully-answered read
  (including `blocked`/`pending`/`unsupported`/`complete` outcomes), `1` only when the query itself
  fails (Change not found, ambiguous, invalid manifest/provider/workflow). No new exit code values.
- **UX-R30 — No existing command's exit-code behavior changes.** `verify`'s exit-1-on-fail and
  `close`'s exit-1-only-on-failed-write stay exactly as they are.

### Determinism, hidden state, compatibility, rollback

- **UX-R31 — Every `workflow-service.js` function is a pure function of its inputs** (the loaded
  Change, the workflow definition, the SDD resolution) — same inputs, same output, every call.
- **UX-R32 — No new persisted state.** Confirmed: no file this Entrega's design writes exists
  beyond what `close` already writes.
- **UX-R33 — `status`'s output is byte-identical for every Change without `track`/`sdd`** — the
  consolidation (ADR-018 §1) changes *which function* computes the bottom-line suggestion, never
  its wording, for every Change exercising today's non-Workflow-Engine branches.
- **UX-R34 — `propose()`, `verify()`, `close()`'s write path are byte-unchanged** — confirmed the
  same way Change 0045 confirmed it (`git diff` contains zero lines touching those functions,
  beyond `status()`'s bottom-line consolidation itself).
- **UX-R35 — Rollback is a plain code revert.** Every artifact this Entrega adds is a new file or a
  small additive/consolidating edit; no data migration exists to undo.

### Assistant neutrality

- **UX-R36 — Every new/extended function is callable identically by a human, a script, or any
  assistant** — no function's contract depends on which AI (if any) is driving the CLI.

## Acceptance Criteria

- [x] UX-R1–R4 (selection/identity): existing resolver reused with zero new selection logic;
      dedicated tests confirm sort-independence and identity-warning-not-error behavior unchanged.
- [x] UX-R5–R9 (`next`): read-only proven by byte-comparison; all six outcomes reachable from
      dedicated fixtures; closed-vs-complete distinguished; no-track/no-sdd Changes get the minimal
      honest answer.
- [x] UX-R10–R13 (`work`): no false completion claims; pending tasks shown from existing
      `getTasks()`; unsupported parsing stated; byte-identical `prompt` output when inapplicable.
- [x] UX-R14–R15 (`start`): no creation path exists in the design; no session-state file/env var
      appears anywhere in the diff.
- [x] UX-R16–R17 (read vs. write): every operation classified in `design.md`; write-path count is
      zero beyond `close`'s existing one.
- [x] UX-R18–R20 (blockers/warnings/explanation): blocking-ness never re-derived; every message
      traced to an existing subsystem's own output; zero AI-generated explanation text.
- [x] UX-R21–R23 (Workflow/SDD integration): no gate override; SDD/gate readiness kept distinct in
      the action contract; zero direct path construction to OpenSpec/local files in the service layer.
- [x] UX-R24–R27 (failure states): each of the four regression guarantees has a dedicated test
      exercised through the new surface, not only through Entregas 1–3's original tests.
- [x] UX-R28–R30 (output/exit codes): no `--json` added without a named consumer; exit-code policy
      tested for both the query-fails and query-succeeds-but-blocked cases; existing commands'
      codes unchanged.
- [x] UX-R31–R35 (determinism/state/compatibility/rollback): pure-function tests; zero-drift
      regression across every real Change; `git diff` shows only additive/consolidating changes.
- [x] UX-R36 (assistant neutrality): grep-confirmed no assistant-specific branching in any new
      function.
- [x] `npm test` (from `cli/`) passes with zero modified assertions not directly justified by a
      cited requirement.
- [x] (human) Resolve ADR-018 §4 (Path A vs. Path B) — this criterion blocks every other one above
      from being implemented, though not from being planned.
- [x] (human) Approve ADR-018, `spec.md`, and `design.md`, or amend any of them.
- [x] (review) Independent review before implementation begins.
