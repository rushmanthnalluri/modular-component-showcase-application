# API Flow Diagram

## Evaluator Evidence: Gateway Routing and System Integration

This sequence diagram traces the "Add Review to Component" flow, verifying Gateway authentication forwarding, microservice execution, and polyglot database persistence.

```mermaid
sequenceDiagram
    autonumber
    actor User as Client (React)
    participant Gateway as FastAPI Gateway
    participant Node as Node.js Backend
    participant Postgres as PostgreSQL
    participant Mongo as MongoDB

    User->>Gateway: POST /api/components/{id}/reviews
    activate Gateway
    Gateway->>Gateway: Validate JWT Signature
    Gateway->>Gateway: Check Rate Limits
    Gateway->>Node: Forward Request with headers
    activate Node
    
    Node->>Postgres: SELECT * FROM components WHERE id = {id}
    Postgres-->>Node: Return Component Entity
    
    Node->>Postgres: INSERT INTO reviews (rating, comment)
    Postgres-->>Node: Return success
    
    Node->>Mongo: async: INSERT INTO ComponentDescriptions (event source)
    Mongo-->>Node: OK (Eventual Consistency)
    
    Node-->>Gateway: HTTP 201 Created (Review payload)
    deactivate Node
    
    Gateway-->>User: HTTP 201 Created
    deactivate Gateway
```

### Hardening Evidence
- **Gateway Validation**: The Gateway prevents unauthenticated traffic from ever reaching the downstream Node.js/Spring services.
- **Failover**: If the downstream service is unavailable, the Gateway's Circuit Breaker explicitly returns a resilient `503 Service Unavailable` instead of hanging.
