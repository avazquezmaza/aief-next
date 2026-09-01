# Specification

## Goal

`skills-catalog.json` recognizes 20 additional widely-used stacks (backend languages, frontend
frameworks, data stores, deployment targets, and third-party integrations), and the two
highest-risk new families (payments, container/deployment) get a dedicated Skill with real
`commonRisks` — without touching the detection engine itself.

## Requirements

- Every new detector uses only the existing detector shape (`dependencies`,
  `dependencyPrefixes`, `dependencySubstrings`, `files`, `searchFiles` + `keywords`) — no new
  field, no change to `evaluateDetector()`/`detectProject()` in `cli/src/detect.js`.
- Dependency-backed detectors (`vue`, `angular`, `svelte`, `mongodb`, `redis`, `graphql`,
  `stripe`, `supabase`, `firebase`, `react-native`, `kafka`, `rabbitmq`) are `signal: "strong"`,
  matching the existing convention for a real `package.json` dependency.
- File-presence detectors (`python`, `go`, `rust`, `docker`, `kubernetes`, `vercel`, `netlify`)
  are `signal: "strong"`, matching the existing convention for `typescript`/`tailwind` (a
  structural file, not a guess).
- `spring` is keyword-in-file (`pom.xml`/`build.gradle` content), `signal: "weak"`, matching the
  existing `n8n`/`multitenant`/`rbac` convention for keyword-only evidence.
- `payments-reviewer` and `container-deployment-reviewer` follow the existing Skill shape exactly:
  `id`, `name`, `description`, `when`, `whenToUse`, `standardsToRead`, `promptContext`,
  `commonRisks`, `evidenceExpectations` — same fields as `aws-saas-platform`.
- Every new detector and both new Skills are covered by a test in `cli/tests/detect.test.js`,
  following the file's existing `makeProject()`/`detectProject()`/`recommendSkills()` pattern.

## Acceptance Criteria

- [ ] `cli/src/skills-catalog.json` contains all 20 new detectors and 2 new Skills, still valid
      JSON.
- [ ] `npm test` passes (existing 997 tests + new ones), no existing test broken.
- [ ] `node cli/bin/aief.js verify` passes.
- [ ] `git diff --check` passes (no whitespace errors).
- [ ] `detect.js` has zero diff — only catalog data and tests changed.
