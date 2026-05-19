# Vector Search ANN Implementation

## Implemented ANN Path

The production path uses PostgreSQL `pgvector` with an HNSW index, not a simulated ANN layer.

Table:

```sql
CREATE TABLE IF NOT EXISTS component_vector_embeddings (
    component_id TEXT PRIMARY KEY,
    component_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    text TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT '',
    provider TEXT NOT NULL DEFAULT '',
    embedding_hash TEXT NOT NULL DEFAULT '',
    embedding vector(128) NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Index:

```sql
CREATE INDEX IF NOT EXISTS idx_component_vector_embeddings_embedding_hnsw
ON component_vector_embeddings
USING hnsw (embedding vector_cosine_ops);
```

The schema is installed by:

- `backend/src/sql/initSchema.js`
- `backend/sql/postgres_schema.sql`
- `spring-service/src/main/resources/db/migration/V5__component_vector_embeddings.sql`

## Runtime Query

The service uses pgvector operators:

- cosine: `embedding <=> query_vector`
- dot product: `embedding <#> query_vector`
- Euclidean: `embedding <-> query_vector`

Implementation file:

- `backend/src/services/pgVectorSearchService.js`

## Fallback

If SQL or `pgvector` is unavailable, the system uses MongoDB embeddings and exact in-process scoring. This is intentional for local development and CI environments that do not provide the extension.

Fallback is clearly labeled in API responses as:

```json
{
  "engine": "mongo-linear-fallback",
  "indexed": false
}
```

## Configuration

```bash
PGVECTOR_ENABLED=true
PGVECTOR_DIMENSIONS=128
OPENAI_API_KEY=
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

The Docker stack uses `pgvector/pgvector:pg16`, so local Compose can create the extension and HNSW index.

## Verification

Run:

```bash
npm test --workspace backend
```

Relevant test:

- `backend/src/tests/pgVectorSearch.test.js`

The test suite verifies vector literal formatting, schema/index creation SQL, and nearest-neighbor ordering through the pgvector service.
