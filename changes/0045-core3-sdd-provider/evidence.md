# Evidence

## Summary

Entrega 3 ("SDD Provider") is implemented per the approved SDD planning set
(`proposal.md`/`spec.md`/`design.md`/`tasks.md`/`verification.md`) and ADR-017 (Accepted). AIEF can
now resolve a Change's SDD artifacts — local (AIEF's own files) or OpenSpec — through one provider
boundary, with a deterministic, never-silent selection policy. `LocalSddProvider` wraps the
existing local Change model unchanged; `OpenSpecProvider` resolves the real, documented
`openspec/changes/<id>/{proposal.md, tasks.md, design.md, specs/*/spec.md}` shape. The
(designed-but-unwired) `specification` gate is prepared in `gate-evaluator.js` but referenced by no
shipped workflow definition. `status` gained one additive, opt-in section. `propose()`, `verify`,
and `close` are completely untouched.

**251/251 tests pass** (195 baseline + 52 new + 4 from the adversarial review's fixes).
`aief status` output is byte-identical to the pre-Entrega-3 baseline. `aief verify` passes for the
whole project and for this Change. `git status` was checked clean after every stage.

The independent adversarial review found **three real, concrete defects** — one of them a path
traversal vulnerability — all fixed and re-verified before closing. See "Adversarial Review" below.

## Activities Performed

### Etapa A — Baseline and ADR

1. Confirmed `git status --porcelain` clean; ran `cd cli && npm test`: 195/195 (baseline).
2. Captured real `aief status` output as `sdd-status-baseline.txt`.
3. Captured `propose()`'s current behavior against a real, locally-installed OpenSpec CLI
   (v1.5.0): falls back to a local Change with the message `OpenSpec 1.5.0 is installed but does
   not expose a "propose" command. Falling back to local Change generation.` — confirmed as the
   exact baseline this Entrega must not change.
4. Verified the real OpenSpec directory shape by running `openspec init --tools none` in a
   throwaway temp project: produces `openspec/{changes/{archive/}, specs/, config.yaml}` — matches
   `adapters/openspec/mapping.md`'s documented shape for the top-level layout. **Finding**: the
   installed CLI (v1.5.0) is materially newer/richer than what the adapter docs describe (`schema`,
   `store`, `workset`, `context`, `doctor` subcommands not mentioned anywhere in
   `adapters/openspec/*.md`) — flagged as a risk below, not silently assumed resolved, since a real
   OpenSpec-generated `openspec/changes/<id>/specs/*/spec.md` was not obtainable in this environment
   (creating one requires an assistant slash command, not a plain CLI command).
5. Updated `knowledge/decisions.md`: ADR-017 status changed from `Proposed` to `Accepted`.

### Etapa B — Contracts and errors

6. Wrote `cli/src/core/domain/sdd-model.js`: artifact-state enum, `makeArtifact()`,
   `readArtifactFile()`, `parseRequirements()`/`parseTasks()` (shared, deterministic extraction),
   and the four-outcome capability-check helpers (`unsupportedCapability`/`notImplementedCapability`/
   `failedCapability`/`callCapability`).
7. Wrote `sdd-model.test.js` (12 tests after review fixes); caught and fixed a real bug during
   this stage itself: the task-id-prefix pattern originally matched any capitalized word ("Do
   something...") as if it were an id — tightened to require a hyphen, matching this repository's
   real `T-01`-style convention, before any other code depended on the flawed version.
8. Wrote `cli/src/sdd-providers/index.js` (registry) and
   `cli/src/core/domain/sdd-provider-resolver.js` (`resolveSddProvider()`, the approved precedence
   policy with step 2 — project configuration — explicitly reserved, not built).
9. Wrote `sdd-provider-registry.test.js` (7 tests).

### Etapa C — `LocalSddProvider`

10. Wrote `cli/src/sdd-providers/local.js` — wraps `readChangeFiles()`/`loadChange()` (`change.js`,
    unmodified) for the four required files; adds `readArtifactFile()`-based resolution for
    AGENTS.md's documented optional set (`design.md`/`adr.md`/`notes.md`) plus `proposal.md`/
    `verification.md` (this planning effort's own convention, recognized per the project owner's
    explicit instruction when approving implementation).
11. Wrote `sdd-provider-local.test.js` (10 tests), including a zero-drift regression across every
    real Change in `changes/` and a byte-comparison-before-after proving no write.

### Etapa D — `OpenSpecProvider`

12. Wrote `cli/src/sdd-providers/openspec.js` — deliberately does **not** import or relocate
    `cli.js`'s existing `openspecInfo()`/`run()`/`commandExists()` (documented decision: touching
    `cli.js` at all, even to relocate a helper, risked the explicit "do not change `propose()`"
    instruction; a small, self-contained detection implementation was judged lower-risk than any
    edit to the file `propose()` lives in).
13. Wrote `sdd-provider-openspec.test.js` (12 tests initially, 14 after the review's security fix)
    — artifact resolution against the real documented shape, multiple specs in sorted order, missing/
    empty/read-error distinctions, no-write proof.

### Etapa E — Manifest `sdd` validation

14. Extended `change-manifest.js`: optional `sdd` block (`provider` enum, `change_id` type check).
    Chose a small, duplicated `SDD_PROVIDER_VALUES` constant over importing the provider registry
    into this foundational, Entrega-1-era module — documented as a deliberate layering decision.
15. Extended `change-manifest.test.js` (+6 tests: absence-is-not-error, valid section, unknown
    provider, invalid `change_id` type, `change_id` without `provider`, non-object `sdd`).

### Etapa F — `specification` gate and additive `status`

16. Extended `gate-evaluator.js`: added `"specification"` to `KNOWN_GATE_IDS` and
    `specificationGate()`, which wraps `SddProvider.validate()`'s result exactly the way `readiness`
    wraps `checkChangeReadiness()` — provider detection alone never appears in the gate's own logic,
    only `validate()`'s explicit status does.
17. Confirmed via test that `lite.json`/`standard.json`/`governed.json` remain byte-unchanged and
    none references `"specification"`.
18. Extended `cli.js`: `sddChanges()` (mirrors `workflowChanges()`) and a new, additive "SDD
    provider status" section in `status()` — shown only for a Change whose manifest declares `sdd`.
19. Added 3 end-to-end `cli.test.js` scenarios (explicit local provider, explicit-but-unavailable
    provider reported as an error, SDD-absent Changes unaffected).
20. Re-diffed real `aief status` output against the Etapa A baseline: **identical**.

### Etapa G — Verification

21. Ran the full suite (247/247 at that point), `aief verify` (whole project and this Change),
    confirmed `git status --porcelain` clean.

### Documentation

22. `docs/architecture.md`: new "The SDD Provider boundary" subsection.
23. `docs/domain-model.md`: added `SDD Provider`, `Normalized Artifact`, `SDD Readiness` to the
    ubiquitous-language table.

### Independent review and remediation (see "Adversarial Review" below)

24. Re-read every new/modified file fresh against the 22-item checklist, ADR-017, and all planning
    artifacts. Found and fixed three real defects (R1 blocking — security; R2 high; R3 high).
25. Re-ran the full suite: **251/251**. Re-diffed `aief status`: identical. Re-ran `aief verify`
    (whole project and this Change): PASS. `git status --porcelain`: clean.

## Verification

```bash
# Etapa A
cd cli && npm test                                          # 195 pass, 0 fail (baseline)
node ../cli/bin/aief.js status > sdd-status-baseline.txt
cd .. && DIR=$(mktemp -d) && cd "$DIR" && node .../aief.js propose "test idea"
#   -> "OpenSpec 1.5.0 is installed but does not expose a \"propose\" command.
#       Falling back to local Change generation." (baseline, unchanged by this Entrega)
openspec init --tools none   # (throwaway temp dir) -> openspec/{changes/{archive/},specs/,config.yaml}

# Etapa B-F (representative)
cd cli && node --test tests/sdd-model.test.js               # 12 pass
node --test tests/sdd-provider-registry.test.js               # 7 pass
node --test tests/sdd-provider-local.test.js                   # 10 pass
node --test tests/sdd-provider-openspec.test.js                 # 14 pass (after review fix)
node --test tests/change-manifest.test.js                        # 16 pass
node --test tests/gate-evaluator.test.js                          # 12 pass
node --test tests/cli.test.js                                      # 72 pass

# Etapa G / final
npm test                                                             # 251 pass, 0 fail
diff sdd-status-baseline.txt sdd-status-postreview.txt               # (no output) IDENTICAL
node ../cli/bin/aief.js verify                                        # PASS
node ../cli/bin/aief.js verify --change 0045-core3-sdd-provider        # PASS ("in progress")
git status --porcelain                                                  # only expected pending files

# Security fix reproduction (R1)
node -e '... openspec.resolveChange({manifest:{sdd:{change_id:"../../../secret"}}}, cwd) ...'
#  before fix: resolved:true, getArtifacts() read SECRET CONTENT from outside the project
#  after fix:  resolved:false, reason: "... is not a valid change identifier"
```

No command or test could not be run.

## Findings

| # | Finding | Consequence |
|---|---|---|
| **F1** | The locally-installed OpenSpec CLI (v1.5.0) has subcommands (`schema`, `store`, `workset`, `context`, `doctor`) not mentioned in `adapters/openspec/*.md` — the tool has evolved since those docs were last verified (2026-07-03 per their own note) | `OpenSpecProvider`'s path resolution follows the approved design (`mapping.md`'s documented shape) as instructed; this version drift is disclosed as an unverified-against-a-real-generated-change risk, not silently assumed still-accurate |
| **F2** | Creating a real `openspec/changes/<id>/` with real content requires an assistant slash command (`/opsx:propose`), not a plain CLI command — confirmed by inspecting `openspec change --help` (only `show`/`list`/`validate`) | The requirement-extraction pattern (SDD-R19) is untested against real OpenSpec-generated content; recorded as a risk in `proposal.md`, not resolved here |
| **F3** | `propose()`/`openspecInfo()` share zero code with the new `OpenSpecProvider.detect()` — a deliberate, bounded duplication (design.md, this file's Etapa D) to avoid any edit to the file `propose()` lives in | Recorded as ADR-017's deferred consolidation obligation, not a discovered accident |
| **F4** | `change-manifest.js` duplicates `SDD_PROVIDER_VALUES` rather than importing the provider registry, to avoid an Entrega-1-era foundational module depending on an Entrega-3 subsystem | A deliberate, documented layering decision, two string literals, not logic |

## Adversarial Review

Performed after implementation, before closing, per the commissioning instruction. Code re-read
fresh from disk against ADR-017, `proposal.md`, `spec.md`, `design.md`, `tasks.md`,
`verification.md`, `git diff`, tests, and documentation — checking specifically the 22 items named.

### Findings

| # | Severity | Item(s) | Description | Status |
|---|---|---|---|---|
| **R1** | **Blocking (security)** | #19, #20 (paths outside the project, traversal) | `OpenSpecProvider.resolveChange()` joined `manifest.sdd.change_id` directly into a filesystem path with no containment check. A `change_id` of `"../../../secret"` escaped `openspec/changes/` entirely; `getArtifacts()` then read and reported real content from outside the project as if it were this Change's SDD proposal. Reproduced live: planted a file at `/tmp/aief-traversal-secret/proposal.md` with `"SECRET CONTENT"`, confirmed it was read and returned. `manifest.json` can originate from an untrusted contributor's PR, not only a trusted maintainer — this is a real attack surface, not a theoretical one. | **Fixed.** Added `isPathWithin()` containment check (`path.relative`-based, rejects `..`-escapes and absolute-path swaps) before any filesystem access. Reproduced the exploit against the fix: now rejected with an explicit, actionable error. 2 regression tests added (relative escape, absolute-path substitution) plus a positive test confirming ordinary dotted/dashed ids (`v1.2-add-login`) still resolve normally. |
| **R2** | **High** | #6, #7 (heuristic/fragile parsers, invented requirements) | `parseRequirements()`'s original regex matched *any* `"- **word** — text"` line as a requirement. This repository's own `changes/0041-delete-review-package/spec.md` — pre-existing, not authored by me — has real lines shaped exactly like that (`"- **LIVE** — an active file points here."`, `"- **CODE** — ..."`) that are classification-tag definitions, not requirements. Reproduced live: ran the original parser against that real file; it invented four fake "requirements" (`LIVE`, `CODE`, `HISTORICAL`, `SELF`). | **Fixed.** Tightened the id pattern to require at least one digit — grounded in a verified, universal fact about every real requirement id in this repository (`R1`, `AUTH-R2`, `WF-R14`, `SDD-R21`, ...: all contain a digit; no real classification-tag label does). Re-ran against the same real file and against every real Change's `spec.md`: zero false positives, all genuine `R\d+`-style requirements still extracted correctly. 2 regression tests added. |
| **R3** | **High** | #4 (unnecessary OpenSpec binary execution) | `OpenSpecProvider.detect()` called `commandExists("openspec") \|\| commandExists("opsx")` (two subprocess spawns) **unconditionally**, before even checking whether `openspec/` structure was present — so `status`, a supposedly filesystem-first read operation, spawned processes even on the success path where the answer was already available from a directory check alone. Directly contradicts the explicit instruction ("no ejecutes openspec durante status si la información puede obtenerse leyendo archivos"). | **Fixed.** Reordered: filesystem check first; the binary check now only runs on the failure path (structure absent), where it adds diagnostic value to the error message. The success path — the common case — now spawns zero processes. Test updated to assert `cliPresent === null` on the structure-present path, directly proving the check was skipped, not just coincidentally unused. |
| **R4** | Low | #2 (ambiguous detection) | `verification.md`'s scenario 8 ("ambiguous OpenSpec detection") is actually tested as "referenced Change not found," a related but distinct case from genuine structural ambiguity. True ambiguity (e.g., fuzzy/partial `change_id` matching multiple candidates) cannot arise in this design because `resolveChange()` only ever does exact directory-name matching — a design choice that avoids the ambiguity class entirely rather than needing to detect and warn about it. | Not a defect — noted so the scenario-8 label in `verification.md` is understood precisely, not overstated. |
| **R5** | Informational | #19/#20, residual | Symlink-based traversal (a malicious symlink committed inside `openspec/changes/<id>/` pointing outside the project) is not separately guarded — the same posture as the rest of this codebase (`change.js`'s `readChangeFiles()` has never guarded against it either), and requires the attacker to already have write access to the repository, a materially different threat model than the R1 path-traversal-via-manifest-field case. | Not fixed — consistent with existing project-wide posture; flagged for completeness, not treated as a gap specific to this Entrega. |

### Items checked with no finding

Fallback silencioso de provider explícito (#1) — none: `resolveSddProvider()` returns `{error}`
for both unknown and unavailable explicit providers, confirmed by dedicated tests, `provider` key
absent in both cases so a caller cannot accidentally use a partial result. Dependencia del orden
del filesystem (#3) — none: `resolveSpecifications()` sorts capability directory names before
returning. Artefactos copiados o duplicados (#5) — none: grepped every new file for
`writeFileSync`/`copyFileSync`/`appendFileSync`/`mkdirSync`/`rmSync`/`renameSync`, zero matches.
Relaciones tarea-requisito inventadas (#8) — none: `parseTasks()` always returns `requirements: []`,
never inferred. Capability no soportada reportada como éxito (#9) — none: `callCapability()`'s
three-way non-success/success split is directly tested. Readiness confundida con workflow readiness
(#10) / gate specification aprobado por defecto (#11) — none, and directly the subject of dedicated
tests (`specification gate never resolves 'passed' merely because a provider was detected`).
Mutaciones durante status (#12) — none, same grep as #5. Cambios accidentales en `propose()` (#13)
— none: `git diff cli/src/cli.js` contains zero lines touching `propose`/`openspecInfo`. Cambios
accidentales en `verify`/`close` (#14) — none, confirmed the same way. Regresiones de output legacy
(#15) — none, byte-identical diff re-confirmed after the review's own fixes, not only before them.
Errores de lectura ocultados como missing (#16) — none: `readArtifactFile()` distinguishes
`read_error` from `missing` explicitly, tested with a directory-shaped file. Specifications
múltiples perdidas (#17) — none, tested with three real specs in non-alphabetical creation order.
Provider explícito desconocido con fallback (#18) — none, same as #1. Artefactos temporales (#21)
— none: `git status --porcelain` checked clean after every stage, including after the review's own
fixes.

### Corrections applied

R1 (blocking) and R2/R3 (high) — all three fixed, tested, and re-verified against the full suite
(251/251), the byte-identical `status` diff, `aief verify`, and a clean `git status`, all captured
after the fixes, not only before them.

### Findings deferred (with reasoning, not silently)

R4, R5 — low/informational, no correctness or security impact beyond the existing, project-wide
posture; documented rather than silently dropped.

### Verdict

**`ready_to_close`**

No blocking or high-severity finding remains unresolved. R1 (a real, reproducible path-traversal
vulnerability), R2 (a real, reproducible false-requirement-extraction bug against this repository's
own pre-existing content), and R3 (unnecessary external command execution during a read-only
operation) were each found, fixed, and re-verified within this same review pass — not merely noted
for later. R4/R5 are explicitly low/informational and explicitly deferred with reasoning. Every
SDD-R1–SDD-R37 requirement has passing, named test evidence (`spec.md`'s Acceptance Criteria).
`aief verify`, the full suite (251/251), the byte-identical `aief status` diff, and a clean
`git status` all pass as of this review's final state.

## Risks

See "Risks" in `proposal.md`. F1/F2 above (OpenSpec version drift; no real generated artifact to
test extraction against) remain genuinely open — not resolved by this Entrega, honestly disclosed
rather than assumed away. Every other originally-identified risk (ADR-017 acceptance, `specification`
gate scope creep, two-readiness-concepts blur) did not materialize: ADR-017 was accepted as written;
the gate stays unwired to any real track; the two readiness contracts stayed structurally separate
throughout, confirmed by the dedicated "never passed by default" tests.

## Recommendations

1. When a real OpenSpec-adopting project becomes available, manually verify the requirement/task
   extraction pattern (design.md §9) against real, non-synthetic generated content — F1/F2 remain
   open until then.
2. Before wiring `propose()` to the new provider (ADR-017's recorded obligation), re-read this
   Change's R3 finding — the same "check filesystem before spawning a process" discipline should
   apply to any future relocation of `openspecInfo()`.
3. Before enabling the `specification` gate on a real workflow definition, re-run this Change's own
   "never passed by default" tests against the real track file as an acceptance gate for that
   future Change.
4. Treat R1 as a standing reminder: any future field read from `manifest.json` that is later joined
   into a filesystem path needs the same containment check by default, not as an afterthought.

## Artifacts Produced

| Artifact | Location |
|---|---|
| Proposal / Spec / Design / Tasks / Verification | `changes/0045-core3-sdd-provider/*.md` |
| ADR-017 | `knowledge/decisions.md` |
| `sdd-model.js` | `cli/src/core/domain/sdd-model.js` |
| `sdd-provider-resolver.js` | `cli/src/core/domain/sdd-provider-resolver.js` |
| Provider registry, Local, OpenSpec | `cli/src/sdd-providers/{index,local,openspec}.js` |
| `change-manifest.js` (`sdd` validation) | `cli/src/core/domain/change-manifest.js` |
| `gate-evaluator.js` (`specification` gate) | `cli/src/core/services/gate-evaluator.js` |
| `cli.js` (`sddChanges()`, additive status) | `cli/src/cli.js` |
| New/extended tests | `cli/tests/{sdd-model,sdd-provider-local,sdd-provider-openspec,sdd-provider-registry,change-manifest,gate-evaluator,cli}.test.js` |
| Documentation | `docs/architecture.md`, `docs/domain-model.md` |

## Lessons Learned

1. **Real, pre-existing repository content is the best fuzzer.** Running the new
   requirement-extraction pattern against `changes/0041-*/spec.md` — a file that existed long before
   this Entrega, for an unrelated purpose — found a real false-positive bug that no synthetic test
   fixture happened to cover. Deterministic parsers should be checked against the *whole* real
   corpus, not just the fixtures written to justify them.
2. **A path built from any field in a manifest is a path built from external input**, regardless of
   how trusted the typical author feels. `change_id` needed a containment check the moment it
   touched `path.join()`, not after a report of it being exploitable.
3. **"Filesystem-first" is a testable property, not just a design intention.** The unnecessary
   `commandExists()` call (R3) shipped past both implementation and the first pass of self-review
   because nothing *asserted* the absence of a subprocess spawn — the fix included a test
   (`cliPresent === null`) that makes the property directly observable, not just documented.
4. Keeping `propose()` completely untouched (per explicit instruction) was easier to guarantee by
   *not* relocating shared code into it than by relocating carefully — sometimes the lower-risk
   choice is bounded duplication, explicitly labeled, over a "cleaner" refactor of a file under an
   explicit no-touch instruction.

## Next Change

This Change is closed. Wiring `propose()` to the new provider, enabling the `specification` gate on
a real track, and verifying OpenSpec artifact extraction against real generated content are
candidate follow-ups — none proposed as a formal Change yet. Entrega 4 is the next planned Entrega
in the program, not started here.
