# Evidence

## Summary

Entrega 7 (Change 0049, ADR-021, Path C) is implemented, tested, and reviewed. Verification splits
explicitly into Structural Verification (`change-verifier.js`, untouched) and Requirement
Verification (new — a deterministic, evidence-grounded per-requirement verdict engine), reachable
only via the single, opt-in `aief verify --requirements` flag. Two rules ship:
`requirement-has-traceability` (citation-based, grounded in the real `verification.md` convention
this session's own prior Entregas established) and `evidence-reference-integrity` (path-containment,
including real symlink-escape rejection via `fs.realpathSync`, per the commissioning instruction's
explicit requirement). 534/534 tests pass (440 baseline + 94 new). `aief verify` PASS.
`aief verify` (without `--requirements`) is byte-identical to Entrega 6's output. `git status
--porcelain` clean except this Change's own files. The formal adversarial review (57-point checklist)
found and fixed one real correctness bug (a duplicate `explain()` call) and proactively closed one
enforcement gap (`manual_attestation` alone) before either could be exercised by a real caller.

## Activities Performed

- Etapa A: baseline captured (440/440 tests, `verify` PASS/FAIL output snapshots against a real and
  a scratch Change). Confirmed by re-reading `change-verifier.js` in full that it is 100% Structural
  Verification with no requirement-level concept. Confirmed `sdd-model.js`'s `Task.requirements` is
  always `[]` (SDD-R21) — no machine-checkable requirement↔task/test link exists anywhere in this
  repository. ADR-021 changed from `Proposed` to `Accepted`.
- Etapa B: the Verification Rule contract (`cli/src/core/domain/verification-rule.js`) —
  `SCOPE_VALUES`, `KNOWN_CAPABILITIES`, `FORBIDDEN_CAPABILITIES` (including `assistantRequired`, a
  first for this project — Requirement Verification is AI-free by design, not convention),
  `EVIDENCE_TYPES`/`SUPPORTED_EVIDENCE_TYPES`/`INSUFFICIENT_ALONE_EVIDENCE_TYPES`/
  `REJECTED_EVIDENCE_TYPES`, `STATUS_VALUES` (seven, including `failed` — the first genuine pass/fail
  *verdict* concept this system has ever rendered), `APPLICABILITY_STATUSES` (applied *proactively*
  this Entrega — the same fix Entrega 5's review found reactively for Skills and Entrega 6 applied
  proactively for Hooks), `AGGREGATE_STATUS_VALUES`, `validateDescriptor()`. 15 tests
  (`verification-rule-model.test.js`), written and passing before any rule or the registry existed.
- Etapa C: the two rule modules and the Verification Registry (`cli/src/verification-rules/index.js`)
  — mirrors `skills/index.js`/`hooks/index.js` exactly. 11 tests (`verification-registry.test.js`).
- Etapa D: Evidence resolution (`cli/src/core/services/verification-evidence.js`) — grounded in the
  one real, existing citation convention (requirement ids cited in `verification.md`'s scenario
  table): scans only the lines citing a given requirement's id for backtick-quoted, path-shaped
  tokens, resolves each against the project root with **real-path** containment (`fs.realpathSync`,
  not just textual `path.relative` resolution — the commissioning instruction's own explicit
  requirement for any new file read this Entrega introduces). 16 tests
  (`verification-evidence.test.js`), including a live symlink-escape rejection test.
- Etapa E: the Verification Context (`cli/src/core/services/verification-context.js`) — reuses
  `change`/`workflow`/`sdd` from the caller (never fetches them itself — see Findings for why this
  needed a mid-implementation fix), adds `requirements`/`tasks` (SDD Provider's own arrays, unedited),
  adds the one new safe read (`verification.md`). 15 tests (`verification-context.test.js`).
- Etapa F: the Verification Service (`cli/src/core/services/verification-service.js`) —
  `evaluateRule()`/`evaluateRequirements()` (resolve → applicability → evaluate → normalize →
  enforce) and `aggregateVerificationResult()` (five-status, fixed-precedence aggregation). 30 tests
  (`verification-service.test.js`), including a battery of adversarial fixture rules attempting to
  declare effects, spoof `rule`/`requirement`, invent evidence, claim `passed` with insufficient
  evidence, and mutate frozen inputs.
- Etapa G/H: `requirement-has-traceability` and `evidence-reference-integrity`'s full logic, exercised
  end-to-end via the real registry in `verification-service.test.js`.
- Etapa I: `aief verify --requirements` wired into `verify()` — legacy structural report renders
  first, unchanged; an additive "Requirement Verification: <STATUS>" section follows; exit code
  governed entirely by the aggregated result. `--requirements` without `--change` leaves the
  whole-project structural check fully untouched and explicitly names the gap ("skipped — pass
  --change") rather than guessing a Change or silently changing which structural check runs. 10 new
  `cli.test.js` tests.
- Etapa J/K: compatibility regressions — confirmed via `git diff` hunk-by-hunk inspection that
  `close()`, `propose()`, Skills, Hooks, WorkflowService, SDD Provider, and every Workflow Engine file
  have zero touched lines; `main()`'s dispatcher gained zero new `case` entries; `aief status`/
  `aief prompt`/`aief prompt --skill`/`aief prompt --list-skills`/`aief verify` real output
  byte-identical against the Etapa A baseline; live-reproduced the full requirement-verification flow
  on a real scratch Change (cited + present evidence → PASS; uncited requirement → FAIL, exit 1;
  path-traversal evidence reference → INVALID, exit 1); live-reproduced a real symlink-escape attempt
  and confirmed rejection.
- Documentation: `docs/architecture.md` (new "Verification Engine" subsection), `docs/domain-model.md`
  (six new ubiquitous-language rows).
- Formal adversarial review (57-point checklist, this session, after Etapa L) — see below.

## Verification

```
cd cli && npm test
# 534/534 pass (440 baseline + 94 new), 0 fail
node ../cli/bin/aief.js verify        # whole project: PASS
git status --porcelain                # clean (except this Change's own in-progress files)
```

`aief verify` (without `--requirements`) real-output diff against the Etapa A baseline:
**byte-identical, zero diff lines** — re-confirmed after both adversarial-review fixes.

Live CLI checks performed directly: a scratch Change with `sdd: {provider: "local"}`, two
requirements (one cited in `verification.md` with a present evidence file, one not cited at all)
produced exactly `REQ-1: passed` / `REQ-2: failed`, aggregate `FAIL`, exit 1; the same scratch Change
with only the cited requirement produced aggregate `PASS`, exit 0; a path-traversal evidence
reference (`../../../etc/passwd`) produced `INVALID`, exit 1; a symlink physically inside the project
root pointing outside it was rejected with "outside the project root", never read.

Scenario table (`verification.md`, 55 scenarios mapped to VR-R1–R60): **all 55 PASS**, each backed by
a dedicated automated test.

## Findings

### Formal adversarial review (57-point checklist, post-implementation)

Re-read `cli/src/core/domain/verification-rule.js`, `cli/src/verification-rules/*.js`,
`cli/src/core/services/verification-context.js`/`verification-evidence.js`/
`verification-service.js`, and `cli.js`'s `verify()`/`runRequirementVerification()`/
`runVerifyCompletedHooks()` fresh against each item:

| # | Check | Result |
|---|---|---|
| 1 | Regla desconocida aceptada | None — registry-time validation only; no runtime "unknown rule" path exists since rules are resolved via `rulesForScope()`, a fixed array. |
| 2 | Descriptor inválido aceptado | None — `validateDescriptor()` rejected at registry-construction time (tested). |
| 3-4 | Duplicate id / orden accidental | None — `createRegistry()` throws on duplicates; array-literal order (tested). |
| 5 | Registry mutable | None — built once from frozen ES-module namespace objects. |
| 6 | Capability ausente permitida | None — strict `=== true` checks throughout. |
| 7-9 | `writeFiles`/`executeCommands`/`network` aceptado | None — `FORBIDDEN_CAPABILITIES` rejected at registration (tested). |
| 10 | `assistantRequired` tratado como PASS | None — also in `FORBIDDEN_CAPABILITIES`; cannot be registered at all. |
| 11 | `appliesTo` status spoofing | None — `APPLICABILITY_STATUSES` whitelist applied *proactively* this Entrega (tested). |
| 12-13 | Rule id / requirement id falsificado | None — `baseResult()` re-asserts `rule`/`requirement` after the spread (tested). |
| 14 | PASS sin evidence | None — defense-in-depth check: a rule declaring evidence types with zero resolved evidence cannot report `passed` (tested). |
| 15 | Evidence inventada | None — `onlyResolvedItems()` rejects any `evidence` entry not present in what the Service itself resolved (tested); `missingEvidence` is deliberately exempt (see design rationale — it only ever describes an absence, never manufactures a false pass). |
| 16 | Evidence mutada | None — evidence array and every entry frozen before being handed to a rule (tested). |
| 17 | Requirement mutado | None — `context.requirements` is part of the deep-frozen context (tested). |
| 18 | Contexto mutado | None — `buildVerificationContext()`'s return is deep-frozen (tested). |
| 19-21 | `test` evidence treated as executed/passed/provenance-free | None — `test` is DEFINED, UNSUPPORTED; no rule uses it; using it yields `unsupported`, never a fabricated result. |
| 22 | Manual attestation suficiente | **Found and fixed proactively** (see below). |
| 23-24 | `command_result`/`external_reference` aceptado/seguido | None — registry-rejected at validation time (VR-R14-equivalent check in `validateDescriptor()`), tested. |
| 25 | Traversal | None — `isPathWithin()` (Change 0045's own logic, duplicated since SDD Provider files must stay untouched) rejects it (tested). |
| 26 | Ruta absoluta | None — same mechanism. |
| 27 | Symlink escape | None — **real-path** containment via `fs.realpathSync`, not just textual resolution (tested with a live symlink fixture, per the commissioning instruction's explicit requirement). |
| 28 | Contenido hostil ejecutado | None — no rule interprets `verificationDoc`/requirement text as anything but data; nothing is `eval`'d or shelled out. |
| 29 | Prompt injection alterando policy | None — same reasoning; capabilities/registry/applicability outcomes are fixed, frozen module constants, unaffected by any file content. |
| 30-31 | Unsupported/missing evidence convertido en PASS | None — `unsupported`/`not_applicable` excluded from aggregation entirely; missing evidence maps to `blocked`/`INCOMPLETE` (tested exhaustively). |
| 32 | Invalid evidence ignorada | None — a path-containment failure is `status: "invalid"` on the rule, which propagates to aggregate `INVALID` (tested). |
| 33 | Engine error convertido en FAIL | None — `ERROR` checked first in the aggregation precedence, before `FAIL` (tested). |
| 34 | Warning convertido en FAIL | None — `aggregateVerificationResult()` never reads `warnings` at all. |
| 35 | Aggregation precedence incorrecta | None — 9 dedicated precedence tests, including every pairwise combination. |
| 36 | Structural PASS convertido en Requirement PASS | None — rendered as two clearly separate, labeled sections; never conflated in code or output. |
| 37-38 | Workflow/SDD rederivado | **Found and fixed** (see below) — a real bug, not merely a documentation gap. |
| 39 | Provider ejecutado dos veces | Same root cause as 37/38, same fix. |
| 40-41 | Hook alterando Verification / recursión verify→Hook→Verification | None — grep-confirmed zero imports of any Hook module from any Verification module, and zero imports of any Verification module from `hook-service.js`/`cli/src/hooks/`. |
| 42-43 | Gate aprobado / stage modificado | None — no such method exists in any Verification contract; zero diff lines in `gate-evaluator.js` or any workflow definition JSON. |
| 44 | Close modificado | None — zero diff lines in `close()`/`markClosed()`/`checkChangeReadiness()` (hunk-boundary inspection, same technique as prior Entregas). |
| 45 | Evidence persistida | None — nothing in this Entrega writes `evidence.md` or any new file. |
| 46 | Archivo escrito | None — zero-writes tests confirm the Change directory (and project files) are byte-unchanged after any `--requirements` invocation. |
| 47 | Test ejecutado | None — structurally impossible; `test` evidence is UNSUPPORTED, no rule invokes `npm test`/any test runner. |
| 48-49 | OpenSpec ejecutado / proceso externo | None — zero `child_process`/`spawnSync` calls anywhere in the new modules (grep-confirmed). |
| 50 | `verify` legacy modificado | None — byte-identical diff confirmed, before and after both fixes. |
| 51 | Exit code legacy modificado | None — `--requirements`'s exit-code policy is new and additive; without the flag, exit code is unchanged. |
| 52-54 | `prompt`/`status`/`propose` modificado | None — zero diff lines in any of the three (confirmed via hunk-boundary inspection). |
| 55 | Verbo nuevo | None — `main()`'s dispatcher gained zero new `case` entries. |
| 56 | VR-R sin evidencia | None outstanding — all 60 VR-R requirements map to at least one dedicated test (see `verification.md`'s scenario table and this file's Verification section). |
| 57 | Temporales | None — `git status --porcelain` clean throughout; all untracked entries predate this Entrega. |

### Issues found and fixed during the review

**1. A real correctness bug: `buildVerificationContext()` called `explain()` a second time,
duplicating `verify()`'s own call.** The original implementation had
`buildVerificationContext(changeDir, cwd, operation)` call `workflow-service.js`'s `explain()`
internally — but `verify()`'s `--change` branch already calls `explainWorkflow()` once (Entrega 6, for
the Post-Verify Hook). This meant `aief verify --change <id> --requirements` performed **two**
independent `explain()` calls per invocation — a direct violation of this Entrega's own VR-R21/R24/
R45 ("Verification Context reuses `explain()`... zero additional calls"), and exactly the "two
callers assumed to agree" risk class this project has repeatedly guarded against (Change 0043's B1,
restated for Hooks as HK-R20, now found a third time here despite writing the requirement down in
advance). Since `explain()` is pure and deterministic, this never produced a *visibly wrong* answer —
which is precisely why it survived until the adversarial review's structural, not just
output-based, inspection caught it. **Fix**: `buildVerificationContext()`'s signature changed to
`buildVerificationContext({change, workflow, sdd}, changeDir, cwd, operation)` — non-fetching, the
same discipline `hook-context.js`'s `buildHookContext()` already established; `cli.js`'s `verify()`
now computes `explainWorkflow()` exactly once per `--change` invocation and passes the same result to
both `runVerifyCompletedHooks()` and `runRequirementVerification()`. **Regression tests**: a
structural test asserting `buildVerificationContext.length === 4` (proving the function cannot fetch
anything itself) plus a source-grep confirming no `explain(`-shaped import, in
`verification-context.test.js`; every other Context test updated to build the `explain()` result once
and pass it in, matching the corrected, real call pattern.

**2. `manual_attestation` had no enforcement preventing it from justifying a `passed` verdict alone
(VR-R7), even though no shipped rule uses it yet.** Neither `requirement-has-traceability` nor
`evidence-reference-integrity` declares `manual_attestation` as an evidence type, so this gap was
unreachable through any real code path this Entrega ships — but the Verification Service's own
enforcement logic (which independently guards against invented evidence, empty-evidence-with-passed,
and effect/identity spoofing) had no check for "evidence exists, but every item is
`manual_attestation`, and the rule still says passed." Since VR-R7 is an explicit requirement, this
was closed proactively, before any future rule could exercise it silently. **Fix**: added a check in
`evaluateRule()` — if `raw.status === "passed"` and the resolved evidence is non-empty but consists
entirely of `manual_attestation` entries, the result is downgraded to `invalid`. **Regression
tests**: `"manual_attestation evidence alone can never justify a passed verdict"` and
`"manual_attestation mixed with real supporting evidence is fine"` (`verification-service.test.js`).

**No blocking or high-severity findings remain open.**

## Risks

- **Only two Changes' worth of real `file_assertion`/citation data exist in this repository today**
  (none — no real Change declares `sdd` with populated requirements *and* a citing `verification.md`
  in the same Change yet) — `evidence-reference-integrity` is exercised entirely by unit/integration
  fixtures and one live scratch-Change reproduction, not yet by a real, closed Change's own artifacts.
  This mirrors Entrega 4's own "unsupported" outcome precedent (synthetic until a real producer
  exists) and is not considered a blocker.
- **`requirement-has-traceability` will report `failed` for every requirement in every real Change
  closed before this session's `verification.md` convention existed**, if `--requirements` is ever
  run against them — an honest, expected consequence of the rule's own design (never inferring
  citation where none exists), not a defect; explicitly why `close()` integration remains deferred
  (see design.md §10).
- Naming/exposure (whether a future Entrega promotes `--requirements` to a default-on behavior, or
  Review consumes its output automatically) is deferred to Entrega 8, per the user's instruction.

## Recommendations

- When Entrega 8 (Review) is designed, reuse `evaluateRequirements()`'s/
  `aggregateVerificationResult()`'s existing, already-structured output (`requirementResults` +
  overall status) as Review's input verbatim — no field in either shape was added speculatively;
  all of it was justified against this Entrega's own two rules.
- If a future rule ever needs `manual_attestation` as one signal among several, the enforcement added
  in Finding 2 already supports "mixed evidence, some attestation, some deterministic" correctly
  (tested) — only "attestation alone" is rejected.
- Any future Context Builder (for a hypothetical Entrega 8 need) should default to the non-fetching
  pattern from the start, given this is the second Entrega in a row (after Hooks) where a
  fetching-by-default design was the wrong call once a real "the caller already computed this" case
  existed.

## Artifacts Produced

- `cli/src/core/domain/verification-rule.js` (new)
- `cli/src/verification-rules/index.js`, `cli/src/verification-rules/requirement-has-traceability.js`,
  `cli/src/verification-rules/evidence-reference-integrity.js` (new)
- `cli/src/core/services/verification-context.js`, `cli/src/core/services/verification-evidence.js`,
  `cli/src/core/services/verification-service.js` (new)
- `cli/tests/verification-rule-model.test.js`, `cli/tests/verification-registry.test.js`,
  `cli/tests/verification-context.test.js`, `cli/tests/verification-evidence.test.js`,
  `cli/tests/verification-service.test.js` (new, 87 tests)
- `cli/tests/cli.test.js` (extended: 10 new tests)
- `cli/src/cli.js` (extended: `verify()`'s `--requirements` handling, `runRequirementVerification()`;
  `runVerifyCompletedHooks()` signature updated to accept the shared `inspection`, no behavior change)
- `cli/package.json` (test script includes the five new Verification test files)
- `knowledge/decisions.md` (ADR-021: `Accepted`)
- `docs/architecture.md`, `docs/domain-model.md` (documentation)
- `changes/0049-core3-verification-engine/{change.md,spec.md,tasks.md,verification.md,evidence.md}`
  (this Change's own artifacts, updated to reflect execution)

## Lessons Learned

- This is the second consecutive Entrega (after Hooks) where a Context Builder's first implementation
  fetched its own facts instead of reusing the caller's already-computed values, even though the
  design document explicitly called for reuse and cited the exact precedent. Writing the requirement
  down did not prevent the bug — only the adversarial review's *structural* re-reading (checking the
  actual call graph, not just re-running tests, which passed the whole time since `explain()` is
  pure) caught it. Worth treating "does this Context Builder's implementation match its own stated
  non-fetching design" as an explicit, first-class adversarial review question for any future
  Context Builder, not an assumption safe to skip once the design doc says the right thing.
- The `manual_attestation`-alone gap is the same *shape* of issue Entrega 6 found twice (trusting a
  value without verifying its authority) — this time in the "evidence composition" dimension rather
  than "status string" or "shared mutable reference." Confirms this is a recurring, systemic pattern
  worth checking explicitly in every future Service-layer review: not just "can a caller spoof a
  status," but "can a caller satisfy a requirement's *letter* (some evidence exists) while violating
  its *intent* (that evidence must be verifiable)."

## Next Change

Entrega 8 (Review) is explicitly out of scope for this Change, per the user's instruction. This
Change closes here; Entrega 8 planning begins as a separate, later conversation/Change.
