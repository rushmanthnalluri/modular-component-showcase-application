import assert from "node:assert/strict";
import test from "node:test";
import { generateEmbedding, getEmbeddingProviderCapabilities } from "../services/embeddingProvider.js";
import { describeVectorCapabilities } from "../services/vectorSearchService.js";

function snapshotVectorEnv() {
  return {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_EMBEDDING_MODEL: process.env.OPENAI_EMBEDDING_MODEL,
    PGVECTOR_ENABLED: process.env.PGVECTOR_ENABLED,
    EXTERNAL_VECTOR_PROVIDER: process.env.EXTERNAL_VECTOR_PROVIDER,
  };
}

function restoreVectorEnv(snapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

test("atlas and vector capability endpoints expose deterministic fallback when live providers are absent", async () => {
  const snapshot = snapshotVectorEnv();

  try {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_EMBEDDING_MODEL;
    delete process.env.PGVECTOR_ENABLED;
    delete process.env.EXTERNAL_VECTOR_PROVIDER;

    const searchCapabilities = describeVectorCapabilities();
    const embeddingCapabilities = getEmbeddingProviderCapabilities();
    const generated = await generateEmbedding({ text: "atlas fallback smoke", dimensions: 32 });

    assert.deepEqual(searchCapabilities.providers, {
      deterministic: true,
      openai: false,
      pgvector: false,
      externalVectorStore: null,
    });
    assert.deepEqual(searchCapabilities.algorithms.approximateNearestNeighbor, ["hnsw", "ivfflat"]);
    assert.equal(embeddingCapabilities.defaultProvider, "deterministic");
    assert.equal(generated.provider, "deterministic");
    assert.equal(generated.embedding.length, 32);
  } finally {
    restoreVectorEnv(snapshot);
  }
});
