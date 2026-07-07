# Architectural Principles

> Canonical list of AIEF's permanent architectural principles. Each principle states **why it exists** and which accepted ADRs embody it. Principles restate accepted architecture — changing one requires a new ADR, not an edit here.

## 0. Human-Led — *AI assists. Humans decide.*

The prime directive, inherited from [AGENTS.md](../AGENTS.md). AI may propose, draft, implement, review and summarize; humans approve scope, trade-offs, architecture and releases.

**Why:** the failure mode of AI-assisted engineering is not bad code — it is unowned decisions. Someone must be accountable; that someone is human.

## 1. Assistant Agnostic

AIEF must never depend on one assistant. Claude, Gemini, Codex, Cursor, Copilot and future assistants are equal citizens; assistant-specific support is an adapter concern, never core logic.

**Why:** the assistant landscape changes quarterly; the engineering discipline should not. Coupling the workflow to one vendor would make the workflow as perishable as the tool. Embodied in: `aief prompt <assistant>` treating all four files identically ([ADR-004](../knowledge/decisions.md) hierarchy), no assistant-specific commands anywhere in the CLI.

## 2. No Hidden State

Everything AIEF knows lives in visible files. The active Change is *derived* (latest Change not marked Closed), never stored. A proposed `.aief/state.json` was rejected ([ADR-009](../knowledge/decisions.md)); a proposed hidden `.aief/` layout was rejected again in Change 0025.

**Why:** invisible state drifts from reality and cannot be reviewed. If it matters, it must appear in `git diff`; if it doesn't appear there, AIEF must be able to re-derive it.

## 3. OpenSpec First

AIEF never duplicates Proposal / Specification / Tasks. When OpenSpec is available, AIEF delegates ([ADR-002](../knowledge/decisions.md)); when it is not, the local Change skeleton is a documented fallback — announced loudly, never silently.

**Why:** specification generation is a solved problem owned by a dedicated tool. Rebuilding it inside AIEF would create a worse copy and couple the workflow engine to a spec format ([ADR-001](../knowledge/decisions.md)).

## 4. SpecBoot Compatible

AIEF never absorbs responsibilities owned by SpecBoot. Its concepts — modular standards, instruction hierarchy, skills — are integrated conceptually ([ADR-003](../knowledge/decisions.md), [ADR-010](../knowledge/decisions.md)); its files are never copied, and nothing depends on it at runtime.

**Why:** copying would create a fork to maintain and blur who owns assistant-instruction conventions. Learning from a tool and vendoring it are different relationships; AIEF chose the first.

## 5. Single Responsibility

Every component owns exactly one responsibility. The four knowledge dimensions are orthogonal and must never absorb each other ([ADR-012](../knowledge/decisions.md)): AGENTS.md answers *what rules are inviolable*, Profiles answer *how should I reason*, Standards answer *how is this project built*, Skills answer *what should I know*. Only the Prompt Engine composes them.

**Why:** the moment one layer absorbs another, both become unmaintainable — rules hide inside knowledge, project facts hide inside roles, and no one can tell where to edit what. Orthogonality is what keeps the model small.

## 6. Visible Knowledge

Knowledge must be inspectable. Standards are editable files under `knowledge/standards/`; recommended Skills are written to `knowledge/skills.md`; decisions live in `knowledge/decisions.md`; detection logic is data (`cli/src/skills-catalog.json`), and every recommendation states its reason ([ADR-007](../knowledge/decisions.md), [ADR-010](../knowledge/decisions.md)).

**Why:** context you cannot read is context you cannot trust, correct or improve. Visibility is what turns AIEF's knowledge into *project property* rather than tool magic.

## 7. Evidence Driven

Every Change produces evidence. `evidence.md` answers what changed, how it was verified, what remains and what was learned; `aief close` refuses to close a Change whose evidence is placeholder. Product improvements themselves require validation evidence from real projects ([ADR-008](../knowledge/decisions.md)).

**Why:** "done" without proof is the original sin of AI-assisted development — plausible output accepted on faith. Evidence converts claims into verifiable statements, for the project and for AIEF itself.

## 8. Workflow over Automation

AIEF coordinates; it does not replace engineering. It composes context, hands over prompts, checks structures and closes cycles — it does not generate specs, implement code, commit, or archive another tool's artifacts ([ADR-001](../knowledge/decisions.md), [ADR-011](../knowledge/decisions.md), [What AIEF does not do](Workflow.md#what-aief-does-not-do)).

**Why:** automation that replaces judgment hides failure; workflow that structures judgment exposes it. AIEF's value is that every step remains understandable and overridable by the human running it — which is also why the CLI is guided and educational ([ADR-006](../knowledge/decisions.md)).
