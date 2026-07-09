# External Harness Patterns — Evaluation

> Product architecture, no implementation. This document evaluates which patterns from two external repositories can strengthen AIEF **without turning it into an agent framework and without breaking its human-gated model**. Nothing here authorizes implementation: per [ADR-008](../knowledge/decisions.md), every "adapt" verdict below is conditioned on the evidence its table row names, and every borrowed idea follows the SpecBoot precedent ([ADR-003](../knowledge/decisions.md)) — concepts are integrated, files are never copied.
>
> Sources evaluated (read 2026-07-09, public GitHub):
> - [`betta-tech/harness-sdd`](https://github.com/betta-tech/harness-sdd) — a Spec-Driven Development harness demonstrating autonomous agents governed by phase gates and artifacts.
> - [`multica-ai/andrej-karpathy-skills`](https://github.com/multica-ai/andrej-karpathy-skills) — coding guidelines for AI assistants derived from Karpathy's critique of LLM coding failures.

Companion reading: [docs/domain-model.md](domain-model.md), [docs/runtime-governance-open-questions.md](runtime-governance-open-questions.md), [docs/ROADMAP-TO-1.0.md](ROADMAP-TO-1.0.md), [docs/AIEF-1.0-READINESS.md](AIEF-1.0-READINESS.md).

---

## 1. What each repo contributes

### harness-sdd

A demonstration of "Harness Engineering": AI agents work on a codebase inside structural constraints rather than through smarter prompting. Its notable mechanics:

- **Artifact-based communication** — all agent output lands in versioned files (`specs/<feature>/requirements.md`, `design.md`, `tasks.md`; `progress/history.md`); agents reference files, never chat history.
- **Four-phase gate system** — Spec → (human approval) → Implementation → Review → Closure; coding cannot start before a human approves the spec.
- **Role separation** — distinct agent definitions (`leader`, `spec_author`, `implementer`, `reviewer` under `.claude/agents/`); no role performs another's job, and the reviewer is not the implementer.
- **Requirement traceability** — numbered requirements (R1, R2… in EARS notation) that must each map to a concrete test; the review phase checks the mapping.
- **Machine definition of done** — `CHECKPOINTS.md` states what "correctly complete" means; `init.sh` runs real, executable verification.
- **Scope/WIP gate** — `feature_list.json` enforces at most one feature in progress.
- **Session state files** — `progress/current.md` (live mutable state) plus `progress/history.md` (append-only log).
- **Progressive disclosure** — agents navigate `AGENTS.md` on demand instead of receiving every rule up front.

### andrej-karpathy-skills

A small set of behavior guidelines for AI coding assistants (distributed as `CLAUDE.md`/`CURSOR.md` content and a Claude Code plugin), encoding four principles against observed LLM failure modes:

1. **Think Before Coding** — surface assumptions, confusion and tradeoffs explicitly instead of proceeding silently.
2. **Simplicity First** — minimal code for exactly what was asked; no speculative features or unnecessary abstraction.
3. **Surgical Changes** — touch only code tied to the request; preserve style; no unrelated refactoring.
4. **Goal-Driven Execution** — verifiable success criteria over imperative task lists.

---

## 2. Compatible patterns (already AIEF's model — adopt means "affirm")

These require **no work**: harness-sdd independently converged on bets AIEF has already made and validated in three real adoptions. That convergence is itself useful evidence that the bets are sound.

- **Artifact-based communication.** AIEF's entire model is files-as-truth (`changes/<id>/`, ADR-009, "If you can't `cat` it, AIEF doesn't store it"). harness-sdd arriving at the same conclusion from the autonomous-agent side confirms the pattern holds even under heavier automation than AIEF permits.
- **Human approval gate before implementation.** harness-sdd halts before coding until a human approves the spec — exactly AIEF's Human Review Gate (Change 0030) and the `verify`/`close` governance level. Same philosophy, already built.
- **Spec-before-code (think first, code second) as workflow law.** AIEF's Level 1 → Level 2 sequencing and the `new-change`/`enrich` → review → `prompt` flow already enforce this at the process level.

## 3. Patterns to adapt (concept in, mechanism out)

Each of these carries a valuable idea wrapped in a mechanism AIEF must not copy. The adaptation target and its evidence gate are in the table (§6).

- **Roles → Profiles, never autonomous agents.** harness-sdd's `spec_author`/`implementer`/`reviewer` map almost 1:1 onto profiles AIEF already has as files (`profiles/analyst.md`, `developer.md`, `reviewer.md`) and onto ADR-012's accepted-but-unimplemented structured Profile model (goal/thinkingStyle/priorities/expectedOutputs/avoid). The idea worth keeping is **role isolation as a reasoning discipline** — the reviewer profile should not think like the implementer. The mechanism to discard is roles-as-processes: in AIEF a Profile is a lens a *human* selects for one composition, not a subagent that acts on its own.
- **Requirement → task → evidence traceability.** harness-sdd's numbered requirements each mapping to a test is a sharper version of what AIEF sketches with spec.md acceptance criteria and `[H]/[I]/[S]` classification. Adapting numbered-requirement traceability into the spec/evidence templates — and eventually into the closability contract's machine checks — is promising, but is exactly the kind of structure ADR-008 says must wait for observed friction (an adoption where an untraceable requirement caused a real defect or review gap).
- **Machine definition of done + executable verification.** `CHECKPOINTS.md` and `init.sh` are harness-sdd's answer to the same gap AIEF has already named: `verify` checks structure, not execution (documented limitation in [enrichment-workflow.md](enrichment-workflow.md)). This does not justify a new mechanism — it feeds the **existing closability/verify contract workstream** (ROADMAP-TO-1.0 workstream 4) and should be designed there, once, not imported separately.
- **"Think first, code second" as written rules → AGENTS.md / Profiles / Standards, placed by dimension.** The four Karpathy principles are good formulations — but AIEF's knowledge taxonomy (ADR-012) requires placing each in its correct dimension, not dumping them anywhere convenient: *Think Before Coding* (surface assumptions/tradeoffs) is reasoning discipline → Profile `thinkingStyle` and/or an AGENTS.md rule; *Simplicity First* and *Surgical Changes* are partially already in AIEF's AGENTS.md template ("Prefer simple solutions over clever ones", "Do not modify unrelated files", "Keep changes small") and could sharpen `base-standards.md`; *Goal-Driven Execution* aligns with spec.md's acceptance-criteria structure. Per the restrictions of this Change, AGENTS.md is not modified now — this is a placement map for later, evidence permitting.
- **Progressive disclosure of rules.** AIEF's prompt already points to files ("Read these files first") rather than inlining everything, and prompt growth is a standing watch item (Change 0024, ADR-012). If prompt-size friction is ever observed, harness-sdd's navigate-on-demand pattern is the direction — formalizing it before that friction exists would be speculative.
- **WIP limiting.** The *idea* of bounding work-in-progress has merit; the *mechanism* (`feature_list.json`) is a state file. If evidence ever shows teams drowning in open Changes, the AIEF-native expression would be a **derived** warning in `verify` (counting open Change directories) — never a tracked state file. Note the current validated flow deliberately has two open Changes after adoption (adopt-aief + Analysis), so a hard "one in progress" rule contradicts validated behavior as-is.

## 4. Patterns to reject

- **Agent runtime as core.** harness-sdd's `leader` orchestrating subagents through `.claude/agents/` is an agent framework. AIEF is not one — by product definition, by the Prime Directive ("AI assists. Humans decide."), and by [AIEF-1.0-READINESS.md](AIEF-1.0-READINESS.md), which explicitly withholds approval for autonomous execution. At most, a far-future *optional adapter* (the ADR-002/003 pattern) could describe how an agent harness consumes AIEF artifacts — never core, and not now.
- **Claude-specific dependency in core.** Both repos anchor on Claude-specific packaging (`.claude/agents/`, Claude Code plugin distribution). AIEF's core is assistant-agnostic by ADR-004: assistant differences end at the instruction-file name. Any borrowed content enters through AGENTS.md/Standards/Profiles (universal), with per-assistant files remaining thin pointers — never the reverse.
- **Session state files.** `progress/current.md` and `feature_list.json` are exactly the `.aief/state.json` that ADR-009 evaluated and rejected: a second source of truth that can drift, with per-person state made global. AIEF's derived active Change and git history already cover their purpose (`progress/history.md` ≈ git log + CHANGELOG, which AIEF already keeps).
- **"Skills" as a name for behavior rules.** The Karpathy repo calls its guidelines "skills"; in AIEF, Skills are *project-triggered technology knowledge* and — per ADR-012's hard rule — **"Skills must never define assistant behaviour."** Importing these guidelines into `skills-catalog.json` would blur the exact dimension boundary ADR-012 declares architecturally wrong regardless of convenience. Same idea, different shelf: AGENTS.md/Profiles/Standards.

## 5. Risks of copying without validating

1. **ADR-008 violation (the umbrella risk).** Neither repo's patterns have been exercised in an AIEF adoption. Every unvalidated import is speculative structure — the v4 failure mode AIEF was founded to escape.
2. **Reintroducing rejected state** (ADR-009) via `feature_list.json`/`progress/current.md` equivalents.
3. **Dimension blur** (ADR-012) by placing behavior rules in Skills, or project facts in Profiles, because that's where the source repo happened to keep them.
4. **Assistant lock-in** (ADR-004) by importing `.claude/`-shaped structure into core instead of adapters.
5. **Autonomy creep.** Adopting role-agent mechanics normalizes delegated implementation before the closability contract exists — inverting the readiness gates. The governance order is: machine-checkable gates first, delegation later; harness-sdd assumes the opposite maturity.
6. **Prompt bloat** (0024 watch item) if borrowed rules are inlined into composition rather than referenced.
7. **Fork maintenance.** Copying files creates a drift liability against upstream repos — the exact reason ADR-003 chose concepts-not-copies for SpecBoot.
8. **Naming collisions.** "Skills" (behavior vs knowledge) and "harness" (agent runtime vs workflow discipline) mean different things in these repos than in AIEF's ubiquitous language — imported terminology would degrade the glossary ([domain-model.md](domain-model.md) §1).

## 6. Decision table

| Fuente | Patrón | Adoptar | Adaptar | Rechazar | Razón | Evidencia requerida |
|---|---|:-:|:-:|:-:|---|---|
| harness-sdd | Comunicación basada en artefactos versionados | ✓ | | | Ya es el núcleo de AIEF (ADR-009); la convergencia independiente lo confirma — nada que construir | Ya validado (3 adopciones reales) |
| harness-sdd | Gate humano de aprobación antes de implementar | ✓ | | | Ya existe (Human Review Gate 0030 + verify/close); misma filosofía | Ya validado |
| harness-sdd | Separación de roles (spec_author/implementer/reviewer) | | ✓ | | Como Profiles elegidos por humanos (ADR-012), nunca como agentes autónomos; los roles mapean a profiles que AIEF ya tiene | Implementación de ADR-012 + re-validación en proyecto real |
| harness-sdd | Trazabilidad requirement numerado → test → evidencia | | ✓ | | Refuerza spec/evidence templates y el futuro closability contract; hoy es estructura especulativa | Una adopción real donde un requirement no trazable cause defecto o gap de review |
| harness-sdd | CHECKPOINTS.md — definición de done verificable por máquina | | ✓ | | Es el workstream 4 del roadmap (closability/verify contract); diseñarlo ahí, no importarlo aparte | Diseño del workstream 4 |
| harness-sdd | Verificación ejecutable (init.sh corre tests reales) | | ✓ | | `verify` hoy chequea estructura, no ejecución (limitación documentada); pertenece al mismo workstream 4 | Diseño del workstream 4 |
| harness-sdd | Límite de WIP (una feature en progreso) | | ✓ | | La idea sirve; la expresión AIEF sería un warning *derivado* en verify — y el flujo validado tiene 2 Changes abiertos tras adopción, así que la regla dura contradice comportamiento validado | Fricción observada por exceso de Changes abiertos en un equipo real |
| harness-sdd | Progressive disclosure de reglas | | ✓ | | El prompt ya referencia archivos en vez de inlinear; formalizar solo si aparece fricción de tamaño | Fricción de prompt-size (watch item de 0024) materializada |
| harness-sdd | Archivos de estado de sesión (feature_list.json, progress/current.md) | | | ✓ | Es el `.aief/state.json` que ADR-009 evaluó y rechazó; active Change es derivado; git/CHANGELOG ya cubren el historial | N/A — contradice un ADR aceptado |
| harness-sdd | Agent runtime / orquestación de subagentes como core | | | ✓ | AIEF no es un framework de agentes; Prime Directive + readiness doc prohíben ejecución autónoma; a lo sumo adapter opcional futuro (patrón ADR-002/003) | N/A — fuera de la identidad del producto |
| karpathy-skills | Think Before Coding (explicitar supuestos y tradeoffs) | | ✓ | | Disciplina de razonamiento → Profile `thinkingStyle` (ADR-012) y/o regla de AGENTS.md; AGENTS.md no se toca en este Change | Implementación de ADR-012, o evidencia de assistants asumiendo en silencio pese a las reglas actuales |
| karpathy-skills | Simplicity First / Surgical Changes | | ✓ | | Parcialmente ya en el template de AGENTS.md y base-standards; afinar redacción ahí cuando haya evidencia | Validación real mostrando sobre-ingeniería del assistant pese a las reglas existentes |
| karpathy-skills | Goal-Driven Execution (criterios verificables sobre tareas imperativas) | | ✓ | | Alineado con Acceptance Criteria de spec.md; refuerzo de templates de bajo riesgo, aún así gateado | Prueba en un Change real de este repo (dogfooding) antes de tocar templates |
| karpathy-skills | Distribución Claude-specific (plugin / CLAUDE.md-first) en core | | | ✓ | El core es assistant-agnostic (ADR-004); el contenido universal entra por AGENTS.md/Standards/Profiles; los archivos por-assistant siguen siendo delgados | N/A — contradice un ADR aceptado |
| karpathy-skills | "Skills" como nombre para reglas de comportamiento | | | ✓ | ADR-012: "Skills must never define assistant behaviour"; entrarían por la dimensión equivocada y romperían la ortogonalidad | N/A — contradice un ADR aceptado |

## 7. Summary of expected decisions

Confirmed by this evaluation, in the terms requested:

- **Adoptar** comunicación basada en artefactos — ya es AIEF; la convergencia externa se registra como validación independiente, no como trabajo nuevo.
- **Adaptar** roles como Profiles (ADR-012), nunca como agentes autónomos.
- **Adaptar** trazabilidad requirement → task → evidence — hacia templates y el closability contract, con su gate de evidencia.
- **Adaptar** "think first, code second" — repartido por dimensión (AGENTS.md / Profiles / Standards) según la taxonomía de ADR-012; AGENTS.md intacto por ahora.
- **Rechazar** agent runtime como core de AIEF.
- **Rechazar** dependencia Claude-specific en el core.

*Última actualización: 2026-07-09, Change [0033-evaluate-external-harness-patterns](../changes/0033-evaluate-external-harness-patterns/change.md). Las adaptaciones aquí recomendadas no están autorizadas a implementarse hasta que su evidencia requerida exista; cualquier decisión definitiva llega como ADR.*
