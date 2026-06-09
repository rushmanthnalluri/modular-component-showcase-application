# Vector Proof Pack

## Evidence Sources

- Routes: `backend/src/routes/vectorRoutes.js`
- Embeddings: `backend/src/services/embeddingProvider.js`
- Similarity and ANN capability notes: `backend/src/services/vectorSearchService.js`
- Hybrid ranking: `backend/src/services/hybridSearchService.js`
- Tests: `backend/src/tests/vectorSearch.test.js`, `backend/src/tests/hybridSearch.test.js`, `backend/src/tests/atlasFallback.test.js`
- Theory references: `docs/vector-search-verification.md`, `docs/vector-search-ann-design.md`, `docs/retrieval-quality-benchmark.md`

## Semantic Retrieval Examples

| Query | Expected relevant hit | Why it matters |
|---|---|---|
| accessible primary button | button or CTA component | semantic intent goes beyond exact keyword order |
| data table sorting | table/grid component | captures feature similarity |
| toast error notification | notification or alert component | lexical overlap may be weak but concept overlap is strong |

## Hybrid Search Scoring Examples

The backend combines scores as:

```text
final_score = alpha * vector_score + (1 - alpha) * lexical_score
```

Examples with `alpha = 0.6`:

| Vector score | Lexical score | Final score |
|---|---|---|
| 0.92 | 0.50 | 0.752 |
| 0.71 | 0.80 | 0.746 |

## Atlas vs pgvector

| Dimension | Atlas Search / Vector Search | pgvector |
|---|---|---|
| Primary storage model | MongoDB collections | PostgreSQL tables |
| Operational overhead | managed indexes in Atlas | extension management in SQL environment |
| ANN discussion | managed vector index | `hnsw` and `ivfflat` |
| Best viva angle | managed polyglot search layer | SQL-native alternative and benchmark contrast |

## ANN/HNSW/IVF Diagram Placeholders

Reserved filenames live in `docs/screenshots/vector/README.md`.

## Consistency Strategy Matrix

| Concern | Strategy in repo |
|---|---|
| Embedding generation unavailable | deterministic fallback embedding provider |
| Atlas live index unavailable | local semantic and hybrid tests plus manifest-based manual verification |
| Cross-store consistency | idempotent upsert plus outbox and reconciliation patterns |
| Query relevance tuning | alpha weighting, metric selection, metadata filters |

## Benchmark Screenshot Placeholders

Reserved filenames live in `docs/screenshots/vector/README.md`.

## What To Show Faculty

- A semantic retrieval example
- One hybrid scoring breakdown
- Atlas vs pgvector tradeoff explanation
- The ANN diagram placeholder filled with your final slide or whiteboard capture
