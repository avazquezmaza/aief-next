# Design — Entrega 5: Skills Runtime

## 1. The ADR-010 naming collision, resolved

`cli/src/skills-catalog.json` + `detect.js`'s `recommendSkills()` already own the word "Skill" in
this codebase (ADR-010, "Skills are contextual knowledge"). This Entrega does not introduce a
competing "Skill" — it defines the general contract §12 of the vision document asks the existing
concept to evolve into. Concretely:

- **Unchanged this Entrega:** `cli/src/skills-catalog.json`, `detect.js`'s `recommendSkills()`,
  `knowledge/skills.md` generation (`adopt`), `prompt()`'s existing `skillsBlock`. Zero lines touched.
- **New this Entrega:** a Skill Registry (`cli/src/skills/`) of a small number of *internal,
  code-defined* Skills, each an instance of the new contract — structurally unrelated to the JSON
  catalog's entries, which are not migrated.
- **The relationship, stated once, in ADR-019, not left implicit:** the catalog's entries are what
  the new contract calls a "Model A Skill with unconditional applicability" — the same shape,
  described informally today. A future Change *could* migrate catalog entries into registered Skills
  (each becoming `appliesTo(context) => context.project.signals.some(...)`); this Entrega does not do
  that migration and does not require it.
- **Practical disambiguation for the human reader:** this document and ADR-019 always write "Skill"
  (capitalized, this Entrega's contract) vs. "the Skills catalog" (existing, `skills-catalog.json`)
  when the distinction matters. `docs/domain-model.md` gets two ubiquitous-language rows, not one
  merged row, so a future reader never conflates them.

## 2. What is a Skill: the three models, evaluated against real evidence

| | Model A — instructions | Model B — deterministic operation | Model C — effects |
|---|---|---|---|
| Shape | `Context → Skill → Instructions` | `Context → Skill → Deterministic Result` | `Context → Planned Effects → Confirmation → Execution` |
| Existing evidence in this codebase | `recommendSkills()` (ADR-010) | `checkChangeReadiness()` (`change-verifier.js`), `requirementFactsAndAssumptions()` (`cli.js`, `enrich`) | None — no Skill-shaped code writes a file or runs a command anywhere in `cli/src/` today |
| Risk | Low — no execution, no writes, assistant-neutral by construction | Low, *if* strictly pure and read-only (no different from a query) | High — needs permissions, confirmation, rollback, a threat model this Entrega has no concrete case to design against |
| Decision this Entrega | **Adopted, fully** — every initial Skill implements this | **Adopted, narrowly** — `capabilities.deterministicExecution` exists in the contract, gated by SK-R5/R6, but neither initial Skill uses it (no cited use case yet beyond `checkChangeReadiness()`-shaped logic, which already has a caller and does not need re-registering as a Skill this Entrega) | **Deferred** — the capability flags exist in the contract's vocabulary (so the shape does not need to change later) but SK-R6 makes them structurally unregisterable this Entrega |

**Why Model B is "adopted but unused" rather than "deferred like C":** the contract must not have to
change shape when a real deterministic-execution Skill is justified later (e.g., a future
"tasks-completeness-check" Skill computing a pass/fail from `context.sdd.tasks` alone, still zero
writes). Keeping `execute()`/`capabilities.deterministicExecution` in the contract now, unused,
costs nothing and avoids an ADR-013-relevant "capability added later without evidence" question when
the first real Model B Skill ships. Model C's capabilities are excluded from being *registerable* at
all (SK-R6) — a strictly stronger form of "not built yet" than "built but unused," because a
mis-declared Skill cannot silently gain write access by a typo.

**Falsifiable condition for revisiting Model C:** a concrete, cited use case where a Skill's value
requires a file write or command execution that (a) cannot be expressed as `close`'s existing write
path or a future Hooks event, and (b) has an evidenced security/confirmation/rollback design — not
"it would be more convenient."

## 3. Architecture

```text
CLI (prompt --skill/--list-skills)
        │
        ▼
Skill Service (cli/src/core/services/skill-service.js)
  - listSkills(context)          -- every registered Skill + its applicability for this context
  - runSkill(id, context, input) -- resolve, check applicability/capabilities, invoke, normalize
        │
        ├──▶ Skill Registry (cli/src/skills/index.js)     -- hasSkill/getSkill/skillIds, mirrors
        │      cli/src/requirement-providers/index.js and cli/src/sdd-providers/index.js exactly
        │
        └──▶ Skill Context Builder (cli/src/core/services/skill-context.js)
                  │
                  ▼
             workflow-service.js's explain(changeDir, cwd)   -- Entrega 4, unchanged, only caller
                  │
                  ├── loadChangeUnified()   (Entrega 1)
                  ├── evaluateGates() / resolveState()   (Entrega 2)
                  └── resolveSddProvider()   (Entrega 3)
                  +
             detectProject()   (existing, unchanged — same input recommendSkills() already uses)
```

Dependency direction matches the commissioning instruction exactly:
`CLI → Skill Service → Skill Registry → Skill Contract (descriptor shape) → Skill Implementation`.
A Skill module (`cli/src/skills/change-context.js`, etc.) imports nothing from `cli.js`, nothing from
`sdd-providers/`/`requirement-providers/` directly, and nothing from `fs`/`path` against a
Change-controlled location — it receives a fully-built `context` object and returns data.

## 4. Skill contract

```js
// cli/src/skills/change-context.js (concrete example, not the sketch)
export const id = "change-context";
export const version = "1.0.0";
export const title = "Change Context";
export const description = "Normalized, human-readable summary of one Change's identity, Workflow stage and SDD readiness.";
export const capabilities = {
  instructions: true,
  deterministicExecution: false,
  writeFiles: false,
  executeCommands: false,
  network: false,
  assistantRequired: false
};
export function appliesTo(context) {
  return context.change ? { applicable: true } : { applicable: false, reason: "no Change resolved" };
}
export function buildInstructions(context, input) { /* returns a string */ }
export function summarize(result) { /* returns a one-line string for --list-skills */ }
```

Every field/method justified against a real use case or a named future consumer — not adopted from
the sketch verbatim:

| Field/method | Justification | Change from the sketch |
|---|---|---|
| `id`, `version`, `title`, `description` | Registry lookup, `--list-skills` rendering, human-readable identification — same fields `catalog.skills` entries already have (`id`, `name`, `description`) | Kept, `title` added (the sketch's `description` doubles as both today; a Skill needs a short label distinct from its longer description for `--list-skills`) |
| `capabilities` | SK-R4/R5/R6 — the entire "restrictive by default" security model depends on this being present and explicit, not inferred | Kept, expanded to the six-flag list below (§5); sketch used ad-hoc booleans without a canonical list |
| `appliesTo(context)` | SK-R19–R21 — a Skill must be able to say "not applicable" without a caller trying and catching an error; `--list-skills` needs this to render applicability without invoking `buildInstructions()` | Kept, name and shape close to the sketch's `appliesTo` |
| `validateInput(context, input)` | **Dropped** for this Entrega's two Skills — neither takes structured input beyond `context` itself (no Skill this Entrega has a use case for extra CLI-supplied parameters). Kept as an *optional* contract method (present-if-needed) so a future Skill needing input (e.g., "requirements-analysis" scoped to one requirement ID) doesn't require a contract change — but SK-R nothing requires it, and neither initial Skill implements it |
| `buildInstructions(context, input)` | SK-R24/R25 — the only method every Skill this Entrega implements; text out, nothing else | Kept exactly |
| `execute(context, input)` | Kept in the contract's vocabulary (§2's Model B decision) but **not implemented by either initial Skill** — required only when `capabilities.deterministicExecution === true` | Kept as optional, gated |
| `summarize(result)` | `--list-skills` and `prompt`'s rendered header need a one-line status description without re-deriving it from the full result each render site | Kept, but returns a string, not a mutation of `result` |
| `permissions.filesystem.{read,write}` (sketch) | **Dropped entirely.** No Skill reads the filesystem — only the Context Builder does (SK-R32) — so a Skill declaring filesystem glob permissions would be describing access it structurally cannot exercise. Replaced by `capabilities.writeFiles` as a single boolean (SK-R6 makes it unregisterable as `true` this Entrega) | Removed |
| `activation.{keywords,paths,dependencies}` (sketch) | **Deferred**, not adopted — this is `appliesTo(context)`'s job, expressed as code against the already-normalized `context.project.signals`, not a second, declarative activation-matching system (would duplicate `detect.js`'s existing signal-matching logic under a new name) | Not adopted as separate declarative fields |
| `stages` (sketch) | **Folded into `appliesTo(context)`** — a Skill that only applies at certain Workflow stages checks `context.workflow.state.stage` itself; no separate declarative `stages` list, for the same "one applicability mechanism, not two" reason | Not adopted as a separate field |
| `verification.checks` (sketch) | **Dropped entirely** — this is Entrega 6's (Verification) concern; a Skill this Entrega has no method that could be "checked" against a `type: command`/`type: agent` rule | Removed |
| `evidence.required` (sketch) | **Dropped as a declarative field**; a Skill's actual `evidence` (result field, §7) is populated by the Skill itself from what it already computed — declaring a *required* evidence list with nothing yet enforcing it would be an unenforced promise | Removed |

