import { performance } from "node:perf_hooks";
import { generateEmbedding } from "./embeddingProvider.js";
import { scoreSimilarity } from "./vectorSearchService.js";

function lexicalScore(query, text) {
  const normalizedQuery = String(query || "").trim().toLowerCase();
  const normalizedText = String(text || "").trim().toLowerCase();
  if (!normalizedQuery || !normalizedText) {
    return 0;
  }

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return 0;
  }

  const hitCount = tokens.filter((token) => normalizedText.includes(token)).length;
  return hitCount / tokens.length;
}

function parseTagFilter(tags) {
  if (!tags) {
    return [];
  }

  const rawValues = Array.isArray(tags) ? tags : String(tags).split(",");
  return rawValues
    .map((entry) => String(entry || "").trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10);
}

export async function runHybridSearch({
  query,
  Component,
  ComponentEmbedding,
  limit = 10,
  alpha = 0.6,
  metric = "cosine",
  category,
  tags,
  minScore = 0,
}) {
  const startedAt = performance.now();
  const createHybridSearchResult = (items, diagnostics) => Object.assign(items, { items, diagnostics });
  const normalizedQuery = String(query || "").trim();
  if (!normalizedQuery) {
    return createHybridSearchResult([], {
        query: normalizedQuery,
        latencyMs: Number((performance.now() - startedAt).toFixed(3)),
      });
  }

  const boundedLimit = Math.max(1, Math.min(50, Number(limit) || 10));
  const safeCategory = String(category || "").trim().toLowerCase();
  const safeTags = parseTagFilter(tags);
  const safeMinScore = Math.max(0, Math.min(1, Number(minScore) || 0));
  const candidates = await Component.find({ isPublished: true })
    .select("id name description category tags")
    .limit(500)
    .lean();

  const embeddings = await ComponentEmbedding.find({ componentId: { $in: candidates.map((item) => item.id) } })
    .select("componentId embedding")
    .lean();

  const embeddingMap = new Map(embeddings.map((entry) => [entry.componentId, entry.embedding]));
  const queryEmbeddingPayload = await generateEmbedding({
    text: normalizedQuery,
    dimensions: 128,
    metadata: { type: "query" },
  });
  const queryEmbedding = queryEmbeddingPayload.embedding;
  const safeAlpha = Math.min(1, Math.max(0, Number(alpha) || 0.6));

  const items = candidates
    .filter((item) => {
      if (safeCategory && String(item.category || "").trim().toLowerCase() !== safeCategory) {
        return false;
      }

      if (safeTags.length === 0) {
        return true;
      }

      const componentTags = new Set((item.tags || []).map((entry) => String(entry || "").trim().toLowerCase()));
      return safeTags.every((tag) => componentTags.has(tag));
    })
    .map((item) => {
      const lexical = lexicalScore(normalizedQuery, `${item.name} ${item.description} ${item.category} ${(item.tags || []).join(" ")}`);
      const vector = scoreSimilarity(metric, queryEmbedding, embeddingMap.get(item.id) || []);
      const totalScore = Number((safeAlpha * vector + (1 - safeAlpha) * lexical).toFixed(6));
      return {
        componentId: item.id,
        name: item.name,
        category: item.category,
        tags: item.tags || [],
        lexicalScore: Number(lexical.toFixed(6)),
        vectorScore: Number(vector.toFixed(6)),
        score: totalScore,
        explanation: {
          strategy: "hybrid",
          alpha: safeAlpha,
          metric,
        },
      };
    })
    .filter((item) => item.score >= safeMinScore)
    .sort((left, right) => right.score - left.score)
    .slice(0, boundedLimit);

  return createHybridSearchResult(items, {
      query: normalizedQuery,
      metric,
      alpha: safeAlpha,
      candidateCount: candidates.length,
      matchedCount: items.length,
      latencyMs: Number((performance.now() - startedAt).toFixed(3)),
      provider: queryEmbeddingPayload.provider,
      model: queryEmbeddingPayload.model,
    });
}
