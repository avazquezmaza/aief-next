// Definition enrichment (Change 0081): classifying a Definition Change's own
// context into Known / Missing / Ambiguous / Decision required / Human
// approval required / Deferred until implementation — the categories the
// commissioning brief asks for, without inventing a second requirement
// source (that is what `aief enrich` already does, read-only, from Jira/
// manual sources — this module reads nothing external, only the Change's
// own change.md, and never writes anything).
//
// Deliberately two deterministic passes, no scoring, no percentages:
//
// 1. Section-level Known/Missing — a Definition section (see change.md's own
//    scaffold, Change 0079) either still holds the untouched scaffold
//    placeholder ("-", or the Decision (human) section's own pending
//    sentence) or it does not. No middle ground, no guessing.
// 2. Item-level markers — a bullet line ending in an explicit, author-written
//    marker ("(deferred)", "(ambiguous)", "(decision required)") is
//    classified accordingly; "(human)" reuses the exact convention Change
//    0079's tasks.md already established. A marker is never inferred from
//    prose — only from the literal marker the human or assistant wrote.

// The exact heading text `definitionChangeFiles()` (cli.js, Change 0079)
// writes, in order — kept here rather than re-derived from a live scaffold
// so this module has no import-time dependency on cli.js.
export const DEFINITION_SECTIONS = [
  "Context",
  "Business / Product Constraints",
  "Known Requirements",
  "Assumptions",
  "Open Questions",
  "Decisions Required",
  "Options Considered",
  "Recommendation",
  "Decision (human)",
  "Rationale",
  "Consequences",
  "Non-Functional Requirements",
  "Security & Compliance",
  "Data & Domain",
  "Integrations",
  "Deployment & Operations",
  "Implementation Prerequisites",
  "Follow-up Changes"
];

const DECISION_PENDING_TEXT = /pending human approval/i;

const ITEM_MARKERS = [
  ["deferred", /\(deferred\)\s*$/i],
  ["ambiguous", /\(ambiguous\)\s*$/i],
  ["decisionRequired", /\(decision required\)\s*$/i],
  ["humanApprovalRequired", /\(human\)\s*$/i]
];

// Splits change.md into { "Heading text": "raw content between this ##
// heading and the next" }. CRLF-tolerant, matching changeTypeFromContent()'s
// own discipline (a Definition Change written on Windows must classify the
// same as one written on Unix).
function splitSections(changeMd) {
  const sections = {};
  const lines = String(changeMd || "").split(/\r?\n/);
  let current = null;
  let buffer = [];
  const flush = () => {
    if (current !== null) sections[current] = buffer.join("\n").trim();
  };
  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      flush();
      current = match[1];
      buffer = [];
    } else if (current !== null) {
      buffer.push(line);
    }
  }
  flush();
  return sections;
}

// analyzeDefinitionSections(changeMd) -> {
//   known: string[], missing: string[],           // section names
//   deferred, ambiguous, decisionRequired, humanApprovalRequired: string[]  // marked lines
// }
export function analyzeDefinitionSections(changeMd) {
  const sections = splitSections(changeMd);
  const known = [];
  const missing = [];

  for (const name of DEFINITION_SECTIONS) {
    const content = sections[name] || "";
    const isPlaceholder = content === "-" || content === "" || (name === "Decision (human)" && DECISION_PENDING_TEXT.test(content));
    if (isPlaceholder) missing.push(name);
    else known.push(name);
  }

  const marked = { deferred: [], ambiguous: [], decisionRequired: [], humanApprovalRequired: [] };
  // Change 0107: accept "-", "*" or "+" as the bullet character — the same
  // CommonMark unordered-list markers change.js's countOpenTasks() already
  // accepts (/^\s*[-*+] \[ \]/, Change 0075). This module predates that
  // standardization and only ever recognized "-", silently dropping any
  // (deferred)/(ambiguous)/(decision required)/(human) marker written with
  // "*" or "+".
  for (const rawLine of String(changeMd || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!/^[-*+]/.test(line)) continue;
    for (const [bucket, pattern] of ITEM_MARKERS) {
      if (pattern.test(line)) {
        marked[bucket].push(line.replace(/^[-*+]+\s*/, ""));
        break; // one marker per line — first match wins, same discipline as changeTypeFromContent's single match
      }
    }
  }

  return { known, missing, ...marked };
}
