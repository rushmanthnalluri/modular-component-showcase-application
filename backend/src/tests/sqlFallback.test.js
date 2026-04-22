import assert from "node:assert/strict";
import test from "node:test";
import { closeSqlPool, getSqlPool, hasSqlConnectionConfig } from "../sql/db.js";
import { DDL } from "../sql/initSchema.js";

function snapshotSqlEnv() {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    PGHOST: process.env.PGHOST,
    PGUSER: process.env.PGUSER,
    PGPASSWORD: process.env.PGPASSWORD,
    PGDATABASE: process.env.PGDATABASE,
    PGPORT: process.env.PGPORT,
    PGSSL: process.env.PGSSL,
  };
}

function restoreSqlEnv(snapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

test("sql helpers fall back cleanly when connection settings are absent", async () => {
  const snapshot = snapshotSqlEnv();

  try {
    await closeSqlPool();
    delete process.env.DATABASE_URL;
    delete process.env.PGHOST;
    delete process.env.PGUSER;
    delete process.env.PGPASSWORD;
    delete process.env.PGDATABASE;
    delete process.env.PGPORT;
    delete process.env.PGSSL;

    assert.equal(hasSqlConnectionConfig(), false);
    assert.equal(getSqlPool(), null);
  } finally {
    await closeSqlPool();
    restoreSqlEnv(snapshot);
  }
});

test("sql fallback evidence still includes required tables, indexes, and fixtures", () => {
  const ddl = DDL.join("\n");

  assert.match(ddl, /CREATE TABLE IF NOT EXISTS users/);
  assert.match(ddl, /CREATE TABLE IF NOT EXISTS components/);
  assert.match(ddl, /CREATE TABLE IF NOT EXISTS reviews/);
  assert.match(ddl, /CREATE TABLE IF NOT EXISTS ratings/);
  assert.match(ddl, /CREATE TABLE IF NOT EXISTS service_outbox/);
  assert.match(ddl, /CREATE INDEX IF NOT EXISTS idx_components_name/);
  assert.match(ddl, /CREATE MATERIALIZED VIEW IF NOT EXISTS mv_component_quality_snapshot/);
});
