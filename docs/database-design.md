# Database Design

This document explains why the project uses PostgreSQL for structured transactional data and MongoDB for flexible search and telemetry data. It also shows the normalization story in a way that is easy to defend in an academic evaluation.

## 1. Initial Schema With Redundancy

The first prototype shape was intentionally convenient but redundant. A single component record could have carried:

- component name
- category name
- author email and author display name
- review count and average rating
- description text
- embedding payload
- free-form logs or search traces

That design is easy to query at first, but it creates update anomalies:

- changing a category label requires touching many rows
- author profile changes are duplicated across component rows
- review metadata can drift away from the source component
- embedding or log fields bloat the transactional table

## 2. Normalized Schema

The current schema separates concerns into stable entities.

### PostgreSQL entities

- `users`
- `categories`
- `components`
- `ratings`
- `reviews`
- `discussions`
- `favorites` or `user_favorites`
- `component_dependencies`
- `submission_history`
- `service_outbox`
- `idempotency_keys`

### MongoDB collections

- `component_descriptions`
- `component_embeddings`
- `usage_logs`

## 3. Before vs After

| Aspect | Before | After |
|---|---|---|
| Component metadata | One wide record with repeated labels | Separate `components`, `categories`, `users` |
| Reviews and ratings | Embedded or duplicated in component rows | Separate transactional tables with foreign keys |
| Semantic search | Mixed into the same row as operational data | Dedicated `component_embeddings` collection |
| Logs | Stored alongside application entities | Dedicated `usage_logs` collection |
| Update safety | High risk of drift | Controlled by keys, constraints, and indexes |

## 4. 3NF and BCNF Justification

The schema reaches 3NF because non-key attributes depend on the key, the whole key, and nothing but the key.

- `users.email` describes a user, not a component.
- `categories.category_name` describes the category entity, not each component row.
- `reviews.review_text` depends on the review identifier, not on a repeated author field.
- `user_favorites(user_id, component_mongo_id)` is a business-level associative relation, not a nested list.

The design is also defensible as BCNF for the main relational tables because each determinant is a candidate key or a unique business key.

## 5. Why PostgreSQL

PostgreSQL is used for the data that needs consistency and relationships.

- strong transactional guarantees
- foreign keys for integrity
- joins for dashboards and evaluator queries
- unique and check constraints for validation
- ACID behavior for ratings, reviews, favorites, and user accounts

This is the right choice for structured state that should not drift.

## 6. Why MongoDB

MongoDB is used for flexible and semi-structured data.

- component descriptions change more often than relational schema
- embeddings are array-like, dense, and search-oriented
- logs are append-heavy and benefit from schema flexibility
- semantic search results need fast candidate retrieval and metadata filtering

This separation keeps PostgreSQL clean while giving vector and log data a better home.

## 7. Indexing Strategy

### PostgreSQL indexing

- unique index on user email
- unique index on public component identifiers
- indexes on foreign key columns used by reviews, ratings, discussions, and favorites
- sort-supporting indexes for recent components and most viewed components
- any reporting or materialized view index required by the demo scripts

### MongoDB indexing

- vector index on `component_embeddings.embedding`
- filter indexes on `componentId`, `componentName`, and `category`
- log timestamp index for recent activity queries

## 8. Constraints Used

- `PRIMARY KEY` for entity identity
- `UNIQUE` for emails, category names, and public component IDs
- `FOREIGN KEY` for entity relationships
- `NOT NULL` for required fields
- `CHECK` constraints for bounded values such as ratings
- uniqueness on associative pairs such as user-favorite mappings

## 9. Code And Evidence Pointers

- PostgreSQL schema bootstrap: [backend/src/sql/initSchema.js](../backend/src/sql/initSchema.js)
- Mongo search and embeddings: [backend/src/routes/mongoRoutes.js](../backend/src/routes/mongoRoutes.js)
- Vector math and scoring: [backend/src/services/vectorSearchService.js](../backend/src/services/vectorSearchService.js)
- Seed embeddings script: [backend/src/scripts/seedComponentEmbeddings.js](../backend/src/scripts/seedComponentEmbeddings.js)
- Existing proof pack: [docs/database-proof-pack.md](database-proof-pack.md)