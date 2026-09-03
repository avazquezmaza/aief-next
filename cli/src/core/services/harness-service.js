// Harness Service (AIEF 3.1, Change 0056, ADR-026).
//
// Resolves a Change's opt-in Harness configuration (manifest.harness,
// already structurally validated by change-manifest.js) against the real
// Hook Registry, and provides the presentation-agnostic building blocks
// `aief doctor`/`aief status`/`aief prompt`/`aief verify` render from.
//
// Deliberately does NOT touch hook.js/hooks/index.js/hook-service.js/
// hook-context.js — every function here is a pure, read-only composition
// over their existing, unmodified exports (ADR-020 stays fully in force).
// No filesystem write, no command execution, no network — mirrors
// sdd-provider-resolver.js's own separation of "structural shape" (the
// manifest validator) from "runtime/registry resolution" (this module).
import { hasHook, listDescriptors, describeHook, getHook } from "../../hooks/index.js";
import { EVENT_IDS } from "../domain/hook.js";

// resolveHarnessConfig(manifest) ->
//   { configured, log, disabledByEvent: { [eventId]: string[] }, unknownHookIds: [{event, id}] }
//
// `manifest` may be null/undefined (no manifest.json) or a manifest object
// without a `harness` field — both resolve to `configured: false`, the
// strict no-op every existing Change (none of which declares `harness`)
// gets. Unknown Hook ids inside a known event's `disabled` list are
// reported, never thrown and never treated as if they disabled something
// real (R4).
export function resolveHarnessConfig(manifest) {
  const harness = manifest && typeof manifest === "object" ? manifest.harness : undefined;
  if (!harness || typeof harness !== "object") {
    return { configured: false, log: false, disabledByEvent: {}, unknownHookIds: [] };
  }

  const log = harness.log === true;
  const hooksConfig = harness.hooks && typeof harness.hooks === "object" ? harness.hooks : {};
  const disabledByEvent = {};
  const unknownHookIds = [];

  for (const eventId of EVENT_IDS) {
    const declared = hooksConfig[eventId];
    const list = declared && Array.isArray(declared.disabled) ? declared.disabled : [];
    const known = [];
    for (const id of list) {
      if (typeof id === "string" && hasHook(id)) known.push(id);
      else unknownHookIds.push({ event: eventId, id });
    }
    disabledByEvent[eventId] = known;
  }

  return { configured: true, log, disabledByEvent, unknownHookIds };
}

// partitionOutcome(outcome, config) -> { active: [...], disabled: [...] }
//
// Splits an already-computed evaluateEvent() outcome (hook-service.js,
// unmodified — every registered Hook was already evaluated, unconditionally,
// exactly as ADR-020 specifies) into results that count as "active" for
// rendering/logging vs. results for Hooks this Change's manifest opted to
// disable for this event. A disabled Hook's own result still exists (it was
// still evaluated — Hooks are pure and side-effect-free, so this costs
// nothing observable) — it is simply excluded downstream (R3/R7).
export function partitionOutcome(outcome, config) {
  const disabledIds = new Set(config.disabledByEvent[outcome.event] || []);
  const active = outcome.results.filter((r) => !disabledIds.has(r.hook));
  const disabled = outcome.results.filter((r) => disabledIds.has(r.hook));
  return { active, disabled };
}

// describeHarnessRegistry() -> the static, project-wide list of registered
// Hooks (id/version/title/description/events/capabilities) — always the
// same regardless of any Change's manifest. Thin passthrough to
// hooks/index.js's own listDescriptors(), kept here so callers (cli.js) only
// ever import from harness-service.js for anything Harness-shaped.
export function describeHarnessRegistry() {
  return listDescriptors();
}

// hookTitle(hookId) -> the registered Hook's own title, or the id itself if
// somehow not registered (never thrown — a rendering helper, not a
// validator; resolveHarnessConfig() already filtered unknown ids out of
// disabledByEvent).
export function hookTitle(hookId) {
  const mod = getHook(hookId);
  return mod ? describeHook(mod).title : hookId;
}

// formatHookResultsBlock(results) -> aief prompt's additive Hook section
// text (Entrega 6 origin, design.md §7/§8; extended Change 0056/ADR-026 to
// also render `failed`/`invalid` results — previously silently dropped, now
// visible so a Hook failure is never invisible). The ONLY place this
// framing text is written, so no Hook's own text can phrase itself as
// something that "ran"/"executed" (a Hook observes; HK-R25-equivalent
// discipline). Silent for a Hook with nothing to show (`not_applicable`,
// `unsupported`, or `matched` with empty instructions/warnings) — never an
// empty or noisy block. `results` is the caller's own already-partitioned
// "active" list (a disabled Hook's result must be excluded before it ever
// reaches this function). Never a stack trace — `r.errors` holds only the
// message strings evaluateHook() already produced (ADR-020), no
// `Error.stack` is ever threaded through.
export function formatHookResultsBlock(results) {
  return results
    .filter((r) => (r.status === "matched" && (r.instructions.length || r.warnings.length)) || r.status === "failed" || r.status === "invalid")
    .map((r) => {
      if (r.status === "failed" || r.status === "invalid") {
        return `\n─── Hook: ${r.hook} (${r.status}) ───\n${r.errors.length ? r.errors.join("; ") : r.summary}\n`;
      }
      const lines = [...r.warnings.map((w) => `Warning: ${w}`), ...r.instructions];
      return `\n─── Hook: ${r.hook} ───\n${r.summary}\n\n${lines.map((l) => `- ${l}`).join("\n")}\n`;
    })
    .join("");
}

// describeFailingHooks(results) -> one-line summaries for `failed`/`invalid`
// results only (aief verify's compact rendering, Change 0056/ADR-026) — same
// never-a-stack-trace discipline as formatHookResultsBlock() above.
export function describeFailingHooks(results) {
  return results
    .filter((r) => r.status === "failed" || r.status === "invalid")
    .map((r) => `${r.hook} (${r.event}, ${r.status}): ${r.errors.length ? r.errors.join("; ") : r.summary}`);
}

// formatHookLogSection({ timestamp, operation, changeId, event, passed, entries })
//   -> Markdown text for one hooks.md entry (Change 0056, ADR-026, spec.md R8).
//
// Pure string formatting — the caller (cli.js) decides whether/when to
// append it to <changeDir>/hooks.md; this function never touches the
// filesystem. Only each Hook's own short `summary` field is ever included —
// never raw context, never a Skill result's full content, never anything
// resembling a credential or command output (Hooks structurally cannot
// produce either, per ADR-020's FORBIDDEN_CAPABILITIES).
export function formatHookLogSection({ timestamp, operation, changeId, event: _event, passed, entries }) {
  const lines = [
    `## ${timestamp} — ${operation}`,
    "",
    `Change: ${changeId}${typeof passed === "boolean" ? ` — ${passed ? "PASS" : "FAIL"}` : ""}`,
    "",
    "| Hook | Event | Status | Summary |",
    "|---|---|---|---|"
  ];
  for (const entry of entries) {
    const summary = (entry.summary || "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
    lines.push(`| ${entry.hook} | ${entry.event} | ${entry.status} | ${summary} |`);
  }
  lines.push("");
  return lines.join("\n");
}
