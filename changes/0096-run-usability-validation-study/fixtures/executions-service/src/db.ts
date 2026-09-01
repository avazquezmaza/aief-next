import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DB_PATH = process.env.EXECUTIONS_DB_PATH
  || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "executions.db");

export function openDb(): Database.Database {
  const db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      workflow_name TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  const count = db.prepare("SELECT COUNT(*) AS n FROM executions").get() as { n: number };
  if (count.n === 0) seed(db);
  return db;
}

function seed(db: Database.Database) {
  const insert = db.prepare(
    "INSERT INTO executions (tenant_id, workflow_name, status, created_at) VALUES (?, ?, ?, ?)"
  );
  const rows: [string, string, string, string][] = [
    ["tenant-a", "nightly-billing-sync", "done", "2026-08-01T02:00:00Z"],
    ["tenant-a", "invoice-export", "failed", "2026-08-01T03:15:00Z"],
    ["tenant-a", "nightly-billing-sync", "done", "2026-08-02T02:00:00Z"],
    ["tenant-b", "customer-import", "done", "2026-08-01T01:00:00Z"],
    ["tenant-b", "customer-import", "active", "2026-08-02T01:00:00Z"],
    ["tenant-c", "report-generation", "done", "2026-08-01T04:00:00Z"]
  ];
  const insertMany = db.transaction((data: typeof rows) => {
    for (const row of data) insert.run(...row);
  });
  insertMany(rows);
}
