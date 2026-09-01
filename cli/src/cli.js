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
import { detectProject, recommendSkills } from "./detect.js";
import { loadChange, isClosedContent } from "./core/domain/change.js";
import { loadChangeUnified } from "./core/domain/change-loader.js";
import { verifyProject, verifyChange, checkChangeReadiness } from "./core/services/change-verifier.js";
import { resolveSddProvider, sddProviderConfigPath } from "./core/domain/sdd-provider-resolver.js";
import { ASSISTANT_FILES, hasAssistant, assistantIds, assistantConfigPath, resolveAssistant, readProjectAssistantConfig } from "./core/domain/assistant-resolver.js";
import { getProvider } from "./sdd-providers/index.js";
import { resolveSkillRecommendations, resolveStandardRecommendations, deriveResourceDescription } from "./core/domain/ai-specs.js";
import { inspect as inspectWorkflow, nextAction, explain as explainWorkflow } from "./core/services/workflow-service.js";
import { buildSkillContext } from "./core/services/skill-context.js";
import { listSkillDescriptors, runSkill, isUnknownSkillError } from "./core/services/skill-service.js";
import { buildEvent, buildHookContext } from "./core/services/hook-context.js";
import { evaluateEvent } from "./core/services/hook-service.js";
import { resolveHarnessConfig, partitionOutcome, describeHarnessRegistry, hookTitle, formatHookResultsBlock, describeFailingHooks } from "./core/services/harness-service.js";
import { resolveLoopConfig, countPreviousAttempts, decideLoopOutcome, formatLoopSummary, formatLoopLogEntry } from "./core/services/loop-service.js";
import { selectNextChange } from "./core/services/next-change-service.js";
import { buildVerificationContext } from "./core/services/verification-context.js";
import { evaluateRequirements, aggregateVerificationResult } from "./core/services/verification-service.js";
import { parseJUnitReport, renderCapturedVerification } from "./core/domain/junit-report.js";
import { analyzeDefinitionSections, DEFINITION_SECTIONS } from "./core/domain/definition-enrichment.js";
import { replaceOrAppendEvidenceSection } from "./core/domain/evidence-sections.js";

