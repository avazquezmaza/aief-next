#!/usr/bin/env node
// Builds eval/dataset.jsonl from changes/*/change.md (Change 0145, R1).
// Input text: `## Objective`. Label: normalized `## Type`. Fixed stratified 50/50 train/test split.
//   node changes/0145-laya-domain-model/eval/build-dataset.js
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const changesDir = path.resolve(here, "../..");
const SELF = "0145-laya-domain-model";
const SEED = 145;
const TEST_FRACTION = 0.5;
const PLACEHOLDER = /^Analyze the current state of the project before implementing/;

const TYPE_MAP = [
  [/^(general|feature|implementation)\b/i, "general"],
  [/^fix\b/i, "fix"],
  [/^analysis\b/i, "analysis"],
  [/^definition\b/i, "definition"],
  [/^documentation\b/i, "documentation"],
];

function section(markdown, heading) {
  const match = markdown.match(new RegExp(`^## ${heading}\\s*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"));
  return match ? match[1].replace(/`/g, "").replace(/\s+/g, " ").trim() : "";
}

function normalizeType(raw) {
  const hit = TYPE_MAP.find(([pattern]) => pattern.test(raw));
  return hit ? hit[1] : null;
}

// mulberry32: small deterministic PRNG so the split is reproducible without dependencies.
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const items = [];
const excluded = [];
for (const id of readdirSync(changesDir).sort()) {
  const file = path.join(changesDir, id, "change.md");
  if (!existsSync(file)) continue;
  const markdown = readFileSync(file, "utf8");
  const text = section(markdown, "Objective");
  const rawType = section(markdown, "Type");
  const label = normalizeType(rawType);
  const slug = id.replace(/^\d+-/, "");
  if (id === SELF) excluded.push({ id, reason: "this Change" });
  else if (!text || PLACEHOLDER.test(text) || text === slug) excluded.push({ id, reason: "placeholder Objective" });
  else if (!label) excluded.push({ id, reason: `unmappable Type "${rawType}"` });
  else items.push({ id, text, change_type: label });
}

const random = rng(SEED);
const byClass = Map.groupBy(items, (item) => item.change_type);
for (const group of byClass.values()) {
  const shuffled = group.map((item) => [random(), item]).sort((x, y) => x[0] - y[0]).map(([, item]) => item);
  const testCount = Math.ceil(shuffled.length * TEST_FRACTION);
  shuffled.forEach((item, index) => { item.split = index < testCount ? "test" : "train"; });
}

writeFileSync(path.join(here, "dataset.jsonl"), items.map((item) => JSON.stringify(item)).join("\n") + "\n");

console.log(`items: ${items.length}  excluded: ${excluded.length}  seed: ${SEED}`);
for (const [label, group] of [...byClass].sort()) {
  const test = group.filter((item) => item.split === "test").length;
  console.log(`  ${label.padEnd(14)} total ${String(group.length).padStart(3)}  train ${String(group.length - test).padStart(3)}  test ${String(test).padStart(3)}`);
}
for (const { id, reason } of excluded) console.log(`  excluded ${id}: ${reason}`);
