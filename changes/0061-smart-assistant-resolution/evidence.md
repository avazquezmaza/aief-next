# Evidence

## Summary

`aief prompt`'s assistant resolution is now deterministic and symmetric across all four
registered assistants when no explicit assistant is given, through a new precedence order
(`AIEF_ASSISTANT` → `knowledge/assistant.json` → passive detection → interactive TTY choice →
non-interactive error). The old asymmetric fallback (only `CLAUDE.md` was ever detected passively)
is fixed. Three new flags — `--set-assistant`, `--show-assistant`, `--clear-assistant` — manage the
new project preference file; the explicit-override path (`aief prompt <name>` / `--assistant
<name>`) is byte-for-byte unchanged. No new command verb was added (ADR-013/ADR-022/ADR-031).

## Activities Performed

- Read `cli.js`'s existing `prompt()` implementation, `sdd-provider-resolver.js` (the reused
  pattern), `docs/maintainer.md`'s registry-extension section, and `knowledge/decisions.md`
  (ADR-013, ADR-015, ADR-022) before writing any code.
- Created `cli/src/core/domain/assistant-resolver.js`: the sole `ASSISTANT_FILES` registry,
  `resolveAssistant()` (pure precedence function), `readProjectAssistantConfig()`,
  `assistantConfigPath()`. No I/O side effects beyond reads.
- Updated `cli.js`: removed the inline `ASSISTANT_FILES` duplicate (now imported); `prompt()` calls
  `resolveAssistant()` only when no explicit assistant argument is given; added the TTY-interactive
  / non-interactive-error branch for ambiguous passive detection; added `--set-assistant
  <name>`/`--show-assistant`/`--clear-assistant` as flags on `prompt()`.
- Updated `COMMAND_HELP.prompt`, the top-level `aief help` usage banner, `docs/cli.md`
  (`aief prompt` table rows + a new "Resolving the assistant automatically" subsection),
  `docs/configuration.md` (new `AIEF_ASSISTANT` and `knowledge/assistant.json` sections).
- Added `knowledge/decisions.md`'s ADR-031, recording the precedence design and, specifically, why
  this landed as flags on `prompt` rather than a new `use-assistant` command (ADR-013 requires
  naming what a new-command Change removes/merges; this Change removes nothing).
- Added `cli/tests/assistant-resolver.test.js` (17 unit tests for `resolveAssistant()`: every
  precedence layer, invalid env/config, malformed JSON, symmetric detection across all four
  assistants, ambiguity, determinism).
- Added CLI-level tests to `cli/tests/cli.test.js`: symmetric detection via a bare `aief prompt`
  for Gemini/Codex/Cursor, `AIEF_ASSISTANT` (valid and invalid), `knowledge/assistant.json` (valid
  and invalid), the three new flags, and a filesystem-snapshot test proving a plain `aief prompt`
  never writes across every resolution path.
- Updated one existing test (`"prompt --assistant selects the matching instruction file"`) that
  encoded the old CLAUDE.md-biased fallback as its expected behavior, and added a replacement test
  documenting the deliberate behavior change (mirroring the discipline Change 0059/ADR-029 used for
  its own superseded test).

## Verification

- `npm test` (full suite, repo root): **747/747 PASS**, 0 failures (up from 728 at the start of
  AIEF 3.1's Change 0060 baseline — 19 new tests: 17 in `assistant-resolver.test.js`, 2 net new in
  `cli.test.js` after replacing one and adding several).
- `node cli/bin/aief.js verify`: **PASS** (whole project).
- `node cli/bin/aief.js verify --change 0061-smart-assistant-resolution`: **PASS**.
- Manually exercised in a scratch project during development: bare `aief prompt` with only
  `GEMINI.md` present (previously silently generic/Claude-biased, now correctly includes
  `GEMINI.md`); `AIEF_ASSISTANT=gemini aief prompt` with `CLAUDE.md` also present (selects Gemini);
  `aief prompt --set-assistant claude` then `aief prompt --show-assistant` (reports `claude`,
  source `knowledge/assistant.json`); `aief prompt --clear-assistant` (removes the file, reports
  "nothing to clear" on a second run); ambiguous case (`CLAUDE.md` + `GEMINI.md`, no env/config,
  non-interactive) exits 1 with both candidates named and no prompt body printed.
- `git diff --check`: no whitespace errors.

## Implementation Notes

- **`aief prompt` remains read-only during normal execution.** Every resolution path — explicit
  override, `AIEF_ASSISTANT`, `knowledge/assistant.json`, passive detection, and the interactive
  TTY choice — reads state and prints a prompt; none of them touches the filesystem. This is
  enforced, not just documented: `cli/tests/cli.test.js`'s "a plain aief prompt never writes to the
  filesystem, across every resolution path" test snapshots the project directory before and after
  a bare run, an explicit-override run, and an `AIEF_ASSISTANT`-driven run, and asserts byte
  equality.
