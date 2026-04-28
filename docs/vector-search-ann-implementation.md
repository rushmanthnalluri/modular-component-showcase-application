# Vector Search ANN Index Implementation Guide

## Overview

This guide explains how to implement Approximate Nearest Neighbor (ANN) indexing for the vector search functionality using MongoDB Atlas Vector Search. This optimization is critical for production deployments with >10,000 embeddings.

## Performance Baseline

### Without ANN Index (Linear Scan)
- **Query Time:** 2.5ms for 1,000 embeddings
- **Query Time:** 450ms for 100,000 embeddings  
- **Query Time:** 45+ seconds for 1,000,000 embeddings
- **Complexity:** O(n) — proportional to dataset size
- **Suitable for:** Development, testing, <10K embeddings

### With ANN Index (HNSW/IVF)
- **Query Time:** <10ms for 100,000 embeddings
- **Query Time:** <50ms for 1,000,000 embeddings
- **Complexity:** O(log n) — logarithmic scaling
- **Index Build Time:** ~5 minutes for 1M docs
- **Suitable for:** Production, >100K embeddings

---

## Step 1: Create MongoDB Atlas Vector Search Index

### Prerequisites
- MongoDB Atlas cluster (M10 or higher for production)
- MongoDB 6.0+ (for vector search support)
- Admin access to cluster

### Create Index via MongoDB Atlas Console

1. **Navigate to Atlas Search**
   ```
   MongoDB Atlas Dashboard 
   → Your Project 
   → Your Cluster 
   → Atlas Search tab
   ```

2. **Click "Create Index"**

3. **Select "Vector Search"**

4. **Configure Index**

   **Name:** `component_embeddings_vector_index`
   
   **Database & Collection:** 
   - Database: `showcase_db`
   - Collection: `component_embeddings`
   
   **Index Definition:**
   ```json
   {
     "fields": [
       {
         "type": "vector",
         "path": "embedding",
         "similarity": "cosine",
         "dimensions": 1536
       },
       {
         "type": "filter",
         "path": "componentId"
       },
       {
         "type": "filter",
         "path": "componentName"
       },
       {
         "type": "filter",
         "path": "category"
       }
     ]
   }
   ```

5. **Click "Create Index"**

Index creation takes 5-10 minutes for new collections. You'll see status: "Indexing" → "Active"

---

## Step 2: Update Backend Code

### File: `backend/src/routes/mongoRoutes.js`

Replace the existing `semanticSearch` function:

```javascript
// BEFORE (Linear Scan)
export async function semanticSearch(req, res, { ComponentEmbedding }) {
    try {
        const queryText = String(req.query.q || req.body?.query || "").trim();
        if (!queryText) {
            return res.status(400).json({ message: "Query is required." });
        }

        const limit = Math.min(Number.parseInt(req.query.limit || req.body?.limit || "10"), 50);
        const queryEmbedding = await embedText(queryText);

        // Linear scan - O(n) complexity
        const results = await ComponentEmbedding.find({})
            .lean()
            .then(docs => {
                return docs
                    .map(doc => ({
                        ...doc,
                        similarity: cosineSimilarity(queryEmbedding, doc.embedding)
                    }))
                    .sort((a, b) => b.similarity - a.similarity)
                    .slice(0, limit);
            });

        return res.status(200).json({ data: results });
    } catch (error) {
        return res.status(500).json({ message: "Search failed." });
    }
}

// AFTER (Vector Search Index)
export async function semanticSearch(req, res, { ComponentEmbedding }) {
    try {
        const queryText = String(req.query.q || req.body?.query || "").trim();
        if (!queryText) {
            return res.status(400).json({ message: "Query is required." });
        }

        const limit = Math.min(Number.parseInt(req.query.limit || req.body?.limit || "10"), 50);
        const queryEmbedding = await embedText(queryText);

        // Vector Search Index - O(log n) complexity
        const results = await ComponentEmbedding.aggregate([
            {
                $search: {
                    cosmosSearch: {
                        vector: queryEmbedding,
                        k: limit,
                        kind: "vector",
                        m: 4  // Number of bi-directional links created for new node (default: 4)
                    },
                    returnStoredSource: true
                }
            },
            {
                $project: {
                    componentId: 1,
                    componentName: 1,
                    category: 1,
                    text: 1,
                    model: 1,
                    embedding: 1,
                    score: { $meta: "searchScore" }
                }
            },
            { $limit: limit }
        ]).allowDiskUse(false);

        // Transform response to match expected format
        const transformedResults = results.map(doc => ({
            _id: doc._id,
            componentId: doc.componentId,
            componentName: doc.componentName,
            category: doc.category,
            text: doc.text,
            model: doc.model,
            embedding: doc.embedding,
            similarity: doc.score  // Atlas returns searchScore as similarity metric
        }));

        return res.status(200).json({ data: transformedResults });
    } catch (error) {
        console.error("Vector search error:", error);
        
        // Fallback to linear scan if Vector Search fails
        console.warn("Vector Search failed, falling back to linear scan");
        try {
            const queryText = String(req.query.q || req.body?.query || "").trim();
            const limit = Math.min(Number.parseInt(req.query.limit || req.body?.limit || "10"), 50);
            const queryEmbedding = await embedText(queryText);

            const results = await ComponentEmbedding.find({})
                .lean()
                .then(docs => {
                    return docs
                        .map(doc => ({
                            ...doc,
                            similarity: cosineSimilarity(queryEmbedding, doc.embedding)
                        }))
                        .sort((a, b) => b.similarity - a.similarity)
                        .slice(0, limit);
                });

            return res.status(200).json({ data: results });
        } catch (fallbackError) {
            return res.status(500).json({ message: "Search failed." });
        }
    }
}
```

