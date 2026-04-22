# Polyglot Consistency Strategy

## Strategy
- Primary writes occur in Mongo-oriented domain operations.
- Mirror critical relational views to PostgreSQL through sync services.
- Run reconciliation checks to detect and surface drift.

## Outbox and Idempotency
- Outbox events are published from backend services.
- Idempotency keys prevent duplicate upsert operations.

## Retry and Reconciliation
- Retry transient failures with bounded attempts.
- Scheduled reconciliation validates user favorites alignment.

## Failure Handling
- If SQL mirror fails, core flow remains available but mismatch is logged.
- Reconciliation endpoint provides operator visibility.