## 5. Capabilities

Six explicit boolean flags, all default-`false` (absent = `false`, SK-R4):

```text
instructions            -- implements buildInstructions(); every initial Skill: true
deterministicExecution  -- implements execute(); neither initial Skill: true (unused this Entrega)
writeFiles               -- SK-R6: registry rejects true this Entrega, unconditionally
executeCommands          -- SK-R6: registry rejects true this Entrega, unconditionally
network                  -- SK-R6: registry rejects true this Entrega, unconditionally
assistantRequired        -- informational only: does this Skill's output only make sense pasted into
                             an assistant conversation, vs. useful to a human/script directly? Neither
                             initial Skill sets this true (both produce human-readable text either way)
```

`read_files` from the commissioning sketch is **not** a capability: every Skill implicitly consumes
`context`, which is already file-derived (via the Context Builder) — declaring "reads files" as a
capability would conflate "consumes normalized context" (true for nearly every useful Skill) with
"has raw filesystem access" (true for none, structurally, per SK-R32). Naming it `writeFiles` (not
`fileWrite`, matching the sketch) and omitting a `readFiles`/`fileRead` counterpart entirely is the
deliberate fix for that conflation.

## 6. Initial Skills

### 6.1 `change-context` (registered)

- **Applies to:** any context with a resolved `change` (i.e., any Change `resolveExplicitChange`/
  `resolveImplicitChange` could find) — unconditional beyond that.