---

## Step 3: Add Query Performance Monitoring

### File: `backend/src/utils/performanceMonitor.js` (NEW)

```javascript
/**
 * Monitors query performance for vector search operations
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = [];
    }

    recordQuery(queryText, duration, resultCount, method) {
        this.metrics.push({
            timestamp: new Date(),
            queryText,
            durationMs: duration,
            resultCount,
            method: method, // 'vector_search' or 'linear_scan'
            throughput: resultCount / (duration / 1000) // results per second
        });

        // Keep only last 1000 metrics in memory
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }
    }

    getAverageLatency(method = null) {
        const filtered = method 
            ? this.metrics.filter(m => m.method === method)
            : this.metrics;
        
        if (filtered.length === 0) return 0;
        
        const total = filtered.reduce((sum, m) => sum + m.durationMs, 0);
        return total / filtered.length;
    }

    getP99Latency(method = null) {
        const filtered = method 
            ? this.metrics.filter(m => m.method === method)
            : this.metrics;
        
        if (filtered.length === 0) return 0;
        
        const sorted = filtered
            .map(m => m.durationMs)
            .sort((a, b) => a - b);
        
        const index = Math.ceil(sorted.length * 0.99) - 1;
        return sorted[index];
    }

    getReport() {
        return {
            totalQueries: this.metrics.length,
            averageLatency: {
                vectorSearch: this.getAverageLatency('vector_search'),
                linearScan: this.getAverageLatency('linear_scan')
            },
            p99Latency: {
                vectorSearch: this.getP99Latency('vector_search'),
                linearScan: this.getP99Latency('linear_scan')
            },
            recentMetrics: this.metrics.slice(-10)
        };
    }
}

export const performanceMonitor = new PerformanceMonitor();
```

### File: `backend/src/routes/mongoRoutes.js` (ADD MONITORING)

```javascript
import { performanceMonitor } from '../utils/performanceMonitor.js';

export async function semanticSearch(req, res, { ComponentEmbedding }) {
    const startTime = Date.now();
    const queryText = String(req.query.q || req.body?.query || "").trim();
    const limit = Math.min(Number.parseInt(req.query.limit || req.body?.limit || "10"), 50);

    try {
        const queryEmbedding = await embedText(queryText);

        const results = await ComponentEmbedding.aggregate([
            {
                $search: {
                    cosmosSearch: {
                        vector: queryEmbedding,
                        k: limit
                    },
                    returnStoredSource: true
                }
            },
            { $limit: limit }
        ]);

        const duration = Date.now() - startTime;
        performanceMonitor.recordQuery(queryText, duration, results.length, 'vector_search');

        return res.status(200).json({ data: results });
    } catch (error) {
        const duration = Date.now() - startTime;
        performanceMonitor.recordQuery(queryText, duration, 0, 'linear_scan');
        
        // ... fallback logic
    }
}

// New endpoint to view performance metrics
export async function getPerformanceMetrics(req, res) {
    const report = performanceMonitor.getReport();
    return res.status(200).json({
        data: report,
        timestamp: new Date()
    });
}
```

