# Query Plan Analysis

## Workflow
1. Capture baseline query with EXPLAIN (ANALYZE, BUFFERS).
2. Record total cost, actual time, and row estimates.
3. Apply index or query refactor.
4. Re-run and compare p50/p95 latency.

## Key Queries
- Ratings aggregation by component.
- Discussions timeline by component.
- Reviews leaderboard by user.

## Reference SQL
- sql/query_optimization_examples.sql

## Example Reading Guide
When reading `EXPLAIN ANALYZE` focus on:
- `actual time`
- `rows`
- whether the planner used `Seq Scan`, `Index Scan`, or `Bitmap Heap Scan`
- buffer hits vs reads

## Example Interpretation
### Ratings aggregation
- before index: sequential scan on `ratings`
- after index: index-assisted scan on `component_mongo_id`
- expected win: lower latency for hot component detail pages

### Discussion timeline
- descending index on `(component_mongo_id, created_at DESC)` supports sorted recent-first retrieval

### User leaderboard
- aggregation still requires grouping, but an index on `(user_id, created_at DESC)` reduces supporting lookup cost

## Acceptance Criteria
- reduced total execution time
- lower shared buffer reads for hot endpoints
- stable plans across representative parameter sets
