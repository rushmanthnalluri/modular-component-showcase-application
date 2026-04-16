import { sqlQuery } from "./db.js";

const DDL = [
    `CREATE TABLE IF NOT EXISTS users (
        user_id BIGSERIAL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
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
    "CREATE INDEX IF NOT EXISTS idx_components_category_id ON components(category_id)",
    "CREATE INDEX IF NOT EXISTS idx_components_user_id ON components(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_components_name ON components(name)",
];

export async function initializeSqlSchema() {
    for (const statement of DDL) {
        await sqlQuery(statement);
    }
}
