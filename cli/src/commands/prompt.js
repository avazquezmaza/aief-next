// Command handler: prompt (modularization, ninth and final slice). The
// largest handler; self-contained relative to every other command group —
// confirmed by grep. Fixes a real latent bug this modularization effort
// introduced in its fourth slice: prompt() calls promptSync() for its own
// ambiguous-assistant TTY choice, but promptSync() had been moved to
// bootstrap.js (unexported) without anything importing it here — a
// ReferenceError no test exercised (it requires a TTY and 2+ ambiguous
// assistant files). Fixed by promoting promptSync() to commands/shared.js
// (it already had two real consumers: bootstrap's SDD-provider choice, and
// this file's own assistant choice) rather than duplicating it.
import fs from "node:fs";
import path from "node:path";
import { detectProject, recommendSkills } from "../detect.js";
import { ASSISTANT_FILES, hasAssistant, assistantIds, assistantConfigPath, resolveAssistant, readProjectAssistantConfig } from "../core/domain/assistant-resolver.js";
import { resolveSkillRecommendations, resolveStandardRecommendations } from "../core/domain/ai-specs.js";
import { explain as explainWorkflow } from "../core/services/workflow-service.js";
import { buildSkillContext } from "../core/services/skill-context.js";
import { listSkillDescriptors, runSkill, isUnknownSkillError } from "../core/services/skill-service.js";
import { buildEvent, buildHookContext } from "../core/services/hook-context.js";
import { evaluateEvent } from "../core/services/hook-service.js";
import { resolveHarnessConfig, partitionOutcome, formatHookResultsBlock } from "../core/services/harness-service.js";
import {
  cwd, exists, read, section, parseArgs, printNext, resolveExplicitChange, resolveImplicitChange,
  changeType, evidenceIsPlaceholder, builtinStandardsList, appendHookLog, promptSync
} from "./shared.js";

