import assert from "node:assert/strict";
import test from "node:test";
import { hasSqlConnectionConfig, query } from "../sql/db.js";
import { initializeSqlSchema } from "../sql/initSchema.js";

test("sql performance baseline explain analyze", { timeout: 30000 }, async (t) => {
  if (!hasSqlConnectionConfig()) {
    t.skip("SQL connection is not configured.");
    return;
  }

  await initializeSqlSchema();

  const result = await query(`
    EXPLAIN (ANALYZE, FORMAT JSON)
    SELECT component_mongo_id, COUNT(*)
    FROM ratings
    GROUP BY component_mongo_id
  `);

  assert.equal(Array.isArray(result.rows), true);
  assert.equal(result.rows.length > 0, true);
});
