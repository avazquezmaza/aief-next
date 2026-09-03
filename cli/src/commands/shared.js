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
import { changeTypeFromContent, matchChanges, isEvidencePlaceholderContent } from "../core/domain/change.js";
import { loadChangeUnified } from "../core/domain/change-loader.js";
import { loadWorkflowDefinition, KNOWN_TRACKS } from "../core/domain/workflow-definition.js";
import { evaluateGates } from "../core/services/gate-evaluator.js";
import { resolveState } from "../core/services/transition-engine.js";
import { resolveSddProvider } from "../core/domain/sdd-provider-resolver.js";
import { deriveResourceDescription } from "../core/domain/ai-specs.js";
import { buildGraph } from "../core/domain/change-graph.js";
import { formatHookLogSection } from "../core/services/harness-service.js";
import { detectManifestStatusDrift } from "../core/domain/manifest-status-drift.js";
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
// run()/commandExists() live in ../process-utils.js (Change 0070) — shared
// with sdd-providers/openspec.js, which used to carry its own copy.
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
// (written by `aief close --yes`) — or, if the Change carries an optional
// manifest.json (AIEF Core 3.0, Entrega 1), when the manifest's own `status`
// field says so; the manifest is authoritative over change.md when present,
// never merged with it (design.md §3 of Change 0043). Either way, the Change
// files are the only source of truth; there is no separate state file.
// Thin wrapper over loadChangeUnified() (core/domain/change-loader.js), used
// by openChangeDirs() (status/prompt/implicit selection) only. `close` does
// NOT use this: `markClosed()` (cli.js) checks change.md directly, because
// `close` only ever writes change.md — a manifest, if present, is untouched
// and out of scope for Entrega 1 (design.md §9). Sharing this function
// between the two was Change 0043's review finding B1: a successful
// change.md write was reported as a failure whenever a manifest still said
// "open", because this manifest-aware check disagreed with what was just
// written.
export function isClosed(changeDir) {
  return loadChangeUnified(changeDir).closed;
}
export function changeType(changeDir) {
  return changeTypeFromContent(read(path.join(changeDir, "change.md")));
}
export function openChangeDirs() {
  return getChangeDirs().filter((dir) => !isClosed(dir));
}
// AIEF Core 3.0, Entrega 2 (Change 0044, WF-R1/WF-R2 — H2 hardening).
// A Change whose manifest.json exists but fails to parse or fails
// validateManifest() is a distinct, first-class state — never the same as
// "no manifest" (legacy) and never silently reported as a healthy open
// Change. loadChangeUnified() already computes this (Entrega 1); this is
// the first place anything reads .manifestError instead of discarding it.
export function invalidManifestChanges() {
  return getChangeDirs()
    .map((dir) => ({ dir, change: loadChangeUnified(dir) }))
    .filter(({ change }) => Array.isArray(change.manifestError) && change.manifestError.length > 0);
}
// Change 0095 — every manifest-backed Change whose manifest.status disagrees
// with its own change.md's ## Status declaration (the known, documented gap:
// no command writes/synchronizes manifest.status — see docs/concepts.md's
// "Current limitation"). Detection only, mirroring invalidManifestChanges()'s
// own additive-section pattern: absent whenever no Change drifts, which is
// every Change in this repository today (none carries a manifest.json yet).
export function manifestStatusDriftChanges() {
  return getChangeDirs()
    .map((dir) => ({ dir, change: loadChangeUnified(dir) }))
    .map(({ dir, change }) => ({ dir, change, drift: detectManifestStatusDrift(change) }))
    .filter(({ drift }) => drift.drift);
}
// AIEF Core 3.0, Entrega 2 (Change 0044) — the Workflow Engine's only wiring
// point. A Change is a workflow candidate when it has a valid manifest with
// a non-empty `track`; everything else (no manifest, manifest with no
// track) is untouched (WF-R17/WF-R18) and never reaches this function.
// Reuses loadWorkflowDefinition() / evaluateGates() / resolveState() as-is —
// this function only wires them together for `status`, per design.md §3's
// data flow. Never called for a Change with .manifestError (H2 already
// reports those separately) or with no `.track`.
export function resolveWorkflowFor(change) {
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
export function workflowChanges() {
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
export function sddChanges() {
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
export function buildProjectGraph() {
  const nodes = getChangeDirs().map((dir) => {
    const change = loadChangeUnified(dir);
    const dependsOn = !change.manifestError && Array.isArray(change.manifest?.dependsOn) ? change.manifest.dependsOn : [];
    return { id: path.basename(dir), dependsOn };
  });
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
  "new-change": { type: { type: "string" }, "no-branch": { type: "boolean" } },
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
  verify: { change: { type: "string" }, requirements: { type: "boolean" }, strict: { type: "boolean" } },
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

// --- hook log ---

export function appendHookLog(changeDir, { operation, event, entries, passed }) {
  const file = path.join(changeDir, "hooks.md");
  const already = fs.existsSync(file);
  const header = "# Harness Log\n\nVisible, append-only record of Hook executions for this Change (Change 0056/ADR-026). Only each Hook's own short summary is recorded — never raw command output, full context, or credentials (Hooks structurally cannot produce either).\n";
  const logSection = formatHookLogSection({
    timestamp: new Date().toISOString(),
    operation,
    changeId: path.basename(changeDir),
    event,
    passed,
    entries: entries.map((r) => ({ hook: r.hook, event: r.event, status: r.status, summary: r.summary }))
  });
  writeFile(file, `${already ? read(file) : header}\n${logSection}`, true);
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
export function createChange(name, options = {}) {
  const slug = slugify(name); if (!slug) { console.error('Change name is required.\n\nExample: aief new-change "Add login"'); process.exitCode = 1; return null; }
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
// Maps listStandards()'s bare filenames into the { id, description, path }
// shape resolveResources() (and resolveStandardRecommendations()) can
// consume as `builtins` (Change 0055/ADR-025) — id is the filename without
// `.md` (so it can collide, by id, with an ai-specs/standards/<id>.md);
// description is derived from the file's own first heading, read from disk
// exactly once here, never cached, never written back.
export function builtinStandardsList() {
  return listStandards().map((file) => {
    const filePath = cwd("knowledge", "standards", file);
    return { id: file.replace(/\.md$/i, ""), description: deriveResourceDescription(read(filePath)), path: filePath };
  });
}

// --- interactive stdin (multi-consumer: bootstrap's ambiguous-SDD-provider
// choice, prompt's ambiguous-assistant choice) ---

// Blocking, dependency-free stdin read — only ever called after an isTTY
// check, so it never hangs a non-interactive shell (CI, piped input, the
// test suite).
export function promptSync(question) {
  process.stdout.write(question);
  const buffer = Buffer.alloc(2048);
  let bytesRead = 0;
  try { bytesRead = fs.readSync(0, buffer, 0, buffer.length, null); } catch { bytesRead = 0; }
  return buffer.toString("utf8", 0, bytesRead).trim();
}
