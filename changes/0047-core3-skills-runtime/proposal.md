# Proposal — Entrega 5: Skills Runtime

## Problem

`aief prompt` already injects four kinds of context into its output — standards, recommended
Skills, Workflow status (Entrega 4), SDD status (Entrega 4) — and each is a bespoke, copy-pasted
block built inline inside `prompt()` (`standardsBlock`, `skillsBlock`, `workflowBlock`, `sddBlock`,
`cli.js:682-699`). Every time a new kind of contextual capability is needed, the pattern so far has
been "add one more inline block to `prompt()`." That does not scale past four, and — more
importantly — it gives every future capability (requirements-analysis instructions, a task-execution
checklist, evidence guidance) no shared contract: no shared way to declare what it needs, whether it
applies, what it returns, or what it is and is not allowed to do.

Separately, `docs/aief-core-3-claude-code-prompt.md` §12 asks Skills to "evolve from passive context
to verifiable contracts" — today's `cli/src/skills-catalog.json` entries are pure static data
(`when`/`promptContext`/`commonRisks` — never executed, ADR-010), with no `appliesTo`, no
`capabilities`, no per-Change context, and no result. The vision document's own fuller sketch (§12,
`skill.yaml` with `permissions.filesystem.write`, `verification.checks` of `type: command` running
`npm test`, `type: agent` delegating to an assistant) is considerably more than this repository has
evidence to support today — no Skill in this codebase currently writes a file, runs a command, or is
invoked by anything, and Entrega 4 (`workflow-service.js`) only just established the "one canonical
read-only computation" discipline this Entrega must not regress.

## Existing capabilities that already behave like a Skill

Inspection of the current codebase (`cli/src/cli.js`, `cli/src/detect.js`,
`cli/src/requirement-providers/`, `cli/src/sdd-providers/`) found:

- **`recommendSkills()` (`detect.js`)** — Model A today, in miniature: `Project → catalog lookup →
  Skill recommendations (promptContext, commonRisks, standardsToRead)`. No `id`-based direct
  invocation (only "recommend all applicable"), no per-Skill `capabilities`, no Change/Workflow/SDD
  context — only `Project` (package.json + file signals). This is the closest prior art and the
  literal thing ADR-010/§12 ask to be evolved, not replaced.
- **`checkChangeReadiness()` (`change-verifier.js`, used by `verify`/`close`)** — Model B in
  miniature: `Change → deterministic readiness problems[]`. Pure, read-only, already exactly the
  shape a "deterministic execution" Skill would need — but it is not registered, has no `id`, and is
  called directly by name everywhere it's needed.
- **`requirementFactsAndAssumptions()` (`cli.js`, used by `enrich`)** — Model B in miniature:
  `Requirement → {facts[], assumptions[]}`, pure classification logic, already deterministic, already
  read-only against its input.
- **`workflow-service.js`'s `inspect()`/`explain()` (Entrega 4)** — not a Skill itself, but exactly
  the normalized-context precedent a Skill Context Builder must reuse rather than duplicate: Change +
  Workflow + SDD, one load, one shape.
- **`requirement-providers/index.js` and `sdd-providers/index.js`** — the two existing registry
  precedents (`ADAPTERS`/`PROVIDERS`: a static object of statically-imported modules, `has*(id)`,
  `get*(id)`/dispatch, `*Ids()`/`implemented*()`) this Entrega's Skill Registry must mirror exactly,
  per the same reasoning ADR-017 used to reject a class-based provider interface.

None of these are renamed or refactored by this Entrega (ADR-013 discipline: additive first, merge
recorded as an obligation — see "Relationship to ADR-013" below). They are cited as the evidence base
for the Skill contract's shape.

## Objective

Introduce a stable, minimal Skill contract, registry and runtime so a small number of internal,
versioned, read-only capabilities can be declared once and consumed identically by `prompt`
(this Entrega) and, later, by Hooks/Verification/Review (future Entregas) — without any of them
importing a specific Skill module directly, without any Skill reading `cli.js`/OpenSpec/provider
internals directly, and without introducing execution, writes, or network access this Entrega has no
concrete, safe use case for.

## Proposed definition

A **Skill** (Entrega 5) is a versioned, internally-registered capability that:

1. declares `capabilities` explicitly (default: none — absence is restrictive, not permissive);
2. declares `appliesTo(context)` — a deterministic, non-AI applicability check;
3. for `capabilities.instructions: true` (every Skill this Entrega), implements
   `buildInstructions(context, input)` — returns text, produces nothing, changes nothing;
4. optionally, for `capabilities.deterministicExecution: true`, implements `execute(context, input)`
   — returns a structured, deterministic result computed only from `context`/`input`, still zero
   writes/network/commands;
5. never implements `capabilities.writeFiles`/`executeCommands`/`network: true` this Entrega — the
   Skill Registry rejects any descriptor that claims one of these (Model C is not merely
   discouraged, it is structurally impossible to register this Entrega).

