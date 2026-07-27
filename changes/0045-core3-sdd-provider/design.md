# Design — Entrega 3: SDD Provider

## 1. Architecture observed today (before this Entrega)

```text
cli.js: propose(idea)
  ├── openspecInfo()               commandExists("openspec"), --version, --help/propose check
  ├── spawnSync("openspec",
  │     ["propose", idea])         fire-and-forget delegation, stdio: "inherit"
  └── createChange(idea)           local fallback — the ONLY artifact-writing path that exists

Nothing else in cli.js, change.js, change-loader.js, gate-evaluator.js, or transition-engine.js
references OpenSpec in any form. adapters/openspec/{README,mapping,workflow}.md document the real
directory shape and the AIEF↔OpenSpec conceptual mapping — as prose, consumed by humans, never
parsed by code.
```

Confirmed by repository-wide grep (`grep -rn openspec cli/src/`): every match is inside `cli.js`;
zero matches in any `core/` module. `LocalSddProvider`'s natural substrate —
`readChangeFiles()`/`loadChange()` (`change.js`) — already exists, correct and tested, entirely
independent of anything OpenSpec-related.

## 2. Architecture proposed

```text
Change (loadChangeUnified() output, unchanged)
        │
        ▼
resolveSddProvider(change, projectContext)     NEW — cli/src/core/domain/sdd-provider-resolver.js
        │  (precedence: manifest.sdd.provider -> project config -> OpenSpec detection -> local)
        ▼
Provider Registry  { local: LocalSddProvider, openspec: OpenSpecProvider }
        │
        ├── LocalSddProvider    wraps readChangeFiles()/loadChange() — no new artifact logic
        └── OpenSpecProvider    NEW artifact resolution against openspec/changes/<name>/*
        │
        ▼
Normalized SDD Result  { provider, changeId, artifacts, requirements, tasks, readiness }
        │
        ├── (designed, not wired) gate-evaluator.js's `specification` gate
        └── (this Entrega) cli.js status() — additive block, only when manifest.sdd exists
```

No box here replaces `loadChangeUnified()`, `readChangeFiles()`, `checkChangeReadiness()`, or
`resolveState()` — every one of them is reused exactly as Entregas 1–2 left it (design.md §1 of
Change 0044 established this "extend, don't replace" discipline; this Entrega follows it for the
same reasons: `verify`/`close` stay legacy-only, the Workflow Engine's `readiness` gate stays
wrapped around `checkChangeReadiness()` unchanged).

## 3. Provider interface — evaluated against the vision document's sketch, method by method

