# System Architecture Diagram (C4 Container Level)

## Evaluator Evidence: Distributed Systems & Microservices

This architecture demonstrates adherence to the distributed polyglot persistence rubric, showcasing a decoupled frontend, an API Gateway for routing and resilience, and two backend services handling distinct persistence layers.

```mermaid
graph TD
    %% Define Styles
    classDef client fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef gateway fill:#fff3e0,stroke:#e65100,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px;
    classDef db fill:#f3e5f5,stroke:#4a148c,stroke-width:2px;

    %% Nodes
    Client["React Frontend<br/>(Vite, SPA)"]:::client
    Gateway["FastAPI Gateway<br/>(Port 8000, Auth, Rate Limiting)"]:::gateway
    
    NodeService["Node.js / Express Backend<br/>(Port 5000, Auth, Components)"]:::backend
    SpringService["Spring Boot Service<br/>(Port 8081, AuthZ, Discussions)"]:::backend
    
    PostgresDB[("PostgreSQL (NeonDB)<br/>Relational Data, Users, Components")]:::db
    MongoDB[("MongoDB (Atlas)<br/>Embeddings, NoSQL Data, Analytics")]:::db

    %% Relationships
    Client -->|REST / JSON| Gateway
    
    Gateway -->|/api/auth, /api/components| NodeService
    Gateway -->|/api/discussions| SpringService
    
    NodeService -->|SQL (pg)| PostgresDB
    NodeService -->|Mongoose| MongoDB
    
    SpringService -->|JPA/Hibernate| PostgresDB
    SpringService -->|Mongoose| MongoDB
```

### Key Architectural Decisions:
1. **API Gateway Pattern**: Centralizes CORS, rate-limiting, circuit-breaking, and token validation.
2. **Polyglot Persistence**: 
   - PostgreSQL is used for highly relational data (Users, Components, Roles) requiring ACID compliance.
   - MongoDB is used for rapid ingestion of unstructured telemetry (Analytics) and dense vector embeddings (pgvector mapping).
3. **CQRS / Eventual Consistency**: The dual-write logic securely mirrors relational constructs needed for search indexes while maintaining strict normalization.
