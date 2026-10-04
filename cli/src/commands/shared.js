// Shared kernel for cli.js's command handlers (modularization, first slice).
//
// Moved out of cli.js verbatim — same bodies, same comments, zero logic
// change — because nearly every command handler (enrich/analyze/prompt/
// close/verify/status/doctor/bootstrap/propose/new-change) depends on some
// subset of these: fs/string primitives, `changes/` directory queries,
// Change selection, CLI flag parsing, evidence handling, hook logging, and
// Change scaffolding. Splitting the 14 command handlers themselves into
// cli/src/commands/<command>.js is a later, separate slice — this file only
// extracts what they'd otherwise each have to import from one another
// (which would create circular imports between command modules).
import fs from "node:fs";
import path from "node:path";
import { parseArgs as nodeParseArgs } from "node:util";
import { changeTypeFromContent, matchChanges, isEvidencePlaceholderContent, loadChange } from "../core/domain/change.js";
import { buildGraph } from "../core/domain/change-graph.js";
import { ensureChangeBranch, ChangeBranchError } from "../core/services/git-branch.js";

// --- fs/string primitives ---

export function cwd(...parts) { return path.resolve(process.cwd(), ...parts); }
export function exists(target) { return fs.existsSync(cwd(target)); }
export function read(file) { return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : ""; }
export function writeFile(filePath, content, overwrite = false) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!overwrite && fs.existsSync(filePath)) return false;
  fs.writeFileSync(filePath, content, "utf8");
  return true;
}
// run()/commandExists() live in ../process-utils.js (Change 0070).
export function slugify(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// --- `changes/` directory queries ---

export function nextChangeId(changesDir = cwd("changes")) {
  fs.mkdirSync(changesDir, { recursive: true });
  const numbers = fs.readdirSync(changesDir)
    .map((name) => Number((name.match(/^(\d+)/) || [])[1]))
    .filter((n) => Number.isFinite(n));
  return String(numbers.length ? Math.max(...numbers) + 1 : 1).padStart(4, "0");
}
export function getChangeDirs() {
  const changesPath = cwd("changes");
  if (!fs.existsSync(changesPath)) return [];
  return fs.readdirSync(changesPath)
    .filter((name) => fs.statSync(path.join(changesPath, name), { throwIfNoEntry: false })?.isDirectory())
    .sort()
    .map((name) => path.join(changesPath, name));
}
// A Change is closed when its change.md carries a "## Status / Closed" section
// (written by `aief close --yes`). The Change files are the only source of
// truth; there is no separate state file.
export function isClosed(changeDir) {
  return loadChange(changeDir).closed;
}
export function changeType(changeDir) {
  return changeTypeFromContent(read(path.join(changeDir, "change.md")));
}
export function openChangeDirs() {
  return getChangeDirs().filter((dir) => !isClosed(dir));
}
// buildProjectGraph() (Change 0058; ADR-038 moved the source to change.md's
// `## Depends on`) — the only place that gathers real Changes for the
// dependency Graph. Read-only: rebuilds on every call (ADR-009).
// A bare numeric reference ("0002") resolves to the one Change with that id;
// anything else is kept as written, so the Graph reports it as missing.
export function resolveDependencyRef(ref, basenames) {
  if (basenames.includes(ref)) return ref;
  if (/^\d+$/.test(ref)) {
    const byId = basenames.filter((b) => Number(b.split("-")[0]) === Number(ref));
    if (byId.length === 1) return byId[0];
  }
  return ref;
}
export function buildProjectGraph() {
  const dirs = getChangeDirs();
  const basenames = dirs.map((dir) => path.basename(dir));
  const nodes = dirs.map((dir) => ({ id: path.basename(dir), dependsOn: loadChange(dir).dependsOn.map((ref) => resolveDependencyRef(ref, basenames)) }));
  return buildGraph(nodes);
}

// --- Change selection ---

// Change selection (Flux Portal dogfooding, ROADMAP-TO-1.0 workstream 1):
// one shared implementation for every command that operates on a Change.
// Explicit `--change` resolves through matchChanges() and fails loudly on
// no match or an ambiguous match — never "last match wins", never a silent
// fallback to the latest open Change. Without `--change`, exactly one open
// Change keeps the classic ergonomics; more than one is an actionable error
// for mutating/composing commands. No session state is stored (ADR-009):
// resolution is derived from the files on every invocation.
export function resolveExplicitChange(selector) {
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
export function resolveImplicitChange(commandExample) {
  const open = openChangeDirs();
  if (!open.length) { console.error('No open Change found.\n\nStart one with: aief new-change "<name>"\nOr see all Changes with: aief status'); process.exitCode = 1; return null; }
  if (open.length === 1) return open[0];
  console.error(`Multiple open Changes (${open.length}) — not selecting one implicitly:\n\n${open.map((d) => `- ${path.basename(d)}`).join("\n")}\n\nSelect one explicitly:\n\n  ${commandExample} --change <id>`);
  process.exitCode = 1;
  return null;
}

// --- CLI parsing/output ---

export function printNext(...commands) {
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
export function parseCommandArgs(command, args, optionsSchema = {}) {
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
export const KNOWN_FLAGS = {
  // --no-branch (Change 0114): opt-out of the automatic branch-per-Change
  // switch createChange() otherwise does when run from `main`/`dev`.
  "new-change": { type: { type: "string" }, "no-branch": { type: "boolean" }, "depends-on": { type: "string" } },
  // --no-branch on enrich (Change 0117): same escape hatch new-change has —
  // enrich auto-branches too now (see ensureChangeBranch() call in enrich.js).
  enrich: { file: { type: "string" }, "no-branch": { type: "boolean" } },
  // --maturity (Change 0080): explicit override for classifyMaturity()'s
  // routing — lets a human force "definition"/"implemented" instead of
  // accepting the detected value, the same "explicit over implicit" escape
  // hatch --type already gives new-change. Never required for normal use.
  // --no-branch (Change 0117): analyze already auto-branches via
  // createChange() — it just never got the opt-out new-change has.
  analyze: { maturity: { type: "string" }, "no-branch": { type: "boolean" } },
  // --no-branch (Change 0117): same reasoning as analyze above.
  propose: { change: { type: "string" }, "no-branch": { type: "boolean" } },
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
  verify: { change: { type: "string" }, strict: { type: "boolean" }, json: { type: "boolean" } },
  status: { change: { type: "string" }, next: { type: "boolean" }, graph: { type: "boolean" } },
  doctor: { verbose: { type: "boolean" } },
  bootstrap: { interactive: { type: "boolean" }, force: { type: "boolean" } }
};
export function parseArgs(command, args) {
  return parseCommandArgs(command, args, KNOWN_FLAGS[command] || {});
}
export function section(title) { console.log("\n" + title); console.log("─".repeat(60)); }

// --- evidence ---

export function evidenceTemplate() {
  return `# Evidence\n\n## Summary\n\nPending.\n\n## Activities Performed\n\nPending.\n\n## Verification\n\nPending.\n\n## Findings\n\nPending.\n\n## Risks\n\nPending.\n\n## Recommendations\n\nPending.\n\n## Artifacts Produced\n\nPending.\n\n## Lessons Learned\n\nPending.\n\n## Next Change\n\nPending.\n`;
}
// evidenceIsPlaceholder(changeDir) stays a thin wrapper (delegating to the
// domain content predicate) because prompt() reads it independently of any
// full Change load — verify()/close() (cli.js) use loadChange() instead and
// read the same evidencePlaceholder flag off the already-loaded Change.
export function evidenceIsPlaceholder(changeDir) {
  return isEvidencePlaceholderContent(read(path.join(changeDir, "evidence.md")));
}

// --- Change scaffolding ---

export function analysisContextSection(context) {
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
export function analysisChangeFiles(id, slug, context) {
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
export function definitionChangeFiles(id, slug, title = "") {
  return {
    "change.md": `# Change\n\n## ID\n\n\`${id}-${slug}\`\n\n## Type\n\nDefinition\n\n## Objective\n\nDefine ${title || slug} before implementation begins: resolve open questions, evaluate options, and turn approved decisions into durable knowledge and implementation prerequisites.\n\n## Scope\n\n### In scope\n\n- Capture business/product context, known requirements and assumptions.\n- Raise open questions and identify decisions that require a human.\n- Evaluate options and trade-offs; recommend only where evidence supports it.\n- Record approved decisions in knowledge/decisions.md.\n- Produce implementation prerequisites and follow-up Changes.\n\n### Out of scope\n\n- Implementing application code.\n- Refactoring or scaffolding a codebase.\n- Modifying infrastructure.\n- Auto-approving architecture or product decisions — every decision below requires explicit (human) approval.\n\n## Context\n\n-\n\n## Business / Product Constraints\n\n-\n\n## Known Requirements\n\n-\n\n## Assumptions\n\n-\n\n## Open Questions\n\n-\n\n## Decisions Required\n\n-\n\n## Options Considered\n\n-\n\n## Recommendation\n\n-\n\n## Decision (human)\n\nPending human approval. Do not treat any Recommendation above as final until this section records an explicit human decision.\n\n## Rationale\n\n-\n\n## Consequences\n\n-\n\n## Non-Functional Requirements\n\n-\n\n## Security & Compliance\n\n-\n\n## Data & Domain\n\n-\n\n## Integrations\n\n-\n\n## Deployment & Operations\n\n-\n\n## Implementation Prerequisites\n\n-\n\n## Follow-up Changes\n\n-\n\n## Success Criteria\n\n- Open Questions are resolved or explicitly deferred.\n- Every entry in Decisions Required has a human-approved Decision recorded here and in knowledge/decisions.md.\n- Implementation Prerequisites and Follow-up Changes are identified.\n`,
    "spec.md": `# Specification\n\n## Goal\n\nTurn ${title || slug} into durable, human-approved decisions and implementation-ready prerequisites — without writing application code.\n\n## Requirements\n\n-\n\n## Acceptance Criteria\n\n- [ ] Context, Business/Product Constraints and Known Requirements are captured.\n- [ ] Open Questions are answered or explicitly deferred.\n- [ ] Every Decision Required has a Recommendation and an explicit human Decision.\n- [ ] Approved decisions are recorded in knowledge/decisions.md.\n- [ ] Implementation Prerequisites and Follow-up Changes are listed.\n- [ ] Evidence updated.\n`,
    "tasks.md": `# Tasks\n\n## Definition\n\n- [ ] Capture Context, Business/Product Constraints and Known Requirements.\n- [ ] List Assumptions and Open Questions.\n- [ ] Identify Decisions Required and evaluate Options Considered.\n- [ ] Write a Recommendation for each decision, only where evidence supports one.\n\n## Human Approval\n\n- [ ] (human) Review and approve, amend or reject each Recommendation in change.md.\n- [ ] (human) Record the final Decision and Rationale for each approved item.\n\n## Durable Knowledge\n\n- [ ] Record approved decisions in knowledge/decisions.md.\n- [ ] List Implementation Prerequisites and Follow-up Changes.\n\n## Evidence\n\n- [ ] Update evidence.md.\n`,
    "evidence.md": evidenceTemplate()
  };
}
export function genericChangeFiles(id, slug, title = "") {
  return {
    "change.md": `# Change\n\n## ID\n\n\`${id}-${slug}\`\n\n## Type\n\nGeneral\n\n## Objective\n\n${title || slug}\n\n## Scope\n\n### In scope\n\n-\n\n### Out of scope\n\n-\n\n## Success Criteria\n\n-\n`,
    "spec.md": `# Specification\n\n## Goal\n\nWhat should be true after this Change?\n\n## Requirements\n\n-\n\n## Acceptance Criteria\n\n- [ ]\n`,
    "tasks.md": `# Tasks\n\n## Implementation\n\n- [ ]\n\n## Documentation\n\n- [ ]\n\n## Verification\n\n- [ ]\n\n## Evidence\n\n- [ ] Update evidence.md\n`,
    "evidence.md": evidenceTemplate()
  };
}
// Inserts `## Depends on` before `## Success Criteria` (or at the end).
function withDependsOn(changeMd, ids) {
  const section = `## Depends on\n\n${ids.map((id) => `- ${id}`).join("\n")}\n\n`;
  const at = changeMd.search(/^## Success Criteria/m);
  return at === -1 ? `${changeMd.replace(/\s*$/, "")}\n\n${section}` : `${changeMd.slice(0, at)}${section}${changeMd.slice(at)}`;
}
export function createChange(name, options = {}) {
  const slug = slugify(name); if (!slug) { console.error('Change name is required.\n\nExample: aief new-change "Add login"'); process.exitCode = 1; return null; }
  // --depends-on (ADR-038): every reference must name an existing Change,
  // checked before anything is written, and is stored as its full basename.
  const basenames = getChangeDirs().map((dir) => path.basename(dir));
  const dependsOn = [];
  for (const ref of String(options.dependsOn || "").split(",").map((r) => r.trim()).filter(Boolean)) {
    const resolved = resolveDependencyRef(ref, basenames);
    if (!basenames.includes(resolved)) { console.error(`--depends-on: no Change found matching "${ref}".`); process.exitCode = 1; return null; }
    if (!dependsOn.includes(resolved)) dependsOn.push(resolved);
  }
  const id = nextChangeId();
  // Change 0114: switch off `main`/`dev` before any Change file exists, so a
  // failed checkout never leaves scaffolding behind on a protected branch —
  // ensureChangeBranch() throws ChangeBranchError precisely when it needed
  // to switch but couldn't, and that must stop scaffolding cold.
  try {
    ensureChangeBranch(id, slug, options.type, { skip: options.noBranch });
  } catch (err) {
    if (!(err instanceof ChangeBranchError)) throw err;
    console.error(err.message);
    process.exitCode = 1;
    return null;
  }
  const changeDir = cwd("changes", `${id}-${slug}`);
  const files = options.type === "analysis" ? analysisChangeFiles(id, slug, options.context)
    : options.type === "definition" ? definitionChangeFiles(id, slug, name)
      : genericChangeFiles(id, slug, name);
  if (dependsOn.length) files["change.md"] = withDependsOn(files["change.md"], dependsOn);
  for (const [file, content] of Object.entries(files)) writeFile(path.join(changeDir, file), content);
  console.log(`Created Change: ${path.relative(process.cwd(), changeDir)}`); return changeDir;
}

// --- standards (multi-consumer: doctor/prompt, staying in cli.js for now,
// and analyze, moved to commands/analyze.js — promoted here, third slice,
// same reasoning as everything above: shared by more than one command) ---

export function listStandards() {
  const dir = cwd("knowledge", "standards");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".md")).sort();
}
// --- interactive stdin (prompt's ambiguous-assistant choice) ---

// Blocking, dependency-free stdin read — only ever called after an isTTY
// check, so it never hangs a non-interactive shell (CI, piped input, the
// test suite).
export function promptSync(question) {
  process.stdout.write(question);
  const buffer = Buffer.alloc(2048);
  let bytesRead;
  try { bytesRead = fs.readSync(0, buffer, 0, buffer.length, null); } catch { bytesRead = 0; }
  return buffer.toString("utf8", 0, bytesRead).trim();
}
