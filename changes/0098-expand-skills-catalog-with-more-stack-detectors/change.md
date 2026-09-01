# Change

## ID

`0098-expand-skills-catalog-with-more-stack-detectors`

## Type

General

## Objective

`cli/src/skills-catalog.json` only recognizes a narrow SaaS stack (Next.js/NestJS/AWS/Cognito/n8n).
`aief analyze`/`aief doctor` and the Skill-recommendation engine (`detect.js`) stay silent on
common stacks outside that slice. Add detectors for widely-used languages, frameworks, data
stores, deployment targets and third-party integrations, and add a Skill for the two families
whose risk profile (payments, container/deployment) justifies dedicated `promptContext`/
`commonRisks` — following the existing registry-extension pattern (`docs/maintainer.md`
"Extending a registry").

## Scope

### In scope

- New detectors in `cli/src/skills-catalog.json`: `python`, `go`, `rust`, `spring`, `vue`,
  `angular`, `svelte`, `mongodb`, `redis`, `graphql`, `docker`, `kubernetes`, `vercel`, `netlify`,
  `stripe`, `supabase`, `firebase`, `react-native`, `kafka`, `rabbitmq`.
- Two new Skills: `payments-reviewer` (`when: ["stripe"]`) and `container-deployment-reviewer`
  (`when: ["docker", "kubernetes"]`), matching the depth of existing Skills like
  `aws-saas-platform`/`security-rbac-reviewer`.
- Tests in `cli/tests/detect.test.js` covering the new detectors and the two new Skills.

### Out of scope

- Changes to `detect.js`'s detection engine itself — every new entry uses the existing
  `dependencies`/`dependencyPrefixes`/`files`/`searchFiles`+`keywords` shapes, no new detector
  mechanism.
- Detectors for every remaining framework in existence — this Change closes the most visible gaps
  in the current catalog, not an exhaustive stack list; more can follow the same pattern later.
- Any language/framework detector getting its own dedicated Skill beyond the two above — the rest
  stay signal-only, same as the existing `react`/`typescript`/`tailwind`/`postgres` precedent
  (detected and surfaced in `aief analyze`'s "Detected project type" line, no Skill content yet).

## Success Criteria

- `cli/src/skills-catalog.json` gains the 20 detectors and 2 Skills listed above, valid JSON,
  loadable by `loadCatalog()`.
- `npm test` passes, including new tests exercising each new detector and both new Skills.
- `node cli/bin/aief.js verify` passes.
- No change to `detect.js`'s detection/recommendation logic.

## Status

Closed (2026-09-01)