- **`buildInstructions`:** renders `context.change`'s identity/status, `context.workflow`'s
  stage/blockers/warnings if present, `context.sdd`'s provider/readiness if present — the same
  facts `status --change <id>` already prints (`statusSingleChange()`), reformatted as a Skill result
  instead of console output. Not a duplicate render path in spirit: it is the same data, exposed
  through the Skill contract so a future Hook/Review consumer can get it without shelling out to
  `aief status`.
- **Never `completed`** — `capabilities.deterministicExecution: false`, so its ceiling is `ready`.

### 6.2 `requirements-analysis-instructions` (registered)

- **Applies to:** `context.sdd` exists **and** `context.sdd.readiness.status` is not `"invalid"`/
  `"unsupported"` (mirrors `deriveNextAction()`'s own SDD-error-first ordering, Entrega 4) — a
  Change with no `sdd` gets `not_applicable`; a Change with a broken SDD provider gets the *same*
  distinguishable outcome that outcome already has (`unsupported`/`blocked`, §"Applicability", not a
  fabricated set of instructions built from nothing).
- **`buildInstructions`:** static, deterministic guidance text (review ambiguity / missing acceptance
  criteria / traceability) parameterized only by `context.sdd.requirements`/`artifacts`' *presence
  and counts* — never by their content interpreted through any inference beyond "N requirements
  found, M artifacts missing" (no AI, no heuristic classification of the content itself — SK-R19).
- **Never `completed`** — same reasoning as 6.1.

### 6.3 Considered and not included this Entrega

See `proposal.md`'s "Initial Skills" section for **Task Execution Instructions** (would duplicate
Entrega 4's existing `sddBlock`) and **Evidence Checklist** (no derivable rule exists yet) — both
remain candidates for a later Entrega once a concrete gap or a real evidence-requirement rule exists.

## 7. Normalized Skill Result

```js
{
  skill: "change-context",        // the id, always present, always matches the invoked Skill
  version: "1.0.0",               // the Skill's version at invocation time
  status: "ready",                // one of the seven values below
  summary: "...",                 // one line, from summarize(), or a Skill-Service-generated
                                   // default for non-ready statuses (never left empty)
  instructions: "..." | null,     // buildInstructions()'s output, or null if never invoked
                                   // (not_applicable/blocked/unsupported/invalid/failed)
  findings: [],                   // structured observations (e.g. "3 requirements, 1 artifact missing")
  artifacts: [],                  // always [] this Entrega — no Skill produces a file
  evidence: [],                   // facts this result is traceable to (e.g. which GateResult/SDD
                                   // field it read) — never a claim of verification performed
  warnings: [],                   // non-blocking observations, e.g. "requirements count is 0"
  errors: [],                     // populated only for status "invalid"/"failed"
  effects: []                     // always [] this Entrega — SK-R7, asserted by the Skill Service
}
```

### Status values, precisely distinguished

```text
ready           buildInstructions() ran; this is the terminal success state for every Skill this
                Entrega ships (SK-R24) — never claims execution happened.
completed       execute() ran to completion. Unreachable this Entrega (no Skill declares
                deterministicExecution: true) — included in the contract so a future Model-B Skill
                does not require a new status value.
not_applicable  appliesTo(context) returned {applicable: false} — this Skill's own declared
                condition (track/stage/provider/etc.) is not met. Never an error.
blocked         applicable and (where relevant) supported, but a precondition currently blocks a
                useful result -- e.g. context.change exists but context.sdd is present with a
                readiness status the Skill cannot act on. Distinguishable from not_applicable: the
                Skill's own condition (having sdd at all) WAS met.
unsupported     the condition for applicability is met, but the underlying capability is not
                supported by the resolved provider/workflow -- mirrors Normalized Action's
                "unsupported" (Entrega 4), reusing sdd.readiness.status === "unsupported" verbatim
                where relevant.
invalid         a descriptor, input, or context-build problem -- a defect (SK-R16, SK-R26 boundary),
                surfaced before any Skill logic runs.
failed          an unexpected runtime error inside buildInstructions()/execute(), caught and
                structured by the Skill Service (SK-R26) -- never an uncaught exception.
```

"Skill disponible" (registered, `hasSkill(id)` true) vs. "Skill aplicable" (`appliesTo()` true for
this context) vs. "Skill preparada" (`ready` — instructions built) vs. "Skill ejecutada" (`completed`
— out of reach this Entrega) vs. "Skill fallida" (`failed`/`invalid`) are five distinct concepts;
nothing in this design collapses any pair of them.

## 8. Errors and outcomes — the full table

| Condition | Representation | Where |
|---|---|---|
| Unknown Skill id (registry) | Thrown `Error`, caught at the CLI boundary, printed, exit 1 | Skill Service / CLI |
| Duplicate Skill id | Thrown at module load (registry construction) | Skill Registry |
| Invalid Skill descriptor | Thrown at module load (registry construction) | Skill Registry |
| `writeFiles`/`executeCommands`/`network: true` declared | Thrown at module load (registry construction) | Skill Registry |
| Skill is not applicable | `status: "not_applicable"` result, never thrown | Skill Service |
| Skill is blocked | `status: "blocked"` result | Skill Service / Skill |
| Skill capability is unsupported | `status: "unsupported"` result | Skill Service / Skill |
| Skill input is invalid | `status: "invalid"` result, `errors` populated | Skill Service |
| Skill context could not be built (invalid manifest, etc.) | `status: "invalid"` result, `errors` populated, `instructions: null` | Skill Context Builder → Skill Service |
| Skill execution failed (unexpected) | `status: "failed"` result, `errors` populated | Skill Service (catches) |
| Skill attempted a forbidden effect | Cannot occur at runtime (SK-R6 prevents registration); if `effects` is ever non-empty regardless, `status: "invalid"` (defensive, SK-R7) | Skill Service |
| Unknown `--skill <id>` at the CLI | Actionable message, exit 1 (SK-R29) | `cli.js` |

Registry-construction errors are deliberately **not** representable as a normal result — they are
AIEF's own bugs (a Skill author's mistake), not a per-invocation outcome any caller needs to branch
on, mirroring how `loadWorkflowDefinition()`'s own-shipped-file-broken case (`internal_error`) is
already treated as distinct from a Change-caused outcome in `workflow-service.js`.

