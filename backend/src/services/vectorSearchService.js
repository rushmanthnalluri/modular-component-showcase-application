function normalizeVector(value) {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .map((entry) => Number(entry))
        .filter((entry) => Number.isFinite(entry));
}

export function cosineSimilarity(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
        return 0;
    }

    const length = Math.min(a.length, b.length);
    let dot = 0;
    let magA = 0;
    let magB = 0;

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

// Dummy embedding for local demonstration; replace with a real model when needed.
export function buildDummyEmbeddingFromText(text, dimensions = 32) {
    const vector = new Array(dimensions).fill(0);
    const source = String(text || "").toLowerCase().trim();
    for (let i = 0; i < source.length; i += 1) {
        const code = source.charCodeAt(i);
        vector[i % dimensions] += (code % 31) / 31;
    }
    return vector;
}

export function normalizeEmbedding(value) {
    return normalizeVector(value);
}
