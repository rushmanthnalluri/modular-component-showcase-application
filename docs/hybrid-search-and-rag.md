# Hybrid Search and RAG

## Hybrid Search Logic
Hybrid retrieval combines:
- lexical score for exact token match confidence
- vector score for semantic similarity
- alpha weighting for final rank

Repository evidence:
- [backend/src/services/hybridSearchService.js](../backend/src/services/hybridSearchService.js)
- [backend/src/routes/vectorRoutes.js](../backend/src/routes/vectorRoutes.js)

## Query Examples
```http
POST /api/vector/search/semantic
{
  "query": "accessible primary action button",
  "metric": "cosine",
  "limit": 5,
  "category": "buttons"
}
```

```http
POST /api/vector/search/hybrid
{
  "query": "dashboard data table with sorting",
  "metric": "cosine",
  "alpha": 0.65,
  "limit": 10,
  "tags": ["data"]
}
```

## RAG-Ready Flow
1. accept user query
2. retrieve top-k hybrid results
3. convert component metadata and descriptions to grounding context
4. pass only retrieved evidence into a generation step
5. require citation of component ids in the response

## Evaluation
- Precision@k
- Recall@k
- MRR
- nDCG
- p50/p95 latency

## Screenshot Placeholders
- `[Placeholder] lexical vs vector vs hybrid ranking comparison`
- `[Placeholder] Atlas $vectorSearch aggregation result`