## 9. `prompt` integration

Confirmed via reading `prompt()`'s actual parser (`cli.js:645-702`, unchanged since Entrega 4):
`parseArgs(args)` already produces a flags object (`parsed.change`, `parsed.profile`,
`parsed.assistant`) plus a positional array (`parsed._`) — adding `parsed.skill` (string) and
`parsed["list-skills"]`/`parsed.listSkills` (boolean, exact flag-parsing convention TBD at
implementation time against `parseArgs`'s real dash-handling, not assumed here) requires no parser
change, only two more destructured fields, the same way `parsed.next`/`parsed.change` were added in
Entrega 4.

- **`aief prompt --list-skills [--change <id>]`:** resolves the Change (same resolver, SK-R1-mirroring
  discipline already established), builds one Skill Context, calls `listSkills(context)` — an
  Skill-Service function that maps every registered Skill through `appliesTo(context)` without
  calling `buildInstructions()` — and prints `id`, `title`, and applicability (`applicable` /
  `not_applicable: <reason>`) for each. Zero writes (SK-R40).
- **`aief prompt --skill <id> [--change <id>]`:** resolves the Change, builds context, calls
  `runSkill(id, context)`. Unknown `id` → SK-R29 (exit 1, before any prompt text is printed — never a
  partial prompt). Known but non-applicable/blocked/unsupported → the prompt is still printed in
  full (existing blocks unchanged), with **one honest additional line** stating the Skill's status
  and reason instead of a Skill section (SK-R41 — never a silent omission). Applicable → one new,
  clearly-labeled section is appended after the existing blocks (SK-R43), e.g.:

  ```text
  ─── Skill: requirements-analysis-instructions (ready) ───
  This is guidance for a human or assistant to follow — it was not executed, and following it is
  not yet evidence that the analysis was done.

  <buildInstructions() output>
  ```

  The header/framing text is rendered once, by the Skill Service's shared renderer (SK-R25/R42) —
  never composed per-Skill, so no individual Skill can phrase its own output as a completion claim.
- **Combination with `--change`:** identical selection semantics to every other `prompt` flag
  (Entrega 4 precedent) — explicit wins, implicit requires exactly one open Change, ambiguity is an
  error.
- **No new command verb** (ADR-015): both are flags on the existing `prompt` entry point, exactly
  Entrega 4's Path B precedent for `status`.

## 10. Workflow Engine / SDD Provider integration

A Skill's `context.workflow`/`context.sdd` are `explain()`'s own `workflow`/`sdd` fields, unedited.
No Skill Service function calls `evaluateGates()`/`resolveState()`/`resolveSddProvider()` directly —
only `workflow-service.js`'s `explain()` does, and only the Skill Context Builder calls that. This is
the same "one function computes it, everyone else reads the answer" discipline Entrega 4 established
for `status`/`prompt`, now extended to Skills instead of re-derived a third way.

No Skill contract method can mutate `track`/`stage`, approve a `GateResult`, or invoke
`isTransitionLegal()`'s legal path as anything but a read — there is no such method in §4's contract,
so this is enforced by absence, not by a runtime check that could be bypassed.

## 11. Security — threat model

| Threat | Mitigation |
|---|---|
| Path traversal via a Skill reading a Change-controlled path | Structurally absent — no Skill has filesystem access (SK-R32); the only path-touching code (`resolveSddProvider`/`OpenSpecProvider`) is Change 0045's, already hardened (`isPathWithin`), reused unchanged (SK-R33) |
| Symlink escape | Same as above — inherited from Change 0045's existing fix, not a new surface |
| Arbitrary command execution via a Skill | Structurally absent — `executeCommands` cannot be registered `true` (SK-R6) |
| Network exfiltration via a Skill | Structurally absent — `network` cannot be registered `true` (SK-R6) |
| Untrusted CLI arguments reaching a Skill unsanitized | `--skill <id>` is a static-object lookup (SK-R35); no Skill's `id` is used to build a require/import path, a filesystem path, or a shell command |
| Malicious content in a spec/requirement/artifact acting as a prompt injection against the Skill Service itself | Content only ever flows into `buildInstructions()`'s *output string* — it is never evaluated, parsed as a directive, or used to select a code path (SK-R34); the same boundary `prompt()` already relies on for `spec.md`/`tasks.md` |
| Malicious content in a spec/requirement/artifact acting as a prompt injection against a downstream assistant reading the rendered prompt | Out of this Entrega's control (the same as today's `prompt` output) — noted as a standing risk, not newly introduced or newly mitigated here; SK-R42's explicit "Skill: ... (status)" framing at least labels the section's provenance for a careful reader |
| Secret exposure via `context`/a Skill's result | `context` only carries fields `explain()`/`detectProject()` already exposed to `status`/`prompt` today — no new data source is added; a Skill that echoes `context` verbatim exposes nothing `aief status --change <id>` didn't already print |
| A manipulated/duplicated Skill `id` shadowing a real one | SK-R9 (duplicate rejected at load) + SK-R8 (static object, not a runtime-mutable map) — no code path can register a Skill after startup |
| An invalid descriptor reaching production | SK-R10 (rejected at registry-construction time, whole registry fails to load) — fails loudly at `npm test`/first run, not silently at first real use |

