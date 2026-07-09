# Change

## ID

`0033-evaluate-external-harness-patterns`

## Type

General

## Objective

Evaluate which patterns from two external repositories (`betta-tech/harness-sdd`, `multica-ai/andrej-karpathy-skills`) can strengthen AIEF without turning it into an agent framework and without breaking its human-gated model — producing an adopt/adapt/reject verdict per pattern, each gated on named evidence (ADR-008). Documentation only; no implementation.

## Scope

### In scope

- Read both external repos (public GitHub) and summarize what each contributes.
- Create `docs/external-harness-patterns.md` covering: what each repo brings; patterns compatible with AIEF; patterns to adapt; patterns to reject; risks of copying without validating; relationship to human-gated workflow, profiles, skills, standards, evidence, verification and governance.
- Decision table with columns: Fuente | Patrón | Adoptar | Adaptar | Rechazar | Razón | Evidencia requerida.
- Record the six expected decisions: adopt artifact-based communication; adapt roles as Profiles (not autonomous agents); adapt requirement→task→evidence traceability; adapt "think first, code second" into AGENTS/Profiles/Standards by dimension; reject agent runtime as AIEF core; reject Claude-specific dependency in core.
- This Change's own artifacts.

### Out of scope

- Any code, CLI, or test change; any folder move.
- Modifying AGENTS.md (explicitly deferred even where the evaluation recommends sharpening it later).
- Copying any file from the external repos (ADR-003 precedent: concepts, never copies).
- Introducing external dependencies.
- Implementing any "adapt" verdict — each is gated on the evidence its table row names.
- Closing this Change automatically.

## Success Criteria

- `docs/external-harness-patterns.md` exists with all required sections and the seven-column decision table.
- Every "adapt" verdict names its required evidence; every "reject" verdict names the ADR or product-identity boundary it protects.
- The six expected decisions are explicitly confirmed in the document.
- No executable file changed; `aief verify` PASS; no other document modified; AGENTS.md untouched.
