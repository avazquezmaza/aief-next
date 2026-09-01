import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { run, commandExists } from "./process-utils.js";
import {
  cwd, exists, read, writeFile, slugify,
  nextChangeId, getChangeDirs, isClosed, changeType, openChangeDirs, invalidManifestChanges,
  resolveWorkflowFor, workflowChanges, sddChanges, buildProjectGraph,
  resolveExplicitChange, resolveImplicitChange,
  printNext, parseCommandArgs, parseArgs, section,
  evidenceTemplate, evidenceIsPlaceholder,
  appendHookLog,
  analysisContextSection, analysisChangeFiles, definitionChangeFiles, genericChangeFiles, createChange,
  builtinStandardsList
} from "./commands/shared.js";
import { help, commandRemoved, useProfile, release, printVersion } from "./commands/misc.js";
import { newChange } from "./commands/new-change.js";
import { enrich } from "./commands/enrich.js";
import { propose } from "./commands/propose.js";
import { analyze } from "./commands/analyze.js";
import { bootstrap } from "./commands/bootstrap.js";
import { verify } from "./commands/verify.js";
import { detectProject, recommendSkills } from "./detect.js";
import { loadChange, isClosedContent } from "./core/domain/change.js";
import { loadChangeUnified } from "./core/domain/change-loader.js";
import { checkChangeReadiness } from "./core/services/change-verifier.js";
import { ASSISTANT_FILES, hasAssistant, assistantIds, assistantConfigPath, resolveAssistant, readProjectAssistantConfig } from "./core/domain/assistant-resolver.js";
import { resolveSkillRecommendations, resolveStandardRecommendations, deriveResourceDescription } from "./core/domain/ai-specs.js";
import { inspect as inspectWorkflow, nextAction, explain as explainWorkflow } from "./core/services/workflow-service.js";
import { buildSkillContext } from "./core/services/skill-context.js";
import { listSkillDescriptors, runSkill, isUnknownSkillError } from "./core/services/skill-service.js";
import { buildEvent, buildHookContext } from "./core/services/hook-context.js";
import { evaluateEvent } from "./core/services/hook-service.js";
import { resolveHarnessConfig, partitionOutcome, describeHarnessRegistry, formatHookResultsBlock } from "./core/services/harness-service.js";
import { resolveLoopConfig, countPreviousAttempts } from "./core/services/loop-service.js";
import { selectNextChange } from "./core/services/next-change-service.js";
import { parseJUnitReport, renderCapturedVerification } from "./core/domain/junit-report.js";
import { analyzeDefinitionSections, DEFINITION_SECTIONS } from "./core/domain/definition-enrichment.js";
import { replaceOrAppendEvidenceSection } from "./core/domain/evidence-sections.js";


