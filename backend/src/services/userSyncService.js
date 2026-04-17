import { getSqlPool, hasSqlConnectionConfig } from "../sql/db.js";

function toTrimmedString(value, fallback = "") {
    const normalized = String(value ?? fallback).trim();
    return normalized;
}

function toPlainObject(value, fallback = {}) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return fallback;
    }

    return value;
}

function toJson(value, fallback = {}) {
    return JSON.stringify(toPlainObject(value, fallback));
}

function normalizeFavorites(favorites) {
    if (!Array.isArray(favorites)) {
        return [];
    }

    return Array.from(new Set(favorites.map((entry) => toTrimmedString(entry)).filter(Boolean)));
}

async function withSqlTransaction(work) {
    const pool = getSqlPool();
    if (!pool) {
        return null;
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await work(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        try {
            await client.query("ROLLBACK");
        } catch {
            // ignore rollback errors; the original error is more useful
        }

        throw error;
    } finally {
        client.release();
    }
}

async function ensureSqlUser(client, user) {
    const mongoUserId = toTrimmedString(user?._id || user?.id);
    const fullName = toTrimmedString(user?.fullName || user?.name);
    const email = toTrimmedString(user?.email).toLowerCase();

    if (!mongoUserId || !fullName || !email) {
        throw new Error("Cannot sync user without mongo id, name, and email.");
    }

    const payload = {
        mongoUserId,
        fullName,
        email,
        phone: toTrimmedString(user?.phone),
        role: toTrimmedString(user?.role || "user").toLowerCase() || "user",
        isVerifiedDeveloper: Boolean(user?.isVerifiedDeveloper),
        bio: toTrimmedString(user?.bio),
        avatarUrl: toTrimmedString(user?.avatarUrl),
        socialLinks: toJson(user?.socialLinks, {}),
        stats: toJson(user?.stats, {}),
        emailPreferences: toJson(user?.emailPreferences, {}),
    };

    const updateResult = await client.query(
        `UPDATE users
         SET mongo_user_id = COALESCE($1, mongo_user_id),
             name = $2,
             full_name = $2,
             email = $3,
             phone = $4,
             role = $5,
             is_verified_developer = $6,
             bio = $7,
             avatar_url = $8,
             social_links = $9::jsonb,
             stats = $10::jsonb,
             email_preferences = $11::jsonb,
             updated_at = NOW()
         WHERE mongo_user_id = $1 OR email = $3
         RETURNING user_id`,
        [
            payload.mongoUserId,
            payload.fullName,
            payload.email,
            payload.phone,
            payload.role,
            payload.isVerifiedDeveloper,
            payload.bio,
            payload.avatarUrl,
            payload.socialLinks,
            payload.stats,
            payload.emailPreferences,
        ]
    );

    if (updateResult.rowCount > 0) {
        return updateResult.rows[0].user_id;
    }

    const insertResult = await client.query(
        `INSERT INTO users (
            mongo_user_id,
            name,
            full_name,
            email,
            phone,
            role,
            is_verified_developer,
            bio,
            avatar_url,
            social_links,
            stats,
            email_preferences,
            updated_at
        ) VALUES (
            $1, $2, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb, NOW()
        )
        RETURNING user_id`,
        [
            payload.mongoUserId,
            payload.fullName,
            payload.email,
            payload.phone,
            payload.role,
            payload.isVerifiedDeveloper,
            payload.bio,
            payload.avatarUrl,
            payload.socialLinks,
            payload.stats,
            payload.emailPreferences,
        ]
    );

    return insertResult.rows[0].user_id;
}

export async function syncSqlUserAccount(user) {
    if (!hasSqlConnectionConfig() || !user) {
        return null;
    }

    try {
        return await withSqlTransaction(async (client) => ensureSqlUser(client, user));
    } catch (error) {
        console.warn(`Skipping PostgreSQL user sync: ${error.message}`);
        return null;
    }
}

export async function syncSqlUserFavorites(user, favorites = []) {
    if (!hasSqlConnectionConfig() || !user) {
        return [];
    }

    const normalizedFavorites = normalizeFavorites(favorites);

    try {
        return await withSqlTransaction(async (client) => {
            const sqlUserId = await ensureSqlUser(client, user);
            await client.query("DELETE FROM user_favorites WHERE user_id = $1", [sqlUserId]);

            for (const componentMongoId of normalizedFavorites) {
                await client.query(
                    `INSERT INTO user_favorites (mongo_user_id, user_id, component_mongo_id, updated_at)
                     VALUES ($1, $2, $3, NOW())
                     ON CONFLICT (user_id, component_mongo_id)
                     DO UPDATE SET updated_at = NOW()`,
                    [toTrimmedString(user?._id || user?.id), sqlUserId, componentMongoId]
                );
            }

            return normalizedFavorites;
        });
    } catch (error) {
        console.warn(`Skipping PostgreSQL favorites sync: ${error.message}`);
        return [];
    }
}

export async function syncSqlReview(review, { user = null, componentMongoId = "" } = {}) {
    if (!hasSqlConnectionConfig() || !review) {
        return null;
    }

    const reviewMongoId = toTrimmedString(review?._id || review?.id);
    const reviewUser = user || review.userId;
    const reviewUserId = reviewUser?._id || reviewUser?.id || review.userId;
    const resolvedComponentMongoId = toTrimmedString(componentMongoId || review.componentMongoId || review.componentIdMongoId || review.componentId);

    if (!reviewMongoId || !reviewUserId || !resolvedComponentMongoId) {
        return null;
    }

    try {
        return await withSqlTransaction(async (client) => {
            const sqlUserId = await ensureSqlUser(client, reviewUser);
            const { rows } = await client.query(
                `INSERT INTO reviews (
                    mongo_review_id,
                    mongo_user_id,
                    user_id,
                    component_mongo_id,
                    rating,
                    title,
                    comment,
                    helpful,
                    unhelpful,
                    is_verified,
                    status,
                    updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()
                )
                ON CONFLICT (mongo_review_id)
                DO UPDATE SET
                    mongo_user_id = EXCLUDED.mongo_user_id,
                    user_id = EXCLUDED.user_id,
                    component_mongo_id = EXCLUDED.component_mongo_id,
                    rating = EXCLUDED.rating,
                    title = EXCLUDED.title,
                    comment = EXCLUDED.comment,
                    helpful = EXCLUDED.helpful,
                    unhelpful = EXCLUDED.unhelpful,
                    is_verified = EXCLUDED.is_verified,
                    status = EXCLUDED.status,
                    updated_at = NOW()
                RETURNING review_id`,
                [
                    reviewMongoId,
                    toTrimmedString(reviewUserId),
                    sqlUserId,
                    resolvedComponentMongoId,
                    Number(review.rating) || 0,
                    toTrimmedString(review.title),
                    toTrimmedString(review.comment),
                    Number(review.helpful) || 0,
                    Number(review.unhelpful) || 0,
                    Boolean(review.isVerified),
                    toTrimmedString(review.status || "approved") || "approved",
                ]
            );

            return rows[0]?.review_id || null;
        });
    } catch (error) {
        console.warn(`Skipping PostgreSQL review sync: ${error.message}`);
        return null;
    }
}

export async function syncSqlRating(ratingRecord, { user = null, componentMongoId = "" } = {}) {
    if (!hasSqlConnectionConfig() || !ratingRecord) {
        return null;
    }

    const ratingMongoId = toTrimmedString(ratingRecord?._id || ratingRecord?.id);
    const ratingUser = user || ratingRecord.userId;
    const ratingUserId = ratingUser?._id || ratingUser?.id || ratingRecord.userId;
    const resolvedComponentMongoId = toTrimmedString(componentMongoId || ratingRecord.componentMongoId || ratingRecord.componentId);

    if (!ratingMongoId || !ratingUserId || !resolvedComponentMongoId) {
        return null;
    }

    try {
        return await withSqlTransaction(async (client) => {
            const sqlUserId = await ensureSqlUser(client, ratingUser);
            const { rows } = await client.query(
                `INSERT INTO ratings (
                    mongo_rating_id,
                    mongo_user_id,
                    user_id,
                    component_mongo_id,
                    rating,
                    updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, NOW()
                )
                ON CONFLICT (mongo_rating_id)
                DO UPDATE SET
                    mongo_user_id = EXCLUDED.mongo_user_id,
                    user_id = EXCLUDED.user_id,
                    component_mongo_id = EXCLUDED.component_mongo_id,
                    rating = EXCLUDED.rating,
                    updated_at = NOW()
                RETURNING rating_id`,
                [
                    ratingMongoId,
                    toTrimmedString(ratingUserId),
                    sqlUserId,
                    resolvedComponentMongoId,
                    Number(ratingRecord.rating) || 0,
                ]
            );

            return rows[0]?.rating_id || null;
        });
    } catch (error) {
        console.warn(`Skipping PostgreSQL rating sync: ${error.message}`);
        return null;
    }
}

export async function syncSqlDiscussion(discussion, { user = null, componentMongoId = "" } = {}) {
    if (!hasSqlConnectionConfig() || !discussion) {
        return null;
    }

    const discussionMongoId = toTrimmedString(discussion?._id || discussion?.id);
    const discussionUser = user || discussion.userId;
    const discussionUserId = discussionUser?._id || discussionUser?.id || discussion.userId;
    const resolvedComponentMongoId = toTrimmedString(componentMongoId || discussion.componentMongoId || discussion.componentId);

    if (!discussionMongoId || !discussionUserId || !resolvedComponentMongoId) {
        return null;
    }

    try {
        return await withSqlTransaction(async (client) => {
            const sqlUserId = await ensureSqlUser(client, discussionUser);
            const { rows } = await client.query(
                `INSERT INTO discussions (
                    mongo_discussion_id,
                    mongo_user_id,
                    user_id,
                    component_mongo_id,
                    parent_mongo_id,
                    message,
                    likes,
                    status,
                    updated_at
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, NOW()
                )
                ON CONFLICT (mongo_discussion_id)
                DO UPDATE SET
                    mongo_user_id = EXCLUDED.mongo_user_id,
                    user_id = EXCLUDED.user_id,
                    component_mongo_id = EXCLUDED.component_mongo_id,
                    parent_mongo_id = EXCLUDED.parent_mongo_id,
                    message = EXCLUDED.message,
                    likes = EXCLUDED.likes,
                    status = EXCLUDED.status,
                    updated_at = NOW()
                RETURNING discussion_id`,
                [
                    discussionMongoId,
                    toTrimmedString(discussionUserId),
                    sqlUserId,
                    resolvedComponentMongoId,
                    discussion.parentId ? toTrimmedString(discussion.parentId) : null,
                    toTrimmedString(discussion.message),
                    Number(discussion.likes) || 0,
                    toTrimmedString(discussion.status || "active") || "active",
                ]
            );

            return rows[0]?.discussion_id || null;
        });
    } catch (error) {
        console.warn(`Skipping PostgreSQL discussion sync: ${error.message}`);
        return null;
    }
}