This is Model A, fully, plus the narrow, already-evidenced slice of Model B
(`checkChangeReadiness()`-shaped pure computation) — not Model C. See `design.md` §2 for the full
evaluation of all three models against this repository's actual evidence.

This is presented as **the evolution ADR-010 and §12 both already call for**, not a competing or
renamed concept: `cli/src/skills-catalog.json` entries remain valid, unexecuted, contextual-knowledge
Skills — the degenerate case of this contract (`capabilities: {instructions: true}` only, applying
unconditionally to any Project). This Entrega does not migrate the catalog; it defines the contract
the catalog could migrate into later, and resolves the naming question explicitly (`design.md` §1)
instead of leaving two things called "Skill" to drift apart silently.

## Initial Skills (this Entrega's validation set)

Two, both Model A (`capabilities.instructions: true` only) — enough to exercise registry,
applicability, context, result, and `prompt` integration without inventing rules the codebase has no
evidence for:

1. **`change-context`** — a normalized, human-readable summary of one Change (identity, manifest,
   Workflow stage/blockers, SDD readiness) — reuses `workflow-service.js`'s `explain()` verbatim as
   its context source; applies unconditionally to any resolvable Change.
2. **`requirements-analysis-instructions`** — instructions for reviewing ambiguity, missing
   acceptance criteria, and traceability, reusing the SDD Provider's already-normalized
   `requirements`/`artifacts` (Change 0045) — applies only when `context.sdd` exists and its
   `readiness.status` is not `invalid`/`unsupported`; a Change with no `sdd` gets `not_applicable`,
   never a fabricated set of instructions.

Two candidates from the commissioning instruction were evaluated and **not** included, with reasons
(`design.md` §6):

- **Task Execution Instructions** — would substantially duplicate Entrega 4's already-shipped
  `prompt`'s SDD-tasks block (`sddBlock`, `cli.js:695-699`) without new value; deferred until a real
  gap is found (e.g., a Skill needs per-task guidance `prompt`'s existing block does not provide).
- **Evidence Checklist** — the commissioning instruction itself gates this on "solo si puede
  derivarse sin inventar reglas"; no existing subsystem (Workflow Engine, SDD Provider,
  `change-verifier.js`) currently expresses "what evidence a Change of this stage/track needs" as a
  derivable rule — inventing one here would be exactly the kind of AI-free-but-still-invented policy
  this project's evidence discipline (ADR-008) exists to prevent.

## Scope

**In scope:** Skill descriptor/contract, capability model, Skill Registry (mirrors
`requirement-providers/`/`sdd-providers/`), Skill Context (wraps `workflow-service.js`, adds
`project`), normalized Skill Result, two internal Skills, `prompt` integration
(`--skill <id>`/`--list-skills`, additive flags, no new command verb), error/outcome model, security
threat model (path traversal N/A — no filesystem access from a Skill; prompt-injection-as-data
discipline for artifact content), determinism, documentation, adversarial review.

**Out of scope:** Hooks and any event-driven/automatic invocation, autonomous execution, AI-driven
Skill selection or applicability, a Skill marketplace/remote Skills/installation/npm resolution,
`capabilities.writeFiles`/`executeCommands`/`network: true` (Model C), semantic Verification,
Review-as-product, advanced Skill profiles, a conversational interface, Entrega 6.

## Relationship to Entregas 1–4

- **Entrega 1 (Change Foundation):** `manifest.json`/`loadChangeUnified()` are read, never
  re-parsed — the Skill Context Builder consumes `workflow-service.js`'s already-normalized `change`
  field, exactly as `statusSingleChange()`/`prompt()` do today.
- **Entrega 2 (Workflow Engine):** a Skill may read `stage`/`gates`/`blockers`/`warnings`/
  `nextAction` (via `context.workflow`) but has no method that could approve a gate, change `track`,
  or execute a transition — the contract has no such method to begin with (design.md §4).
- **Entrega 3 (SDD Provider):** a Skill consumes `context.sdd`'s already-normalized `readiness`/
  `artifacts`/`requirements`/`tasks` — never a provider module, never an OpenSpec/local path.
- **Entrega 4 (User Workflow):** the Skill Context Builder calls `workflow-service.js`'s `explain()`
  directly — one load, reused, not duplicated (the same discipline that eliminated the
  `printNext()`/`resolveState()` discrepancy is what prevents a Skill from re-deriving Workflow/SDD
  facts its own way). `prompt`'s existing `workflowBlock`/`sddBlock` are untouched; a Skill's output
  is a fifth, opt-in block, not a replacement.

## Relationship to ADR-013 (no capability without removal/merge)