## 12. Determinism

- Registry: object literal order (SK-R30), same precedent as `providerIds()`.
- Context: pure function of `(changeDir, cwd)` via `explain()` + `detectProject(cwd)` (SK-R14).
- Applicability/result: pure functions of `(context, input)` (SK-R19/R31) — no Skill reads
  `Date.now()`/`Math.random()`/env vars for its `status` decision (a Skill *may* include a
  human-readable timestamp in `summary` text the same way `enrich`'s evidence already does, but
  that never affects `status`/`findings`/applicability).

## 13. Testing strategy

- `skill-context.test.js` — mirrors `workflow-service.test.js`'s structure: builds context for
  legacy/track-only/sdd-only/track+sdd/invalid-manifest/invalid-provider/traversal fixtures, asserts
  each maps to the same `explain()` output plus `project`, byte-comparison for zero writes.
- `skill-registry.test.js` — registration, duplicate/invalid-descriptor rejection, forbidden-capability
  rejection, `hasSkill`/`getSkill`/`skillIds` determinism.
- `skill-service.test.js` — `listSkills()`/`runSkill()` against both initial Skills, every status
  value reached by a dedicated fixture (including a synthetic non-applicable/blocked/unsupported
  case, same "synthetic where no real fixture exists yet" precedent Entrega 4 used for `unsupported`).
