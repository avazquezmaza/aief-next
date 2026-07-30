# Architecture Decision Log

Key decisions behind AIEF Next. Each entry follows a lightweight ADR format: decision, context, consequences. Entries are accepted unless explicitly marked otherwise.

---

## ADR-027: Loop is opt-in, per-Change attempt tracking over the unmodified verify pipeline — feedback is reused, never recomputed; retry is always a manual re-invocation, never automatic; `loop.md` mirrors ADR-026's `hooks.md` exactly

**Status: Accepted (2026-07-30), by the project owner.** Proposed alongside [Change 0057](../changes/0057-loop-verify-feedback-retry/)'s planning artifacts (`spec.md`/`tasks.md`); the third opt-in `manifest.json` extension following the pattern [ADR-026](#adr-026-harness-configuration-is-per-change-keyed-by-event-id-opt-in-via-manifestjson-disabling-and-logging-are-post-evaluation-filters-over-the-unmodified-adr-020-hook-runtime--never-a-second-hook-system-never-command-execution-never-blocking) established for Harness.

**Decision.**

> A Change's `manifest.json` may declare `loop: { verify: { maxRetries: <positive integer,
> default 3> } }`. When present, `aief verify --change <id>` becomes attempt-aware: the current
> attempt number is `(the count of "## Attempt" sections already in <changeDir>/loop.md) + 1` —
> derived from the visible file itself, never a hidden counter and never a `manifest.json` write
> (verify stays a read-mostly command; only `loop.md`, an opt-in artifact exactly like Harness's
> `hooks.md`, is ever written, and only by the calling command, never by any Hook or Skill).
> **Feedback is `VerificationReport.errors`** — the exact strings Structural Verification already
> computed and already prints — never a second, parallel analysis. The **outcome** is a pure
> function of three already-known facts (`passed`, `attempt`, `maxRetries`): `passed` →
> `"passed"`; `!passed && attempt < maxRetries` → `"retry_available"`; `!passed && attempt >=
> maxRetries` → `"exhausted"`. Loop prints one additive summary line after the existing report and
> Hook output, and appends one dated entry to `loop.md` — it never touches `report.passed`,
> `renderReport()`'s already-decided exit code, or `close()`'s own readiness check.
>
> **"Retry" names an outcome, never an action.** No code path introduced by this Change re-invokes
> `verify`, a Hook, a Skill, an assistant, or any process — a "retry" is the human or assistant
> running `aief verify --change <id>` again, by their own decision, exactly as they always could.
> Loop does not gain, and this Change does not introduce, any capability to execute anything
> automatically.
>
> `aief doctor --verbose` gains a conditional, read-only "Loop:" registry — every open Change with
> `loop.verify` configured, and its current attempt/status, computed the same way `aief verify`
> would but never writing `loop.md` itself. Absent entirely when no open Change configures Loop.
> `aief status --change <id>` gains **no** Loop section, and `aief close` gains **no** Loop
> gating — see "Why no `status`/`close` integration" below.

**Why this needs its own ADR.** A third opt-in `manifest.json` field with its own schema, a new
service module, a new per-Change persisted artifact, and a decision about which commands surface
it are each independently ADR-triggering (same bar ADR-016 through ADR-026 applied) — and because
"retry" is a word that, read carelessly, could imply automatic re-execution; this ADR exists
partly to foreclose that reading explicitly, the same way ADR-020 forecloses Hook command
execution.

**Why `loop.md` mirrors `hooks.md`, field for field.** Change 0056 already solved every structural
question this Change would otherwise re-litigate: visible vs. hidden state (ADR-009), append vs.
overwrite, what "safe to log" means (already-computed, already-printed strings only — never raw
content that wasn't already going to the terminal), and where responsibility for the write sits
(the orchestrating command, never the thing being observed). Reusing that shape exactly is not
laziness — it is the same "don't build a second Hook system" instruction this session has applied
consistently, generalized to "don't build a second opt-in-log system."

**Why no `status`/`close` integration.** `aief verify --change <id>`'s own Loop summary plus
`loop.md` already answer every question `status --change` could — a third surface for the same
three facts (attempt, last result, decision) either duplicates them or invites drift between two
independently-maintained renderers. `close()` gating was never requested and would be a real new
authority (Loop deciding whether a Change *may* close) — a materially bigger decision than
"visibility," explicitly out of this Entrega's scope; if wanted later, it is a separate, explicit,
separately-reviewed Change, not an implication of this one.

**Why attempt counting reads `loop.md` instead of a manifest field.** A `manifest.json` write from
`verify()` — a command documented as "Writes nothing" for the whole-project case and, before this
Change, for the `--change` case too — would be a materially bigger behavioral shift than adding
one more opt-in artifact file, and would blur `manifest.json`'s existing role (human-authored
configuration, never runtime-mutated by any command in this codebase — `close()` itself writes
`change.md`, never the manifest, per Change 0043's own B1 finding). `loop.md` is additive,
visible, and answers "how many attempts so far" exactly as honestly as counting real attempts
requires — deleting or hand-editing it changes future numbering, which is the expected,
transparent consequence of Markdown being the source of truth (ADR-009), not a bug to guard
against.

**Relationship to ADR-020/ADR-026.** No new Hook event; `hook.js`'s closed catalog, `hooks/
index.js`, `hook-service.js`, `harness-service.js` are all untouched — zero diff. Loop is
verify-command bookkeeping, not a Hook reacting to `verify.completed`.

**Relationship to ADR-016 (`manifest.json`).** `loop` joins `sdd`/`track`/`harness` as another
optional, additive top-level field — required-field set unchanged; a legacy Change (no manifest,
or a manifest without `loop`) is entirely unaffected.

**Alternatives considered.**

- **Store the attempt counter in `manifest.json` itself.** Rejected — see "Why attempt counting
  reads `loop.md`" above; would make `verify()` write to a file no command in this codebase writes
  to today, a bigger and riskier precedent than one more opt-in log file.
- **Auto re-run `aief verify` (or invoke an assistant) when a retry is "available."** Rejected
  outright, per the commissioning instruction's explicit prohibition — Loop reports an outcome,
  it never acts on it.
- **A `status --change` Loop section, mirroring Harness's own conditional section exactly.**
  Considered; rejected for this Entrega — see "Why no `status`/`close` integration."
- **Gate `aief close` on `exhausted`.** Considered; rejected — a real new authority decision, not
  requested, and out of proportion to "visibility," this Entrega's stated goal.

**Consequences.**

- `cli/src/core/domain/hook.js`, `cli/src/hooks/index.js`, `cli/src/core/services/hook-service.js`,
  `cli/src/core/services/hook-context.js`, `cli/src/core/services/harness-service.js`,
  `cli/src/core/domain/ai-specs.js`, `cli/src/detect.js`, and `change-verifier.js`'s report
  computation are untouched by this Entrega — zero diff lines.
- A Change with no `loop` field sees byte-identical `aief verify` (whole-project and `--change`)
  and `aief doctor` (default and `--verbose`) output, and `loop.md` is never created.
- `aief close`'s readiness check and `aief status --change`'s existing sections are unaffected —
  no new authority, no new read surface introduced there.
- A future Change proposing automatic retry execution, `status`/`close` integration, or a
  manifest-persisted counter must amend or supersede this ADR first, not merely cite it.

---

## ADR-026: Harness configuration is per-Change, keyed by event id, opt-in via `manifest.json`; disabling and logging are post-evaluation filters over the unmodified ADR-020 Hook Runtime — never a second Hook system, never command execution, never blocking

**Status: Accepted (2026-07-30), by the project owner.** Proposed alongside [Change 0056](../changes/0056-harness-hooks-visibility/)'s planning artifacts (`spec.md`/`tasks.md`); the first user-facing configuration surface over the Hook Runtime [ADR-020](#adr-020-a-hook-is-a-versioned-capability-gated-closed-catalog-event-observer-blocking-authority-is-contractually-reserved-but-structurally-inert-this-entrega-effects-deferred)
established (Change 0048) as internally-registered and unconfigurable.

**Decision.**

> A Change's `manifest.json` may declare `harness: { log: boolean, hooks: { "<event id>":
> { disabled: string[] } } }` — keyed by `hook.js`'s own closed event catalog
> (`prompt.prepared`/`verify.completed`), not by a new, invented lifecycle vocabulary. Structural
> shape (`harness`/`harness.log`/`harness.hooks.<event>.disabled`, event ids checked against a
> small duplicated `HARNESS_EVENT_VALUES` constant) is validated in `change-manifest.js`, mirroring
> the existing `sdd` field's precedent exactly — including the same discipline of *not* importing
> the runtime registry (Hook ids inside `disabled` are shape-checked only as non-empty strings
> here). Real Hook-id existence is resolved at runtime by a new `harness-service.js`
> (`resolveHarnessConfig()`), mirroring `sdd-provider-resolver.js`'s own separation of structural
> validation from registry-backed resolution. `hook-service.js`/`hooks/index.js`/`hook.js` are not
> modified — every registered Hook is still evaluated, unconditionally, for every fired event,
> exactly as ADR-020 specified; `disabled` is implemented as a **post-evaluation filter**
> (`partitionOutcome()`) over an already-computed `evaluateEvent()` result, never a change to what
> gets evaluated. `manifest.harness.log === true` additionally opts the targeted Change into a
> visible, append-only `<changeDir>/hooks.md` Markdown log of every (non-disabled) Hook's result
> for the fired event — written by the calling command (`prompt()`/`verify()`), never by a Hook
> itself, preserving ADR-020's "a Hook never writes a file" guarantee at the Hook level.
>
> `aief doctor --verbose` gains a Harness section listing the static, project-wide Hook Registry
> (unconditional once `--verbose` is passed, since `--verbose` output has no backward-compatibility
> promise — Change 0054/0055 precedent). `aief status --change <id>` gains a Harness section
> present only when that Change's manifest declares `harness` — reporting **configuration**
> (log on/off, disabled Hooks per event, unknown-id warnings), never a fabricated execution-count
> summary, since `status` never fires a Hook and cannot honestly report a last-run outcome without
> either lying or re-deriving it from `hooks.md` as a second, driftable source of the same fact.

**Why this needs its own ADR.** A new, user-facing `manifest.json` field with its own nested
schema, a new service-layer module, a new per-Change persisted artifact (`hooks.md`), and a
decision about how far Hook visibility extends into `doctor`/`status` are each independently
ADR-triggering (same bar ADR-016 through ADR-025 applied) — and because this Change touches the
one subsystem (Hooks) whose entire design center, ADR-020, is a set of hard capability/authority
limits this ADR must explicitly reaffirm rather than quietly erode.

**What this ADR explicitly does NOT change (ADR-020 restated, not superseded).** No Hook capability
gains `writeFiles`/`executeCommands`/`network` — `FORBIDDEN_CAPABILITIES` in `hook.js` is untouched,
and no code introduced by this Change spawns a process, reads `manifest.json` as a command string,
or otherwise executes anything (verified by grep as closing evidence, spec.md R9). No Hook gains
blocking authority — `canBlock` in `hook-service.js` still requires `capabilities.block === true`
**and** a `phase: "pre"` event, and the catalog still contains none; a `disabled` Hook is simply
excluded from rendering, and a `failed`/`invalid` Hook (now visible for the first time) still
cannot flip `prompt`/`verify`'s own exit code or PASS/FAIL. `hooks.md` is written by the
orchestrating command, never by a Hook's own `evaluate()` return value — a Hook still, structurally,
never touches the filesystem.

**Why keyed by event id, not the commissioning brief's illustrative `beforePrompt`/`afterPrompt`/
`beforeVerify`/`afterVerify` names.** Those names describe a four-phase pre/post split that does
not exist in this codebase — `hook.js`'s catalog is two events, both already `phase: "post"`
(ADR-020 §"why the event catalog is closed and evidence-based, not adopted from the vision
document"). Inventing a four-key config surface over a two-event, no-`pre`-phase runtime would let
a user configure something (`beforePrompt`) that can never fire — a worse compatibility/honesty
trade than adapting the brief's *intent* (name the moment a Hook fires) to the *real* catalog.

**Why `status --change` reports configuration, not execution counts.** Considered the
commissioning brief's own illustrative `Hooks: 3 configured, 2 passed, 1 not run` line; rejected
as a literal design for this Entrega specifically because `status` is a pure, no-fire inspector —
producing that line would require either (a) `status` silently firing Hooks itself (a new,
surprising side effect for a command documented as "Writes nothing" and, worse, semantically wrong
since Hooks fire *from* `prompt`/`verify`, not from inspecting one), or (b) parsing `hooks.md` back
into counts, creating a second, driftable representation of the same historical fact. Configuration
(what *would* run, what's disabled) is the one thing `status` can report honestly without firing
anything or re-deriving a fact it already wrote once, in `hooks.md`, in its original form.

**Relationship to ADR-016 (`manifest.json`)/ADR-017 (`sdd`).** `harness` joins `sdd`/`track`/etc. as
another optional, additive top-level manifest field — `MANIFEST_SCHEMA_VERSION`/required-field set
unchanged; a legacy Change (no manifest) is entirely unaffected, per ADR-016's own precedent.

**Alternatives considered.**

- **Let a Change's manifest define brand-new, user-authored Hooks (arbitrary command/id/event).**
  Rejected outright — recreates exactly the "second Hook system" the commissioning instruction
  warned against, and reopens Model C (command execution) that ADR-020 deliberately closed off;
  any such proposal must first amend or supersede ADR-020, not ride in on this Change.
- **Execute a shell command declared in `manifest.json` when a Hook "fires."** Rejected outright,
  for the same reason, and because the commissioning instruction explicitly required reviewing
  existing conventions before any shell execution — the existing convention is that nothing in
  this codebase executes an arbitrary command from configuration; introducing the repository's
  first one inside the Hook Runtime, of all places, would contradict ADR-020's whole point.
- **Thread `disabled` into `hook-service.js`'s `evaluateEvent()` so a disabled Hook is never even
  evaluated.** Considered; rejected for this Entrega — every registered Hook is pure and
  side-effect-free (ADR-020), so the wasted evaluation is free, and keeping `hook-service.js`
  untouched (zero diff) is a stronger compatibility/review guarantee than a small performance
  optimization with no observable difference.
- **Make `doctor`'s Harness section unconditional (not `--verbose`-gated).** Rejected — `doctor`
  never showed anything about Hooks before this Change; an unconditional addition would change
  every project's default `doctor` output, violating the commissioning instruction's own
  compatibility bar (same reasoning Change 0055 applied to Standards).

**Consequences.**

- `cli/src/core/domain/hook.js`, `cli/src/hooks/index.js`, `cli/src/core/services/hook-service.js`,
  `cli/src/core/services/hook-context.js` are untouched by this Entrega — zero diff lines.
- A Change with no `harness` field sees byte-identical `doctor` (default)/`prompt`/`verify`
  output, and no new `status --change` section.
- `FORBIDDEN_CAPABILITIES`/blocking-authority limits (ADR-020) remain fully in force; a future
  Change proposing command execution or blocking Hooks must amend or supersede ADR-020 first, not
  merely cite this ADR.
- `hooks.md`, once a Change opts in, accumulates via append only — never truncated, never rewritten
  by this Change's own code path.

---

## ADR-025: `aief prompt` is the primary consumer of project `ai-specs/standards/`; `aief doctor --verbose` gains a conditional report; the shared resolver is extracted from ADR-024's Skill wiring

**Status: Accepted (2026-07-30), by the project owner.** Proposed alongside [Change 0055](../changes/0055-lidr-standards-integration/)'s planning artifacts (`spec.md`/`tasks.md`); the second activation of the resolver [ADR-023](#adr-023-ai-specs-resources-are-discovered-and-resolved-against-aiefs-built-ins-never-copied-project-always-wins-on-id-collision-unwired-dormant-this-change) left dormant, after [ADR-024](#adr-024-aief-doctor-is-the-first-and-this-change-only-consumer-of-the-ai-specs-resolver-activation-is-directory-presence-never-a-changes-manifestjson)'s Skill wiring.

**Decision.**

> `cli/src/core/domain/ai-specs.js` gains a shared internal `resolveResourceRecommendations(builtins,
> projectResources, resourceDirLabel)`, extracted from ADR-024's `resolveSkillRecommendations()`
> (refactored to call it, with proven-identical output — Change 0054's own test suite re-run
> unmodified as the regression proof) and reused by a new `resolveStandardRecommendations(builtins,
> cwd)`. The description heuristic is renamed `deriveResourceDescription`;
> `deriveSkillDescription` remains exported, identical, for backward compatibility.
>
> **`aief prompt` — not `aief doctor` — is this Change's primary integration point**, because it is
> the one existing surface that already both lists *and consumes* standards: its `standardsBlock`
> is real text inside the prompt an assistant receives, not a side report. The rendering is
> designed so a builtin-only project reconstructs today's exact
> `- knowledge/standards/<file>` line, id for id — provably byte-identical, never a re-derived
> approximation. A project standard resolves to its own real path
> (`ai-specs/standards/<id>.md`), tagged `[project]`/`[project override]` — an assistant reading the
> generated prompt is pointed at the file that actually governs, not a stale built-in copy.
>
> `aief doctor --verbose` gains a **conditional** "Standards:" report — present only when
> `discoverAiSpecs(cwd).standards` is non-empty. Unlike Skills (ADR-024), `doctor` never displayed
> anything about standards before this Change, so there is no existing section to extend
> compatibly; making the whole section's *appearance* conditional (not just its detail) is what
> keeps every project without `ai-specs/standards/` — the overwhelming majority — byte-identical,
> matching the compatibility bar Change 0054 established via a different mechanism (there, an
> always-present section gained an optional tag; here, an always-absent section gains a
> conditional appearance).

**Why `prompt`, reversing ADR-024's choice of `doctor`.** ADR-024 deliberately chose the
lowest-risk, write-free surface (`doctor`) over `prompt`'s assistant-facing content, precisely
because Skills already had a rich, per-item description in `doctor` to extend non-disruptively.
Standards have no such existing `doctor` surface — extending `doctor` unconditionally would have
meant printing a brand-new "Standards:" header for every project, a real compatibility break the
commissioning instruction explicitly forbade ("no cambies el comportamiento de proyectos que no
tengan ai-specs/standards/"). `prompt`'s existing bullet-per-file convention, by contrast, can be
reconstructed exactly for the common case, making it the *safer* choice here despite touching
assistant-facing text — the opposite ranking from ADR-024, for a concretely different reason, not
a reversal of ADR-024's own reasoning.

**Relationship to ADR-023/ADR-024.** `discoverAiSpecs()`/`resolveResources()` are unmodified — zero
diff lines. `resolveSkillRecommendations()`'s public contract and observable output are unchanged;
only its internal implementation now delegates to the shared helper this ADR introduces.

**Relationship to ADR-013/ADR-015.** No new command; `doctor --verbose` reuses the flag Change
0054 already added. Neither ADR is implicated.

**Alternatives considered.**

- **Make `doctor` the primary integration point, as with Skills.** Rejected — see above; no
  existing `doctor` output to extend compatibly for standards.
- **Duplicate the tagging/precedence-rendering logic between Skills and Standards instead of
  extracting a shared helper.** Rejected — directly contradicts the commissioning instruction
  ("no dupliques la lógica de precedencia") and would let the two drift silently.
- **Copy the project's resolved standard into `knowledge/standards/` so `prompt` needs no new
  rendering logic.** Rejected outright — violates "AIEF consume LIDR, nunca lo copia" (ADR-023)
  and would create exactly the driftable duplicate ADR-023 already rejected for Skills.

**Consequences.**

- `cli/src/detect.js`, `analyze()`, `createStandards()`, `standardsForProject()`,
  `bootstrapHere()`, and `resolveSkillRecommendations()`'s observable output are untouched by this
  Entrega — zero diff lines, zero behavioral change.
- `aief prompt` output is byte-identical to before this Change for any project without
  `ai-specs/standards/`; `aief doctor`'s output (with or without `--verbose`) is likewise
  byte-identical when `ai-specs/standards/` is empty or absent.
- A future Change wiring `bootstrap`/`analyze` to the same Standards resolver must cite this ADR
  and ADR-023/ADR-024 rather than inventing a fourth precedence or activation rule.

---

## ADR-024: `aief doctor` is the first (and, this Change, only) consumer of the ai-specs resolver; activation is directory presence, never a Change's `manifest.json`

**Status: Accepted (2026-07-30), by the project owner.** Proposed alongside [Change 0054](../changes/0054-lidr-skill-recommendations/)'s planning artifacts (`spec.md`/`tasks.md`); activates the wiring [ADR-023](#adr-023-ai-specs-resources-are-discovered-and-resolved-against-aiefs-built-ins-never-copied-project-always-wins-on-id-collision-unwired-dormant-this-change) left deliberately dormant.

**Decision.**

> `cli/src/core/domain/ai-specs.js` gains `resolveSkillRecommendations(builtins, cwd)` — a thin,
> pure composition of ADR-023's existing `discoverAiSpecs()`/`resolveResources()`, adding only
> what rendering needs: a derived `description` for a project-sourced Skill (its file's first
> non-empty line, a leading `#` stripped), a fixed `because` line naming the source file, and an
> `overridesBuiltin` boolean. `aief doctor`'s `printSkills()` — its **one and only caller** — is
> the sole integration point: it prints a project-sourced Skill inline with built-ins, tagged
> `[project]`/`[project override]`, in the deterministic order `resolveResources()` already
> guarantees. A new `--verbose` flag on `doctor` reveals `source`/`path`/`overrides` per entry and
> full resolver warning text; the default output adds at most one bracketed tag per line and, when
> warnings exist, exactly one summary line pointing at `--verbose` — never a raw warning dump or a
> stack trace. `bootstrap`/`analyze`/`prompt` — the Skill Catalog's three other consumers — are
> **not** touched; each keeps calling `recommendSkills()` directly, unaware this resolver exists.

