# ER Model and Cardinality

## Purpose
This file is the conceptual schema proof for CO1. It maps the showcase domain to the implemented relational structures in [backend/sql/postgres_schema.sql](../backend/sql/postgres_schema.sql) and the runtime schema bootstrap in [backend/src/sql/initSchema.js](../backend/src/sql/initSchema.js).

## Three-Schema Model
| Schema level | Repository evidence | Meaning |
|---|---|---|
| External schema | `contracts/openapi-*.yaml` | Client-visible contracts |
| Conceptual schema | this ER model, service DTOs, architecture docs | business entities and relationships |
| Internal schema | `backend/sql/*.sql`, indexes, triggers, materialized views | physical storage and optimization |

## ER Diagram
```text
User (1) ----< (N) Component >---- (1) Category
  |                    |
  |                    +----< (N) Review >---- (1) User
  |                    +----< (N) Rating >---- (1) User
  |                    +----< (N) Discussion >---- (1) User
  |
  +----< (N) UserFavorite >---- (N) Component
```

## Core Entities
| Entity | Key attributes | Physical table/collection |
|---|---|---|
| User | identity, role, profile, preferences | `users`, Mongo `User` |
| Category | category name | `categories` |
| Component | name, description, category, author | `components`, Mongo `Component` |
| Review | rating, title, comment, feedback counters | `reviews`, Mongo `Review` |
| Rating | numeric score | `ratings`, Mongo `Rating` |
| Discussion | threaded message | `discussions`, Mongo `Discussion` |
| Favorite | user-component bridge | `user_favorites`, Mongo favorites array |

## Cardinality Mapping
| Relationship | Cardinality | Implementation evidence |
|---|---|---|
| User to Component | `1:N` | `components.user_id -> users.user_id` |
| Category to Component | `1:N` | `components.category_id -> categories.category_id` |
| User to Review | `1:N` | `reviews.user_id -> users.user_id` |
| User to Rating | `1:N` | `ratings.user_id -> users.user_id` |
| Component to Review | `1:N` | relational mirror keyed by `component_mongo_id` |
| Component to Discussion | `1:N` | relational mirror keyed by `component_mongo_id` |
| User to Favorite to Component | `M:N` | resolved by `user_favorites` associative entity |

## ER-to-Relational Mapping Proof
1. Strong entities become base tables: `users`, `categories`, `components`.
2. Relationship-heavy entities become dependent tables: `reviews`, `ratings`, `discussions`.
3. `M:N` between users and components is decomposed into `user_favorites`.
4. Optional hierarchy in discussions is expressed by `parent_mongo_id`.
5. Cardinality is enforced with foreign keys, unique keys, and check constraints.

## Referential Integrity Evidence
- `components.category_id` and `components.user_id` are foreign keys.
- `user_favorites` prevents duplicates using `UNIQUE(user_id, component_mongo_id)`.
- `reviews.rating` and `ratings.rating` are bounded by `CHECK (rating BETWEEN 1 AND 5)`.

## Data Independence
- External clients do not need to change when new indexes or materialized views are added.
- Conceptual entities remain stable while physical plans change.
- This is visible in the split between contracts, DTOs, and SQL optimization files.

## See Also
- [relational-mapping-and-normalization-proof.md](./relational-mapping-and-normalization-proof.md)
- [sql-transactions-acid-isolation-mvcc.md](./sql-transactions-acid-isolation-mvcc.md)
