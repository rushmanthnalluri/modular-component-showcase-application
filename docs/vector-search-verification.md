# Vector Search Verification

## Status
Code paths, index definitions, hybrid search behavior, and deterministic embedding fallbacks are verified locally; live Atlas UI index creation is still a manual final step.

## Local Execution Evidence
- `npm test --workspace backend` passed after restoring hybrid search compatibility.
- Vector and hybrid search service smoke checks completed successfully in Node.
- The repository contains fallback behavior for environments without Atlas Search or external embedding providers.

## Required Atlas Search Indexes
- `components.default`
- `blogposts.default`
- `component_descriptions.default`
- `discussions.default`
- `reviews.default`

## Required Vector Search Index
- `component_embeddings.vector_index`

## Vector Index JSON
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

## Click-by-Click
1. Open Atlas.
2. Select cluster and database.
3. Open collection.
4. Open `Search`.
5. Create index in JSON editor.
6. Paste config.
7. Save with the required index name.

## Screenshot Placeholders
- `[Placeholder] Atlas Search index creation`
- `[Placeholder] Atlas Vector Search index creation`
- `[Placeholder] Atlas aggregation result with vector score`

## Manual Sign-Off Required
- Confirm each Atlas Search index exists with the exact names listed above.
- Confirm `component_embeddings.vector_index` is green in Atlas and accepts cosine vector queries with 32 dimensions.
- Capture screenshots of the Atlas Search UI, the vector index definition, and one successful aggregation result.
- Use `docs/atlas-live-verification.md` plus `docs/screenshots/atlas/README.md` for the final faculty packet.
