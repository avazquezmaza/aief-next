# AIEF CLI UX

Every command belongs to one level of the [three-level workflow](Workflow.md):

| Level | Commands |
|---|---|
| 1 · Context | `doctor`, `init`, `adopt`, `analyze`, `new-change`, `propose`, `prompt`, `status` |
| 2 · Feature | none — the assistant (optionally with OpenSpec) does the work; AIEF only hands over the prompt |
| 3 · Governance | `verify`, `close` |

The CLI is self-explanatory. `aief --help` (or `-h`) shows usage; `aief --version` prints the version. See [bootstrap.md](bootstrap.md) for installation.

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
aief prompt claude --profile architect
```

## Command intent

| Command | Purpose | Writes files? |
|---|---|---|
| `doctor` | Inspect environment and project readiness | No |
| `status` | Show current AIEF adoption state | No |
| `adopt` | Add minimum AIEF workflow to an existing project | Yes (never application code) |
| `analyze` | Create an Analysis Change | Yes |
| `new-change` | Create a Change skeleton | Yes |
| `prompt` | Generate assistant prompt (`aief prompt gemini` or `--assistant gemini`; claude/gemini/codex/cursor; unknown values fail with guidance) | No |
| `verify` | Check AIEF structure | No |
| `close` | Readiness checks (files, tasks, evidence); `--yes` marks the Change Closed | Only `change.md` Status, with `--yes` |
| `propose` | Create/delegate proposal | Yes |
| `release` | Create release notes | Yes (never overwrites) |
| `init` | No argument: initialize the current directory (reuses adopt; visible structure only). With a name: create a new project skeleton | Yes (never application code) |
| `use-profile` | Print a role prompt header | No |

## Guarantees

- `adopt` uses the next free Change ID; it never collides with existing Changes and is idempotent.
- Skill recommendations always explain why they fired (detector, evidence, signal strength).
- OpenSpec delegation is validated at runtime; failures fall back loudly to local Change generation (see `adapters/openspec/README.md`).
- No hidden state: Change selection is derived from the files on every invocation (a Change is open until its own `change.md` says Closed). With exactly one open Change, commands target it implicitly; with more than one, `prompt`/`close` require an explicit `--change <id>` and list the candidates instead of guessing — one shared resolver (exact name, then numeric ID, then unique slug fragment; ambiguous or unknown values fail loudly). `verify` reports in-progress Changes calmly (`○ in progress`), only warns when a *closed* Change lacks completed evidence, and accepts `--change <id>` to verify a single Change and say exactly which one it checked.
- Every command ends with a unified `Next:` hint pointing to the recommended next step.
- After adoption, having `0001-adopt-aief` open alongside the Analysis Change is normal: with both open, name the target explicitly (`aief prompt --change <analysis-id>`, `aief close --yes --change adopt-aief`) — the order of closing does not affect AIEF.
- `prompt` is re-run-safe: when a Change's evidence already has real content, the generated prompt instructs the assistant to amend rather than overwrite (and to report a re-verification when nothing changed). It also states where results belong (project evidence vs AIEF/tooling feedback) and, for Analysis Changes, that tasks.md is marked by humans unless explicitly delegated.

## Detectors, Skill recommendations and Skill content

Three distinct concepts live in `cli/src/skills-catalog.json` (data, not engine logic):

1. **Detector** — fires on project signals. Declares `id`, `description`, `signal` (`strong` = dependencies/files, `weak` = documentation keywords), `dependencies` / `dependencyPrefixes` / `dependencySubstrings`, `files`, and `keywords` matched with word boundaries in `searchFiles`.
2. **Skill recommendation** — a skill's `when` lists the detector ids that trigger it. `doctor`/`adopt` print recommendations with the reason.
3. **Skill content** — operational knowledge used by `aief prompt`: `name`, `purpose`/`description`, `whenToUse`, `standardsToRead`, `promptContext`, `commonRisks`, `evidenceExpectations`. Included in prompts *as context*; AIEF never executes a Skill. If a recommended Skill has no `promptContext`, the prompt says so honestly.

`aief adopt` also writes the recommended Skills as a readable artifact, `knowledge/skills.md` (never overwritten), so the project shows which Skills apply and why; `analyze` and `prompt` reference it when present.

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
npm test        # from the repo root (delegates to cli/), or: cd cli && npm test
```

Runs the CLI test suite (`node --test`, Node >= 18, no dependencies).
