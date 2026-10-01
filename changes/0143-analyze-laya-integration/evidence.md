# Evidence

## Summary

This Analysis Change evaluated the architectural, technical, and operational integration of Laya (non-autoregressive System 1 decision engine) into AIEF.

Laya's stated design (local-first, no API keys, fast typed decisions) is aligned with AIEF's philosophy. To preserve AIEF's zero-runtime-dependency CLI (`@aief/cli`, Node.js >= 22) and its "never calls the network on your behalf" principle, Laya may only be integrated **outside the engine**: as an AIEF Skill / MCP tool used by assistants, or as a standalone example script. No surface inside `cli/` (commands, requirement providers, verify/close) is recommended.

## Claim Provenance

Legend: `[H]` verified fact, `[I]` inference, `[S]` assumption.

| Claim | Kind | Source |
| --- | --- | --- |
| `@aief/cli` has zero runtime dependencies, `engines.node >= 22` | [H] | `cli/package.json` |
| Tracks are `lite`, `standard`, `governed` | [H] | `cli/src/core/domain/workflow-definition.js` (`KNOWN_TRACKS`) |
| Change type is free-form (`--type`, default `general`); only `definition` is interpreted by the engine; `analysis` is a governance convention | [H] | `cli/src/commands/new-change.js`, `cli/src/core/services/change-verifier.js`, `docs/history/governance-conventions.md` §9 |
| Engine code never calls the network on the user's behalf | [H] | `docs/architecture.md` (Architectural principles); `cli/src/requirement-providers/jira.js` header |
| Laya single-pass latency ~30 ms | [S] | Not measured or cited in this Change |
| Laya checkpoints (`ModernBERT-large`, `mmBERT-base`), ~1.5 GB RAM for all three preloaded | [S] | Not measured or cited in this Change |
| Runtimes `laya-serve` (FastAPI), `laya-ts` (ONNX), `laya[mcp]`; `Router(preload=false)`; `LAYA_REVISION`; RLCD calibration | [S] | Not verified against an upstream release in this Change |
| Loading an ONNX model per CLI invocation adds 500 ms–2 s | [I] | General ONNX Runtime behavior; not measured for Laya |

Every `[S]` row is a prerequisite to verify (C0143-F6) before any follow-up Change depends on it.

## Activities Performed

1. **AIEF Invariants & Architecture Audit:** Read `docs/architecture.md`, `AGENTS.md`, `cli/package.json`, `cli/src/requirement-providers/`, and `workflow-definition.js` to confirm the constraints listed as `[H]` above.
2. **Laya Capabilities Review:** Summarized Laya's described decision model, checkpoints, and runtimes. These claims were not checked against a pinned upstream release (see Claim Provenance).
3. **Integration Surfaces Comparison:** Compared three candidate touchpoints (table below).
4. **Runtime Patterns Comparison:** Compared three deployment patterns (table below).
5. **Decision Schema Specification:** Mapped AIEF governance concepts to Laya's typed questions (`choice`, `score`, `noul`) using AIEF's actual vocabulary.
6. **Findings & Risk Assessment:** Recorded six findings and a living Findings Status table.

## Integration Surfaces Comparison (R2)

| Surface | Where it runs | Invariant fit | Verdict |
| --- | --- | --- | --- |
| S1 — Requirement triage in `aief enrich` / `propose` | Inside the engine | Violates "engine never calls the network" (even `127.0.0.1`) or, in-process, the zero-dependency rule | **Rejected** inside the engine. Allowed only as an external script whose output a human pastes or edits into the Change |
| S2 — Assistant decision tool (AIEF Skill / MCP) | Assistant environment | Fits: AIEF stays unchanged; the assistant calls Laya; results land in files a human reviews | **Recommended** |
| S3 — Semantic pre-linter of `evidence.md` vs. acceptance criteria | Before `verify` / `close` | A confidence score over "evidence satisfies criteria" is effectively an approval signal; risks eroding `(human)` / `(review)` gates | **Rejected** as a gate or verify rule. At most an assistant-side hint that never writes checkboxes or affects `verify` / `close` |