**Why `doctor` and not `bootstrap`/`analyze`/`prompt`.** `printSkills()` has exactly one caller
(`doctor()`, confirmed by inspection) and `doctor` is this codebase's only Skill-recommending
command that never writes a file — "Doctor never modifies your project" is already its own
documented guarantee. Wiring here first proves the resolver end-to-end at the lowest possible
risk: no adopted project's `knowledge/skills.md` (`bootstrap`), no Analysis Change's seeded
content (`analyze`), and no assistant-facing prompt text (`prompt`) changes as a side effect of
this Change. Extending to those three is explicitly left to future, separately-scoped Changes.

**Activation gate is directory presence, not a Change's `manifest.json`.** The commissioning
instruction for this Change listed "no modifiques proyectos sin `manifest.json`" among its rules.
Read literally against this repository's actual state — zero Changes under `changes/` carry a
`manifest.json` (confirmed by inspection, same fact ADR-016/`change-loader.test.js`'s own
zero-drift regression already established) — that reading would make the feature permanently
unreachable, which cannot have been the intent. This Change's real gate is the one ADR-023 already
established: `ai-specs/skills/*.md` presence in the *project* directory (not any Change's
manifest). No file is ever written by `resolveSkillRecommendations()` or by `doctor --verbose`, in
any project, with or without a manifest anywhere — so the literal concern the rule was protecting
against (an unreviewed project being modified) does not arise either way. Recorded here rather
than resolved silently, per this project's own precedent for surfacing an ambiguous instruction
instead of guessing past it.

**Relationship to ADR-023.** Fully consistent — this Change passes `recommendSkills(project)`'s
output as ADR-023's generic `builtins` argument, exactly as ADR-023's own "alternatives
considered" anticipated. `discoverAiSpecs()`/`resolveResources()` are unmodified; zero diff lines
in `cli/src/core/domain/ai-specs.js`'s existing exports.

**Relationship to ADR-010.** The Skill *Catalog* (`skills-catalog.json`, `recommendSkills()`,
`detect.js`) is untouched — zero diff lines. This Change only changes what `doctor` prints after
calling `recommendSkills()`, never what `recommendSkills()` itself computes.

**Relationship to ADR-013/ADR-015.** `--verbose` is an additive, opt-in flag on an existing
command — not a new command verb — so neither ADR is implicated; ADR-022's scoped thaw is not
invoked because nothing here needed it.

**Alternatives considered.**

- **Wire into `bootstrap`/`analyze`/`prompt` in this same Change.** Rejected — out of scope by
  explicit commissioning instruction; each is a write path (`bootstrap`) or assistant-facing
  content (`analyze`, `prompt`), a materially higher-risk first integration than a read-only
  report.
- **Gate activation behind a Change's `manifest.json` field (e.g. `manifest.aiSpecs.enabled`).**
  Considered, per the commissioning instruction's literal wording; rejected — no Change in this
  repository has ever carried a manifest, `doctor` operates at the project level (not a single
  Change), and ADR-023 already established directory presence as this feature's opt-in mechanism.
- **A `--json` output mode alongside `--verbose`.** Rejected for this Entrega — no evidenced
  consumer needs machine-readable `doctor` output yet (ADR-008); `--verbose` alone satisfies the
  commissioning instruction's "detail behind a flag" requirement.

**Consequences.**

