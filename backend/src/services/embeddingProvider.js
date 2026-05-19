import crypto from "node:crypto";
import { normalizeForSimilarity } from "./vectorSearchService.js";

const MAX_TEXT_LENGTH = 5000;
const MAX_ARRAY_ITEMS = 50;
const MAX_BATCH_TOTAL_CHARS = 20000;
const MAX_TOKEN_APPROX = 5000;
const MAX_DIMENSIONS = 3072;
const OPENAI_REQUEST_TIMEOUT_MS = Number.parseInt(process.env.OPENAI_REQUEST_TIMEOUT_MS || "10000", 10);

function createValidationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function approximateTokenCount(text) {
  return Math.ceil(String(text || "").length / 4);
}

function assertTextWithinLimits(text, fieldName = "text") {
  const content = String(text || "");
  if (content.length > MAX_TEXT_LENGTH) {
    throw createValidationError(`${fieldName} exceeds maximum length of ${MAX_TEXT_LENGTH} characters.`);
  }

  const tokenApprox = approximateTokenCount(content);
  if (tokenApprox > MAX_TOKEN_APPROX) {
    throw createValidationError(`${fieldName} exceeds maximum token approximation of ${MAX_TOKEN_APPROX}.`);
  }
}

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
    maxTextLength: MAX_TEXT_LENGTH,
    maxBatchItems: MAX_ARRAY_ITEMS,
    maxBatchTotalChars: MAX_BATCH_TOTAL_CHARS,
    supportsBatch: true,
    supportsMetadataFilters: true,
  };
}

export async function generateEmbedding({ text, model = "deterministic-v1", dimensions = 128, metadata = {} }) {
  const payload = String(text || "").trim();
  if (!payload) {
    return { model, embedding: [], provider: "none", metadata };
  }

  assertTextWithinLimits(payload);
  const safeDimensions = Math.max(1, Math.min(MAX_DIMENSIONS, Number(dimensions) || 128));

  const openAiApiKey = String(process.env.OPENAI_API_KEY || "").trim();
  const openAiModel = String(process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small").trim();

  // Optional external provider support; deterministic fallback preserves local repeatability.
  if (openAiApiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), Math.max(1000, OPENAI_REQUEST_TIMEOUT_MS));
      timeoutId.unref?.();
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify({
          model: openAiModel,
          input: payload,
          dimensions: safeDimensions,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

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

  const embedding = deterministicEmbedding(payload, safeDimensions);
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
  if (!Array.isArray(inputs)) {
    throw createValidationError("inputs must be an array.");
  }

  if (inputs.length > MAX_ARRAY_ITEMS) {
    throw createValidationError(`inputs exceeds maximum batch size of ${MAX_ARRAY_ITEMS}.`);
  }

  let totalChars = 0;
  for (let index = 0; index < inputs.length; index += 1) {
    const input = inputs[index];
    const text = typeof input === "string" ? input : input?.text;
    const normalizedText = String(text || "").trim();
    assertTextWithinLimits(normalizedText, `inputs[${index}]`);
    totalChars += normalizedText.length;
    if (totalChars > MAX_BATCH_TOTAL_CHARS) {
      throw createValidationError(`inputs exceed maximum total size of ${MAX_BATCH_TOTAL_CHARS} characters.`);
    }
  }

  const items = [];
  for (const input of inputs) {
    const text = typeof input === "string" ? input : input?.text;
    const metadata = typeof input === "string" ? {} : input?.metadata || {};
    items.push(await generateEmbedding({ text, model, dimensions, metadata }));
  }

  return items;
}
