# SQL Advanced Patterns

## Implemented Assets
- Recursive CTE examples: backend/sql/advanced_queries.sql
- Window function ranking: backend/sql/advanced_queries.sql
- Views and triggers: backend/sql/views_and_triggers.sql
- Procedures/functions: backend/sql/procedures_and_functions.sql
- Materialized views: backend/sql/materialized_views.sql

## Query Usage Guidelines
- Use recursive CTE only for bounded hierarchies.
- Use window functions for reporting and leaderboards.
- Refresh materialized views in off-peak windows.

## Operational Notes
- Ensure indexes exist before introducing analytic queries into APIs.
- Use EXPLAIN ANALYZE before and after index creation.
