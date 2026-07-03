# AIEF CLI

The AIEF CLI is a guided workflow tool.

It explains what each command does, what it reads, what it writes, and what to do next: `aief help <command>`.

## Install

Requires Node >= 18. No dependencies.

```bash
cd cli
npm link   # installs a global `aief` command
```

Or run directly: `node cli/bin/aief.js <command>`.

## Existing project flow

```bash
aief doctor
aief adopt
aief verify
aief analyze
aief prompt --assistant claude --profile architect
```

## Command groups

### Discovery

```bash
aief doctor
aief status
aief help doctor
```

### Adoption

```bash
aief adopt
aief analyze
```

### Work

```bash
aief new-change add-login
aief propose "Add login"
aief prompt --assistant claude --profile architect
aief verify
aief close --yes
```

## Skills recommendation

`aief doctor` and `aief adopt` inspect project signals and recommend possible Skills, always explaining why each Skill was recommended.

Detectors and Skills are data, not engine logic: they live in `src/skills-catalog.json` and are evaluated by `src/detect.js` with word-boundary keyword matching to avoid false positives.

Profiles define the role. Skills define specialized knowledge. Neither replaces `AGENTS.md`.

## OpenSpec delegation

`aief propose` validates the OpenSpec contract at runtime (installed? version? `propose` command exposed?). On any failure it prints an explicit message and falls back to a local Change — never silently. See `adapters/openspec/README.md`.

## Tests

```bash
npm test
```

Runs the CLI suite with `node --test` (Node >= 18, no dependencies). Covers Change ID safety, adoption idempotence, detection, skill reasons, Analysis Changes, CRLF handling, verify, help coverage and the OpenSpec fallback paths.
