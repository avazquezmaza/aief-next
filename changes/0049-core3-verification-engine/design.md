# Design — Entrega 7: Verification Engine

## 1. Current architecture, confirmed by inspection

`change-verifier.js` (143 lines, fully re-read this session) is 100% Structural Verification:

```text
checkChangeReadiness(change) -> problems[]     (missing/empty files, status, evidence
                                                 classification, open task count — used by
                                                 close()'s dry-run AND verifyProject/verifyChange)
verifyProject({...}) -> VerificationReport      (whole-project structural render)
verifyChange(change, cwd) -> VerificationReport (single-Change structural render)
```

`VerificationReport` (`verification-report.js`) is `{lines, errors, warnings, passed, next}` — one
boolean `passed`, flipped by any `"error"`-level line. No concept of a requirement exists anywhere in
this file. `evidence.md` is classified by `classifyEvidence()` (`change.js`) — a whole-document
heuristic (ratio of "Pending." markers to substantive lines), never structured, never per-requirement.

`sdd-model.js`'s `Requirement` is `{id, title, text, source}`; `Task.requirements` is **always `[]`**
(SDD-R21: "no Change in this repository links a task to a requirement id in any machine-checkable
way"). This is the load-bearing inspection finding for this entire Entrega: any rule assuming a
requirement↔task/test link would be inventing a convention with zero existing adoption.

**The one real, existing citation pattern**: every `verification.md` this session produced (Entregas
2–6) contains a scenario table citing `spec.md` requirement ids in a middle column (e.g.
`| 16 | ... | HK-R11 | ... |`). Grep-confirmed present, consistently, across Changes 0044–0048's own
`verification.md` files. This proves *consideration*, not *compliance* — the exact distinction VR-R
requirements must preserve.

`verify()`'s call sites (`cli.js`): `main()`'s dispatcher; `runVerifyCompletedHooks()` (Entrega 6,
reads only `report`/`report.passed`); `close()` does **not** call `verify()` — it calls
`checkChangeReadiness()` directly (confirmed by re-reading `close()`, `cli.js:806-830` — zero
`verify`-related calls).

## 2. Evidence Model — six types, justified individually

| Type | Structure | Source | Confidence | Deterministic? | Staleness risk | Forgeable? | Sufficient alone? | Decision |
|---|---|---|---|---|---|---|---|---|
| `artifact_state` | `{type, ref: sddArtifactKey, source: "sdd", confidence: "deterministic"}` | SDD Provider's own `readiness.artifacts`/`getArtifacts()` (Entrega 3) | High — same state model `verify`/Skills already trust | Yes | Same as the SDD Provider's own (already accepted) staleness | No more than any file read is | Yes, for the narrow claim "this artifact is in state X" | **SUPPORTED** |
| `file_assertion` | `{type, ref: relativePath, source: "verification.md"\|explicit, confidence: "deterministic"}` | A path, resolved and containment-checked (reuses Change 0045's `isPathWithin()`) | High for the narrow claim "this path exists/is non-empty" | Yes | Same as any direct file read | No more than SDD artifact reads are | Yes, narrowly | **SUPPORTED** |
| `test` | `{type, ref: testId, source, confidence: "unverifiable"}` | Would need a requirement→test id convention | N/A — no such convention exists (SDD-R21-equivalent finding, restated for tests) | N/A | N/A | Trivially — nothing validates the claimed link is real | No | **DEFINED, UNSUPPORTED** (forward-compatible slot only) |
| `manual_attestation` | `{type, ref: null, source: "human", confidence: "unverifiable"}` | A human's own claim in prose | Zero — nothing about it is checkable by this engine | No | N/A | Trivially | **Never alone** | **DEFINED, informational only** |
| `command_result` | would require executing a command | N/A | N/A | Requires execution | N/A | N/A | N/A | **REJECTED** (Model C) |
| `external_reference` | would require network access to resolve | N/A | N/A | Requires network | N/A | N/A | N/A | **REJECTED** (network) |

**Why `manual_attestation` is kept at all, not simply excluded**: a rule that ignores a human's own
recorded claim entirely would be less honest than one that records it as a `warnings` entry — the
commissioning instruction's own framing ("si es solo informativo") is satisfied by recording it,
capped from ever contributing to `passed` by the Verification Service itself (VR-R7), not by a rule's
own discipline.

## 3. Architecture

```text
CLI verify (aief verify --requirements)
        ↓
Structural Verification (change-verifier.js, UNCHANGED, runs first, always)
        ↓
Verification Context (cli/src/core/services/verification-context.js)
  reuses workflow-service.js's explain() (already called once by verify() since Entrega 6)
  + ONE new read: verification.md (fixed filename, already-trusted changeDir)
        ↓
Verification Service (cli/src/core/services/verification-service.js)
  evaluateRequirements(context) -> Aggregated Verification Result
        ↓
Verification Registry (cli/src/verification-rules/index.js)  -- mirrors requirement-providers/
        sdd-providers/skills/hooks exactly
        ↓
Applicable Rules (per requirement, per rule, deterministic order)
        ↓
Per-Requirement Results  (never mutate the SDD Provider's own Requirement objects)
        ↓
Aggregated Verification Result  (PASS | FAIL | INCOMPLETE | INVALID | ERROR)
        ↓
CLI Renderer (additive, after the legacy structural report)  /  future Review (Entrega 8, not built)
```

No Verification Rule imports `cli.js`, a Skill module, a Hook module, or the Workflow Engine's own
gate/transition files directly. The Verification Service is the only caller of anything beyond a
rule's own pure `evaluate()`.

## 4. Verification Context — reuse, plus exactly one new read

```js
// cli/src/core/services/verification-context.js
export function buildVerificationContext(changeDir, cwd, operation) {
  const { change, workflow, sdd } = explain(changeDir, cwd); // workflow-service.js, Entrega 4 — the
                                                              // SAME call verify() already makes
                                                              // (Entrega 6, for the Post-Verify Hook)
  const requirements = sdd?.requirements || [];
  const tasks = sdd?.tasks || [];
  const verificationDoc = readVerificationDoc(changeDir);    // the ONE new read this Entrega adds —
                                                              // fixed filename, already-trusted dir
  return Object.freeze({ project: detectProject(cwd), change, workflow, sdd, requirements, tasks, verificationDoc, operation });
}
```

`readVerificationDoc(changeDir)` reads `path.join(changeDir, "verification.md")` — the same fixed,
non-user-controlled filename pattern `change.md`/`spec.md`/`evidence.md` already use; a missing file
is `null`, never an error (most real Changes in this repository predate this session's own
`verification.md` convention). This is the **one** new filesystem read this Entrega introduces,
scoped to Verification Context only — `prompt()`/`verify()`'s existing `explainWorkflow()` call is
reused unchanged for everything else, so `--requirements` triggers zero additional `explain()` calls
(VR-R45).

## 5. VerifiableRequirement — a wrapper, not a mutation

```js
{ requirement: { id, title, text, source }, // SDD Provider's own object, Entrega 3, UNCHANGED
  evidenceRefs: [ /* Evidence items resolved for this requirement */ ],
  ruleResults: [ /* one per applicable rule */ ] }
```

Resolving `evidenceRefs` for a requirement: (1) `artifact_state` entries come directly from
`context.sdd.readiness.artifacts` (no per-requirement linkage needed — a Change either has SDD
artifacts in a given state or it doesn't); (2) `file_assertion`/citation-shaped evidence comes from
scanning `context.verificationDoc`'s scenario-table rows for the requirement's own `id` string
(VR-R22's real, existing pattern) — a plain, deterministic string/table-row match, never a heuristic
Markdown-intent parser.

## 6. Initial rules

### 6.1 `requirement-has-traceability`

- **Scope**: `"requirement"`. **Applies to**: any requirement whose Change has a resolvable
  `verificationDoc` (not `null`) — a Change with no `verification.md` at all gets `not_applicable`
  for every requirement (honest: the citation mechanism this rule checks doesn't exist for that
  Change, not a failure of the requirement itself).
- **Evaluates**: does the requirement's own `id` appear as a cited requirement-id token in
  `verificationDoc`'s scenario table? `passed` if yes; `failed` if the document exists but the id is
  never cited (a real, actionable gap — a requirement no verification scenario ever claimed to
  cover).
- **Never claims**: that the requirement was *satisfied* — `summary` text explicitly states
  "cited in verification planning," never "implemented," "correct," or "complete."

### 6.2 `evidence-reference-integrity`

- **Scope**: `"requirement"`. **Applies to**: any requirement with at least one resolved
  `file_assertion`-typed evidence reference (from `evidenceRefs`, §5).
- **Evaluates**: for each such reference, resolve the path relative to the Change directory, reject
  traversal (`isPathWithin()`, reused from Change 0045), and report the real filesystem state
  (present/missing/empty/read_error, reusing `sdd-model.js`'s own `readArtifactFile()` — not a
  second, diverging file-state reader). `passed` if every reference resolves safely and to a present,
  non-empty state; `failed` if a reference resolves safely but the target is missing/empty;
  `invalid` if a reference attempts traversal or resolves outside the Change/project boundary.
- **Security role**: this is the rule this Entrega's own threat model requires being exercised by a
  real implementation, not just documented (§11).
- **No requirement has `file_assertion` evidence today** (no existing Change declares one) — this
  rule is exercised entirely by synthetic fixtures in its own unit tests until a real Change adopts
  the convention, the same "no live producer yet" precedent Entrega 4 used for the Normalized
  Action's own `unsupported` outcome.

### 6.3 Considered and not included

See `proposal.md`'s "Initial rules" section for `requirement-has-test-evidence` (no reliable
requirement↔test link exists — the `test` evidence type's own DEFINED-UNSUPPORTED status),
`verification-scenario-covered` (would duplicate `requirement-has-traceability` without new value),
and `artifact-presence` (duplicates Structural Verification's own `missing`/`empty` checks and
`artifact_state` evidence).

## 7. Verification Rule contract

```js
// cli/src/verification-rules/requirement-has-traceability.js (concrete, not the sketch)
export const id = "requirement-has-traceability";
export const version = "1.0.0";
export const title = "Requirement Has Traceability";
export const description = "Checks whether a requirement's id is cited in the Change's verification.md scenario table.";
export const scope = "requirement";
export const capabilities = Object.freeze({
  readContext: true, readArtifacts: false, readEvidence: true,
  executeCommands: false, writeFiles: false, network: false, assistantRequired: false
});
export function appliesTo(context, requirement) {
  return context.verificationDoc ? { applicable: true } : { applicable: false, status: "not_applicable", reason: "no verification.md for this Change" };
}
export function evaluate(context, requirement, evidence) { /* returns {status, summary, findings?, evidence?, missingEvidence?, warnings?} */ }
```

Every field/method justified against the two shipped rules — not adopted from the sketch verbatim:

| Field/method | Justification | Change from the sketch |
|---|---|---|
| `id`, `version`, `title`, `description` | Same as every prior Entrega's registry entry | Kept |
| `scope` | VR-R12 — distinguishes "evaluated once per requirement" (both rules this Entrega) from a future "evaluated once per Change" rule; **new** relative to Skills/Hooks, since neither of those has a per-item iteration concept | Added — not in the sketch |
| `capabilities` | VR-R13/R14/R15 — the entire capability-gating model depends on this; expanded to the seven-flag list (§8) below, canonical rather than ad hoc | Kept, expanded |
| `appliesTo(context, requirement)` | VR-R26/R29/R30 — same discipline as Skills'/Hooks' `appliesTo`, with `requirement` added since a rule's applicability can depend on which requirement is being checked | Kept, `requirement` parameter added |
| `evaluate(context, requirement, evidence)` | The one method every rule this Entrega implements — pure, receives the requirement's own already-resolved `evidenceRefs` (§5) as its third argument, mirrors Hooks' own `skillResults`-as-third-argument pattern (pre-resolved, never fetched by the rule itself) | Kept, `evidence` parameter added, pre-resolved by the Service (never fetched by the rule) |
| `priority` (sketch, implied) | **Dropped** — same reasoning as HK-R19: no real tie-breaking case exists among two rules; alphabetical `id` order only | Not adopted |

## 8. Capabilities

Seven explicit boolean flags, all default-`false`:

```text
readContext        -- may read context.change/workflow/sdd/requirements/tasks (both rules: true)
readArtifacts       -- may consult context.sdd's artifact states (evidence-reference-integrity: true)
readEvidence        -- may consult context.verificationDoc / resolved evidenceRefs (both rules: true)
executeCommands      -- VR-R14: registry rejects true, unconditionally
writeFiles           -- VR-R14: registry rejects true, unconditionally
network               -- VR-R14: registry rejects true, unconditionally
assistantRequired      -- VR-R15: registry rejects true, unconditionally (AI-free by design)
```

`readContext`/`readArtifacts`/`readEvidence` are split (not a single "read" flag) because the two
shipped rules genuinely differ: `requirement-has-traceability` never touches `context.sdd`'s artifact
states (`readArtifacts: false`), `evidence-reference-integrity` does. Splitting lets the Service
enforce "you didn't declare this, so your result claiming it is stripped" per-field, the same
discipline `emitWarning`/`emitInstruction` already model for Hooks.

## 9. Workflow relationship — evaluated, deferred

No `"verification"` gate id is added to `gate-evaluator.js`'s `KNOWN_GATE_IDS`, and none of the three
workflow definition JSONs (`lite.json`/`standard.json`/`governed.json`) are touched — zero diff lines
in any Workflow Engine file. This is a stronger deferral than Entrega 3's own `specification` gate
(which *was* added to `KNOWN_GATE_IDS`, inert but present) — no evidence yet justifies even preparing
the slot, since no track's stages reference it and no consumer needs it prepared. **Falsifiable
condition for introducing it**: a future Entrega with a concrete, reviewed design for how a
Workflow stage should react to an `INCOMPLETE`/`FAIL` Requirement Verification result — not merely
"the vision document expects a `verification` gate eventually."

## 10. `close()` relationship — evaluated, deferred

Same reasoning as Entrega 6's `close.requested` deferral, restated for Requirement Verification:
`close()` is the one write-critical command; wiring Requirement Verification into its readiness check
would change the trust profile of that command for a capability that has shipped exactly two rules,
neither of which has any real Change to evaluate against yet (no Change in this repository declares
`file_assertion` evidence, and `requirement-has-traceability` would report `failed` for every
requirement not yet cited in `verification.md` — a real, honest finding, but not one that should
suddenly block real Changes' `close()` without a separate, explicit decision). `close()`,
`markClosed()`, `checkChangeReadiness()` gain zero diff lines.

## 11. Security — threat model

| Threat | Mitigation |
|---|---|
| Requirement id manipulated | Static-array lookup only (VR-R55), mirrors SK-R35/HK-R43 |
| Rule id manipulated | Same mechanism, registry-level |
| Path traversal (evidence reference) | Reuses Change 0045's `isPathWithin()` fix, unchanged, exercised by `evidence-reference-integrity` (VR-R52) |
| Symlink escape | Not expanded — the one new read (`verification.md`) uses a fixed filename with no user-controlled component; `file_assertion` reuses the SDD Provider's own existing (already-accepted) read path, not a new one (VR-R53) |
| Evidence reference outside the project | Rejected, same mechanism as traversal — `invalid` status, never silently ignored |
| Evidence falsified / test results invented | Structurally limited: only `artifact_state`/`file_assertion` are SUPPORTED, and both are derived from a real filesystem/provider read at evaluation time, not from a caller-supplied claim; `test`/`command_result` (the two types a caller could most easily fabricate a false positive from) are UNSUPPORTED/REJECTED |
| Hostile repository content / prompt injection | `verificationDoc`/requirement text reaching a rule's output is treated as data (VR-R54) — a rule's `summary`/`findings` never echo raw content as if it were a directive to the engine |
| Invalid descriptor | Rejected at registry-construction time (VR-R19) |
| Capability escalation | `writeFiles`/`executeCommands`/`network`/`assistantRequired` cannot be registered `true` (VR-R14/R15) |
| Rule mutates context/requirement/evidence | All three frozen before being handed to a rule; mutation throws, caught, `status: "error"` for that rule only (VR-R17) |
| Rule returns `passed` without evidence | Structurally prevented: `evaluate()`'s return is validated against `missingEvidence`/`evidence` by the Service before `passed` is honored (VR-R6/R30) |
| Rule alters `requirement` | The `Requirement` object passed to a rule is the same frozen object every other rule receives; no rule's return value can replace it in the aggregated output (VR-R31) |
| Duplicates / accidental order | Rejected at registry-construction time / deterministic array order (VR-R19/R20) |
| Loops / excessive consumption | `evaluateRequirements()` iterates a fixed, finite (requirements × rules) matrix once — no recursion, no rule can invoke another rule or the Service itself |
| Enormous files / circular references | `readVerificationDoc()` reads one bounded file once; requirement/evidence resolution never follows a reference graph (no rule reads another rule's output as input) |
| Stale cache | No cache exists — `evaluateRequirements()` is a pure function computed fresh every call (VR-R40) |
| Partial data treated as complete | `missingEvidence` is always populated for anything not found; `blocked`/`INCOMPLETE` exist specifically so partial data is never silently reported as complete (VR-R6/R30/R36) |

## 12. Determinism

- Registry: array literal order (VR-R20), identical precedent to Skills/Hooks.
- Context: pure function of `(changeDir, cwd, operation)` plus one bounded file read (VR-R24) — no
  Verification Context field depends on timestamp, locale, or network.
- Aggregation: pure function of the per-requirement, per-rule result matrix (VR-R34/R40) — fixed
  precedence order, never a simple boolean reduction.

## 13. Testing strategy

- `verification-rule-model.test.js` — descriptor validation, capability rules, scope vocabulary,
  mirrors `skill-model.test.js`/`hook-model.test.js`.
- `verification-registry.test.js` — registration, duplicate/invalid rejection, forbidden-capability
  rejection, `rulesForScope()` filtering, deterministic order.
- `verification-context.test.js` — reuses `explain()`, exactly one new read, call-count assertion
  proving zero re-derivation, frozen result, `verification.md`-missing → `null` not an error.
- `verification-service.test.js` — every one of the seven per-rule statuses and five aggregate
  statuses reached by a dedicated fixture; adversarial fixture rules attempting to declare effects,
  spoof `rule`/`requirement`, claim `passed` with empty evidence, mutate frozen inputs — the same
  battery of adversarial tests that found real bugs in both Skills' and Hooks' own reviews, applied
  proactively here.
- `cli.test.js` additions — `verify --requirements` integration, byte-identical without the flag,
  zero additional `explain()` calls, `verify.completed`'s `operation.result` unchanged either way.

## 14. Compatibility and rollback

Every file this design adds is new (`cli/src/verification-rules/*.js`,
`cli/src/core/services/verification-context.js`/`verification-service.js`,
`cli/src/core/domain/verification-rule.js`, their tests) or a small additive edit to `verify()`'s
existing flow (one new flag check, one new render call after `renderReport()`). `status`/`close`/
`propose`/Skills/Hooks/WorkflowService/SDD Provider gain zero diff lines. `git diff` after
implementation must show only additive/consolidating changes.

## 15. Evolution toward Review (boundary only, not implemented)

Entrega 8 (Review) will consume the Aggregated Verification Result (per-requirement detail preserved,
VR-R37) to compose a human-readable interpretation — "here is what verification found, here is what
it means, here is what to do next." This Entrega's result shape is designed to be that input without
modification: `VerifiableRequirement.ruleResults` and the aggregate `{status, requirementResults,
warnings, errors}` are already the complete, structured record a Review composer would need. No
Review-specific field is added to any contract this Entrega defines — Review's own composition logic,
tone, and rendering remain entirely undesigned and explicitly out of scope.
