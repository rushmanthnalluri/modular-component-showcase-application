DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
        EXECUTE 'CREATE EXTENSION IF NOT EXISTS vector';

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
