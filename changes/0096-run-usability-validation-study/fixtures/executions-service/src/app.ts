import express from "express";
import { openDb } from "./db.js";

export function createApp() {
  const db = openDb();
  const app = express();

  // GET /executions — list workflow executions for the caller's tenant.
  // Callers identify their tenant via the X-Tenant-Id header (set by the
  // gateway in every real deployment; here it's passed directly for
  // local testing).
  app.get("/executions", (req, res) => {
    const tenantId = req.header("x-tenant-id");
    if (!tenantId) {
      res.status(400).json({ error: "Missing X-Tenant-Id header" });
      return;
    }
    // BUG: this query does not filter by tenant_id — it returns every
    // tenant's rows regardless of who asked.
    const rows = db.prepare("SELECT id, tenant_id, workflow_name, status, created_at FROM executions ORDER BY id").all();
    res.json(rows);
  });

  app.get("/health", (_req, res) => res.json({ ok: true }));

  return app;
}