- `cli/src/detect.js`, `skillsDoc()`, `analyze()`'s context building, and `prompt()`'s
  `skillsBlock` are untouched by this Entrega — zero diff lines, zero behavioral change.
- `aief doctor`'s output (with or without `--verbose`) is byte-identical to before this Change for
  any project without `ai-specs/skills/*.md`.
- A future Change wiring `bootstrap`/`analyze`/`prompt` to the same resolver must cite this ADR
  and ADR-023 rather than inventing a third precedence or activation rule.

---

## ADR-023: `ai-specs/` resources are discovered and resolved against AIEF's built-ins, never copied; project always wins on id collision; unwired (dormant) this Change

**Status: Accepted (2026-07-30), by the project owner.** Proposed alongside [Change 0053](../changes/0053-lidr-integration/)'s planning artifacts (`spec.md`/`design.md`/`tasks.md`); commissioned as the first, deliberately narrow step of LIDR integration — "AIEF consume LIDR, nunca lo copia."

**Decision.**

> A LIDR/specboot-style project may carry an `ai-specs/skills/*.md` and/or `ai-specs/standards/*.md`
> directory. `discoverAiSpecs(cwd)` (`cli/src/core/domain/ai-specs.js`) reads these — filename stem
> as id, file content as-is — without ever copying a file into the AIEF-managed project structure.
> `resolveResources(builtins, projectResources)` combines a caller-supplied list of built-in
> resources (plain `{ id, ... }` objects — the function is generic, not coupled to the Skill
> Catalog's or `knowledge/standards/`'s specific shape) with the discovered project resources under
> one fixed rule: **project wins on id collision**, a human-readable warning is recorded for every
> override, and the two definitions are **never merged field-by-field** — the resolved entry is
> always wholly the project's or wholly AIEF's built-in, never a hybrid. A project id absent from
> the built-ins is simply added. Read errors (an unreadable directory, e.g. a file where a
> directory is expected) and duplicate ids *within* the project's own directory are reported as
> diagnostics, never thrown. **This Change wires the resolver into nothing** — no command, no
> prompt, no bootstrap step calls it yet; a project without `ai-specs/` and a project with one
> behave, observably, identically today, because nothing observable consumes this module yet.

**Why this needs its own ADR.** This is the seventh new architectural boundary this project has
introduced (ADR-016 through ADR-022 before it) — same trigger, recorded for the same reason: a new
external-resource contract (a project directory AIEF did not create, read by AIEF for the first
time) and a new precedence policy are both ADR-triggering events, this Entrega introduces both.

**Why unwired rather than integrated into `recommendSkills()`/`listStandards()` now.** The
commissioning instruction for this Change is explicit and narrow: no CLI flow change, no bootstrap
change, no observable behavior change for any project, existing or new. Wiring this resolver into
`detect.js`'s `recommendSkills()` or `cli.js`'s `listStandards()`/`createStandards()` would change
`aief bootstrap`/`aief analyze`/`aief prompt`'s real output for any project that adopts
`ai-specs/skills|standards/` — a real, user-visible capability change, and exactly the kind of
change this Change's own scope excludes ("el objetivo NO es implementar todo LIDR"). The resolver
is therefore built, tested and documented as a complete, correct, standalone unit — the integration
into a real command's data path is left as a distinct, later, separately-scoped Change, so that
decision (which command, what the resulting prompt/analyze output should look like) gets its own
review rather than riding in as a side effect of this one.

**Relationship to ADR-010.** The Skill *Catalog* (`skills-catalog.json`, `recommendSkills()`) is
untouched — zero diff lines. This ADR's resolver is generic over "a list of `{ id, ... }` objects";
it does not know about detectors, `signal` strength, or `promptContext`. A future Change that wires
Skill Catalog entries through it would pass `skillsCatalog.skills` as the `builtins` argument
without this module needing to change.

