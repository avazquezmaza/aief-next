// Command handler: bootstrap (modularization, fourth slice). Self-contained
// relative to every other command group — only imports `analyze`/`newChange`
// (already-extracted handlers, for --interactive's guided next step) plus
// the shared kernel and a handful of core modules already used elsewhere.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { commandExists } from "../process-utils.js";
import { detectProject, recommendSkills } from "../detect.js";
import { resolveSddProvider, sddProviderConfigPath } from "../core/domain/sdd-provider-resolver.js";
import { getProvider } from "../sdd-providers/index.js";
import { cwd, exists, writeFile, section, printNext, parseArgs, getChangeDirs, nextChangeId, genericChangeFiles, promptSync } from "./shared.js";
import { analyze } from "./analyze.js";
import { newChange } from "./new-change.js";

// One extra ".." vs. cli.js's own original version of these paths: this
// file lives one directory deeper (cli/src/commands/, not cli/src/) — same
// lesson as commands/misc.js's printVersion() fix in the second slice.
const STANDARDS_TEMPLATES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "standards");
const CI_TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "ci", "aief-verify.yml");
// The canonical AGENTS.md. Adoption previously wrote a 14-line inline string that
// carried 7 of ~40 rules and none of the (human)/(review) gates, so adopted
// projects never received the governance AIEF documents for itself (Change 0040).
const AGENTS_TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "templates", "agents", "AGENTS.md");
const BASE_STANDARDS = ["base-standards.md", "documentation-standards.md", "testing-standards.md", "security-standards.md"];

// Backend tech ids that must create knowledge/standards/backend-standards.md
// (Change 0106). This list must cover every detector id that is a `when`
// trigger of a skills-catalog.json Skill whose own `standardsToRead` names
// "backend-standards.md" — otherwise bootstrap recommends a Skill (via
// knowledge/skills.md) that points at a standards file it never created.
// Found by reproduction: a Django-only project (python-backend-architecture
// Skill, `when: ["django","flask","fastapi"]`) got recommended
// backend-standards.md in knowledge/skills.md, but this function — written
// before those detectors/Skills existed (Change 0098/0100) — never created
// the file, leaving a dangling reference in the generated doc. Same gap for
// aws-saas-platform (`aws`, `cognito`), payments-reviewer (`stripe`) and
// container-deployment-reviewer (`docker`, `kubernetes`).
const BACKEND_TECH_IDS = ["nestjs", "postgres", "cognito", "n8n", "aws", "django", "flask", "fastapi", "stripe", "docker", "kubernetes"];

function standardsForProject(project) {
  const files = [...BASE_STANDARDS];
  if (project.tech.nextjs || project.tech.react || project.tech.tailwind) files.push("frontend-standards.md");
  if (BACKEND_TECH_IDS.some((id) => project.tech[id])) files.push("backend-standards.md");
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
// (docs/configuration.md, "CI gate").
function createCiGate() {
  if (!fs.existsSync(CI_TEMPLATE)) return null;
  const created = writeFile(cwd(".github", "workflows", "aief-verify.yml"), fs.readFileSync(CI_TEMPLATE, "utf8"));
  return created ? ".github/workflows/aief-verify.yml" : null;
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
function initProject(name, opts = {}) { if (!name) return bootstrapHere(opts); const projectPath = path.resolve(name); if (fs.existsSync(projectPath)) { console.error(`Project already exists: ${projectPath}\n\nChoose a different name, or cd into it and run aief bootstrap there.`); process.exitCode = 1; return; } writeFile(path.join(projectPath, "README.md"), `# ${name}\n\nThis project uses AIEF.\n`); writeFile(path.join(projectPath, "AGENTS.md"), "# Project Agent Instructions\n\nAI assists. Humans decide.\n"); fs.mkdirSync(path.join(projectPath, "changes"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "knowledge"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "src"), { recursive: true }); fs.mkdirSync(path.join(projectPath, "tests"), { recursive: true }); console.log(`Created AIEF project: ${projectPath}`); }
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
export function bootstrap(args) {
  const parsed = parseArgs("bootstrap", args);
  if (!parsed) return;
  initProject(parsed._[0], { interactive: parsed.interactive === true, force: parsed.force === true });
}
