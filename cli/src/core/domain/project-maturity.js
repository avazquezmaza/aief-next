// Project maturity classification (Change 0080).
//
// AIEF can incorrectly route a repository that has requirements/context but
// no application implementation yet into Analysis-oriented work (review
// package configuration, inspect source modules, ...) that does not exist.
// This module answers one narrow, deterministic question — "does this
// repository look like it has real application source code, real
// requirements-only content, both, or neither?" — so `aief analyze` can route
// accordingly (see cli.js) without guessing.
//
// Deterministic, evidence-based, no probabilistic scoring: two independent
// signals (implementation, definition), each computed from files that
// actually exist on disk, combined by one small precedence rule.
import fs from "node:fs";
import path from "node:path";

// Directories that conventionally hold real application source across
// ecosystems (Node, Python, Go, Ruby, Java, Rust, PHP, ...). Deliberately
// narrow — this is the same "positive evidence, not absence of a denylist"
// discipline ADR-014 already applies to DELETE classification: a repository
// is Implemented because real source was *found*, never because some other
// signal was *absent*.
const SOURCE_DIRS = ["src", "lib", "app", "cli", "server", "api", "pkg", "cmd", "internal"];

// Directories a recursive scan must never descend into: dependency trees,
// VCS internals, build output — none of these indicate hand-written
// application source, and node_modules alone can be tens of thousands of
// files.
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "coverage", "vendor", ".next", ".venv", "__pycache__"]);

// Extensions treated as evidence of real source across ecosystems. Markdown,
// JSON, YAML and other non-code files never count, regardless of location.
const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs",
  ".py", ".go", ".rb", ".java", ".cs", ".php", ".rs", ".c", ".cpp", ".h", ".swift", ".kt"
]);

// A config file living directly under a source dir (rare, but e.g.
// `src/webpack.config.js`) is tooling, not application code — excluded so
// "tooling metadata but no app" repositories are not misread as Implemented.
const CONFIG_FILENAME = /\.config\.(js|ts|mjs|cjs)$|^\.[a-z]+rc(\.[a-z]+)?$/i;

// A file under MIN_SOURCE_BYTES is treated as an empty stub (e.g. a
// placeholder `src/index.js` left by a scaffolding tool), not evidence of a
// real implementation.
const MIN_SOURCE_BYTES = 20;

// Filenames at the repository root recognized as project-definition
// documents (PRD, business/product requirements, a real README) — matched
// case-insensitively, extension-agnostic content check.
const DEFINITION_FILENAME = /^(readme|prd|product[-_ ]?requirements?|requirements?|business[-_ ]?requirements?|brief)(\..+)?$/i;

// Change 0085: a project's PRD/requirements/architecture notes conventionally
// live under a docs/ directory, not only as a specially-named file at the
// repository root — this project's own docs/ (getting-started.md,
// concepts.md, ...) is itself an instance of that convention. Every plain
// document (.md/.txt) directly inside one of these directories counts toward
// the definition signal — no filename match required there, since the
// directory itself is the signal. Deliberately one level deep, not
// recursive: docs/adr/, docs/images/ etc. are common subdirectories this
// must not silently vacuum up as "definition content".
const DOC_DIRS = ["docs", "documentation"];
const DOC_EXTENSIONS = new Set([".md", ".txt"]);

// Word-count floor for "this document carries real requirements content",
// not just a placeholder title. Deliberately low — this is a coarse floor
// against one-line stubs ("# TODO"), not a quality bar.
const MIN_DEFINITION_WORDS = 30;

const MAX_SCAN_DEPTH = 6;

function walk(dir, depth, visit) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || depth >= MAX_SCAN_DEPTH) continue;
      walk(path.join(dir, entry.name), depth + 1, visit);
    } else if (entry.isFile()) {
      visit(path.join(dir, entry.name));
    }
  }
}