**Relationship to ADR-015.** Not implicated — this Change adds no new command, does not touch
onboarding, and does not simplify or merge documentation. ADR-015's freeze (new commands,
onboarding, documentation simplification — see [ADR-022](#adr-022-adr-015s-freeze-is-explicitly-thawed-for-aief-31-by-the-project-owners-direct-decision--not-by-change-0042s-consolidation))
is neither invoked nor needed here.

**Alternatives considered.**

- **Copy `ai-specs/` content into `knowledge/`, like `aief bootstrap` does for AIEF's own
  standards templates.** Rejected outright — violates the explicit commissioning principle
  ("AIEF consume LIDR, nunca lo copia") and would create a second, driftable copy of
  project-authored content.
- **Wire the resolver into `recommendSkills()`/`listStandards()` in this same Change.** Rejected —
  out of scope by explicit instruction; deferred to a future Change once this module's contract is
  reviewed and accepted on its own.
- **A YAML/front-matter schema for skill/standard files (id, description, detector, etc.).**
  Rejected for this Entrega — no real `ai-specs/` project sample exists in this repository to
  ground such a schema in evidence (ADR-008); filename-as-id, raw content, is the simplest contract
  that satisfies discovery and precedence without inventing an unverified format.

**Consequences.**

- `detect.js`, `cli.js`'s `recommendSkills()`/`listStandards()`/`createStandards()`, `bootstrap`,
  `analyze`, `prompt`, and every existing command are untouched by this Entrega — zero diff lines,
  zero behavioral change, with or without a project's `ai-specs/` directory present.
- No new command, no new CLI flag, no new persisted state, no file is ever written by this module
  (`discoverAiSpecs`/`resolveResources` are both read-only/pure).
- A future Change proposing the real wiring (which command surfaces project `ai-specs/` resources,
  and how) must cite this ADR's resolver contract rather than inventing a second precedence rule.

---

## ADR-022: ADR-015's freeze is explicitly thawed for AIEF 3.1, by the project owner's direct decision — not by Change 0042's consolidation

**Status: Accepted (2026-07-30), by the project owner.**

**Decision.**

> ADR-015 froze **new commands**, **onboarding**, and **documentation simplification** until Change
> 0042's usability study ran and its evidence was consolidated. That study was never run —
> `changes/0042-usability-validation-protocol/consolidation.md` is still the empty template
> (`## 1. Sessions summary` with no data filled in). ADR-015 itself anticipated exactly this kind
> of override: *"The thaw is a separate, later, explicit decision — it does not happen
> automatically when the study ends; it happens when a human reads the consolidation and says
> so."* This ADR **is** that explicit decision, made directly by the project owner on 2026-07-30,
> commissioning **AIEF 3.1** — without waiting for Change 0042 to run. The freeze is lifted
> specifically for the AIEF 3.1 initiative (tracked under `feat/v3.1` and its Changes, starting at
> Change 0052); it is not a blanket repeal of ADR-015's reasoning for any future initiative.

**Why override rather than run the study first.** The owner weighed the study's evidentiary value
against the cost of the wait (recruiting ≥5 participants across experience levels, an independent
moderator, session time) and chose to proceed on the same reframe ADR-013/ADR-015 already
established as the goal — discoverability and ease of adoption, informed by the real dogfooding
signal already on record (`docs/history/dogfooding-findings.md`) and by the Core 3.0 build itself
(Changes 0043–0051) — rather than block AIEF 3.1 on a study that has not started. This is a
judgment call by the accountable human, exactly the authority ADR-015 §"Consequences" reserved for
the owner alone.

**What stays true from ADR-015, unweakened.** DELETE/ARCHIVE candidates (R10/R11/R13/R14/R12, the
Change 0038 map) and Type↔Track ([Change 0039](../changes/0039-type-track-derivation-design/))
remain frozen — this thaw is scoped to the three items AIEF 3.1 actually needs (new commands,
onboarding, documentation simplification) and does not touch the rest of ADR-015's list. Change
0042's protocol is not discarded — running it later, on AIEF 3.1's result, remains available and
arguably more useful once there is a redesigned onboarding flow to test.

**Relationship to ADR-013.** AIEF 3.1's first Change (0052) must still name what it removes, not
merely add — the merge of `init`/`adopt` into `aief bootstrap` (see Change 0052) is the concrete
instance: `bootstrap` replaces both as the public commands (their logic becomes internal, invoked
only by `bootstrap`), not an additive third command living beside the two it overlaps with. This
ADR does not itself waive ADR-013 — each Change under AIEF 3.1 must independently satisfy it.

**Consequences.**

- Change 0052 (and subsequent AIEF 3.1 Changes) may introduce new command surface and touch
  onboarding/documentation, where every prior Core 3.0 Change (0043–0051) was structurally
  required to avoid both.
- Each AIEF 3.1 Change must still individually satisfy ADR-013 (name what it removes/merges).
- The DELETE/ARCHIVE map and Type↔Track design stay frozen — unaffected by this ADR.
- Change 0042's protocol remains valid and un-superseded; it may still be run later, against
  AIEF 3.1's result, as a separate, later, explicit decision.

---

## ADR-021: Verification splits into Structural (existing) and Requirement (new, evidence-based, deterministic) layers; evidence is consumed and normalized, never generated; `close()` and Workflow-gate integration are deferred

**Status: Accepted (2026-07-27)** — status line updated by [Change 0051](../changes/0051-core3-documentation-rebuild/) to reflect [Change 0049](../changes/0049-core3-verification-engine/)'s own closure record (`change.md`: "Status: Closed (2026-07-27)"); the decision text below is unchanged. Proposed alongside the rest of Change 0049's planning artifacts (`proposal.md`/`spec.md`/`design.md`/`tasks.md`/`verification.md`); implementation completed and the Change closed the following day, per that Change's own evidence.

**Decision.**

> **Verification** (AIEF Core 3.0, Entrega 7) splits explicitly into two layers that were previously conflated under `aief verify`: **Structural Verification** (`change-verifier.js`, unchanged — repository/Change file integrity, manifest consistency, evidence-classification heuristic, open-task count) and **Requirement Verification** (new — for each requirement a Change's SDD artifacts declare, a deterministic, evidence-grounded verdict). Requirement Verification never uses AI, never executes a test or a command, never reaches the network, and never invents a requirement↔task/test linking convention this repository does not already, verifiably, use. A **Verification Rule** is a plain, statically-registered object (no class) — `id`/`version`/`title`/`description`/`scope`/`capabilities`/`appliesTo(context, requirement)`/`evaluate(context, requirement, evidence)` — evaluated against pre-resolved **Evidence** (six named types; only `artifact_state`, reusing the SDD Provider's own normalized states, and `file_assertion`, a path-contained filesystem check, are SUPPORTED this Entrega; `test`/`manual_attestation` are DEFINED but never sufficient alone; `command_result`/`external_reference` are REJECTED, requiring execution/network). Per-rule results use seven statuses (`passed`/`failed`/`not_applicable`/`blocked`/`unsupported`/`invalid`/`error`) — `failed` (a real, evaluated non-compliance verdict) is kept structurally distinct from `error` (an engine fault) and `invalid` (a bad input), a three-way distinction no prior Entrega's capability needed since none of them render a pass/fail verdict about anything. Aggregation is a five-state, fixed-precedence policy (`ERROR > INVALID > FAIL > INCOMPLETE > PASS`) — never a boolean reduction, and missing evidence is `INCOMPLETE`, never silently rounded to `PASS`. `aief verify` gains exactly one new, opt-in flag (`--requirements`); its default (no-flag) output and exit code are byte-identical to Entrega 6's. `verify.completed`'s existing Hook contract (`operation.result` = the legacy structural report) is unchanged, with or without the flag. Workflow-gate and `close()` integration are evaluated and explicitly deferred — no `"verification"` gate id is added anywhere, even prepared-inert; `close()`/`markClosed()`/`checkChangeReadiness()` gain zero diff lines.

**Why this needs its own ADR.** This is the sixth new architectural boundary/stable-internal-interface this project has introduced (ADR-016 through ADR-020) — the same instruction that produced each of those records this one for the same reason: a new boundary (Structural/Requirement split), a new Evidence Model with an explicit supported/unsupported/rejected typology, a new capability model, a new five-state aggregation policy distinct from every prior Entrega's own result vocabulary, and a decision about `aief verify`'s own long-standing default behavior are each independently listed as ADR triggers, and this Entrega introduces all five.

**The Evidence Model is grounded in what this repository can already prove, not in an invented authoring convention.** Inspection found the SDD Provider's own `Requirement`/`Task` contracts (`sdd-model.js`, Entrega 3) explicitly document that `Task.requirements` is **always `[]`** — "no Change in this repository links a task to a requirement id in any machine-checkable way" (SDD-R21). Any rule assuming such a link exists would be inventing a convention with zero real adoption and would misjudge every Change closed before this Entrega by a rule that didn't exist when they were written — exactly the failure mode ADR-008's evidence discipline exists to prevent. The one convention that genuinely *does* exist, organically, across every `verification.md` this session's own Entregas 2–6 produced, is a scenario-table column citing `spec.md` requirement ids — this is the real signal `requirement-has-traceability` (this Entrega's first rule) checks, and it is scoped honestly: it proves a requirement was *considered* in verification planning, explicitly never that it was *satisfied*.

**Why Requirement Verification stays out of `close()` and Workflow gates this Entrega.** `close()` is this codebase's one write-critical command outside Change-creation; Entrega 6 already deferred Hook integration there for the same reason, and nothing about a two-rule Requirement Verification layer — whose `requirement-has-traceability` rule would report `failed` for every requirement not yet cited in `verification.md`, a real but potentially disruptive finding for Changes written before this convention existed — changes that risk calculus. No `"verification"` Workflow gate id is added even as a prepared-inert slot (a stronger deferral than Entrega 3's own `specification` gate, which *was* added inert) — no consumer or design exists yet for how a Workflow stage should react to an `INCOMPLETE`/`FAIL` verdict, and preparing an unused slot without one would be speculative.

**What routes through the boundary.** Any Requirement Verification need for Change/Workflow/SDD facts — via Verification Context, which reuses `workflow-service.js`'s `explain()` (the exact call `verify()` already makes since Entrega 6, for the Post-Verify Hook — zero new calls) and adds exactly one new, safe, fixed-filename read (`verification.md`, under the already-trusted Change directory — no user-controlled path component, no new class of symlink/traversal risk).

**What does not route through it.** `close()`'s write path (unchanged); the Workflow Engine's gate/transition authority (no Verification Rule or Service function can approve a gate, change `track`/`stage`, or execute a transition — enforced by absence, the same discipline ADR-018/020 already used); `evidence.md` as a per-requirement evidence source (confirmed by inspection to be narrative, human-authored, whole-document-heuristic-classified — `classifyEvidence()`, Change 0043 — never structured; this Entrega does not make it authoritative and does not introduce a parallel structured evidence file, Option A of three evaluated: consume, validate, normalize — never generate, never modify).

**Relationship to ADR-019/020.** Verification Rules mirror the exact plain-module, capability-gated, frozen-input, Service-owns-the-identity-fields pattern Skills and Hooks already established — including proactively applying the `appliesTo()` non-applicable-status whitelist fix Entrega 5's adversarial review found reactively for Skills (SK-R20-equivalent) and Entrega 6 applied proactively for Hooks (HK-R31) — designed in from the start here (VR-R29) rather than left for a third review to find again. No Verification Rule invokes the Skill Service or the Hook Service, and neither of those invokes Verification — no new coupling direction is introduced beyond CLI → Verification Service → Verification Registry → Rule.

**Alternatives considered.**

- **Invent a requirement↔task/test linking convention and retrofit it onto Changes 0043–0048.** Rejected — would misrepresent already-closed Changes as non-compliant by a rule that postdates them (ADR-008's evidence discipline).
- **A structured `evidence.json`/`evidence.yaml` file (Evidence Model Option B).** Rejected this Entrega — no real authoring gap justifies a new persistence surface yet; `verification.md`'s existing citation pattern already provides real signal without a new format or migration.
- **Wire `--requirements` results into `close()`'s readiness check, or add a `"verification"` Workflow gate.** Rejected — same write-critical-path caution Entrega 6 already applied to `close.requested`.
- **A class-based `VerificationRule` interface.** Rejected — zero classes exist anywhere in `cli/src/`; Verification Rules mirror the same plain-module pattern as `requirement-providers/`/`sdd-providers/`/`skills/`/`hooks/`.

**Consequences.**

- `change-verifier.js`, `close()`, `markClosed()`, `checkChangeReadiness()`, `status`, `propose`, Skills Runtime, Hooks Runtime, WorkflowService, SDD Provider, `gate-evaluator.js`, and every workflow definition JSON are untouched by this Entrega — zero diff lines.
- `aief verify` without `--requirements` is byte-identical to Entrega 6's output, including exit code; `verify.completed`'s Hook contract is unchanged either way.
- `command_result`/`external_reference` evidence and `writeFiles`/`executeCommands`/`network`/`assistantRequired` capabilities cannot be registered this Entrega — any future Change proposing them must first amend or supersede this ADR.
- No new persisted state; no new write path; no new command verb; no existing exit code changes outside `--requirements`'s own new, opt-in policy.
- If accepted, this ADR authorizes Change 0049 to proceed from planning to a full implementation phase (staged, adversarially reviewed before close, per Changes 0043–0048's established discipline) — implementation remains a separate, later, explicit approval, not authorized by acceptance alone.

---

## ADR-020: A Hook is a versioned, capability-gated, closed-catalog-event observer; blocking authority is contractually reserved but structurally inert this Entrega, effects deferred

**Status: Accepted (2026-07-26), by the project owner.** Accepted alongside the rest of [Change 0048](../changes/0048-core3-hooks-runtime/)'s planning artifacts (`proposal.md`/`spec.md`/`design.md`/`tasks.md`/`verification.md`); implementation begins immediately after acceptance, per the project owner's explicit instruction. Confirmed at acceptance: no prior `hook`/`callback`/`middleware`/`lifecycle`/`listener` mechanism exists anywhere in `cli/src/` (grep-confirmed).

**Decision.**

> A **Hook** (AIEF Core 3.0, Entrega 6) is a plain, statically-registered object — never a class — that subscribes to one or more events from a **closed, two-event catalog** (`prompt.prepared`, `verify.completed` — both `phase: "post"`, both with a confirmed, inspected CLI emission point), declares an explicit `capabilities` set (default-denied), implements a deterministic `appliesTo(event, context)`, and, for every Hook this Entrega ships, a pure `evaluate(event, context)` that never writes a file, executes a command, or reaches the network — structurally impossible, since `writeFiles`/`executeCommands`/`network: true` cannot be registered, identical mechanism to ADR-019's `FORBIDDEN_CAPABILITIES`. `capabilities.block`/`blocking`/`blockers` exist in the contract's vocabulary (so a future pre-event Hook needs no contract change) but are structurally inert this Entrega — the Hook Service only ever honors `blocking: true` for a `phase: "pre"` event, and no such event exists in this Entrega's catalog. A Hook Context is assembled by a thin, **non-fetching** normalizer that accepts already-computed `project`/`change`/`workflow`/`sdd`/`skill`/`operation` values from the calling operation (`prompt()`/`verify()`) — deliberately asymmetric with Skills' own Context Builder, which does fetch, because both of this Entrega's events fire from inside a command that already computed those facts for its own rendering; a Hook Context Builder that re-fetched would recreate Change 0043's B1 "two callers assumed to agree" risk one layer up. A Hook Registry mirrors `requirement-providers/index.js`/`sdd-providers/index.js`/`skills/index.js` exactly. Every invocation produces one normalized result with six distinguishable `status` values (`matched`, `not_applicable`, `blocked`, `unsupported`, `invalid`, `failed` — no `completed` analog, since a Hook observes rather than executes). A Hook may invoke the Skill Service (Entrega 5) only if it declares `capabilities.invokeSkill: true` and only for an id present in its own descriptor-level `allowedSkills` array — never a Skill module directly, and the Skill Service never calls back into the Hook Service, making Hook→Skill→Hook recursion structurally impossible. `prompt`/`verify` gain one emission point each — no new command verb (ADR-015 unmodified, Change 0042 untouched).

**Why this needs its own ADR.** This is the fifth new architectural boundary/stable-internal-interface this project has introduced (ADR-016: Workflow Engine; ADR-017: SDD Provider boundary; ADR-018: User Workflow application layer; ADR-019: Skills Runtime) — the same instruction that produced each of those records this one for the same reason: a new boundary, a new closed event catalog, a new capability/blocking-authority model, and a new inter-boundary call direction (Hook Service → Skill Service, one-directional) are each independently listed as ADR triggers, and this Entrega introduces all four again.

**The event catalog is closed and evidence-based, not adopted from the vision document.** `docs/aief-core-3-claude-code-prompt.md` §13 sketches Workflow-*stage*-shaped events (`before_work`/`after_review`/etc.) — none of these has a real CLI-observable emission point in this codebase today (`canTransition()`, Entrega 4, only ever answers whether a transition *would be* legal; nothing executes one yet). Inspection instead found three real, inspectable phase boundaries — inside `close()`, `verify()`, and `prompt()` (`cli.js`, see `design.md` §1) — and this ADR adopts events for exactly two of them, both `post`-phase: `prompt.prepared` (after every existing context block is computed, before the final render) and `verify.completed` (after the `report` object exists, before `renderReport()` prints it). `close.requested` (a real point exists — immediately after `checkChangeReadiness()`'s `problems` is computed, before any write) and `change.closed`/`change.created`/`change.inspected` (real points exist too) are explicitly **not** adopted this Entrega — documented as identified-not-wired, the same "prepared, not enabled" precedent Entrega 3 used for the Workflow Engine's `specification` gate.

**Why `close()` integration is deferred, not merely unstarted.** `close()` is this codebase's only Change-lifecycle command with a write path outside Change-creation (`adopt`/`enrich`/`propose`/`new-change`). Even a strictly read-only, non-blocking Hook attached to it changes the trust profile of the one command where a mistake is hardest to reverse — and a Close Readiness Guard Hook's only justified content (restating `checkChangeReadiness()`'s `problems`) is already fully visible in `close()`'s own dry-run output today, so no information would actually be gained. `close()` gains zero diff lines this Entrega.

**Why Model B's blocking authority is kept in the contract, unexercised, rather than omitted.** Same reasoning as ADR-019 gave Skills' `deterministicExecution`: a future `phase: "pre"` event (if `close.requested` is ever wired by a later, separately-approved Change) must not require a contract-shape change. The Hook Service's own enforcement — `blocking` is forced `false` for any event whose `phase !== "pre"`, regardless of what a Hook's `evaluate()` returns — is what keeps this inert rather than a convention a Hook author could violate.

**What routes through the boundary.** Any Hook's need for Change/Workflow/SDD/project/already-computed-operation facts — via the Hook Context normalizer, populated by whichever command emits the event. Any Hook's need to consult a Skill — via the Hook Service calling the Skill Service's `runSkill()`, gated by the Hook's own `allowedSkills`.

**What does not route through it.** `close()`'s write path (unchanged, no event); the Workflow Engine's gate/transition authority (a Hook can read `workflow.state.blockers`/`warnings` but has no method that could approve a gate or execute a transition — same absence-based enforcement ADR-018 already used for Skills); the Skill Service's own internal enforcement (a Hook receives the Skill Service's *already-normalized* result, never a raw Skill module).

**Relationship to ADR-013.** This Entrega **merges**: `prompt()`'s bespoke-block pattern (four independent bodies stacked across Entregas 4/5) does not grow a sixth here — a Hook's `prompt.prepared` result is rendered by the same shared-renderer discipline `renderSkillSection()` already established, generalized rather than duplicated. `verify()` gains its first-ever additive render line through the same mechanism, not a bespoke one-off.

**Relationship to ADR-019.** The Hook Service is a consumer of the Skill Service, never a peer that redefines Skill semantics: a Skill's `ready` result is never re-labeled `completed` by a Hook (the same distinction SK-R24 enforces is preserved, not re-derived, when a Hook embeds a `skillResults` entry); a Hook cannot alter the context a Skill was evaluated against or substitute a different result object. This Entrega also proactively applies the fix Entrega 5's own adversarial review had to find after the fact — a Hook's `appliesTo()` may only select `not_applicable`/`blocked`/`unsupported` as its non-applicable status, never spoof `matched`/`invalid`/`failed` — designed in from the start (HK-R31) rather than discovered again by a future review.

**Relationship to ADR-015.** Unmodified, still Accepted, still frozen pending Change 0042. This Entrega proposes zero new command verbs — `prompt`/`verify` gain an internal emission point each, not a flag, not a verb.

**Alternatives considered.**

- **Adopt the vision document's stage-based event names (`before_work`/`after_review`/etc.) literally.** Rejected — no CLI-observable emission point exists for any of them today; adopting them now would be inventing events the codebase cannot honestly fire.
- **A general async Event Bus with subscriber registration.** Rejected — no evidence of a need for asynchronous reactions, background work, or third-party subscribers (ADR-008's evidence discipline); `evaluateEvent()` is a synchronous, pure function instead.
- **Wiring `close.requested` anyway, read-only.** Considered; rejected — even non-blocking observation changes the write-critical command's trust profile for zero content its own dry-run doesn't already show.
- **A class-based `Hook` interface.** Rejected — zero classes exist anywhere in `cli/src/` (confirmed again, including the one violation Change 0047's own review found and fixed); Hooks mirror the same plain-module pattern as `requirement-providers/`/`sdd-providers/`/`skills/`.
- **Letting a Hook import a Skill module directly.** Rejected — recreates exactly the coupling ADR-019 already forbade for the CLI layer; a Hook goes through the Skill Service, gated by its own declared allowlist, full stop.

**Consequences.**

- `close()`, `status`, `status --next`, `propose` are untouched by this Entrega — zero diff lines.
- `prompt`/`verify` gain one internal emission point each; their output is byte-identical for every
  Change without an applicable Hook result (100% of this repository today, since none carries `sdd`).
- `writeFiles`/`executeCommands`/`network: true` cannot be registered this Entrega — any future
  Change proposing a Model-C Hook must first amend or supersede this ADR.
- `capabilities.block` cannot be honored this Entrega regardless of what any Hook declares — any
  future Change wiring a `phase: "pre"` event activates already-built, already-tested enforcement
  logic rather than requiring new machinery.
- No new persisted state; no new write path; no new command verb; no existing exit code changes.
- If accepted, this ADR authorizes Change 0048 to proceed from planning to a full implementation
  phase (staged, adversarially reviewed before close, per Changes 0043–0047's established
  discipline) — implementation remains a separate, later, explicit approval, not authorized by
  acceptance alone.

---

## ADR-019: A Skill is a versioned, internally-registered, capability-gated contract; instructions-only and a narrow deterministic-execution slice this Entrega, effects deferred

**Status: Accepted (2026-07-26), by the project owner.** Accepted alongside the rest of [Change 0047](../changes/0047-core3-skills-runtime/)'s planning artifacts (`proposal.md`/`spec.md`/`design.md`/`tasks.md`/`verification.md`); implementation begins immediately after acceptance, per the project owner's explicit instruction.

**Terminology, fixed by the acceptance instruction itself, used consistently in code/docs from here on:** "**Skill Catalog**" = the existing, unchanged, static recommendation mechanism (`cli/src/skills-catalog.json`, `recommendSkills()`, `skillsBlock`, ADR-010). "**Skills Runtime**" = this ADR's new contract (descriptor, capabilities, context, applicability, normalized result — `cli/src/skills/`). A Skill Catalog entry never auto-registers as a Skills Runtime Skill; the two contracts are never mixed in one object or one registry.

**Decision.**

> A **Skill** (AIEF Core 3.0, Entrega 5) is a plain, statically-registered object — never a class — declaring an explicit `capabilities` set (default-denied: absent means `false`), a deterministic `appliesTo(context)` check, and, for every Skill this Entrega ships, a `buildInstructions(context, input)` method that returns text and nothing else. `capabilities.deterministicExecution`/`execute()` exist in the contract's vocabulary for a future narrow, pure Model-B Skill, but neither of this Entrega's two initial Skills uses them. `capabilities.writeFiles`/`executeCommands`/`network: true` **cannot be registered** this Entrega — the Skill Registry rejects any descriptor claiming one of them, structurally, not by convention. A Skill Context is built by calling `workflow-service.js`'s `explain()` (Entrega 4) exactly once per Change per invocation, plus `detectProject()`'s existing output — never re-deriving Change/Workflow/SDD facts a second way. A Skill Registry mirrors `requirement-providers/index.js`/`sdd-providers/index.js` exactly: a static object of statically-imported modules, `hasSkill`/`getSkill`/`skillIds`, duplicate/invalid descriptors rejected at load. Every invocation produces one normalized result shape with seven distinguishable `status` values (`ready`, `completed`, `not_applicable`, `blocked`, `unsupported`, `invalid`, `failed`) — `ready` (instructions built) and `completed` (execution ran) are never conflated, enforced by the Skill Service itself, not by each Skill's own discipline. `prompt` gains two additive flags, `--list-skills`/`--skill <id>` — no new command verb (ADR-015 unmodified, Change 0042 untouched).

**Why this needs its own ADR.** This is the fourth new architectural boundary/stable-internal-interface this project has introduced in as many Entregas (ADR-016: Workflow Engine; ADR-017: SDD Provider boundary; ADR-018: User Workflow application layer) — the same instruction that produced each of those records this one for the same reason: a new boundary, a new registry-selection policy, a new normalized-result model, and (uniquely to this ADR) an explicit capability/permissions model are each independently listed as ADR triggers, and this Entrega introduces all four again, plus a fifth: a direct naming collision with an already-Accepted ADR (ADR-010).

**The ADR-010 collision, resolved explicitly (not by implication, per ADR-013's own consequence clause).** `cli/src/skills-catalog.json` + `detect.js`'s `recommendSkills()` already use the word "Skill" for a purely static, unexecuted, contextual-knowledge concept (ADR-010: "Skills are contextual knowledge... included as context, never claimed to be executed"). This ADR does not rename or replace that concept — it is cited, by the vision document itself (`docs/aief-core-3-claude-code-prompt.md` §12: "Actualmente las skills pueden actuar principalmente como contexto. Evoluciónalas...") and by the commissioning instruction that produced this Change, as the thing this contract *evolves*. Concretely: `cli/src/skills-catalog.json`, `recommendSkills()`, `knowledge/skills.md` generation, and `prompt()`'s existing `skillsBlock` are **untouched** by this Entrega — zero diff lines. A catalog entry is, informally, already a valid instance of this Entrega's contract in its degenerate form (`capabilities: {instructions: true}` only, unconditional applicability) — this Entrega does not perform that migration, and does not require it. Two entries are added to `docs/domain-model.md`'s ubiquitous-language table, not one merged entry, so "Skill" (this ADR's contract) and "the Skills catalog" (ADR-010, unchanged) stay distinguishable to a future reader.

**Why Model C (write/execute/network effects) is deferred, not merely discouraged.** The vision document's fuller sketch (§12: `skill.yaml` with `permissions.filesystem.write`, `verification.checks` of `type: command` running arbitrary commands, `type: agent` delegating to an assistant) has no cited evidence in this codebase today — no Skill-shaped code writes a file or runs a command anywhere in `cli/src/`, and Hooks (the natural trigger for that fuller model) do not exist yet. Rather than leave this as a documented preference a future Skill author could quietly violate, the Skill Registry **structurally rejects** any descriptor claiming `writeFiles`/`executeCommands`/`network: true` — registration fails at module-load time. This is deliberately stronger than "built but unused" (the treatment given to `deterministicExecution`/`execute()`, kept in the contract's vocabulary since a narrow, pure, read-only deterministic-execution Skill already has cited precedent in this codebase — `checkChangeReadiness()`, `requirementFactsAndAssumptions()`). The falsifiable condition for revisiting Model C is recorded in `design.md` §2: a concrete, cited use case that cannot be expressed via `close`'s existing write path or a future Hooks event, with an evidenced security/confirmation/rollback design.

**What routes through the boundary.** Any Skill's need for Change/Workflow/SDD/project facts — for both of this Entrega's initial Skills, uniformly, via one Skill Context Builder call to `explain()` (never re-implemented) plus `detectProject()`.

**What does not route through it.** `close`'s write to `change.md` (unchanged); `status`'s existing Workflow/SDD sections (Entrega 2/3/4, unwired to Skills this Entrega — `status` gains no new flag here); Hooks' own (undesigned) event/trigger/confirmation model, which this ADR's Skill Service is built to be *callable from* later (`design.md` §15) but does not itself define.

**Relationship to ADR-013.** This Entrega **merges**: `prompt()`'s four independent, hand-written inline context blocks (`standardsBlock`/`skillsBlock`/`workflowBlock`/`sddBlock`) collapse into one general mechanism (Skill Service → normalized result → one shared renderer) any future context type can join without `prompt()` growing a fifth bespoke block — the existing four are not rewritten to use it this Entrega (additive-and-dormant, the same pattern Changes 0043–0046 each used), recording that consolidation as a deferred obligation rather than performing it silently. The ADR-010 collision above is this ADR's other explicit, not-resolved-by-implication concession to ADR-013.

**Relationship to ADR-015.** Unmodified, still Accepted, still frozen pending Change 0042. This Entrega proposes zero new command verbs — `--list-skills`/`--skill <id>` are additive flags on the existing `prompt` command, mirroring exactly the Path B precedent ADR-018 established for `status`.

**Alternatives considered.**

- **Adopt the vision document's `skill.yaml`/`SKILL.md`/`permissions`/`verification.checks` contract literally.** Rejected for this Entrega: no cited evidence supports `type: command`/`type: agent`/filesystem `permissions` yet. Recorded as the explicit future evolution target (`design.md` §14/§15), not discarded.
- **A class-based `Skill` interface.** Rejected — zero classes exist anywhere in `cli/src/`; both existing registry precedents (`requirement-providers/`, `sdd-providers/`) are plain module maps. Same reasoning ADR-016/017 already used.
- **Rename the new concept to avoid the ADR-010 collision (e.g., "Capability").** Considered and rejected: both the vision document and the commissioning instruction use "Skill" for exactly this evolution; renaming would create a third term for the same idea instead of resolving the collision the codebase already has.
- **A full plugin/marketplace/remote-loading registry.** Rejected — same reasoning ADR-017 used to reject it for SDD providers: a small number of known, internal, versioned Skills, one static registry object.

**Consequences.**

- `cli/src/skills-catalog.json`, `recommendSkills()`, `knowledge/skills.md` generation, and `prompt()`'s existing `skillsBlock` are unmodified by this Entrega — the ADR-010 concept and this ADR's concept coexist, explicitly distinguished, not merged.
- `writeFiles`/`executeCommands`/`network: true` cannot be registered this Entrega — any future Change proposing a Model-C Skill must first amend or supersede this ADR, not merely add a Skill module.
- `prompt` gains two additive flags; every other command (`status`, `verify`, `close`, `propose`) is untouched.
- No new persisted state; no new write path beyond `close`'s existing one; no existing exit code changes.
- If accepted, this ADR authorizes Change 0047 to proceed from planning to a full implementation phase (staged, adversarially reviewed before close, per Changes 0043–0046's established discipline) — implementation remains a separate, later, explicit approval, not authorized by acceptance alone.

---

## ADR-018: User Workflow is a thin application layer; "what's next" has one canonical source; exposure is gated by ADR-015

**Status: Accepted (2026-07-26), by the project owner.**

**Selected path: Path B** — zero new public command verbs. Entrega 4 is implemented entirely as
compatible evolution of existing commands: `aief status --change <id>`, `aief status --next`,
`aief prompt` (extended). No `start`, `next`, or `work` verb is introduced.

**How Path B relates to ADR-015 (recorded explicitly, not by implication).** ADR-015 remains
**Accepted, unmodified, not thawed, not suspended**. Path B is accepted as a compatible,
conservative reading of its literal text: ADR-015 freezes *new commands*; this Entrega adds *flags*
to commands that already exist (`status`, `prompt`) and *consolidates* internal logic
(`workflow-service.js`) — neither is a new command. This is not a declaration that `start`/`next`/
`work` will never become real, separate command verbs: that naming question is explicitly deferred,
to be revisited **only after Change 0042 (the usability study) is consolidated**. Whatever
public-command surface is decided then may keep today's flags as-is, alias them, or replace them —
this ADR commits to none of those outcomes now. This Change does not close or modify Change 0042;
the study continues unaffected by this Entrega's internal consolidation work.

**Decision (four bundled, tightly-coupled sub-decisions — see "Why bundled" below).**

**§1 — A `workflow-service.js` application-layer facade is justified and introduced**, as plain
functions (not a class — no class exists anywhere in `cli/src/`, same reasoning ADR-017 already
established for `SddProvider`). It does not add new capability; it consolidates a real,
already-existing inconsistency: `status()` (`cli.js`) currently computes "what's next" **two
different, disagreeing ways in the same function** — a per-Change `Workflow status` block (added in
Change 0044) that renders `resolveState()`'s derived `nextAction`, and a completely separate,
older, static heuristic at the bottom of `status()` (`printNext("aief adopt")` /
`printNext("aief prompt")` / etc., predating the Workflow Engine, never updated to consult it). For
a single open Change with a `track`, `status` can print two different "next" answers in the same
invocation. `workflow-service.js` gives every caller — `status`'s own bottom line, and any future
`next`-shaped surface — exactly one function to ask.

**§2 — "What's next" stays fully derived; nothing new is persisted.** Change 0044 (ADR-016) already
decided `track` is the only new persisted fact and everything else — stage, gates, blockers,
`next_action` — is recomputed on every call. This Entrega does not revisit that decision; it reuses
it. No "active Change" is persisted either (no session file, no `.aief/` state, no environment
variable) — selection stays exactly what ADR-009 and Change 0043's `resolveExplicitChange()`/
`resolveImplicitChange()` already established: explicit `--change`, or a deterministic single-open-
Change inference, every time, from the files on disk.

**§3 — A normalized action/read-vs-write contract is defined, distinct from `GateResult`.** An
"action" answers "what should the user do," not "is this one condition satisfied" (`GateResult`'s
job, unchanged). The two are never merged (the same discipline that kept SDD readiness and gate
readiness separate in ADR-017, applied one level up). Every read-oriented operation this Entrega
adds or extends is **exit-code 0 whenever it successfully answers the question it was asked**,
matching the existing, real precedent in `close()` (`cli.js`): `close` without `--yes` reports
unresolved readiness problems and still exits `0` — reporting a blocker is a successful query, not
a failure. `close --yes` only sets exit `1` when it *attempted* the write and could not complete it.
Exit `1` is reserved, across every command this Entrega touches, for the query itself failing
(Change not found, ambiguous selection, invalid manifest, provider unavailable) — never for an
honestly-reported blocked/pending answer. No new exit codes (2/3/4) are introduced: this
repository's entire CLI, today, uses only `0`/`1` (confirmed by inspection — no other value appears
anywhere in `cli.js`), and a query-vs-attempt split using the existing two values is sufficient and
consistent with `close`'s own precedent, rather than the vision document's untested 5-value sketch.

**§4 — Resolved: Path B.** ADR-015 (Accepted, 2026-07-17) freezes "new commands" until the AIEF 2.0
usability study ([Change 0042](../changes/0042-usability-validation-protocol/)) is consolidated —
confirmed still `Open`, not consolidated, as of this ADR. Entregas 1–3 avoided this collision
entirely (zero new commands — purely additive, dormant machinery). Entrega 4's own premise
(`aief start`/`next`/`work`) would, taken literally, be new commands. Two paths were designed (see
`design.md` §4); the project owner selected **Path B**, 2026-07-26:

- **Path A — new commands** (`aief next`, evolving `aief prompt` toward `work`, no separate
  `start`). Would have required an explicit, recorded decision that Core 3.0's User Workflow
  surface is out of ADR-015's scope, or an explicit partial thaw. **Not selected.**
- **Path B — new flags on existing commands** (`aief status --change <id>`, `aief status --next`,
  `aief prompt` gaining Workflow/SDD context blocks — zero new command verbs). **Selected.** A
  compatible, conservative reading of ADR-015's literal text (it freezes commands, not flags).
  Definitive command naming is deferred until Change 0042's consolidation; today's flags may become
  aliases, be replaced, or remain, decided then — not committed here.

**Why bundled.** §1–§3 are one coherent decision — the facade exists specifically to give the
action/exit-code contract (§3) and the derivation discipline (§2) a single implementation, and
none of the three makes sense evaluated alone. §4 is bundled because it gates whether §1–§3 are
ever reachable from the CLI at all — separating it into its own ADR would let a reader accept the
internal design without noticing the external exposure question is still open.

**Context.** `docs/aief-core-3-claude-code-prompt.md` §10 sketches `start`/`work`/`next` with
capabilities (SDD provider selection, profile/standards/skills selection, manifest creation) this
repository does not yet have wired to any command — `new-change` already handles id/slug/type
creation; Skills/Hooks execution is explicitly out of scope for this Entrega and the vision
document's own §21. The sketch is a destination, not a contract to adopt literally (the same stance
Change 0043 took toward the vision document's `class SddProvider`).

**Consequences.**

- `status()`'s bottom-line suggestion and its per-Change `Workflow status` block both route through
  `workflow-service.js` once implemented — for a track-carrying Change, they can no longer disagree
  with each other, because there is only one computation.
- `close()`'s write path and gating (`checkChangeReadiness()`) are **not** touched — the
  commissioning instruction is explicit that consolidation happens only where a real User Workflow
  operation cannot be implemented correctly without it, and no operation this Entrega designs
  writes anything beyond what `close`/`markClosed()` already do.
- `propose()` remains untouched and separate (ADR-017's own deferred obligation, restated, not
  re-opened here) — `start`/its Path-B equivalent never creates a Change; creation stays
  `new-change`/`propose`'s exclusive job, avoiding two contradictory public paths to begin one.
- Path B selected: no ADR-015 exception was needed. The flags' discoverability during the ongoing
  usability study remains a human judgment call (not testable), noted in `verification.md`'s
  "Manual checks."
- Definitive public-command naming (whether `status --next` ever becomes `aief next`, etc.) is
  explicitly deferred to a future Change, after Change 0042's consolidation — not decided here, and
  not assumed to default to Path A's shape when that time comes.
- ADR-015 itself is unmodified by this decision: still `Accepted`, still governing until Change
  0042 is consolidated. Change 0042 itself is neither closed nor modified by this Entrega.

---

## ADR-017: SDD access goes through a provider boundary; the Core never reads a provider's native files

**Status: Accepted (2026-07-25), by the project owner.** Accepted alongside the rest of [Change 0045](../changes/0045-core3-sdd-provider/)'s planning artifacts; implementation begins immediately after acceptance, per the project owner's explicit instruction.

**Decision.**

> Every place AIEF's Core needs to know about a Change's specification-driven-development (SDD) artifacts — where they live, whether they exist, what they contain, whether they're ready — goes through one function-module boundary (`sdd-provider.js`'s resolver, `OpenSpecProvider`, `LocalSddProvider`), never through a path literal, a shelled-out command, or a format assumption written directly into `cli.js`, the Change loader, or the Workflow Engine. A provider returns a normalized result (artifact presence/validity, requirements, tasks, readiness); it never returns OpenSpec's or AIEF's own native shapes to a caller that didn't ask for them by name.

**Why this needs its own ADR.** ADR-002 already decided the *policy* — OpenSpec preferred, local fallback, optional, fail loudly, never silently — and that policy is unchanged here. What has no prior decision is the *code shape* of that policy: today it lives entirely inside `propose()` (`cli.js`), as inline `commandExists`/`exists`/`spawnSync` calls with no reusable interface. Change 0044 already established the precedent (ADR-016) that introducing a stable internal boundary — even one that doesn't yet enforce anything — is exactly the kind of decision this project records explicitly rather than lets happen by accretion. This ADR is that record for the SDD side, per the same instruction that produced ADR-016: a new architectural boundary, a new stable internal interface, a provider-selection policy, and a normalized artifact model are each independently listed as ADR triggers, and this Change introduces all four.

**Why the boundary is necessary, not just tidy.** Two real couplings exist today and are cited as evidence, not assumed: `propose()` (`cli.js`) is the only code that knows OpenSpec's CLI contract (`--version`, `--help`, `propose <idea>`) — that knowledge cannot be reused by `status`, `verify`, or the Workflow Engine without duplicating it. Nothing in the codebase today reads OpenSpec's actual artifact files (`openspec/changes/<name>/proposal.md`, `specs/<capability>/spec.md`, `tasks.md` — documented in `adapters/openspec/mapping.md`, never implemented in code) — so there is, today, no working example of "AIEF reads an OpenSpec Change's requirements." Building that without a boundary would put OpenSpec's directory shape directly into whatever caller needed it first (most likely the Workflow Engine's `specification` gate) — exactly the coupling direction §"Principio arquitectónico" of this Entrega's commissioning instruction forbids.

**What routes through the boundary.** Any question of the form "does this Change's SDD artifact X exist / what does it say / is it ready" — for both providers, uniformly. `LocalSddProvider` is not a stub; it is the *existing* AIEF-native Change shape (`change.md`/`spec.md`/`tasks.md`/`evidence.md`), wrapped so it answers the same questions `OpenSpecProvider` does, through the same shape.

**What does not route through it.** `close`'s write to `change.md` (Change 0043's B1 boundary, unchanged), the Workflow Engine's structural `readiness` gate (still wraps `checkChangeReadiness()` directly — a provider-readiness question and a file-completeness question are related but not the same question, and conflating them was the exact mistake this ADR's normalized-result design avoids by keeping `SddProvider.validate()`'s output and `GateEvaluator`'s output as two distinct, sequential contracts rather than one merged one). `aief propose`'s actual OpenSpec delegation (`spawnSync("openspec", ["propose", idea])`) is not rewired to go through the new provider in this Entrega — see "Consequences" below.

**Relationship to ADR-013.** Unlike Change 0044's Workflow Engine (genuinely new capability — gates and tracks did not exist in any form before), most of what `OpenSpecProvider`/`LocalSddProvider` do in this Entrega is give an existing name to logic that already exists in scattered form (`openspecInfo()`, the `propose()` fallback branch, the Change domain model's own file reads) or is currently undocumented-in-code (OpenSpec artifact resolution, real today only as Markdown in `adapters/openspec/mapping.md`). This is closer to ADR-013's "reorganize, simplify, make evident what already exists" than Entrega 2 was — but the reorganization is not completed by this Entrega alone: `propose()` keeps its own inline OpenSpec-detection code, unrefactored, so the consolidation ADR-013 asks for is *prepared*, not *finished*, exactly as ADR-016 left the Workflow Engine's own merge unfinished. The obligation to actually retire `propose()`'s inline logic in favor of calling the new provider is recorded here, for whichever later Change does it.

