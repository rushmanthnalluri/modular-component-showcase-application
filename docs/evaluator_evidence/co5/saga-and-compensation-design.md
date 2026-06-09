# Saga and Compensation Design

## Candidate Saga: Component Publishing
1. Create component in backend domain store.
2. Publish outbox event.
3. Persist/search indexing update.
4. Mirror relational summary update.

## Compensation
- If indexing fails, emit compensation event and mark component as pending-index.
- If SQL mirror fails, retain domain write and enqueue reconciliation action.

## Orchestration vs Choreography
- Current architecture is choreography-oriented through event publication.
- Dedicated orchestrator can be introduced for long-running sagas.
