import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const IMAGES_DIR = path.join(REPO_ROOT, "docs", "images");

const DIAGRAMS = [
  "product-workflow",
  "system-context",
  "core-runtime",
  "prompt-composition",
  "graph-engineering",
  "workflow-lifecycle",
  "workflow",
  "adoption-workflow",
];

const MARKDOWN_FILES = [
  path.join(REPO_ROOT, "README.md"),
  path.join(REPO_ROOT, "docs", "architecture.md"),
  path.join(REPO_ROOT, "docs", "workflow.md"),
  path.join(REPO_ROOT, "docs", "getting-started.md"),
];

function readSvg(name) {
  return fs.readFileSync(path.join(IMAGES_DIR, `${name}.svg`), "utf8");
}

test("every expected diagram SVG exists under docs/images/", () => {
  for (const name of DIAGRAMS) {
    const p = path.join(IMAGES_DIR, `${name}.svg`);
    assert.ok(fs.existsSync(p), `missing ${p}`);
  }
});

test("every expected diagram PNG exists under docs/images/ and is a real PNG", () => {
  const pngMagic = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  for (const name of DIAGRAMS) {
    const p = path.join(IMAGES_DIR, `${name}.png`);
    assert.ok(fs.existsSync(p), `missing ${p}`);
    const header = fs.readFileSync(p).subarray(0, 8);
    assert.ok(header.equals(pngMagic), `${p} does not start with the PNG magic bytes`);
  }
});

test("workflow.svg and workflow-lifecycle.svg are identical (compatibility wrapper stays in sync)", () => {
  const workflow = readSvg("workflow");
  const lifecycle = readSvg("workflow-lifecycle");
  assert.equal(workflow, lifecycle);
});

test("each diagram SVG is well-formed and carries the required accessibility markup", () => {
  for (const name of DIAGRAMS) {
    const svg = readSvg(name);
    assert.ok(svg.trim().startsWith("<svg"), `${name}.svg does not start with <svg`);
    assert.ok(svg.trim().endsWith("</svg>"), `${name}.svg does not end with </svg>`);
    // Non-self-closing opening tags (regex excludes any tag ending in "/>") must pair with
    // an equal number of closing tags; self-closing tags need no counterpart.
    const openTags = svg.match(/<[a-zA-Z][^>]*[^/]>/g) ?? [];
    const closeTags = svg.match(/<\/[a-zA-Z][^>]*>/g) ?? [];
    assert.equal(openTags.length, closeTags.length, `${name}.svg looks unbalanced (open tags do not match close tags)`);
    assert.match(svg, /role="img"/, `${name}.svg missing role="img"`);
    assert.match(svg, /<title id="[^"]+">/, `${name}.svg missing a <title id="...">`);
    assert.match(svg, /<desc id="[^"]+">/, `${name}.svg missing a <desc id="...">`);
    assert.match(svg, /aria-labelledby="[^"]+ [^"]+"/, `${name}.svg missing aria-labelledby with both ids`);
    assert.match(svg, /viewBox="0 0 \d+ \d+"/, `${name}.svg missing a viewBox`);
  }
});

test("no Markdown file under README/docs carries a mermaid code fence", () => {
  for (const file of MARKDOWN_FILES) {
    const text = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(text, /```mermaid/, `${file} still contains a mermaid fence`);
  }
});

// Matches Markdown image refs to a local (non-URL) docs/images .svg diagram — excludes remote
// badges like the README's CI status SVG, which aren't generated diagrams.
const DIAGRAM_LINK_PATTERN = /!\[([^\]]*)\]\(((?:\.\.\/)*(?:docs\/)?images\/[^)]+\.svg)\)/g;

test("every docs/images/*.svg reference in README/docs resolves to a real file", () => {
  for (const file of MARKDOWN_FILES) {
    const text = fs.readFileSync(file, "utf8");
    const dir = path.dirname(file);
    const pattern = new RegExp(DIAGRAM_LINK_PATTERN.source, "g");
    let match;
    let found = 0;
    while ((match = pattern.exec(text))) {
      found += 1;
      const resolved = path.resolve(dir, match[2]);
      assert.ok(fs.existsSync(resolved), `${file} references missing image ${match[2]}`);
    }
    assert.ok(found > 0, `${file} has no local SVG diagram reference — expected at least one`);
  }
});

test("no Markdown alt text is a generic placeholder like 'diagram'", () => {
  for (const file of MARKDOWN_FILES) {
    const text = fs.readFileSync(file, "utf8");
    const pattern = new RegExp(DIAGRAM_LINK_PATTERN.source, "g");
    let match;
    while ((match = pattern.exec(text))) {
      const alt = match[1].trim().toLowerCase();
      assert.ok(alt.length > 20, `${file} has a too-short alt text: "${alt}"`);
      assert.notEqual(alt, "diagram");
    }
  }
});

test("generators write only into docs/images/ (no stray output files)", () => {
  const entries = fs.readdirSync(IMAGES_DIR);
  for (const entry of entries) {
    assert.ok(/\.(svg|png)$/.test(entry), `unexpected non-SVG/PNG file under docs/images/: ${entry}`);
  }
});

test(
  "regenerating every diagram is a no-op (deterministic output) — skipped if python3 is unavailable",
  { skip: spawnSync("python3", ["--version"]).status !== 0 },
  () => {
    const before = {};
    for (const name of DIAGRAMS) {
      before[name] = readSvg(name);
    }
    const result = spawnSync("python3", ["scripts/diagrams/generate_all.py"], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, `generate_all.py failed:\n${result.stdout}\n${result.stderr}`);
    for (const name of DIAGRAMS) {
      assert.equal(readSvg(name), before[name], `${name}.svg changed after regenerating — not deterministic`);
    }
  }
);