**Alternatives considered.**

- **No boundary; let the Workflow Engine's future `specification` gate call OpenSpec detection directly.** Rejected: recreates the coupling direction this Entrega exists to prevent, and gives the Workflow Engine a second, format-specific readiness concept alongside its own structural one.
- **A class-based `SddProvider` interface** (as sketched in `docs/aief-core-3-claude-code-prompt.md`). Rejected as literal adoption: zero classes exist anywhere in `cli/src/` today (confirmed by inspection) — every existing "provider" concept (`requirement-providers/{manual,jira}.js`) is a plain module exporting functions, registered in a plain object (`requirement-providers/index.js`'s `ADAPTERS`). `SddProvider` follows that exact, already-proven, already-tested shape instead — a new class-based pattern would be the only one of its kind in the codebase.
- **A full plugin/marketplace registry for third-party SDD providers.** Rejected — explicitly out of scope per the vision document (`docs/aief-core-3-claude-code-prompt.md` §21) and per this Entrega's own commissioning ("no crees un sistema de plugins completo"). Two providers, one static registry object.

**Consequences.**

- `propose()`'s existing inline OpenSpec logic is **not** refactored to call the new provider in this Entrega — the provider is built, tested, and left unwired to any command's write path, matching Change 0043/0044's "additive and dormant" introduction pattern. A later Change completes the wiring and, with it, ADR-013's merge obligation for this subsystem.
- `manifest.sdd` (accepted, unvalidated since Entrega 1) gains real, optional validation — additive, since no manifest in this repository sets it today (confirmed: zero-drift regression corpus has no `sdd` field anywhere).
- The Workflow Engine's `specification` gate concept is designed in this Entrega's `design.md` but is **not** added to any of the three shipped workflow definitions (`lite.json`/`standard.json`/`governed.json`) — it stays fully inert until a later Entrega enables it, so no existing gate result can newly become blocking as a side effect of this Change.
- If accepted, this ADR authorizes Change 0045 to proceed from planning to a full `spec.md`/`design.md`/`tasks.md`/`verification.md` — implementation remains a separate, later, explicit approval.

---

## ADR-016: The Workflow Engine governs transitions and gates; only non-inferable facts are persisted

**Status: Accepted (2026-07-25), by the project owner.** Accepted alongside the rest of [Change 0044](../changes/0044-core3-workflow-engine/)'s planning artifacts (`proposal.md`, `spec.md`, `design.md`, `tasks.md`, `verification.md`); implementation begins immediately after acceptance, per the project owner's explicit instruction.

**Decision.**

> A **Workflow Engine** may compute, on every invocation and from scratch, whether a Change's requested transition is legal for its track, which gates apply, which are satisfied, and what the next valid action is. It may never persist a transition log, a cached "current stage," or a gate result as authoritative. The only new persisted fact this introduces beyond [Change 0043](../changes/0043-core3-change-foundation/)'s manifest is `track` itself (already accepted, newly given meaning) — every other output (gate status, blockers, warnings, `next_action`) is derived fresh each time from the Change's own files and, when present, the manifest's `track`/`status`. If a manifest also carries a written `next_action`, the engine treats it as an unverified hint to display alongside the derived answer, never as the answer itself — and a disagreement between the two is reported, not silently resolved.

**Why this needs its own ADR, not silent reliance on ADR-013.** [ADR-013](#adr-013-aief-20-is-a-redesign--no-capability-enters-the-core-without-removing-an-equivalent) requires every new core capability to name a removal or merge. Change 0043's manifest reader was defensible without a new ADR because it was purely additive and read-only — nothing in the core acted on what it read. A Workflow Engine is different in kind: it produces `blocking: true/false` verdicts and (in a later Entrega, not this one) is the thing a future `close`/`work` would have to consult before acting. That is active governance logic, even while Entrega 2 itself only narrates it through `status` and wires nothing to enforce it yet. Per the project owner's explicit instruction when commissioning Change 0044's planning, active governance/transition/blocking logic gets its own ADR rather than an assumed exemption.

**Why a workflow engine is needed at all, rather than inferring everything from files as today.** Today, "what's the next step" is answered by scattered, ad hoc logic: `status()`'s `printNext()` calls a hand-picked command based on a handful of `if`/`else` conditions ([cli.js](../cli/src/cli.js), `status()`); `close()`'s `checkChangeReadiness()` is a separate, independently-maintained rule list; `verify()`'s `verifyProject()`/`verifyChange()` are a third. None of them know about tracks, because tracks don't exist as a concept in code yet — only as free-text `## Type` values with no enforced vocabulary (Change 0039's finding: `## Type` is not actually an enum in this repository). Adding "does Standard require review before close, and does Governed also require approval and a security review" to that landscape by adding more scattered `if` branches is exactly the anti-pattern the vision document (`docs/aief-core-3-claude-code-prompt.md` §4.7: "workflows must be declarative... do not encode every state and transition through scattered conditionals") and this project's own coding guidance (AGENTS.md: prefer simple, readable solutions; ADR-013: reorganize and simplify, don't just add) both warn against. A single declarative definition per track, evaluated by one module, replaces three independent guesses with one.

**What still governs from the filesystem, unchanged.** The four required Change files (`change.md`/`spec.md`/`tasks.md`/`evidence.md`) remain the only source of truth for structural readiness (ADR-009) — the Workflow Engine does not reimplement `checkChangeReadiness()`/`verifyProject()`'s rules, it wraps their existing output as one gate result. `close` continues to write only `change.md`, and continues to verify its own write by reading `change.md` directly, never through the Workflow Engine or the manifest ([Change 0043](../changes/0043-core3-change-foundation/)'s finding B1, and this ADR's explicit prohibition below).

**What is derived, always, never cached as authoritative.** Every gate's `status` (`passed`/`failed`/`pending`/`warning`/`not_applicable`), the Change's current workflow stage, every blocker and warning, and `next_action` — computed fresh from `loadChangeUnified()`'s output plus the track's declarative definition, on every command invocation. Nothing here is a database row; it is a pure function of files that already exist.

**What is persisted, and why it cannot be avoided.** Only `manifest.track` (`lite`/`standard`/`governed`) — a human's explicit choice, not something derivable from file contents (there is no reliable signal in a Change's Markdown that says "this should be Governed"). This is the same category Change 0043 already established for `status`: an explicit fact a human declared, not an inference. No new persisted field is introduced by this ADR beyond what Entrega 1 already accepted and left unused.

**How hidden state is avoided.** No `.aief/state.json`, no transition log, no cache file, no database (ADR-009's rule, unmodified). Workflow *definitions* (one file per track) are versioned source files, read the same way `skills-catalog.json` already is — visible in every diff, not runtime-only state. If a manifest's `next_action` field is ever written by a later Entrega, it is documented as a **verified hint**: every read recomputes the true answer and compares; a stale or wrong hint produces a visible warning, never a silent trust. Gate results are not written back to the manifest at all in this Entrega — only read and displayed.

**How compatibility is maintained.** A Change with no manifest, or a manifest with no `track`, is invisible to the Workflow Engine — `status` for it renders exactly as before Change 0043 and exactly as after it (byte-identical, per the same diff discipline used to close that Change). The engine only activates for a manifest that declares a `track`, and none exists yet in this repository — the same "additive and dormant" property Change 0043 had, this time made structurally true (an unrecognized or absent track cannot trigger any gate logic) rather than true only by coincidence of no adopter yet existing.

**Why this remains assistant-agnostic.** Every gate the engine can evaluate in this Entrega reads only filesystem facts (file presence, emptiness, evidence classification, open-task counts) through the exact same `loadChangeUnified()`/`checkChangeReadiness()` primitives every assistant-agnostic command already uses. No model is consulted to decide whether a transition is legal, and none ever will be by this engine's contract — an AI assistant may act *on* a `next_action` the engine states, the same way it already acts on `aief status`'s printed suggestion, but the engine itself is a deterministic function, callable identically by a human, a script, or any assistant.

**Alternatives considered.**

- **Do nothing; keep per-command ad hoc logic and add more of it for tracks.** Rejected: this is the scattered-conditionals anti-pattern the vision document explicitly names, and it would triple the surface area needing to independently agree (as B1 already demonstrated happens when two independent checks are expected to agree but aren't actually the same check).
- **A fully event-sourced state machine, with a persisted transition log recording every state change.** Rejected: introduces exactly the hidden/duplicated state ADR-009 already rejected once (the `.aief/state.json` proposal) — a transition log is a second source of truth that can drift from the files, and nothing in this project's workflow needs history beyond what Git already provides.
- **Persist full gate results into the manifest as the primary source, refreshed periodically.** Rejected per this ADR's own decision text: a gate result is cheap to recompute and expensive to keep correct as a cache; turning the manifest into a mutable results database is the "manifest becomes a database" outcome the project owner explicitly ruled out when commissioning this planning work.
- **Skip a new ADR and treat this as covered by ADR-013's existing "additive and dormant" reasoning from Change 0043.** Rejected per the project owner's explicit instruction: a gate evaluator that produces `blocking` verdicts is a different kind of capability than a read-only manifest reader, even before anything enforces those verdicts.

**Consequences.**

- Every gate the engine reports in Entrega 2 that has no real evaluator yet (`review`, `approval`, `security_review`) must be represented honestly as `status: "pending"`, never fabricated as `"passed"` — a Standard or Governed Change can never compute `next_action: close` through this engine until the Entregas that build those evaluators (7, 8) exist. This is intentional: the alternative is pretending gates exist before they do.
- `close`'s actual enforcement is **not** wired to this engine in Entrega 2 — the engine narrates through `status` only. Wiring `close` to gates is reserved for a distinct, later, explicitly-approved Change, so that when it happens, the change in *enforced* behavior is reviewable on its own, not bundled with the engine's introduction.
- Relative to ADR-013: this ADR's position is that Entrega 2 is not yet a completed merge (the scattered logic in `status()`/`close()`/`verify()` is not deleted here — see design.md §warning), but it is the necessary first step of one, and the ADR-013 obligation is discharged in full only when a later Change retires the ad hoc `printNext()`/`checkChangeReadiness()` narration this engine is designed to eventually replace. That obligation is recorded here so it is not forgotten.
- If accepted, this ADR authorizes Change 0044 to proceed from planning to a full `spec.md`/`design.md`/`tasks.md`, but not to implementation — that remains a separate, explicit approval per this project's standing practice.

---

## ADR-015: The usability study freezes the simplification

**Status: Accepted (2026-07-17), by the project owner.**

**Decision.** Until the AIEF 2.0 usability study ([Change 0042](../changes/0042-usability-validation-protocol/)) is run and its evidence consolidated, the following are **frozen** — no execution, no modification:

- **Candidate DELETE / ARCHIVE** artifacts (R10/R11/R13/R14/R12 and the rest of the Change 0038 map).
- **Type ↔ Track** ([Change 0039](../changes/0039-type-track-derivation-design/)) — design only, no implementation.
- **Onboarding.**
- **New commands.**
- **Documentation simplification** (the merges in the Change 0038 map).

**Reason.** An artifact that looks dead to a maintainer can become **evidence of a discoverability problem** the moment a fresh participant reaches for it during the study. Deleting, merging or renaming it first destroys that evidence before it can be collected. **The study has priority over the simplification.**

**Consequences.**

- The simplification map is a **classification, not a work order** (reinforces ADR-014). It is a frozen queue.
- No AIEF change may be made *from an individual observation* during the study. Redesign begins only after the full evidence is consolidated (Change 0042's consolidation format).
- The success criterion of AIEF 2.0 is restated: **not fewer files, but a completely new person completing the main flow with the fewest possible blocks, decisions and external consultations.** File reduction is downstream of that, and subordinate to it.
- The thaw is a separate, later, explicit decision — it does not happen automatically when the study ends; it happens when a human reads the consolidation and says so.

---

## ADR-014: DELETE is a consensus state, never an initial one

**Status: Accepted (2026-07-17), by the project owner.**

**Decision.** The classification map (Change 0038) is a **map, not an authorization to delete**. No artifact is removed on a single reviewer's verdict. The lifecycle of a removal is:

```text
Candidate DELETE → second independent review → consensus → Approved DELETE → execution
```

Rules:

- **While there is no consensus, the artifact stays.**
- **Doubt favors KEEP.**
- The second reviewer works **without** the first reviewer's package and builds its own reasoning from the repository.
- `DELETE` requires **positive evidence**, not merely absence of use: zero live references, zero tests, zero contracts, zero ADR dependency, zero dependent workflows, and a complete replacement.
- **"Zero observed uses in a project" is never sufficient** (the rule ADR-002/`aief propose` established: absence of use ≠ absence of dependency).
- A prior architectural decision prevails until explicitly superseded.

**Context.** The first-pass map proposed 16 deletions. Independent review overturned 11; a second independent reader then found **0 of 6** of the R1–R6 items deletable, and surfaced a coupling (`aief doctor` depends on `docs/navigator/`) the first reviewer missed. Two reviewers, each finding real dependencies the other did not, is the evidence for making two-reviewer consensus the rule rather than a courtesy.

**Consequences.** DELETE stops being a state an item is born into. Execution of any removal cluster (Change 0038's Stage D) is gated on this flow. The map's DELETE column is a queue of *candidates*, not a work order.

---

## ADR-013: AIEF 2.0 is a redesign — no capability enters the core without removing an equivalent

**Status: Accepted (2026-07-17), by the project owner.**

**Decision.**

> **No new capability enters AIEF's core unless it first removes, merges or replaces an equivalent capability.**

Three corollaries, adopted with it:

- **AIEF 2.0 is a redesign, not an expansion.** The objective is to reorganize, simplify and make evident what already exists.
- **Backward compatibility is not a goal in itself.** Experience of use outranks it.
- **Success is not measured by feature count.** It is measured by one thing: a developer who never participated in Flux Portal starts a project correctly in **under 15 minutes, following only the main flow**.

**Context.** The audit of Change 0037 established that AIEF's problem was never missing capability. On Flux Portal — a real, successful migration — the CLI ran once, on day 0, and never again; 9,011 lines of governance were then written by hand. `verify` was built, correct, and never invoked. 18 of 36 components had zero observed use. The repository carried an **8:1 ratio of Markdown to production code** — the exact v4 failure mode (documentation growing faster than validated capability, ADR-001/ADR-008) reappearing inside the repository founded to escape it.

The danger this ADR addresses is specific and predictable: AIEF 2.0 ships *on top of* AIEF 1.x, every existing surface survives "for compatibility", the framework grows, and v4 happens again under a new name. Good intentions do not prevent this; an accounting rule does.

**Consequences.**

- Every proposal must name what it removes. A proposal that removes nothing is incomplete, not merely ambitious.
- The rule applies to the **core**. ADVANCED and OPTIONAL capabilities off the main path are governed by ADR-008's evidence gate as before.
- The rule **forces latent collisions into the open** rather than letting them accumulate. The first is already visible: `Track` (Basic/Standard/Migration) may not enter beside `## Type` (General/Analysis/Enrichment) — a Change may not carry two classification axes. See Change 0038 §4.
- **Roles and Tracks stay separate concepts**, permanently: a Role (ADR-012's Profile) answers *how should I reason?*; a Track answers *what kind of work is this?*. Tracks are never called Profiles.
- Removal requires proof, not preference: what replaces it, where the information lands, and why no capability is lost. The classification map (Change 0038) is the instrument.
- This ADR narrows nothing retroactively. Where it collides with an accepted ADR (ADR-006's teaching mechanism, ADR-010's standards, ADR-011's three levels, ADR-012's Profiles), the collision is raised as a decision — never resolved by implication.

---

## ADR-012: Operational Profiles

**Status: Accepted (2026-07-05). Proposed 2026-07-04; revised twice after review (structured model; orthogonality principle). Acceptance of this ADR is the milestone — implementation (0025) is a separate decision, not yet started.**

**Milestone context.** Changes 0016–0024 completed real-project validation, standards as project context, operational and visible Skills, workflow clarity, adoption UX fixes, Gemini prompt UX and prompt lifecycle guardrails. The Workflow Engine is considered stable for the validated lane (solo developer, Node stack, any of four assistants, no OpenSpec). The one remaining promise-gap inside the generated prompt is the Profile.

**What is a Profile?** A Profile is **structured operational knowledge about how to reason** in the active Change. It is not a document: it is a model, conceptually parallel to the Skills catalog, whose fields describe a way of working:

```text
goal            what this role is trying to achieve
thinkingStyle   how it approaches problems (e.g. trade-offs first, defects first)
priorities      what it optimizes for, in order
expectedOutputs what its results look like
avoid           what is outside this role's job or judgment
```

It is selected explicitly by the human per Change (`--profile`), never detected from the project. Markdown, when it exists at all, is an optional *rendered representation* of this model — exactly as `knowledge/skills.md` is a rendered view of the Skills catalog, never the source of truth.

**The knowledge taxonomy.** Each layer answers one distinct question, which is why none can absorb another:

| Layer | Question it answers |
|---|---|
| AGENTS.md | What rules must never be violated? |
| **Profile** | **How should I reason?** |
| Standards | How should this project be built? |
| Skills | What should I know? |

**Design principle — the four dimensions are orthogonal.** These layers are not four kinds of documentation; they are four *dimensions of engineering context*, and their questions are orthogonal. One layer must never absorb another:

- **Profiles must never contain project facts** — that is Standards' dimension.
- **Skills must never define assistant behaviour** — they inform reasoning, they do not shape it; behaviour belongs to Profiles (and rules to AGENTS.md).
- **Standards must never become project detection** — they state how the project must be built; discovering what the project *is* belongs to the detectors.
- **AGENTS.md must never become a knowledge base** — it holds inviolable rules, nothing else.

Each source has a single responsibility. **The Prompt Engine is the only place where the four dimensions are composed into a single prompt** — composition is the renderer's job, never the sources'. This is a design principle of AIEF, not an implementation detail: any future capability that blurs one dimension into another is, by this ADR, architecturally wrong regardless of how convenient it looks.

**Profile vs AGENTS.md.** AGENTS.md is the constitution binding every assistant in every Change. A Profile shapes reasoning within those rules; it may narrow focus but never relaxes rules, gates or the human-approval boundary.

**Profile vs Skill.** Skills are knowledge triggered by *project* signals — identical for every role working on the codebase. A Profile is chosen by the *human* and describes the actor's reasoning, not the codebase. Orthogonal by design: architect and developer on the same project receive the same Skills and different Profiles.

**Profile vs Standard.** Standards are editable project property stating how work must be done *here*. Profiles are project-independent reasoning models. Standards constrain everyone; a Profile directs one role's thinking.

**Where does the model live?** The **canonical structured definitions belong to AIEF** (role reasoning is project-independent; copying it into every adopted project would recreate the snapshot-drift problem observed with skills.md). Projects may *specialize* a profile, but any override is expressed against the structured model — the exact override mechanism (structured fragment vs rendered file) is an implementation decision deferred to the implementation Change, with one constraint fixed here: **Markdown may be a representation or an input, never the model**. Resolution order: project specialization if present → AIEF canonical definition → honest "no profile content defined".

**Injected into prompts?** Yes. The **Prompt Engine transforms the structured model into natural-language instructions** — the same pipeline shape Skills already use (catalog fields → rendered prompt block). This is the architectural payoff of the structured model: composition, richer or assistant-specific renderings, and future evolution happen in the renderer, without touching the knowledge itself or committing it to any file format. The rendered block must stay small (a handful of lines; 0024 flagged prompt growth as a watch item) and honestly labeled, never a reference to a file that does not exist.

**What never belongs in a Profile.** Permission to bypass AGENTS.md, verify or close gates; project-specific facts (Standards' job); technology knowledge (Skills' job); executable behavior or commands; identity or seniority claims about the human; tenant or environment configuration.

**What real validation revealed.** Friction #8 (0020 product validation) and question 3 of the Claude Code validation on trk-orchestrator-portal: the prompt says "Act as the architect profile" but nothing defines what that means — adopted projects get only a `profiles/README.md` pointing vaguely at "the source AIEF repository". The assistant fell back to its own interpretation of "architect": it worked, but it is undefined behavior. The same validation showed standards + Skills compensate for most of the gap — so the fix is a small knowledge model plus rendering, not a new system.

**Consequences if accepted.** The instruction hierarchy (`AGENTS.md → assistant file → profile → standards → skills → active Change`) becomes fully backed by content at every level; prompts stop referencing an empty concept; the detector/recommendation/content separation established for Skills (ADR-010) gains its reasoning-side counterpart; no new commands, no hidden state, no changes to Skills or Standards.

**Next implementation Change (proposal).** `0025-operational-profiles`: define the structured model (goal, thinkingStyle, priorities, expectedOutputs, avoid) for the existing profile set as catalog-style data owned by AIEF; render it into `aief prompt` through the existing pipeline with the resolution order and honest fallback above; decide the project-specialization mechanism there; and — same area, pending backlog item #5 — default Analysis Changes to the architect profile. Acceptance must include re-validation on a real project, per ADR-008.

---

## ADR-001: AIEF is a Workflow Engine, not a specification generator

**Decision.** AIEF orchestrates the engineering workflow (Change → Spec → Tasks → Build → Verify → Evidence). It does not generate specifications itself.

**Context.** The original AI Engineering Framework (v4) accumulated a lot of documentation but few operational capabilities. Specification generation is already solved well by dedicated tools.

**Consequences.** AIEF stays small. Specification quality is delegated to OpenSpec or to the humans and assistants writing `spec.md`.

---

## ADR-002: OpenSpec is integrated, not replaced

**Decision.** OpenSpec is the preferred generator for Proposal / Spec / Tasks. AIEF delegates to it when available (`aief propose`) and falls back to local Change skeletons when it is not.

**Context.** Rebuilding structured proposal generation inside AIEF would duplicate OpenSpec and couple the workflow engine to a spec format.

**Consequences.** OpenSpec remains optional. The CLI validates the OpenSpec command contract at runtime and falls back loudly, never silently (see `adapters/openspec/README.md`).

---

## ADR-003: Specboot is integrated conceptually, not copied

**Decision.** AIEF adopts Specboot's ideas — assistant bootstrap, instruction hierarchy, profiles — through adapters and templates, without vendoring its code or structure.

**Context.** LIDR Specboot solves assistant instruction organization well; copying it would create a fork to maintain.

**Consequences.** `adapters/specboot/` and `templates/specboot/` describe the mapping. Specboot remains optional.

---

## ADR-004: AGENTS.md is the primary source of rules

**Decision.** `AGENTS.md` holds the universal collaboration rules. Assistant-specific files (`CLAUDE.md`, `GEMINI.md`, `CODEX.md`, `CURSOR.md`) only add assistant-specific guidance and must not contradict it.

**Context.** Multiple assistants working on one project drift apart without a single source of truth.

**Consequences.** The conceptual hierarchy is: `AGENTS.md` → assistant file → profile → skill → active Change. Skills add specialized knowledge but never override AGENTS.md.

---

## ADR-005: Adopting existing projects is the primary use case

**Decision.** The Adoption Engine (`doctor`, `adopt`, `analyze`, `prompt`, `verify`, `close`) is the core product of AIEF Next.

**Context.** Most real teams have existing codebases; greenfield `init` is the easy case. The v4 framework was validated mostly on paper, not on real adoptions.

**Consequences.** Adoption must be safe: it never modifies application code, never collides with existing Changes, and is idempotent. These properties are covered by the CLI test suite.

---

## ADR-006: The CLI must be guided and educational

**Decision.** Every command explains its purpose, when to use it, what it reads, what it writes, an example and the recommended next step. Messages must be honest (e.g. report when a file already existed instead of claiming it was created).

**Context.** AIEF's users include people adopting an AI-assisted workflow for the first time; a terse CLI defeats the framework's teaching goal.

**Consequences.** `aief help <command>` covers every command. Fallbacks and skipped writes are reported explicitly.

---

## ADR-007: Technology-specific knowledge lives outside the workflow engine

**Decision.** Technology detectors and Skill recommendations are data (`cli/src/skills-catalog.json`), consumed by a small engine (`cli/src/detect.js`). The workflow logic in `cli/src/cli.js` knows nothing about tenants, n8n or AWS.

**Context.** The first detectors were hardcoded keywords inherited from the multitenant SaaS project that motivated AIEF v4. Hardcoding domain knowledge in the engine made it wrong for every other project and produced false positives (substring matches like "ai" inside "maintainability").

**Consequences.** Detection uses word-boundary matching, declares signal strength (strong = dependencies/files, weak = keywords), and every recommendation states its reason. Extending detection means editing the catalog, not the engine.

---

## ADR-011: The workflow is documented as three levels — Context, Feature, Governance

**Decision.** AIEF documents one canonical workflow model ([docs/workflow.md](../docs/workflow.md)) with three levels: **1 · AIEF Context** (`doctor → adopt → verify → analyze → prompt`), **2 · OpenSpec / Assistant Feature Workflow** (verified official OpenSpec: `Explore → Propose → Apply → Archive`, driven by assistant slash commands; extensible with Specboot-style skills like *enrich-us* or *adversarial review*, documented as examples, never as official OpenSpec), and **3 · AIEF Governance** (`verify → close`). `aief close` is explicitly not OpenSpec `/archive`: each governs its own artifact.

**Context.** Four different workflow phrasings had accumulated across README, docs/Workflow.md and the OpenSpec adapter, none distinguishing what AIEF does from what the assistant/OpenSpec does. Specboot's operational clarity inspired the level separation; nothing was copied. The model is documentation-only: no CLI behavior changed, no commands added, no state introduced.

**Consequences.** All workflow descriptions summarize docs/Workflow.md instead of restating their own variant. The local (no-OpenSpec) path is documented as the normal path. Restrictions live in one place ("What AIEF does not do").

---

## ADR-010: Project standards and Skills are contextual knowledge; OpenSpec remains the spec workflow engine

**Decision.** AIEF adopts Specboot's *concepts* — modular project standards and role/skill knowledge — as files under `knowledge/standards/` (created by `aief adopt`, never overwritten) and as operational Skill content in `cli/src/skills-catalog.json` (purpose, whenToUse, standardsToRead, promptContext, commonRisks, evidenceExpectations). `aief prompt` injects both as *context* for the assistant. AIEF does not copy Specboot files and does not reimplement OpenSpec's Proposal → Spec → Tasks workflow.

**Context.** Validation on a real project (Change 0016/0018) showed the biggest gap was contextual: prompts referenced profiles/skills with no operational content, and `analyze` discarded everything `doctor` detected. Specboot (LIDR) solves this with standards documents and skill files; copying it would fork a project we only want to learn from. Research during this Change also found the real OpenSpec (Fission-AI/OpenSpec) exposes `propose` as an assistant slash command, not a terminal command — confirming AIEF should treat OpenSpec as the spec engine used *through the assistant*, with AIEF's local Change skeleton as the documented fallback.

**Consequences.** Three concepts stay distinct in the catalog: *detectors* (fire on project signals), *skill recommendations* (map detectors to Skills), and *skill content* (knowledge injected into prompts — included as context, never claimed to be "executed"). Standards are editable project property; AGENTS.md remains the rule hierarchy root; OpenSpec remains optional and authoritative for formal spec workflows.

---

## ADR-009: No hidden state — the Change files are the only source of truth

**Decision.** AIEF stores no state outside the Change files. A Change is closed when its own `change.md` carries a `## Status / Closed` section (written by `aief close --yes`). The "active Change" is derived: the latest Change not marked Closed, overridable with `--change`. A proposed `.aief/state.json` was evaluated and rejected.

**Context.** An external review (Gemini, 2026-07) suggested an explicit `activeChange` state file. Analysis: "active Change" is a per-person concept — committing a state file makes one developer's switch affect the whole team; gitignoring it creates invisible state. Both variants add a second source of truth that can drift from reality.

**Consequences.** `status`, `prompt` and `close` need no synchronization logic; closing a Change naturally promotes the next open one; everything is visible in diffs and reviews.

---

## ADR-008: Improvements come from validation with real projects, not assumptions

**Decision.** Roadmap priority goes to what real adoptions reveal (v0.2.0 = validation from real existing project adoption), not to speculative features.

**Context.** The v4 limitation was exactly this: documentation grew faster than validated capability.

**Consequences.** Every fix in this repo should trace to an observed failure (a bug reproduced, a confusing message, a broken adoption) captured as a Change with evidence. Integration contracts (e.g. the exact OpenSpec CLI surface) are marked as unvalidated until exercised against the real tool.
