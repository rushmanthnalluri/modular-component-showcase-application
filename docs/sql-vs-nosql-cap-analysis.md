# SQL vs NoSQL and CAP Analysis

## Decision Summary
This repository uses polyglot persistence deliberately:
- PostgreSQL is the transactional system of record for relational integrity.
- MongoDB Atlas handles flexible documents, search-oriented payloads, logs, descriptions, and embeddings.

## Comparison Matrix
| Dimension | PostgreSQL | MongoDB Atlas | Decision here |
|---|---|---|---|
| Schema rigidity | strong DDL | flexible BSON | SQL for integrity, Mongo for evolving content |
| Joins | native and expressive | aggregation/denormalization | SQL for analytics and proofs |
| Transactions | strong ACID | supported but heavier across documents | SQL owns critical truth |
| Search/vector | extension-based | Atlas Search and Vector Search | Mongo is natural incremental search store |
| Horizontal scale | harder | easier document distribution | Mongo for search/read growth |

## CAP Theorem Interpretation
| Store | Practical CAP posture | Explanation |
|---|---|---|
| PostgreSQL primary write path | CP-leaning | prefers consistency on authoritative writes |
| MongoDB Atlas with majority write concern | stronger consistency, lower availability under faults | tunable depending on read/write concern |
| MongoDB Atlas relaxed reads | more available, eventually consistent | acceptable for search/read models |

## Consistency Model in This Project
### Strong consistency
- user relational identity
- component relational catalog keys
- favorites/reviews/ratings SQL mirrors

### Eventual consistency
- search indexes
- vector index population
- outbox-driven downstream processing
- Mongo-to-SQL reconciliation

## Outbox, Idempotency, Reconciliation
| Pattern | Repository evidence |
|---|---|
| Outbox | `backend/src/services/outboxPublisher.js` |
| Idempotency | `backend/src/services/idempotencyService.js` |
| Reconciliation | `backend/src/services/reconciliationService.js` |

## Viva Talking Point
We did not choose NoSQL instead of SQL. We kept SQL for correctness and academic rigor, and used MongoDB where document shape, search behavior, and embedding workloads are stronger fits.
