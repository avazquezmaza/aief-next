import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { detectProject, recommendSkills } from "./detect.js";

const STANDARDS_TEMPLATES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "templates", "standards");
const BASE_STANDARDS = ["base-standards.md", "documentation-standards.md", "testing-standards.md", "security-standards.md"];

const CHANGE_FILES = ["change.md", "spec.md", "tasks.md", "evidence.md"];

function cwd(...parts) { return path.resolve(process.cwd(), ...parts); }
function exists(target) { return fs.existsSync(cwd(target)); }
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""; }
function writeFile(filePath, content, overwrite = false) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!overwrite && fs.existsSync(filePath)) return false;
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}
function run(command, args = [], options = {}) {
  return spawnSync(command, args, { stdio: options.stdio || "pipe", shell: process.platform === "win32", encoding: "utf8" });
}
function commandExists(command) {
  const checker = process.platform === "win32" ? "where" : "which";
  return run(checker, [command]).status === 0;
}
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
// (written by `aief close --yes`). The Change files are the only source of truth;
// there is no separate state file.
function isClosed(changeDir) {
  // Anchored to line start so prose that merely mentions "## Status" does not count.
  return /^##\s*status\s*(\r?\n)+\s*closed/im.test(read(path.join(changeDir, "change.md")));
}
function latestChangeDir() {
  const open = getChangeDirs().filter((dir) => !isClosed(dir));
  return open.length ? open[open.length - 1] : null;
}
function printNext(...commands) {
  console.log("\nNext:");
  for (const command of commands) console.log(`  ${command}`);
}
function parseArgs(args) {
  const parsed = { _: [] };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (!next || next.startsWith("--")) parsed[key] = true;
      else { parsed[key] = next; i += 1; }
    } else parsed._.push(arg);
  }
  return parsed;
}
function section(title) { console.log("\n" + title); console.log("─".repeat(60)); }
function printSkills(project) {
  console.log("Recommended Skills:");
  for (const skill of recommendSkills(project)) {
    console.log(`- ${skill.id}: ${skill.description}`);
    for (const reason of skill.because) console.log(`    because: ${reason}`);
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
function listStandards() {
  const dir = cwd("knowledge", "standards");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
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
    purpose: "Inspect your local environment (required, recommended and optional tools) and current project readiness for AIEF.",
    when: "Before adoption or when the project feels misconfigured.",
    reads: "PATH (node, npm, git, openspec, specboot, java, maven, gradle, docker, assistants), package.json, README.md, AGENTS.md, changes/, knowledge/, profiles/, adapters/.",
    writes: "Nothing.",
    example: "aief doctor",
    next: "aief adopt (existing project) or aief init <name> (new project)."
  },
  status: {
    purpose: "Show current AIEF adoption status and recent Changes.",
    when: "When you want to know where the project stands.",
    reads: "Project structure, package.json and changes/.",
    writes: "Nothing.",
    example: "aief status",
    next: "aief prompt if a Change is active, otherwise aief analyze."
  },
  adopt: {
    purpose: "Prepare an existing project to use AIEF without changing application code.",
    when: "Inside an existing project, before analysis or implementation Changes.",
    reads: "README.md, CLAUDE.md, AGENTS.md, package.json and common project files.",
    writes: "AGENTS.md if missing, changes/, knowledge/, profiles/README.md, and changes/<next-id>-adopt-aief/ if missing. Never modifies application code.",
    example: "aief adopt",
    next: "aief verify, then aief analyze."
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
    purpose: "Create a new Change skeleton (change.md, spec.md, tasks.md, evidence.md).",
    when: "Whenever you start a meaningful unit of work.",
    reads: "changes/ to compute the next ID.",
    writes: "changes/<next-id>-<name>/.",
    example: "aief new-change add-login",
    next: "Fill change.md and spec.md, then aief prompt."
  },
  propose: {
    purpose: "Create a proposal from an idea, delegating to OpenSpec when available.",
    when: "When you have an idea but no Change yet.",
    reads: "OpenSpec availability and version, changes/.",
    writes: "OpenSpec output if delegation succeeds, otherwise a local Change plus proposal.md. Falls back loudly, never silently.",
    example: "aief propose \"Add login\"",
    next: "Review the proposal, then aief prompt."
  },
  prompt: {
    purpose: "Generate a ready-to-paste prompt for Claude, Gemini, Codex, Cursor or ChatGPT.",
    when: "After creating a Change.",
    reads: "AGENTS.md, assistant files, profiles and the active (or selected) Change.",
    writes: "Nothing.",
    example: "aief prompt gemini --profile architect   (or: aief prompt --assistant gemini)",
    next: "Paste the prompt into your assistant; afterwards aief verify."
  },
  verify: {
    purpose: "Verify required AIEF files and Change structures.",
    when: "Before commit or after adoption.",
    reads: "README.md, AGENTS.md, changes/, knowledge/.",
    writes: "Nothing.",
    example: "aief verify",
    next: "Fix reported gaps, then aief close."
  },
  close: {
    purpose: "Check that the active Change is ready (files, tasks, evidence) and mark it Closed.",
    when: "After evidence is complete, before commit.",
    reads: "Latest open (or selected) Change: change.md, tasks.md, evidence.md.",
    writes: "A Status section in change.md — only with --yes and only when all checks pass. Without --yes it writes nothing.",
    example: "aief close --yes",
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
  init: {
    purpose: "Initialize the current directory for AIEF (no argument), or create a new project skeleton (with a name).",
    when: "Right after cloning or when starting to use AIEF in a project.",
    reads: "AGENTS.md, changes/, openspec/, specboot markers and PATH (OpenSpec/SpecBoot CLIs).",
    writes: "Without argument: visible AIEF structure only (AGENTS.md if missing, changes/, knowledge/, profiles/) via the adopt logic — never application code, never a hidden .aief/ directory. With a name: <project-name>/ with README.md, AGENTS.md, changes/, knowledge/, src/, tests/.",
    example: "aief init",
    next: "aief doctor, then aief new-change <name>."
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
  console.log(`AIEF CLI\n\nUsage:\n  aief help [command]\n  aief explain <command>\n  aief --help | --version\n\nDiscovery:\n  aief doctor\n  aief status\n\nAdoption:\n  aief init                 (initialize the current directory)\n  aief adopt [--assistant claude|gemini|codex|cursor]\n  aief analyze [name]\n\nWork:\n  aief new-change <name>\n  aief propose <idea>\n  aief prompt [claude|gemini|codex|cursor] [--profile architect] [--change change-id]
              (long form: --assistant gemini)\n  aief verify\n  aief close [--yes] [--change change-id]\n\nProject:\n  aief init <project-name>  (create a new project skeleton)\n  aief release <version>\n`);
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
    standards.length ? standards.map((f) => `- knowledge/standards/${f}`).join("\n") : "- None yet — run `aief adopt` to create starter standards.",
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
  const files = options.type === "analysis" ? analysisChangeFiles(id, slug, options.context) : genericChangeFiles(id, slug, name);
  for (const [file, content] of Object.entries(files)) writeFile(path.join(changeDir, file), content);
  console.log(`Created Change: ${path.relative(process.cwd(), changeDir)}`); return changeDir;
}
function newChange(args) { const parsed = parseArgs(args); const dir = createChange(parsed._.join(" "), { type: parsed.type || "general" }); if (dir) printNext("edit change.md and spec.md", "aief prompt"); }
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
function adopt(args) {
  section("AIEF Adopt"); console.log("Purpose: prepare an existing project to use AIEF without changing application code.");
  runAdoption();
  printNext("aief verify", "aief analyze");
}
// Shared by adopt and init (no argument): creates only visible AIEF structure
// (AGENTS.md, changes/, knowledge/, profiles/) — never a hidden .aief/
// directory (ADR-009: no hidden state) and never application code.
function runAdoption() {
  const project = detectProject();
  const skills = recommendSkills(project);
  const artifacts = [];
  const signalIds = project.signals.map((s) => s.id);
  console.log(`\nDetected: ${signalIds.length ? signalIds.join(", ") : "no strong signals"} (details: aief doctor, knowledge/skills.md)`);
  if (!exists("AGENTS.md")) {
    writeFile(cwd("AGENTS.md"), `# Project Agent Instructions\n\nAI assists. Humans decide.\n\n## Rules\n\n- Read the active Change before editing.\n- Read spec.md before implementation.\n- Read tasks.md before changing files.\n- Keep changes small.\n- Do not modify unrelated files.\n- Update evidence.md before completion.\n\nIf present, also read CLAUDE.md, GEMINI.md, CODEX.md, or CURSOR.md.\n`); console.log("✓ Created AGENTS.md"); artifacts.push("AGENTS.md");
  } else console.log("✓ AGENTS.md already exists");
  fs.mkdirSync(cwd("changes"), { recursive: true }); fs.mkdirSync(cwd("knowledge"), { recursive: true }); fs.mkdirSync(cwd("profiles"), { recursive: true });
  if (writeFile(cwd("knowledge", "README.md"), "# Knowledge\n\nCapture decisions, lessons learned, constraints and project context here.\n")) artifacts.push("knowledge/README.md");
  if (writeFile(cwd("profiles", "README.md"), "# Profiles\n\nUse AIEF role profiles from the source AIEF repository or define project-specific role guidance here.\n")) artifacts.push("profiles/README.md");
  const createdStandards = createStandards(project);
  for (const file of createdStandards) { console.log(`✓ Created knowledge/standards/${file}`); artifacts.push(`knowledge/standards/${file}`); }
  if (!createdStandards.length) console.log("✓ knowledge/standards/ already present (nothing overwritten)");
  if (writeFile(cwd("knowledge", "skills.md"), skillsDoc(project, skills))) { console.log("Skills documented: knowledge/skills.md"); artifacts.push("knowledge/skills.md"); }
  else console.log("Skills documentation already exists: knowledge/skills.md");
  if (!getChangeDirs().some((dir) => path.basename(dir).includes("adopt-aief"))) {
    // Use the next free ID so adoption never collides with existing Changes.
    const id = nextChangeId();
    const dir = cwd("changes", `${id}-adopt-aief`);
    const files = genericChangeFiles(id, "adopt-aief", "Adopt AIEF workflow without changing application behavior.");
    artifacts.push(`changes/${id}-adopt-aief/ (this Change)`);
    writeFile(path.join(dir, "change.md"), files["change.md"]);
    writeFile(path.join(dir, "spec.md"), files["spec.md"]);
    writeFile(path.join(dir, "tasks.md"), `# Tasks\n\n- [x] Create or preserve AGENTS.md.\n- [x] Create changes/, knowledge/ and profiles/.\n- [x] Create knowledge/standards/ starter standards.\n- [x] Generate this Change's evidence automatically.\n- [ ] Edit knowledge/standards/ so the "(adapt)" lines match this project.\n- [ ] Run aief verify, then close this Change: aief close --yes --change adopt-aief\n\nNote: this Change can be closed before or after the Analysis Change. The Analysis Change becomes the active Change automatically.\n`);
    writeFile(path.join(dir, "evidence.md"), adoptionEvidence(project, skills, artifacts));
    console.log(`✓ Created changes/${id}-adopt-aief (evidence generated automatically)`);
  } else console.log("✓ Adoption Change already exists");
}
function analyze(args) {
  const parsed = parseArgs(args);
  section("AIEF Analyze");
  console.log("Purpose: create an Analysis Change seeded with the project context doctor already detects.\nWrites only under changes/<id>-<name>/.\n");
  const project = detectProject();
  const context = { project, skills: recommendSkills(project), standards: listStandards(), skillsDocPresent: exists("knowledge/skills.md") };
  createChange(parsed._.join(" ") || "analyze-current-architecture", { type: "analysis", context });
  if (context.project.signals.length) console.log(`Seeded change.md with ${context.project.signals.length} detected signal(s), ${context.skills.length} skill(s) and ${context.standards.length} standard(s).`);
  printNext("aief prompt claude --profile architect");
}
const ASSISTANT_FILES = { claude: "CLAUDE.md", gemini: "GEMINI.md", codex: "CODEX.md", cursor: "CURSOR.md" };
function prompt(args) {
  const parsed = parseArgs(args); const profile = typeof parsed.profile === "string" ? parsed.profile : "developer"; let changeDir = latestChangeDir();
  // Assistant selection: positional (aief prompt gemini) or --assistant; the
  // explicit flag wins when both are given. Unknown values are a hard error —
  // never a silent fallback.
  const requested = typeof parsed.assistant === "string" ? parsed.assistant : (parsed._[0] || "");
  const assistant = requested.toLowerCase();
  if (requested && !ASSISTANT_FILES[assistant]) {
    console.error(`Unknown assistant "${requested}".\n\nKnown assistants:\n\n${Object.keys(ASSISTANT_FILES).map((a) => `- ${a}`).join("\n")}\n\nIf you meant a role, use:\n\n--profile ${requested}`);
    process.exitCode = 1;
    return;
  }
  if (assistant && !exists(ASSISTANT_FILES[assistant])) console.warn(`Note: ${ASSISTANT_FILES[assistant]} not found in this project${exists("CLAUDE.md") ? "; including CLAUDE.md instead" : ""}.`);
  const assistantFile = ASSISTANT_FILES[assistant] && exists(ASSISTANT_FILES[assistant]) ? ASSISTANT_FILES[assistant] : (exists("CLAUDE.md") ? "CLAUDE.md" : "");
  if (typeof parsed.change === "string") { const matches = getChangeDirs().filter((dir) => path.basename(dir).includes(parsed.change)); if (matches.length) changeDir = matches[matches.length - 1]; }
  section("AIEF Prompt"); console.log("Purpose: generate a ready-to-paste prompt for your AI assistant. Writes nothing.\n");
  if (!changeDir) { console.error("No open Change found."); printNext("aief new-change <name>", "aief analyze"); process.exitCode = 1; return; }
  const changeName = path.relative(process.cwd(), changeDir);
  // CRLF/LF tolerant: a Change written on Windows must still be recognized as Analysis.
  const isAnalysis = /##\s*type\s*(\r?\n)+\s*analysis\b/i.test(read(path.join(changeDir, "change.md")));
  const standards = listStandards();
  const project = detectProject();
  const skills = recommendSkills(project);
  // Re-run guardrail: derived from files, no hidden state. Empty or template
  // ("Pending.") evidence is the normal fresh case and gets no warning.
  const evidenceContent = read(path.join(changeDir, "evidence.md"));
  const hasRealEvidence = evidenceContent.trim().length > 0 && !evidenceIsPlaceholder(changeDir);
  const evidenceGuard = hasRealEvidence ? `\nevidence.md already exists and has real content:\n\n- Do not overwrite it blindly.\n- Review and amend only if needed; preserve existing validated evidence.\n- If no changes are needed, report that the evidence was re-verified.\n` : "";
  const feedbackNote = `\nWhere results belong:\n\n- Project evidence belongs in ${changeName}/evidence.md.\n- Feedback about AIEF or the tooling goes in your response to the user, not in the project evidence, unless the Change explicitly asks for a separate feedback file.\n`;
  const standardsBlock = standards.length ? `\nProject standards to follow:\n\n${standards.map((f) => `- knowledge/standards/${f}`).join("\n")}\n` : "";
  const skillsBlock = skills.length ? `\nRecommended Skills — contextual knowledge for this project (included as context, not executed):\n\n${skills.map((s) => s.promptContext
    ? `- ${s.name || s.id}: ${s.promptContext}${(s.commonRisks || []).length ? `\n  Watch out for: ${s.commonRisks.join("; ")}.` : ""}`
    : `- ${s.name || s.id}: recommended for this project, but it has no operational content yet — treat it as a topic to keep in mind.`).join("\n")}\n` : "";
  console.log("Copy this prompt into your AI assistant:"); console.log("─".repeat(60));
  console.log(`Use AGENTS.md.\n\nAct as the ${profile} profile.\n\nWork only on:\n\n${changeName}\n\nRead these files first:\n\n- ${changeName}/change.md\n- ${changeName}/spec.md\n- ${changeName}/tasks.md\n${assistantFile ? `- ${assistantFile}` : ""}\n${exists("README.md") ? "- README.md" : ""}\n${exists("knowledge/skills.md") ? "- knowledge/skills.md" : ""}\n${standardsBlock}${skillsBlock}${evidenceGuard}${feedbackNote}\nRespect the scope in change.md and the acceptance criteria in spec.md.\n\n${isAnalysis ? `This is an Analysis Change.\n\nDo not modify application source code.\nAnalyze the project and complete or amend:\n\n- ${changeName}/evidence.md\n\nDo not mark tasks.md items yourself unless the Change or the user explicitly asks — instead, tell the user which tasks appear complete.\n` : `Implement only the requested scope.\nAfter implementation, verify acceptance criteria and update ${changeName}/evidence.md.\n`}`); console.log("─".repeat(60));
}
function markClosed(changeDir) {
  const file = path.join(changeDir, "change.md");
  const stamp = `Closed (${new Date().toISOString().slice(0, 10)})`;
  let content = read(file);
  if (/^##\s*status\s*$/im.test(content)) content = content.replace(/(^##\s*Status\s*(?:\r?\n)+)[^\r\n]*/im, `$1${stamp}`);
  else content = `${content.replace(/\s*$/, "")}\n\n## Status\n\n${stamp}\n`;
  writeFile(file, content, true);
  return isClosed(changeDir);
}
function close(args) {
  const parsed = parseArgs(args);
  section("AIEF Close");
  console.log("Purpose: check that the active Change is ready and, with --yes, mark it Closed in change.md.\n");
  let changeDir = latestChangeDir();
  if (typeof parsed.change === "string") { const matches = getChangeDirs().filter((dir) => path.basename(dir).includes(parsed.change)); if (matches.length) changeDir = matches[matches.length - 1]; }
  if (!changeDir) { console.error("No open Change found."); printNext("aief new-change <name>"); process.exitCode = 1; return; }
  const name = path.relative(process.cwd(), changeDir);
  if (isClosed(changeDir)) { console.log(`${name} is already closed.`); return; }
  const result = checkChange(changeDir);
  const openTasks = (read(path.join(changeDir, "tasks.md")).match(/^\s*- \[ \]/gm) || []).length;
  const problems = [
    ...result.missing.map((f) => `${f} is missing`),
    ...result.empty.map((f) => `${f} is empty`),
    ...(evidenceIsPlaceholder(changeDir) ? ["evidence.md has not been completed yet"] : []),
    ...(openTasks ? [`${openTasks} unchecked task(s) in tasks.md`] : [])
  ];
  console.log(`Change: ${name}\n`);
  if (!problems.length) console.log("✓ All readiness checks passed.");
  else for (const problem of problems) console.log(`○ ${problem}`);
  if (!parsed.yes) { printNext(problems.length ? "resolve the items above, then: aief close --yes" : "aief close --yes"); return; }
  if (problems.length) { console.error("\nNot closed: resolve the items above first."); process.exitCode = 1; return; }
  if (!markClosed(changeDir)) { console.error(`\nCould not mark ${name} as Closed — check the Status section in change.md.`); process.exitCode = 1; return; }
  console.log(`\n✓ Closed ${name}.`);
  printNext("git status", "aief status");
}
function checkChange(changeDir) { const missing = [], empty = []; for (const file of CHANGE_FILES) { const full = path.join(changeDir, file); if (!fs.existsSync(full)) missing.push(file); else if (!fs.readFileSync(full, "utf8").trim()) empty.push(file); } return { missing, empty }; }
function evidenceIsPlaceholder(changeDir) {
  const content = read(path.join(changeDir, "evidence.md"));
  return (content.match(/^Pending\.\s*$/gm) || []).length >= 3;
}
function verify() { section("AIEF Verify"); console.log("Purpose: verify required AIEF files and Change structures. Writes nothing.\n"); let ok = true; for (const item of ["README.md", "AGENTS.md", "changes"]) { if (exists(item)) console.log(`✓ ${item}`); else { console.error(`✗ Missing: ${item}`); ok = false; } } if (exists("knowledge")) console.log("✓ knowledge/"); else console.warn("! Recommended but missing: knowledge/"); for (const changeDir of getChangeDirs()) { const name = path.relative(process.cwd(), changeDir); const result = checkChange(changeDir); if (!result.missing.length && !result.empty.length) { const closed = isClosed(changeDir); if (!evidenceIsPlaceholder(changeDir)) console.log(`✓ ${name}${closed ? " (closed)" : ""}`); else if (closed) console.warn(`! ${name} is closed but evidence.md was never completed`); else console.log(`○ ${name} — in progress (evidence not completed yet; expected until the Change is closed)`); } else { ok = false; for (const f of result.missing) console.error(`✗ ${name}/${f} missing`); for (const f of result.empty) console.error(`✗ ${name}/${f} empty`); } } console.log(ok ? "\nResult: PASS" : "\nResult: FAIL"); if (!ok) { printNext("fix the issues above, then run aief verify again"); process.exitCode = 1; return; } const open = latestChangeDir(); if (!open) printNext("no open Change — aief new-change <name> or aief analyze"); else if (evidenceIsPlaceholder(open)) printNext(`aief prompt (work the active Change: ${path.basename(open)}), then aief close`); else printNext(`aief close --yes (active Change ${path.basename(open)} looks ready)`); }
function status(project = detectProject(), showNext = true) { section("AIEF Status"); console.log("Purpose: show current AIEF adoption status. Writes nothing.\n"); const required = [["README", exists("README.md")], ["AGENTS", exists("AGENTS.md")], ["Changes", exists("changes")]]; for (const [n, ok] of required) console.log(`${ok ? "✓" : "!"} ${n}`); const optional = [["Knowledge", exists("knowledge")], ["Profiles", exists("profiles")], ["Navigator", exists("NAVIGATOR.md") || exists("docs/navigator/README.md")], ["OpenSpec adapter", exists("adapters/openspec")], ["Specboot adapter", exists("adapters/specboot")]]; for (const [n, ok] of optional) console.log(ok ? `✓ ${n}` : `· ${n}: not present (optional)`); const changes = getChangeDirs(); console.log(`\nChanges: ${changes.length}`); for (const d of changes.slice(-5)) console.log(`- ${path.relative(process.cwd(), d)}`); console.log(`\nDetected project type: ${project.signals.length ? project.signals.map((s) => s.id).join(", ") : "No strong signals detected."}`); if (showNext) printNext(!exists("AGENTS.md") || !exists("changes") ? "aief adopt" : changes.length ? "aief prompt" : "aief analyze"); }
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
function doctor(args = []) { section("AIEF Doctor"); console.log("Purpose: inspect your environment and project readiness for AIEF.\nDoctor never modifies your project.\n"); doctorEnvironment(); const project = detectProject(); status(project, false); printSignals(project); console.log(""); printSkills(project); printNext(!exists("AGENTS.md") || !exists("changes") ? "aief adopt" : "aief analyze"); }
function initProject(name) { if (!name) return initHere(); const projectPath = path.resolve(name); if (fs.existsSync(projectPath)) { console.error(`Project already exists: ${projectPath}`); process.exitCode = 1; return; } writeFile(path.join(projectPath, "README.md"), `# ${name}\n\nThis project uses AIEF.\n`); writeFile(path.join(projectPath, "AGENTS.md"), "# Project Agent Instructions\n\nAI assists. Humans decide.\n"); fs.mkdirSync(path.join(projectPath, "changes"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "knowledge"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "src"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "tests"), { recursive: true }); console.log(`Created AIEF project: ${projectPath}`); }
// `aief init` without arguments prepares the current directory. It creates
// only visible structure via runAdoption() and reports how AIEF fits with
// OpenSpec and SpecBoot — it informs, it does not install them.
function initHere() {
  section("AIEF Init");
  console.log("Purpose: initialize the current directory to work with AIEF.\nCreates only visible AIEF structure; never modifies application code, never overwrites existing files.\n");
  const openspecCli = commandExists("openspec") || commandExists("opsx");
  const openspecProject = exists("openspec") || exists(".openspec");
  const specboot = commandExists("specboot") || exists("specboot") || exists(".specboot");
  console.log("Detected:");
  console.log(exists("AGENTS.md") ? "✓ AGENTS.md" : "○ AGENTS.md: not present (will be created)");
  console.log(exists("changes") ? "✓ changes/" : "○ changes/: not present (will be created)");
  console.log(openspecCli ? "✓ OpenSpec CLI" : "○ OpenSpec CLI: not detected");
  console.log(openspecProject ? "✓ OpenSpec project structure (openspec/)" : "○ OpenSpec project structure: not detected");
  console.log(specboot ? "✓ SpecBoot" : "○ SpecBoot: not detected");
  runAdoption();
  console.log("\nNext steps:");
  console.log("  1. Run: aief doctor");
  console.log("  2. Install OpenSpec if missing: npm install -g @fission-ai/openspec@latest");
  console.log("  3. Initialize OpenSpec if needed: openspec init");
  console.log("  4. Apply SpecBoot if needed: see adapters/specboot/README.md in the AIEF repo");
  console.log("  5. Create your first AIEF change: aief new-change <name>");
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
  const idea = args.join(" ");
  if (!idea) { console.error('Example: aief propose "Add login"'); process.exitCode = 1; return; }
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
function useProfile(profile) { console.log(`Use AGENTS.md.\n\nAct as the ${slugify(profile || "developer")} profile.\n\nWork only on the active Change.\n`); }
function release(version) { const clean = String(version || "").replace(/^v/, ""); if (!clean) { console.error("Version is required. Example: aief release 0.1.0"); process.exitCode = 1; return; } const file = path.join("releases", `v${clean}.md`); const created = writeFile(file, `# Release v${clean}\n\n## Summary\n\n-\n\n## Verification\n\n-\n`); console.log(created ? `Created release notes: ${file}` : `Release notes already exist (not overwritten): ${file}`); }
function printVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf8"));
  console.log(`aief ${pkg.version}`);
}
export function main(args) { const [command, ...rest] = args; switch (command) { case "help": case "--help": case "-h": case undefined: help(rest[0]); break; case "--version": case "-v": printVersion(); break; case "explain": help(rest[0]); break; case "doctor": doctor(rest); break; case "status": status(); break; case "adopt": adopt(rest); break; case "analyze": analyze(rest); break; case "init": initProject(rest[0]); break; case "new-change": newChange(rest); break; case "propose": propose(rest); break; case "prompt": prompt(rest); break; case "close": close(rest); break; case "use-profile": useProfile(rest[0]); break; case "verify": verify(); break; case "release": release(rest[0]); break; default: console.error(`Unknown command: ${command}`); help(); process.exitCode = 1; }}
