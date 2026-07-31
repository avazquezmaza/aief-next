# Specification

## Goal

Replace `aief init` and `aief adopt` with one command, `aief bootstrap`, that a brand-new user runs
once in their project root. It detects what it can, asks only what it cannot safely infer,
creates the same visible AIEF structure `adopt`/`init` create today, additionally makes one SDD
Provider decision explicit and durable, and ends with a short, honest summary and a clear
next step (`aief new-change`).

## Non-goals (this Change)

- Consuming `ai-specs/` skills/standards, or reworking `templates/specboot` beyond what it already
  contains — tracked as the next AIEF 3.1 Change ("LIDR integration").
- Hooks/Loop/Graph visibility work, `manifest.json` extension, `status --graph`, `doctor`
  improvements, isolated worktree, stack→profile suggestions, `status --next` — all later AIEF 3.1
  Changes (see `change.md` "Out of scope").
- Any change to `verify`/`close`/Workflow/Skills/Hooks internals.

## Requirements

- **R1 — `aief bootstrap` is the new onboarding command.** `aief bootstrap` (current directory)
  and `aief bootstrap <name>` (new directory, same as today's `aief init <name>`) perform
  everything `adopt` + `init` do today: detection report, `AGENTS.md`/`changes/`/`knowledge/`/
  `profiles/`, starter standards, `knowledge/skills.md`, CI gate, the `adopt-aief` Change with
  generated evidence — byte-for-byte the same artifacts `runAdoption()` produces today. No
  existing write is dropped; `bootstrap` is additive-in-behavior even though it removes command
  surface.
- **R2 — `init` and `adopt` are removed as public commands (ADR-013).** `aief init` / `aief adopt`
  print a one-line redirect (`"aief init/adopt have been replaced by aief bootstrap. Run: aief
  bootstrap"`) and exit non-zero; their implementation functions (`runAdoption()`, `initHere()`,
  `initProject()`) are kept internally, called only from `bootstrap`'s dispatch. `help`/`--help`
  and all docs stop listing `init`/`adopt` as commands to run.
- **R3 — Ask only what cannot be inferred.** Detection (`detectProject()`, OpenSpec/SpecBoot
  presence — already computed by today's `initHere()`) runs first and is printed. `bootstrap`
  prompts interactively **only** when the SDD Provider choice is ambiguous (R4) and stdin is a
  TTY; in a non-interactive shell (CI, piped input) it falls back to the existing deterministic
  default (`resolveSddProvider`'s step 3/4) and says so explicitly, never blocking.
- **R4 — SDD Provider becomes an explicit, persisted project-level choice.**
  `cli/src/core/domain/sdd-provider-resolver.js` already reserves step 2 ("project-level
  configuration") as unimplemented. This Change implements it minimally:
  - If OpenSpec is unambiguously detected (today's step 3) or no provider is meaningfully
    available (step 4 default), `bootstrap` reports the resolved provider and does **not**
    prompt or write anything new — the existing runtime resolution is left untouched and
    undisturbed.
  - The only new prompt is the genuinely ambiguous case: OpenSpec CLI/project detected as
    available **and** the project already has `specboot`/LIDR markers, where a human preference
    is real signal, not noise. `bootstrap` asks once, writes the answer to a new project-level
    file `knowledge/sdd-provider.json` (`{ "provider": "openspec" | "local", "setBy": "bootstrap",
    "date": "<ISO date>" }`), and never overwrites it silently on a later `bootstrap` run (mirrors
    `createStandards()`'s never-overwrite discipline).
  - `resolveSddProvider()`'s step 2 reads this file when present, before falling to step 3/4 —
    the file's absence changes nothing (opt-in, per the project's opt-in principle).
- **R5 — LIDR-specboot: report, don't invent.** `bootstrap` reports whether `specboot`/LIDR
  markers are present (reusing today's `initHere()` detection) and, if present, points at
  `adapters/specboot/README.md` — identical to today's step 4 next-step line. It does not copy or
  rewrite `templates/specboot/*` content; that is explicitly deferred to the LIDR integration
  Change (see `change.md`).
- **R6 — Friendly closing message.** After creating/confirming artifacts, `bootstrap` prints a
  short summary line (count of newly created artifacts, or an honest "nothing new to create" when
  everything already existed — never a re-listing of file names already shown above), the resolved
  SDD Provider and why, and a short "Next steps" block whose final, most prominent line is
  `aief new-change <name>` — the one action every user needs regardless of their setup. (Refined
  during implementation: the original wording called for a single `printNext()` line; kept as the
  existing informational "Next steps" numbered block instead, since it already carries real,
  tested value — e.g. the OpenSpec install hint when OpenSpec is absent — and rewriting it would
  have both dropped that value and broken existing, still-correct test coverage for no benefit.)
- **R7 — No behavior change for a project that already ran `adopt`/`init`.** Running `bootstrap`
  again is idempotent exactly as `runAdoption()` is today: existing files are never overwritten,
  and the summary says so.
- **R8 — Tests.** Existing `adopt`/`init` CLI tests are updated to call `bootstrap` (same
  assertions on artifacts) plus new tests for: `init`/`adopt` print the redirect and exit 1; the
  ambiguous-provider prompt path (non-interactive fallback); `knowledge/sdd-provider.json` is
  never overwritten once written; `resolveSddProvider()` honors it as step 2.

## Acceptance Criteria

- [x] `aief bootstrap` in a fresh directory produces the same artifact set `aief adopt` +
      `aief init` produce today (regression-diffed — see evidence.md).
- [x] `aief init` and `aief adopt` no longer perform onboarding — they print the redirect and
      `process.exitCode = 1`.
- [x] `resolveSddProvider()` step 2 reads `knowledge/sdd-provider.json` when present; absent by
      default for every existing Change (zero-drift regression).
- [x] The ambiguous-provider prompt only fires when OpenSpec is available **and** a
      specboot/LIDR marker is present; every other case is silent and unprompted.
- [x] `knowledge/sdd-provider.json`, once written, is never overwritten by a later `bootstrap` run.
- [x] `README.md`, `docs/getting-started.md`, `docs/cli.md` reference `bootstrap`, not `init`/
      `adopt`, as the onboarding command.
- [x] Full CLI test suite passes; new tests cover R1–R5 and R8.