- **Persistence only happens through the explicit `--set-assistant` operation.** No other code
  path writes `knowledge/assistant.json` — not passive detection, not the interactive choice
  (which explicitly tells the user it was not saved and suggests `--set-assistant` to persist it),
  not `--show-assistant` (read-only), not a bare `aief prompt`. `--clear-assistant` is the only
  other write, and it only deletes.
- **`--set-assistant` intentionally overwrites the existing preference without a confirmation
  prompt.** Unlike `knowledge/sdd-provider.json` (written once by `aief bootstrap` and never
  overwritten afterward, per `sdd-provider-resolver.js`'s design), `--set-assistant` is a direct,
  named, human-invoked "set" action — the user typed the exact command that changes the value, so
  there is no ambiguity to protect against and no silent side effect to guard: overwriting is the
  entire point of running it. Adding a confirmation step would only add friction to an action the
  user already stated explicitly on the command line.
- **This is a deliberate, documented deviation from the `sdd-provider` bootstrap flow**, not an
  oversight. The SDD provider's "write once, never overwrite" rule exists because that value is
  set implicitly, as a side effect of an ambiguous detection during `aief bootstrap` — a case where
  silently overwriting a prior choice on a later `bootstrap` run would be surprising. `--set-
  assistant` has no equivalent implicit-write case to protect against: it is always a direct,
  explicit, single-purpose invocation. The two mechanisms solve different problems, so they
  intentionally do not share the same overwrite rule — this keeps the CLI's behavior simple and
  predictable (a "set" command sets the value) rather than forcing every preference file in the
  codebase through one uniform, but not always appropriate, overwrite policy.

## Findings

- The premise as commissioned ("today it always requires naming an assistant") was already
  partially outdated — `aief prompt` with no argument already worked, falling back to `CLAUDE.md`
  when present. The real, verifiable defect was the fallback's asymmetry: `GEMINI.md`/`CODEX.md`/
  `CURSOR.md` were never checked by that fallback, only `CLAUDE.md` was. This Change's scope was
  adjusted accordingly — corrected in `change.md`'s "Inventory" section.
- `knowledge/sdd-provider.json` was confirmed as the exact structural precedent to reuse
  (project-level JSON preference, pure precedence resolver, TTY-gated write by the calling
  command, "invalid config is an error" discipline) — `assistant-resolver.js` mirrors it rather
  than inventing a new pattern.
- ADR-022 explicitly permits new commands for AIEF 3.1 but restates that ADR-013 (name what you
  remove/merge) still applies per-Change. Since this Change removes nothing, a new `use-assistant`
  command would have been the exact anti-pattern ADR-013 exists to catch — flags on the existing
  `prompt` command were used instead, consistent with every other additive AIEF 3.1/Core 3.0
  Change.

## Risks

- The interactive-ambiguity branch (`process.stdin.isTTY` + `promptSync`) is exercised by the
  non-interactive branch in the automated test suite (the test harness's piped stdin is never a
  TTY) but the TTY branch itself was only exercised manually in a real terminal, not by an
  automated test — consistent with how the pre-existing `configureSddProvider()`'s own TTY branch
  is tested in this codebase (also manual-only).
- `--set-assistant` overwrites `knowledge/assistant.json` without confirmation (unlike
  `sdd-provider.json`, which is "written once, never overwritten"). This is intentional — the flag
  is named "set," an explicit user action — but is a deliberate asymmetry with the SDD precedent,
  worth flagging in review.

## Recommendations

- Consider whether `aief doctor` should surface the resolved assistant (or a note when
  `knowledge/assistant.json` is invalid) — out of scope for this Change per its own "Out of scope"
  section, but a natural follow-up given `doctor`'s existing "project readiness" role.

## Artifacts Produced

- `cli/src/core/domain/assistant-resolver.js` (new)
- `cli/tests/assistant-resolver.test.js` (new)
- `cli.js`, `cli/tests/cli.test.js` (modified)
- `docs/cli.md`, `docs/configuration.md` (modified)
- `knowledge/decisions.md` (ADR-031 added)
- `changes/0061-smart-assistant-resolution/` (this Change)

## Lessons Learned

- Restating the commissioned problem precisely (asymmetric fallback, not "always requires an
  argument") before writing code avoided building passive detection as if it did not already
  exist in a limited form.

## Next Change

None required by this Change. `aief close --yes --change 0061-smart-assistant-resolution` once
reviewed.
