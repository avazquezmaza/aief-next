import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { detectProject, recommendSkills } from "./detect.js";

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
function latestChangeDir() {
  const changes = getChangeDirs();
  return changes.length ? changes[changes.length - 1] : null;
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
function printSignals(project) {
  console.log("\nDetected project signals:");
  if (!project.signals.length) { console.log("(none)"); return; }
  for (const signal of project.signals) {
    console.log(`✓ ${signal.id} (${signal.signal}): ${signal.reasons.join("; ")}`);
  }
}
const COMMAND_HELP = {
  doctor: {
    purpose: "Inspect your local environment and current project readiness for AIEF.",
    when: "Before adoption or when the project feels misconfigured.",
    reads: "PATH, package.json, README.md, AGENTS.md, changes/, knowledge/, profiles/, adapters/.",
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
    example: "aief prompt --profile architect --change 0002",
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
    purpose: "Guide closure of the active Change.",
    when: "After evidence is ready.",
    reads: "Latest or selected Change.",
    writes: "Nothing in this MVP; prints the closure checklist.",
    example: "aief close",
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
    purpose: "Create a new AIEF project skeleton.",
    when: "When starting a project from scratch.",
    reads: "Nothing.",
    writes: "<project-name>/ with README.md, AGENTS.md, changes/, knowledge/, src/, tests/.",
    example: "aief init my-project",
    next: "cd my-project, then aief new-change <name>."
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
  console.log(`AIEF CLI\n\nUsage:\n  aief help [command]\n  aief explain <command>\n\nDiscovery:\n  aief doctor\n  aief status\n\nAdoption:\n  aief adopt [--assistant claude|gemini|codex|cursor]\n  aief analyze [name]\n\nWork:\n  aief new-change <name>\n  aief propose <idea>\n  aief prompt [--profile architect] [--change change-id]\n  aief verify\n  aief close [--change change-id]\n\nProject:\n  aief init <project-name>\n  aief release <version>\n`);
}
function evidenceTemplate() {
  return `# Evidence\n\n## Summary\n\nPending.\n\n## Activities Performed\n\nPending.\n\n## Verification\n\nPending.\n\n## Findings\n\nPending.\n\n## Risks\n\nPending.\n\n## Recommendations\n\nPending.\n\n## Artifacts Produced\n\nPending.\n\n## Lessons Learned\n\nPending.\n\n## Next Change\n\nPending.\n`;
}
function analysisChangeFiles(id, slug) {
  return {
    "change.md": `# Change\n\n## ID\n\n\`${id}-${slug}\`\n\n## Type\n\nAnalysis\n\n## Objective\n\nAnalyze the current state of the project before implementing architectural or functional changes.\n\n## Scope\n\n### In scope\n\n- Analyze repository structure.\n- Review existing documentation.\n- Review current architecture.\n- Review runtime and development setup.\n- Review authentication and authorization.\n- Review integrations.\n- Review deployment and infrastructure.\n- Identify technical debt.\n- Identify risks.\n- Produce recommendations.\n\n### Out of scope\n\n- Implementing new functionality.\n- Refactoring existing code.\n- Modifying infrastructure.\n- Updating dependencies.\n\n## Success Criteria\n\n- Current architecture is documented.\n- Major gaps are identified.\n- Technical risks are documented.\n- Recommended next Changes are proposed.\n`,
    "spec.md": `# Specification\n\n## Goal\n\nProduce a practical architectural assessment of the existing project.\n\n## Deliverables\n\n- Current architecture summary.\n- Gap analysis.\n- Risk list.\n- Technical debt list.\n- Recommended Change roadmap.\n\n## Acceptance Criteria\n\n- [ ] Repository structure reviewed.\n- [ ] Documentation reviewed.\n- [ ] Major modules reviewed.\n- [ ] Risks identified.\n- [ ] Roadmap proposed.\n- [ ] Evidence updated.\n`,
    "tasks.md": `# Tasks\n\n- [ ] Review repository structure.\n- [ ] Review package and build configuration.\n- [ ] Review environment configuration.\n- [ ] Read README.\n- [ ] Read architecture documents.\n- [ ] Read assistant instruction files.\n- [ ] Review application architecture.\n- [ ] Review security model.\n- [ ] Review integrations.\n- [ ] Review infrastructure.\n- [ ] Identify strengths, gaps, risks and technical debt.\n- [ ] Complete evidence.md.\n`,
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
  const files = options.type === "analysis" ? analysisChangeFiles(id, slug) : genericChangeFiles(id, slug, name);
  for (const [file, content] of Object.entries(files)) writeFile(path.join(changeDir, file), content);
  console.log(`Created Change: ${path.relative(process.cwd(), changeDir)}`); return changeDir;
}
function newChange(args) { const parsed = parseArgs(args); createChange(parsed._.join(" "), { type: parsed.type || "general" }); }
function adopt(args) {
  section("AIEF Adopt"); console.log("Purpose: prepare an existing project to use AIEF without changing application code.");
  const project = detectProject();
  printSignals(project);
  if (!exists("AGENTS.md")) {
    writeFile(cwd("AGENTS.md"), `# Project Agent Instructions\n\nAI assists. Humans decide.\n\n## Rules\n\n- Read the active Change before editing.\n- Read spec.md before implementation.\n- Read tasks.md before changing files.\n- Keep changes small.\n- Do not modify unrelated files.\n- Update evidence.md before completion.\n\nIf present, also read CLAUDE.md, GEMINI.md, CODEX.md, or CURSOR.md.\n`); console.log("✓ Created AGENTS.md");
  } else console.log("✓ AGENTS.md already exists");
  fs.mkdirSync(cwd("changes"), { recursive: true }); fs.mkdirSync(cwd("knowledge"), { recursive: true }); fs.mkdirSync(cwd("profiles"), { recursive: true });
  writeFile(cwd("knowledge", "README.md"), "# Knowledge\n\nCapture decisions, lessons learned, constraints and project context here.\n");
  writeFile(cwd("profiles", "README.md"), "# Profiles\n\nUse AIEF role profiles from the source AIEF repository or define project-specific role guidance here.\n");
  if (!getChangeDirs().some((dir) => path.basename(dir).includes("adopt-aief"))) {
    // Use the next free ID so adoption never collides with existing Changes.
    const id = nextChangeId();
    const dir = cwd("changes", `${id}-adopt-aief`);
    const files = genericChangeFiles(id, "adopt-aief", "Adopt AIEF workflow without changing application behavior.");
    writeFile(path.join(dir, "change.md"), files["change.md"]);
    writeFile(path.join(dir, "spec.md"), files["spec.md"]);
    writeFile(path.join(dir, "tasks.md"), "# Tasks\n\n- [x] Create or preserve AGENTS.md.\n- [x] Create changes/.\n- [x] Create knowledge/.\n- [x] Create adoption Change.\n- [ ] Run aief verify.\n- [ ] Update evidence.md.\n");
    writeFile(path.join(dir, "evidence.md"), evidenceTemplate()); console.log(`✓ Created changes/${id}-adopt-aief`);
  } else console.log("✓ Adoption Change already exists");
  console.log(""); printSkills(project); console.log("\nNext:\n  aief verify\n  aief analyze");
}
function analyze(args) { const parsed = parseArgs(args); section("AIEF Analyze"); console.log("Purpose: create an Analysis Change for an existing project.\nWrites only under changes/<id>-<name>/.\n"); createChange(parsed._.join(" ") || "analyze-current-architecture", { type: "analysis" }); console.log("\nNext:\n  aief prompt --profile architect"); }
function prompt(args) {
  const parsed = parseArgs(args); const profile = typeof parsed.profile === "string" ? parsed.profile : "developer"; let changeDir = latestChangeDir();
  if (typeof parsed.change === "string") { const matches = getChangeDirs().filter((dir) => path.basename(dir).includes(parsed.change)); if (matches.length) changeDir = matches[matches.length - 1]; }
  section("AIEF Prompt"); console.log("Purpose: generate a ready-to-paste prompt for your AI assistant. Writes nothing.\n");
  if (!changeDir) { console.error("No Change found. Run: aief new-change <name> or aief analyze"); process.exitCode = 1; return; }
  const changeName = path.relative(process.cwd(), changeDir);
  // CRLF/LF tolerant: a Change written on Windows must still be recognized as Analysis.
  const isAnalysis = /##\s*type\s*(\r?\n)+\s*analysis\b/i.test(read(path.join(changeDir, "change.md")));
  console.log("Copy this prompt into your AI assistant:"); console.log("─".repeat(60));
  console.log(`Use AGENTS.md.\n\nAct as the ${profile} profile.\n\nWork only on:\n\n${changeName}\n\nRead these files first:\n\n- ${changeName}/change.md\n- ${changeName}/spec.md\n- ${changeName}/tasks.md\n${exists("CLAUDE.md") ? "- CLAUDE.md" : ""}\n${exists("README.md") ? "- README.md" : ""}\n\n${isAnalysis ? `This is an Analysis Change.\n\nDo not modify application source code.\nAnalyze the project and complete only:\n\n- ${changeName}/evidence.md\n` : `Implement only the requested scope.\nAfter implementation, verify acceptance criteria and update ${changeName}/evidence.md.\n`}`); console.log("─".repeat(60));
}
function close(args) { section("AIEF Close"); console.log("Purpose: guide closure of the active Change. Writes nothing in this MVP.\n"); const changeDir = latestChangeDir(); if (!changeDir) { console.error("No Change found."); process.exitCode = 1; return; } console.log(`Active Change: ${path.relative(process.cwd(), changeDir)}\n`); console.log("Before commit, confirm:\n- [ ] evidence.md has Summary.\n- [ ] evidence.md has Activities Performed.\n- [ ] evidence.md has Verification and actual results.\n- [ ] evidence.md has Findings or implementation summary.\n- [ ] evidence.md has Risks or Known Issues.\n- [ ] evidence.md has Recommendations.\n- [ ] evidence.md has Lessons Learned.\n- [ ] evidence.md has Next Change.\n\nRecommended commands:\n  aief verify\n  git status"); }
function checkChange(changeDir) { const missing = [], empty = []; for (const file of CHANGE_FILES) { const full = path.join(changeDir, file); if (!fs.existsSync(full)) missing.push(file); else if (!fs.readFileSync(full, "utf8").trim()) empty.push(file); } return { missing, empty }; }
function evidenceIsPlaceholder(changeDir) {
  const content = read(path.join(changeDir, "evidence.md"));
  return (content.match(/^Pending\.\s*$/gm) || []).length >= 3;
}
function verify() { section("AIEF Verify"); console.log("Purpose: verify required AIEF files and Change structures. Writes nothing.\n"); let ok = true; for (const item of ["README.md", "AGENTS.md", "changes"]) { if (exists(item)) console.log(`✓ ${item}`); else { console.error(`✗ Missing: ${item}`); ok = false; } } if (exists("knowledge")) console.log("✓ knowledge/"); else console.warn("! Recommended but missing: knowledge/"); for (const changeDir of getChangeDirs()) { const name = path.relative(process.cwd(), changeDir); const result = checkChange(changeDir); if (!result.missing.length && !result.empty.length) { if (evidenceIsPlaceholder(changeDir)) console.warn(`! ${name}/evidence.md still has template placeholders ("Pending.")`); else console.log(`✓ ${name}`); } else { ok = false; for (const f of result.missing) console.error(`✗ ${name}/${f} missing`); for (const f of result.empty) console.error(`✗ ${name}/${f} empty`); } } console.log(ok ? "\nResult: PASS" : "\nResult: FAIL"); if (!ok) process.exitCode = 1; }
function status(project = detectProject()) { section("AIEF Status"); console.log("Purpose: show current AIEF adoption status. Writes nothing.\n"); const checks = [["README", exists("README.md")], ["AGENTS", exists("AGENTS.md")], ["Navigator", exists("NAVIGATOR.md") || exists("docs/navigator/README.md")], ["Changes", exists("changes")], ["Knowledge", exists("knowledge")], ["Profiles", exists("profiles")], ["OpenSpec adapter", exists("adapters/openspec")], ["Specboot adapter", exists("adapters/specboot")]]; for (const [n, ok] of checks) console.log(`${ok ? "✓" : "!"} ${n}`); const changes = getChangeDirs(); console.log(`\nChanges: ${changes.length}`); for (const d of changes.slice(-5)) console.log(`- ${path.relative(process.cwd(), d)}`); console.log(`\nDetected project type: ${project.signals.length ? project.signals.map((s) => s.id).join(", ") : "No strong signals detected."}`); console.log("\nNext:"); console.log(!exists("AGENTS.md") || !exists("changes") ? "  aief adopt" : changes.length ? "  aief prompt" : "  aief analyze"); }
function doctor(args = []) { section("AIEF Doctor"); console.log("Purpose: inspect your environment and project readiness for AIEF.\nDoctor never modifies your project.\n"); console.log("Environment:"); for (const [name, ok] of [["git", commandExists("git")], ["node", commandExists("node")], ["npm", commandExists("npm")], ["openspec", commandExists("openspec") || commandExists("opsx")], ["npx", commandExists("npx")]]) console.log(`${ok ? "✓" : "!"} ${name}`); const project = detectProject(); status(project); printSignals(project); console.log(""); printSkills(project); console.log("\nRecommended next step:"); console.log(!exists("AGENTS.md") || !exists("changes") ? "  aief adopt" : "  aief analyze"); }
function initProject(name) { const projectName = name || "aief-project"; const projectPath = path.resolve(projectName); if (fs.existsSync(projectPath)) { console.error(`Project already exists: ${projectPath}`); process.exitCode = 1; return; } writeFile(path.join(projectPath, "README.md"), `# ${projectName}\n\nThis project uses AIEF.\n`); writeFile(path.join(projectPath, "AGENTS.md"), "# Project Agent Instructions\n\nAI assists. Humans decide.\n"); fs.mkdirSync(path.join(projectPath, "changes"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "knowledge"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "src"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "tests"), { recursive: true }); console.log(`Created AIEF project: ${projectPath}`); }
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
    console.log("Created local proposal.md. Next: review it, then run aief prompt.");
  }
}
function useProfile(profile) { console.log(`Use AGENTS.md.\n\nAct as the ${slugify(profile || "developer")} profile.\n\nWork only on the active Change.\n`); }
function release(version) { const clean = String(version || "").replace(/^v/, ""); if (!clean) { console.error("Version is required. Example: aief release 0.1.0"); process.exitCode = 1; return; } const file = path.join("releases", `v${clean}.md`); const created = writeFile(file, `# Release v${clean}\n\n## Summary\n\n-\n\n## Verification\n\n-\n`); console.log(created ? `Created release notes: ${file}` : `Release notes already exist (not overwritten): ${file}`); }
export function main(args) { const [command, ...rest] = args; switch (command) { case "help": case undefined: help(rest[0]); break; case "explain": help(rest[0]); break; case "doctor": doctor(rest); break; case "status": status(); break; case "adopt": adopt(rest); break; case "analyze": analyze(rest); break; case "init": initProject(rest[0]); break; case "new-change": newChange(rest); break; case "propose": propose(rest); break; case "prompt": prompt(rest); break; case "close": close(rest); break; case "use-profile": useProfile(rest[0]); break; case "verify": verify(); break; case "release": release(rest[0]); break; default: console.error(`Unknown command: ${command}`); help(); process.exitCode = 1; }}
