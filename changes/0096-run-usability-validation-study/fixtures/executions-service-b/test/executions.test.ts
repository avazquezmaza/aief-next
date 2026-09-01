import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Isolated DB per test run, so runs don't accumulate seed rows.
const dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "executions-db-")), "test.db");
process.env.EXECUTIONS_DB_PATH = dbPath;

const { createApp } = await import("../src/app.js");

test("GET /executions only returns rows for the requesting tenant", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address() as { port: number };
  try {
    const res = await fetch(`http://localhost:${port}/executions`, {
      headers: { "x-tenant-id": "tenant-a" }
    });
    assert.equal(res.status, 200);
    const rows = await res.json();
    assert.ok(Array.isArray(rows) && rows.length > 0, "expected at least one row for tenant-a");
    for (const row of rows) {
      assert.equal(row.tenant_id, "tenant-a", `row ${row.id} belongs to ${row.tenant_id}, not tenant-a`);
    }
  } finally {
    server.close();
  }
});

test("GET /executions without X-Tenant-Id is rejected", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address() as { port: number };
  try {
    const res = await fetch(`http://localhost:${port}/executions`);
    assert.equal(res.status, 400);
  } finally {
    server.close();
  }
});
