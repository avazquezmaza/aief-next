# Security Model

This document names AIEF's trust boundaries, what crosses them, and what already enforces each
one — consolidating controls and decisions that exist today, scattered across code comments,
ADRs, and `AGENTS.md`. It is not a new control: nothing here changes behavior. For how to report
a vulnerability, see [SECURITY.md](../SECURITY.md).

## Trust zones

AIEF's own [System context](architecture.md#system-context) already draws four zones. This
document reuses that model rather than inventing a second one:

1. **External inputs** — humans, requirement sources (e.g. a Jira export), optional
   specification providers (e.g. OpenSpec).
2. **AIEF Core** — the CLI itself (`cli/src/`): commands, services, domain models, registries.
3. **Execution environment** — an AI assistant (Claude, Codex, Gemini, Kiro, …), the project's
   own test runner, CI. AIEF never reaches into this zone directly (below).
4. **Visible repository state** — the files AIEF reads and writes: `changes/`, `knowledge/`,
   `manifest.json`, `evidence.md`, and the project's own source.

The one rule connecting them, already stated in `docs/architecture.md`: AIEF Core reads and
writes only zone 4. It never executes zone 3 directly — `aief prompt` produces text a human
pastes into an assistant; the assistant, running independently, modifies the project and writes
evidence back into zone 4. Test runners and CI produce evidence the same way, outside AIEF's
control.

## Trust boundaries

| Boundary | What crosses it | Trust | Enforced by |
| --- | --- | --- | --- |
| External input → repository | A Jira export, an `--evidence-from` JUnit report, an OpenSpec artifact | Untrusted content, trusted path | Path-containment checks (`isPathWithin`/`isReallyWithin`) reject any resolved path — including via a symlink — that falls outside the project root, for every surface that reads a user- or externally-supplied path: `requirement-providers/jira.js` (Changes 0074/0105), `sdd-providers/openspec.js`, `core/services/verification-evidence.js`, `verification-rules/evidence-reference-integrity.js`. |
| Repository content → assistant prompt | `change.md`, `spec.md`, other project files a Skill includes in its generated instructions | Untrusted content, read into a trusted instruction template | Skills built on the Skills Runtime (ADR-019) explicitly label included project content as data, not instructions — e.g. `architecture-definition.js`: `"Full change.md content (untrusted project data):"`. The assistant reading the prompt is expected to honor that label; AIEF cannot enforce it past the point of generating the prompt (see Known Gaps). |
| AIEF Core → execution environment | Nothing — by design | N/A | ADR-021: AIEF Core never executes a test, a command, or reaches the network on the user's behalf. `aief prompt` only ever produces text; nothing in the engine re-invokes a command, an assistant, or itself (`docs/architecture.md`'s "Recommendation, never execution" principle). |
| A Skill/Hook/Verification Rule → the filesystem, a process, the network | An attempted write, command execution, or network call | N/A — structurally rejected | `FORBIDDEN_CAPABILITIES = ["writeFiles", "executeCommands", "network"]`, identical in `core/domain/skill.js` and `core/domain/hook.js` — a descriptor claiming any of these is rejected at registration, not merely discouraged by convention (ADR-019/ADR-020). Requirement Verification (ADR-021) never uses AI, never executes a test or a command, never reaches the network. |
| Execution environment → repository | Application code, `evidence.md`, test results | Untrusted until reviewed | Humans retain scope, merge, and release authority throughout — AIEF never commits, opens a PR, or approves anything on its own (`docs/architecture.md`). `aief verify`/`aief close` structurally validate the resulting Change files but do not execute or judge the application code itself. |
| A Change's own `(human)`/`(review)`/`(gate:<id>)` tasks | An assistant's proposed decision or approval | Untrusted until a human checks the box | `AGENTS.md`'s Prime Directive ("AI assists. Humans decide.") plus `checkChangeReadiness()`'s unresolved-task check and ADR-037's `(gate:<id>)` mechanism (Change 0125) — `aief close` refuses while any such task is unchecked; only a human is expected to check one (a convention, not currently code-enforced — see Known Gaps). |
| Local developer → tracked files | Secrets (API tokens, cloud keys, bot tokens, PINs) | Must never cross | `AGENTS.md`'s Operational Guardrails: "No secrets in tracked files… They come from the environment or a gitignored local file." Not independently scanned for by AIEF today (see Known Gaps — secret scanning). |
| A Claude Code / Codex / other assistant session → outward-facing systems | A push, a deploy, a write to an external system (e.g. Confluence) | Requires explicit confirmation | `AGENTS.md`'s Operational Guardrails: "Confirm before outward-facing or hard-to-reverse actions… unless already durably authorized." |

