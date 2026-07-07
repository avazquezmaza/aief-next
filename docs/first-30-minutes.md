# Your First 30 Minutes

1. Clone the repository and install the CLI:

```bash
git clone https://github.com/avazquezmaza/aief-next.git
cd aief-next
npm install && npm link
```

2. Read the [README](../README.md).
3. Check your environment:

```bash
aief doctor
```

4. Run the Todo example:

```bash
cd examples/todo-app
npm test
```

5. Initialize a project: `aief init` (existing directory) or `aief init my-project` (new).
6. Create a Change: `aief new-change my-change` and fill `change.md`, `spec.md`, `tasks.md`.
7. Generate the prompt for your assistant: `aief prompt claude` (or gemini / codex / cursor).
8. Let the assistant implement inside the Change.
9. Verify: `aief verify`.
10. Complete `evidence.md` and close: `aief close --yes`.

Congratulations — you've completed the AIEF workflow.
