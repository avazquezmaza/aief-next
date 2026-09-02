// ai-specs discovery and resolver (AIEF 3.1, LIDR integration — Change 0053, ADR-023).
//
// Reads a LIDR/specboot-style project's ai-specs/skills/*.md and
// ai-specs/standards/*.md, and resolves them against a caller-supplied list
// of AIEF built-in resources. "AIEF consume LIDR, nunca lo copia": nothing
// here writes a file, and nothing in the existing CLI calls this module yet
// (ADR-023) — a project with no ai-specs/ directory is a strict, silent
// no-op.
import fs from "node:fs";
import path from "node:path";

export function discoverAiSpecs(cwd) {
  const root = path.join(cwd, "ai-specs");
  if (!fs.existsSync(root)) return { present: false, root, skills: [], standards: [], agents: [] };
  return {
    present: true,
    root,
    skills: discoverResourceDir(path.join(root, "skills")),
    standards: discoverResourceDir(path.join(root, "standards")),
    // Role definitions (real LIDR/specboot layout: ai-specs/agents/<id>.md,
    // flat — confirmed against every agent in github.com/LIDR-academy/
    // lidr-specboot's ai-specs/agents/). Unlike skills/standards, AIEF has no
    // per-project built-in catalog to resolve this against: profiles/ is
    // never copied into an adopted project by bootstrap (only
    // profiles/README.md, pointing back at AIEF's own source repo) — so
    // resolveAgentRecommendations() below always resolves against an empty
    // builtins list, discovery only.
    agents: discoverResourceDir(path.join(root, "agents"))
  };
}

// A missing subdirectory (ai-specs/ present but skills/ or standards/
// absent) is not an error — it is simply nothing to discover for that
// resource type.
function discoverResourceDir(dir) {
  if (!fs.existsSync(dir)) return [];

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    // e.g. ENOTDIR: a ".md" path exists but is not a readable directory.
    return [{ id: null, path: dir, state: "read_error", content: null, diagnostic: `could not read ${dir}: ${err.message}` }];
  }

  // Two source shapes are recognized, neither replacing the other. Flat
  // "<id>.md" directly in `dir` is AIEF's original convention (Change 0053).
  // "<id>/SKILL.md" — a subdirectory per resource — is the convention real
  // LIDR/specboot projects actually use (confirmed against every skill in
  // github.com/LIDR-academy/lidr-specboot's ai-specs/skills/). Flat files are
  // listed first so that a flat "<id>.md" always wins a same-id collision
  // over a folder "<id>/SKILL.md" (existing duplicate handling below,
  // unchanged) — this is deliberate precedence, not an ordering accident.
  const flatCandidates = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => ({ id: path.basename(entry.name, path.extname(entry.name)), filePath: path.join(dir, entry.name) }))
    .sort((a, b) => a.id.localeCompare(b.id));

  const folderCandidates = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const subDir = path.join(dir, entry.name);
    let subEntries;
    try {
      subEntries = fs.readdirSync(subDir, { withFileTypes: true });
    } catch {
      continue; // unreadable subdirectory: not a resource, not an error for this scan
    }
    const skillFile = subEntries.find((e) => e.isFile() && e.name.toLowerCase() === "skill.md");
    if (skillFile) folderCandidates.push({ id: entry.name, filePath: path.join(subDir, skillFile.name) });
  }
  folderCandidates.sort((a, b) => a.id.localeCompare(b.id));

  const claimedIds = new Set();
  const resources = [];
  for (const { id, filePath } of [...flatCandidates, ...folderCandidates]) {
    if (claimedIds.has(id)) {
      resources.push({ id, path: filePath, state: "duplicate", content: null, diagnostic: `duplicate id "${id}" in ${dir} — a previous file already claimed it` });
      continue;
    }
    claimedIds.add(id);

    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch (err) {
      resources.push({ id, path: filePath, state: "read_error", content: null, diagnostic: `could not read ${filePath}: ${err.message}` });
      continue;
    }

    if (!content.trim()) {
      resources.push({ id, path: filePath, state: "empty", content: null, diagnostic: `${filePath} is empty` });
      continue;
    }

    resources.push({ id, path: filePath, state: "present", content, diagnostic: null });
  }
  return resources;
}