## Assets

What the boundaries above exist to protect:

- **Governance integrity** — that a Change cannot be marked closed, or a gate marked satisfied,
  without the human approval `AGENTS.md`/ADR-037 require. (Change 0131 fixed a real gap here: a
  manifest-backed Change's `close` used to report success without persisting the authoritative
  `manifest.json.status`, discovered by the same external audit this document follows up on —
  see `changes/0131-manifest-close-persistence/`.)
- **Repository integrity** — that AIEF's own commands never write outside a Change's own
  directory unexpectedly, and never read/write outside the project root (the path-containment
  boundary above).
- **Secrets** — never entering a tracked file via code, prompts, or evidence.
- **Evidence trustworthiness** — that captured verification (`--evidence-from`) records what it
  actually captured, traceably (Change 0129's provenance: digest, git commit, timestamp,
  producer — `evidence-provenance.js`), and that Requirement Verification never fabricates a
  passed result for evidence that doesn't exist (ADR-021's five-state aggregation, `ERROR >
  INVALID > FAIL > INCOMPLETE > PASS` — missing evidence is `INCOMPLETE`, never rounded to
  `PASS`).

## Known Gaps / Accepted Risk

Named explicitly, not left implicit:

- **Secret scanning is not yet enabled at the repository level.** CodeQL, dependency review, and
  SBOM generation run in CI (Change 0133); GitHub's own secret scanning/push protection is a
  repository *setting* (Settings → Code security), not a workflow file — enabling it is an
  outward-facing repository-configuration change, left for the project owner to enable directly
  rather than toggled via an API call from a Change.
- **No sandboxing of assistant execution — by design.** AIEF does not, and structurally cannot,
  control what an assistant does once handed a prompt (zone 3, above) — that is explicitly out
  of scope per ADR-021 and the "Recommendation, never execution" principle. Whatever sandboxing
  exists is the assistant tool's own responsibility (e.g. Claude Code's own permission system),
  not AIEF's.
- **Skills' "untrusted data" labeling is a convention, not an enforced boundary.** AIEF labels
  project content as data when building a prompt, but cannot compel the assistant reading that
  prompt to honor the label — this is the same class of limitation every prompt-injection
  mitigation for LLM-based tools has; AIEF's contribution is labeling clearly, not preventing
  the assistant from being influenced.
- **`(human)`/`(review)`/`(gate:<id>)` task labels are not identity-verified.** `aief close`
  checks whether the box is *checked*, not *who* checked it — nothing currently distinguishes a
  human checking it from an assistant checking it against `AGENTS.md`'s instruction not to. This
  is a documented convention every native entrypoint (`CLAUDE.md`, `CODEX.md`, `GEMINI.md`, the
  `aief-change` skill) instructs assistants to respect, not a technical control.
- **Numeric Change-ID collisions across parallel branches are not caught automatically.**
  Identified by the same external audit (Change 0130, finding C0130-F2): `aief verify` does not
  reject two Changes sharing a numeric prefix created on separate branches. One concrete
  instance was resolved by renaming; the general gap remains open.

## Related decisions

[ADR-019](../knowledge/decisions.md) (Skills Runtime, capability model), [ADR-020](../knowledge/decisions.md)
(Hooks, observation-only), [ADR-021](../knowledge/decisions.md) (Verification's execution
boundary), [ADR-037](../knowledge/decisions.md) (Workflow Gate authority) — see
[knowledge/decisions.md](../knowledge/decisions.md) for the full decision log.
