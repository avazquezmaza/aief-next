# The CI gate — running `aief verify` automatically

> **The gate is one command.** Everything else on this page is convenience.
>
> ```bash
> npx aief verify
> ```
>
> It reads the repository, writes nothing, and **exits non-zero** when governance is
> broken. Any CI that can fail a build on a non-zero exit code is enough.

## Why this exists

A real migration ([Flux Portal](dogfooding-findings.md#f2--nothing-runs-aief-verify-in-adopted-projects--p0--committed)) governed with AIEF reached a production cutover while `aief verify` reported:

```
✗ changes/0008-user-management-mutations/spec.md missing
… (six Changes)
Result: FAIL
```

The signal was **correct, and had been correct for two days**. Nobody ran it. The project
had no CI gate, so governance depended on someone remembering — and memory lost, exactly
when throughput mattered most.

**A validator nobody runs is decoration.** That is the whole reason this page exists.

## What you get at adoption

`aief adopt` (and `aief init`) writes:

```
.github/workflows/aief-verify.yml
```

It follows the same two rules as every other adoption artifact:

- **Visible** — no hidden `.aief/` directory ([ADR-009](../knowledge/decisions.md)).
- **Never overwritten** — if the file exists, adoption leaves it alone and says so.

It is listed among the adoption artifacts, so it also appears in the generated
`evidence.md`.

## Not using GitHub Actions?

Delete the workflow and run the command wherever your pipeline lives. AIEF is
CI-agnostic; the workflow is shipped because most repositories can use it as-is, **not**
because GitHub is required.

| Where | What to run |
|---|---|
| GitLab CI | `script: - npx aief verify` |
| Jenkins | `sh 'npx aief verify'` |
| pre-commit / husky | `npx aief verify` |
| Make / npm script | `"governance": "aief verify"` |
| Anything else | `npx aief verify` — fail the build on a non-zero exit |

## What the gate catches

`aief verify` fails the build when:

- a Change is missing `change.md`, `spec.md`, `tasks.md` or `evidence.md`, or one is empty;
- a Change **declares a status that cannot be interpreted** — it never guesses (see
  [F1](dogfooding-findings.md#f1--the-status-parser-answers-false-in-silence--p0--committed));
- an Enrichment Change lacks its required sections.

It does **not** fail for work in progress: an open Change whose evidence is still a
template is normal and reported as information, not an error.

## What it does not do

It does not run your tests, your build, or your project's harness — **the project owns
execution; AIEF records that it happened**
([governance-conventions §4](governance-conventions.md#4-harness-engineering)). Put the
gate alongside your existing jobs, not instead of them.
