import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs as nodeParseArgs } from "node:util";
import { run, commandExists } from "./process-utils.js";
import { detectProject, recommendSkills } from "./detect.js";
import { PROVIDERS, providerList } from "./requirement.js";
import { retrieveRequirement, hasAdapter, implementedProviders } from "./requirement-providers/index.js";
import { loadChange, isClosedContent, changeTypeFromContent, isEvidencePlaceholderContent, matchChanges } from "./core/domain/change.js";
import { loadChangeUnified } from "./core/domain/change-loader.js";
import { loadWorkflowDefinition, KNOWN_TRACKS } from "./core/domain/workflow-definition.js";
import { verifyProject, verifyChange, checkChangeReadiness } from "./core/services/change-verifier.js";
import { evaluateGates } from "./core/services/gate-evaluator.js";
import { resolveState } from "./core/services/transition-engine.js";
import { resolveSddProvider, sddProviderConfigPath } from "./core/domain/sdd-provider-resolver.js";
import { ASSISTANT_FILES, hasAssistant, assistantIds, assistantConfigPath, resolveAssistant, readProjectAssistantConfig } from "./core/domain/assistant-resolver.js";
import { getProvider } from "./sdd-providers/index.js";
import { resolveSkillRecommendations, resolveStandardRecommendations, deriveResourceDescription } from "./core/domain/ai-specs.js";
import { inspect as inspectWorkflow, nextAction, explain as explainWorkflow } from "./core/services/workflow-service.js";
import { buildSkillContext } from "./core/services/skill-context.js";
import { listSkillDescriptors, runSkill, isUnknownSkillError } from "./core/services/skill-service.js";
import { buildEvent, buildHookContext } from "./core/services/hook-context.js";
import { evaluateEvent } from "./core/services/hook-service.js";
import { resolveHarnessConfig, partitionOutcome, describeHarnessRegistry, hookTitle, formatHookLogSection, formatHookResultsBlock, describeFailingHooks } from "./core/services/harness-service.js";
import { resolveLoopConfig, countPreviousAttempts, decideLoopOutcome, formatLoopSummary, formatLoopLogEntry } from "./core/services/loop-service.js";
import { buildGraph } from "./core/domain/change-graph.js";
import { selectNextChange } from "./core/services/next-change-service.js";
import { buildVerificationContext } from "./core/services/verification-context.js";
import { evaluateRequirements, aggregateVerificationResult } from "./core/services/verification-service.js";
import { parseJUnitReport, renderCapturedVerification } from "./core/domain/junit-report.js";
import { classifyMaturity } from "./core/domain/project-maturity.js";
import { analyzeDefinitionSections, DEFINITION_SECTIONS } from "./core/domain/definition-enrichment.js";
import { replaceOrAppendEvidenceSection } from "./core/domain/evidence-sections.js";

const STANDARDS_TEMPLATES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates", "standards");
const CI_TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates", "ci", "aief-verify.yml");
// The canonical AGENTS.md. Adoption previously wrote a 14-line inline string that
// carried 7 of ~40 rules and none of the (human)/(review) gates, so adopted
// projects never received the governance AIEF documents for itself (Change 0040).
const AGENTS_TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates", "agents", "AGENTS.md");
const BASE_STANDARDS = ["base-standards.md", "documentation-standards.md", "testing-standards.md", "security-standards.md"];

