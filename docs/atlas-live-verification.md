# Atlas Live Verification

## Objective

This is the final manual verification pack for MongoDB Atlas Search and Atlas Vector Search. The repository already contains deterministic fallback tests and semantic search code paths; this document closes the faculty-proof gap for the live Atlas UI.

## Required ACTIVE Indexes

Text search indexes:

- `components.default`
- `blogposts.default`
- `component_descriptions.default`
- `discussions.default`
- `reviews.default`

Vector search index:

- `component_embeddings.vector_index`

Expected proof text to show in the UI:

```text
Status: ACTIVE
Queryable: true
Type: Search Index or Vector Search Index
```

## Exact Atlas JSON Configs

### `components.default`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "name": { "type": "string" },
      "description": { "type": "string" },
      "category": { "type": "string" },
      "tags": { "type": "string" }
    }
  }
}
```

### `blogposts.default`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": { "type": "string" },
      "summary": { "type": "string" },
      "content": { "type": "string" },
      "tags": { "type": "string" }
    }
  }
}
```

### `component_descriptions.default`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "componentId": { "type": "string" },
      "componentName": { "type": "string" },
      "category": { "type": "string" },
      "text": { "type": "string" }
    }
  }
}
```

### `discussions.default`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "component_mongo_id": { "type": "string" },
      "message": { "type": "string" },
      "status": { "type": "string" }
    }
  }
}
```

### `reviews.default`

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "component_mongo_id": { "type": "string" },
      "title": { "type": "string" },
      "comment": { "type": "string" },
      "status": { "type": "string" }
    }
  }
}
```

### `component_embeddings.vector_index`

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 32,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "category"
    },
    {
      "type": "filter",
      "path": "componentName"
    },
    {
      "type": "filter",
      "path": "componentId"
    }
  ]
}
```

## Manual UI Checklist

1. Open the target Atlas cluster and select the application database.
2. Open each collection listed above and confirm the `Search` tab shows the required index name.
3. Confirm each text index status is `ACTIVE`.
4. Confirm `component_embeddings.vector_index` is `ACTIVE`.
5. Open the JSON details panel for one text index and the vector index.
6. Run one semantic or hybrid query and capture the scored results.
7. Save screenshots using the exact filenames in `docs/screenshots/atlas/README.md`.

## Screenshot Placeholders

Atlas screenshot filenames are reserved in `docs/screenshots/atlas/README.md`.

## Fallback Proof If Screenshots Are Unavailable

Use all of the following together:

- `backend/src/tests/atlasFallback.test.js`
- `backend/src/tests/vectorSearch.test.js`
- `backend/src/tests/hybridSearch.test.js`
- `docs/vector-search-verification.md`
- `docs/vector-search-ann-design.md`
- `backend/src/routes/vectorRoutes.js`
- `backend/src/models/appModels.js`

This fallback proves deterministic embeddings, semantic route availability, ANN capability documentation, and the exact collection/index targets even if the live UI cannot be captured in the current session.

## Benchmark Notes

| Query | Expected best strategy | What to record |
|---|---|---|
| accessible primary button | hybrid | top result, latency, score spread |
| data table sorting | hybrid or vector | lexical miss vs semantic hit |
| toast error notification | vector | relevance improvement over keyword-only |
| dashboard chart card | hybrid | category filtering plus semantic match |

## Atlas vs pgvector

| Dimension | Atlas Search / Vector Search | pgvector |
|---|---|---|
| Operational scope | Managed inside MongoDB Atlas | Managed inside PostgreSQL |
| Best fit in this repo | Search-oriented Mongo collections and embeddings | Strong fallback or SQL-native vector extension option |
| ANN options to discuss | Managed vector search with Atlas index lifecycle | `hnsw` and `ivfflat` indexes inside Postgres |
| Faculty demo value | Shows polyglot persistence and managed search | Shows SQL-native vector alternative and theory depth |
| Current repo proof | Live checklist plus deterministic fallback tests | Design and comparison documented in vector proof pack |

## What To Show Faculty

- The Atlas index list with all required names in `ACTIVE` state
- The vector index JSON with `numDimensions: 32` and `similarity: cosine`
- One semantic or hybrid query result with scores visible
- The fallback evidence files if live screenshots are not available during the viva
