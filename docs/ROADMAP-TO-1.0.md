# AIEF Roadmap to 1.0

The **frozen** minimum roadmap to 1.0. One theme — **Workflow Cohesion** — and exactly four workstreams. Everything else is explicitly deferred.

This roadmap is evidence-based: every workstream traces to a finding in [docs/VALIDATION-SUMMARY.md](VALIDATION-SUMMARY.md). The 1.0 gate is defined in [docs/AIEF-1.0-READINESS.md](AIEF-1.0-READINESS.md).

---

## Theme: Workflow Cohesion

Both validations returned the same verdict: **the parts are strong; the seams are weak.** The path to 1.0 is making the validated capabilities hand off to each other — not adding features.

## Workstreams (the only work that gates 1.0)

### 1. Unified Change identity
- **Problem:** disconnected change stores, silently created duplicate Changes, confusing active-Change selection.
- **Target:** one canonical Change ID and one store; duplicate creation refused (overridable, logged); `aief status` names the active Change unambiguously; OpenSpec artifacts attach inside the Change directory rather than a parallel store.

### 2. Context flow (analyze → Change → prompt)
- **Problem:** context detected by `analyze` does not reach `new-change` or `prompt`; scaffolds arrive empty.
- **Target:** detected context is a first-class, visible input; `new-change` seeds from it; `prompt` names the detected stack; staleness is labeled honestly with a refresh path. No hidden state.

### 3. Prompt reality consistency
- **Problem:** prompts reference artifacts `doctor` knows are missing (e.g. `AGENTS.md`); execution requires manual copy/paste.
- **Target:** the prompt renders only artifacts `doctor` confirms exist, with honest fallback text otherwise; at least one assistant adapter consumes the prompt without manual clipboard work. No assistant-specific business logic in the engine.

### 4. Closability / verify contract
- **Problem:** no machine gate for evidence completeness, scope containment, or reconciliation of inferred risks against repository evidence.
- **Target:** a declarative evidence contract per Change; `verify` reports completeness, files-touched-vs-scope, and open unreconciled risks; `close` refuses (overridable, logged) when the contract is unmet. Human approval stays the final gate.

---

## Explicitly deferred

Not part of the road to 1.0. None will be pulled forward without validated demand ([ADR-008](../knowledge/decisions.md)):

- **Operational Profiles** (full implementation) — accepted as [ADR-012](../knowledge/decisions.md); standards + Skills compensate for most of the gap today.
- **Full SpecBoot live integration** — remove stale template residue when convenient, but the live-provider integration waits.
- **MCP server.**
- **VS Code extension.**
- **GitHub Action.**
- **npm publication** (`npx` bootstrap without cloning).
- **Assistant-native execution automation** (autonomous / push-based assistant integration).

---

## Definition of Done

The milestone is done when all four workstreams are implemented and closed, and both validations are re-run with no manual seam-bridging — see the full [Definition of Done for 1.0](AIEF-1.0-READINESS.md#definition-of-done-for-10). Until then, AIEF remains a pre-1.0 internal pilot.
