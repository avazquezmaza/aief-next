# Specification

## Goal

`aief bootstrap` adds only host-neutral AIEF structure; wiring `aief verify` into CI is a
documented, explicit choice of the adopting team.

## Requirements

- R1: `bootstrap` does not create `.github/workflows/aief-verify.yml` (nor `.github/`), and prints
  no CI-gate line.
- R2: `cli/templates/ci/aief-verify.yml` is removed; no code references it.
- R3: `docs/configuration.md` "CI gate" explains that bootstrap does not generate CI config and
  shows how to run `aief verify` in any CI without relying on an `aief` npm package.
- R4: `docs/getting-started.md`, `docs/cli.md`, `docs/examples.md`, `aief help bootstrap`
  (`cli/src/commands/misc.js`) and the adoption diagram no longer list a CI gate.
- R5: An existing `.github/` in the target project is left untouched (unchanged behavior).

## Acceptance Criteria

- [x] A test runs `bootstrap` in a temp directory and asserts no `.github/` exists afterwards.
- [x] `grep -rn "aief-verify\|npx aief" cli docs/*.md scripts` returns no current-doc/code hits.
- [x] `docs/images/adoption-workflow.svg` regenerated from its generator.
- [x] `npm test`, `npm run lint`, `node cli/bin/aief.js verify` and `git diff --check` pass.
