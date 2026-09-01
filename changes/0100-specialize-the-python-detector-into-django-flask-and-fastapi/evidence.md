# Evidence

## Summary

Specialized the generic `python` detector (Change 0098) into `django`/`flask`/`fastapi`, following
the same "generic language signal + framework-specific detector(s) + one shared Skill" shape as
the existing `aws`+`cognito` → `aws-saas-platform` and `nextjs`+`nestjs` →
`nextjs-nestjs-architecture` pairs.

## Activities Performed

- Added `django` (`signal: "strong"` — `manage.py` is a reliable structural marker, same evidence
  class as `typescript`'s `tsconfig.json`), `flask` and `fastapi` (`signal: "weak"` —
  keyword-in-`requirements.txt`/`pyproject.toml` only, matching `spring`'s convention).
- Added `python-backend-architecture` Skill (`when: ["django", "flask", "fastapi"]`) with
  `promptContext`/`commonRisks` covering input validation at the boundary, blocking I/O inside
  async handlers, and settings/secret hygiene (DEBUG, SECRET_KEY).
- Added 4 tests to `cli/tests/detect.test.js`: `manage.py` as a strong django signal, flask/fastapi
  as weak keyword signals, a negative case (plain Python project with `requests` only triggers no
  framework detector), and confidence propagation to the new Skill for all three frameworks.

## Verification

- `node --test cli/tests/detect.test.js` — 25/25 passing.
- `npm test` (full suite) — 1009/1009 passing (1005 pre-existing + 4 new).
- `node cli/bin/aief.js verify` — Result: PASS.
- `git diff --check` — clean.
- `python3 -c "import json; json.load(open('cli/src/skills-catalog.json'))"` — valid JSON, 36
  detectors / 11 skills after the change (was 33 / 10).
- `git diff --stat -- cli/src/detect.js` — empty; `git diff` on the existing `python` entry in
  `skills-catalog.json` — unchanged, only new entries added.

## Findings

None — additive, data-only change; no existing test broke, no id collision.

## Risks

- Same caveat already accepted for every detector in this catalog: proposed from common ecosystem
  convention (standard file/dependency names), not validated against a real Django/Flask/FastAPI
  project. A future dogfooding pass may refine it, the same way Change 0072 refined the original
  detectors against Flux Portal.
- `flask`/`fastapi` being keyword-only (no distinctive file marker the way `manage.py` is for
  Django) means a project that merely mentions "flask" in a comment inside `requirements.txt`
  (e.g. `# migrated off flask`) would still fire — same class of limitation the word-boundary
  `containsKeyword()` already narrows as much as this system's rubric allows, not fixed here.

## Recommendations

- If a real project surfaces the need for framework-specific `promptContext` (e.g. Django's ORM
  vs. FastAPI's Pydantic validation deserve different guidance), split
  `python-backend-architecture` into per-framework Skills then — not preemptively here.

## Artifacts Produced

- `cli/src/skills-catalog.json` — 3 new detectors, 1 new Skill.
- `cli/tests/detect.test.js` — 4 new tests.

## Lessons Learned

Confirms Change 0098's own "Next Change" note: the generic-signal + framework-specific-detector +
shared-Skill shape scales cleanly to a new language family with zero engine changes.

## Next Change

None proposed — closes the gap Change 0098's evidence.md flagged. Further Python framework
coverage (Pyramid, Tornado) can follow the same pattern later if real usage asks for it.
