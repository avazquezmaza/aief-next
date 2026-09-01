// Reporting UI — the frontend view TASK.md refers to. It calls the reporting
// module's function directly, in-process: no HTTP boundary, no independent
// deploy. That direct import is the coupling a strangler split needs to
// replace with a real seam (an API call, a queue, anything crossing a
// process boundary) before this view can move to its own service.
import type { Request, Response } from "express";
import { getSummary } from "../reporting/service.js";

export function renderReportPage(_req: Request, res: Response) {
  const summary = getSummary();
  res.send(`<!doctype html>
<html>
  <body>
    <h1>Operations Report</h1>
    <ul>
      <li>Total invoices: ${summary.totalInvoices}</li>
      <li>Paid: $${(summary.paidAmountCents / 100).toFixed(2)}</li>
      <li>Open: $${(summary.openAmountCents / 100).toFixed(2)}</li>
      <li>Tenants: ${summary.tenants.join(", ")}</li>
    </ul>
  </body>
</html>`);
}
