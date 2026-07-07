# Bootstrap Experience

How a new user goes from `git clone` to a working `aief` command and an initialized project.

AIEF is distributed as a dependency-free Node.js CLI (Node >= 18). It orchestrates the AI engineering workflow — it does not replace OpenSpec, SpecBoot, or your AI assistant.

## Install locally

From the repository root:

```bash
git clone https://github.com/avazquezmaza/aief-next.git
cd aief-next
npm install     # no dependencies to download; validates the package
npm link        # installs a global `aief` command
aief --help
```

`npm link` works from the root because the root `package.json` exposes the `aief` binary (`cli/bin/aief.js`). Linking from `cli/` also works.

## Run without installing

```bash
node cli/bin/aief.js --help
node cli/bin/aief.js doctor
```

Or after `npm install` (no global link):

```bash
npm exec aief -- --help
```

## Check your environment: `aief doctor`

`aief doctor` inspects the environment and the current project. It never modifies anything.

Tools are grouped by level:

- **Core (required)** — node, npm, git. Missing required tools are reported in the summary and doctor exits non-zero.
- **SDD (recommended)** — openspec, specboot. Missing tools produce a warning (`⚠`) with an install/integration hint, never a failure.
- **Build tools (optional)** — java, maven, gradle, docker. Reported informatively (`○`).
- **Assistants (optional)** — claude, gemini, cursor, codex. AIEF is assistant-agnostic: none is required, none is special.

The summary states whether the environment is ready, usable with warnings, or missing required tools.

## Initialize a project: `aief init`

Two modes:

```bash
aief init              # initialize the CURRENT directory (existing project)
aief init my-project   # create a NEW project skeleton in my-project/
```

Without arguments, `init` reuses the adopt logic and:

- reports what it detects first (AGENTS.md, changes/, OpenSpec CLI, OpenSpec project structure, SpecBoot);
- creates only **visible** AIEF structure: `AGENTS.md` (if missing), `changes/`, `knowledge/` (with starter standards), `profiles/`;
- never modifies application code and never overwrites existing files;
- informs how to install OpenSpec or integrate SpecBoot when missing — it does not install them;
- ends with explicit next steps (doctor, OpenSpec, SpecBoot, first Change).

There is no hidden `.aief/` directory and no state file: per [ADR-009](../knowledge/decisions.md) the Change files are the only source of truth. The original Change 0025 proposal included a `.aief/` layout and was rejected for this reason.

## Validate the bootstrap

```bash
npm install && npm link      # from the repo root
aief --help                  # shows all commands
aief doctor                  # grouped environment report; optional tools never fail it
mkdir /tmp/aief-bootstrap-test && cd /tmp/aief-bootstrap-test
aief init
ls changes knowledge         # visible structure created; application code untouched
```

Run the test suite from the root with `npm test` (delegates to `cli/`, `node --test`, no dependencies).

## Where responsibilities live

- **AIEF** — workflow, context, prompts, evidence, verification, bootstrap.
- **OpenSpec** — proposals, specs, tasks (`npm install -g @fission-ai/openspec@latest`, then `openspec init`).
- **SpecBoot** — rules, standards, assistant base configuration (see `adapters/specboot/`).
- **Your AI assistant** — the implementation work.
- **AGENTS.md** — the inviolable project rules.
