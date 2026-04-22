-- V1__baseline_schema.sql
-- Baseline migration: create all tables that the existing data.sql relies on.
-- This is safe to re-run with IF NOT EXISTS guards.

CREATE TABLE IF NOT EXISTS users (
    user_id    BIGSERIAL PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    full_name  VARCHAR(120) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    phone      VARCHAR(20)  DEFAULT '',
    role       VARCHAR(50)  NOT NULL DEFAULT 'user'
        CHECK (role IN ('user','developer','admin')),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    category_id   BIGSERIAL PRIMARY KEY,
    category_name VARCHAR(120) NOT NULL UNIQUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS components (
    component_id BIGSERIAL PRIMARY KEY,
    name         VARCHAR(255) NOT NULL,
    description  TEXT         NOT NULL DEFAULT '',
    category_id  BIGINT       REFERENCES categories(category_id) ON DELETE SET NULL,
    user_id      BIGINT       REFERENCES users(user_id)          ON DELETE SET NULL,
    average_rating NUMERIC(3,2) DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
    ratings_count  INTEGER     DEFAULT 0,
    is_published   BOOLEAN     DEFAULT TRUE,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_component_name_category UNIQUE (name, category_id)
);

CREATE TABLE IF NOT EXISTS ratings (
    rating_id    BIGSERIAL PRIMARY KEY,
    component_id BIGINT REFERENCES components(component_id) ON DELETE CASCADE NOT NULL,
    user_id      BIGINT REFERENCES users(user_id)           ON DELETE CASCADE NOT NULL,
    rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_component_rating UNIQUE (user_id, component_id)
);

CREATE TABLE IF NOT EXISTS reviews (
    review_id    BIGSERIAL PRIMARY KEY,
    component_id BIGINT REFERENCES components(component_id) ON DELETE CASCADE NOT NULL,
    user_id      BIGINT REFERENCES users(user_id)           ON DELETE CASCADE NOT NULL,
    rating       SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT     NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites (
    favorite_id  BIGSERIAL PRIMARY KEY,
    user_id      BIGINT REFERENCES users(user_id)           ON DELETE CASCADE NOT NULL,
    component_id BIGINT REFERENCES components(component_id) ON DELETE CASCADE NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_user_component_favorite UNIQUE (user_id, component_id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id);
CREATE INDEX IF NOT EXISTS idx_components_user     ON components(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_component   ON ratings(component_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user        ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_component   ON reviews(component_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user      ON favorites(user_id);