- `cli.test.js` additions — `prompt --list-skills`, `prompt --skill <id>` (applicable/not-applicable/
  unknown-id), byte-identical without the flags, zero writes.

## 14. Compatibility and rollback

Every file this design adds is new (`cli/src/skills/*.js`, `cli/src/core/services/skill-service.js`,
`cli/src/core/services/skill-context.js`, their tests) or a small additive edit to `prompt()`'s flag
handling — mirrors Entrega 4's own rollback statement. `status`/`verify`/`close`/`propose` gain zero
diff lines. `git diff` after implementation must show only additive/consolidating changes, confirmed
the same way as UX-R34/R35.

## 15. Evolution toward Hooks (boundary only, not implemented)

Hooks (Entrega 5's vision-document sibling, deferred here per the commissioning instruction) will
need to *invoke* a Skill in response to an event (`after_start`, `before_work`, etc.) rather than a
human choosing `--skill <id>`. The Skill Service's `runSkill(id, context, input)` is designed to be
that same call site for a future Hook runner — a Hook module would build (or receive) a `context`,
call `runSkill()`, and decide what to do with the normalized result, exactly as `prompt` does here.
No Hook-specific field is added to the Skill contract or result this Entrega (`assistantRequired` and
the unused `deterministicExecution`/`execute()` slot are the only forward-looking additions, both
already justified above) — Hooks' own event registry, trigger policy, and any confirmation/permission
model remain entirely undesigned and explicitly out of scope (per the commissioning instruction and
`proposal.md`'s scope section).