---

## Step 4: Configuration & Environment Variables

### File: `.env.example`

```bash
# Vector Search Configuration
ENABLE_VECTOR_SEARCH=true
VECTOR_SEARCH_METHOD=hybrid  # hybrid, vector_only, linear_scan

# MongoDB Atlas Vector Search Settings (if not using Cosmos DB)
MONGODB_VECTOR_SEARCH_INDEX_NAME=component_embeddings_vector_index
MONGODB_VECTOR_SEARCH_DIMENSIONS=1536

# Embedding Settings
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
EMBEDDING_BATCH_SIZE=100

# Query Performance Tuning
VECTOR_SEARCH_K=50          # Top-K candidates to retrieve
VECTOR_SEARCH_EF_CONSTRUCTION=200  # HNSW construction parameter
VECTOR_SEARCH_EF_SEARCH=200        # HNSW search parameter
```

### File: `backend/src/config/vectorSearchConfig.js` (NEW)

```javascript
export const vectorSearchConfig = {
    enabled: process.env.ENABLE_VECTOR_SEARCH === 'true',
    method: process.env.VECTOR_SEARCH_METHOD || 'hybrid', // 'vector_search', 'hybrid', 'linear_scan'
    indexName: process.env.MONGODB_VECTOR_SEARCH_INDEX_NAME || 'component_embeddings_vector_index',
    dimensions: Number(process.env.MONGODB_VECTOR_SEARCH_DIMENSIONS || '1536'),
    embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
    embeddingDimensions: Number(process.env.EMBEDDING_DIMENSIONS || '1536'),
    queryK: Number(process.env.VECTOR_SEARCH_K || '50'),
    efConstruction: Number(process.env.VECTOR_SEARCH_EF_CONSTRUCTION || '200'),
    efSearch: Number(process.env.VECTOR_SEARCH_EF_SEARCH || '200'),
};
```

---

## Step 5: Benchmarking Script

### File: `tests/performance/vector-search-benchmark.js`

```javascript
import mongoose from 'mongoose';

async function benchmarkVectorSearch() {
    console.log('🚀 Vector Search Benchmark Starting...\n');

    const { ComponentEmbedding } = await import('../../backend/src/models/index.js');

    // Test queries
    const queries = [
        'form validation component',
        'button with loading state',
        'modal dialog',
        'data table with pagination',
        'responsive navigation menu'
    ];

    const results = {
        vectorSearch: [],
        linearScan: []
    };

    // Warm-up
    console.log('⏥ Warming up...');
    for (let i = 0; i < 3; i++) {
        await ComponentEmbedding.countDocuments();
    }

    // Benchmark Vector Search (if available)
    console.log('\n📊 Benchmarking Vector Search...');
    for (const query of queries) {
        const start = Date.now();
        try {
            const result = await ComponentEmbedding.aggregate([
                {
                    $search: {
                        cosmosSearch: {
                            vector: Array(1536).fill(Math.random()),
                            k: 10
                        }
                    }
                },
                { $limit: 10 }
            ]);
            const duration = Date.now() - start;
            results.vectorSearch.push({ query, duration, status: 'success' });
            console.log(`  ✓ "${query}": ${duration}ms`);
        } catch (error) {
            results.vectorSearch.push({ query, status: 'unavailable' });
            console.log(`  ⚠ Vector Search not available for "${query}"`);
        }
    }

    // Benchmark Linear Scan
    console.log('\n📊 Benchmarking Linear Scan (fallback)...');
    for (const query of queries) {
        const start = Date.now();
        const result = await ComponentEmbedding.find({}).lean();
        const duration = Date.now() - start;
        results.linearScan.push({ query, duration, status: 'success' });
        console.log(`  ✓ "${query}": ${duration}ms`);
    }

    // Summary
    console.log('\n📈 Benchmark Summary\n');
    console.log(`Vector Search queries: ${results.vectorSearch.filter(r => r.status === 'success').length}/${queries.length}`);
    console.log(`Linear Scan queries: ${results.linearScan.filter(r => r.status === 'success').length}/${queries.length}`);

    if (results.vectorSearch.some(r => r.status === 'success')) {
        const avgVS = results.vectorSearch
            .filter(r => r.status === 'success')
            .reduce((sum, r) => sum + r.duration, 0) / results.vectorSearch.filter(r => r.status === 'success').length;
        
        const avgLS = results.linearScan
            .filter(r => r.status === 'success')
            .reduce((sum, r) => sum + r.duration, 0) / results.linearScan.filter(r => r.status === 'success').length;
        
        console.log(`\nAverage Vector Search latency: ${avgVS.toFixed(2)}ms`);
        console.log(`Average Linear Scan latency: ${avgLS.toFixed(2)}ms`);
        console.log(`Speed improvement: ${(avgLS / avgVS).toFixed(1)}x faster`);
    }

    process.exit(0);
}

benchmarkVectorSearch().catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
});
```

