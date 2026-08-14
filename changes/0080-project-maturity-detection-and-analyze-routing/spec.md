# Specification

## Goal

`aief analyze` creates the right kind of Change (Definition vs Analysis) for the repository it is
run against, using a small deterministic classifier — never a probabilistic guess, never a
regression for repositories the current behavior already serves correctly.

## Requirements

- `classifyMaturity(rootDir)` returns `{ maturity, reasons, sourceFiles, definitionFiles,
  definitionWords }` with `maturity` one of `"implemented" | "definition" | "ambiguous"`.
- Implementation signal: at least one non-config, non-trivial (>= 20 bytes) code file under a
  recognized source directory (`src`, `lib`, `app`, `cli`, `server`, `api`, `pkg`, `cmd`,
  `internal`) at the repository root. `node_modules`, `.git`, `dist`, `build`, `coverage`,
  `vendor`, `.next`, `.venv`, `__pycache__` are never scanned. A `*.config.js`-style file under a
  source directory does not count.
- Definition signal: README/PRD/requirements-named files at the repository root with a combined
  word count >= 30.
- Precedence: implementation signal present → `"implemented"` (regardless of definition content).
  Else definition signal present → `"definition"`. Else → `"ambiguous"`.
- `aief analyze` computes `classifyMaturity(cwd())` and routes: `"implemented"` → existing Analysis
  Change behavior, byte-identical output. `"definition"` → a Definition Change (Change 0079's
  `createChange(name, {type:"definition"})`), with an explicit "Detected maturity: Definition" line
  and the classifier's reasons printed. `"ambiguous"` → existing Analysis Change behavior, plus an
  explicit "Project maturity is ambiguous — defaulting to Analysis" note with reasons and override
  guidance.
- `aief analyze --maturity <definition|implemented|ambiguous>` bypasses detection and routes
  directly; an unrecognized value is a rejected, non-zero-exit error and creates no Change.

## Acceptance Criteria

- [ ] `classifyMaturity()` passes the maturity matrix: PRD-only, PRD + tooling-only metadata, real
      Node app, real non-Node app, sparse ambiguous repo, AIEF itself.
- [ ] `aief analyze` on a PRD-only fixture creates a Definition Change (`## Type` / `Definition`).
- [ ] `aief analyze` on a fixture with real source (`src/` present) is unchanged — still creates an
      Analysis Change, with no "Detected maturity: Definition" line.
- [ ] `aief analyze` on every existing sparse/empty fixture in `cli.test.js` still creates an
      Analysis Change (zero regression), with an explicit ambiguity note in the output.
- [ ] `aief analyze --maturity definition` / `--maturity implemented` force routing regardless of
      detection.
- [ ] `aief analyze --maturity bogus` is rejected explicitly; no `changes/` directory is created.
- [ ] Full existing `cli.test.js` suite passes unmodified (no fixture rewritten to "make it pass").
- [ ] `npm test`, `node cli/bin/aief.js verify`, `git diff --check` all pass.
