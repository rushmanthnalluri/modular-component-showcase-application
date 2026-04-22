# Database Proof Pack

## Evidence Sources

- Schema and fixtures: `backend/sql/postgres_schema.sql`, `backend/src/sql/initSchema.js`
- Advanced SQL examples: `backend/sql/advanced_queries.sql`, `backend/sql/procedures_and_functions.sql`, `backend/sql/views_and_triggers.sql`, `backend/sql/materialized_views.sql`
- Existing theory docs: `docs/query-plan-analysis.md`, `docs/sql-transactions-acid-isolation-mvcc.md`, `docs/sql-advanced-patterns.md`
- Test evidence: `backend/src/tests/sql.migration-compatibility.test.js`, `backend/src/tests/sql.performance.test.js`, `backend/src/tests/sql.transaction-isolation.test.js`, `backend/src/tests/sqlFallback.test.js`

## SQL Test Fixture Documentation

The SQL verification set is intentionally split into two layers:

- Live DB tests: run when `DATABASE_URL` or `PG*` variables are configured
- Fallback evidence tests: assert the DDL, indexes, materialized views, and migration-critical tables still exist even when the local shell has no SQL connection

Core fixture objects checked by code:

- `users`
- `categories`
- `components`
- `user_favorites`
- `reviews`
- `discussions`
- `ratings`
- `service_outbox`
- `idempotency_keys`
- `mv_component_quality_snapshot`

## Fallback Proof For Skipped SQL Tests

If the live SQL tests are skipped because no database is configured, use this chain of proof:

1. `backend/src/tests/sqlFallback.test.js` proves the application degrades cleanly when SQL configuration is absent.
2. The same fallback test asserts required tables, indexes, and materialized views remain in the DDL inventory.
3. `backend/src/sql/initSchema.js` and `backend/sql/postgres_schema.sql` remain the authoritative schema references.
4. `docs/query-plan-analysis.md` and this proof pack document the exact live steps to repeat once PostgreSQL is available.

## EXPLAIN ANALYZE Screenshot Placeholders

Reserved filenames live in `docs/screenshots/database/README.md`.

## Transaction Anomaly Examples

| Anomaly | PostgreSQL expectation | Demo note |
|---|---|---|
| Dirty read | blocked by MVCC; not allowed | explain that PostgreSQL never exposes uncommitted data to readers |
| Non-repeatable read | possible in `READ COMMITTED` | re-run a `SELECT` after a concurrent commit |
| Phantom read | possible in `READ COMMITTED`, prevented in stronger isolation | compare count queries before and after concurrent insert |
| Write skew | discuss under snapshot-style isolation | useful viva example for invariant checks |

## Deadlock Example

Two-session classroom demo:

```sql
-- session A
BEGIN;
UPDATE users SET full_name = 'A' WHERE user_id = 1;

-- session B
BEGIN;
UPDATE users SET full_name = 'B' WHERE user_id = 2;

-- session A
UPDATE users SET full_name = 'A2' WHERE user_id = 2;

-- session B
UPDATE users SET full_name = 'B2' WHERE user_id = 1;
```

Expected result: PostgreSQL aborts one transaction with a deadlock error. Capture the error and `pg_locks` output for viva evidence.

## Lock Escalation Notes

PostgreSQL does not implement SQL Server-style lock escalation from many row locks into page or table locks. The correct viva answer is:

- PostgreSQL primarily relies on MVCC row versions plus relation-level coordination locks.
- For proof, inspect `pg_locks` during concurrent transactions.
- DDL and maintenance commands can still take heavier locks, so the demo should distinguish OLTP row updates from schema operations.

## Index Usage Benchmark Placeholders

Reserved filenames live in `docs/screenshots/database/README.md`.

## What To Show Faculty

- A live `EXPLAIN (ANALYZE, BUFFERS)` capture
- One deadlock or blocking example with `pg_locks`
- The fallback DDL evidence if the database is unavailable during assessment