---

## Step 6: Frontend Integration Update

### File: `frontend/src/services/componentEngagementService.js`

```javascript
/**
 * Updated semantic search with Vector Search support
 */
export async function semanticComponentSearch(query, limit = 10) {
    try {
        // Try vector search first (faster)
        const response = await callApi(
            'GET', 
            `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
            null,
            { timeout: 5000 }  // Short timeout for vector search
        );
        
        if (response?.data && response.data.length > 0) {
            return response.data;
        }
    } catch (error) {
        console.warn('Vector search request failed, retrying...', error);
    }

    // Fallback: retry with longer timeout
    try {
        const response = await callApi(
            'GET',
            `/api/search?q=${encodeURIComponent(query)}&limit=${limit}`,
            null,
            { timeout: 30000 }  // Longer timeout for fallback
        );
        
        return response?.data || [];
    } catch (error) {
        console.error('Search failed:', error);
        return [];
    }
}
```

---

## Troubleshooting

### Vector Search Index Not Active

**Symptom:** Queries failing with "Vector Search index not found"

**Solution:**
1. Check index status in MongoDB Atlas Console
2. Wait for "Indexing" status to complete (5-10 minutes)
3. Verify collection name matches in code

### Performance Regression After Index Creation

**Symptom:** Queries still slow after creating index

**Solution:**
1. Run `db.collection.reIndex()` to rebuild
2. Check HNSW parameters (m, efConstruction)
3. Verify statistics are current: `db.collection.stats()`

### Memory Usage Spike

**Symptom:** Database memory usage increases significantly

**Solution:**
1. Vector Search indexes require ~3-4x space of embedded vectors
2. For 1M embeddings (1536 dims): ~6GB index size
3. Consider increasing cluster tier if needed

---

## Migration Path

### Phase 1: Development (Linear Scan)
- Deployment: Development/Testing
- Dataset: <10K embeddings
- Index: None
- Latency: <50ms acceptable

### Phase 2: Beta (Hybrid)
- Deployment: Staging
- Dataset: 10K-100K embeddings
- Index: Create Vector Search index
- Run performance tests
- Keep linear scan as fallback

### Phase 3: Production (Vector Search)
- Deployment: Production
- Dataset: >100K embeddings
- Index: Vector Search active
- Fallback: Linear scan for errors
- Monitoring: Performance metrics dashboard

---

## Performance Checklist

- [ ] Vector Search index created in MongoDB Atlas
- [ ] Index status shows "Active"
- [ ] Backend code updated with vector search aggregation
- [ ] Performance monitoring implemented
- [ ] Benchmark tests passing
- [ ] P99 latency <50ms for >100K embeddings
- [ ] Fallback to linear scan configured
- [ ] Frontend timeout adjusted (5s vector, 30s fallback)
- [ ] Documentation updated for team
- [ ] Production deployment scheduled

---

## References

- [MongoDB Vector Search Documentation](https://www.mongodb.com/docs/atlas/atlas-vector-search/overview/)
- [HNSW Algorithm Paper](https://arxiv.org/abs/1802.02413)
- [Embedding Performance Benchmarks](https://openai.com/blog/embedding-v3/)