// resolveResources(builtins, projectResources) -> { resources, warnings }
//
// Generic over `builtins`' shape — this function only ever reads `.id` from
// each entry, never any resource-specific field (ADR-023: not coupled to
// the Skill Catalog or knowledge/standards/). `projectResources` is
// discoverAiSpecs()'s `skills` or `standards` array (or anything shaped
// like it).
//
// Precedence: a project resource in state "present" always wins over a
// built-in sharing its id (never merged — the resolved entry is wholly one
// or the other) and is added outright when its id is new. A project
// resource in state "read_error"/"duplicate"/"empty" never wins and never
// gets added — only a warning is recorded, and any built-in sharing that id
// is left untouched.
export function resolveResources(builtins, projectResources) {
  const resolved = new Map();
  const warnings = [];

  for (const builtin of builtins) {
    if (builtin && typeof builtin.id === "string") {
      resolved.set(builtin.id, { id: builtin.id, source: "builtin", value: builtin });
    }
  }

  for (const project of projectResources) {
    if (!project) continue;

    if (project.id === null) {
      // A directory-level read error (discoverResourceDir's synthetic
      // entry) — no specific id was overridden, but the failure is still
      // worth surfacing rather than silently dropping.
      warnings.push(`ai-specs resource directory unavailable (${project.state}): ${project.diagnostic}`);
      continue;
    }
    if (typeof project.id !== "string") continue;

    if (project.state !== "present") {
      warnings.push(`ignored project ai-spec "${project.id}" (${project.state}): ${project.diagnostic}`);
      continue;
    }

    if (resolved.has(project.id)) {
      warnings.push(`"${project.id}": project ai-specs resource overrides AIEF's built-in (${project.path})`);
    }
    resolved.set(project.id, { id: project.id, source: "project", value: project });
  }

  return { resources: [...resolved.values()], warnings };
}

// A leading YAML frontmatter block (`---\n...\n---`), the convention
// Claude Code / Kiro-style SKILL.md files use for id/description/license/
// compatibility metadata — a real, external shape (Change 0110: found
// integrating a project's own camel-quarkus/camel-spring-boot Skills). Only
// ever a delimiter at the very start of the file, never mid-document (a
// Markdown thematic break `---` elsewhere is not frontmatter and is left
// alone by requiring the match to start at string position 0).
const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

