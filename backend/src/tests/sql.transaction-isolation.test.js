import assert from "node:assert/strict";
import test from "node:test";
import { hasSqlConnectionConfig, query } from "../sql/db.js";

test("sql transaction isolation smoke", { timeout: 20000 }, async (t) => {
  if (!hasSqlConnectionConfig()) {
    t.skip("SQL connection is not configured.");
    return;
  }

  const tx1 = await query("BEGIN");
  assert.ok(tx1);
  await query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
  const result = await query("SELECT current_setting('transaction_isolation') AS isolation_level");
  assert.equal(result.rows[0].isolation_level, "read committed");
  await query("ROLLBACK");
});
