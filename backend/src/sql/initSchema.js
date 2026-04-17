import { sqlQuery } from "./db.js";

const DDL = [
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
        avatar_url TEXT NOT NULL DEFAULT '',
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
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT ''",
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
];

export async function initializeSqlSchema() {
    for (const statement of DDL) {
        await sqlQuery(statement);
    }
}