This Entrega **merges**, not merely adds: `prompt()`'s four independent, copy-pasted inline
"build a context block" implementations (`standardsBlock`, `skillsBlock`, `workflowBlock`,
`sddBlock`) collapse into one general mechanism (Skill Service → normalized result → one rendering
path) that any future context type can join without `prompt()` growing a fifth bespoke block. The
existing four blocks are **not** rewritten to go through the new mechanism this Entrega — per the
same "additive and dormant" precedent Change 0043/0044/0045 each used (the provider/engine is built,
tested, and left unwired to the surfaces that could adopt it later) — that consolidation is recorded
here as the obligation for whichever later Change completes it, exactly as ADR-017 recorded
`propose()`'s un-rewired OpenSpec logic as its own deferred merge obligation.

This Entrega also **collides explicitly** with ADR-010 (`cli/src/skills-catalog.json` is "Skill",
today) rather than resolving it by implication (ADR-013's own consequence clause requires this). The
proposed resolution: ADR-010 is not superseded — its scope narrows to "the currently-shipped Skill
catalog and its consumption in `adopt`/`analyze`/`prompt`," and ADR-019 defines the general contract
that catalog's shape is now a valid instance of. No code in `detect.js`/`cli/src/skills-catalog.json`
changes this Entrega.

## Compatibility

- `status`, `verify`, `close`, `propose` are untouched (no diff lines beyond planning artifacts).
- `prompt` without `--skill`/`--list-skills` is byte-identical to Entrega 4's output.
- `workflow-service.js` gains no new exported function with side effects; a Skill Context Builder is
  additive, calling `explain()` as a normal caller.
- No new persisted state; no migration; no existing exit code changes.

## Risks

- **Scope creep toward the vision document's fuller sketch** (permissions, `type: command`/`agent`,
  verification checks) — mitigated by explicitly deferring Model C and stating the boundary design
  must evolve *toward* without implementing Hooks/verification/review this Entrega.
- **A third "context assembly" implementation diverging from `workflow-service.js`'s** — mitigated by
  requiring the Skill Context Builder to call `explain()`, never re-implement gate/readiness
  resolution (mirrors UX-R21–R23's discipline, restated as SK-R for this Entrega).
- **The ADR-010 naming collision causing real confusion** (two things called "Skill" in the same
  codebase, one static/unexecuted, one contract-based) if not documented prominently — mitigated by
  ADR-019 stating the relationship explicitly and `docs/domain-model.md` distinguishing both entries.

## Security

Threat model summary (`design.md` §11 has the full table): no Skill this Entrega reads the
filesystem directly (only the Context Builder does, via already-existing, already-hardened
`WorkflowService`/`resolveSddProvider` — path traversal is Change 0045's fixed problem, not a new
surface here), no Skill executes a command or reaches the network (structurally impossible — no such
capability can be registered), and artifact/spec/requirement content flowing into
`buildInstructions()`'s output is treated as untrusted data: a Skill's output is text for a human or
assistant to read, never a runtime directive AIEF itself interprets — prompt-injection content
inside a Change's own files cannot change what the Skill Service does, only what text ends up in the
generated prompt (the same trust boundary `prompt()` already has for `spec.md`/`tasks.md` content
today).

## Alternatives considered

- **Adopt the vision document's `skill.yaml`/`SKILL.md`/`permissions`/`verification.checks` contract
  literally.** Rejected for this Entrega: no cited evidence in this codebase supports
  `type: command`/`type: agent`/filesystem `permissions` yet (no Skill runs a command today,
  Hooks — the natural trigger for `type: agent`/verification checks — do not exist yet). Recorded as
  the explicit future evolution target (`design.md` §14), not discarded.
- **A class-based `Skill` interface.** Rejected — zero classes exist anywhere in `cli/src/`; every
  registry precedent (`requirement-providers/`, `sdd-providers/`) is a plain module map. Same
  reasoning ADR-016/ADR-017 already used.
- **Rename the new concept to avoid the ADR-010 collision (e.g., "Capability").** Considered and
  rejected: the vision document (§12) and the commissioning instruction both use "Skill" for exactly
  this evolution — renaming would create a *third* term for the same idea instead of resolving the
  collision the codebase already has.
- **A full plugin/marketplace/remote-loading registry.** Rejected — explicitly out of scope per the
  commissioning instruction and the same reasoning ADR-017 used to reject it for SDD providers: two
  or three known Skills, one static registry object.

## Success criteria

- The ADR-010 collision is named and resolved as an evolution, in ADR-019, not by implication.
- The Skill contract's every field/method is justified against a cited existing capability or a
  named future consumer (Hooks/Verification/Review) — not adopted from the vision sketch verbatim.
- Model C is evaluated and deferred with a stated, falsifiable condition for revisiting it.
- `prompt`'s byte output is unchanged without `--skill`/`--list-skills`; `status`/`verify`/`close`/
  `propose` are untouched.
- No new public command verb; ADR-015 respected.
- Registry, Context, Result and both initial Skills are each demonstrated against a real,
  reusable-not-duplicated data source (`workflow-service.js`, `resolveSddProvider`).