function cwd(...parts) { return path.resolve(process.cwd(), ...parts); }
function exists(target) { return fs.existsSync(cwd(target)); }
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""; }
function writeFile(filePath, content, overwrite = false) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!overwrite && fs.existsSync(filePath)) return false;
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}
// run()/commandExists() now live in ./process-utils.js (Change 0070) —
// shared with sdd-providers/openspec.js, which used to carry its own copy.
function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function nextChangeId(changesDir = cwd("changes")) {
  fs.mkdirSync(changesDir, { recursive: true });
  const numbers = fs.readdirSync(changesDir)
    .map((name) => Number((name.match(/^(\d+)/) || [])[1]))
    .filter((n) => Number.isFinite(n));
  return String(numbers.length ? Math.max(...numbers) + 1 : 1).padStart(4, "0");
}
function getChangeDirs() {
  const changesPath = cwd("changes");
  if (!fs.existsSync(changesPath)) return [];
  return fs.readdirSync(changesPath)
    .filter((name) => fs.statSync(path.join(changesPath, name), { throwIfNoEntry: false })?.isDirectory())
    .sort()
    .map((name) => path.join(changesPath, name));
}
// A Change is closed when its change.md carries a "## Status / Closed" section
// (written by `aief close --yes`) — or, if the Change carries an optional
// manifest.json (AIEF Core 3.0, Entrega 1), when the manifest's own `status`
// field says so; the manifest is authoritative over change.md when present,
// never merged with it (design.md §3 of Change 0043). Either way, the Change
// files are the only source of truth; there is no separate state file.
// Thin wrapper over loadChangeUnified() (core/domain/change-loader.js), used
// by openChangeDirs() (status/prompt/implicit selection) only. `close` does
// NOT use this: `markClosed()` below checks change.md directly, because
// `close` only ever writes change.md — a manifest, if present, is untouched
// and out of scope for Entrega 1 (design.md §9). Sharing this function
// between the two was Change 0043's review finding B1: a successful
// change.md write was reported as a failure whenever a manifest still said
// "open", because this manifest-aware check disagreed with what was just
// written.
function isClosed(changeDir) {
  return loadChangeUnified(changeDir).closed;
}
function changeType(changeDir) {
  return changeTypeFromContent(read(path.join(changeDir, "change.md")));
}
function openChangeDirs() {
  return getChangeDirs().filter((dir) => !isClosed(dir));
}
// AIEF Core 3.0, Entrega 2 (Change 0044, WF-R1/WF-R2 — H2 hardening).
// A Change whose manifest.json exists but fails to parse or fails
// validateManifest() is a distinct, first-class state — never the same as
// "no manifest" (legacy) and never silently reported as a healthy open
// Change. loadChangeUnified() already computes this (Entrega 1); this is
// the first place anything reads .manifestError instead of discarding it.
function invalidManifestChanges() {
  return getChangeDirs()
    .map((dir) => ({ dir, change: loadChangeUnified(dir) }))
    .filter(({ change }) => Array.isArray(change.manifestError) && change.manifestError.length > 0);
}
// AIEF Core 3.0, Entrega 2 (Change 0044) — the Workflow Engine's only wiring
// point. A Change is a workflow candidate when it has a valid manifest with
// a non-empty `track`; everything else (no manifest, manifest with no
// track) is untouched (WF-R17/WF-R18) and never reaches this function.
// Reuses loadWorkflowDefinition() / evaluateGates() / resolveState() as-is —
// this function only wires them together for `status`, per design.md §3's
// data flow. Never called for a Change with .manifestError (H2 already
// reports those separately) or with no `.track`.
function resolveWorkflowFor(change) {
  if (!KNOWN_TRACKS.includes(change.track)) {
    // WF-R7: an unrecognized track is a distinct, explicit error — never
    // silently ignored, never guessed into one of the three known tracks.
    return { kind: "unknown_track", error: `unknown track ${JSON.stringify(change.track)} — expected one of ${KNOWN_TRACKS.join(", ")}` };
  }
  const definition = loadWorkflowDefinition(change.track);
  if (!definition.ok) {
    // AIEF's own shipped workflow file is broken — an internal bug, not a
    // problem with this Change's manifest (design.md §10).
    return { kind: "internal_error", error: definition.error };
  }
  const gateResults = evaluateGates(change, definition.value);
  const state = resolveState(change, definition.value, gateResults);
  return { kind: "resolved", definition: definition.value, gateResults, state };
}
// Every Change whose manifest declares a track — split into ones the engine
// could resolve and ones it couldn't (unknown track / internal error),
// mirroring invalidManifestChanges()'s own additive-section pattern.
function workflowChanges() {
  return getChangeDirs()
    .map((dir) => ({ dir, change: loadChangeUnified(dir) }))
    .filter(({ change }) => !change.manifestError && change.manifest && change.track)
    .map(({ dir, change }) => ({ dir, change, workflow: resolveWorkflowFor(change) }));
}
// AIEF Core 3.0, Entrega 3 (Change 0045) — SDD Provider, `status` wiring.
// Only Changes whose manifest declares an `sdd` section reach this list
// (SDD-R34: additive-only). A Change with no `sdd` never resolves a
// provider here — LocalSddProvider is never shown "automatically" for a
// Change that didn't ask for SDD information, so the legacy/Entrega-1/2
// output stays byte-identical for every Change without one (100% of this
// repository today).
function sddChanges() {
  return getChangeDirs()
    .map((dir) => ({ dir, change: loadChangeUnified(dir) }))
    .filter(({ change }) => !change.manifestError && change.manifest?.sdd)
    .map(({ dir, change }) => ({ dir, change, resolution: resolveSddProvider(change, cwd()) }));
}
// buildProjectGraph() (Change 0058/ADR-028) — the only place that gathers
// real Changes for the dependency Graph. An invalid manifest's dependsOn
// (if any) is never trusted, same guard sddChanges()/workflowChanges()
// already use — mirrors their exact pattern. Read-only: never writes a
// file, never caches, rebuilds on every call (ADR-009).
function buildProjectGraph() {
  const nodes = getChangeDirs().map((dir) => {
    const change = loadChangeUnified(dir);
    const dependsOn = !change.manifestError && Array.isArray(change.manifest?.dependsOn) ? change.manifest.dependsOn : [];
    return { id: path.basename(dir), dependsOn };
  });
  return buildGraph(nodes);
}
// Change selection (Flux Portal dogfooding, ROADMAP-TO-1.0 workstream 1):
// one shared implementation for every command that operates on a Change.
// Explicit `--change` resolves through matchChanges() and fails loudly on
// no match or an ambiguous match — never "last match wins", never a silent
// fallback to the latest open Change. Without `--change`, exactly one open
// Change keeps the classic ergonomics; more than one is an actionable error
// for mutating/composing commands. No session state is stored (ADR-009):
// resolution is derived from the files on every invocation.
function resolveExplicitChange(selector) {
  const matches = matchChanges(selector, getChangeDirs());
  if (!matches.length) {
    const open = openChangeDirs();
    console.error(`No Change found matching "${selector}".${open.length ? `\n\nOpen Changes:\n\n${open.map((d) => `- ${path.basename(d)}`).join("\n")}` : ""}`);
    process.exitCode = 1;
    return null;
  }
  if (matches.length > 1) {
    console.error(`Ambiguous --change "${selector}" — ${matches.length} Changes match:\n\n${matches.map((d) => `- ${path.basename(d)}`).join("\n")}\n\nUse a more specific value (full ID or full name).`);
    process.exitCode = 1;
    return null;
  }
  return matches[0];
}
function resolveImplicitChange(commandExample) {
  const open = openChangeDirs();
  if (!open.length) { console.error("No open Change found."); process.exitCode = 1; return null; }
  if (open.length === 1) return open[0];
  console.error(`Multiple open Changes (${open.length}) — not selecting one implicitly:\n\n${open.map((d) => `- ${path.basename(d)}`).join("\n")}\n\nSelect one explicitly:\n\n  ${commandExample} --change <id>`);
  process.exitCode = 1;
  return null;
}
function printNext(...commands) {
  console.log("\nNext:");
  for (const command of commands) console.log(`  ${command}`);
}
// Strict, schema-based flag parsing (Change 0077, finding F7/H4). Every
// command declares its own exact, already-known option set up front
// (KNOWN_FLAGS below, one entry per command) via node:util.parseArgs()'s
// own `options` shape — an option outside that set is rejected explicitly
// (exit 1, clear message) instead of the old hand-rolled parser's silent
// accept-and-ignore. Callers get back the same `{ _, ...flags }` shape
// parseArgs() has always returned (positionals under `_`, boolean/string
// flags at the top level) so no command handler's `parsed._`/`parsed.<flag>`
// reads need to change — only the parsing call site itself does.
function parseCommandArgs(command, args, optionsSchema = {}) {
  let result;
  try {
    result = nodeParseArgs({ args, options: optionsSchema, allowPositionals: true, strict: true });
  } catch (err) {
    console.error(`aief ${command}: ${err.message}`);
    process.exitCode = 1;
    return null;
  }
  return { _: result.positionals, ...result.values };
}
// Every command's exact current flag set, enumerated from its existing
// parsed.<flag>/parsed["<flag>"] reads — no flag added, none removed.
const KNOWN_FLAGS = {
  "new-change": { type: { type: "string" } },
  enrich: { file: { type: "string" } },
  // --maturity (Change 0080): explicit override for classifyMaturity()'s
  // routing — lets a human force "definition"/"implemented" instead of
  // accepting the detected value, the same "explicit over implicit" escape
  // hatch --type already gives new-change. Never required for normal use.
  analyze: { maturity: { type: "string" } },
  propose: { change: { type: "string" } },
  prompt: {
    assistant: { type: "string" },
    profile: { type: "string" },
    change: { type: "string" },
    skill: { type: "string" },
    "list-skills": { type: "boolean" },
    "set-assistant": { type: "string" },
    "show-assistant": { type: "boolean" },
    "clear-assistant": { type: "boolean" }
  },
  close: { yes: { type: "boolean" }, change: { type: "string" }, "evidence-from": { type: "string" } },
  // --strict (Change 0083): opt-in objective-completeness checking on top of
  // default verify's structural rules — never on by default (backward
  // compatible), never a quality score (checkStrictCompleteness()).
  verify: { change: { type: "string" }, requirements: { type: "boolean" }, strict: { type: "boolean" } },
  status: { change: { type: "string" }, next: { type: "boolean" }, graph: { type: "boolean" } },
  doctor: { verbose: { type: "boolean" } },
  bootstrap: { interactive: { type: "boolean" }, force: { type: "boolean" } }
};
function parseArgs(command, args) {
  return parseCommandArgs(command, args, KNOWN_FLAGS[command] || {});
}
function section(title) { console.log("\n" + title); console.log("─".repeat(60)); }
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
function listStandards() {
  const dir = cwd("knowledge", "standards");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
}
// Maps listStandards()'s bare filenames into the { id, description, path }
// shape resolveResources() (and resolveStandardRecommendations()) can
// consume as `builtins` (Change 0055/ADR-025) — id is the filename without
// `.md` (so it can collide, by id, with an ai-specs/standards/<id>.md);
// description is derived from the file's own first heading, read from disk
// exactly once here, never cached, never written back.
function builtinStandardsList() {
  return listStandards().map((file) => {
    const filePath = cwd("knowledge", "standards", file);
    return { id: file.replace(/\.md$/i, ""), description: deriveResourceDescription(read(filePath)), path: filePath };
  });
}
function printSignals(project) {
  console.log("\nDetected project signals:");
  if (!project.signals.length) { console.log("(none)"); return; }
  for (const signal of project.signals) {
    console.log(`✓ ${signal.id} (${signal.signal}): ${signal.reasons.join("; ")}`);
  }
}
const COMMAND_HELP = {
  doctor: {
    purpose: "Inspect your local environment (required, recommended and optional tools) and current project readiness for AIEF. Recommended Skills include a project's own ai-specs/skills/*.md alongside AIEF's built-ins (project wins on id collision) — --verbose shows source, file path and overrides.",
    when: "Before adoption or when the project feels misconfigured.",
    reads: "PATH (node, npm, git, openspec, specboot, java, maven, gradle, docker, assistants), package.json, README.md, AGENTS.md, changes/, knowledge/, profiles/, adapters/, ai-specs/skills/.",
    writes: "Nothing.",
    example: "aief doctor   (or: aief doctor --verbose)",
    next: "aief bootstrap (current directory) or aief bootstrap <name> (new project)."
  },
  status: {
    purpose: "Show current AIEF adoption status, recent Changes and all open Changes. With --change <id>, inspect one Change (track, stage, blockers, SDD readiness); add --next for its compact next-action. Without --change, --next deterministically recommends the next eligible open Change when more than one is open (or explains why none is eligible). --graph shows the full Change dependency graph (nodes, edges, topological order, issues).",
    when: "When you want to know where the project stands, which Change to select with --change, or what a specific Change's next action is.",
    reads: "Project structure, package.json, changes/ and every Change's manifest.dependsOn.",
    writes: "Nothing.",
    example: "aief status --change <id> --next   (or: aief status --next / aief status --graph)",
    next: "aief prompt (one open Change) or aief prompt --change <id> (several open)."
  },
  bootstrap: {
    purpose: "Bootstrap a project to use AIEF: detects what it can, asks only what it must (the SDD Provider, only when genuinely ambiguous), and creates AIEF's visible structure without changing application code. Replaces the former init/adopt commands.",
    when: "Right after cloning, or the first time an existing project starts using AIEF.",
    reads: "AGENTS.md, changes/, openspec/, specboot markers, PATH (OpenSpec/SpecBoot CLIs, TTY), package.json, README.md and common project files.",
    writes: "Current directory (no argument): AGENTS.md if missing, changes/, knowledge/, profiles/, knowledge/standards/, knowledge/skills.md, the CI gate, changes/<next-id>-adopt-aief/, and knowledge/sdd-provider.json only when the SDD Provider choice is ambiguous and you are prompted. With a name: <project-name>/ with README.md, AGENTS.md, changes/, knowledge/, src/, tests/. Never modifies application code, never overwrites existing files, never a hidden .aief/ directory.",
    example: "aief bootstrap   (or: aief bootstrap my-project)",
    next: "aief verify, then aief analyze or aief new-change <name>."
  },
  analyze: {
    purpose: "Create an Analysis Change for an existing project.",
    when: "After adopt, before functional or architectural changes.",
    reads: "Project signals (package.json, README.md, docs).",
    writes: "changes/<next-id>-analyze-current-architecture/ (or the name you pass).",
    example: "aief analyze",
    next: "aief prompt --profile architect."
  },
  "new-change": {
    purpose: "Create a new Change skeleton (change.md, spec.md, tasks.md, evidence.md). --type definition scaffolds a pre-implementation Definition Change (context, open questions, decisions requiring human approval) instead of the default general skeleton.",
    when: "Whenever you start a meaningful unit of work. Use --type definition before application code exists, when what's unresolved is requirements/architecture/product decisions rather than implementation.",
    reads: "changes/ to compute the next ID.",
    writes: "changes/<next-id>-<name>/.",
    example: "aief new-change add-login   (or: aief new-change \"define project architecture\" --type definition)",
    next: "Fill change.md and spec.md, then aief prompt."
  },
  enrich: {
    purpose: "Normalize a requirement from an external source (Requirement Source) into a Change, read-only.",
    when: "When work starts from Jira, Notion, GitHub Issues or another requirement source instead of an idea.",
    reads: "The source, read-only (manual: nothing; jira: a local export file, no network, no credentials).",
    writes: "changes/<next-id>-<provider>-<source-id>/ (change.md, spec.md, tasks.md, evidence.md) if it does not already exist. Never writes to the external source.",
    example: "aief enrich manual TEST-001   (or: aief enrich jira ISSUE-123 --file requirements/jira/ISSUE-123.json)",
    next: "Review spec.md and Open Questions (Requires Human Review), then aief propose or aief prompt."
  },
  propose: {
    purpose: "Create a proposal from an idea (delegating to OpenSpec when available), or continue an existing Change with --change.",
    when: "When you have an idea but no Change yet, or when continuing an existing Change (e.g. after aief enrich + Human Review).",
    reads: "OpenSpec availability and version, changes/. With --change: the existing Change directory.",
    writes: "OpenSpec output if delegation succeeds, otherwise a local Change plus proposal.md (new idea) — or, with --change, only proposal.md inside that existing Change, never touching its change.md/spec.md/tasks.md and never overwriting an existing proposal.md. Falls back loudly, never silently.",
    example: "aief propose \"Add login\"   (or: aief propose --change 0002-manual-test-001)",
    next: "Review the proposal, then aief prompt."
  },
  prompt: {
    purpose: "Generate a ready-to-paste, assistant-agnostic prompt (native file for Claude, Gemini, Codex or Cursor; a generic AGENTS.md-only prompt for any other assistant, e.g. OpenCode). With no assistant named, resolves one automatically: explicit argument/--assistant > AIEF_ASSISTANT env var > knowledge/assistant.json > passive detection of a single native file present > an interactive choice on a TTY when 2+ native files are found and nothing else disambiguates them (a non-interactive shell fails instead of guessing). Never picks Claude as a silent default.",
    when: "After creating a Change. With several open Changes, name the target with --change <id>. Use --set-assistant/--show-assistant/--clear-assistant to manage the saved project preference.",
    reads: "AGENTS.md, assistant files, AIEF_ASSISTANT, knowledge/assistant.json, profiles and the selected Change (implicit only when exactly one Change is open).",
    writes: "Nothing for a normal prompt (including the interactive TTY choice — that applies to the current run only, never saved). --set-assistant writes/overwrites knowledge/assistant.json; --clear-assistant deletes it if present. --show-assistant writes nothing.",
    example: "aief prompt gemini --profile architect --change 0002-add-login   (single open Change: aief prompt gemini; set a default: aief prompt --set-assistant claude)",
    next: "Paste the prompt into your assistant; afterwards aief verify."
  },
  verify: {
    purpose: "Verify required AIEF files and Change structures — the whole project, or one Change with --change. --strict adds optional, objective completeness checks (unresolved TODO/TBD, untouched scaffold placeholders, empty Requirements/Acceptance Criteria, a Definition decision with no recorded outcome, an unresolved required human decision) on top of the default structural checks — default verify is unchanged either way.",
    when: "Before commit or after adoption; with --change <id> to check a single Change and see exactly which one was verified. Add --strict when you want to catch objectively incomplete work, not just structurally broken Changes.",
    reads: "README.md, AGENTS.md, changes/, knowledge/.",
    writes: "Nothing.",
    example: "aief verify   (or: aief verify --change 0002-add-login --strict)",
    next: "Fix reported gaps, then aief close."
  },
  close: {
    purpose: "Check that a Change is ready (files, tasks, evidence) and mark it Closed.",
    when: "After evidence is complete, before commit. With several open Changes, --change <id> is required — close never picks one implicitly.",
    reads: "The selected Change (implicit only when exactly one is open): change.md, tasks.md, evidence.md. With --evidence-from <path>, also a JUnit XML report at that path (already produced by your own test runner/CI — never executed by AIEF).",
    writes: "A Status section in change.md — only with --yes and only when all checks pass. With --evidence-from <path> (Change 0071), the Change's evidence.md ## Verification section, filled in with the report's counts — existing content there is never overwritten, only appended to or, on a repeat capture, replaced in place. Without --yes or --evidence-from, writes nothing.",
    example: "aief close --yes --change 0002-add-login   (single open Change: aief close --yes)\naief close --evidence-from test-results.xml --change 0002-add-login   (capture test counts into evidence.md first)",
    next: "Commit your work, then aief status."
  },
  release: {
    purpose: "Create release notes for a version.",
    when: "When preparing a release.",
    reads: "releases/.",
    writes: "releases/v<version>.md if it does not exist (never overwrites).",
    example: "aief release 0.2.0",
    next: "Fill in the release notes, then tag the release."
  },
  "use-profile": {
    purpose: "Print a minimal prompt header for a role profile.",
    when: "When you want the assistant to act as a specific role.",
    reads: "Nothing.",
    writes: "Nothing.",
    example: "aief use-profile developer",
    next: "aief prompt for a full, Change-aware prompt."
  },
  help: {
    purpose: "Show general usage or detailed help for one command.",
    when: "Anytime.",
    reads: "Nothing.",
    writes: "Nothing.",
    example: "aief help adopt",
    next: "Run the command you just read about."
  },
  explain: {
    purpose: "Alias of help: show detailed help for one command.",
    when: "Anytime.",
    reads: "Nothing.",
    writes: "Nothing.",
    example: "aief explain doctor",
    next: "Run the command you just read about."
  }
};
function printCommandHelp(command) {
  const info = COMMAND_HELP[command];
  if (!info) { console.error(`Unknown help topic: ${command}`); console.log(`Available topics: ${Object.keys(COMMAND_HELP).join(", ")}`); process.exitCode = 1; return; }
  console.log(`AIEF Help: ${command}`); console.log("─".repeat(60));
  console.log(`\nPurpose\n${info.purpose}\n\nWhen to use it\n${info.when}\n\nReads\n${info.reads}\n\nWrites\n${info.writes}\n\nExample\n  ${info.example}\n\nNext step\n${info.next}`);
}
function help(topic) {
  if (topic) return printCommandHelp(topic);
  console.log(`AIEF CLI\n\nUsage:\n  aief help [command]\n  aief explain <command>\n  aief --help | --version\n\nDiscovery:\n  aief doctor [--verbose]\n  aief status [--change change-id] [--next] [--graph]\n\nBootstrap:\n  aief bootstrap             (bootstrap the current directory)\n  aief analyze [name]\n\nWork:\n  aief new-change <name>\n  aief enrich manual|jira <source-id> [--file path]\n  aief propose <idea> [--change change-id]\n  aief prompt [claude|gemini|codex|cursor] [--profile architect] [--change change-id]
              (long form: --assistant gemini; no name given: resolves automatically)
              (aief prompt --set-assistant <name> | --show-assistant | --clear-assistant)\n  aief verify [--change change-id]\n  aief close [--yes] [--change change-id]\n\nProject:\n  aief bootstrap <project-name>  (create a new project skeleton)\n  aief release <version>\n`);
}
function evidenceTemplate() {
  return `# Evidence\n\n## Summary\n\nPending.\n\n## Activities Performed\n\nPending.\n\n## Verification\n\nPending.\n\n## Findings\n\nPending.\n\n## Risks\n\nPending.\n\n## Recommendations\n\nPending.\n\n## Artifacts Produced\n\nPending.\n\n## Lessons Learned\n\nPending.\n\n## Next Change\n\nPending.\n`;
}
function analysisContextSection(context) {
  if (!context) return "";
  const { project, skills, standards } = context;
  const risks = skills.flatMap((s) => (s.commonRisks || []).map((r) => `- (inferred from ${s.id}) ${r}`));
  return [
    "\n## Detected Context",
    "",
    "> Generated automatically by `aief analyze` from project signals. Everything below is detection or inference — confirm or discard it during the analysis.",
    "",
    "### Signals",
    "",
    project.signals.length ? project.signals.map((s) => `- ${s.id} (${s.signal}): ${s.reasons.join("; ")}`).join("\n") : "- No strong signals detected.",
    "",
    "### Recommended Skills",
    "",
    skills.map((s) => `- ${s.id}: ${s.description || s.whenToUse || ""}`).join("\n"),
    ...(context.skillsDocPresent ? ["", "Full Skill knowledge: knowledge/skills.md"] : []),
    "",
    "### Available Standards",
    "",
    standards.length ? standards.map((f) => `- knowledge/standards/${f}`).join("\n") : "- None yet — run `aief bootstrap` to create starter standards.",
    "",
    "### Initial Risks (inferred from detected technologies — confirm or discard)",
    "",
    risks.length ? risks.join("\n") : "- None inferred.",
    "",
    "### Open Questions",
    "",
    "- Which detected technologies are actually in active use?",
    "- Do the standards in knowledge/standards/ match current practice?",
    "- What is intentionally out of scope for this analysis?",
    ""
  ].join("\n");
}
function analysisChangeFiles(id, slug, context) {
  return {
    "change.md": `# Change\n\n## ID\n\n\`${id}-${slug}\`\n\n## Type\n\nAnalysis\n\n## Objective\n\nAnalyze the current state of the project before implementing architectural or functional changes.\n\n## Scope\n\n### In scope\n\n- Analyze repository structure.\n- Review existing documentation.\n- Review current architecture.\n- Review runtime and development setup.\n- Review authentication and authorization.\n- Review integrations.\n- Review deployment and infrastructure.\n- Identify technical debt.\n- Identify risks.\n- Produce recommendations.\n\n### Out of scope\n\n- Implementing new functionality.\n- Refactoring existing code.\n- Modifying infrastructure.\n- Updating dependencies.\n\n## Success Criteria\n\n- Current architecture is documented.\n- Major gaps are identified.\n- Technical risks are documented.\n- Recommended next Changes are proposed.\n${analysisContextSection(context)}`,
    "spec.md": `# Specification\n\n## Goal\n\nProduce a practical architectural assessment of the existing project.\n\n## Deliverables\n\n- Current architecture summary.\n- Gap analysis.\n- Risk list.\n- Technical debt list.\n- Recommended Change roadmap.\n\n## Acceptance Criteria\n\n- [ ] Repository structure reviewed.\n- [ ] Documentation reviewed.\n- [ ] Major modules reviewed.\n- [ ] Risks identified.\n- [ ] Roadmap proposed.\n- [ ] Evidence updated.\n`,
    "tasks.md": `# Tasks\n\n- [ ] Review repository structure.\n- [ ] Review package and build configuration.\n- [ ] Review environment configuration.\n- [ ] Read README.\n- [ ] Read architecture documents.\n- [ ] Read assistant instruction files.\n- [ ] Confirm or discard the Detected Context section in change.md.\n- [ ] Review knowledge/standards/ against actual practice.\n- [ ] Review application architecture.\n- [ ] Review security model.\n- [ ] Review integrations.\n- [ ] Review infrastructure.\n- [ ] Identify strengths, gaps, risks and technical debt.\n- [ ] Complete evidence.md.\n`,
    "evidence.md": evidenceTemplate()
  };
}
// Definition Changes (Change 0079, ADR-013/ADR-031 pattern): pre-implementation
// work — resolving what should be built, not analyzing what already exists.
// Reuses the existing `## Type` surface (already General/Analysis/Enrichment)
// with one more accepted value and the existing `(human)` task-marker gate —
// no new command, no second approval mechanism. See change.md's own
// "Inventory of what already exists" for the ADR-013 accounting.
function definitionChangeFiles(id, slug, title = "") {
  return {
    "change.md": `# Change\n\n## ID\n\n\`${id}-${slug}\`\n\n## Type\n\nDefinition\n\n## Objective\n\nDefine ${title || slug} before implementation begins: resolve open questions, evaluate options, and turn approved decisions into durable knowledge and implementation prerequisites.\n\n## Scope\n\n### In scope\n\n- Capture business/product context, known requirements and assumptions.\n- Raise open questions and identify decisions that require a human.\n- Evaluate options and trade-offs; recommend only where evidence supports it.\n- Record approved decisions in knowledge/decisions.md.\n- Produce implementation prerequisites and follow-up Changes.\n\n### Out of scope\n\n- Implementing application code.\n- Refactoring or scaffolding a codebase.\n- Modifying infrastructure.\n- Auto-approving architecture or product decisions — every decision below requires explicit (human) approval.\n\n## Context\n\n-\n\n## Business / Product Constraints\n\n-\n\n## Known Requirements\n\n-\n\n## Assumptions\n\n-\n\n## Open Questions\n\n-\n\n## Decisions Required\n\n-\n\n## Options Considered\n\n-\n\n## Recommendation\n\n-\n\n## Decision (human)\n\nPending human approval. Do not treat any Recommendation above as final until this section records an explicit human decision.\n\n## Rationale\n\n-\n\n## Consequences\n\n-\n\n## Non-Functional Requirements\n\n-\n\n## Security & Compliance\n\n-\n\n## Data & Domain\n\n-\n\n## Integrations\n\n-\n\n## Deployment & Operations\n\n-\n\n## Implementation Prerequisites\n\n-\n\n## Follow-up Changes\n\n-\n\n## Success Criteria\n\n- Open Questions are resolved or explicitly deferred.\n- Every entry in Decisions Required has a human-approved Decision recorded here and in knowledge/decisions.md.\n- Implementation Prerequisites and Follow-up Changes are identified.\n`,
    "spec.md": `# Specification\n\n## Goal\n\nTurn ${title || slug} into durable, human-approved decisions and implementation-ready prerequisites — without writing application code.\n\n## Requirements\n\n-\n\n## Acceptance Criteria\n\n- [ ] Context, Business/Product Constraints and Known Requirements are captured.\n- [ ] Open Questions are answered or explicitly deferred.\n- [ ] Every Decision Required has a Recommendation and an explicit human Decision.\n- [ ] Approved decisions are recorded in knowledge/decisions.md.\n- [ ] Implementation Prerequisites and Follow-up Changes are listed.\n- [ ] Evidence updated.\n`,
    "tasks.md": `# Tasks\n\n## Definition\n\n- [ ] Capture Context, Business/Product Constraints and Known Requirements.\n- [ ] List Assumptions and Open Questions.\n- [ ] Identify Decisions Required and evaluate Options Considered.\n- [ ] Write a Recommendation for each decision, only where evidence supports one.\n\n## Human Approval\n\n- [ ] (human) Review and approve, amend or reject each Recommendation in change.md.\n- [ ] (human) Record the final Decision and Rationale for each approved item.\n\n## Durable Knowledge\n\n- [ ] Record approved decisions in knowledge/decisions.md.\n- [ ] List Implementation Prerequisites and Follow-up Changes.\n\n## Evidence\n\n- [ ] Update evidence.md.\n`,
    "evidence.md": evidenceTemplate()
  };
}
function genericChangeFiles(id, slug, title = "") {
  return {
    "change.md": `# Change\n\n## ID\n\n\`${id}-${slug}\`\n\n## Type\n\nGeneral\n\n## Objective\n\n${title || slug}\n\n## Scope\n\n### In scope\n\n-\n\n### Out of scope\n\n-\n\n## Success Criteria\n\n-\n`,
    "spec.md": `# Specification\n\n## Goal\n\nWhat should be true after this Change?\n\n## Requirements\n\n-\n\n## Acceptance Criteria\n\n- [ ]\n`,
    "tasks.md": `# Tasks\n\n## Implementation\n\n- [ ]\n\n## Documentation\n\n- [ ]\n\n## Verification\n\n- [ ]\n\n## Evidence\n\n- [ ] Update evidence.md\n`,
    "evidence.md": evidenceTemplate()
  };
}
function createChange(name, options = {}) {
  const slug = slugify(name); if (!slug) { console.error("Change name is required."); process.exitCode = 1; return null; }
  const id = nextChangeId(); const changeDir = cwd("changes", `${id}-${slug}`);
  const files = options.type === "analysis" ? analysisChangeFiles(id, slug, options.context)
    : options.type === "definition" ? definitionChangeFiles(id, slug, name)
      : genericChangeFiles(id, slug, name);
  for (const [file, content] of Object.entries(files)) writeFile(path.join(changeDir, file), content);
  console.log(`Created Change: ${path.relative(process.cwd(), changeDir)}`); return changeDir;
}
function newChange(args) { const parsed = parseArgs("new-change", args); if (!parsed) return; const dir = createChange(parsed._.join(" "), { type: parsed.type || "general" }); if (dir) printNext("edit change.md and spec.md", `aief prompt --change ${path.basename(dir)}`); }

