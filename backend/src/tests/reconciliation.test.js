import assert from "node:assert/strict";
import test from "node:test";
import { reconcileUserFavorites } from "../services/reconciliationService.js";

test("reconcileUserFavorites reports mismatches", async () => {
  const User = {
    find: () => ({
      select: () => ({
        lean: async () => [
          { _id: "u1", favorites: ["c1", "c2"] },
        ],
      }),
    }),
  };

  const result = await reconcileUserFavorites({
    User,
    sqlQueryFn: async () => ({ rows: [{ mongo_user_id: "u1", component_mongo_id: "c1" }] }),
  });

  assert.equal(result.checkedUsers, 1);
  assert.equal(result.mismatchCount, 1);
});