## Runtime Patterns Comparison (R3)

| Pattern | Coupling | Pros | Cons | Verdict |
| --- | --- | --- | --- | --- |
| A — Standalone `laya` CLI via subprocess from an opt-in script | Loose | No change to `@aief/cli`; easy to omit | Python/uv prerequisite; cold start per call [I] | **Accepted** for the example script |
| B — `laya-serve` local HTTP daemon | Loose | Warm model; reusable by Skill / MCP | Extra daemon; must never be called from engine code | **Accepted** only from assistant / script side |
| C — In-process `laya-ts` + `onnxruntime-node` in `@aief/cli` | Tight | Single process | Native binaries per platform (glibc / musl / macOS); breaks zero-dependency rule; large install | **Rejected** |

## Findings

### C0143-F1 — Preservation of CLI runtime independence
`@aief/cli` has zero runtime dependencies. Bundling `onnxruntime-node` or a Python bridge would add platform-specific native binaries and break lightweight installs.
- **Proposed resolution:** Keep Laya out of `cli/`. Integrate only via an AIEF Skill / MCP tool (S2) and a standalone example script (Pattern A/B). No requirement-provider adapter.

### C0143-F2 — Strict enforcement of "AI assists. Humans decide"
Laya outputs calibrated choices, scores, and probabilities that could be mistaken for approvals, e.g. checking a `(human)` or `(gate:*)` task or closing a Change.
- **Proposed resolution:** The Skill must state that Laya output only proposes values for `change.md` / `spec.md` / `manifest.json`, which a human confirms. It must never check `(human)`, `(review)`, or `(gate:*)` tasks or run `aief close`. Today nothing enforces this; the follow-up Change must encode it in the Skill text.

### C0143-F3 — Memory and cold-start latency
Preloading all checkpoints reportedly uses ~1.5 GB RAM [S]. Loading a model per invocation adds latency [I].
- **Proposed resolution:** Document in the Skill: prefer a warm `laya-serve` daemon or lazy loading / quantized models. Measure before relying on the numbers.

### C0143-F4 — Governance vocabulary calibration
AIEF-specific distinctions (e.g. `standard` vs. `governed` track, `definition` vs. `general` Change) are unlikely to be reliable zero-shot.
- **Proposed resolution:** Explicit criteria in question definitions (schema below). A calibration dataset is a later, separate Change.

### C0143-F5 — In-engine surfaces conflict with the no-network principle
S1 (triage inside `enrich` / `propose`) and any requirement-provider adapter calling `laya-serve` over `fetch()` would make engine code call the network on the user's behalf, which `docs/architecture.md` forbids. The existing Jira provider is deliberately network-free.
- **Proposed resolution:** Reject in-engine surfaces (see comparison table). Changing this would require an ADR that amends the architectural principle, not an implementation Change.

### C0143-F6 — Laya capability claims are unverified
Latency, memory, checkpoints, runtime package names, and configuration knobs were not checked against a pinned upstream release or measured.
- **Proposed resolution:** The follow-up Change's first task verifies each `[S]` claim against a pinned Laya revision (URL plus version) and records the result before writing the Skill.

## Findings Status

| Finding | Severity | Status | Resolved By | Notes |
| --- | --- | --- | --- | --- |
| C0143-F1 | High | Open | — | Proposed: `0144-laya-triage-skill` (Skill plus example script outside `cli/`). |
| C0143-F2 | High | Open | — | Proposed: `0144`. Guardrail wording in the Skill; not enforced anywhere today. |
| C0143-F3 | Medium | Open | — | Proposed: `0144`, deployment guidance after measurement. |
| C0143-F4 | Low | Open | — | Criteria in the schema below; calibration dataset deferred to a later Change. |
| C0143-F5 | High | Open | — | Proposed: `0144` scope excludes `cli/`; any reversal needs an ADR. |
| C0143-F6 | Medium | Open | — | Proposed: first task of `0144`. |

## Decision Schema Mapping (R4)

