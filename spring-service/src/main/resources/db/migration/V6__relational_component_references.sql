ALTER TABLE components ADD COLUMN IF NOT EXISTS component_public_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_components_public_id
    ON components(component_public_id)
    WHERE component_public_id IS NOT NULL;

ALTER TABLE user_favorites ADD COLUMN IF NOT EXISTS component_id BIGINT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS component_id BIGINT;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS component_id BIGINT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS component_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_favorites_component_fk') THEN
        ALTER TABLE user_favorites
            ADD CONSTRAINT user_favorites_component_fk
            FOREIGN KEY (component_id) REFERENCES components(component_id)
            ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reviews_component_fk') THEN
        ALTER TABLE reviews
            ADD CONSTRAINT reviews_component_fk
            FOREIGN KEY (component_id) REFERENCES components(component_id)
            ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'discussions_component_fk') THEN
        ALTER TABLE discussions
            ADD CONSTRAINT discussions_component_fk
            FOREIGN KEY (component_id) REFERENCES components(component_id)
            ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ratings_component_fk') THEN
        ALTER TABLE ratings
            ADD CONSTRAINT ratings_component_fk
            FOREIGN KEY (component_id) REFERENCES components(component_id)
            ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_user_favorites_component_id ON user_favorites(component_id);
CREATE INDEX IF NOT EXISTS idx_reviews_component_id ON reviews(component_id);
CREATE INDEX IF NOT EXISTS idx_discussions_component_id ON discussions(component_id);
CREATE INDEX IF NOT EXISTS idx_ratings_component_id ON ratings(component_id);
