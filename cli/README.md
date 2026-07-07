# AIEF CLI

The AIEF CLI is a guided workflow tool.

It explains what each command does, what it reads, what it writes, and what to do next: `aief help <command>`.

Commands cover levels 1 (context: doctor/adopt/analyze/prompt) and 3 (governance: verify/close) of the [three-level AIEF workflow](../docs/Workflow.md); level 2 (the feature work) happens in your assistant, optionally with OpenSpec.

## Install

Requires Node >= 18. No dependencies.

From the repository root (the root `package.json` exposes the same binary):

```bash
npm install
npm link   # installs a global `aief` command
```

Linking from `cli/` also works. Or run directly: `node cli/bin/aief.js <command>`. See [docs/bootstrap.md](../docs/bootstrap.md).

## Existing project flow

```bash
aief doctor
aief adopt
aief verify
aief analyze
aief prompt claude --profile architect
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
aief prompt claude --profile architect
aief verify
aief close --yes
```

## Skills and standards

`aief doctor` and `aief adopt` inspect project signals and recommend possible Skills, always explaining why each Skill was recommended.

Detectors, Skill recommendations and Skill content are data, not engine logic: they live in `src/skills-catalog.json` and are evaluated by `src/detect.js` with word-boundary keyword matching to avoid false positives. Skill content (promptContext, commonRisks, standardsToRead, evidenceExpectations) is injected into `aief prompt` output as context — Skills are never executed.

`aief adopt` also creates editable project standards under `knowledge/standards/` (from `templates/standards/`), matched to detected frontend/backend signals and never overwriting existing files. `aief analyze` seeds the Analysis Change with detected signals, Skills, standards and inferred risks; `aief prompt` tells the assistant to follow the standards.

Profiles define the role. Skills define specialized knowledge. Standards define project rules. None of them replaces `AGENTS.md`.

## OpenSpec delegation

`aief propose` validates the OpenSpec contract at runtime (installed? version? `propose` command exposed?). On any failure it prints an explicit message and falls back to a local Change — never silently. See `adapters/openspec/README.md`.

## Tests

```bash
npm test
```

Runs the CLI suite with `node --test` (Node >= 18, no dependencies). Covers Change ID safety, adoption idempotence, detection, skill reasons, Analysis Changes, CRLF handling, verify, help coverage and the OpenSpec fallback paths.
