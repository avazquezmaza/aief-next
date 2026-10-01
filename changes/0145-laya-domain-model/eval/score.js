#!/usr/bin/env node
// Scores Laya output against the pre-registered labels and baselines (Change 0145, R3/R4).
//   node changes/0145-laya-domain-model/eval/score.js [laya-output.jsonl]
// Writes eval/results-<output name>.json and prints Markdown tables.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const readJsonl = (file) => readFileSync(path.join(here, file), "utf8").trim().split("\n").map((line) => JSON.parse(line));

const outputFile = process.argv[2] || "laya-zero-shot.jsonl";
const dataset = readJsonl("dataset.jsonl");
const labels = new Map(readJsonl("security-labels.jsonl").map((row) => [row.id, row]));
const laya = readJsonl(outputFile);
if (laya.length !== dataset.length) throw new Error(`${outputFile}: ${laya.length} rows, dataset has ${dataset.length}`);

const CLASSES = ["general", "fix", "analysis", "definition", "documentation"];
const SCORED = ["general", "fix", "analysis"]; // >= 5 test items (spec R4)

// Pre-registered baselines (spec R3): first matching rule wins.
const KEYWORD_RULES = [
  [/fix|bug|regression/i, "fix"],
  [/analy|assess|investigat/i, "analysis"],
  [/defin/i, "definition"],
  [/doc|readme/i, "documentation"],
];
const keyword = (text) => KEYWORD_RULES.find(([pattern]) => pattern.test(text))?.[1] ?? "general";

const rows = dataset.map((item, index) => {
  const answers = laya[index].answers;
  const label = labels.get(item.id);
  return {
    ...item,
    predictions: { laya: answers.change_type.choice, majority: "general", keyword: keyword(item.text) },
    security: answers.security_sensitive.noul,
    securityLabel: label.security_sensitive,
    borderline: label.borderline,
  };
});

const round = (value) => Math.round(value * 1000) / 1000;
const f1 = (p, r) => (p + r ? (2 * p * r) / (p + r) : 0);

function classify(subset, system) {
  const perClass = {};
  for (const cls of CLASSES) {
    const tp = subset.filter((r) => r.predictions[system] === cls && r.change_type === cls).length;
    const predicted = subset.filter((r) => r.predictions[system] === cls).length;
    const support = subset.filter((r) => r.change_type === cls).length;
    const precision = predicted ? tp / predicted : 0;
    const recall = support ? tp / support : 0;
    perClass[cls] = { precision: round(precision), recall: round(recall), f1: round(f1(precision, recall)), support };
  }
  const macroF1 = SCORED.reduce((sum, cls) => sum + perClass[cls].f1, 0) / SCORED.length;
  const confusion = Object.fromEntries(CLASSES.map((truth) => [truth, Object.fromEntries(CLASSES.map((pred) => [pred,
    subset.filter((r) => r.change_type === truth && r.predictions[system] === pred).length]))]));
  return { macroF1: round(macroF1), perClass, confusion };
}

function security(subset, threshold) {
  const tp = subset.filter((r) => r.security >= threshold && r.securityLabel).length;
  const fp = subset.filter((r) => r.security >= threshold && !r.securityLabel).length;
  const positives = subset.filter((r) => r.securityLabel).length;
  const negatives = subset.length - positives;
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = positives ? tp / positives : 0;
  return { threshold, precision: round(precision), recall: round(recall), f1: round(f1(precision, recall)),
    fpr: round(negatives ? fp / negatives : 0), tp, fp, positives, n: subset.length };
}

const THRESHOLDS = Array.from({ length: 10 }, (_, i) => round(0.5 + i * 0.05));
// Spec R4: fit on train, maximize F1 with recall >= 0.8 (fallback: best F1 if no threshold reaches it).
function fitThreshold(train) {
  const curve = THRESHOLDS.map((t) => security(train, t));
  const eligible = curve.filter((point) => point.recall >= 0.8);
  const pool = eligible.length ? eligible : curve;
  return { ...pool.reduce((best, point) => (point.f1 > best.f1 ? point : best)), recallConstraintMet: eligible.length > 0 };
}

const splits = { all: rows, test: rows.filter((r) => r.split === "test"), train: rows.filter((r) => r.split === "train") };
const scenarios = {
  inclusive: (subset) => subset,
  strict: (subset) => subset.filter((r) => !r.borderline),
};

const results = { output: outputFile, scored: SCORED, changeType: {}, security: {} };
for (const split of ["all", "test"]) {
  results.changeType[split] = Object.fromEntries(["laya", "majority", "keyword"].map((s) => [s, classify(splits[split], s)]));
}
for (const [name, select] of Object.entries(scenarios)) {
  const fitted = fitThreshold(select(splits.train));
  results.security[name] = {
    fittedOnTrain: fitted,
    atFitted: { all: security(select(splits.all), fitted.threshold), test: security(select(splits.test), fitted.threshold) },
    atDefault: { all: security(select(splits.all), 0.8), test: security(select(splits.test), 0.8) },
    curveAll: THRESHOLDS.map((t) => security(select(splits.all), t)),
  };
}
results.securityRanking = rows.filter((r) => r.securityLabel || r.security >= 0.5)
  .sort((a, b) => b.security - a.security)
  .map((r) => ({ id: r.id, score: round(r.security), label: r.securityLabel, borderline: r.borderline }));

const name = path.basename(outputFile, ".jsonl");
writeFileSync(path.join(here, `results-${name}.json`), JSON.stringify(results, null, 2) + "\n");

for (const split of ["all", "test"]) {
  console.log(`\n### change_type — ${split} (Macro-F1 over ${SCORED.join(", ")})\n`);
  console.log("| System | Macro-F1 | " + CLASSES.map((c) => `${c} F1 (n)`).join(" | ") + " |");
  console.log("| --- | --- | " + CLASSES.map(() => "---").join(" | ") + " |");
  for (const [system, r] of Object.entries(results.changeType[split])) {
    console.log(`| ${system} | ${r.macroF1} | ` + CLASSES.map((c) => `${r.perClass[c].f1} (${r.perClass[c].support})`).join(" | ") + " |");
  }
}
console.log("\n### Laya confusion matrix — all (rows = truth, columns = predicted)\n");
console.log("| truth \\ pred | " + CLASSES.join(" | ") + " |\n| --- | " + CLASSES.map(() => "---").join(" | ") + " |");
for (const truth of CLASSES) console.log(`| ${truth} | ` + CLASSES.map((p) => results.changeType.all.laya.confusion[truth][p]).join(" | ") + " |");

for (const [name, s] of Object.entries(results.security)) {
  console.log(`\n### security_sensitive — ${name}\n`);
  console.log(`Fitted on train: threshold ${s.fittedOnTrain.threshold} (recall >= 0.8 met: ${s.fittedOnTrain.recallConstraintMet})\n`);
  console.log("| Split | Threshold | Precision | Recall | F1 | FPR | TP/positives | FP |\n| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const [label, point] of [["all", s.atFitted.all], ["test", s.atFitted.test], ["all", s.atDefault.all], ["test", s.atDefault.test]]) {
    console.log(`| ${label} | ${point.threshold} | ${point.precision} | ${point.recall} | ${point.f1} | ${point.fpr} | ${point.tp}/${point.positives} | ${point.fp} |`);
  }
}
