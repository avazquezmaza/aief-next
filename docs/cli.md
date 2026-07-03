# AIEF CLI UX

The CLI is self-explanatory.

Every command answers, via `aief help <command>`:

- Purpose
- When to use it
- What it reads
- What it writes
- Example
- Recommended next step

## Existing project adoption

```bash
aief doctor
aief adopt
aief verify
aief analyze
aief prompt --assistant claude --profile architect
```

## Command intent

| Command | Purpose | Writes files? |
|---|---|---|
| `doctor` | Inspect environment and project readiness | No |
| `status` | Show current AIEF adoption state | No |
| `adopt` | Add minimum AIEF workflow to an existing project | Yes (never application code) |
| `analyze` | Create an Analysis Change | Yes |
| `new-change` | Create a Change skeleton | Yes |
| `prompt` | Generate assistant prompt (`--assistant claude\|gemini\|codex\|cursor`) | No |
| `verify` | Check AIEF structure | No |
| `close` | Readiness checks (files, tasks, evidence); `--yes` marks the Change Closed | Only `change.md` Status, with `--yes` |
| `propose` | Create/delegate proposal | Yes |
| `release` | Create release notes | Yes (never overwrites) |
| `init` | Create a new AIEF project | Yes |
| `use-profile` | Print a role prompt header | No |

## Guarantees

- `adopt` uses the next free Change ID; it never collides with existing Changes and is idempotent.
- Skill recommendations always explain why they fired (detector, evidence, signal strength).
- OpenSpec delegation is validated at runtime; failures fall back loudly to local Change generation (see `adapters/openspec/README.md`).
- No hidden state: the active Change is the latest one not marked Closed in its own `change.md` (override with `--change`). `verify` reports in-progress Changes calmly (`○ in progress`) and only warns when a *closed* Change lacks completed evidence.
- Every command ends with a unified `Next:` hint pointing to the recommended next step.

## Detectors, Skill recommendations and Skill content

Three distinct concepts live in `cli/src/skills-catalog.json` (data, not engine logic):

1. **Detector** — fires on project signals. Declares `id`, `description`, `signal` (`strong` = dependencies/files, `weak` = documentation keywords), `dependencies` / `dependencyPrefixes` / `dependencySubstrings`, `files`, and `keywords` matched with word boundaries in `searchFiles`.
2. **Skill recommendation** — a skill's `when` lists the detector ids that trigger it. `doctor`/`adopt` print recommendations with the reason.
3. **Skill content** — operational knowledge used by `aief prompt`: `name`, `purpose`/`description`, `whenToUse`, `standardsToRead`, `promptContext`, `commonRisks`, `evidenceExpectations`. Included in prompts *as context*; AIEF never executes a Skill. If a recommended Skill has no `promptContext`, the prompt says so honestly.

Extend any of the three by editing the catalog; the engine (`cli/src/detect.js`) does not change.

## Project standards

`aief adopt` creates editable starter standards under `knowledge/standards/` from templates in `cli/templates/standards/`:

- Always: `base-standards.md`, `documentation-standards.md`, `testing-standards.md`, `security-standards.md`.
- If frontend signals (nextjs/react/tailwind): `frontend-standards.md`.
- If backend signals (nestjs/postgres/cognito/n8n): `backend-standards.md`.
- Existing files are never overwritten.

`aief analyze` lists them in the seeded Detected Context; `aief prompt` instructs the assistant to follow them.

## Testing

```bash
cd cli
npm test
```

Runs the CLI test suite (`node --test`, Node >= 18, no dependencies).