Uses AIEF's actual vocabulary: Change types as used in `changes/*/change.md`, tracks from `KNOWN_TRACKS`.

```json
{
  "change_type": {
    "type": "choice",
    "instructions": "Which AIEF Change type fits this requirement?",
    "criteria": {
      "general": "implementation of a feature, enhancement, or refactor in existing code",
      "fix": "bug fix, regression correction, or defect repair",
      "analysis": "investigation or assessment producing findings, no production code",
      "definition": "requirements, architecture, or data definition for a project without implemented application code",
      "documentation": "documentation-only change with no runtime behavior change"
    }
  },
  "governance_track": {
    "type": "choice",
    "instructions": "What governance track is required for this change?",
    "criteria": {
      "lite": "minor non-breaking fix, documentation, or low-risk chore",
      "standard": "typical feature, refactor, or multi-step enhancement",
      "governed": "architecture change, security-sensitive code, or public API breaking change"
    }
  },
  "security_sensitive": {
    "type": "noul",
    "instructions": "Does this requirement touch authentication, cryptography, secrets, permissions, or network boundaries?"
  },
  "requirement_clarity": {
    "type": "score",
    "instructions": "How complete and clear is the requirement description?",
    "criteria": ["vague or missing details", "partially specified", "fully actionable and clear"]
  },
  "evidence_has_real_test_output": {
    "type": "noul",
    "instructions": "Does this evidence.md contain literal output from a test or verification command (not just a claim that tests passed)?",
    "note": "Assistant-side hint only (see S3). Never a gate, verify rule, or checkbox writer."
  }
}
```

All values are proposals for a human to confirm. `track` is an optional `manifest.json` field and `change_type` lives in `change.md` (`## Type`). Neither is auto-written.

## Verification

```bash
node cli/bin/aief.js verify --change 0143-analyze-laya-integration
# Result: PASS (structural validation and required artifacts complete)

node cli/bin/aief.js verify --change 0143-analyze-laya-integration --strict
# Result: PASS (all tasks complete and human approval signed off)

node cli/bin/aief.js close --yes --change 0143-analyze-laya-integration
# Result: Closed (2026-10-01)
```

Structural and strict verification pass with zero errors.

## Risks

1. **Environmental divergence:** not every developer will have Python/uv or a running `laya-serve`.
   - *Mitigation:* Laya stays an optional accelerator; the Skill falls back to manual classification when Laya is absent.
2. **Model version drift:** checkpoint updates can shift classifications.
   - *Mitigation:* pin an exact upstream revision and checksum in the Skill / script.
3. **Unverified third-party tool:** adopting an external tool on unverified claims (C0143-F6).
   - *Mitigation:* verification task first in `0144`; consider an ADR if the Skill ships to user projects (via `skills-catalog.json`, ADR-010) rather than only this repository.

## Recommendations

1. Implement an assistant-facing AIEF Skill (`.agents/skills/laya/SKILL.md`) carrying the F2 guardrails and the schema above.
2. Provide a standalone example script (e.g. `examples/laya-triage.*`) that prints proposed metadata for a human to apply. It does not write `(human)` / `(gate:*)` state or call `aief close`.
3. Do **not** add ML dependencies, network calls, providers, or verify rules for Laya in `cli/`.
4. Decide in `0144` whether the Skill is repository-internal or distributed to AIEF users. Distribution likely warrants an ADR.

## Artifacts Produced

- `changes/0143-analyze-laya-integration/change.md`
- `changes/0143-analyze-laya-integration/spec.md`
- `changes/0143-analyze-laya-integration/tasks.md`
- `changes/0143-analyze-laya-integration/evidence.md`

## Lessons Learned

- Laya's fast typed proposals ("System 1") complement AIEF's deliberate governance ("System 2") only when they stay outside the engine and below the human gates.
- An analysis of a third-party tool must separate verified facts from vendor claims. Without that, a finding's severity cannot be trusted.

## Next Change

Propose `0144-laya-triage-skill`: verify Laya claims at a pinned revision (F6), then add the assistant Skill and an example script outside `cli/` (F1, F2, F3, F5).
