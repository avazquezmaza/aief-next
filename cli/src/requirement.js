// Requirement Sources: real enterprise work rarely starts with `aief new-change`
// — it starts in Jira, Notion, GitHub Issues, Azure DevOps or a document.
// AIEF integrates those as read-only Requirement Sources: every provider
// produces the same Normalized Requirement object, the external source is
// never modified, and everything AIEF derives lives in visible, versionable
// Change artifacts (ADR-009: no hidden state).
//
// Provider contract (present and future, including API/MCP adapters):
// - read-only: never write back to the source;
// - no credentials stored in the repo, ever;
// - no network calls unless a future adapter makes them explicit and loud;
// - output is always a Normalized Requirement (the shape below);
// - unimplemented providers fail loudly — never a silent fallback.

// This is the catalog of known providers (what AIEF knows *about*), independent
// of which ones have an actual adapter (what AIEF can *retrieve today*). The
// single source of truth for "is this implemented" is the adapter registry in
// requirement-providers/index.js — this file only describes the provider,
// mirroring how the Skills catalog (ADR-010) separates "known" from
// "recommended"/"has content".
export const PROVIDERS = {
  manual: { id: "manual", summary: "human-provided requirement; AIEF creates the skeleton, you fill the facts" },
  jira: { id: "jira", summary: "Jira issue via a local export file (placeholder adapter: no network, no credentials)" },
  notion: { id: "notion", summary: "planned" },
  github: { id: "github", summary: "planned (GitHub Issues)" },
  "azure-devops": { id: "azure-devops", summary: "planned" },
  markdown: { id: "markdown", summary: "planned (requirement from a local Markdown file)" }
};

// isImplemented: predicate injected by the caller (cli.js passes
// requirement-providers' hasAdapter) so this model file never needs to import
// the adapter layer — dependencies flow one way: cli.js -> providers -> model.
export function providerList(isImplemented = () => true) {
  return Object.values(PROVIDERS)
    .map((p) => `- ${p.id}${isImplemented(p.id) ? "" : " (planned, not implemented yet)"}: ${p.summary}`)
    .join("\n");
}

// The Normalized Requirement: every provider maps its native shape into this
// one logical object. Fields a provider cannot fill stay empty — they are
// assumptions ([S]) until a human fills them during review.
export function emptyRequirement(provider, sourceId) {
  return {
    provider,
    sourceId,
    sourceUrl: "",
    title: "",
    description: "",
    status: "",
    priority: "",
    reporter: "",
    assignee: "",
    labels: [],
    comments: [],
    attachments: [],
    links: [],
    metadata: {},
    retrievedAt: new Date().toISOString(),
    readOnly: true
  };
}

// Tolerant flattener for Atlassian Document Format descriptions/comments.
function adfToText(node) {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (Array.isArray(node)) return node.map(adfToText).join("");
  const text = node.text || "";
  const children = adfToText(node.content || []);
  return `${text}${children}${node.type === "paragraph" ? "\n" : ""}`;
}

// Map a Jira REST-shaped issue export into the Normalized Requirement.
// Mapping only, never mutation: the export file is treated as read-only data.
export function normalizeJira(raw, sourceId) {
  const requirement = emptyRequirement("jira", sourceId);
  const fields = raw.fields || raw;
  requirement.sourceUrl = typeof raw.self === "string" ? raw.self : "";
  requirement.title = fields.summary || raw.title || "";
  requirement.description = typeof fields.description === "string" ? fields.description : adfToText(fields.description).trim();
  requirement.status = fields.status?.name || "";
  requirement.priority = fields.priority?.name || "";
  requirement.reporter = fields.reporter?.displayName || fields.reporter?.name || "";
  requirement.assignee = fields.assignee?.displayName || fields.assignee?.name || "";
  requirement.labels = Array.isArray(fields.labels) ? fields.labels : [];
  requirement.comments = (fields.comment?.comments || raw.comments || []).map((c) => ({
    author: c.author?.displayName || c.author || "",
    created: c.created || "",
    body: typeof c.body === "string" ? c.body : adfToText(c.body).trim()
  }));
  requirement.attachments = (fields.attachment || []).map((a) => a.filename || a.name || "").filter(Boolean);
  requirement.links = (fields.issuelinks || []).map((l) => l.outwardIssue?.key || l.inwardIssue?.key || "").filter(Boolean);
  requirement.metadata = { project: fields.project?.key || "", issueType: fields.issuetype?.name || "" };
  return requirement;
}