The vision document (`docs/aief-core-3-claude-code-prompt.md` §9) proposes a `class SddProvider`
with `detect/createChange/getArtifacts/getRequirements/getTasks/validate/archive`. Adopted as
**plain functions in a module, not a class** (ADR-017) — every other "provider" concept in this
codebase (`requirement-providers/{manual,jira}.js`) is a module exporting functions, registered in
a plain object (`requirement-providers/index.js`'s `ADAPTERS`), and zero classes exist anywhere in
`cli/src/`. `SddProvider` is therefore a **documented function-shape contract**, not a base class —
each provider module exports the same named functions; nothing is inherited or instantiated.

| Vision doc method | Kept? | Justification |
|---|---|---|
| `detect(projectContext)` | Yes, renamed `detect(cwd)` | Real need: precedence step 3 (SDD-R7) requires it. Read-only (SDD-R6). |
| `resolveChange(change)` | **Added** (not in the vision sketch) | The vision doc jumps straight to `getArtifacts(change)` assuming the AIEF↔provider Change link already exists. This Entrega needs an explicit step that reads `manifest.sdd.change_id` (or infers it for `LocalSddProvider`, where the AIEF Change *is* the SDD Change) and reports whether the reference resolves — this is exactly SDD-R24's "Referenced OpenSpec Change does not exist" error case, and it needs its own function to be testable in isolation from artifact reading. |
| `createChange(input)` | **Dropped for this Entrega** | Writes. Out of scope (SDD-R2: every method read-only this Entrega; `propose()`'s existing local-skeleton creation and OpenSpec delegation are not touched — see ADR-017). Kept as a documented future method, not implemented. |
| `getArtifacts(change)` | Yes | Core normalized-result method (SDD-R17/R18). |
| `getRequirements(change)` | Yes | SDD-R19–R21. |
| `getTasks(change)` | Yes | SDD-R19–R21. |
| `validate(change)` | Yes, returns the readiness contract (§9) | SDD-R22/R23. |
| `archive(change)` | Kept as a **declared, unimplemented** capability | The commissioning instruction explicitly asks for this ("archivado futuro, aunque la ejecución del archivo pueda quedar fuera de alcance"); the capabilities contract (§4) reports `archive: false` for both providers in this Entrega. |
| `get id()` | Yes, plain export `PROVIDER_ID` per module | Mirrors `PROVIDERS` catalog shape in `requirement.js`, not a getter (no classes). |

Final per-module export shape (both `local.js` and `openspec.js` under a new
`cli/src/sdd-providers/` directory, mirroring `requirement-providers/`'s naming):

```js
export const PROVIDER_ID = "local" | "openspec";
export function detect(cwd) { ... }                    // -> { available: bool, reason? }
export function resolveChange(change, cwd) { ... }      // -> { resolved: bool, changeId?, reason? }
export function getArtifacts(change, cwd) { ... }       // -> normalized artifacts (§6)
export function getRequirements(change, cwd) { ... }    // -> normalized requirements (§7)
export function getTasks(change, cwd) { ... }           // -> normalized tasks (§7)
export function validate(change, cwd) { ... }           // -> readiness contract (§9)
export const CAPABILITIES = { create: false, read_artifacts: true, requirements: true,
                                tasks: true, validate: true, archive: false };
```

**Capabilities contract: adopted, not deferred.** The commissioning instruction asks whether this
is needed now. Yes — without it, a caller has no way to distinguish "this provider doesn't support
X" from "X failed," and `OpenSpecProvider` and `LocalSddProvider` do not support the same
operations symmetrically in this Entrega (neither supports `create`/`archive` yet). A capabilities
object is a plain constant per module — cheap, and directly required by SDD-R3.

## 4. Registry / resolver — confirmed minimal, no factory, no plugin system

```js
// cli/src/sdd-providers/index.js — mirrors requirement-providers/index.js exactly
import * as local from "./local.js";
import * as openspec from "./openspec.js";
const PROVIDERS = { local, openspec };
export function hasProvider(id) { return Boolean(PROVIDERS[id]); }
export function getProvider(id) { return PROVIDERS[id]; }
```

This answers commissioning question 1 directly: a **plain object registry**, not a class-based
factory and not a plugin-loading system — two known providers, statically imported, exactly the
`requirement-providers/index.js` shape. A factory/plugin layer is unjustified with two fixed
providers (vision doc §21 explicitly excludes a marketplace from this stage of the program).

## 5. Detection

```js
// sdd-providers/openspec.js
export function detect(cwd) {
  const cli = commandExists("openspec") || commandExists("opsx");   // relocated from openspecInfo()
  const structure = exists(path.join(cwd, "openspec")) || exists(path.join(cwd, ".openspec"));
  if (!cli && !structure) return { available: false, reason: "OpenSpec CLI and project structure both absent" };
  if (!structure) return { available: false, reason: "OpenSpec CLI found but no openspec/ project structure" };
  return { available: true, cliPresent: cli };
}
```

**SDD-R5's separation is deliberate**: `structure` without `cli` is real (a committed
`openspec/changes/` directory, CLI not installed locally — e.g. CI reading artifacts without
needing to run OpenSpec commands) and must still allow read-only artifact resolution. `cli`
without `structure` means nothing to resolve yet — `available: false`, matching today's
`propose()` behavior (falls back when there's nothing to delegate to).

**"Ambiguous" detection, concretely** (SDD-R11): `openspec/` exists but contains no `changes/`
subdirectory, or `changes/` exists but is empty while the manifest expects a specific
`change_id` that isn't there — these are not "OpenSpec absent," they're "OpenSpec present but this
Change's reference doesn't resolve," handled by `resolveChange()` (§3), not `detect()`. `detect()`
itself has only two ambiguity-free outcomes: available or not, each with a reason.

## 6. Selection and precedence

```text
1. manifest.sdd.provider (explicit)         — always wins, including over detected OpenSpec (SDD-R8)
2. project-level configuration              — NOT implemented this Entrega (no such config exists
                                               today; inventing one without a real need would violate
                                               "no abstractions without immediate use case" — the
                                               precedence *slot* is reserved in the design, skipped
                                               in the implementation)
3. unambiguous OpenSpec detection            — detect().available === true
4. LocalSddProvider                          — default, always available
```

This confirms the commissioning instruction's proposed order **with one adjustment, stated
explicitly**: step 2 ("project configuration") has no real referent in this repository today — no
project-level SDD config file or field exists anywhere (confirmed by inspection: `package.json`,
`AGENTS.md`, `knowledge/decisions.md` have no such concept). Rather than inventing one to fill the
slot, the precedence *documents* the slot (so a future Entrega can add it without renumbering) and
the *implementation* skips straight from step 1 to step 3. This is the same discipline Change 0044
used for `status --json`/`--verbose` (WF-R16): named and reserved, not built without a need.

`resolveSddProvider(change, cwd)`:

```js
function resolveSddProvider(change, cwd) {
  const declared = change.manifest?.sdd?.provider;
  if (declared !== undefined) {
    if (!hasProvider(declared)) return { error: `unknown SDD provider ${JSON.stringify(declared)}` };
    const provider = getProvider(declared);
    const detection = provider.detect(cwd);
    if (!detection.available) return { error: `configured provider ${JSON.stringify(declared)} is unavailable: ${detection.reason}` };
    return { provider, source: "manifest" };
  }
  const openspecDetection = openspec.detect(cwd);
  if (openspecDetection.available) return { provider: openspec, source: "detected" };
  return { provider: local, source: "default" };
}
```

Deterministic by construction: same `change`/`cwd` on disk, same result, every call (SDD-R7),
because `detect()` is itself deterministic (§5).

## 7. `LocalSddProvider`

```js
// sdd-providers/local.js
export function getArtifacts(change) {
  const { files, missing, empty } = readChangeFiles(change.dir);           // change.js, unchanged
  const optional = readOptionalChangeFiles(change.dir, ["design.md", "adr.md", "notes.md"]);  // NEW,
  // small helper: same existence/empty logic as readChangeFiles(), for the AGENTS.md-documented
  // optional set (spec.md SDD-R16's correction — not proposal.md/verification.md, which are this
  // planning effort's own convention, not AGENTS.md's).
  return normalizeLocalArtifacts(files, missing, empty, optional);          // §8 shape
}
```

`getRequirements()`/`getTasks()` reuse the same extraction rules `OpenSpecProvider` uses against
AIEF's own `spec.md`/`tasks.md` conventions (§9) — one parser module, not two, since both providers
ultimately read Markdown with the same two deterministic patterns (`**R\d+**` requirement lines,
`- [ ]`/`- [x]` task lines). `validate()` wraps... **nothing new**: for `LocalSddProvider`,
"are the SDD artifacts present and valid" is answerable directly from `missing`/`empty` — no
separate readiness computation is needed beyond what `readChangeFiles()` already reports.

**Zero-drift proof strategy** (SDD-R15): for every real Change in `changes/`,
`LocalSddProvider.getArtifacts(change)`'s `{path, exists}` pairs must match `loadChangeUnified()`'s
own `missing`/`empty` arrays exactly — same technique, same corpus, as Change 0043's original
zero-drift regression.

## 8. `OpenSpecProvider` and the normalized artifact model

```text
openspec/changes/<change_id>/
  proposal.md         -> artifacts.proposal      { path, exists, empty?, readError? }
  design.md           -> artifacts.design         { path, exists, empty?, readError? }  (optional per OpenSpec's own convention -> not_applicable if genuinely absent and not required)
  tasks.md             -> artifacts.tasks           { path, exists, empty?, readError? }
  specs/*/spec.md        -> artifacts.specifications[]  array, zero or more (SDD-R13)
```

```js
{
  provider: "openspec",
  changeId: "add-password-reset",
  artifacts: {
    proposal:      { path: "openspec/changes/add-password-reset/proposal.md", state: "present" | "missing" | "empty" | "invalid" | "not_applicable" | "read_error" },
    design:        { path: "...", state: "..." },
    tasks:         { path: "...", state: "..." },
    specifications: [ { path: "openspec/changes/add-password-reset/specs/auth/spec.md", state: "present" } ]
  }
}
```

`state` is the five-way enum SDD-R17 requires (`present` replaces the vision doc's boolean
`exists: true` — a boolean cannot represent `invalid`/`not_applicable`/`read_error` without a
second field, so this design uses one enum instead of `exists` + implied booleans, which is more
in the spirit of "distinguish five states explicitly" than the vision doc's own two-field sketch).
`LocalSddProvider`'s result uses the identical shape, with `changeId` equal to the AIEF Change's
own directory basename (the local "SDD Change" **is** the AIEF Change — no separate id to track).

## 9. Requirements and tasks — scoped to what's real

Before designing extraction, the actual patterns this repository's own Changes use were read
directly (not assumed):

- `spec.md` requirements: `- **R1** — <text>` (verified: `changes/0039-*/spec.md` and every WF-R\*/
  SDD-R\* requirement in Changes 0044/this one use the same `**<ID>** — <text>` shape).
- `tasks.md` tasks: `- [ ]`/`- [x]` lines, optionally prefixed with an id-like token
  (`T-01`, or none at all — most real Changes here use no task ids, just prose).
- **No repository Change links a task to a requirement id in any machine-checkable way** (spec.md
  SDD-R21's correction). This capability is designed as `unsupported` for both providers in this
  Entrega, not built against an invented convention.

Extraction rules (both providers, one shared parser):

```text
Requirement:  /^\s*-\s*\*\*([A-Z0-9-]+)\*\*\s*[—-]\s*(.+)$/   -> { id, text }
Task:         /^\s*-\s*\[( |x|X)\]\s*(.+)$/                    -> { completed, text }
              optional leading id token /^([A-Z0-9-]+)\s+(.+)/ applied to `text` -> { id, text }
```

Anything not matching these patterns is not a parse failure — the file is still `present`, its
`requirements`/`tasks` arrays are simply built only from matching lines (SDD-R20: fixed pattern,
no heuristic "best guess" for non-matching lines). `OpenSpecProvider`'s `specs/*/spec.md` files
are scanned with the same requirement pattern; if OpenSpec's real-world spec format differs (not
verified against a real OpenSpec-generated file in this repository — none exists), that gap is
recorded as a risk (§14) rather than papered over with a guess.

## 10. Readiness — two contracts, not one

```yaml
# SddProvider.validate(change) result
provider: openspec
status: ready | not_ready | invalid | unsupported
artifacts: { proposal: passed, specifications: passed, design: not_applicable, tasks: passed }
blockers: []
warnings: []
```

```text
Provider readiness  = "are the SDD artifacts present and valid"     (this Entrega, §10)
Gate readiness       = "can this Change transition"                   (Change 0044, resolveState())
```

**Kept as two sequential, never-merged contracts** (SDD-R22) — directly because of Change 0044's
own review finding R1: a fact ("this exists," "this was detected") must never silently become a
blocking verdict's `"passed"`. The (designed, unwired) `specification` gate consumes
`validate()`'s `status`/`blockers` the same way `readiness` consumes `checkChangeReadiness()`'s
`problems` array (design.md §5 of Change 0044) — a thin wrap, not a reimplementation, and not a
shortcut that treats "provider detected" as "gate passed."

```js
// gate-evaluator.js addition (designed here, NOT wired to any workflow definition — SDD-R32)
function specificationGate(change, cwd) {
  const { provider } = resolveSddProvider(change, cwd);
  const result = provider.validate(change, cwd);
  return {
    id: "specification",
    status: result.status === "ready" ? "passed" : result.status === "not_ready" ? "failed" : result.status,
    blocking: true,
    reason: result.blockers.join("; ") || result.status,
    evidence: []
  };
}
```

`KNOWN_GATE_IDS` (`gate-evaluator.js`) gains `"specification"`; `lite.json`/`standard.json`/
`governed.json` are **not edited** — `applicableIds` (computed from each definition's own
`gateIds`) never contains `"specification"` until a later, explicit Change adds it to a stage.
`resolveState()` (`transition-engine.js`) needs no change at all (SDD-R33) — it already treats
every gate result generically by id.

## 11. Errors

| Case | Reported as |
|---|---|
| Unknown SDD provider | `resolveSddProvider()` error, `{error: "unknown SDD provider ..."}`, never a silent default |
| Configured provider unavailable | `resolveSddProvider()` error, names the provider and `detect()`'s own `reason` |
| OpenSpec structure ambiguous | `resolveChange()` result `{resolved: false, reason: "..."}` — never guessed |
| Referenced OpenSpec Change missing | Same as above — `openspec/changes/<change_id>/` doesn't exist |
| Required artifact missing/empty | `artifacts.<name>.state` — `missing`/`empty`, never fabricated content |
| Artifact unreadable | `state: "read_error"`, wrapped `fs` error message included, never thrown past the provider boundary (same discipline as Change 0043's L3 fix) |
| Unsupported format | `state: "invalid"` with a reason (e.g. a `spec.md` that isn't valid UTF-8 Markdown in a way the parser can even scan) |
| Requirements/tasks not parseable | Not a global failure — unmatched lines are simply excluded (§9), never a thrown error for the whole file |
| Unsupported provider operation | Checked via `CAPABILITIES` (§3) before calling — a caller invoking an unsupported operation gets a explicit "not supported by this provider" result, not an exception |
| Provider command failed | Only applies to `OpenSpecProvider.detect()`'s optional `--version`/`--help` calls — exit code/stdout/stderr recorded exactly as `openspecInfo()` already does today |

## 12. Integration with Change and manifest

`manifest.json`'s `sdd` section (accepted-unvalidated since Entrega 1) gains real, **optional**
validation in `change-manifest.js`:

```js
if (value.sdd !== undefined) {
  if (typeof value.sdd !== "object" || Array.isArray(value.sdd)) fail("sdd", "must be an object when present");
  else {
    if (value.sdd.provider !== undefined && !["local", "openspec"].includes(value.sdd.provider)) {
      fail("sdd.provider", `must be "local" or "openspec", got ${JSON.stringify(value.sdd.provider)}`);
    }
    if (value.sdd.change_id !== undefined && typeof value.sdd.change_id !== "string") {
      fail("sdd.change_id", "must be a string when present");
    }
  }
}
```

Absence of `sdd` is never an error (SDD-R26) — this `if` block simply never runs. A `change_id`
without a valid `provider` is accepted structurally (SDD-R27 doesn't require rejecting it) but
`resolveChange()` at runtime reports it can't resolve (design.md §3's `resolveChange` — SDD-R28).

## 13. Integration with Workflow Engine

Covered in §10. Summary: `specification` gate function designed and unit-testable; `KNOWN_GATE_IDS`
extended; zero shipped workflow definitions changed; `resolveState()` untouched.

## 14. Integration with `status`

```text
SDD provider: OpenSpec           <- only when change.manifest?.sdd exists
SDD change: add-password-reset
SDD readiness: Ready
```

Rendered by a new, additive `sddChanges()` helper in `cli.js`, mirroring `workflowChanges()`'s
exact shape (Change 0044 §Etapa E): filter `getChangeDirs()` to Changes with `change.manifest?.sdd`,
resolve each, render only if non-empty. Zero real Changes have `sdd` today — the byte-identical
guarantee holds unconditionally, proven the same way (`aief status` diff, `wf-status-baseline.txt`
equivalent, before/after).

## 15. External operations, security

The only external command this Entrega's design uses is `openspec --version`/`--help`
(`OpenSpecProvider.detect()`, relocated from `openspecInfo()`, unchanged behavior) — read-only,
already exercised by existing tests. No new command is introduced. `getArtifacts()`/
`getRequirements()`/`getTasks()`/`validate()` are filesystem-only for both providers (OpenSpec's
directory shape is documented and stable — no need to shell out to read it). No credentials, no
network calls, matching `requirement.js`'s existing provider-contract discipline (which this design
explicitly mirrors).

## 16. Compatibility

See `proposal.md`'s "Compatibility" section — restated here as a design constraint: every new
function added by this Entrega is reachable only from a Change whose manifest declares `sdd`
(zero today) or from `LocalSddProvider`'s own zero-drift-proven wrapper (identical output to
existing behavior). No existing function's signature or behavior changes for any input that
exercised it before this Entrega.

## 17. Tests (planned; full plan in `verification.md`)

New: `sdd-providers/local.test.js`, `sdd-providers/openspec.test.js`,
`sdd-provider-resolver.test.js`, `requirement-task-extraction.test.js` (shared parser). Extended:
`change-manifest.test.js` (`sdd` validation), `gate-evaluator.test.js` (`specification` gate
function, never wired to a real definition), `cli.test.js` (additive `status` scenarios,
zero-drift for `sdd`-absent Changes).

## 18. Rollback

Every artifact is a new file (`cli/src/sdd-providers/*`, `cli/src/core/domain/
sdd-provider-resolver.js`) or a small additive edit (`change-manifest.js`'s `sdd` block,
`gate-evaluator.js`'s new gate function + `KNOWN_GATE_IDS` entry, `cli.js`'s new `status()` section).
No shipped workflow definition changes. Revert is a plain code revert; no data migration exists to
undo, since nothing writes anything.

## 19. Future evolution (not built here)

`createChange()`/`archive()` real implementations (would need their own write-path review, matching
Change 0043's B1-avoidance discipline). Wiring `propose()` to call the new provider (ADR-017's
recorded, deferred obligation). Adding `specification` to a real workflow definition (a distinct,
explicit Change, per Change 0044's own "narration first, enforcement later" pattern). Project-level
SDD configuration (precedence step 2, reserved but unbuilt, §6). Verifying `OpenSpecProvider`'s
requirement-extraction pattern against a real OpenSpec-generated `spec.md` once one exists in a
project this team actually uses OpenSpec on (§9's disclosed risk).
