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

## Skills detection

Technology detectors and Skill recommendations live in `cli/src/skills-catalog.json`, not in the workflow engine. Each detector declares:

- `id` and `description`
- `signal`: `strong` (dependencies, files) or `weak` (documentation keywords)
- `dependencies` / `dependencyPrefixes` / `dependencySubstrings`
- `files` to check for existence
- `keywords` matched with word boundaries in `searchFiles`

Each skill declares `when` (detector ids that trigger it). Extend detection by editing the catalog; the engine (`cli/src/detect.js`) does not change.

## Testing

```bash
cd cli
npm test
```

Runs the CLI test suite (`node --test`, Node >= 18, no dependencies).
