# Getting Started

AIEF is designed to be usable in minutes. Full install options: [bootstrap.md](bootstrap.md).

## 1. Install the CLI

```bash
git clone https://github.com/avazquezmaza/aief-next.git
cd aief-next
npm install
npm link        # installs a global `aief` command
aief doctor     # check your environment
```

## 2. Initialize your project

```bash
cd your-project
aief init       # existing project — visible structure only, code untouched
# or:
aief init my-project && cd my-project   # new project skeleton
```

## 3. Create your first Change

```bash
aief new-change my-first-change
```

Then edit:

```text
changes/0001-my-first-change/change.md   # why and what
changes/0001-my-first-change/spec.md     # requirements and acceptance criteria
changes/0001-my-first-change/tasks.md    # implementation checklist
```

## 4. Hand the context to your AI assistant

```bash
aief prompt claude    # or: gemini, codex, cursor
```

Paste the generated prompt — it already carries `AGENTS.md`, your standards and the active Change.

## 5. Verify and close

```bash
aief verify           # structure and evidence checks
aief close --yes      # marks the Change Closed when everything is ready
```

That is the minimum AIEF loop. Stage-by-stage detail: [lifecycle.md](lifecycle.md).

> Prefer to work without the CLI? The templates are still available for manual use: copy `templates/change/` into `changes/<id>-<name>/` and follow [AGENTS.md](../AGENTS.md).
