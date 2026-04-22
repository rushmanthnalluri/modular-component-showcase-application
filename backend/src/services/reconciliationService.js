import { sqlQuery } from "../sql/db.js";
import { publishOutboxEvent } from "./outboxPublisher.js";

async function buildFavoriteDiff({ User, sqlQueryFn = sqlQuery }) {
  const mongoUsers = await User.find({}).select("_id favorites").lean();

  const sqlFavoritesResult = await sqlQueryFn("SELECT mongo_user_id, component_mongo_id FROM user_favorites");
  const sqlMap = new Map();

  for (const row of sqlFavoritesResult.rows) {
    const key = String(row.mongo_user_id || "");
    if (!sqlMap.has(key)) {
      sqlMap.set(key, new Set());
    }
    sqlMap.get(key).add(String(row.component_mongo_id || ""));
  }

  const mismatches = [];
  for (const user of mongoUsers) {
    const mongoUserId = String(user._id);
    const mongoFavorites = new Set((user.favorites || []).map((entry) => String(entry)));
    const sqlFavorites = sqlMap.get(mongoUserId) || new Set();

    const missingInSql = [...mongoFavorites].filter((entry) => !sqlFavorites.has(entry));
    const staleInSql = [...sqlFavorites].filter((entry) => !mongoFavorites.has(entry));

    if (missingInSql.length > 0 || staleInSql.length > 0) {
      mismatches.push({
        mongoUserId,
        missingInSql,
        staleInSql,
      });
    }
  }

  return {
    checkedUsers: mongoUsers.length,
    mismatchCount: mismatches.length,
    mismatches,
    checkedAt: new Date().toISOString(),
  };
}

export async function reconcileUserFavorites({ User, sqlQueryFn = sqlQuery, apply = false }) {
  const report = await buildFavoriteDiff({ User, sqlQueryFn });

  if (!apply || report.mismatches.length === 0) {
    return {
      ...report,
      mode: apply ? "apply-noop" : "dry-run",
    };
  }

  for (const mismatch of report.mismatches) {
    for (const componentMongoId of mismatch.missingInSql) {
      await sqlQueryFn(
        `
          INSERT INTO user_favorites (mongo_user_id, user_id, component_mongo_id)
          SELECT $1, user_id, $2
          FROM users
          WHERE mongo_user_id = $1
          ON CONFLICT (user_id, component_mongo_id) DO NOTHING
        `,
        [mismatch.mongoUserId, componentMongoId]
      );
    }

    if (mismatch.staleInSql.length > 0) {
      await sqlQueryFn(
        `
          DELETE FROM user_favorites
          WHERE mongo_user_id = $1
            AND component_mongo_id = ANY($2::text[])
        `,
        [mismatch.mongoUserId, mismatch.staleInSql]
      );
    }
  }

  const event = publishOutboxEvent({
    type: "user.favorites.reconciled",
    source: "backend.reconciliation",
    payload: {
      mismatchCount: report.mismatchCount,
      checkedUsers: report.checkedUsers,
    },
  });

  return {
    ...report,
    mode: "apply",
    outboxEventId: event.id,
  };
}
