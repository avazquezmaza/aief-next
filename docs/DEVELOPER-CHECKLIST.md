# AIEF Developer Checklist

One page. Follow it top to bottom for every Change. Full detail: [docs/TEAM-USAGE-GUIDE.md](TEAM-USAGE-GUIDE.md).

> Reminder: AIEF is a **pre-1.0 internal pilot**. AI assists; humans decide. Never let an assistant run a Change end-to-end without review.

---

## Before starting

- [ ] `aief doctor` — environment and readiness OK (missing *optional* tools are fine).
- [ ] Adopted project? Edited `knowledge/standards/` so the `(adapt)` lines match this project.
- [ ] `aief status` — I know the active Change and its ID (guard against silent duplicates).
- [ ] The work fits **one** Change with a clear objective.

## During Change

- [ ] `change.md` — objective, scope and **out of scope** written.
- [ ] `spec.md` — requirements and **acceptance criteria** written (before implementation).
- [ ] `tasks.md` — implementation checklist written.
- [ ] Using OpenSpec? Generated proposal/spec/tasks via `aief propose` (loud fallback if absent).

## Before implementation

- [ ] Human approved the scope and acceptance criteria.
- [ ] `aief prompt <assistant>` generated; **I read it** and confirmed it references real files.
- [ ] Pasted into the assistant; it read `change.md`, `spec.md`, `tasks.md`, `AGENTS.md`, standards, Skills.
- [ ] Assistant works **only** the scope in `change.md`.

## Before close

- [ ] Reviewed **every** assistant diff myself.
- [ ] Ran the real verification (`npm test` / build / link checks) — output captured.
- [ ] `evidence.md` completed honestly (real command output; failures and skips stated).
- [ ] `aief verify` → **PASS**.
- [ ] Acceptance criteria genuinely met → `aief close --yes`.

## Before commit / push

- [ ] `aief verify` → PASS and test suite green.
- [ ] Change is Closed (or intentionally left open with reason).
- [ ] **I** create the commit — AIEF never commits or pushes.
- [ ] Push only after explicit human confirmation.
