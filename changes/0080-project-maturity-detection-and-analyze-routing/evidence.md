# Evidence

## Summary

Added `classifyMaturity()` — a deterministic Definition/Implemented/Ambiguous classifier based on
file evidence (real source under recognized source directories vs. requirements/context documents
at the repository root) — and routed `aief analyze` by it. Repositories the current test suite
already exercises (implemented or ambiguous) are byte-for-byte unaffected; only a genuinely
PRD-only, code-free repository now gets a Definition Change.

## Activities Performed

- Added `cli/src/core/domain/project-maturity.js`: `classifyMaturity(rootDir)`, two independent
  file-evidence signals (implementation, definition), one precedence rule.
- Added `cli/tests/project-maturity.test.js`: 10 unit tests covering the full required maturity
  matrix (PRD-only, PRD + tooling-only metadata, real Node app, real non-Node/Python app, sparse
  ambiguous repo, an empty directory, AIEF itself, source-wins-over-rich-definition-content,
  config-file-exclusion, node_modules-exclusion).
- Rewrote `analyze()` in `cli/src/cli.js` to compute `classifyMaturity(cwd())` and route:
  `implemented` → unchanged Analysis behavior; `definition` → Definition Change (Change 0079's
  scaffold) with an explicit "Detected maturity: Definition" line and reasons; `ambiguous` →
  unchanged Analysis behavior, with an explicit ambiguity note and override guidance (documented
  decision — see change.md "Ambiguous routing decision").
- Added `--maturity` to `analyze`'s `KNOWN_FLAGS` entry; rejects an unrecognized value before any
  write.
- Added 7 CLI-level regression/behavior tests in `cli.test.js` covering the routing itself
  (Definition creation, Analysis-unchanged-with-real-source, ambiguous-fallback-with-note,
  `--maturity` override both directions, invalid `--maturity` rejection).

## Verification

- `node --test cli/tests/project-maturity.test.js` — 10/10 pass.
- `node --test --test-name-pattern="Change 0080|maturity|Definition|Analysis Change"
  cli/tests/cli.test.js` — 12/12 pass.
- `npm test` (full suite) — 860/860 pass, 0 fail (844 before this Change + 16 new).
- `node cli/bin/aief.js verify` — Result: PASS.
- `git diff --check` — clean.

## Findings

- Zero existing `analyze`-related test fixture needed to change. Every fixture the current suite
  already used (no README, or a one- to three-word README) lands in `ambiguous` under this
  classifier and keeps its original Analysis Change output plus one additional explanatory line —
  confirming the "ambiguous falls back to today's default" decision was the correct
  backward-compatibility call, not just a convenient one.

## Risks

- The 30-word / source-directory-name heuristic is coarse by design (deterministic over
  probabilistic, per the governing decision policy) — a real project that keeps its source outside
  the recognized directory names (e.g. a flat repository with `.js` files at the root and no `src/`)
  will not trigger the implementation signal and may be classified `ambiguous` or `definition`
  incorrectly. `--maturity` is the documented escape hatch. Noted as a candidate refinement if real
  usage surfaces this.

## Recommendations

- Change 0081 (Definition enrichment) can read `classifyMaturity()`'s `reasons` directly when
  seeding a Definition Change's Context section, rather than recomputing signals.

## Artifacts Produced

- `cli/src/core/domain/project-maturity.js`
- `cli/src/cli.js`: `analyze()` rewrite, `--maturity` flag.
- `cli/tests/project-maturity.test.js` (new), `cli/tests/cli.test.js` (+7 tests).
- `changes/0080-project-maturity-detection-and-analyze-routing/`.

## Lessons Learned

- When a new classification would change a widely-used default's behavior, checking what the
  *existing test suite already asserts* for the "no signal" case is a fast, reliable way to find
  the backward-compatible fallback — the test suite is itself repository evidence, not just a
  gate.

## Next Change

Change 0081 — Definition enrichment workflow (Known/Missing/Ambiguous/Decision-required/Human
approval/Deferred).
