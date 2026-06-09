-- PART 1: Initial unnormalized schema (for analysis only)
-- Redundancy example: category_name, user_name, and user_email repeated per component row.
-- components_unnormalized(component_id, component_name, description, category_name, user_name, user_email, created_at)
-- Problems: update anomalies, insertion anomalies, deletion anomalies, and inconsistent category/user values.

-- PART 1: Final normalized schema (3NF)
CREATE TABLE IF NOT EXISTS users (
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
);

CREATE TABLE IF NOT EXISTS categories (
    category_id BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS components (
    component_id BIGSERIAL PRIMARY KEY,
    component_public_id TEXT UNIQUE,
    name VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    category_id BIGINT NOT NULL REFERENCES categories(category_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT components_name_non_empty CHECK (length(trim(name)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_components_category_id ON components(category_id);
CREATE INDEX IF NOT EXISTS idx_components_user_id ON components(user_id);
CREATE INDEX IF NOT EXISTS idx_components_name ON components(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_components_public_id
    ON components(component_public_id)
    WHERE component_public_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_favorites (
    favorite_id BIGSERIAL PRIMARY KEY,
    mongo_user_id TEXT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    component_mongo_id TEXT NOT NULL,
    component_id BIGINT REFERENCES components(component_id) ON UPDATE CASCADE ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_favorites_unique UNIQUE (user_id, component_mongo_id)
);

CREATE TABLE IF NOT EXISTS reviews (
    review_id BIGSERIAL PRIMARY KEY,
    mongo_review_id TEXT NOT NULL UNIQUE,
    mongo_user_id TEXT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    component_mongo_id TEXT NOT NULL,
    component_id BIGINT REFERENCES components(component_id) ON UPDATE CASCADE ON DELETE SET NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT NOT NULL DEFAULT '',
    comment TEXT NOT NULL,
    helpful INTEGER NOT NULL DEFAULT 0,
    unhelpful INTEGER NOT NULL DEFAULT 0,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    status VARCHAR(32) NOT NULL DEFAULT 'approved',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussions (
    discussion_id BIGSERIAL PRIMARY KEY,
    mongo_discussion_id TEXT NOT NULL UNIQUE,
    mongo_user_id TEXT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    component_mongo_id TEXT NOT NULL,
    component_id BIGINT REFERENCES components(component_id) ON UPDATE CASCADE ON DELETE SET NULL,
    parent_mongo_id TEXT,
    message TEXT NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratings (
    rating_id BIGSERIAL PRIMARY KEY,
    mongo_rating_id TEXT NOT NULL UNIQUE,
    mongo_user_id TEXT NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON UPDATE CASCADE ON DELETE CASCADE,
    component_mongo_id TEXT NOT NULL,
    component_id BIGINT REFERENCES components(component_id) ON UPDATE CASCADE ON DELETE SET NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_outbox (
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
);

CREATE TABLE IF NOT EXISTS idempotency_keys (
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
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_component ON user_favorites(component_mongo_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_component_id ON user_favorites(component_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_component ON reviews(component_mongo_id);
CREATE INDEX IF NOT EXISTS idx_reviews_component_id ON reviews(component_id);
CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_component ON discussions(component_mongo_id);
CREATE INDEX IF NOT EXISTS idx_discussions_component_id ON discussions(component_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_component ON ratings(component_mongo_id);
CREATE INDEX IF NOT EXISTS idx_ratings_component_id ON ratings(component_id);
CREATE INDEX IF NOT EXISTS idx_outbox_status_created_at ON service_outbox(status, created_at);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS pg_trgm;
EXCEPTION
    WHEN undefined_file THEN
        RAISE NOTICE 'pg_trgm extension is not available in this environment.';
END;
$$;

DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
    WHEN undefined_file THEN
        RAISE NOTICE 'pgvector extension is not available in this environment.';
END;
$$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        EXECUTE 'CREATE TABLE IF NOT EXISTS component_vector_embeddings (
            component_id TEXT PRIMARY KEY,
            component_name TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT '''',
            text TEXT NOT NULL DEFAULT '''',
            model TEXT NOT NULL DEFAULT '''',
            provider TEXT NOT NULL DEFAULT '''',
            embedding_hash TEXT NOT NULL DEFAULT '''',
            embedding vector(128) NOT NULL,
            metadata JSONB NOT NULL DEFAULT ''{}''::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_component_vector_embeddings_category
            ON component_vector_embeddings (lower(category))';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_component_vector_embeddings_embedding_hnsw
            ON component_vector_embeddings USING hnsw (embedding vector_cosine_ops)';
    END IF;
END;
$$;

-- PART 5: Sample data
INSERT INTO users (name, email)
VALUES
('Ava Johnson', 'ava@example.com'),
('Liam Parker', 'liam@example.com')
ON CONFLICT (email) DO NOTHING;

INSERT INTO categories (category_name)
VALUES
('Buttons'),
('Forms')
ON CONFLICT (category_name) DO NOTHING;

INSERT INTO components (name, description, category_id, user_id)
VALUES
(
    'Primary Button',
    'Reusable button with variants and loading state.',
    (SELECT category_id FROM categories WHERE category_name = 'Buttons'),
    (SELECT user_id FROM users WHERE email = 'ava@example.com')
),
(
    'Validated Input',
    'Input field with validation states and helper text.',
    (SELECT category_id FROM categories WHERE category_name = 'Forms'),
    (SELECT user_id FROM users WHERE email = 'liam@example.com')
)
ON CONFLICT DO NOTHING;

-- PART 6: Basic queries
-- 1. Get all components with category name and user name
SELECT c.component_id, c.name, c.description, cat.category_name, u.name AS created_by, c.created_at
FROM components c
JOIN categories cat ON cat.category_id = c.category_id
JOIN users u ON u.user_id = c.user_id
ORDER BY c.created_at DESC;

-- 2. Get components by category
SELECT c.component_id, c.name, c.description
FROM components c
JOIN categories cat ON cat.category_id = c.category_id
WHERE cat.category_name = 'Buttons'
ORDER BY c.name;

-- 3. Get components created by a specific user
SELECT c.component_id, c.name, c.description
FROM components c
JOIN users u ON u.user_id = c.user_id
WHERE u.email = 'ava@example.com'
ORDER BY c.created_at DESC;

-- 4. Search components by name (LIKE)
SELECT component_id, name, description
FROM components
WHERE name ILIKE '%button%'
ORDER BY name;
