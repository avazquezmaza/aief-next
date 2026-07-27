# Change

## ID

`0043-core3-change-foundation`

## Type

General

## Objective

Implement the first delivery of the AIEF Core 3.0 evolution described in
[docs/aief-core-3-claude-code-prompt.md](../../docs/aief-core-3-claude-code-prompt.md): a
**Change Foundation** that lets a Change optionally carry a `manifest.json` alongside its
existing four Markdown files, without changing behavior for any Change that does not have one.

Started as an Analysis Change (design only); re-typed to General once the design was approved and
implementation began, 2026-07-25. Full design: [design.md](design.md). Implementation evidence:
[evidence.md](evidence.md).

## Scope

### In scope

- Domain model for a manifest-backed Change (fields, precedence over legacy inference).
- Manifest format decision (JSON vs. YAML) with justification, per repository dependency policy.
- Structural validation of `manifest.json` with actionable error messages.
- A legacy mapper: Changes without a manifest keep resolving exactly as `loadChange()` resolves
  them today (byte-identical output for every existing Change in `changes/`).
- Minimal, additive integration into `aief status` so it can read both formats — no new command,
  no change to `status`'s existing output for legacy Changes.
- Unit and integration tests for both paths.

### Out of scope

- Workflow engine, tracks, gates, transitions (Entrega 2).
- SDD Provider interface, OpenSpec/Local provider implementations (Entrega 3).
- `aief start` / `aief work` / `aief next` and any other new command surface (Entrega 4+).
- Skills schema/execution, hooks runtime (Entrega 5).
- Verification levels beyond what `change-verifier.js` already does (Entrega 6).
- Adversarial review formalization (Entrega 7).
- Close-gate changes, migration command, archival (Entrega 8).
- Any change to `changes/*/change.md|spec.md|tasks.md|evidence.md` semantics for existing Changes.

## Success Criteria

- AIEF recognizes both legacy Changes and manifest-based Changes through one unified loader.
- `aief status` works unmodified for every existing Change (regression-proven by the existing
  test suite, which must keep passing without edits).
- No existing behavior breaks: no file is renamed, no required file changes, no command surface
  changes.
- Manifest errors are actionable (field + reason), not generic parse failures.
- The ADR-013 / ADR-015 governance tension identified during analysis is surfaced explicitly for
  human decision, not resolved by implication.

## Status

Closed (2026-07-25).

Implemented, independently reviewed (verdict `changes_required` → B1 blocking and H1 high fixed
and re-verified; H2/M1/L1–L3 accepted as documented non-blocking technical debt), and closed. Full
record: [evidence.md](evidence.md), [spec.md](spec.md) "Independent review findings".