// `aief prompt --set-assistant/--show-assistant/--clear-assistant` (Change
// 0061) manage knowledge/assistant.json — the only writes this file
// performs, and each is an explicit, separately-named flag (never implied
// by plain `aief prompt`). Kept next to prompt() rather than as a new
// command verb: ADR-013 requires every AIEF 3.1 Change to name what it
// removes/merges, and this Change removes nothing — it only fixes an
// existing asymmetry in prompt()'s own resolution — so it extends the
// existing surface instead of adding one (see ADR-031).
function setAssistantPreference(requested) {
  section("AIEF Assistant"); console.log("Purpose: persist the project's default assistant to knowledge/assistant.json. This writes a file.\n");
  if (requested === true || !String(requested || "").trim()) {
    console.error(`--set-assistant requires a value.\n\nKnown assistants:\n\n${assistantIds().map((a) => `- ${a}`).join("\n")}\n\nExample: aief prompt --set-assistant claude`);
    process.exitCode = 1;
    return;
  }
  const id = String(requested).toLowerCase();
  if (!hasAssistant(id)) {
    console.error(`Unknown assistant "${requested}".\n\nKnown assistants:\n\n${assistantIds().map((a) => `- ${a}`).join("\n")}`);
    process.exitCode = 1;
    return;
  }
  const configPath = assistantConfigPath(process.cwd());
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, `${JSON.stringify({ defaultAssistant: id, updatedAt: new Date().toISOString(), configuredBy: "aief prompt --set-assistant" }, null, 2)}\n`, "utf8");
  console.log(`Saved: knowledge/assistant.json now sets the default assistant to "${id}".`);
  printNext("aief prompt (uses the saved preference automatically)");
}
function clearAssistantPreference() {
  section("AIEF Assistant"); console.log("Purpose: remove the project's saved default assistant from knowledge/assistant.json. This writes (deletes) a file.\n");
  const configPath = assistantConfigPath(process.cwd());
  if (!fs.existsSync(configPath)) { console.log("knowledge/assistant.json does not exist — nothing to clear."); return; }
  fs.rmSync(configPath);
  console.log("Removed: knowledge/assistant.json. Future runs fall back to AIEF_ASSISTANT, passive detection, or an interactive prompt.");
}
function showAssistantPreference() {
  section("AIEF Assistant"); console.log("Purpose: show the configured preference, the resolved assistant, and where it came from. Writes nothing.\n");
  const projectCwd = process.cwd();
  const projectConfig = readProjectAssistantConfig(projectCwd);
  console.log(`Configured preference (knowledge/assistant.json): ${projectConfig ? (projectConfig.error ? `invalid — ${projectConfig.error}` : projectConfig.assistantId) : "not set"}`);
  const envRaw = typeof process.env.AIEF_ASSISTANT === "string" ? process.env.AIEF_ASSISTANT.trim().toLowerCase() : "";
  const resolution = resolveAssistant({ env: envRaw || undefined, cwd: projectCwd });
  if (resolution.error) { console.log(`Resolved assistant: none — ${resolution.error}`); process.exitCode = 1; return; }
  if (resolution.source === "ambiguous") { console.log(`Resolved assistant: ambiguous — multiple native files detected (${resolution.ambiguous.join(", ")}); aief prompt will ask interactively or fail in non-interactive shells.`); return; }
  if (resolution.source === "none") { console.log("Resolved assistant: none — no override, AIEF_ASSISTANT, saved preference, or native assistant file found; aief prompt uses a generic, AGENTS.md-only prompt."); return; }
  const sourceLabel = { env: "AIEF_ASSISTANT (local, not versioned)", "project-config": "knowledge/assistant.json (project preference)", detected: "passive detection (native file present)" }[resolution.source] || resolution.source;
  console.log(`Resolved assistant: ${resolution.assistantId} (source: ${sourceLabel})`);
}
export function prompt(args) {
  const parsed = parseArgs("prompt", args);
  if (!parsed) return;
  const profile = typeof parsed.profile === "string" ? parsed.profile : "developer";
  if (parsed["set-assistant"] !== undefined) return setAssistantPreference(typeof parsed["set-assistant"] === "string" ? parsed["set-assistant"] : "");
  if (parsed["clear-assistant"] === true) return clearAssistantPreference();
  if (parsed["show-assistant"] === true) return showAssistantPreference();
  // Assistant selection: positional (aief prompt gemini) or --assistant; the
  // explicit flag wins when both are given. Unknown values are a hard error —
  // never a silent fallback. This branch is unchanged from before Change
  // 0061 — an explicit override always wins, full stop.
  const requested = typeof parsed.assistant === "string" ? parsed.assistant : (parsed._[0] || "");
  let assistant = requested.toLowerCase();
  if (requested && !hasAssistant(assistant)) {
    console.error(`Unknown assistant "${requested}".\n\nKnown assistants:\n\n${assistantIds().map((a) => `- ${a}`).join("\n")}\n\nIf you meant a role, use:\n\n--profile ${requested}`);
    process.exitCode = 1;
    return;
  }
  // Change 0112: an assistant with no native file present gets the generic,
  // AGENTS.md-only prompt — never another assistant's file (previously this
  // silently substituted CLAUDE.md when it existed, which docs/cli.md never
  // actually documented and which would have been flatly wrong for Kiro).
  if (assistant && !exists(ASSISTANT_FILES[assistant])) console.warn(`Note: ${ASSISTANT_FILES[assistant]} not found in this project; using the generic, AGENTS.md-only prompt instead.`);
  // Change 0061: with no explicit override, resolve symmetrically through
  // AIEF_ASSISTANT -> knowledge/assistant.json -> passive detection (every
  // registered assistant's native file checked the same way — no assistant
  // gets a structural advantage). Only when 2+ native files are found and
  // neither an env var nor a saved preference disambiguates them does this
  // reach the TTY/non-interactive branch below (AR-R5/AR-R6). Zero files
  // found is not an error — it is the existing, valid generic-prompt case.
  let resolutionNote = "";
  if (!requested) {
    const envRaw = typeof process.env.AIEF_ASSISTANT === "string" ? process.env.AIEF_ASSISTANT.trim().toLowerCase() : "";
    const resolution = resolveAssistant({ env: envRaw || undefined, cwd: process.cwd() });
    if (resolution.error) {
      console.error(`Could not resolve an assistant: ${resolution.error}\n\nFix this with:\n\n- AIEF_ASSISTANT=<name> aief prompt\n- aief prompt --set-assistant <name>\n- aief prompt <name>`);
      process.exitCode = 1;
      return;
    }
    if (resolution.source === "ambiguous") {
      if (process.stdin.isTTY) {
        const choices = resolution.ambiguous;
        console.log(`Multiple assistant files detected: ${choices.join(", ")}.`);
        const answer = promptSync(`Which one should this prompt target — ${choices.join("/")}? `).toLowerCase();
        if (!choices.includes(answer)) {
          console.error(`No valid selection made among: ${choices.join(", ")}.`);
          process.exitCode = 1;
          return;
        }
        assistant = answer;
        resolutionNote = `\nNote: "${assistant}" was chosen interactively for this run only — nothing was saved. Run "aief prompt --set-assistant ${assistant}" to persist it.\n`;
      } else {
        console.error(`Multiple assistant files detected (${resolution.ambiguous.join(", ")}) and no interactive terminal to choose.\n\nResolve this by:\n\n- aief prompt <name>\n- AIEF_ASSISTANT=<name> aief prompt\n- aief prompt --set-assistant <name>`);
        process.exitCode = 1;
        return;
      }
    } else {
      assistant = resolution.assistantId || "";
    }
  }
  // Change 0112: no cross-assistant fallback — an assistant with no native
  // file present gets no assistant-file line at all (generic, AGENTS.md-only
  // prompt), matching the warning above and docs/cli.md's documented
  // behavior for every registered assistant, not just the ones that predate
  // this fix.
  const assistantFile = ASSISTANT_FILES[assistant] && exists(ASSISTANT_FILES[assistant]) ? ASSISTANT_FILES[assistant] : "";
  section("AIEF Prompt"); console.log(`Purpose: generate a ready-to-paste prompt for your AI assistant. Writes nothing.\n${resolutionNote}`);
  // Entrega 5 (Change 0047, ADR-019) — Skills Runtime, additive flag, no new
  // command verb (ADR-015). A static registry listing: no Change is
  // resolved, no Skill is run, no SDD provider is touched — only
  // listSkillDescriptors()'s deterministic, context-free metadata.
  if (parsed["list-skills"] === true) {
    const descriptors = listSkillDescriptors();
    console.log("Registered Skills:\n");
    for (const d of descriptors) console.log(`- ${d.id} (v${d.version}): ${d.title} — ${d.description}`);
    return;
  }
  // Shared selection: composing a prompt for the wrong Change is a mutation of
  // the workflow in practice, so with multiple open Changes the selection must
  // be explicit — never the chronologically latest one by accident.
  const changeDir = typeof parsed.change === "string"
    ? resolveExplicitChange(parsed.change)
    : resolveImplicitChange(`aief prompt${assistant ? ` ${assistant}` : ""}`);
  if (!changeDir) { printNext("aief status (list open Changes)", "aief new-change <name>", "aief analyze"); return; }
  const changeName = path.relative(process.cwd(), changeDir);
  // Entrega 5 (Change 0047, ADR-019) — `--skill <id>` selects exactly one
  // registered Skill. Unknown id / a runtime "invalid"/"failed" result are
  // the only operational-failure cases (exit 1, before any prompt text is
  // printed — UX-R29-style discipline, restated as SK-R29 for Skills); every
  // other outcome (ready/not_applicable/blocked/unsupported) still prints
  // the full prompt (exit 0), honestly reporting the Skill's own status
  // instead of silently omitting it (SK-R41).
  const requestedSkillId = typeof parsed.skill === "string" ? parsed.skill : "";
  let skillSection = "";
  if (requestedSkillId) {
    const skillContext = buildSkillContext(changeDir, cwd());
    let result;
    try {
      result = runSkill(requestedSkillId, skillContext);
    } catch (err) {
      if (!isUnknownSkillError(err)) throw err;
      console.error(`Unknown Skill "${requestedSkillId}".\n\nKnown Skills:\n\n${listSkillDescriptors().map((d) => `- ${d.id}`).join("\n")}`);
      process.exitCode = 1;
      return;
    }
    if (result.status === "invalid" || result.status === "failed") {
      console.error(`Skill "${requestedSkillId}" could not be run: ${result.summary}${result.errors.length ? `\n${result.errors.join("\n")}` : ""}`);
      process.exitCode = 1;
      return;
    }
    skillSection = renderSkillSection(result);
  }
  // CRLF/LF tolerant, via the shared changeType() helper — a Change written on
  // Windows must still be recognized as Analysis/Enrichment.
  const type = changeType(changeDir);
  const isAnalysis = type === "analysis";
  const isEnrichment = type === "enrichment";
  const isDefinition = type === "definition";
  const standardItems = resolveStandardRecommendations(builtinStandardsList(), process.cwd()).items;
  const project = detectProject();
  // Change 0069: mirrors standardItems above — an ai-specs/skills/ addition
  // or override (already visible in `aief doctor`, Change 0054/ADR-024) now
  // also reaches the Skill context actually sent to an assistant. Builtin
  // fields (promptContext/commonRisks/name) are reattached by id after
  // resolving, since resolveSkillRecommendations()'s generic output only
  // carries id/description/because/source/path/overridesBuiltin — swapping
  // it in directly would silently drop every builtin's operational content.
  const builtinSkills = recommendSkills(project);
  const builtinSkillById = new Map(builtinSkills.map((s) => [s.id, s]));
  // Change 0072: a builtin recommended only from a "weak" (keyword-in-doc)
  // signal is tagged here — the one place this reasoning actually reaches
  // an assistant. "strong" (real dependency) and the no-signals fallback
  // (confidence: null, an honest statement, not a guess) are untagged,
  // keeping output byte-identical to before this Change in both cases.
  const skills = resolveSkillRecommendations(builtinSkills, process.cwd()).items.map((item) => item.source === "builtin"
    ? { ...builtinSkillById.get(item.id), tag: builtinSkillById.get(item.id).confidence === "weak" ? " (weak signal — confirm before relying on this)" : "" }
    // Change 0110: `path` carried through (ai-specs.js already resolves it)
    // so skillsBlock below can point the assistant at the real file — a
    // project-sourced Skill (e.g. a Claude Code / Kiro SKILL.md) has no
    // `promptContext` (that field only ever comes from AIEF's own built-in
    // skills-catalog.json entries) and previously left the assistant with
    // no indication of where its actual content lives.
    : { id: item.id, name: item.id, path: item.path, tag: item.overridesBuiltin ? " [project override]" : " [project]" });
  // Re-run guardrail: derived from files, no hidden state. Empty or template
  // ("Pending.") evidence is the normal fresh case and gets no warning.
  const evidenceContent = read(path.join(changeDir, "evidence.md"));
  const hasRealEvidence = evidenceContent.trim().length > 0 && !evidenceIsPlaceholder(changeDir);
  const evidenceGuard = hasRealEvidence ? `\nevidence.md already exists and has real content:\n\n- Do not overwrite it blindly.\n- Review and amend only if needed; preserve existing validated evidence.\n- If no changes are needed, report that the evidence was re-verified.\n` : "";
  const feedbackNote = `\nWhere results belong:\n\n- Project evidence belongs in ${changeName}/evidence.md.\n- Feedback about AIEF or the tooling goes in your response to the user, not in the project evidence, unless the Change explicitly asks for a separate feedback file.\n`;
  // Change 0055/ADR-025: a builtin renders as `- knowledge/standards/<id>.md`
  // — reconstructing today's exact `- knowledge/standards/${file}` string
  // id-for-id, so a project with no ai-specs/standards/ gets byte-identical
  // output. A resolving project standard renders with its own real path
  // (never the built-in's), tagged so the assistant knows which file
  // actually governs.
  const standardsBlock = standardItems.length ? `\nProject standards to follow:\n\n${standardItems.map((s) => s.source === "builtin"
    ? `- knowledge/standards/${s.id}.md`
    : `- ai-specs/standards/${s.id}.md${s.overridesBuiltin ? " [project override]" : " [project]"}`).join("\n")}\n` : "";
  // Change 0110: a project-sourced Skill with no `promptContext` (every one
  // does not carry AIEF's own catalog metadata — that field only ever comes
  // from skills-catalog.json) used to fall through to a generic "no
  // operational content yet" line with no indication of where its actual
  // content lives — the assistant had no way to find e.g. a 140-line
  // camel-quarkus SKILL.md AIEF had already discovered and recommended by
  // id. Mirrors standardsBlock's own precedent immediately above: point at
  // the real, relative path so the assistant knows to go read it.
  const skillsBlock = skills.length ? `\nRecommended Skills — contextual knowledge for this project (included as context, not executed):\n\n${skills.map((s) => s.promptContext
    ? `- ${s.name || s.id}${s.tag || ""}: ${s.promptContext}${(s.commonRisks || []).length ? `\n  Watch out for: ${s.commonRisks.join("; ")}.` : ""}`
    : s.path
      ? `- ${s.name || s.id}${s.tag || ""}: recommended for this project — read ${path.relative(process.cwd(), s.path)} for its full instructions before starting.`
      : `- ${s.name || s.id}${s.tag || ""}: recommended for this project, but it has no operational content yet — treat it as a topic to keep in mind.`).join("\n")}\n` : "";
  // Entrega 4 (Change 0046, ADR-018 §"work") — additive Workflow/SDD context,
  // same discipline as standardsBlock/skillsBlock: empty string, no header,
  // when the Change never opted in (no track / no sdd). Purely informational
  // — this text never claims work was performed, never marks a task done,
  // never asserts a gate passed or a transition occurred (UX-R10).
  const { change: promptChange, workflow: promptWorkflow, sdd: promptSdd } = explainWorkflow(changeDir, cwd());
  const workflowBlock = promptWorkflow && promptWorkflow.kind === "resolved"
    ? `\nWorkflow context (read-only — reflects current state, does not advance it):\n\nStage: ${promptWorkflow.state.stage}\nNext: ${promptWorkflow.state.nextAction === null ? "none (closed)" : promptWorkflow.state.nextAction}\n${promptWorkflow.state.blockers.length ? `Blockers:\n${promptWorkflow.state.blockers.map((g) => `- ${g.id}: ${g.status} — ${g.reason}`).join("\n")}\n` : ""}`
    : "";
  const sddBlock = promptSdd && !promptSdd.error
    ? `\nSDD context (provider: ${promptSdd.providerId}, readiness: ${promptSdd.readiness.status}):\n\n${promptSdd.tasks.filter((t) => !t.completed).length
        ? `Pending tasks (from the SDD provider, not yet marked complete):\n${promptSdd.tasks.filter((t) => !t.completed).map((t) => `- ${t.id ? `${t.id} ` : ""}${t.text}`).join("\n")}\n`
        : ""}`
    : "";
  // Entrega 6 (Change 0048, ADR-020) — the `prompt.prepared` event fires here:
  // after every existing context block (standards/Skill Catalog/Workflow/SDD/
  // Skill Runtime) is computed, before the final render. Hook Context reuses
  // promptChange/promptWorkflow/promptSdd — the exact same explainWorkflow()
  // call above, never a second one (HK-R20). Zero writes, strictly additive.
  const promptPreparedEvent = buildEvent("prompt.prepared", "prompt");
  const hookOutcome = evaluateEvent(promptPreparedEvent, buildHookContext(promptPreparedEvent, {
    project, change: promptChange, workflow: promptWorkflow, sdd: promptSdd,
    operation: { input: { profile, assistant, changeName }, result: null }
  }));
  // Change 0056/ADR-026: a Change's manifest.harness (absent for every
  // Change that predates this) decides which Hook results are excluded
  // (disabled) and whether this invocation is logged to hooks.md — never
  // which Hooks were evaluated (hook-service.js/hooks/index.js untouched).
  const harnessConfig = resolveHarnessConfig(promptChange.manifest);
  const { active: activeHookResults } = partitionOutcome(hookOutcome, harnessConfig);
  const hookBlock = formatHookResultsBlock(activeHookResults);
  if (harnessConfig.log) appendHookLog(changeDir, { operation: "prompt", event: hookOutcome.event, entries: activeHookResults });
  console.log("Copy this prompt into your AI assistant:"); console.log("─".repeat(60));
  console.log(`Use AGENTS.md.\n\nAct as the ${profile} profile.\n\nWork only on:\n\n${changeName}\n\nRead these files first:\n\n- ${changeName}/change.md\n- ${changeName}/spec.md\n- ${changeName}/tasks.md\n${assistantFile ? `- ${assistantFile}` : ""}\n${exists("README.md") ? "- README.md" : ""}\n${exists("knowledge/skills.md") ? "- knowledge/skills.md" : ""}\n${standardsBlock}${skillsBlock}${workflowBlock}${sddBlock}${skillSection}${hookBlock}${evidenceGuard}${feedbackNote}\nRespect the scope in change.md and the acceptance criteria in spec.md.\n\n${isEnrichment ? `This is an Enrichment Change (Requirement Source: see change.md).\n\nDo not implement application code.\nDo not modify the external requirement source — it is read-only.\nThis Change Requires Human Review before implementation. Help the human by:\n\n- reviewing the Normalized Requirement and [H]/[I]/[S] classification in spec.md;\n- answering or refining Open Questions;\n- never marking Human Review tasks done yourself — only a human clears them.\n` : isAnalysis ? `This is an Analysis Change.\n\nDo not modify application source code.\nAnalyze the project and complete or amend:\n\n- ${changeName}/evidence.md\n\nDo not mark tasks.md items yourself unless the Change or the user explicitly asks — instead, tell the user which tasks appear complete.\n` : isDefinition ? `This is a Definition Change (pre-implementation).\n\nDo not implement application code.\nResolve project-definition questions in change.md: Context, Business/Product Constraints, Known Requirements, Assumptions, Open Questions, Decisions Required.\nExplain options and trade-offs in Options Considered; write a Recommendation only when evidence supports one.\nEvery architecture or product Decision requires explicit human approval — never fill in the Decision (human) section yourself, and never mark a task under "Human Approval" done yourself.\nOnce a decision is approved, record it in knowledge/decisions.md and update Implementation Prerequisites / Follow-up Changes.\n\nWhen an item in a bullet list is not simply known or missing, mark it explicitly at the end of the line — never leave the reader to infer this from prose:\n\n- "(decision required)" — a real choice exists and needs a Recommendation.\n- "(ambiguous)" — the requirement/answer is genuinely unclear, not just undecided.\n- "(deferred)" — intentionally left for the implementation Change, not for this one.\n- "(human)" — needs explicit human approval before it counts as decided (same convention as tasks.md).\n\n\`aief status --change ${changeName}\` reports Definition readiness (known/missing sections, and every marked item) derived only from these markers — it never invents a category from prose.\n` : `Implement only the requested scope.\nAfter implementation, verify acceptance criteria and update ${changeName}/evidence.md.\n`}`); console.log("─".repeat(60));
}
// Renders one Skill's result as a clearly-labeled, additive prompt section
// (Entrega 5, design.md §9) — the ONLY place this framing text is written,
// so no individual Skill's own output can phrase itself as a completion
// claim (SK-R25/R42). `ready` is the only status with real instructions to
// show; every other reachable status here (not_applicable/blocked/
// unsupported) is rendered as one honest line instead of a fabricated
// section (SK-R41) — `invalid`/`failed` never reach this function (prompt()
// exits 1 before calling it).
function renderSkillSection(result) {
  const header = `\n─── Skill: ${result.skill} (${result.status}) ───\n`;
  if (result.status === "ready") {
    return `${header}This is guidance for a human or assistant to follow — it was not executed, and following it is not evidence that the work it describes was done.\n\n${result.instructions}\n`;
  }
  return `${header}${result.summary}\n`;
}
