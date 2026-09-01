import express from "express";
import { listInvoices } from "./billing/service.js";
import { renderReportPage } from "./frontend/reportView.js";

export function createApp() {
  const app = express();

  app.get("/invoices", (_req, res) => res.json(listInvoices()));
  app.get("/reports", renderReportPage);
  app.get("/health", (_req, res) => res.json({ ok: true }));

  return app;
}
