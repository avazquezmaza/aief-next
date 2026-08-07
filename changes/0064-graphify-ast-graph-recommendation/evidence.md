# Evidence

## Summary

Added `codeGraphUnderstanding` (detector) and `graphify-ast-architecture` (Skill) to
`cli/src/skills-catalog.json` — pure data, following the exact `n8n`/`multitenant` pattern; no
detector-engine or `recommendSkills()` code changed. Added one read-only line to `aief doctor`
(`printGraphEngineStatus()`) reporting whether `GEMINI_API_KEY` is present in the environment —
never its value, never a network call. `aief bootstrap`, `aief analyze`'s existing meaning, and
`.aief/`-as-cache were deliberately left untouched; see `change.md` "Origin and scope reduction"
for why the original, broader requirement (CLI-executed Graphify/Gemini/AST engine, bootstrap
prompt for the key, `.aief/` cache) was not implemented as specified — it conflicted with
ADR-009, ADR-013 and ADR-015.

## Activities Performed

- `cli/src/skills-catalog.json`: added the `codeGraphUnderstanding` detector (weak signal —
  `graphify-out/` presence, or the keywords "dependency graph" / "call graph" / "architecture
  graph" / "codebase graph" / "code graph" in `README.md`/`AGENTS.md`/`docs/architecture.md`) and
  the `graphify-ast-architecture` Skill entry (`when: ["codeGraphUnderstanding"]`).
- `cli/src/cli.js`: added `printGraphEngineStatus()`, called once from `doctor()`. Reads
  `process.env.GEMINI_API_KEY` only — no write, no network call, no logging of the value.
- `docs/cli.md`: `aief doctor` row updated to document the new read and the new output line.
- `cli/tests/detect.test.js`: 3 new tests (detector fires on `graphify-out/`, fires on keyword,
  does not fire on an unrelated project).
- `cli/tests/cli.test.js`: 6 new tests — Skill shown/not shown via `doctor`, semantic-engine line
  with the key set, AST-engine line with the key absent/empty (never both/neither), the key's
  literal value never appears in output, and `bootstrap`/`analyze`/`prompt` output unaffected.

No change to `cli/src/detect.js` (detector-matching logic), `recommendSkills()`, `bootstrap()`,
`analyze()`, or `prompt()`.

## Verification

### Scenario 1 — `GEMINI_API_KEY` set (semantic mode)

Test: `doctor reports the semantic engine when GEMINI_API_KEY is set, never both lines`
(`cli/tests/cli.test.js`). Spawns `aief doctor` with `GEMINI_API_KEY: "fake-key-for-test"` in the
child process's environment only (the test harness's `aief()` helper does `spawnSync` with an
explicit `env` override — the real shell/session environment is never read or relied on).
Asserts the output contains exactly:

```
[✓] Graphify Semantic Engine available (GEMINI_API_KEY set)
```

and does not contain "AST Engine active". A separate test confirms the literal key value never
appears anywhere in `doctor`'s output.

### Scenario 2 — `GEMINI_API_KEY` absent or empty (static/AST mode)

Test: `doctor reports the AST engine when GEMINI_API_KEY is absent or empty`. Two sub-cases in the
same isolated child-process environment: `GEMINI_API_KEY: undefined` (Node's `child_process` env
handling omits `undefined`-valued keys entirely — this is the "not set at all" case) and
`GEMINI_API_KEY: ""` (present but empty). Both assert exactly:

```
[✓] AST Engine active (no GEMINI_API_KEY — static, offline, $0)
```

and neither contains "Semantic Engine".

Both scenarios were verified only through these isolated, node:test-driven child processes — not
by mutating the real interactive shell environment (this session's shell already carries a real
`GEMINI_API_KEY`; an earlier attempt to check the fallback branch by running `env -u
GEMINI_API_KEY node cli/bin/aief.js doctor` directly in that shell was stopped by the user, who
asked for automated-test-only verification instead — followed for the rest of this Change).

### Full suite

- `cli && node --test tests/detect.test.js tests/cli.test.js`: **199/199 passing** (9 new: 3 in
  `detect.test.js`, 6 in `cli.test.js`).
- `npm test` (repo root, full suite): **756/756 passing**, 0 regressions.
- `node cli/bin/aief.js verify`: **PASS** (0064 itself shows `✗ evidence.md missing` until this
  file exists, exactly as `aief verify` is designed to report; re-run after this file was written
  — see below).
- `git diff --check`: clean, no whitespace errors.

## Findings

None. No correctness issue surfaced during implementation or review.

## Deviations from the original requirement (see `change.md`)

- No `GEMINI_API_KEY` prompt in `aief bootstrap` — onboarding is frozen (ADR-015); not thawed for
  this Change.
- No CLI-executed Graphify run, Gemini API call, or Tree-sitter/PyCG AST parser — AIEF's CLI
  performs no network calls and holds no credentials anywhere (documented invariant, e.g.
  `docs/configuration.md`'s Jira provider: "no network call, no credentials"); the hybrid
  engine described in the original ask is executed by the assistant, using the Graphify Skill it
  already has, guided by this Change's `promptContext` — not by `aief` itself.
- No hidden `.aief/` cache — rejected outright by ADR-009 (`docs/architecture.md`: "No `.aief/`
  directory, no session state, no cache").
- `aief analyze`'s existing meaning (scaffolding an Analysis Change) is untouched — no naming
  collision introduced.
- `knowledge/architecture-graph.md` is not written by `aief` — the Skill's own `promptContext`
  directs the assistant to write it, consistent with the Skill Catalog's "AIEF includes it as
  context, it does not execute Skills" contract.
