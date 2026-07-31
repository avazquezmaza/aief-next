# Tasks

## Design (this Change)

- [x] Read `cli/src/cli.js` (`adopt`, `runAdoption`, `initProject`, `initHere`) and
      `cli/src/core/domain/sdd-provider-resolver.js` to confirm exact current behavior to preserve.
- [x] Read ADR-013, ADR-015, ADR-017 for constraints.
- [x] Record the ADR-015 thaw as ADR-022 and get explicit project-owner sign-off (done — this
      conversation).
- [x] Decide `bootstrap` fully replaces `init`/`adopt` (not an alias) — explicit project-owner
      decision (done — this conversation).
- [x] Write `change.md`, `spec.md`, `tasks.md`.

## Implementation

- [x] `cli/src/cli.js`: added `bootstrap(args)` — dispatches to `initProject(name)` when an
      argument is given, otherwise runs `bootstrapHere()` (current-directory flow) plus the new
      SDD Provider step (R4) and the new closing summary (R6).
- [x] `cli/src/core/domain/sdd-provider-resolver.js`: implemented step 2 —
      `readProjectSddConfig()` reads `knowledge/sdd-provider.json` (if present and valid) before
      falling to OpenSpec detection/default; invalid/malformed file is reported via `{ error }`,
      never thrown.
- [x] `cli.js`: `configureSddProvider()` writes `knowledge/sdd-provider.json` only in the
      genuinely ambiguous case (OpenSpec available **and** specboot/LIDR marker present), only
      when not already present, only when `process.stdin.isTTY` (else reports the deterministic
      fallback and skips writing).
- [x] Replaced the `init`/`adopt` command dispatch in `main()` with `commandRemoved()` (redirect
      message + `process.exitCode = 1`); `initHere`/`initProject`/`runAdoption` kept as internal
      functions, called only by `bootstrap()`. The standalone `adopt()` function was removed
      (fully superseded by `bootstrapHere()`).
- [x] Updated `help`/`printCommandHelp`/`COMMAND_HELP`: removed `init`/`adopt` entries, added
      `bootstrap`; updated the general usage text in `help()`.
- [x] Updated `README.md`, `docs/getting-started.md`, `docs/cli.md` onboarding sections, plus
      `docs/architecture.md`, `docs/concepts.md`, `docs/configuration.md` (stale `adopt`/`init`
      references would otherwise describe removed commands as current).

## Tests

- [x] `cli/tests/cli.test.js`: migrated existing `adopt`/`init` assertions to `bootstrap`, same
      artifact expectations (test names renamed accordingly).
- [x] `cli/tests/agents-canonical.test.js`: migrated (also referenced `adopt`/`init` directly).
- [x] New test: `aief init` / `aief adopt` print the redirect and exit 1, perform no writes.
- [x] New test: non-interactive `bootstrap` never blocks on the SDD Provider prompt; deterministic
      fallback (`local (default)`) is used and reported.
- [x] New test: `bootstrap` reports OpenSpec detection (`openspec (OpenSpec detected)`) without
      prompting when SpecBoot is not also present.
- [x] New test: `knowledge/sdd-provider.json` is never overwritten on a second `bootstrap` run.
- [x] New tests in `sdd-provider-registry.test.js`: `resolveSddProvider()` honors
      `knowledge/sdd-provider.json` as step 2; `manifest.sdd.provider` (step 1) still wins over
      it; an unknown provider or malformed JSON in the file is reported, never thrown.
- [x] Zero-drift regression: `aief status` output is byte-identical before/after this Change
      across the real repository (git-stash diff, see Evidence).
- [x] Ran `cd cli && npm test`: 543/543 passing (0 failing).

## Documentation

- [x] `README.md`: Mermaid diagram label and CLI usage example use `aief bootstrap`.
- [x] `docs/getting-started.md`: first-run walkthrough uses `aief bootstrap`, notes the SDD
      Provider resolution behavior.
- [x] `docs/cli.md`: command reference — removed `init`/`adopt` entries, added `bootstrap` with
      both invocation forms and a note on the SDD Provider prompt.
- [x] `docs/configuration.md`: added `knowledge/sdd-provider.json` section.
- [x] `knowledge/decisions.md`: ADR-022 added (this session).

## Close

- [x] `evidence.md` updated with the verification transcript.
- [x] Verified acceptance criteria in `spec.md`.
- [x] `aief close --yes --change 0052-v31-bootstrap-experience`.
