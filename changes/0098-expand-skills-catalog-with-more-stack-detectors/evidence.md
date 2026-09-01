# Evidence

## Summary

Added 20 new detectors and 2 new Skills to `cli/src/skills-catalog.json`, closing the gap
identified in a prior codebase analysis (this repo's own detectors covered only a narrow SaaS
stack). No change to `detect.js`'s detection engine — every entry reuses the existing shape.

## Activities Performed

- Reviewed `cli/src/skills-catalog.json` and `cli/src/detect.js` to confirm the existing detector
  shapes (`dependencies`, `dependencyPrefixes`, `dependencySubstrings`, `files`, `searchFiles` +
  `keywords`) and the `signal: "strong"/"weak"` convention.
- Added 20 detectors across backend languages (python, go, rust, spring), frontend frameworks
  (vue, angular, svelte), data stores (mongodb, redis, graphql), deployment targets (docker,
  kubernetes, vercel, netlify), and third-party integrations (stripe, supabase, firebase,
  react-native, kafka, rabbitmq).
- Added 2 Skills — `payments-reviewer` (`when: ["stripe"]`) and `container-deployment-reviewer`
  (`when: ["docker", "kubernetes"]`) — matching the field shape and depth of existing Skills like
  `aws-saas-platform`.
- Added 6 new tests to `cli/tests/detect.test.js`: file-presence detectors, dependency-based
  detectors, the `spring` weak/keyword-only detector (including a negative case for a plain
  Java/Gradle project), and both new Skill recommendations.

## Verification

- `node --test cli/tests/detect.test.js` — 21/21 passing.
- `npm test` (full suite, from repo root) — 1003/1003 passing (997 pre-existing + 6 new).
- `node cli/bin/aief.js verify` — Result: PASS.
- `git diff --check` — clean, no whitespace errors.
- `python3 -c "import json; json.load(open('cli/src/skills-catalog.json'))"` — valid JSON, 33
  detectors / 10 skills after the change (was 13 / 8).
- Confirmed `git diff -- cli/src/detect.js` is empty — only catalog data and tests changed, per
  spec.md's requirement.

## Findings

None — this was an additive, data-only change with no interaction with existing detectors
(verified: no existing test broke, no existing detector id/skill id collided with a new one).

## Risks

- The new detectors are proposed based on common ecosystem conventions (standard dependency names,
  standard config file names) but were not validated against a real project using each of these
  20 stacks — same caveat that already applies to every existing detector in this catalog. Future
  dogfooding against a real project in one of these stacks may surface a false negative/positive,
  the same way Change 0072's Flux Portal validation refined the existing detectors.
- `kubernetes` detection relies on a `k8s`/`kubernetes`/`helm` directory existing at the project
  root; a project keeping manifests elsewhere (e.g. inside a monorepo subpackage) will not be
  detected. Documented as a known limitation, not fixed here (same class of limitation already
  accepted for `aws`'s `terraform`/`infra` directory check).

## Recommendations

- If a stack from this batch turns out to need more than signal-only detection (a dedicated Skill
  with real risk content), add it as its own small Change later, following this same pattern —
  do not grow this Change further.
- Consider, in a future Change, whether `python` should split into framework-specific detectors
  (django/flask/fastapi) the way `aws`/`cognito` are split, if a real project surfaces the need
  for framework-specific `promptContext`.

## Artifacts Produced

- `cli/src/skills-catalog.json` — 20 new detectors, 2 new Skills.
- `cli/tests/detect.test.js` — 6 new tests.

## Lessons Learned

Extending this registry is exactly as low-friction as `docs/maintainer.md` describes: no caller
needed touching, `detectProject()`/`recommendSkills()` picked up every new entry with zero code
changes.

## Next Change

None proposed as a direct follow-on; the catalog gap that motivated this Change is closed for the
stacks identified. A future Change could pursue framework-specific Python detectors if real-world
use surfaces the need (see Recommendations).
