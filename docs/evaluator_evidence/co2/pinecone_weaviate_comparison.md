# Vector Database Architecture Comparison

## Evaluator Evidence: CO2 Vector Database Implementations

This document fulfills the CO2 requirement to analyze and contrast Pinecone and Weaviate with the chosen `pgvector` architecture.

### 1. Pinecone (Fully Managed Proprietary Vector DB)
- **Architecture**: A closed-source, cloud-native vector database.
- **Strengths**: True zero-ops, automatically scales horizontally.
- **Why it was rejected**: It introduces a severe network hop latency boundary because it sits outside our local VPC/Docker-compose network, contradicting our single-tenant deployment strategy for the academic showcase.

### 2. Weaviate (Open Source AI-Native Vector DB)
- **Architecture**: Specialized NoSQL vector search engine with built-in ML models.
- **Strengths**: Natively supports GraphQL and hybrid search (BM25 + Vector).
- **Why it was rejected**: Adding another specialized database requires standing up a JVM/Go binary and drastically increases the memory footprint of our `docker-compose.yml`.

### 3. pgvector (The Chosen Solution)
- **Architecture**: An extension within our existing PostgreSQL 16 relational database.
- **Implementation in PS-30**: We use `vector(128)` to store our OpenAI embeddings alongside the `Component` metadata.
- **Why it was chosen**: 
  - **ACID Compliance**: We can insert the component metadata and its embedding in a single atomic transaction.
  - **Zero Data Duplication**: No need to sync Postgres IDs to an external Pinecone index.
  - **Indexing**: We implement the `HNSW` (Hierarchical Navigable Small World) index with `vector_cosine_ops` to achieve blazingly fast Approximate Nearest Neighbor (ANN) search inside Postgres.

**Conclusion**: For a strictly decoupled microservice requiring highly relational metadata coupled with embeddings, `pgvector` represents the most performant and operational-friendly path.
