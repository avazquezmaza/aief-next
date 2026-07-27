# Proposal — Entrega 4: User Workflow

## Problem

Three Entregas built real machinery — the manifest (Change 0043), the Workflow Engine (Change
0044), the SDD Provider (Change 0045) — but exactly one command, `status`, consumes any of it.
Concretely, by inspection:

- `grep`-confirmed: every call site of `loadChangeUnified()`, `resolveState()`, `evaluateGates()`,
  `resolveSddProvider()` lives inside `status()`'s own helper functions
  (`isClosed`/`openChangeDirs`, `workflowChanges`/`resolveWorkflowFor`, `sddChanges`). `isTransitionLegal()`
  has **zero** production call sites — it exists, is tested, and is never invoked outside tests.
- `status()` itself contains a real, live inconsistency: its per-Change `Workflow status` block
  (Change 0044) renders `resolveState()`'s derived `nextAction`, while its own bottom-line
  suggestion (`cli.js` lines 854–857, predating the Workflow Engine) is a separate, static
  heuristic (`aief adopt` / `aief analyze` / `aief prompt` / `aief close --yes`) that never consults
  `resolveState()` at all. For a single open, track-carrying Change, `status` can print two
  different "what's next" answers in the same invocation.
- `aief prompt` already does most of what a "work" command would: resolves the active Change via
  the shared resolver (`resolveExplicitChange`/`resolveImplicitChange`), composes standards/skills
  context, guards existing evidence — but knows nothing about `track`, gates, or SDD readiness.
- No command answers "what should I do now" for a specific Change with the Workflow Engine's own
  authority — a user must read `status`'s per-Change block themselves and interpret it.

## Objective

Give the Workflow Engine and SDD Provider a real, consistent entry point from the CLI — reusing the
existing Change resolver and evolving existing commands (`status`, `prompt`) wherever that's
sufficient, adding the smallest new surface that a real, cited gap justifies (`next`), and never
duplicating gate/transition logic inside command handlers.

## A blocking architectural fact found during inspection

**ADR-015 (Accepted, still in effect) freezes new commands until Change 0042 (the AIEF 2.0
usability study) is consolidated. Change 0042 is confirmed still `Open`.** Entregas 1–3 never
collided with this because they added zero commands. Entrega 4's own stated goal — `aief start`/
`next`/`work` — is, literally, new commands. This is not resolved by this proposal; ADR-018 records
two designed paths (new commands vs. new flags on existing commands) and the project owner must
choose. See "Blocking Questions" below and `design.md` §4.

## Scope

- ADR-018 (ties `workflow-service.js`, the derivation discipline, the action/exit-code contract,
  and the ADR-015 collision together — see `knowledge/decisions.md`).
- `workflow-service.js`: a thin, plain-function application layer wrapping
  `loadWorkflowDefinition()`/`evaluateGates()`/`resolveState()`/`isTransitionLegal()` and
  `resolveSddProvider()` — one place that answers "what's next," consumed by `status()`'s own
  bottom line (fixing the inconsistency above) and by whatever `next`-shaped surface Path A/B
  produces.
- A normalized action/read-vs-write contract, distinct from `GateResult` (design.md §5).
- `next` semantics designed for both exposure paths (new command, or `status --next`/
  `status --change <id> --next`).
- `work` designed as `prompt`'s evolution (added Workflow/SDD context blocks) — not a new command
  under either path, since an existing command already does most of the job (commissioning
  instruction: don't invent a command when one can evolve compatibly).
- `start` evaluated and **not recommended as a creation/activation command** — see "Alternatives
  Considered." Its useful part (Change selection + deep inspection) is designed as an evolution of
  `status --change <id>`, not a new verb.
- Change resolver: confirmed already-unified (`resolveExplicitChange`/`resolveImplicitChange`,
  `matchChanges`) — this Entrega documents and reuses it, does not rebuild it.

## Out of Scope

Skills, Hooks, assistant execution, automatic code generation, automatic task completion, semantic
Verification, Review-as-a-product-feature, advanced Profiles, conversational interface, daemon,
global session state, database, server, GUI, remote sync, OpenSpec archival, automatic migration,
tool installation, Entrega 5. Refactoring `close()`'s write path or gating logic (only its
*consumption* by a read-only `next`-shaped surface is in scope — `checkChangeReadiness()` and
`markClosed()` are untouched, per the explicit instruction not to refactor `close()` "solo por
limpieza"). Wiring `propose()` to the SDD Provider (ADR-017's own deferred obligation — restated,
not re-opened).

