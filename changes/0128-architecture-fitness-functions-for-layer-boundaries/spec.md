# Specification

## Goal

`docs/architecture.md`'s layer model is enforced by `npm run lint`, not only documented: a
future edit that has a Domain Model import a Service or Command, a Service import a Command,
or a Hook mutate the filesystem, fails lint with a message naming the violated rule.

## Requirements

- R1: `cli/eslint.config.js` gains a config block scoped to `files: ["src/core/domain/**/*.js"]`
  using `no-restricted-imports`'s `patterns` to forbid any import specifier matching
  `../services/*` or `../../commands/*` (relative to a file in that directory).
- R2: A config block scoped to `files: ["src/core/services/**/*.js"]` forbids any import
  specifier matching `../../commands/*`.
- R3: A config block scoped to `files: ["src/hooks/**/*.js"]` uses `no-restricted-properties`
  to forbid calling any filesystem-mutating method (`writeFileSync`, `appendFileSync`,
  `unlinkSync`, `rmSync`, `rmdirSync`, `mkdirSync`, `renameSync`, `chmodSync`, `chownSync`,
  `copyFileSync`, `truncateSync`, `symlinkSync`, `linkSync`) on the `fs` object. Reading
  (`readFileSync`, `existsSync`, etc.) is unaffected.
- R4: Each rule's message names the violated layer/invariant and points to
  `docs/architecture.md` (or `AGENTS.md` for the Hooks case), so a lint failure is
  self-explanatory without needing to find this Change first.
- R5: No change to any existing application-code file — the rules must find zero violations on
  the current tree (verified before writing the rules, not assumed).
- R6: A new test file exercises the ESLint config's Node API directly (not `npm run lint`'s
  shell output) with synthetic, in-memory probe source for each rule: one violating case, one
  legitimate/clean case, per rule, plus one test running the real rule set against the actual
  `cli/src` tree.

## Acceptance Criteria

- [ ] `npm run lint` passes unchanged on the current tree.
- [ ] A probe import from `src/core/domain/` to `../services/*` fails lint with a message
      containing "Domain Models must not import".
- [ ] A probe import from `src/core/domain/` to `../../commands/*` fails lint the same way.
- [ ] A probe import from `src/core/services/` to `../../commands/*` fails lint with a message
      containing "Application Services must not import".
- [ ] A probe `fs.writeFileSync` call inside `src/hooks/` fails lint with a message containing
      "Hooks are observation-only".
- [ ] The equivalent legitimate imports/calls (domain→domain, services→domain, hooks reading
      the filesystem) are lint-clean.
- [ ] `npm test`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0128-architecture-fitness-functions-for-layer-boundaries --strict`
      all pass.
