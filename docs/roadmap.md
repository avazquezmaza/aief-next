# AIEF Roadmap

Progress is tracked as Changes in [changes/](../changes/) — the repository uses its own workflow.

## Phase 1 — Foundation ✅

- Framework
- Starter Project
- Navigator
- CLI MVP
- Examples
- Profiles
- Adapters

## Phase 2 — Validation ✅

1. README 2.0 ✅ (Change 0015; consolidated in 0026)
2. CLI v2 ✅ (Changes 0012–0024: adoption engine, standards, Skills, close cycle, prompt lifecycle)
3. First public release (v0.1.0) ✅
4. Validate AIEF on existing projects ✅ (Changes 0016, 0020, 0023 — real adoptions, frictions fixed from evidence)
5. Bootstrap experience ✅ (Change 0025 — root install, `aief doctor` levels, `aief init`)

### Validation Principles (permanent)

- Do not reorganize the project.
- Adopt AIEF incrementally.
- Record every friction.
- Improve AIEF only from observed evidence ([ADR-008](../knowledge/decisions.md)).

## Phase 3 — Evolution (current)

Committed next step:

- Operational Profiles — structured reasoning model rendered by the Prompt Engine (accepted as [ADR-012](../knowledge/decisions.md); implementation Change not started).

Potential future work (each requires validated demand, per ADR-008):

- npm package (`npx` bootstrap without cloning)
- GitHub Action
- VS Code Extension
- MCP Server
- Website
