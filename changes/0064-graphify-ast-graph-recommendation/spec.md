# Specification

## Goal

A project whose signals suggest code-graph/architecture understanding is relevant sees a
`graphify-ast-architecture` Skill recommended by `aief doctor`/`bootstrap`/`analyze`/`prompt` (all
four already call `recommendSkills()` — zero code change needed for them to pick up a new catalog
entry). `aief doctor` additionally reports, on every run, which graph-engine mode the environment
currently supports. A project with neither signal nor `GEMINI_API_KEY` sees output unchanged
except for that one new informational line.

## Non-goals (this Change)

- No code executes Graphify, calls Gemini, or parses an AST. Everything here is either static
  catalog data (consumed the same way every other Skill Catalog entry already is) or a read-only
  environment check.
- `bootstrap` is not touched — no prompt, no `knowledge/graph-engine.json`, nothing written.
- `aief analyze`'s existing behavior (scaffolding an Analysis Change) is untouched.
- No `.aief/` directory, no new file under `knowledge/` written by `aief` itself.

## Requirements

- **R1 — New detector, existing shape only.** `codeGraphUnderstanding` is added to
  `skills-catalog.json`'s `detectors` array using only fields the engine
  (`cli/src/detect.js:evaluateDetector`) already supports (`files`/`searchFiles`+`keywords`) — no
  new signal type (e.g. an env-var detector) is introduced by this Change. Signal: `weak`. Fires
  on `graphify-out/` being present (mirrors the Graphify Skill's own trigger convention) or on
  keywords (`dependency graph`, `call graph`, `architecture graph`, `codebase graph`, `code
  graph`) found in `README.md`, `AGENTS.md`, or `docs/architecture.md`.
- **R2 — New Skill entry, same contract as every other catalog Skill.** `graphify-ast-architecture`
  has `id`, `name`, `description`, `when: ["codeGraphUnderstanding"]`, `whenToUse`,
  `standardsToRead`, `promptContext`, `commonRisks`, `evidenceExpectations` — the same shape as
  `n8n-automation-ops`/`multitenant-saas-architect`. `promptContext` states the hybrid rule
  explicitly for the assistant to follow: use the Graphify Skill for the enriched semantic graph
  when `GEMINI_API_KEY` is available; otherwise read the codebase statically (imports, module
  boundaries, call sites) and produce the same understanding offline; persist findings under
  `graphify-out/` (the existing, already-gitignored artifact convention) and summarize into
  `knowledge/architecture-graph.md`. Nothing in this entry declares or requires any capability —
  the catalog has no capability vocabulary (unlike `cli/src/core/domain/skill.js`'s Skills
  Runtime); it is inert data until an assistant reads it out of a rendered prompt.
- **R3 — `recommendSkills()`/`detect.js` are untouched.** No change to matching logic, only to the
  catalog's data — `bootstrap`, `analyze`, `prompt`, and `doctor` all pick up the new entry through
  their existing call to `recommendSkills()`, with zero code diff in any of the four.
- **R4 — `aief doctor` reports the graph-engine mode, unconditionally, read-only.** A new line,
  shown on every `doctor` run regardless of whether the new Skill fires:
  `[✓] Graphify Semantic Engine available (GEMINI_API_KEY set)` when
  `process.env.GEMINI_API_KEY` is a non-empty string, else
  `[✓] AST Engine active (no GEMINI_API_KEY — static, offline, $0)`. The check reads the
  environment variable only — it never calls Gemini, never validates the key, never logs its
  value, never writes it anywhere.
- **R5 — No behavior change for projects with neither signal.** A project with no `graphify-out/`,
  no matching keyword, and any `GEMINI_API_KEY` state still sees identical `Recommended Skills:`
  output to before this Change, plus exactly the one new doctor line from R4 (doctor's own output
  gains a line; `bootstrap`/`analyze`/`prompt` are unaffected either way since none of them prints
  the graph-engine line).
- **R6 — No write, ever.** Neither the new detector/Skill nor the new doctor line writes any file,
  makes any network call, or reads/writes any credential.

## Acceptance Criteria

- [x] `aief doctor` in a project with `graphify-out/` present shows `graphify-ast-architecture`
      under `Recommended Skills:`, with a `because: "graphify-out" present` reason.
- [x] `aief doctor` in a project with none of the trigger signals does not show the new Skill.
- [x] `aief doctor` with `GEMINI_API_KEY` set in the environment prints the semantic-engine line;
      unset (or empty string) prints the AST-engine line — in both cases, exactly one of the two
      lines, never both, never neither.
- [x] `aief bootstrap`, `aief analyze`, `aief prompt` output is unaffected by the new doctor line
      (none of the three prints it); their own output changes only insofar as R1–R3 make the new
      Skill recommendable when its detector fires — verified against existing tests for all three.
- [x] Full CLI test suite passes; `node cli/bin/aief.js verify` passes; `git diff --check` passes.
