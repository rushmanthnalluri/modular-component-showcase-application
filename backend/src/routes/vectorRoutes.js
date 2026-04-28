import express from "express";
import { runHybridSearch } from "../services/hybridSearchService.js";
import { generateEmbedding, getEmbeddingProviderCapabilities } from "../services/embeddingProvider.js";
import { describeVectorCapabilities, scoreSimilarity } from "../services/vectorSearchService.js";
import { publishVectorEmbeddingUpserted } from "../producers/componentEventProducer.js";

export function createVectorRouter({ Component, ComponentEmbedding, UsageLog, requireAuth, idempotencyService }) {
  const router = express.Router();

  function toClientError(error, fallbackMessage) {
    if (error?.statusCode === 400) {
      return { status: 400, message: error.message || fallbackMessage };
    }

    return { status: 500, message: fallbackMessage };
  }

  router.get("/providers/capabilities", (_req, res) => {
    return res.json({
      embeddings: getEmbeddingProviderCapabilities(),
      search: describeVectorCapabilities(),
    });
  });

  router.post("/embeddings/generate", requireAuth, async (req, res) => {
    const text = String(req.body?.text || "").trim();
    if (!text) {
      return res.status(400).json({ message: "text is required" });
    }

    let generated;
    try {
      generated = await generateEmbedding({
        text,
        model: String(req.body?.model || "deterministic-v1"),
        dimensions: Number(req.body?.dimensions || 128),
      });
    } catch (error) {
      const response = toClientError(error, "Unable to generate embedding");
      return res.status(response.status).json({ message: response.message });
    }

    return res.json(generated);
  });

  router.post("/search/semantic", async (req, res) => {
    const query = String(req.body?.query || "").trim();
    if (!query) {
      return res.status(400).json({ message: "query is required" });
    }

    let generated;
    try {
      generated = await generateEmbedding({
        text: query,
        model: String(req.body?.model || "deterministic-v1"),
        dimensions: Number(req.body?.dimensions || 128),
      });
    } catch (error) {
      const response = toClientError(error, "Unable to generate embedding");
      return res.status(response.status).json({ message: response.message });
    }
    const limit = Math.max(1, Math.min(50, Number(req.body?.limit) || 10));
    const metric = String(req.body?.metric || "cosine").trim().toLowerCase();
    const safeCategory = String(req.body?.category || "").trim().toLowerCase();

    const candidates = await ComponentEmbedding.find({})
      .select("componentId componentName category text model embedding")
      .limit(200)
      .lean();

    const filtered = candidates.filter((item) => {
      if (!safeCategory) {
        return true;
      }
      return String(item.category || "").trim().toLowerCase() === safeCategory;
    });

    const items = filtered
      .map((item) => ({
        componentId: item.componentId,
        componentName: item.componentName,
        category: item.category,
        model: item.model,
        score: Number(scoreSimilarity(metric, generated.embedding, item.embedding).toFixed(6)),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);

    return res.json({
      query,
      metric,
      count: items.length,
      items,
      provider: generated.provider,
      model: generated.model,
    });
  });

  router.post("/search/hybrid", async (req, res) => {
    const query = String(req.body?.query || "").trim();
    if (!query) {
      return res.status(400).json({ message: "query is required" });
    }

    let result;
    try {
      result = await runHybridSearch({
        query,
        Component,
        ComponentEmbedding,
        limit: req.body?.limit,
        alpha: req.body?.alpha,
        metric: req.body?.metric,
        category: req.body?.category,
        tags: req.body?.tags,
        minScore: req.body?.minScore,
      });
    } catch (error) {
      const response = toClientError(error, "Unable to run hybrid search");
      return res.status(response.status).json({ message: response.message });
    }

    if (UsageLog) {
      await UsageLog.create({
        eventType: "HYBRID_SEARCH",
        metadata: {
          query,
          resultCount: result.items.length,
          diagnostics: result.diagnostics,
        },
      });
    }

    return res.json({
      query,
      count: result.items.length,
      items: result.items,
      diagnostics: result.diagnostics,
    });
  });

  router.post("/upsert", requireAuth, async (req, res) => {
    const idempotencyKey = String(req.headers["x-idempotency-key"] || req.body?.idempotencyKey || "").trim();
    const fingerprint = JSON.stringify({
      componentId: req.body?.componentId || "",
      componentName: req.body?.componentName || "",
      category: req.body?.category || "",
      text: req.body?.text || "",
    });
    const reserve = idempotencyService.reserve({ scope: "vector-upsert", key: idempotencyKey, fingerprint });
    if (!reserve.ok) {
      if (reserve.conflict) {
        return res.status(reserve.statusCode || 409).json({ message: reserve.message });
      }

      if (reserve.pending) {
        return res.status(202).json({ reused: true, pending: true, item: reserve.cached || null });
      }

      return res.status(reserve.statusCode || 200).json({ reused: true, pending: false, item: reserve.cached || null });
    }

    try {
      const componentId = String(req.body?.componentId || "").trim();
      const text = String(req.body?.text || req.body?.componentName || "").trim();
      const componentName = String(req.body?.componentName || "").trim();
      const category = String(req.body?.category || "").trim();

      if (!componentId || !componentName || !text) {
        idempotencyService.fail({ composite: reserve.composite });
        return res.status(400).json({ message: "componentId, componentName, and text are required." });
      }

      const generated = await generateEmbedding({
        text,
        dimensions: Number(req.body?.dimensions || 128),
        metadata: {
          componentId,
          componentName,
          category,
        },
      });

      const item = await ComponentEmbedding.findOneAndUpdate(
        { componentId },
        {
          $set: {
            componentId,
            componentName,
            category,
            text,
            model: generated.model,
            provider: generated.provider,
            embeddingHash: generated.embeddingHash,
            embedding: generated.embedding,
          },
        },
        { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
      ).lean();

      publishVectorEmbeddingUpserted({
        componentId,
        componentName,
        category,
        provider: generated.provider,
        model: generated.model,
      });
      idempotencyService.commit({ composite: reserve.composite, payload: item, statusCode: 201 });
      return res.status(201).json({ item, embedding: { provider: generated.provider, model: generated.model } });
    } catch (error) {
      idempotencyService.fail({ composite: reserve.composite });
      return res.status(500).json({ message: error.message || "Unable to upsert embedding" });
    }
  });

  return router;
}