## Compatibility

- `status`'s existing output is byte-identical for every Change without a `track`/`sdd` section
  (100% of this repository's Changes today) — the consolidation in ADR-018 §1 only changes *which
  function computes* the bottom-line suggestion for a track-carrying Change with a single-open
  selection context, not its wording for any Change that exercises today's heuristic branches
  identically.
- `propose()`, `verify()`, `close()`'s write path: untouched.
- Legacy Changes, Entrega-1 manifests, Entrega-2 tracks, Entrega-3 providers: all continue to
  resolve through the exact same functions Entregas 1–3 already proved zero-drift-safe;
  `workflow-service.js` wraps them, it does not reimplement them.
- No migration, no new persisted state beyond what Change 0044 already decided (`track` only).

## Relation to Entregas 1–3

Reuses without modification: `loadChangeUnified()` (Entrega 1), `loadWorkflowDefinition()`,
`evaluateGates()`, `resolveState()`, `isTransitionLegal()`, `KNOWN_GATE_IDS`, all three shipped
workflow definitions (Entrega 2), `resolveSddProvider()`, both providers' `validate()`/
`getArtifacts()` (Entrega 3). Extends: `status()`'s rendering only, plus `prompt()`'s composed
context. Revisits: none of the three Entregas' own core decisions (persist-only-`track`, provider
selection precedence, gate contract shape) are reopened.

## Risks

1. **ADR-015 collision is the dominant risk of this Entrega** — see above. Everything else in this
   plan is written to be valid under either resolution path, but implementation cannot start until
   the project owner picks one.
2. **`workflow-service.js` could become a dumping ground** if scoped loosely. Mitigated: its exact
   function list is derived from real call sites this proposal already found (§ "Problem"), not
   speculative future needs.
3. **`prompt`'s growing scope** (already composes standards/skills; would add Workflow/SDD blocks)
   risks the "prompt growth" watch item Change 0024 already flagged in this project's own history.
   Mitigated: new blocks follow the exact same conditional-and-small-when-present discipline
   `skillsBlock`/`standardsBlock` already use.
4. **A `next` surface that looks authoritative but isn't** — mitigated by the strict read-only
   contract (design.md §5) and the exit-code policy (ADR-018 §3) making "blocked" a normal, exit-0
   answer, never an error state a script would need to work around.

## Alternatives Considered

- **Adopt `start`/`work`/`next` literally as the vision document sketches them** (full creation,
  provider/profile/standards/skills selection, manifest authoring). Rejected for this Entrega:
  none of that machinery exists yet in a form `start` could correctly drive (Skills/Hooks are
  explicitly out of scope; `new-change` already owns id/slug/manifest creation). Adopting the name
  without the capability would create exactly the "empty concept" gap ADR-012's own history
  (Change 0020's friction #8) already warned this project about once, for Profiles.
- **Make `start` a thin alias for `new-change`+`status --change`.** Considered; rejected as adding
  a command (or, under Path B, a flag) that does nothing `new-change` followed by `status --change
  <id>` doesn't already do today — no real gap justifies it, so it isn't proposed even under Path B.
- **Persist "active Change" to avoid repeating `--change <id>`.** Rejected — ADR-009's rule,
  unchanged; Change 0043's `resolveExplicitChange`/`resolveImplicitChange` already solved this
  ergonomically (implicit single-open-Change inference) without any stored state.
- **A five-value exit code scheme** (0/1/2/3/4), as the commissioning instruction's own example
  sketches. Rejected — see ADR-018 §3: no precedent anywhere in this codebase, and the existing
  `close`-without-`--yes` precedent already answers the "is blocked an error" question without a
  new scheme.

## Success Criteria

See "Success Criteria" in `change.md`.
