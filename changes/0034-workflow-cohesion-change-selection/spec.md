# Specification

## Goal

With any number of open Changes, every AIEF command that operates on a Change resolves its target through one shared, deterministic rule — implicitly only when exactly one Change is open, explicitly (via `--change`) otherwise — so no command ever silently acts on the wrong Change.

## Requirements

- **Shared resolver** (`matchChanges(selector, dirs)` in `core/domain/change.js`): deterministic tiers — (1) exact basename, (2) exact numeric ID (`0002` or `2`), (3) substring of the basename; returns all matches in the first non-empty tier. Callers decide zero → not-found, many → ambiguous.
- **cli.js selection helpers**: `resolveExplicitChange(selector)` (loud on no-match and on ambiguity, exit code 1, lists candidates) and `resolveImplicitChange(example)` (exactly one open → that Change; zero → "No open Change"; many → error listing candidates and the `--change` form). Both used by every Change-operating command; `isClosed`/`openChangeDirs` remain file-derived (ADR-009 — no state file).
- **`prompt`**: `--change` resolves explicitly; otherwise implicit; with >1 open and no `--change`, refuses and points to `status`; composes only the selected Change.
- **`close`**: same selection; requires unambiguous target; shows it; preserves readiness checks (`checkChangeReadiness`) and `--yes`; never closes implicitly with >1 open.
- **`verify`**: whole-project by default; `--change <id>` verifies one Change via `verifyChange`, prints `Verified Change: <name>`; same rule set as project verify; multi-open "Next:" hint stops naming a single active Change.
- **`propose --change`**: uses the shared resolver (no "last match wins").
- **`status`**: lists all open Changes; if >1, prints a "Multiple Changes in progress" note and `--change` next-steps; presents none as active.
- **Hints**: `new-change`, `analyze`, `enrich` next-step hints name their target Change explicitly.
- **Docs**: `docs/cli.md`, `docs/Workflow.md`, `README.md` and the adoption tasks note replace "latest open is automatically active" with explicit-selection wording.
- **Backward compatibility**: single-open repos keep implicit ergonomics; existing Change directories unaffected; no output-format change beyond the new multi-open messaging.

## Acceptance Criteria

- [x] `matchChanges` unit-tested: exact-name / numeric-id / substring tiers, exact-over-substring precedence, unknown/empty → empty.
- [x] Scenario 1 — zero open: `prompt`/`close` report "No open Change".
- [x] Scenario 2 — one open: `prompt`/`close` target it implicitly.
- [x] Scenario 3 — two open: `prompt`/`close` refuse implicit selection, list candidates.
- [x] Scenario 4 — selection by numeric id works.
- [x] Scenario 5 — selection by slug fragment works.
- [x] Scenario 6 — non-existent id fails with candidate list.
- [x] Scenario 7 — ambiguous selector fails, lists candidates.
- [x] Scenario 8 — `prompt` with multiple open composes only the selected Change.
- [x] Scenario 9 — `verify --change` checks and names exactly one; whole-project `verify` lists all.
- [x] Scenario 10 — `close` with multiple open requires `--change`, then closes only it.
- [x] Scenario 11 — no mutating command silently selects the latest open Change; `status` labels none "active".
- [x] Scenario 12 — single-open repos keep classic ergonomics end to end.
- [x] Root + CLI `npm test` green; example tests green; `aief verify` PASS.
