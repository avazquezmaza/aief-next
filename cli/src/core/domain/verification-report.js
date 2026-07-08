// VerificationReport: a plain, explicit object accumulating verification
// output. `errors`/`warnings`/`passed` are the aggregate facts a caller may
// want to inspect programmatically; `lines` carries everything needed to
// render the exact same CLI output as before (level decides which console
// method prints it); `next` holds the "Next:" hint commands.
export function createVerificationReport() {
  return { lines: [], errors: [], warnings: [], passed: true, next: [] };
}

// level: "ok" | "info" | "warn" | "error". Only "error" flips passed to
// false and is collected into errors; only "warn" is collected into warnings.
// "ok"/"info" lines are purely informational.
export function addLine(report, level, text) {
  report.lines.push({ level, text });
  if (level === "error") { report.errors.push(text); report.passed = false; }
  else if (level === "warn") { report.warnings.push(text); }
}

export function setNext(report, ...commands) {
  report.next = commands;
}