// Real application source: at least one non-config, non-trivial code file
// under a recognized source directory at the repository root.
function findSourceFiles(rootDir) {
  const found = [];
  for (const dirName of SOURCE_DIRS) {
    const dirPath = path.join(rootDir, dirName);
    if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) continue;
    walk(dirPath, 0, (filePath) => {
      const ext = path.extname(filePath);
      if (!CODE_EXTENSIONS.has(ext)) return;
      if (CONFIG_FILENAME.test(path.basename(filePath))) return;
      let size = 0;
      try {
        size = fs.statSync(filePath).size;
      } catch {
        return;
      }
      if (size < MIN_SOURCE_BYTES) return;
      found.push(path.relative(rootDir, filePath));
    });
  }
  return found;
}

function wordCountOf(filePath) {
  let text = "";
  try {
    text = fs.readFileSync(filePath, "utf8");
  } catch {
    return 0;
  }
  return (text.match(/\S+/g) || []).length;
}

// Requirements/context documents at the repository root (specifically named
// — README/PRD/requirements/...) plus every plain document one level inside
// docs/ or documentation/ (any filename — the directory is the signal), with
// a combined word count: the "does this repository explain what should be
// built" signal.
function findDefinitionDocuments(rootDir) {
  const files = [];
  let words = 0;

  let rootEntries;
  try {
    rootEntries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch {
    rootEntries = [];
  }
  for (const entry of rootEntries) {
    if (!entry.isFile() || !DEFINITION_FILENAME.test(entry.name)) continue;
    files.push(entry.name);
    words += wordCountOf(path.join(rootDir, entry.name));
  }

  for (const dirName of DOC_DIRS) {
    const dirPath = path.join(rootDir, dirName);
    let docEntries;
    try {
      docEntries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of docEntries) {
      if (!entry.isFile() || !DOC_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
      files.push(`${dirName}/${entry.name}`);
      words += wordCountOf(path.join(dirPath, entry.name));
    }
  }

  return { files, words };
}

// classifyMaturity(rootDir) -> { maturity, reasons, sourceFiles, definitionFiles, definitionWords }
//
// maturity is one of "implemented" | "definition" | "ambiguous":
//
// - "implemented": real application source found — Analysis is the correct
//   next step, regardless of how much requirements documentation also exists
//   (a well-documented implemented project is still Implemented).
// - "definition": no application source, but requirements/context documents
//   carry real content — Definition is the correct next step.
// - "ambiguous": neither signal clears its bar (a near-empty repository, or
//   one this heuristic cannot honestly place). Never a guess dressed up as a
//   classification — callers must handle this explicitly (see cli.js
//   analyze()).
export function classifyMaturity(rootDir = process.cwd()) {
  const sourceFiles = findSourceFiles(rootDir);
  const { files: definitionFiles, words: definitionWords } = findDefinitionDocuments(rootDir);
  const hasImplementation = sourceFiles.length > 0;
  const hasDefinitionContent = definitionWords >= MIN_DEFINITION_WORDS;

  if (hasImplementation) {
    return {
      maturity: "implemented",
      reasons: [`${sourceFiles.length} source file(s) found: ${sourceFiles.slice(0, 3).join(", ")}${sourceFiles.length > 3 ? ", ..." : ""}`],
      sourceFiles,
      definitionFiles,
      definitionWords
    };
  }
  if (hasDefinitionContent) {
    return {
      maturity: "definition",
      reasons: [`no application source found under ${SOURCE_DIRS.join("/")}`, `${definitionFiles.length} definition document(s) found (${definitionFiles.join(", ")}, ~${definitionWords} words)`],
      sourceFiles,
      definitionFiles,
      definitionWords
    };
  }
  return {
    maturity: "ambiguous",
    reasons: [
      "no application source found under " + SOURCE_DIRS.join("/"),
      definitionFiles.length
        ? `${definitionFiles.length} definition document(s) found, but only ~${definitionWords} word(s) (below the ${MIN_DEFINITION_WORDS}-word floor for real content)`
        : "no requirements/context document (README/PRD/requirements) found at the repository root"
    ],
    sourceFiles,
    definitionFiles,
    definitionWords
  };
}
