import crypto from "node:crypto";
import { normalizeForSimilarity } from "./vectorSearchService.js";

function normalizeVector(input) {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function deterministicEmbedding(text, dimensions = 128) {
    const source = String(text || "").trim().toLowerCase();
    const vector = new Array(dimensions).fill(0);

  for (let i = 0; i < source.length; i += 1) {
    const code = source.charCodeAt(i);
    vector[i % dimensions] += (code % 67) / 67;
  }

  return normalizeForSimilarity(vector);
}

export function getEmbeddingProviderCapabilities() {
  return {
    defaultProvider: String(process.env.OPENAI_API_KEY || "").trim() ? "openai" : "deterministic",
    supportedProviders: ["deterministic", "openai"],
    defaultModel: String(process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small").trim(),
    maxDimensions: 3072,
    supportsBatch: true,
    supportsMetadataFilters: true,
  };
}

export async function generateEmbedding({ text, model = "deterministic-v1", dimensions = 128, metadata = {} }) {
  const payload = String(text || "").trim();
  if (!payload) {
    return { model, embedding: [], provider: "none", metadata };
  }

  const openAiApiKey = String(process.env.OPENAI_API_KEY || "").trim();
  const openAiModel = String(process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small").trim();

  // Optional external provider support; deterministic fallback preserves local repeatability.
  if (openAiApiKey) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify({
          model: openAiModel,
          input: payload,
        }),
      });

      if (response.ok) {
        const body = await response.json();
        const embedding = normalizeVector(body?.data?.[0]?.embedding);
        if (embedding.length > 0) {
          return {
            model: openAiModel,
            embedding,
            provider: "openai",
            embeddingHash: crypto.createHash("sha256").update(JSON.stringify(embedding)).digest("hex"),
            dimensions: embedding.length,
            metadata,
          };
        }
      }
    } catch {
      // Fall back to deterministic embedding.
    }
  }

  const embedding = deterministicEmbedding(payload, dimensions);
  return {
    model,
    embedding,
    provider: "deterministic",
    embeddingHash: crypto.createHash("sha256").update(JSON.stringify(embedding)).digest("hex"),
    dimensions: embedding.length,
    metadata,
  };
}

export async function generateEmbeddingsBatch({ inputs = [], model = "deterministic-v1", dimensions = 128 }) {
  const items = [];
  for (const input of inputs) {
    const text = typeof input === "string" ? input : input?.text;
    const metadata = typeof input === "string" ? {} : input?.metadata || {};
    items.push(await generateEmbedding({ text, model, dimensions, metadata }));
  }

  return items;
}
