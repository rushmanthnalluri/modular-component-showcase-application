# SQL Transactions, ACID, Isolation, and MVCC

## ACID
- Atomicity: a write either commits or rolls back; partial favorite/review/rating sync is not treated as successful.
- Consistency: `CHECK`, `UNIQUE`, and foreign keys protect domain invariants.
- Isolation: transaction tests and documented isolation-level behavior explain concurrent correctness.
- Durability: PostgreSQL WAL ensures committed data survives normal process failure.

## Isolation Levels
- `READ COMMITTED` for most OLTP paths
- `REPEATABLE READ` for stable reporting snapshots
- `SERIALIZABLE` for strongest anomaly prevention where justified

## MVCC
- PostgreSQL stores multiple row versions instead of forcing readers and writers to block each other.
- readers see a transaction snapshot
- writers create new row versions
- vacuum later reclaims obsolete versions

## Anomaly Demonstration Strategy
- Dirty read: prevented in PostgreSQL even at `READ COMMITTED`
- Non-repeatable read: possible at `READ COMMITTED`
- Phantom read: possible below `SERIALIZABLE`

## Example Walkthrough
1. Tx-A reads component ratings count.
2. Tx-B inserts a new rating and commits.
3. Tx-A reads again.
4. At `READ COMMITTED`, Tx-A may see a different value.

## Repository Evidence
- SQL test: `backend/src/tests/sql.transaction-isolation.test.js`
- theory SQL: `sql/advanced_queries.sql`
- rollback-compatible schema bootstrap: `backend/src/sql/initSchema.js`

## Backup and Restore
- See docs/database-backup-guide.md for command-level runbook.
- Monthly restore drills are required in non-production.
