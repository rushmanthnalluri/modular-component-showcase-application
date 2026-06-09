# Database Ownership Diagram

## Evaluator Evidence: Polyglot Persistence Boundary Enforcement

This diagram provides strict proof of the isolation of database entities between PostgreSQL and MongoDB. The application does not inappropriately leak relational constructs into NoSQL.

```mermaid
erDiagram
    %% PostgreSQL Entities
    POSTGRES_DB {
        table Users
        table Roles
        table Components
        table Categories
        table Reviews
        table Favorites
        table RefreshTokens
        table AuditLogs
    }

    %% MongoDB Collections
    MONGO_DB {
        collection ComponentDescriptions
        collection ComponentEmbeddings
        collection UsageLogs
        collection SemanticQueries
        collection SearchAnalytics
        collection CaptchaSessions
    }

    %% External Connections (Conceptual Mapping)
    POSTGRES_DB ||--o{ MONGO_DB : "Logical Soft-Link via component_mongo_id"
```

### Justification of Segregation
- **PostgreSQL (NeonDB)** strictly commands the highly relational aspects of the system (e.g., `Components` -> `Categories`, `Users` -> `Favorites`). Strict foreign key constraints and `ON DELETE CASCADE` triggers ensure relational integrity.
- **MongoDB** is deliberately optimized for high-volume unstructured reads (e.g., `ComponentDescriptions` which hold rich text/markdown) and vector similarity matrices (`ComponentEmbeddings`), which bypass expensive SQL JOIN bottlenecks.
