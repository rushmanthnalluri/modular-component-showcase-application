# Retrieval Quality Benchmark

## Offline Set
- Build query-answer relevance pairs for component discovery use-cases.
- Label high, medium, low relevance.

## Metrics
- Precision@5
- Recall@10
- MRR
- nDCG
- p95 response time

## Baseline Procedure
1. Run lexical-only baseline.
2. Run vector-only baseline.
3. Run hybrid baseline.
4. Compare quality and latency tradeoffs.

## Reporting Template
- Query category
- Best strategy
- Quality score
- p95 latency
- Notes and regressions

## Suggested Query Set
- “accessible primary button”
- “data table with sorting”
- “toast notification for errors”
- “dashboard chart card”
- “floating label input”

## Screenshot Placeholders
- `[Placeholder] benchmark spreadsheet or notebook summary`
- `[Placeholder] hybrid search outperforming lexical baseline`
