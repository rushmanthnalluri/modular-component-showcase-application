# Vector Search and ANN Design

## Repository Evidence
| Capability | Code evidence |
|---|---|
| Embedding provider | [backend/src/services/embeddingProvider.js](../backend/src/services/embeddingProvider.js) |
| Similarity metrics | [backend/src/services/vectorSearchService.js](../backend/src/services/vectorSearchService.js) |
| Hybrid retrieval | [backend/src/services/hybridSearchService.js](../backend/src/services/hybridSearchService.js) |
| HTTP interface | [backend/src/routes/vectorRoutes.js](../backend/src/routes/vectorRoutes.js) |

## Current Implementation
- deterministic fallback for local and CI repeatability
- optional OpenAI embeddings
- cosine, dot-product, and euclidean similarity
- hybrid lexical + vector scoring
- metadata-aware filtering

## ANN Theory
### HNSW
Hierarchical Navigable Small World graphs provide high-recall, low-latency approximate nearest neighbor retrieval after index build.

### IVF / IVFFlat
Centroid clustering reduces the number of vectors scanned by searching only the most relevant partitions.

## Similarity Metrics
| Metric | Use case |
|---|---|
| cosine | normalized text embeddings |
| dot-product | magnitude-aware embeddings |
| euclidean | geometric distance |

## pgvector Option
```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE component_embedding_pgvector (
  component_id text PRIMARY KEY,
  component_name text NOT NULL,
  category text NOT NULL,
  embedding vector(32) NOT NULL
);
CREATE INDEX idx_component_embedding_hnsw
ON component_embedding_pgvector
USING hnsw (embedding vector_cosine_ops);
```

## Atlas Vector Search Option
Target index:
- `component_embeddings.vector_index`

Required configuration:
- path `embedding`
- `numDimensions: 32`
- `similarity: cosine`
- filters: `category`, `componentName`, `componentId`

See [vector-search-verification.md](./vector-search-verification.md).

## Screenshot Placeholders
- `[Placeholder] Atlas Vector Search index builder`
- `[Placeholder] Hybrid search diagnostics payload`
