import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../src/app.js";

test("GET /reports renders the operations report", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address() as { port: number };
  try {
    const res = await fetch(`http://localhost:${port}/reports`);
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /Operations Report/);
  } finally {
    server.close();
  }
});

test("GET /invoices lists billing invoices", async () => {
  const app = createApp();
  const server = app.listen(0);
  const { port } = server.address() as { port: number };
  try {
    const res = await fetch(`http://localhost:${port}/invoices`);
    assert.equal(res.status, 200);
    const invoices = await res.json();
    assert.ok(Array.isArray(invoices) && invoices.length > 0);
  } finally {
    server.close();
  }
});