const STANDARDS_TEMPLATES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates", "standards");
const CI_TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates", "ci", "aief-verify.yml");
// The canonical AGENTS.md. Adoption previously wrote a 14-line inline string that
// carried 7 of ~40 rules and none of the (human)/(review) gates, so adopted
// projects never received the governance AIEF documents for itself (Change 0040).
const AGENTS_TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates", "agents", "AGENTS.md");
const BASE_STANDARDS = ["base-standards.md", "documentation-standards.md", "testing-standards.md", "security-standards.md"];

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
function standardsForProject(project) {
  const files = [...BASE_STANDARDS];
  if (project.tech.nextjs || project.tech.react || project.tech.tailwind) files.push("frontend-standards.md");
  if (project.tech.nestjs || project.tech.postgres || project.tech.cognito || project.tech.n8n) files.push("backend-standards.md");
  return files;
}
function createStandards(project) {
  const created = [];
  for (const file of standardsForProject(project)) {
    const template = path.join(STANDARDS_TEMPLATES_DIR, file);
    if (!fs.existsSync(template)) continue;
    if (writeFile(cwd("knowledge", "standards", file), fs.readFileSync(template, "utf8"))) created.push(file);
  }
  return created;
}
// The governance gate (Flux Portal dogfooding, finding F2): adoption used to
// deliver structure but no enforcement, so `aief verify` — which already exits
// non-zero on FAIL — was simply never run. On that migration it would have
// FAILED from Change 0008 through the cutover, unseen. This adds NO core
// capability: it is a workflow file plus documentation. Visible (no hidden
// state, ADR-009) and never overwritten, like every other adoption artifact.
// Not on GitHub Actions? The gate is one command: `npx aief verify`
// (docs/ci-gate.md).
function createCiGate() {
  if (!fs.existsSync(CI_TEMPLATE)) return null;
  const created = writeFile(cwd(".github", "workflows", "aief-verify.yml"), fs.readFileSync(CI_TEMPLATE, "utf8"));
  return created ? ".github/workflows/aief-verify.yml" : null;
}
function printSignals(project) {
  console.log("\nDetected project signals:");
  if (!project.signals.length) { console.log("(none)"); return; }
  for (const signal of project.signals) {
    console.log(`✓ ${signal.id} (${signal.signal}): ${signal.reasons.join("; ")}`);
  }
}
// Visible Skills: the recommended Skills become a readable artifact in the
// adopted project. The catalog stays the technical source; this file is the
// user-facing view. Skills are context, never commands.
function skillsDoc(project, skills) {
  const sections = skills.map((s) => {
    const lines = [`## ${s.name || s.id} (\`${s.id}\`)`, "", `- **Why recommended:** ${s.because.join("; ")}`];
    if (s.whenToUse) lines.push(`- **When to use:** ${s.whenToUse}`);
    if ((s.standardsToRead || []).length) lines.push(`- **Related standards:** ${s.standardsToRead.map((f) => `knowledge/standards/${f}`).join(", ")}`);
    lines.push(`- **Prompt context:** ${s.promptContext || "No operational content yet."}`);
    if ((s.commonRisks || []).length) lines.push(`- **Common risks:** ${s.commonRisks.join("; ")}`);
    if (s.evidenceExpectations) lines.push(`- **Evidence expectations:** ${s.evidenceExpectations}`);
    return lines.join("\n");
  }).join("\n\n");
  return `# Project Skills\n\n> Generated by AIEF during adoption. Skills are contextual knowledge for AI assistants working on this project — they are not commands and are never executed. The AIEF skills catalog remains the technical source; edit this file to add project-specific notes.\n\n${sections}\n`;
}
// Self-evidence: adopt documents what it actually did, so the adoption Change
// never sits with placeholder evidence. Humans still verify and close it.
function adoptionEvidence(project, skills, artifacts) {
  const today = new Date().toISOString().slice(0, 10);
  const signals = project.signals.length
    ? project.signals.map((s) => `- ${s.id} (${s.signal}): ${s.reasons.join("; ")}`).join("\n")
    : "- No strong signals detected.";
  const skillLines = skills.map((s) => `- ${s.id}: ${s.because.join("; ")}`).join("\n");
  const artifactLines = artifacts.map((a) => `- ${a}`).join("\n");
  return `# Evidence

> Generated by AIEF during adoption.

## Summary

AIEF was adopted in this project on ${today}. Only AIEF workflow structure was created.

## Activities Performed

${artifactLines}

## Verification

Guarantees respected during adoption:

- No functional code changed.
- No existing files overwritten.
- Only AIEF structure created.

Confirm the structure with \`aief verify\`.

## Findings

Detected signals:

${signals}

Recommended Skills:

${skillLines}

## Risks

- Weak signals are keyword heuristics; confirm or discard them during analysis.

## Recommendations

- Edit knowledge/standards/ so the "(adapt)" lines match this project.
- Run \`aief analyze\` to create a seeded Analysis Change.

## Artifacts Produced

${artifactLines}

## Lessons Learned

- None recorded at adoption time; add observations here if adoption surfaced anything.

## Next Change

Run \`aief analyze\` to create the analysis Change.
`;
}
// Shared by bootstrap: creates only visible AIEF structure (AGENTS.md,
// changes/, knowledge/, profiles/) — never a hidden .aief/ directory
// (ADR-009: no hidden state) and never application code. Returns the list of
// newly created artifacts (empty when everything already existed).
function runAdoption() {
  const project = detectProject();
  const skills = recommendSkills(project);
  const artifacts = [];
  const signalIds = project.signals.map((s) => s.id);
  console.log(`\nDetected: ${signalIds.length ? signalIds.join(", ") : "no strong signals"} (details: aief doctor, knowledge/skills.md)`);
  if (!exists("AGENTS.md")) {
    writeFile(cwd("AGENTS.md"), fs.readFileSync(AGENTS_TEMPLATE, "utf8")); console.log("✓ Created AGENTS.md"); artifacts.push("AGENTS.md");
  } else console.log("✓ AGENTS.md already exists");
  fs.mkdirSync(cwd("changes"), { recursive: true }); fs.mkdirSync(cwd("knowledge"), { recursive: true }); fs.mkdirSync(cwd("profiles"), { recursive: true });
  if (writeFile(cwd("knowledge", "README.md"), "# Knowledge\n\nCapture decisions, lessons learned, constraints and project context here.\n")) artifacts.push("knowledge/README.md");
  if (writeFile(cwd("profiles", "README.md"), "# Profiles\n\nUse AIEF role profiles from the source AIEF repository or define project-specific role guidance here.\n")) artifacts.push("profiles/README.md");
  const createdStandards = createStandards(project);
  for (const file of createdStandards) { console.log(`✓ Created knowledge/standards/${file}`); artifacts.push(`knowledge/standards/${file}`); }
  if (!createdStandards.length) console.log("✓ knowledge/standards/ already present (nothing overwritten)");
  if (writeFile(cwd("knowledge", "skills.md"), skillsDoc(project, skills))) { console.log("Skills documented: knowledge/skills.md"); artifacts.push("knowledge/skills.md"); }
  else console.log("Skills documentation already exists: knowledge/skills.md");
  const ciGate = createCiGate();
  if (ciGate) { console.log(`✓ Created ${ciGate} — CI gate: runs aief verify on every push/PR`); artifacts.push(ciGate); }
  else console.log("✓ CI gate already present (nothing overwritten): .github/workflows/aief-verify.yml");
  if (!getChangeDirs().some((dir) => path.basename(dir).includes("adopt-aief"))) {
    // Use the next free ID so adoption never collides with existing Changes.
    const id = nextChangeId();
    const dir = cwd("changes", `${id}-adopt-aief`);
    const files = genericChangeFiles(id, "adopt-aief", "Adopt AIEF workflow without changing application behavior.");
    artifacts.push(`changes/${id}-adopt-aief/ (this Change)`);
    writeFile(path.join(dir, "change.md"), files["change.md"]);
    writeFile(path.join(dir, "spec.md"), files["spec.md"]);
    writeFile(path.join(dir, "tasks.md"), `# Tasks\n\n- [x] Create or preserve AGENTS.md.\n- [x] Create changes/, knowledge/ and profiles/.\n- [x] Create knowledge/standards/ starter standards.\n- [x] Generate this Change's evidence automatically.\n- [ ] Edit knowledge/standards/ so the "(adapt)" lines match this project.\n- [ ] Run aief verify, then close this Change: aief close --yes --change adopt-aief\n\nNote: this Change can be closed before or after the Analysis Change. With more than one Change open, name the target explicitly: aief prompt --change <id> / aief close --yes --change <id>.\n`);
    writeFile(path.join(dir, "evidence.md"), adoptionEvidence(project, skills, artifacts));
    console.log(`✓ Created changes/${id}-adopt-aief (evidence generated automatically)`);
  } else console.log("✓ Adoption Change already exists");
  return artifacts;
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
function renderReport(report) {
  for (const line of report.lines) {
    if (line.level === "error") console.error(line.text);
    else if (line.level === "warn") console.warn(line.text);
    else console.log(line.text);
  }
  console.log(report.passed ? "\nResult: PASS" : "\nResult: FAIL");
  if (!report.passed) process.exitCode = 1;
  printNext(...report.next);
}
// Entrega 6 (Change 0048, ADR-020) — emits `verify.completed` after
// renderReport() has already printed PASS/FAIL and set the exit code
// (HK-R48: a Hook result can never influence either, so it never runs
// before both are already decided). `changeDir` is null for the
// whole-project verify — the Post-Verify Next Action Hook has no single
// Change to recommend a next action for and reports `not_applicable`, so no
// Workflow/SDD lookup is performed for that path at all (no explain() call
// unless a Change was actually targeted). Strictly additive; silent when no
// Hook matches with real content.
function runVerifyCompletedHooks(changeDir, report, inspection) {
  const event = buildEvent("verify.completed", "verify");
  const { change, workflow, sdd } = inspection;
  const context = buildHookContext(event, {
    project: detectProject(), change, workflow, sdd,
    operation: { input: { changeId: changeDir ? path.basename(changeDir) : null }, result: report }
  });
  const outcome = evaluateEvent(event, context);
  // Change 0056/ADR-026: same disabled-filtering/logging treatment prompt()
  // gives prompt.prepared — a whole-project verify (changeDir null) has no
  // Change to read manifest.harness from, so this resolves to configured:
  // false and behaves exactly as before (no filtering, no log).
  const harnessConfig = resolveHarnessConfig(change?.manifest);
  const { active } = partitionOutcome(outcome, harnessConfig);
  const lines = active.filter((r) => r.status === "matched" && r.instructions.length).flatMap((r) => r.instructions);
  if (lines.length) {
    console.log("\nHook recommendation:");
    for (const l of lines) console.log(`- ${l}`);
  }
  // Previously silently dropped (spec.md R7) — a failed/invalid Hook is now
  // visible here too, same framing renderHookResults() uses for prompt.
  const failing = describeFailingHooks(active);
  if (failing.length) {
    console.log("\nHook issues (non-blocking — verify's own PASS/FAIL is unaffected):");
    for (const line of failing) console.log(`- ${line}`);
  }
  if (harnessConfig.log && changeDir) appendHookLog(changeDir, { operation: "verify", event: outcome.event, entries: active, passed: report.passed });
}
// Loop (Change 0057/ADR-027) — Verify -> Feedback -> Retry (if applicable)
// -> Final result. Only ever called for a single targeted Change
// (`aief verify --change <id>`); whole-project verify has no manifest to
// read Loop config from, so it is never touched. `report.errors` (already
// computed, already printed by renderReport()) is reused as Feedback —
// nothing new is derived. Never re-invokes verify, a Hook, or anything else
// — "retry" is reported as available, never performed.
function runLoop(changeDir, change, report) {
  const loopConfig = resolveLoopConfig(change?.manifest);
  if (!loopConfig.configured) return;
  const logPath = path.join(changeDir, "loop.md");
  const already = fs.existsSync(logPath);
  const attempt = countPreviousAttempts(already ? read(logPath) : "") + 1;
  const outcome = decideLoopOutcome({ attempt, maxRetries: loopConfig.maxRetries, passed: report.passed });
  const changeId = path.basename(changeDir);
  console.log(formatLoopSummary(outcome, changeId));
  const header = "# Loop Log\n\nVisible, append-only record of `aief verify` attempts for this Change (Change 0057, ADR-027). Feedback lines are Structural Verification's own error messages, reused as-is — nothing else is recorded, and nothing here ever re-runs verify automatically.\n";
  const entry = formatLoopLogEntry({ timestamp: new Date().toISOString(), outcome, feedback: report.errors });
  writeFile(logPath, `${already ? read(logPath) : header}\n${entry}`, true);
}
// Change 0058/ADR-028 — a small, non-blocking dependency-issue note for the
// Change `aief verify --change <id>` targeted: printed only when the Graph
// has an issue naming this Change (as source, or as a cycle member) — never
// touches report.passed or the exit code (both already decided before this
// runs). Silent for every Change today (none declares dependsOn).
function runGraphCheck(changeDir) {
  const changeId = path.basename(changeDir);
  const graph = buildProjectGraph();
  const relevant = graph.issues.filter((issue) => issue.changeId === changeId || (issue.members && issue.members.includes(changeId)));
  if (!relevant.length) return;
  console.log("\nDependency Graph issues for this Change (non-blocking):");
  for (const issue of relevant) console.log(`- ${issue.type}: ${issue.detail}`);
}
// Entrega 7 (Change 0049, ADR-021) — `--requirements` is the one new,
// opt-in flag: Structural Verification (renderReport, above) always runs
// first, unchanged; this function only ever ADDS a section after it, never
// replacing or reordering anything legacy (VR-R43). `inspection` is the
// SAME `explainWorkflow()` result the caller already computed once (and
// already handed to runVerifyCompletedHooks) — buildVerificationContext()
// never calls explain() itself, so a `--change ... --requirements`
// invocation performs exactly one explain() call total, not two
// (VR-R21/R24/R45).
function runRequirementVerification(changeDir, report, inspection) {
  const context = buildVerificationContext(inspection, changeDir, cwd(), { input: { changeId: path.basename(changeDir) }, result: report });
  const { requirementResults } = evaluateRequirements(context);
  const overall = aggregateVerificationResult(report.passed, requirementResults);
  console.log(`\nRequirement Verification: ${overall}`);
  if (!requirementResults.length) {
    console.log("  No requirements declared for this Change (no sdd.requirements).");
  }
  for (const { requirement, ruleResults } of requirementResults) {
    for (const rr of ruleResults) {
      if (rr.status === "not_applicable") continue; // quiet — never render arrays/rows with nothing to say
      console.log(`  ${requirement.id} — ${rr.rule}: ${rr.status} — ${rr.summary}`);
    }
  }
  // Exit code derives exclusively from the aggregated status (VR-R44) — no
  // individual rule result can set it directly; PASS/INCOMPLETE are exit 0
  // (an honest, actionable answer, mirroring Normalized Action's own
  // blocked/pending precedent, ADR-018 §3), FAIL/INVALID/ERROR are exit 1.
  if (overall === "FAIL" || overall === "INVALID" || overall === "ERROR") process.exitCode = 1;
}
function verify(args = []) {
  const parsed = parseArgs("verify", args);
  if (!parsed) return;
  section("AIEF Verify");
  console.log("Purpose: verify required AIEF files and Change structures. Writes nothing.\n");
  // `--change <id>` verifies exactly one Change (and says which); the default
  // remains the whole project — both share the same rules in change-verifier.
  if (typeof parsed.change === "string") {
    const changeDir = resolveExplicitChange(parsed.change);
    if (!changeDir) { printNext("aief status (list open Changes)"); return; }
    const report = verifyChange(loadChange(changeDir), process.cwd(), Boolean(parsed.strict));
    renderReport(report);
    // Computed exactly once per invocation, shared by the Hook and (if
    // requested) Requirement Verification — never a second explain() call
    // (VR-R21/R24/R45).
    const inspection = explainWorkflow(changeDir, cwd());
    runVerifyCompletedHooks(changeDir, report, inspection);
    if (parsed.requirements) runRequirementVerification(changeDir, report, inspection);
    runLoop(changeDir, inspection.change, report);
    runGraphCheck(changeDir);
    return;
  }
  const changes = getChangeDirs().map(loadChange);
  const report = verifyProject({
    hasReadme: exists("README.md"),
    hasAgents: exists("AGENTS.md"),
    hasChangesDir: exists("changes"),
    hasKnowledge: exists("knowledge"),
    changes,
    cwd: process.cwd(),
    strict: Boolean(parsed.strict)
  });
  renderReport(report);
  runVerifyCompletedHooks(null, report, { change: null, workflow: null, sdd: null });
  // Requirement Verification is Change-scoped (requirements come from one
  // Change's own SDD provider) — whole-project `aief verify --requirements`
  // (no `--change`) cannot silently redefine which structural check ran
  // (verifyProject() above is untouched either way), so it names the gap
  // instead of guessing a Change to target.
  if (parsed.requirements) console.log("\nRequirement Verification: skipped — pass --change <id> to select one Change.");
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
function initProject(name, opts = {}) { if (!name) return bootstrapHere(opts); const projectPath = path.resolve(name); if (fs.existsSync(projectPath)) { console.error(`Project already exists: ${projectPath}`); process.exitCode = 1; return; } writeFile(path.join(projectPath, "README.md"), `# ${name}\n\nThis project uses AIEF.\n`); writeFile(path.join(projectPath, "AGENTS.md"), "# Project Agent Instructions\n\nAI assists. Humans decide.\n"); fs.mkdirSync(path.join(projectPath, "changes"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "knowledge"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "src"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "tests"), { recursive: true }); console.log(`Created AIEF project: ${projectPath}`); }
// Blocking, dependency-free stdin read — only ever called after an isTTY
// check (bootstrap's ambiguous-provider case), so it never hangs a
// non-interactive shell (CI, piped input, the test suite).
function promptSync(question) {
  process.stdout.write(question);
  const buffer = Buffer.alloc(2048);
  let bytesRead = 0;
  try { bytesRead = fs.readSync(0, buffer, 0, buffer.length, null); } catch { bytesRead = 0; }
  return buffer.toString("utf8", 0, bytesRead).trim();
}
// Implements sdd-provider-resolver.js's step 2 (project-level configuration)
// from the bootstrap side (spec.md R4). Only ever prompts when the choice is
// genuinely ambiguous (OpenSpec available AND a specboot/LIDR marker
// present) and stdin is a TTY; every other case is silent and deterministic.
// knowledge/sdd-provider.json, once written, is never overwritten (R7).
function configureSddProvider(specbootMarker) {
  const projectCwd = process.cwd();
  const configPath = sddProviderConfigPath(projectCwd);
  if (fs.existsSync(configPath)) {
    const resolved = resolveSddProvider({ manifest: null }, projectCwd);
    return resolved.error
      ? `knowledge/sdd-provider.json is invalid (${resolved.error}) — falling back, see aief doctor.`
      : `${resolved.provider.PROVIDER_ID} (from knowledge/sdd-provider.json, already configured — never overwritten)`;
  }
  const openspecAvailable = getProvider("openspec").detect(projectCwd).available;
  const ambiguous = openspecAvailable && specbootMarker;
  if (ambiguous && process.stdin.isTTY) {
    const answer = promptSync('Both OpenSpec and SpecBoot were detected. Which SDD Provider should AIEF use for this project — "openspec" or "local"? [openspec]: ').toLowerCase();
    const choice = answer === "local" ? "local" : "openspec";
    writeFile(configPath, `${JSON.stringify({ provider: choice, setBy: "bootstrap", date: new Date().toISOString().slice(0, 10) }, null, 2)}\n`);
    return `${choice} (your choice — saved to knowledge/sdd-provider.json)`;
  }
  const resolved = resolveSddProvider({ manifest: null }, projectCwd);
  const reason = ambiguous ? "non-interactive shell, using the deterministic default" : resolved.source === "detected" ? "OpenSpec detected" : "default";
  return `${resolved.provider.PROVIDER_ID} (${reason})`;
}
// `aief bootstrap` (current directory) replaces `init`/`adopt` (Change
// 0052). It creates only visible structure via runAdoption(), reports how
// AIEF fits with OpenSpec and SpecBoot, resolves the SDD Provider (R4), and
// ends with one recommended next command.
// True if `startDir` has an ancestor (strictly above it, never itself)
// whose own AGENTS.md and changes/ coexist — the same two markers
// bootstrap's own "Detected:" section already checks for this directory.
// Walks up to the filesystem root; returns null if none is found.
function findAncestorAiefProject(startDir) {
  let dir = path.dirname(startDir);
  while (true) {
    const changesDir = path.join(dir, "changes");
    if (fs.existsSync(path.join(dir, "AGENTS.md")) && fs.existsSync(changesDir) && fs.statSync(changesDir).isDirectory()) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null; // reached the filesystem root
    dir = parent;
  }
}
function bootstrapHere(opts = {}) {
  section("AIEF Bootstrap");
  console.log("Purpose: bootstrap the current directory to work with AIEF.\nCreates only visible AIEF structure; never modifies application code, never overwrites existing files.\n");
  // Ancestor-detection guard (Change 0078): nothing in AIEF walks upward to
  // find a project root (docs/getting-started.md — explicit over implicit,
  // by design), so a subdirectory of an already-bootstrapped project looks,
  // from here, exactly like a fresh location. That silence is dangerous
  // specifically for bootstrap, the one command that WRITES a governance
  // structure: unchecked, it creates a second, independent one nested
  // inside the real project with no warning. Only fires when this
  // directory isn't already bootstrapped itself — an ordinary idempotent
  // re-run (below) is untouched. Narrow and local to this one pre-flight
  // check; no other command's working-directory resolution changes.
  if (!(exists("AGENTS.md") && exists("changes")) && opts.force !== true) {
    const ancestor = findAncestorAiefProject(process.cwd());
    if (ancestor) {
      console.error(`An AIEF project already exists at ${ancestor} — bootstrapping here would create a second, independent structure nested inside it.\nRun aief commands from ${ancestor} instead, or pass --force to bootstrap here anyway.`);
      process.exitCode = 1;
      return;
    }
  }
  const openspecCli = commandExists("openspec") || commandExists("opsx");
  const openspecProject = exists("openspec") || exists(".openspec");
  const specboot = commandExists("specboot") || exists("specboot") || exists(".specboot");
  console.log("Detected:");
  console.log(exists("AGENTS.md") ? "✓ AGENTS.md" : "○ AGENTS.md: not present (will be created)");
  console.log(exists("changes") ? "✓ changes/" : "○ changes/: not present (will be created)");
  console.log(openspecCli ? "✓ OpenSpec CLI" : "○ OpenSpec CLI: not detected");
  console.log(openspecProject ? "✓ OpenSpec project structure (openspec/)" : "○ OpenSpec project structure: not detected");
  console.log(specboot ? "✓ SpecBoot" : "○ SpecBoot: not detected");
  const artifacts = runAdoption();
  const sddMessage = configureSddProvider(specboot);
  console.log("\nSDD Provider:");
  console.log(`  ${sddMessage}`);
  console.log(`\n${"─".repeat(60)}`);
  console.log(artifacts.length
    ? `Bootstrap complete — created ${artifacts.length} new artifact(s) (see above).`
    : "Bootstrap complete — this directory was already bootstrapped, nothing new to create.");
  const guided = opts.interactive === true && bootstrapInteractiveNextStep();
  if (guided) return;
  console.log("\nNext steps:");
  console.log("  1. Run: aief doctor");
  console.log("  2. Install OpenSpec if missing: npm install -g @fission-ai/openspec@latest");
  console.log("  3. Initialize OpenSpec if needed: openspec init");
  if (specboot) console.log("  4. SpecBoot detected — see adapters/specboot/README.md (deeper LIDR integration is a following AIEF 3.1 Change).");
  console.log(`  ${specboot ? "5" : "4"}. Create your first AIEF change: aief new-change <name>`);
}
// Line-buffered stdin reader for --interactive's (possibly multi-question)
// flow. Unlike promptSync() (a single blocking read, used only for
// configureSddProvider()'s ambiguous-provider case, where stdin is always a
// real, canonical-mode TTY and exactly one line is ever needed), --interactive
// has no isTTY gate and may run over piped/automated stdin (Change 0068's own
// test suite) — where a single read() can return several newline-terminated
// answers at once. This buffers any bytes read past the first newline so a
// second question doesn't lose them.
function makeLineReader() {
  let buffered = "";
  return function readLine(question) {
    process.stdout.write(question);
    while (!buffered.includes("\n")) {
      const chunk = Buffer.alloc(2048);
      let bytesRead = 0;
      try { bytesRead = fs.readSync(0, chunk, 0, chunk.length, null); } catch { bytesRead = 0; }
      if (bytesRead === 0) break; // EOF — return whatever was buffered, if anything.
      buffered += chunk.toString("utf8", 0, bytesRead);
    }
    const newlineIndex = buffered.indexOf("\n");
    let line;
    if (newlineIndex === -1) { line = buffered; buffered = ""; }
    else { line = buffered.slice(0, newlineIndex); buffered = buffered.slice(newlineIndex + 1); }
    return line.trim();
  };
}
// `--interactive` (Change 0068): merges the manual "read Next steps, then
// separately type aief analyze / aief new-change <name>" flow into one
// guided prompt, for users who opt in. Returns true if it handled the
// "what's next" step itself (so bootstrapHere() skips the static text);
// false if the caller should fall back to it.
function bootstrapInteractiveNextStep() {
  const readLine = makeLineReader();
  const answer = readLine(
    '\nCreate your first Change now?\n  [a] Analyze this existing project (aief analyze)\n  [n] Start a new feature Change (aief new-change)\n  [s] Skip — I\'ll run a command myself\nChoice [s]: '
  ).toLowerCase();
  if (answer === "a" || answer === "analyze") { analyze([]); return true; }
  if (answer === "n" || answer === "new-change") {
    const name = readLine("Change name: ");
    if (name) { newChange([name]); return true; }
    console.log("No name given — skipping.");
    return false;
  }
  return false;
}
function bootstrap(args) {
  const parsed = parseArgs("bootstrap", args);
  if (!parsed) return;
  initProject(parsed._[0], { interactive: parsed.interactive === true, force: parsed.force === true });
}
export function main(args) { const [command, ...rest] = args; switch (command) { case "help": case "--help": case "-h": case undefined: help(rest[0]); break; case "--version": case "-v": printVersion(); break; case "explain": help(rest[0]); break; case "doctor": doctor(rest); break; case "status": status(rest); break; case "bootstrap": bootstrap(rest); break; case "adopt": commandRemoved("adopt"); break; case "analyze": analyze(rest); break; case "init": commandRemoved("init"); break; case "new-change": newChange(rest); break; case "enrich": enrich(rest); break; case "propose": propose(rest); break; case "prompt": prompt(rest); break; case "close": close(rest); break; case "use-profile": useProfile(rest[0]); break; case "verify": verify(rest); break; case "release": release(rest[0]); break; default: console.error(`Unknown command: ${command}`); help(); process.exitCode = 1; }}
