// Manifest/change.md status drift detection (Change 0095).
//
// docs/concepts.md documents a known, deliberate limitation: no AIEF command
// writes or synchronizes manifest.status — `aief close --yes` writes only
// change.md's own `## Status` section (change-loader.js's loadManifestChange()
// treats manifest.status as authoritative and never reads change.md's status
// for the closed/open decision). If `aief close --yes` ever runs against a
// manifest-backed Change, change.md gains a `## Status / Closed` declaration
// that the manifest branch silently ignores — a plausible, confident, wrong
// answer, the same failure class Change 0036 named for a different file pair.
//
// This module does not fix that gap (ADR-009/ADR-016 forbid turning the
// manifest into a reconciled or authoritative store of derived state — see
// changes/0095-manifest-status-change-md-discrepancy-lint/change.md). It only
// makes the disagreement visible: a pure comparator, no I/O, no gate, no
// blocker — the same "unverified hint, disagreement reported, never silently
// resolved" pattern ADR-016 already established for manifest.next_action.
import { parseChangeStatus } from "./change.js";

// detectManifestStatusDrift(change) -> { drift, manifestStatus, changeMdStatus }
//   change is an already-loaded loadChangeUnified() record (change.files must
//   include "change.md" — see loadManifestChange()'s changeMdRaw exposure).
// A Change with no manifest, an invalid manifest, or a change.md that never
// declares its own status at all is never a drift candidate — change.md's
// silence is not evidence of disagreement with a manifest that was simply
// created and never independently touched.
export function detectManifestStatusDrift(change) {
  if (!change || change.source !== "manifest" || change.manifestError || !change.manifest) {
    return { drift: false, manifestStatus: null, changeMdStatus: null };
  }
  const manifestStatus = change.manifest.status;
  const parsed = parseChangeStatus(change.changeMdRaw || "");
  if (!parsed.declarations.length) {
    return { drift: false, manifestStatus, changeMdStatus: null };
  }
  // parsed.state is "closed" | "open" | "unknown" — "unknown" (declared but
  // unparseable) is reported as drift too, same as any other disagreement:
  // manifestStatus is always a valid "open"/"closed" by this point, so it
  // can never itself equal "unknown".
  return { drift: parsed.state !== manifestStatus, manifestStatus, changeMdStatus: parsed.state };
}
