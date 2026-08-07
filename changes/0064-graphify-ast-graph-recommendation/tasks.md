# Tasks

- [x] Add `codeGraphUnderstanding` detector to `cli/src/skills-catalog.json` (R1).
- [x] Add `graphify-ast-architecture` Skill entry to `cli/src/skills-catalog.json` (R2).
- [x] Add `printGraphEngineStatus()` (or equivalent) to `cli/src/cli.js`, called once from
      `doctor()` (R4).
- [x] `detect.test.js`: detector fires on `graphify-out/` presence and on each keyword; does not
      fire otherwise.
- [x] `cli.test.js`: `aief doctor` shows the new Skill when the detector fires, omits it otherwise;
      shows the semantic-engine line with `GEMINI_API_KEY` set, the AST-engine line without;
      `bootstrap`/`analyze`/`prompt` output unaffected.
- [x] `docs/cli.md`: document the new doctor line under the `aief doctor` row.
- [x] `npm test` (from repo root), `node cli/bin/aief.js verify`, `git diff --check` — all pass.
- [x] `evidence.md` filled in with both scenarios (`GEMINI_API_KEY` set / unset) actually run.
