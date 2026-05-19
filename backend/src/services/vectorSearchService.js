function normalizeVector(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((entry) => Number(entry))
        .filter((entry) => Number.isFinite(entry));
}

function safeLength(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
        return 0;
    }

    return Math.min(a.length, b.length);
}

export function dotProduct(a, b) {
    const length = safeLength(a, b);
    if (length === 0) {
        return 0;
    }

    let dot = 0;
    for (let i = 0; i < length; i += 1) {
        dot += a[i] * b[i];
    }

    return dot;
}

export function cosineSimilarity(a, b) {
    const length = safeLength(a, b);
    if (length === 0) {
        return 0;
    }

    let magA = 0;
    let magB = 0;
    let dot = 0;

    for (let i = 0; i < length; i += 1) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }

    if (magA === 0 || magB === 0) {
        return 0;
    }

    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function euclideanSimilarity(a, b) {
    const length = safeLength(a, b);
    if (length === 0) {
        return 0;
    }

    let distanceSquared = 0;
    for (let i = 0; i < length; i += 1) {
        const delta = a[i] - b[i];
        distanceSquared += delta * delta;
    }

    return 1 / (1 + Math.sqrt(distanceSquared));
}

export function normalizeForSimilarity(vector) {
    const normalized = normalizeVector(vector);
    const magnitude = Math.sqrt(normalized.reduce((sum, entry) => sum + entry * entry, 0));
    if (!normalized.length || magnitude === 0) {
        return normalized;
    }

    return normalized.map((entry) => Number((entry / magnitude).toFixed(8)));
}

export function scoreSimilarity(metric, a, b) {
    const safeMetric = String(metric || "cosine").trim().toLowerCase();
    if (safeMetric === "dot" || safeMetric === "dot_product") {
        return dotProduct(a, b);
    }

    if (safeMetric === "euclidean" || safeMetric === "l2") {
        return euclideanSimilarity(a, b);
    }

    return cosineSimilarity(a, b);
}

export function buildDummyEmbeddingFromText(text, dimensions = 32) {
    const vector = new Array(dimensions).fill(0);
    const source = String(text || "").toLowerCase().trim();
    for (let i = 0; i < source.length; i += 1) {
        const code = source.charCodeAt(i);
        vector[i % dimensions] += (code % 31) / 31;
    }
    return normalizeForSimilarity(vector);
}

export function generateMockEmbedding(text, dimensions = 32) {
    return buildDummyEmbeddingFromText(text, dimensions);
}

export function normalizeEmbedding(value) {
    return normalizeVector(value);
}

export function describeVectorCapabilities() {
    const openAiConfigured = Boolean(String(process.env.OPENAI_API_KEY || "").trim());
    const pgVectorEnabled = String(process.env.PGVECTOR_ENABLED || "").trim().toLowerCase() === "true";
    const externalIndexProvider = String(process.env.EXTERNAL_VECTOR_PROVIDER || "").trim().toLowerCase();

    return {
        providers: {
            deterministic: true,
            openai: openAiConfigured,
            pgvector: pgVectorEnabled,
            externalVectorStore: externalIndexProvider || null,
        },
        algorithms: {
            exact: ["cosine", "dot", "euclidean"],
            approximateNearestNeighbor: ["hnsw", "ivfflat"],
        },
        retrieval: {
            metadataFiltering: true,
            hybridSearch: true,
            idempotentUpserts: true,
            indexedAnn: pgVectorEnabled,
            primaryIndex: pgVectorEnabled ? "PostgreSQL pgvector HNSW (vector_cosine_ops)" : null,
            fallbackIndex: "MongoDB exact scan",
        },
    };
}
