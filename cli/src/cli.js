import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const CHANGE_FILES = ["change.md", "spec.md", "tasks.md", "evidence.md"];

function cwd(...parts) { return path.resolve(process.cwd(), ...parts); }
function exists(target) { return fs.existsSync(cwd(target)); }
function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""; }
function writeFile(filePath, content, overwrite = false) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (overwrite || !fs.existsSync(filePath)) fs.writeFileSync(filePath, content, "utf8");
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
    .filter((name) => fs.statSync(path.join(changesPath, name)).isDirectory())
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
function searchText(paths, needle) {
  const n = needle.toLowerCase();
  return paths.some((p) => {
    const full = cwd(p);
    return fs.existsSync(full) && fs.readFileSync(full, "utf8").toLowerCase().includes(n);
  });
}
function detectProject() {
  const packageJsonPath = cwd("package.json");
  let packageJson = {};
  if (fs.existsSync(packageJsonPath)) {
    try { packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")); } catch { packageJson = {}; }
  }
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const tech = {
    nextjs: Boolean(deps.next),
    react: Boolean(deps.react),
    nestjs: Object.keys(deps).some((d) => d.startsWith("@nestjs/")),
    typescript: Boolean(deps.typescript) || exists("tsconfig.json"),
    tailwind: Boolean(deps.tailwindcss) || exists("tailwind.config.ts") || exists("tailwind.config.js"),
    postgres: Object.keys(deps).some((d) => ["pg", "postgres", "postgres-js", "@prisma/client"].includes(d)),
    aws: Object.keys(deps).some((d) => d.startsWith("@aws-sdk/")) || exists("terraform") || exists("infra"),
    cognito: Object.keys(deps).some((d) => d.includes("cognito")),
    n8n: JSON.stringify(packageJson).toLowerCase().includes("n8n") || searchText(["README.md", "CLAUDE.md"], "n8n"),
    multitenant: searchText(["README.md", "CLAUDE.md", "docs/architecture.md"], "tenant"),
    rbac: searchText(["README.md", "CLAUDE.md", "docs/architecture.md"], "rbac") || searchText(["README.md", "CLAUDE.md"], "permission"),
    aiRoadmap: searchText(["README.md", "CLAUDE.md"], "ai") || searchText(["README.md", "CLAUDE.md"], "llm")
  };
  return { packageJson, tech };
}
function recommendedSkills(project) {
  const skills = [];
  if (project.tech.multitenant) skills.push(["multitenant-saas-architect", "Tenant isolation, Host header resolution, tenant lifecycle, SaaS architecture."]);
  if (project.tech.n8n) skills.push(["n8n-automation-ops", "n8n Queue Mode, workflow catalog, executions, workers, Redis, health checks."]);
  if (project.tech.aws) skills.push(["aws-saas-platform", "Cognito, RDS PostgreSQL, Secrets Manager, CloudFront, WAF, CloudWatch, CodePipeline, Terraform."]);
  if (project.tech.rbac || project.tech.multitenant) skills.push(["security-rbac-reviewer", "Server-side authorization, permissions, tenant isolation, secrets, audit events."]);
  if (project.tech.nextjs || project.tech.nestjs) skills.push(["nextjs-nestjs-architecture", "Frontend/backend separation, server components, APIs, NestJS modules, adapter patterns."]);
  if (project.tech.aiRoadmap) skills.push(["ai-workflow-governance", "AI-generated workflows, human approval, inactive drafts, governance, auditability."]);
  if (!skills.length) skills.push(["project-architecture-reviewer", "General architecture review, module boundaries, risks, and technical debt."]);
  return skills;
}
function printSkills(project) {
  console.log("Recommended Skills:");
  for (const [name, description] of recommendedSkills(project)) console.log(`- ${name}: ${description}`);
}
const COMMAND_HELP = {
  doctor: ["Inspect your local environment and current project readiness for AIEF.", "Use before adoption or when the project feels misconfigured.", "Reads PATH, README.md, AGENTS.md, changes/, knowledge/, profiles/, adapters/.", "Writes nothing."],
  status: ["Show current AIEF adoption status and recent Changes.", "Use when you want to know where the project stands.", "Reads project structure and Changes.", "Writes nothing."],
  adopt: ["Prepare an existing project to use AIEF without changing application code.", "Use inside an existing project before analysis or implementation Changes.", "Reads README.md, CLAUDE.md, package.json and common project files.", "Writes AGENTS.md if missing, changes/, knowledge/, profiles/README.md, and changes/0001-adopt-aief/ if missing."],
  analyze: ["Create an Analysis Change for an existing project.", "Use after adopt, before functional or architectural changes.", "Reads project signals.", "Writes changes/<next>-analyze-current-architecture/."],
  prompt: ["Generate a ready-to-paste prompt for Claude, Gemini, Codex, Cursor or ChatGPT.", "Use after creating a Change.", "Reads AGENTS.md, assistant files, profiles and active Change.", "Writes nothing."],
  close: ["Guide closure of the active Change.", "Use after evidence is ready.", "Reads latest or selected Change.", "Writes nothing in this MVP; prints closure checklist."],
  verify: ["Verify required AIEF files and Change structures.", "Use before commit or after adoption.", "Reads README.md, AGENTS.md, changes/, knowledge/.", "Writes nothing."],
  propose: ["Create a proposal from an idea, delegating to OpenSpec when available.", "Use when you have an idea but no Change yet.", "Reads OpenSpec availability and changes/.", "Writes OpenSpec output if available, otherwise local Change + proposal.md."]
};
function printCommandHelp(command) {
  const info = COMMAND_HELP[command];
  if (!info) { console.error(`Unknown help topic: ${command}`); console.log(`Available topics: ${Object.keys(COMMAND_HELP).join(", ")}`); process.exitCode = 1; return; }
  console.log(`AIEF Help: ${command}`); console.log("─".repeat(60));
  console.log(`\nPurpose\n${info[0]}\n\nWhen to use it\n${info[1]}\n\nReads\n${info[2]}\n\nWrites\n${info[3]}`);
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
  const project = detectProject(); console.log("\nDetected project signals:");
  for (const [k, v] of Object.entries(project.tech)) if (v) console.log(`✓ ${k}`);
  if (!exists("AGENTS.md")) {
    writeFile(cwd("AGENTS.md"), `# Project Agent Instructions\n\nAI assists. Humans decide.\n\n## Rules\n\n- Read the active Change before editing.\n- Read spec.md before implementation.\n- Read tasks.md before changing files.\n- Keep changes small.\n- Do not modify unrelated files.\n- Update evidence.md before completion.\n\nIf present, also read CLAUDE.md, GEMINI.md, CODEX.md, or CURSOR.md.\n`); console.log("✓ Created AGENTS.md");
  } else console.log("✓ AGENTS.md already exists");
  fs.mkdirSync(cwd("changes"), { recursive: true }); fs.mkdirSync(cwd("knowledge"), { recursive: true }); fs.mkdirSync(cwd("profiles"), { recursive: true });
  writeFile(cwd("knowledge", "README.md"), "# Knowledge\n\nCapture decisions, lessons learned, constraints and project context here.\n");
  writeFile(cwd("profiles", "README.md"), "# Profiles\n\nUse AIEF role profiles from the source AIEF repository or define project-specific role guidance here.\n");
  if (!getChangeDirs().some((dir) => path.basename(dir).includes("adopt-aief"))) {
    const dir = cwd("changes", "0001-adopt-aief");
    writeFile(path.join(dir, "change.md"), genericChangeFiles("0001", "adopt-aief", "Adopt AIEF workflow without changing application behavior.")["change.md"]);
    writeFile(path.join(dir, "spec.md"), genericChangeFiles("0001", "adopt-aief")["spec.md"]);
    writeFile(path.join(dir, "tasks.md"), "# Tasks\n\n- [x] Create or preserve AGENTS.md.\n- [x] Create changes/.\n- [x] Create knowledge/.\n- [x] Create adoption Change.\n- [ ] Run aief verify.\n- [ ] Update evidence.md.\n");
    writeFile(path.join(dir, "evidence.md"), evidenceTemplate()); console.log("✓ Created changes/0001-adopt-aief");
  }
  console.log(""); printSkills(project); console.log("\nNext:\n  aief verify\n  aief analyze");
}
function analyze(args) { const parsed = parseArgs(args); section("AIEF Analyze"); console.log("Purpose: create an Analysis Change for an existing project.\nWrites only under changes/<id>-<name>/.\n"); createChange(parsed._.join(" ") || "analyze-current-architecture", { type: "analysis" }); console.log("\nNext:\n  aief prompt --profile architect"); }
function prompt(args) {
  const parsed = parseArgs(args); const profile = parsed.profile || "developer"; let changeDir = latestChangeDir();
  if (parsed.change) { const matches = getChangeDirs().filter((dir) => path.basename(dir).includes(parsed.change)); if (matches.length) changeDir = matches[matches.length - 1]; }
  section("AIEF Prompt"); console.log("Purpose: generate a ready-to-paste prompt for your AI assistant. Writes nothing.\n");
  if (!changeDir) { console.error("No Change found. Run: aief new-change <name> or aief analyze"); process.exitCode = 1; return; }
  const changeName = path.relative(process.cwd(), changeDir); const isAnalysis = read(path.join(changeDir, "change.md")).toLowerCase().includes("## type\n\nanalysis");
  console.log("Copy this prompt into your AI assistant:"); console.log("─".repeat(60));
  console.log(`Use AGENTS.md.\n\nAct as the ${profile} profile.\n\nWork only on:\n\n${changeName}\n\nRead these files first:\n\n- ${changeName}/change.md\n- ${changeName}/spec.md\n- ${changeName}/tasks.md\n${exists("CLAUDE.md") ? "- CLAUDE.md" : ""}\n${exists("README.md") ? "- README.md" : ""}\n\n${isAnalysis ? `This is an Analysis Change.\n\nDo not modify application source code.\nAnalyze the project and complete only:\n\n- ${changeName}/evidence.md\n` : `Implement only the requested scope.\nAfter implementation, verify acceptance criteria and update ${changeName}/evidence.md.\n`}`); console.log("─".repeat(60));
}
function close(args) { section("AIEF Close"); console.log("Purpose: guide closure of the active Change. Writes nothing in this MVP.\n"); const changeDir = latestChangeDir(); if (!changeDir) { console.error("No Change found."); process.exitCode = 1; return; } console.log(`Active Change: ${path.relative(process.cwd(), changeDir)}\n`); console.log("Before commit, confirm:\n- [ ] evidence.md has Summary.\n- [ ] evidence.md has Activities Performed.\n- [ ] evidence.md has Verification and actual results.\n- [ ] evidence.md has Findings or implementation summary.\n- [ ] evidence.md has Risks or Known Issues.\n- [ ] evidence.md has Recommendations.\n- [ ] evidence.md has Lessons Learned.\n- [ ] evidence.md has Next Change.\n\nRecommended commands:\n  aief verify\n  git status"); }
function checkChange(changeDir) { const missing = [], empty = []; for (const file of CHANGE_FILES) { const full = path.join(changeDir, file); if (!fs.existsSync(full)) missing.push(file); else if (!fs.readFileSync(full, "utf8").trim()) empty.push(file); } return { missing, empty }; }
function verify() { section("AIEF Verify"); console.log("Purpose: verify required AIEF files and Change structures. Writes nothing.\n"); let ok = true; for (const item of ["README.md", "AGENTS.md", "changes"]) { if (exists(item)) console.log(`✓ ${item}`); else { console.error(`✗ Missing: ${item}`); ok = false; } } if (exists("knowledge")) console.log("✓ knowledge/"); else console.warn("! Recommended but missing: knowledge/"); for (const changeDir of getChangeDirs()) { const name = path.relative(process.cwd(), changeDir); const result = checkChange(changeDir); if (!result.missing.length && !result.empty.length) console.log(`✓ ${name}`); else { ok = false; for (const f of result.missing) console.error(`✗ ${name}/${f} missing`); for (const f of result.empty) console.error(`✗ ${name}/${f} empty`); } } console.log(ok ? "\nResult: PASS" : "\nResult: FAIL"); if (!ok) process.exitCode = 1; }
function status() { section("AIEF Status"); console.log("Purpose: show current AIEF adoption status. Writes nothing.\n"); const checks = [["README", exists("README.md")], ["AGENTS", exists("AGENTS.md")], ["Navigator", exists("NAVIGATOR.md") || exists("docs/navigator/README.md")], ["Changes", exists("changes")], ["Knowledge", exists("knowledge")], ["Profiles", exists("profiles")], ["OpenSpec adapter", exists("adapters/openspec")], ["Specboot adapter", exists("adapters/specboot")]]; for (const [n, ok] of checks) console.log(`${ok ? "✓" : "!"} ${n}`); const changes = getChangeDirs(); console.log(`\nChanges: ${changes.length}`); for (const d of changes.slice(-5)) console.log(`- ${path.relative(process.cwd(), d)}`); const detected = Object.entries(detectProject().tech).filter(([,v]) => v).map(([k]) => k); console.log(`\nDetected project type: ${detected.length ? detected.join(", ") : "No strong signals detected."}`); console.log("\nNext:"); console.log(!exists("AGENTS.md") || !exists("changes") ? "  aief adopt" : changes.length ? "  aief prompt" : "  aief analyze"); }
function doctor(args = []) { section("AIEF Doctor"); console.log("Purpose: inspect your environment and project readiness for AIEF.\nDoctor never modifies your project.\n"); console.log("Environment:"); for (const [name, ok] of [["git", commandExists("git")], ["node", commandExists("node")], ["npm", commandExists("npm")], ["openspec", commandExists("openspec") || commandExists("opsx")], ["npx", commandExists("npx")]]) console.log(`${ok ? "✓" : "!"} ${name}`); status(); console.log(""); printSkills(detectProject()); console.log("\nRecommended next step:"); console.log(!exists("AGENTS.md") || !exists("changes") ? "  aief adopt" : "  aief analyze"); }
function initProject(name) { const projectName = name || "aief-project"; const projectPath = path.resolve(projectName); if (fs.existsSync(projectPath)) { console.error(`Project already exists: ${projectPath}`); process.exitCode = 1; return; } writeFile(path.join(projectPath, "README.md"), `# ${projectName}\n\nThis project uses AIEF.\n`); writeFile(path.join(projectPath, "AGENTS.md"), "# Project Agent Instructions\n\nAI assists. Humans decide.\n"); fs.mkdirSync(path.join(projectPath, "changes"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "knowledge"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "src"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "tests"), { recursive: true }); console.log(`Created AIEF project: ${projectPath}`); }
function propose(args) { section("AIEF Propose"); const idea = args.join(" "); if (!idea) { console.error('Example: aief propose "Add login"'); process.exitCode = 1; return; } if (commandExists("openspec")) { const r = run("openspec", ["propose", idea], { stdio: "inherit" }); if (r.status === 0) return; } const dir = createChange(idea); if (dir) writeFile(path.join(dir, "proposal.md"), `# Proposal\n\n## Idea\n\n${idea}\n\n## Why\n\n-\n\n## What Changes\n\n-\n`); }
function useProfile(profile) { console.log(`Use AGENTS.md.\n\nAct as the ${slugify(profile || "developer")} profile.\n\nWork only on the active Change.\n`); }
function release(version) { const clean = String(version || "").replace(/^v/, ""); if (!clean) { console.error("Version is required. Example: aief release 0.1.0"); process.exitCode = 1; return; } const file = path.join("releases", `v${clean}.md`); writeFile(file, `# Release v${clean}\n\n## Summary\n\n-\n\n## Verification\n\n-\n`); console.log(`Created release notes: ${file}`); }
export function main(args) { const [command, ...rest] = args; switch (command) { case "help": case undefined: help(rest[0]); break; case "explain": help(rest[0]); break; case "doctor": doctor(rest); break; case "status": status(); break; case "adopt": adopt(rest); break; case "analyze": analyze(rest); break; case "init": initProject(rest[0]); break; case "new-change": newChange(rest); break; case "propose": propose(rest); break; case "prompt": prompt(rest); break; case "close": close(rest); break; case "use-profile": useProfile(rest[0]); break; case "verify": verify(); break; case "release": release(rest[0]); break; default: console.error(`Unknown command: ${command}`); help(); process.exitCode = 1; }}