// stripFrontmatter(content) -> { description, body }
// `description` is the frontmatter's own `description:` field when present
// (a single-line YAML scalar — block scalars `>`/`|` are not parsed; falls
// through to `body` in that case, same as no frontmatter at all) — the
// exact human-authored summary this module exists to surface, more useful
// than re-deriving one from whatever text happens to follow. `body` is the
// content after the frontmatter block, or the original content unchanged
// when there is none.
function stripFrontmatter(content) {
  const text = String(content || "");
  const match = text.match(FRONTMATTER_RE);
  if (!match) return { description: null, body: text };
  const descMatch = match[1].match(/^description:[ \t]*(.+)$/m);
  return { description: descMatch ? descMatch[1].trim().replace(/^["']|["']$/g, "") : null, body: text.slice(match[0].length) };
}

// deriveResourceDescription(content) -> a short, human-readable description
// for a project-sourced resource file (Skill or Standard alike; AIEF 3.1,
// Change 0054/ADR-024, generalized in Change 0055/ADR-025). Prefers a
// leading frontmatter block's own `description:` field (Change 0110); falls
// back to the file's first non-empty line after any frontmatter, with a
// leading Markdown heading marker stripped — never throws, never returns
// empty. Before Change 0110, a frontmatter-led file's first non-empty line
// was the opening `---` delimiter itself, surfaced verbatim as the
// description in `doctor`/`bootstrap` output.
export function deriveResourceDescription(content) {
  const { description, body } = stripFrontmatter(content);
  if (description) return description;
  const lines = String(body || "").split(/\r?\n/);
  const firstNonEmpty = lines.find((line) => line.trim().length > 0);
  if (!firstNonEmpty) return "Project-defined resource";
  const stripped = firstNonEmpty.replace(/^#+\s*/, "").trim();
  return stripped || "Project-defined resource";
}

// Stable alias kept for Change 0054 callers/tests — identical behavior,
// generic "resource" fallback text aside (a Skill-specific fallback string
// was never actually reachable for a `state: "present"` resource, so this
// is not an observable behavior change for any real Skill file).
export const deriveSkillDescription = deriveResourceDescription;

// resolveResourceRecommendations(builtins, projectResources, resourceDirLabel)
//   -> { items, warnings, invalidCount }
//
// Shared by resolveSkillRecommendations() and resolveStandardRecommendations()
// (Change 0055/ADR-025, extracted from Change 0054's original Skill-only
// implementation) — adds only what rendering a recommendation needs on top
// of resolveResources(); does not know about `aief doctor`/`aief prompt`,
// console output, or any other presentation concern.
//
// `invalidCount` is counted separately from `warnings.length`: an override
// warning describes a *successful* precedence decision (already visible via
// an item's `overridesBuiltin`/`[project override]` tag), not a problem —
// only a genuinely unusable project resource (read_error/duplicate/empty)
// should make a caller surface a "something was ignored" hint.
function resolveResourceRecommendations(builtins, projectResources, resourceDirLabel) {
  const { resources, warnings } = resolveResources(builtins, projectResources);
  const builtinIds = new Set(builtins.filter((b) => b && typeof b.id === "string").map((b) => b.id));
  const invalidCount = projectResources.filter((resource) => resource.state !== "present").length;

  const items = resources.map((entry) => {
    if (entry.source === "builtin") {
      return {
        id: entry.id,
        description: entry.value.description,
        because: entry.value.because || [],
        source: "builtin",
        path: entry.value.path ?? null,
        overridesBuiltin: false
      };
    }
    // Change 0107: `because` must name the file actually discovered, not
    // assume the flat "<id>.md" convention — discoverResourceDir() also
    // supports "<id>/SKILL.md" (folder skills, the real LIDR/specboot
    // layout), and a folder resource's `because` used to claim a flat
    // "<id>.md" path that does not exist on disk, contradicting the correct
    // `path` field returned right below it. Both conventions only ever
    // differ in their basename ("<id>.md" vs "SKILL.md"), so deriving the
    // suffix from the actual discovered path's basename covers both without
    // needing `cwd` here to compute a full relative path.
    const baseName = path.basename(entry.value.path || "");
    const suffix = baseName.toLowerCase() === "skill.md" ? `${entry.id}/${baseName}` : baseName || `${entry.id}.md`;
    return {
      id: entry.id,
      description: deriveResourceDescription(entry.value.content),
      because: [`ai-specs/${resourceDirLabel}/${suffix} present in project`],
      source: "project",
      path: entry.value.path,
      overridesBuiltin: builtinIds.has(entry.id)
    };
  });

  return { items, warnings, invalidCount };
}

// resolveSkillRecommendations(builtins, cwd) ->
//   { items, warnings, invalidCount, aiSpecsPresent }
//
// `builtins` is normally `recommendSkills(project)`'s output (each entry
// already carrying `id`/`description`/`because`) — this function does not
// import or call `recommendSkills()` itself, keeping `cli/src/detect.js`
// untouched.
export function resolveSkillRecommendations(builtins, cwd) {
  const aiSpecs = discoverAiSpecs(cwd);
  return { ...resolveResourceRecommendations(builtins, aiSpecs.skills, "skills"), aiSpecsPresent: aiSpecs.present };
}

// resolveStandardRecommendations(builtins, cwd) ->
//   { items, warnings, invalidCount, aiSpecsStandardsPresent }
//
// `builtins` is normally cli.js's `builtinStandardsList()` output (Change
// 0055/ADR-025) — `{ id, description, path }` per file under
// `knowledge/standards/`. `aiSpecsStandardsPresent` is true whenever
// `ai-specs/standards/` contributed at least one entry (valid or not) — the
// signal a caller (e.g. `aief doctor`) uses to decide whether to show
// anything at all, keeping a project with no such directory fully
// unaffected (ADR-025).
export function resolveStandardRecommendations(builtins, cwd) {
  const aiSpecs = discoverAiSpecs(cwd);
  return {
    ...resolveResourceRecommendations(builtins, aiSpecs.standards, "standards"),
    aiSpecsStandardsPresent: aiSpecs.standards.length > 0
  };
}

// resolveAgentRecommendations(cwd) -> { items, warnings, invalidCount, aiSpecsAgentsPresent }
//
// Unlike resolveSkillRecommendations()/resolveStandardRecommendations(),
// there is no `builtins` parameter — AIEF has no per-project built-in
// agent/role catalog to resolve against (profiles/ is never copied into an
// adopted project; see discoverAiSpecs()'s own comment). Always resolves
// against an empty list, so every discovered agent is `source: "project"`
// and `overridesBuiltin` is always false — discovery and listing only,
// never a precedence decision this function would otherwise have to
// invent. `aiSpecsAgentsPresent` mirrors aiSpecsStandardsPresent's own
// signal: true whenever `ai-specs/agents/` contributed at least one entry
// (valid or not), the flag a caller (e.g. `aief doctor`) uses to decide
// whether to show anything at all — a project with no such directory is
// fully unaffected.
export function resolveAgentRecommendations(cwd) {
  const aiSpecs = discoverAiSpecs(cwd);
  return {
    ...resolveResourceRecommendations([], aiSpecs.agents, "agents"),
    aiSpecsAgentsPresent: aiSpecs.agents.length > 0
  };
}