// Requirement Sources / Enrichment: real work starts in Jira, Notion, GitHub
// Issues or a document, not in `aief new-change`. Every provider is read-only
// and produces the same Normalized Requirement; enrichment output always lands
// in visible Change artifacts (no hidden state) and always requires human
// review before implementation — enforced by the same close/verify gates
// every other Change already uses (unchecked Human Review tasks refuse close).
//
// cli.js never branches on a provider name: `retrieveRequirement` (imported
// from requirement-providers/) is the one contract every provider implements,
// so adding notion/github/azure-devops/markdown means adding an adapter file
// there, never touching the functions below.
function findChangeBySlugSuffix(slug) {
  return getChangeDirs().find((dir) => path.basename(dir).endsWith(`-${slug}`));
}
function requirementFactsAndAssumptions(requirement) {
  const fields = [
    ["Title", requirement.title],
    ["Description", requirement.description],
    ["Status (source)", requirement.status],
    ["Priority", requirement.priority],
    ["Reporter", requirement.reporter],
    ["Assignee", requirement.assignee],
    ["Labels", requirement.labels.length ? requirement.labels.join(", ") : ""],
    ["Comments", requirement.comments.length ? `${requirement.comments.length} comment(s) retrieved` : ""],
    ["Attachments", requirement.attachments.length ? requirement.attachments.join(", ") : ""],
    ["Links", requirement.links.length ? requirement.links.join(", ") : ""]
  ];
  const facts = fields.filter(([, v]) => v).map(([k, v]) => `- **${k}:** ${v}`);
  const assumptions = fields.filter(([, v]) => !v).map(([k]) => `- **${k}:** not provided by the source — treat as unknown until a human confirms it.`);
  return { facts, assumptions };
}
function enrichmentChangeFiles(id, slug, provider, sourceId, requirement, retrieved, notes) {
  const today = new Date().toISOString().slice(0, 10);
  const { facts, assumptions } = requirementFactsAndAssumptions(requirement);
  const openQuestions = [...notes.openQuestions];
  if (!requirement.title || requirement.title === sourceId) openQuestions.push("- What is the actual title/summary of this requirement? (currently a placeholder)");
  if (!requirement.description) openQuestions.push("- What is the full description / acceptance intent behind this requirement?");
  if (!openQuestions.length) openQuestions.push("- None identified yet. If new information emerges before Human Review, add it here.");
  const changeMd = `# Change\n\n## ID\n\n\`${id}-${slug}\`\n\n## Type\n\nEnrichment\n\n## Objective\n\nNormalize the requirement from ${provider}:${sourceId} into AIEF Change artifacts, without modifying the source or implementing application code.\n\n## Scope\n\n### In scope\n\n- Retrieve the requirement from ${provider} (read-only).\n- Normalize it into a common Requirement shape.\n- Classify information as Fact [H], Inference [I] or Assumption [S].\n- Raise open questions.\n- Require human review before any implementation.\n\n### Out of scope\n\n- Implementing application code.\n- Modifying the external source (${provider}) in any way — it is read-only.\n- Approving scope or acceptance criteria — that is a human decision, not this Change's job.\n\n## Requirement Source\n\n- **Provider:** ${provider}\n- **Source ID:** ${sourceId}\n- **Source URL:** ${requirement.sourceUrl || "(not available)"}\n- **Retrieved at:** ${requirement.retrievedAt}\n- **Read-only:** yes — AIEF never writes back to ${provider}.\n\n## Success Criteria\n\n- Requirement normalized into spec.md with [H]/[I]/[S] classification.\n- Open questions recorded.\n- Human review completed before implementation begins.\n\n## Review Status\n\nRequires Human Review\n`;
  const specMd = `# Specification\n\n## Goal\n\n${requirement.title || "(unknown — see Open Questions)"}\n\n## Normalized Requirement\n\n- **Provider:** ${provider}\n- **Source ID:** ${sourceId}\n- **Title:** ${requirement.title || "(unknown)"}\n- **Description:** ${requirement.description || "(unknown)"}\n\n## Facts, Inferences, Assumptions\n\n### [H] Facts (directly from the source)\n\n${facts.length ? facts.join("\n") : "- None retrieved yet."}\n\n### [I] Inferences (derived, not stated by the source)\n\n- None recorded yet. Add any inference here during Human Review, with its reasoning.\n\n### [S] Assumptions (missing data, treated as unknown)\n\n${assumptions.length ? assumptions.join("\n") : "- None — every field was retrieved from the source."}\n\n## Open Questions\n\n${openQuestions.join("\n")}\n\n## Acceptance Criteria\n\n- [ ] A human has reviewed this spec and the Normalized Requirement above.\n- [ ] Every open question is answered or explicitly deferred with a reason.\n- [ ] Scope in change.md is approved or adjusted by a human.\n`;
  const tasksMd = `# Tasks\n\n## Human Review (required before implementation)\n\n- [ ] Review spec.md and the Normalized Requirement.\n- [ ] Answer or explicitly defer each Open Question.\n- [ ] Approve or adjust the scope in change.md.\n- [ ] Decide whether to proceed (\`aief propose\` / \`aief prompt\`) or close this Change as not actionable.\n\n## Enrichment (done automatically by \`aief enrich\`)\n\n- [x] Retrieve the requirement from ${provider}:${sourceId} (read-only).\n- [x] Normalize into Facts [H] / Inferences [I] / Assumptions [S].\n- [x] Record source metadata and mark it read-only.\n\n## Evidence\n\n- [ ] Update evidence.md\n`;
  const evidenceMd = `# Evidence\n\n> Generated by AIEF during enrichment.\n\n## Summary\n\nRequirement ${provider}:${sourceId} retrieved (read-only) and normalized into this Change on ${today}.\n\n## Activities Performed\n\n- Retrieved requirement metadata from ${provider} (${sourceId})${retrieved ? "" : " — no local data found; placeholder only"}.\n- Normalized into Facts [H] / Inferences [I] / Assumptions [S] in spec.md.\n- Recorded the source as read-only; no writes were made against ${provider}.\n\n## Verification\n\n- Source read-only: confirmed — no code path in this Change writes back to ${provider}.\n- No application code modified.\n- No credentials read, stored or required.\n\n## Findings\n\n${facts.length ? facts.join("\n") : "- No fields retrieved yet — see Open Questions in spec.md."}\n\n## Risks\n\n- Fields marked [S] in spec.md are assumptions — confirm during Human Review before implementation.\n${notes.riskNotes.length ? `${notes.riskNotes.join("\n")}\n` : ""}\n## Recommendations\n\n- Complete Human Review (tasks.md) before running \`aief propose\` or \`aief prompt\`.\n\n## Artifacts Produced\n\n- changes/${id}-${slug}/ (this Change)\n\n## Lessons Learned\n\n- Pending — add after Human Review.\n\n## Next Change\n\nComplete Human Review, then \`aief propose\` or \`aief prompt\` to continue toward implementation.\n`;
  return { "change.md": changeMd, "spec.md": specMd, "tasks.md": tasksMd, "evidence.md": evidenceMd };
}
function enrich(args) {
  const parsed = parseArgs("enrich", args);
  if (!parsed) return;
  const provider = (parsed._[0] || "").toLowerCase();
  const sourceId = parsed._[1] || "";
  section("AIEF Enrich");
  console.log("Purpose: normalize a requirement from an external source (read-only) into a new or existing Change. Never modifies the source; never implements code.\n");
  if (!provider || !PROVIDERS[provider]) {
    console.error(`Unknown or missing provider${provider ? ` "${provider}"` : ""}.\n\nKnown providers:\n\n${providerList(hasAdapter)}\n\nExample:\n  aief enrich manual TEST-001`);
    process.exitCode = 1;
    return;
  }
  if (!hasAdapter(provider)) {
    console.error(`Provider "${provider}" is not implemented yet. It is planned — see docs/requirement-sources.md.\n\nImplemented now: ${implementedProviders().join(", ")}.`);
    process.exitCode = 1;
    return;
  }
  if (!sourceId) { console.error(`Source ID is required.\n\nExample:\n  aief enrich ${provider} <source-id>`); process.exitCode = 1; return; }
  const slug = slugify(`${provider}-${sourceId}`);
  const existing = findChangeBySlugSuffix(slug);
  if (existing) {
    console.log(`A Change for ${provider}:${sourceId} already exists: ${path.relative(process.cwd(), existing)}`);
    console.log("Not creating a duplicate. Re-run enrich under a different source-id if this is genuinely a new requirement.");
    printNext(`review ${path.relative(process.cwd(), existing)}/spec.md`, "aief prompt");
    return;
  }
  const { requirement, retrieved, openQuestions, riskNotes, consoleNotes } = retrieveRequirement(provider, sourceId, parsed);
  for (const note of consoleNotes) console.log(note);
  const id = nextChangeId();
  const changeDir = cwd("changes", `${id}-${slug}`);
  const files = enrichmentChangeFiles(id, slug, provider, sourceId, requirement, retrieved, { openQuestions, riskNotes });
  for (const [file, content] of Object.entries(files)) writeFile(path.join(changeDir, file), content);
  const name = path.relative(process.cwd(), changeDir);
  console.log(`Created Change: ${name}`);
  console.log(`Source: ${provider}:${sourceId} (read-only; nothing was written back to ${provider}).`);
  console.log("\nThis Change requires human review before any implementation.");
  printNext(`review ${name}/spec.md and answer its Open Questions`, `approve or adjust scope in ${name}/change.md`, `then: aief propose --change ${path.basename(changeDir)} (or aief prompt --change ${path.basename(changeDir)})`);
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
// `init`/`adopt` were replaced by `aief bootstrap` in Change 0052 (ADR-013:
// bootstrap merges them rather than sitting beside them). Their
// implementations are kept as internal functions, called only from
// bootstrap()'s dispatch — never exposed as public commands again.
function commandRemoved(oldName) {
  console.error(`aief ${oldName} has been replaced by aief bootstrap. Run: aief bootstrap`);
  process.exitCode = 1;
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
const KNOWN_MATURITY_VALUES = new Set(["definition", "implemented", "ambiguous"]);

// Change 0080: `aief analyze` used to unconditionally create an Analysis
// Change — correct once application code exists, wrong for a repository
// still in Definition (README/PRD/business requirements, no source yet):
// that repository would get "review package configuration", "inspect source
// modules" tasks for things that do not exist.
//
// Routing, in priority order:
// - maturity "implemented" -> today's exact behavior, byte-identical
//   (Analysis Change). Never regressed.
// - maturity "definition"  -> a Definition Change instead (Change 0079),
//   seeded with the same Objective text, explaining why.
// - maturity "ambiguous"   -> falls back to today's exact behavior (Analysis
//   Change), the smallest, safest, backward-compatible choice for a
//   near-empty repository — but the ambiguity itself is reported explicitly,
//   never silently swallowed. A bare/near-empty directory is exactly what
//   every pre-existing `aief analyze` caller and test already expects to
//   produce an Analysis Change; refusing to act here would be a real,
//   observable regression, not a safety improvement. `--maturity` lets a
//   human override the detected value either way.
function analyze(args) {
  const parsed = parseArgs("analyze", args);
  if (!parsed) return;
  let maturityOverride = null;
  if (typeof parsed.maturity === "string") {
    maturityOverride = parsed.maturity.toLowerCase();
    if (!KNOWN_MATURITY_VALUES.has(maturityOverride)) {
      console.error(`Unknown --maturity "${parsed.maturity}". Use one of: ${[...KNOWN_MATURITY_VALUES].join(", ")}.`);
      process.exitCode = 1;
      return;
    }
  }
  section("AIEF Analyze");
  const detected = classifyMaturity(cwd());
  const maturity = maturityOverride || detected.maturity;
  const name = parsed._.join(" ") || "analyze-current-architecture";

  if (maturity === "definition") {
    console.log("Purpose: create a Definition Change — this repository looks pre-implementation (requirements/context present, no application source found).\nWrites only under changes/<id>-<name>/.\n");
    console.log(`Detected maturity: Definition${maturityOverride ? " (forced via --maturity)" : ""}.\n${detected.reasons.map((r) => `- ${r}`).join("\n")}\n`);
    const dir = createChange(name, { type: "definition" });
    printNext(dir ? `aief prompt --change ${path.basename(dir)}` : "aief prompt", "See docs/getting-started.md for the pre-implementation Definition workflow.");
    return;
  }

  console.log("Purpose: create an Analysis Change seeded with the project context doctor already detects.\nWrites only under changes/<id>-<name>/.\n");
  if (maturity === "ambiguous" && !maturityOverride) {
    console.log(`Project maturity is ambiguous — defaulting to Analysis.\n${detected.reasons.map((r) => `- ${r}`).join("\n")}\nRun \`aief new-change <name> --type definition\` instead if this is actually pre-implementation work, or \`aief analyze --maturity definition\` to force this classification.\n`);
  }
  const project = detectProject();
  const context = { project, skills: recommendSkills(project), standards: listStandards(), skillsDocPresent: exists("knowledge/skills.md") };
  const dir = createChange(name, { type: "analysis", context });
  if (context.project.signals.length) console.log(`Seeded change.md with ${context.project.signals.length} detected signal(s), ${context.skills.length} skill(s) and ${context.standards.length} standard(s).`);
  // Explicit selection in the hint: after adoption there are typically two
  // open Changes (adopt-aief + this Analysis), so the suggested command must
  // name its target instead of relying on implicit "latest open".
  printNext(dir ? `aief prompt claude --profile architect --change ${path.basename(dir)}` : "aief prompt claude --profile architect");
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
function appendHookLog(changeDir, { operation, event, entries, passed }) {
  const file = path.join(changeDir, "hooks.md");
  const already = fs.existsSync(file);
  const header = "# Harness Log\n\nVisible, append-only record of Hook executions for this Change (Change 0056/ADR-026). Only each Hook's own short summary is recorded — never raw command output, full context, or credentials (Hooks structurally cannot produce either).\n";
  const section = formatHookLogSection({
    timestamp: new Date().toISOString(),
    operation,
    changeId: path.basename(changeDir),
    event,
    passed,
    entries: entries.map((r) => ({ hook: r.hook, event: r.event, status: r.status, summary: r.summary }))
  });
  writeFile(file, `${already ? read(file) : header}\n${section}`, true);
}
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
// evidenceIsPlaceholder(changeDir) stays a thin wrapper (delegating to the
// domain content predicate) because prompt() reads it independently of any
// full Change load — verify()/close() below use loadChange() instead and
// read the same evidencePlaceholder flag off the already-loaded Change.
function evidenceIsPlaceholder(changeDir) {
  return isEvidencePlaceholderContent(read(path.join(changeDir, "evidence.md")));
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
// Validate the OpenSpec CLI contract before delegating. Never assume
// "openspec propose <idea>" exists: check installation, version and
// whether the propose command is actually exposed.
function openspecInfo() {
  if (!commandExists("openspec")) return { installed: false };
  const versionResult = run("openspec", ["--version"]);
  const version = versionResult.status === 0 ? String(versionResult.stdout || "").trim() : "unknown";
  const helpResult = run("openspec", ["--help"]);
  const helpText = `${helpResult.stdout || ""}${helpResult.stderr || ""}`;
  const supportsPropose = helpResult.status === 0 && /\bpropose\b/i.test(helpText);
  return { installed: true, version, supportsPropose };
}
function propose(args) {
  section("AIEF Propose");
  const parsed = parseArgs("propose", args);
  if (!parsed) return;
  // --change continues an existing Change (e.g. after `aief enrich` + Human
  // Review) instead of forking a new one: it only adds/keeps proposal.md,
  // never touching change.md/spec.md/tasks.md, so the Requirement Source,
  // Normalized Requirement, [H]/[I]/[S] classification and Human Review
  // status already recorded there stay exactly as they are.
  if (typeof parsed.change === "string") { proposeForChange(parsed.change, parsed._.join(" ")); return; }
  const idea = parsed._.join(" ");
  if (!idea) { console.error('Example: aief propose "Add login"\n   or: aief propose --change <change-id>   (continue an existing Change, e.g. after aief enrich)'); process.exitCode = 1; return; }
  const openspec = openspecInfo();
  if (!openspec.installed) {
    console.log("OpenSpec is not installed. Creating a local Change instead.");
  } else if (!openspec.supportsPropose) {
    console.warn(`OpenSpec ${openspec.version} is installed but does not expose a "propose" command. Falling back to local Change generation.`);
  } else {
    console.log(`Delegating to OpenSpec ${openspec.version}...`);
    const r = run("openspec", ["propose", idea], { stdio: "inherit" });
    if (r.status === 0) return;
    console.error(`OpenSpec delegation failed (exit code ${r.status}). Falling back to local Change generation.`);
  }
  const dir = createChange(idea);
  if (dir) {
    writeFile(path.join(dir, "proposal.md"), `# Proposal\n\n## Idea\n\n${idea}\n\n## Why\n\n-\n\n## What Changes\n\n-\n`);
    console.log("Created local proposal.md.");
    printNext("review proposal.md", "aief prompt");
  }
}
function proposeForChange(changeId, idea) {
  // Same shared resolver as prompt/verify/close — never "last match wins".
  const changeDir = resolveExplicitChange(changeId);
  if (!changeDir) { printNext("aief status"); return; }
  const name = path.relative(process.cwd(), changeDir);
  const proposalPath = path.join(changeDir, "proposal.md");
  const title = idea || path.basename(changeDir).replace(/^\d+-/, "");
  console.log(`Change: ${name}\n`);
  const created = writeFile(proposalPath, `# Proposal\n\n## Idea\n\n${title}\n\n## Why\n\n-\n\n## What Changes\n\n-\n\n## Source\n\nThis Change's Requirement Source, Normalized Requirement and Human Review status remain in change.md and spec.md — this proposal does not replace or duplicate them.\n`);
  if (created) console.log(`Created ${name}/proposal.md.`);
  else console.log(`${name}/proposal.md already exists — not overwritten. Edit it directly, or review change.md/spec.md for the underlying requirement.`);
  printNext(`review ${name}/proposal.md and ${name}/spec.md`, "aief prompt");
}
function useProfile(profile) { console.log(`Use AGENTS.md.\n\nAct as the ${slugify(profile || "developer")} profile.\n\nWork only on the active Change.\n`); }
function release(version) { const clean = String(version || "").replace(/^v/, ""); if (!clean) { console.error("Version is required. Example: aief release 0.1.0"); process.exitCode = 1; return; } const file = path.join("releases", `v${clean}.md`); const created = writeFile(file, `# Release v${clean}\n\n## Summary\n\n-\n\n## Verification\n\n-\n`); console.log(created ? `Created release notes: ${file}` : `Release notes already exist (not overwritten): ${file}`); }
function printVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"));
  console.log(`aief ${pkg.version}`);
}
export function main(args) { const [command, ...rest] = args; switch (command) { case "help": case "--help": case "-h": case undefined: help(rest[0]); break; case "--version": case "-v": printVersion(); break; case "explain": help(rest[0]); break; case "doctor": doctor(rest); break; case "status": status(rest); break; case "bootstrap": bootstrap(rest); break; case "adopt": commandRemoved("adopt"); break; case "analyze": analyze(rest); break; case "init": commandRemoved("init"); break; case "new-change": newChange(rest); break; case "enrich": enrich(rest); break; case "propose": propose(rest); break; case "prompt": prompt(rest); break; case "close": close(rest); break; case "use-profile": useProfile(rest[0]); break; case "verify": verify(rest); break; case "release": release(rest[0]); break; default: console.error(`Unknown command: ${command}`); help(); process.exitCode = 1; }}
