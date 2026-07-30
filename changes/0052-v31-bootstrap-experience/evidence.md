# Evidence

## Summary

`aief bootstrap` implemented, replacing `init`/`adopt` (ADR-013 merge, ADR-015 explicit thaw
ADR-022). SDD Provider resolver's reserved step 2 (project-level configuration) implemented
minimally, opt-in, ambiguous-case-only. Full test suite passes; `aief status` output is
byte-identical before/after across the real repository.

## Activities Performed

- `cli/src/cli.js`: added `bootstrap(args)`, `bootstrapHere()`, `configureSddProvider()`,
  `promptSync()`, `commandRemoved()`; `initHere`→`bootstrapHere` (renamed, extended with the SDD
  Provider step and the closing summary); `adopt()` (standalone) removed, superseded entirely;
  `init`/`adopt` command dispatch replaced with `commandRemoved("init"/"adopt")`; `runAdoption()`
  now returns its `artifacts` array; `COMMAND_HELP`/`help()` updated (removed `init`/`adopt`
  entries, added `bootstrap`); every other `aief adopt`/`aief init` string reference in `cli.js`
  updated to `aief bootstrap`.
- `cli/src/core/domain/sdd-provider-resolver.js`: implemented the previously-reserved step 2 —
  `readProjectSddConfig()`/`sddProviderConfigPath()` — reading `knowledge/sdd-provider.json`
  before falling to OpenSpec detection/default. Manifest (step 1) still wins unconditionally.
- Tests: `cli/tests/cli.test.js` (migrated 16 `adopt`/`init` invocations to `bootstrap`, renamed
  test descriptions, added 5 new tests), `cli/tests/agents-canonical.test.js` (migrated all 6
  `adopt`/`init` invocations), `cli/tests/sdd-provider-registry.test.js` (added 4 new tests for
  the project-config step).
- Docs: `README.md`, `docs/getting-started.md`, `docs/cli.md`, `docs/architecture.md`,
  `docs/concepts.md`, `docs/configuration.md` — every `aief init`/`aief adopt` reference updated
  to `aief bootstrap`; `docs/configuration.md` gained a `knowledge/sdd-provider.json` section;
  `docs/cli.md` notes the command replacement explicitly.
- Governance: `knowledge/decisions.md` gained ADR-022 (explicit, scoped ADR-015 thaw for AIEF 3.1,
  by the project owner) before any implementation began.

## Verification

- `cd cli && npm test`: **543/543 passing, 0 failing** (full suite, including the 9 new/migrated
  tests this Change added and the 6 migrated `agents-canonical.test.js` tests).
- Zero-drift regression: `aief status` output captured before (git-stash of this Change's diff)
  and after — `diff` reports no differences. Confirms every existing Change under `changes/`
  (none carries `knowledge/sdd-provider.json`) resolves identically to before this Change.
- Manual walkthrough (`/tmp/.../bootstrap-demo`):
  - Fresh directory: `aief bootstrap` creates AGENTS.md, standards, `knowledge/skills.md`, CI
    gate, `changes/0001-adopt-aief`, reports `SDD Provider: local (default)`, ends with "Next
    steps" pointing at `aief new-change <name>`.
  - Second run: idempotent — "✓ ... already exists" for every artifact, "Bootstrap complete —
    this directory was already bootstrapped, nothing new to create."
  - `aief init` / `aief adopt`: both print `aief <name> has been replaced by aief bootstrap. Run:
    aief bootstrap` and exit 1, with zero writes (confirmed: no `AGENTS.md`/`changes/` created).
  - Ambiguous case (`openspec/` + `specboot/` both present, no TTY):
    `SDD Provider: openspec (non-interactive shell, using the deterministic default)` — no
    `knowledge/sdd-provider.json` written, no hang.

## Findings

- None blocking. One spec refinement recorded in `spec.md` R6: the closing message keeps the
  existing informational multi-line "Next steps" block (with the OpenSpec-install hint) rather
  than collapsing to a single `printNext()` line as originally worded — the existing block already
  carried tested value and rewriting it would have both lost that value and broken correct,
  pre-existing test coverage for no benefit.

## Risks

- `promptSync()` uses a dependency-free blocking `fs.readSync(0, ...)` read, gated behind an
  `isTTY` check so it is never reached in CI/test/piped contexts (verified above). If a future
  caller invoked `configureSddProvider()` outside that guard, it could block; the guard is the
  sole safeguard today, same as any other TTY-gated CLI prompt.
- `knowledge/sdd-provider.json` is a new opt-in project file; a project that already has a file at
  that path for an unrelated purpose would collide. Not observed in this repository or in any
  Change under `changes/`.

## Recommendations

- The next AIEF 3.1 Change (LIDR integration) can build on `bootstrap`'s specboot detection
  (already reports presence) to add real `templates/specboot` scaffolding and `ai-specs/`
  consumption, as scoped out in `change.md`.

## Artifacts Produced

- `cli/src/cli.js`, `cli/src/core/domain/sdd-provider-resolver.js` (modified).
- `cli/tests/cli.test.js`, `cli/tests/agents-canonical.test.js`,
  `cli/tests/sdd-provider-registry.test.js` (modified).
- `README.md`, `docs/getting-started.md`, `docs/cli.md`, `docs/architecture.md`,
  `docs/concepts.md`, `docs/configuration.md` (modified).
- `knowledge/decisions.md` (ADR-022 added).
- `changes/0052-v31-bootstrap-experience/` (this Change).

## Lessons Learned

- Writing `spec.md`'s requirements before touching code caught the ADR-013/ADR-015 conflict early
  (via this session's own review) rather than after code existed — cheaper to negotiate a merge
  decision (`bootstrap` replaces `init`/`adopt`) on paper than after two commands already shipped
  side by side.
- Reusing `resolveSddProvider()`'s already-reserved, already-named "step 2" slot (rather than
  inventing a new mechanism) kept the SDD Provider feature small and consistent with the existing
  precedence design from Change 0045.

## Next Change

LIDR integration: update `templates/specboot`, make `bootstrap`/`prompt` consume `ai-specs/`
skills and standards naturally (see `change.md` "Out of scope").
