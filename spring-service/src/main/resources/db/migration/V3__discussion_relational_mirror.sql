-- V3__discussion_relational_mirror.sql
-- Adds the SQL mirror for discussion threads owned by the Spring relational layer.

CREATE TABLE IF NOT EXISTS discussions (
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT discussions_message_non_empty CHECK (length(trim(message)) > 0),
    CONSTRAINT discussions_likes_non_negative CHECK (likes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_discussions_user_id ON discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussions_component ON discussions(component_mongo_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent ON discussions(parent_mongo_id);
CREATE INDEX IF NOT EXISTS idx_discussions_status ON discussions(status);
