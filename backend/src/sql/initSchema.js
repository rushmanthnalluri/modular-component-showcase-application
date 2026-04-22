import { sqlQuery } from "./db.js";

export const DDL = [
    `CREATE TABLE IF NOT EXISTS users (
        user_id BIGSERIAL PRIMARY KEY,
        mongo_user_id TEXT UNIQUE,
        name VARCHAR(120) NOT NULL,
        full_name VARCHAR(120) NOT NULL DEFAULT '',
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(30) NOT NULL DEFAULT '',
        role VARCHAR(32) NOT NULL DEFAULT 'user',
        is_verified_developer BOOLEAN NOT NULL DEFAULT false,
        bio TEXT NOT NULL DEFAULT '',
        avatar_image TEXT NOT NULL DEFAULT '',
        social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
        stats JSONB NOT NULL DEFAULT '{}'::jsonb,
        email_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS mongo_user_id TEXT",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(120) NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30) NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(32) NOT NULL DEFAULT 'user'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified_developer BOOLEAN NOT NULL DEFAULT false",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_image TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '{}'::jsonb",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS stats JSONB NOT NULL DEFAULT '{}'::jsonb",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_preferences JSONB NOT NULL DEFAULT '{}'::jsonb",
    `CREATE TABLE IF NOT EXISTS categories (
        category_id BIGSERIAL PRIMARY KEY,
        category_name VARCHAR(120) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS components (
        component_id BIGSERIAL PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        description TEXT NOT NULL,
        category_id BIGINT NOT NULL REFERENCES categories(category_id) ON UPDATE CASCADE ON DELETE RESTRICT,
        user_id BIGINT NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT components_name_non_empty CHECK (length(trim(name)) > 0)
    )`,
    `CREATE TABLE IF NOT EXISTS user_favorites (
        favorite_id BIGSERIAL PRIMARY KEY,
        mongo_user_id TEXT NOT NULL,
        user_id BIGINT NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
        component_mongo_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT user_favorites_unique UNIQUE (user_id, component_mongo_id)
    )`,
    `CREATE TABLE IF NOT EXISTS reviews (
        review_id BIGSERIAL PRIMARY KEY,
        mongo_review_id TEXT NOT NULL UNIQUE,
        mongo_user_id TEXT NOT NULL,
        user_id BIGINT NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
        component_mongo_id TEXT NOT NULL,
        rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        title TEXT NOT NULL DEFAULT '',
        comment TEXT NOT NULL,
        helpful INTEGER NOT NULL DEFAULT 0,
        unhelpful INTEGER NOT NULL DEFAULT 0,
        is_verified BOOLEAN NOT NULL DEFAULT false,
        status VARCHAR(32) NOT NULL DEFAULT 'approved',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS discussions (
        discussion_id BIGSERIAL PRIMARY KEY,
        mongo_discussion_id TEXT NOT NULL UNIQUE,
        mongo_user_id TEXT NOT NULL,
        user_id BIGINT NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
        component_mongo_id TEXT NOT NULL,
        parent_mongo_id TEXT,
        message TEXT NOT NULL,
        likes INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(32) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS ratings (
        rating_id BIGSERIAL PRIMARY KEY,
        mongo_rating_id TEXT NOT NULL UNIQUE,
        mongo_user_id TEXT NOT NULL,
        user_id BIGINT NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
        component_mongo_id TEXT NOT NULL,
        rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS service_outbox (
        event_id UUID PRIMARY KEY,
        event_type VARCHAR(160) NOT NULL,
        event_source VARCHAR(160) NOT NULL,
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ
    )`,
    `CREATE TABLE IF NOT EXISTS idempotency_keys (
        idempotency_key_id BIGSERIAL PRIMARY KEY,
        scope VARCHAR(120) NOT NULL,
        idempotency_key VARCHAR(255) NOT NULL,
        request_fingerprint TEXT NOT NULL DEFAULT '',
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        response_status_code INTEGER NOT NULL DEFAULT 202,
        response_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
        CONSTRAINT idempotency_keys_scope_key_unique UNIQUE (scope, idempotency_key)
    )`,
    "CREATE INDEX IF NOT EXISTS idx_components_category_id ON components(category_id)",
    "CREATE INDEX IF NOT EXISTS idx_components_user_id ON components(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_components_name ON components(name)",
    "CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_user_favorites_component ON user_favorites(component_mongo_id)",
    "CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_reviews_component ON reviews(component_mongo_id)",
    "CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON discussions(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_discussions_component ON discussions(component_mongo_id)",
    "CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_ratings_component ON ratings(component_mongo_id)",
    "CREATE INDEX IF NOT EXISTS idx_outbox_status_created_at ON service_outbox(status, created_at)",
    "CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at)",
    `CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
        RETURNS trigger
        LANGUAGE plpgsql
        AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        end;
        $$`,
    "DROP TRIGGER IF EXISTS trg_users_updated_at ON users",
    "CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp()",
    "DROP TRIGGER IF EXISTS trg_components_updated_at ON components",
    "CREATE TRIGGER trg_components_updated_at BEFORE UPDATE ON components FOR EACH ROW EXECUTE FUNCTION set_updated_at_timestamp()",
    `CREATE OR REPLACE VIEW vw_component_catalog AS
        SELECT
            c.component_id,
            c.name,
            c.description,
            cat.category_name,
            u.user_id,
            u.name AS author_name,
            c.created_at,
            c.updated_at
        FROM components c
        JOIN categories cat ON cat.category_id = c.category_id
        JOIN users u ON u.user_id = c.user_id`,
    `CREATE OR REPLACE VIEW vw_component_engagement AS
        SELECT
            r.component_mongo_id,
            COUNT(*) FILTER (WHERE r.rating = 5) AS five_star_count,
            AVG(r.rating::numeric) AS average_rating,
            COUNT(*) AS rating_count
        FROM ratings r
        GROUP BY r.component_mongo_id`,
    `CREATE MATERIALIZED VIEW IF NOT EXISTS mv_component_quality_snapshot AS
        SELECT
            c.component_id,
            c.name,
            c.category_id,
            COUNT(DISTINCT r.rating_id) AS rating_events,
            COALESCE(AVG(r.rating::numeric), 0) AS avg_rating,
            COUNT(DISTINCT rv.review_id) AS review_events,
            NOW() AS snapshot_at
        FROM components c
        LEFT JOIN ratings r ON r.component_mongo_id = c.name
        LEFT JOIN reviews rv ON rv.component_mongo_id = c.name
        GROUP BY c.component_id, c.name, c.category_id`,
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_component_quality_snapshot_component_id ON mv_component_quality_snapshot(component_id)",
];

export async function initializeSqlSchema() {
    for (const statement of DDL) {
        await sqlQuery(statement);
    }
}