// The sole caller is doctor() (AIEF 3.1, Change 0054/ADR-024) — bootstrap/
// Called from doctor() only (Change 0064) — informational, read-only: reads
// GEMINI_API_KEY's presence and nothing else. Never calls Gemini, never
// validates the key, never logs its value, never writes it anywhere. Exists
// so `doctor` can report which mode of the graphify-ast-architecture Skill
// (recommended via skills-catalog.json, printSkills() below) an assistant
// would currently use — the CLI itself never executes either mode.
function printGraphEngineStatus() {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  console.log(hasGeminiKey
    ? "[✓] Graphify Semantic Engine available (GEMINI_API_KEY set)"
    : "[✓] AST Engine active (no GEMINI_API_KEY — static, offline, $0)");
}
// analyze/prompt all call recommendSkills() directly and are unaffected by
// options.verbose or by a project's ai-specs/skills/*.md.
function printSkills(project, options = {}) {
  const { verbose = false } = options;
  const { items, warnings, invalidCount } = resolveSkillRecommendations(recommendSkills(project), process.cwd());
  console.log("Recommended Skills:");
  for (const skill of items) {
    const tag = skill.source === "project" ? (skill.overridesBuiltin ? " [project override]" : " [project]") : "";
    console.log(`- ${skill.id}${tag}: ${skill.description}`);
    for (const reason of skill.because) console.log(`    because: ${reason}`);
    if (verbose) {
      console.log(`    source: ${skill.source}`);
      if (skill.path) console.log(`    path: ${path.relative(process.cwd(), skill.path)}`);
      if (skill.overridesBuiltin) console.log(`    overrides: built-in skill "${skill.id}"`);
    }
  }
  if (verbose) {
    if (warnings.length) {
      console.log("\nai-specs warnings:");
      for (const warning of warnings) console.log(`- ${warning}`);
    }
  } else if (invalidCount) {
    console.log(`\n⚠ ${invalidCount} ai-specs resource(s) ignored — see aief doctor --verbose`);
  }
}
// Called from doctor() (Change 0055/ADR-025) — fully conditional on
// aiSpecsStandardsPresent, unlike printSkills(): unlike Skills (Change
// 0054), `aief doctor` never showed anything about standards before this
// Change, so a project with no ai-specs/standards/ must see no new section
// at all, not merely an empty one, to stay byte-identical.
function printStandardsReport(options = {}) {
  const { verbose = false } = options;
  const { items, warnings, invalidCount, aiSpecsStandardsPresent } = resolveStandardRecommendations(builtinStandardsList(), process.cwd());
  if (!aiSpecsStandardsPresent) return;
  console.log("\nStandards:");
  for (const standard of items) {
    const tag = standard.source === "project" ? (standard.overridesBuiltin ? " [project override]" : " [project]") : "";
    console.log(`- ${standard.id}${tag}: ${standard.description}`);
    for (const reason of standard.because) console.log(`    because: ${reason}`);
    if (verbose) {
      console.log(`    source: ${standard.source}`);
      if (standard.path) console.log(`    path: ${path.relative(process.cwd(), standard.path)}`);
      if (standard.overridesBuiltin) console.log(`    overrides: built-in standard "${standard.id}"`);
    }
  }
  if (verbose) {
    if (warnings.length) {
      console.log("\nai-specs warnings (standards):");
      for (const warning of warnings) console.log(`- ${warning}`);
    }
  } else if (invalidCount) {
    console.log(`\n⚠ ${invalidCount} ai-specs standard resource(s) ignored — see aief doctor --verbose`);
  }
}
// Called from doctor() only under --verbose (Change 0056/ADR-026) — the
// static, project-wide Hook Registry (hook.js/hooks/index.js, unmodified).
// Unlike printSkills()/printStandardsReport(), there is no non-verbose
// content at all here: `aief doctor`'s default output has never shown
// anything about Hooks, so adding an unconditional section would change
// every project's default output (the same compatibility bar Change 0055
// applied to Standards) — gating the whole section behind --verbose (which
// has no backward-compatibility promise, Change 0054/0055 precedent) keeps
// the default byte-identical while still making the registry discoverable.
function printHarnessRegistry() {
  const descriptors = describeHarnessRegistry();
  console.log("\nHarness:");
  console.log(`${descriptors.length} Hook(s) registered (built-in, not user-authored — see docs/workflow.md#hooks-runtime):`);
  for (const d of descriptors) {
    console.log(`- ${d.id}: fires on ${d.events.join(", ")} — ${d.description}`);
  }
}
// Called from doctor() only under --verbose (Change 0057/ADR-027) —
// read-only scan of open Changes for `loop.verify` configuration. Never
// writes loop.md (only `aief verify --change <id>` does). Absent entirely
// when no open Change configures Loop, so `doctor --verbose` for a project
// that doesn't use Loop is unaffected by this Change (same conditional
// discipline as Change 0056's Harness-in-doctor and Change 0055's
// Standards-in-doctor).
function printLoopRegistry() {
  const entries = [];
  for (const dir of openChangeDirs()) {
    const change = loadChangeUnified(dir);
    const config = resolveLoopConfig(change.manifest);
    if (!config.configured) continue;
    const logPath = path.join(dir, "loop.md");
    const attempt = countPreviousAttempts(fs.existsSync(logPath) ? read(logPath) : "");
    entries.push({ id: change.basename, attempt, maxRetries: config.maxRetries });
  }
  if (!entries.length) return;
  console.log("\nLoop:");
  for (const e of entries) {
    console.log(`- ${e.id}: ${e.attempt} attempt(s) so far, limit ${e.maxRetries} — see aief verify --change ${e.id}`);
  }
}
function printSignals(project) {
  console.log("\nDetected project signals:");
  if (!project.signals.length) { console.log("(none)"); return; }
  for (const signal of project.signals) {
    console.log(`✓ ${signal.id} (${signal.signal}): ${signal.reasons.join("; ")}`);
  }
}
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
function prompt(args) {
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
  if (assistant && !exists(ASSISTANT_FILES[assistant])) console.warn(`Note: ${ASSISTANT_FILES[assistant]} not found in this project${exists("CLAUDE.md") ? "; including CLAUDE.md instead" : ""}.`);
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
  const assistantFile = ASSISTANT_FILES[assistant] && exists(ASSISTANT_FILES[assistant]) ? ASSISTANT_FILES[assistant] : (exists("CLAUDE.md") ? "CLAUDE.md" : "");
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
    : { id: item.id, name: item.id, tag: item.overridesBuiltin ? " [project override]" : " [project]" });
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
  const skillsBlock = skills.length ? `\nRecommended Skills — contextual knowledge for this project (included as context, not executed):\n\n${skills.map((s) => s.promptContext
    ? `- ${s.name || s.id}${s.tag || ""}: ${s.promptContext}${(s.commonRisks || []).length ? `\n  Watch out for: ${s.commonRisks.join("; ")}.` : ""}`
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
// Appends one dated section to <changeDir>/hooks.md (Change 0056/ADR-026,
// spec.md R8) — only ever called when the targeted Change's own
// manifest.harness.log is true. Creates the file with a header on first
// use; every subsequent call appends, never truncates or rewrites a prior
// section (same append discipline as evidence.md's own history). `entries`
// is `active` results only (already excludes disabled Hooks); every status
// is logged, not just `matched` — the whole point of an audit log.
function markClosed(changeDir) {
  const file = path.join(changeDir, "change.md");
  const stamp = `Closed (${new Date().toISOString().slice(0, 10)})`;
  let content = read(file);
  if (/^##\s*status\s*$/im.test(content)) content = content.replace(/(^##\s*Status\s*(?:\r?\n)+)[^\r\n]*/im, `$1${stamp}`);
  else content = `${content.replace(/\s*$/, "")}\n\n## Status\n\n${stamp}\n`;
  writeFile(file, content, true);
  // Checked against change.md directly, not isClosed() — see the comment on
  // isClosed() above (Change 0043 review finding B1). close() only ever
  // writes change.md; verifying success must read the same file it wrote.
  return isClosedContent(read(file));
}
function close(args) {
  const parsed = parseArgs("close", args);
  if (!parsed) return;
  section("AIEF Close");
  console.log("Purpose: check that the active Change is ready and, with --yes, mark it Closed in change.md.\n");
  // Closing is the most destructive workflow command: with multiple open
  // Changes it never picks one implicitly — selection must be explicit.
  const changeDir = typeof parsed.change === "string"
    ? resolveExplicitChange(parsed.change)
    : resolveImplicitChange("aief close --yes");
  if (!changeDir) { printNext("aief status (list open Changes)", "aief new-change <name>"); return; }
  const name = path.relative(process.cwd(), changeDir);
  let change = loadChange(changeDir);
  if (change.closed) { console.log(`${name} is already closed.`); return; }
  // --evidence-from <path> (Change 0071): AIEF never executes a test, a
  // command, or reaches the network (ADR-021) — this only reads a report
  // file the user's own test runner/CI already produced, and fills in
  // evidence.md's ## Verification section with it. Runs before the
  // readiness check below, so a freshly-captured report is reflected in it.
  if (typeof parsed["evidence-from"] === "string") {
    const reportPath = parsed["evidence-from"];
    const resolvedPath = path.resolve(process.cwd(), reportPath);
    if (!fs.existsSync(resolvedPath)) { console.error(`--evidence-from: no such file: ${reportPath}`); process.exitCode = 1; return; }
    let reportContent;
    try { reportContent = fs.readFileSync(resolvedPath, "utf8"); } catch (err) { console.error(`--evidence-from: could not read ${reportPath}: ${err.message}`); process.exitCode = 1; return; }
    const report = parseJUnitReport(reportContent);
    if (!report) { console.error(`--evidence-from: no <testsuite> element found in ${reportPath}. Supported format: JUnit XML.`); process.exitCode = 1; return; }
    const verificationBody = renderCapturedVerification(reportPath, report);
    const evidencePath = path.join(changeDir, "evidence.md");
    const currentEvidence = read(evidencePath);
    const updatedEvidence = replaceOrAppendEvidenceSection(currentEvidence, "Verification", "Captured from `", verificationBody);
    if (updatedEvidence !== currentEvidence) {
      writeFile(evidencePath, updatedEvidence, true);
      console.log(`Captured ${report.tests} test(s) (${report.failures} failed, ${report.errors} error(s)) from ${reportPath} into ${name}/evidence.md's Verification section.\n`);
      change = loadChange(changeDir); // re-read: evidenceState may have changed
    }
  }
  // Same rules aief verify uses (core/services/change-verifier.js), never a
  // second, diverging implementation of "is this Change ready".
  const problems = checkChangeReadiness(change);
  console.log(`Change: ${name}\n`);
  if (!problems.length) console.log("✓ All readiness checks passed.");
  else for (const problem of problems) console.log(`○ ${problem}`);
  if (!parsed.yes) { printNext(problems.length ? "resolve the items above, then: aief close --yes" : "aief close --yes"); return; }
  if (problems.length) { console.error("\nNot closed: resolve the items above first."); process.exitCode = 1; return; }
  if (!markClosed(changeDir)) { console.error(`\nCould not mark ${name} as Closed — check the Status section in change.md.`); process.exitCode = 1; return; }
  console.log(`\n✓ Closed ${name}.`);
  printNext("git status", "aief status");
}
// Renamed from status() (Entrega 4, Change 0046): this is the full-project
// overview — unchanged behavior, unchanged output. status() below is now
// the actual `aief status` command entry point, which parses --change/
// --next and delegates here only when neither flag is present (Path B,
// ADR-018 — no new command, status evolves compatibly).
function statusOverview(project = detectProject(), showNext = true) {
  section("AIEF Status"); console.log("Purpose: show current AIEF adoption status. Writes nothing.\n");
  const required = [["README", exists("README.md")], ["AGENTS", exists("AGENTS.md")], ["Changes", exists("changes")]];
  for (const [n, ok] of required) console.log(`${ok ? "✓" : "!"} ${n}`);
  const optional = [["Knowledge", exists("knowledge")], ["Profiles", exists("profiles")], ["Navigator", exists("NAVIGATOR.md") || exists("docs/navigator/README.md")], ["OpenSpec adapter", exists("adapters/openspec")], ["Specboot adapter", exists("adapters/specboot")]];
  for (const [n, ok] of optional) console.log(ok ? `✓ ${n}` : `· ${n}: not present (optional)`);
  const changes = getChangeDirs();
  console.log(`\nChanges: ${changes.length}`);
  for (const d of changes.slice(-5)) console.log(`- ${path.relative(process.cwd(), d)}`);
  // Open Changes are listed explicitly; with more than one, none is presented
  // as "active" — selection must be explicit (--change).
  const open = openChangeDirs();
  if (open.length) {
    console.log(`\nOpen Changes: ${open.length}`);
    for (const d of open) console.log(`- ${path.basename(d)}`);
    if (open.length > 1) console.log("\nMultiple Changes in progress — commands that act on a Change need an explicit --change <id>. Run `aief status --next` for a recommendation.");
  }
  // Additive only (WF-R15): this section is absent whenever no Change has an
  // invalid manifest.json, which is every Change in this repository today.
  const invalidManifests = invalidManifestChanges();
  if (invalidManifests.length) {
    console.log(`\nChanges with an invalid manifest.json: ${invalidManifests.length}`);
    for (const { dir, change } of invalidManifests) {
      console.log(`- ${path.basename(dir)}:`);
      for (const err of change.manifestError) console.log(`    ${err.field}: ${err.message}`);
    }
  }
  // Additive only (WF-R15): absent whenever no Change declares a recognized
  // track, which is every Change in this repository today. Distinguishes
  // stage/track/next action/blockers/warnings/pending gates explicitly
  // (commissioning instruction, Etapa E) — never shows a transition as
  // available while a blocking gate remains unsatisfied.
  const workflows = workflowChanges();
  const resolvable = workflows.filter((w) => w.workflow.kind === "resolved");
  const unresolvable = workflows.filter((w) => w.workflow.kind !== "resolved");
  if (resolvable.length) {
    console.log(`\nWorkflow status: ${resolvable.length}`);
    for (const { dir, change, workflow } of resolvable) {
      const { state, gateResults } = workflow;
      console.log(`- ${path.basename(dir)} (track: ${change.track}):`);
      console.log(`    Stage: ${state.stage}`);
      console.log(`    Next: ${state.nextAction === null ? "none (closed)" : state.nextAction}`);
      if (state.blockers.length) {
        console.log("    Blockers:");
        for (const g of state.blockers) console.log(`      - ${g.id}: ${g.status} — ${g.reason}`);
      }
      if (state.warnings.length) {
        console.log("    Warnings:");
        for (const g of state.warnings) console.log(`      - ${g.id}: ${g.status} — ${g.reason}`);
      }
      const pending = gateResults.filter((g) => g.status === "pending" && !state.blockers.includes(g));
      if (pending.length) {
        console.log("    Pending (not yet implemented):");
        for (const g of pending) console.log(`      - ${g.id}: ${g.reason}`);
      }
    }
  }
  if (unresolvable.length) {
    console.log(`\nChanges with an unrecognized or broken workflow track: ${unresolvable.length}`);
    for (const { dir, workflow } of unresolvable) console.log(`- ${path.basename(dir)}: ${workflow.error}`);
  }
  // Additive only (SDD-R34): absent whenever no Change declares manifest.sdd,
  // which is every Change in this repository today.
  const sdd = sddChanges();
  if (sdd.length) {
    console.log(`\nSDD provider status: ${sdd.length}`);
    for (const { dir, change, resolution } of sdd) {
      console.log(`- ${path.basename(dir)}:`);
      if (resolution.error) {
        console.log(`    SDD provider: ${resolution.error}`);
        continue;
      }
      console.log(`    SDD provider: ${resolution.provider.PROVIDER_ID}`);
      const changeResolution = resolution.provider.resolveChange(change, cwd());
      console.log(`    SDD change: ${changeResolution.resolved ? changeResolution.changeId : `unresolved (${changeResolution.reason})`}`);
      const readiness = resolution.provider.validate(change, cwd());
      console.log(`    SDD readiness: ${readiness.status}`);
      if (readiness.blockers.length) {
        console.log("    Blockers:");
        for (const b of readiness.blockers) console.log(`      - ${b}`);
      }
      if (readiness.warnings.length) {
        console.log("    Warnings:");
        for (const w of readiness.warnings) console.log(`      - ${w}`);
      }
    }
  }
  // Additive only (Change 0058/ADR-028): absent whenever no Change declares
  // manifest.dependsOn, which is every Change in this repository today —
  // same conditional discipline sddChanges()/workflowChanges() above use.
  // Only Changes that actually declare a dependency are listed here; the
  // full graph (every Change, with or without dependencies) is
  // `aief status --graph`.
  const graph = buildProjectGraph();
  const declaring = graph.edges.length ? [...new Set(graph.edges.map((e) => e.from))].sort() : [];
  if (declaring.length || graph.issues.length) {
    console.log(`\nDependency Graph: ${declaring.length} Change(s) declare dependencies`);
    for (const id of declaring) {
      const deps = graph.edges.filter((e) => e.from === id).map((e) => e.to);
      console.log(`- ${id} depends on: ${deps.join(", ")}`);
    }
    if (graph.issues.length) {
      console.log("  Issues:");
      for (const issue of graph.issues) console.log(`    - ${issue.type}: ${issue.detail}`);
    }
  }
  console.log(`\nDetected project type: ${project.signals.length ? project.signals.map((s) => s.id).join(", ") : "No strong signals detected."}`);
  if (!showNext) return;
  if (!exists("AGENTS.md") || !exists("changes")) { printNext("aief bootstrap"); return; }
  if (!changes.length) { printNext("aief analyze"); return; }
  if (open.length > 1) { printNext("aief status --next", "aief prompt --change <id>", "aief close --yes --change <id>"); return; }
  // ADR-018 §1 (Change 0046): for the one case where this suggestion and the
  // "Workflow status" block above could actually disagree — a single open,
  // track-carrying Change — both now come from the exact same
  // workflowService.nextAction() call. Every Change without a track (100%
  // of this repository today) falls through to the unchanged legacy line
  // below, so real output is untouched; this branch is additive-and-dormant
  // the same way Entregas 1–3 introduced their own machinery.
  if (open.length === 1) {
    const singleChange = loadChangeUnified(open[0]);
    if (singleChange.manifest && singleChange.track) {
      const action = nextAction(open[0], cwd());
      printNext(action.command || "aief status --next");
      return;
    }
  }
  printNext("aief prompt");
}
// Renders a single gate/blocker/warning line, shared by the --change deep
// view and the --next compact view so the two never format the same data
// two different ways.
function printGateLine(label, g) {
  console.log(`  ${label} ${g.id}: ${g.status} — ${g.reason}`);
}
// gatherOpenChangeFacts() (Change 0059/ADR-029) — the one place real
// Changes' {id, closed, manifestError, workflowBlockers} facts are computed
// for next-change-service.js. Reuses loadChangeUnified()/resolveWorkflowFor()
// exactly as workflowChanges() already does — no second Workflow resolution.
function gatherOpenChangeFacts() {
  return getChangeDirs().map((dir) => {
    const change = loadChangeUnified(dir);
    const id = path.basename(dir);
    let workflowBlockers = [];
    if (!change.manifestError && change.manifest && change.track) {
      const workflow = resolveWorkflowFor(change);
      workflowBlockers = workflow.kind === "resolved"
        ? workflow.state.blockers.map((g) => `${g.id}: ${g.status} — ${g.reason}`)
        : [workflow.error];
    }
    return { id, closed: change.closed, manifestError: Boolean(change.manifestError), workflowBlockers };
  });
}
// aief status --next (no --change), only when 2+ Changes are open (Change
// 0059/ADR-029) — deliberately replaces the prior "select one explicitly"
// error for this one case; see change.md "Deliberate, documented behavior
// change". Read-only: never writes a file, never calls verify/close/prompt.
function statusNextSmart() {
  section("AIEF Status"); console.log("Purpose: recommend the next eligible Change. Writes nothing.\n");
  const graph = buildProjectGraph();
  const result = selectNextChange(gatherOpenChangeFacts(), graph);
  if (result.recommended) {
    const winner = result.evaluations.find((e) => e.id === result.recommended);
    console.log(`Next Change: ${result.recommended}\n`);
    console.log("Ready because:");
    for (const reason of winner.reasons) console.log(`- ${reason}`);
    const otherEligible = result.evaluations.filter((e) => e.eligible && e.id !== result.recommended).map((e) => e.id);
    if (otherEligible.length) {
      console.log(`\nTie-break: ${result.tieBreakRule}`);
      console.log(`Other eligible Change(s): ${otherEligible.join(", ")}`);
    }
    printNext(`aief prompt --change ${result.recommended}`);
    return;
  }
  console.log("No eligible Change found among the open Changes:\n");
  for (const e of result.evaluations) console.log(`- ${e.id}: ${e.reasons.join("; ")}`);
  printNext("aief status (list open Changes)", "aief status --graph");
}
// aief status --change <id>   (deep, read-only inspection of one Change)
// aief status --change <id> --next   (compact Normalized Action view)
// aief status --next   (same compact view, implicit single-open-Change selection;
//   2+ open Changes goes to statusNextSmart() instead — Change 0059/ADR-029)
//
// Entrega 4 (Change 0046, ADR-018 §4, Path B): no new command — this is the
// entire CLI-facing surface Path B introduces, as flags on the existing
// `status` command. Every branch here is read-only (UX-R5/R17): nothing
// below writes a file, and workflowService.* is the only thing consulted
// for workflow/SDD facts (UX-R21/R23) — no gate/track conditional lives in
// this function itself, only rendering of what workflowService already decided.
function statusSingleChange(parsed) {
  if (parsed.next === true && typeof parsed.change !== "string" && openChangeDirs().length > 1) {
    statusNextSmart();
    return;
  }
  section("AIEF Status"); console.log("Purpose: inspect one Change. Writes nothing.\n");
  const changeDir = typeof parsed.change === "string"
    ? resolveExplicitChange(parsed.change)
    : resolveImplicitChange("aief status --next");
  if (!changeDir) { printNext("aief status (list open Changes)"); return; }
  const name = path.relative(process.cwd(), changeDir);
  const change = loadChangeUnified(changeDir);
  console.log(`Change: ${name}`);

  if (change.manifestError) {
    console.log("Manifest: invalid — never falls back to legacy inference (spec.md UX-R24).");
    for (const err of change.manifestError) console.log(`  ${err.field}: ${err.message}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Status: ${change.closed ? "closed" : "open"}`);

  if (parsed.next) {
    // Compact Normalized Action view — the single computation both this
    // and statusOverview()'s bottom line consult (ADR-018 §1).
    const action = nextAction(changeDir, cwd());
    console.log(`\nNext action:`);
    console.log(`  id: ${action.id}`);
    console.log(`  status: ${action.status}`);
    console.log(`  reason: ${action.reason}`);
    console.log(`  blocking: ${action.blocking}`);
    if (action.evidence?.length) {
      console.log("  evidence:");
      for (const e of action.evidence) console.log(typeof e === "string" ? `    - ${e}` : `    - ${e.id}: ${e.status} — ${e.reason}`);
    }
    console.log(`\nNext:`);
    console.log(`  ${action.command || "(no further action — " + action.status + ")"}`);
    if (action.status === "invalid") process.exitCode = 1;
    return;
  }

  // Deep inspection view — track/stage/gates, SDD provider/readiness, then
  // the same derived action's suggested command at the end.
  const { workflow, sdd, action } = explainWorkflow(changeDir, cwd());
  if (workflow && workflow.kind === "resolved") {
    console.log(`\nTrack: ${change.track}`);
    console.log(`Stage: ${workflow.state.stage}`);
    if (workflow.state.blockers.length) {
      console.log("Blockers:");
      for (const g of workflow.state.blockers) printGateLine("-", g);
    }
    if (workflow.state.warnings.length) {
      console.log("Warnings:");
      for (const g of workflow.state.warnings) printGateLine("-", g);
    }
  } else if (workflow) {
    console.log(`\nWorkflow: invalid — ${workflow.error}`);
  } else {
    console.log("\nWorkflow: no track declared (legacy readiness only).");
  }
  if (sdd && !sdd.error) {
    console.log(`\nSDD provider: ${sdd.providerId}`);
    console.log(`SDD change: ${sdd.changeResolution.resolved ? sdd.changeResolution.changeId : `unresolved (${sdd.changeResolution.reason})`}`);
    console.log(`SDD readiness: ${sdd.readiness.status}`);
    if (sdd.readiness.blockers?.length) { console.log("  Blockers:"); for (const b of sdd.readiness.blockers) console.log(`    - ${b}`); }
    if (sdd.readiness.warnings?.length) { console.log("  Warnings:"); for (const w of sdd.readiness.warnings) console.log(`    - ${w}`); }
  } else if (sdd?.error) {
    console.log(`\nSDD provider: ${sdd.error}`);
  }
  printHarnessStatus(changeDir, change);
  printDefinitionReadiness(change);
  console.log(`\nNext:`);
  console.log(`  ${action.command || "(no further action — " + action.status + ")"}`);
  if (action.status === "invalid") process.exitCode = 1;
}
// Called from statusSingleChange() (Change 0056/ADR-026) — present only when
// this Change's own manifest declares `harness` (R6): every existing Change
// (none of which does) sees no diff at all here, unlike the Skill/Standard
// sections in doctor which always show something. Reports configuration —
// which Hooks would run, which are disabled, any unknown ids — never a
// fabricated execution-count summary (status never fires a Hook; see
// spec.md "Non-goals" for why that line from the commissioning brief's own
// illustrative example is deliberately not implemented here).
function printHarnessStatus(changeDir, change) {
  if (!change.manifest || typeof change.manifest !== "object" || !change.manifest.harness) return;
  const config = resolveHarnessConfig(change.manifest);
  console.log(`\nHarness: configured (log ${config.log ? "on" : "off"})`);
  for (const eventId of Object.keys(config.disabledByEvent)) {
    const registeredForEvent = describeHarnessRegistry().filter((d) => d.events.includes(eventId)).map((d) => d.id);
    const disabled = new Set(config.disabledByEvent[eventId] || []);
    const activeIds = registeredForEvent.filter((id) => !disabled.has(id));
    console.log(`  ${eventId}: ${activeIds.length} active${disabled.size ? `, ${disabled.size} disabled (${[...disabled].join(", ")})` : ""}`);
  }
  if (config.unknownHookIds.length) {
    console.log("  Unknown Hook id(s) in manifest.harness (never disabled anything real):");
    for (const u of config.unknownHookIds) console.log(`    - "${u.id}" (${u.event})`);
  }
  if (config.log && fs.existsSync(path.join(changeDir, "hooks.md"))) console.log(`  Execution log: ${path.relative(process.cwd(), path.join(changeDir, "hooks.md"))}`);
}
// aief status --change <id> on a Definition Change (Change 0081): a
// deterministic, transparent breakdown of its own change.md — never a fake
// percentage-complete score (§9 of the commissioning brief), only literal
// section counts and explicitly author-marked items. Present only for
// `## Type: Definition` Changes, the same "additive, absent otherwise"
// discipline printHarnessStatus already uses above.
function printDefinitionReadiness(change) {
  if (change.type !== "definition") return;
  const changeMd = change.files ? change.files["change.md"] : "";
  const { known, missing, deferred, ambiguous, decisionRequired, humanApprovalRequired } = analyzeDefinitionSections(changeMd || "");
  console.log(`\nDefinition readiness: ${known.length}/${DEFINITION_SECTIONS.length} sections filled in`);
  if (missing.length) console.log(`  Missing: ${missing.join(", ")}`);
  if (decisionRequired.length) console.log(`  Decision required: ${decisionRequired.length} item(s) — ${decisionRequired.join("; ")}`);
  if (ambiguous.length) console.log(`  Ambiguous: ${ambiguous.length} item(s) — ${ambiguous.join("; ")}`);
  if (humanApprovalRequired.length) console.log(`  Human approval required: ${humanApprovalRequired.length} item(s) — ${humanApprovalRequired.join("; ")}`);
  if (deferred.length) console.log(`  Deferred until implementation: ${deferred.length} item(s) — ${deferred.join("; ")}`);
}
// aief status --graph (Change 0058/ADR-028) — the full dependency graph:
// every Change is a node, whether or not it declares dependencies (the
// overview's own "Dependency Graph:" section only lists Changes that do).
// Read-only, additive, new flag — no existing status output changes.
function statusGraph() {
  section("AIEF Status"); console.log("Purpose: show the full Change dependency graph. Writes nothing.\n");
  const graph = buildProjectGraph();
  console.log(`Nodes: ${graph.nodes.length}`);
  console.log(`Edges: ${graph.edges.length}`);
  for (const e of graph.edges) console.log(`- ${e.from} -> ${e.to}`);
  console.log("");
  if (graph.order) {
    console.log("Topological order (dependencies first):");
    console.log(`  ${graph.order.join(", ") || "(none)"}`);
  } else {
    console.log(`Topological order: unavailable — dependency cycle among: ${graph.cycles.join(", ")}`);
  }
  console.log(graph.issues.length ? "\nIssues:" : "\nIssues: none");
  for (const issue of graph.issues) console.log(`- ${issue.type}: ${issue.detail}`);
}
function status(args = []) {
  const parsed = parseArgs("status", args);
  if (!parsed) return;
  if (parsed.graph === true) {
    statusGraph();
    return;
  }
  if (typeof parsed.change === "string" || parsed.next === true) {
    statusSingleChange(parsed);
    return;
  }
  statusOverview();
}
function toolVersion(command, args = ["--version"]) {
  const result = run(command, args);
  if (result.status !== 0) return "";
  // Some tools (java -version) report on stderr with exit code 0.
  const line = `${result.stdout || ""}${result.stderr || ""}`.trim().split("\n")[0];
  const match = line.match(/\d+(\.\d+)+/);
  return match ? match[0] : line;
}
// Environment checks are data: name, how to detect, how to version, and a hint
// when absent. Levels: required (AIEF needs it), recommended (the SDD workflow
// benefits), optional (nice to have). Optional/recommended absences never fail.
const DOCTOR_GROUPS = [
  { title: "Core (required)", level: "required", tools: [
    { name: "node", version: () => process.version },
    { name: "npm" },
    { name: "git" }
  ] },
  { title: "SDD (recommended)", level: "recommended", tools: [
    { name: "openspec", detect: () => commandExists("openspec") || commandExists("opsx"), hint: "install: npm install -g @fission-ai/openspec@latest" },
    { name: "specboot", detect: () => commandExists("specboot") || exists("specboot") || exists(".specboot"), noVersion: true, hint: "see adapters/specboot/README.md" }
  ] },
  { title: "Build tools (optional)", level: "optional", tools: [
    { name: "java", versionArgs: ["-version"] },
    { name: "maven", command: "mvn", noVersion: true },
    { name: "gradle", noVersion: true },
    { name: "docker", noVersion: true }
  ] },
  { title: "Assistants (optional)", level: "optional", tools: [
    { name: "claude", noVersion: true },
    { name: "gemini", noVersion: true },
    { name: "cursor", noVersion: true },
    { name: "codex", noVersion: true }
  ] }
];
function doctorEnvironment() {
  const missingRequired = [];
  let warnings = 0;
  for (const group of DOCTOR_GROUPS) {
    console.log(`${group.title}:`);
    for (const tool of group.tools) {
      const command = tool.command || tool.name;
      const found = tool.detect ? tool.detect() : commandExists(command);
      if (found) {
        const version = tool.version ? tool.version() : (tool.noVersion ? "" : toolVersion(command, tool.versionArgs));
        console.log(`✓ ${tool.name}${version ? ` ${version}` : ""}`);
      } else if (group.level === "required") { console.log(`✗ ${tool.name}: not found (required)`); missingRequired.push(tool.name); }
      else if (group.level === "recommended") { console.log(`⚠ ${tool.name}: not detected (optional)${tool.hint ? ` — ${tool.hint}` : ""}`); warnings += 1; }
      else console.log(`○ ${tool.name}: not detected (optional)`);
    }
    console.log("");
  }
  console.log("Summary:");
  if (missingRequired.length) { console.log(`Missing required tools: ${missingRequired.join(", ")}. Install them before using AIEF.`); process.exitCode = 1; }
  else if (warnings) console.log("Environment is usable with warnings.");
  else console.log("Environment is ready.");
  return missingRequired;
}
function doctor(args = []) { const parsed = parseArgs("doctor", args); if (!parsed) return; const verbose = Boolean(parsed.verbose); section("AIEF Doctor"); console.log("Purpose: inspect your environment and project readiness for AIEF.\nDoctor never modifies your project.\n"); doctorEnvironment(); printGraphEngineStatus(); const project = detectProject(); statusOverview(project, false); printSignals(project); console.log(""); printSkills(project, { verbose }); printStandardsReport({ verbose }); if (verbose) { printHarnessRegistry(); printLoopRegistry(); } printNext(!exists("AGENTS.md") || !exists("changes") ? "aief bootstrap" : "aief analyze"); }
export function main(args) { const [command, ...rest] = args; switch (command) { case "help": case "--help": case "-h": case undefined: help(rest[0]); break; case "--version": case "-v": printVersion(); break; case "explain": help(rest[0]); break; case "doctor": doctor(rest); break; case "status": status(rest); break; case "bootstrap": bootstrap(rest); break; case "adopt": commandRemoved("adopt"); break; case "analyze": analyze(rest); break; case "init": commandRemoved("init"); break; case "new-change": newChange(rest); break; case "enrich": enrich(rest); break; case "propose": propose(rest); break; case "prompt": prompt(rest); break; case "close": close(rest); break; case "use-profile": useProfile(rest[0]); break; case "verify": verify(rest); break; case "release": release(rest[0]); break; default: console.error(`Unknown command: ${command}`); help(); process.exitCode = 1; }}
