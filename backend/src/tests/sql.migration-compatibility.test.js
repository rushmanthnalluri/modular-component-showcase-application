import assert from "node:assert/strict";
import test from "node:test";
import { hasSqlConnectionConfig, query } from "../sql/db.js";
import { initializeSqlSchema } from "../sql/initSchema.js";

test("sql migration compatibility and required tables", { timeout: 30000 }, async (t) => {
  if (!hasSqlConnectionConfig()) {
    t.skip("SQL connection is not configured.");
    return;
  }

  await initializeSqlSchema();
  const result = await query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('users','categories','components','user_favorites','reviews','discussions','ratings')
  `);

  const names = new Set(result.rows.map((row) => row.table_name));
  assert.equal(names.has("users"), true);
  assert.equal(names.has("components"), true);
  assert.equal(names.has("reviews"), true);
});
