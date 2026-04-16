import express from "express";
import {
    buildDummyEmbeddingFromText,
    cosineSimilarity,
    normalizeEmbedding,
} from "../services/vectorSearchService.js";

export async function getMongoDescription(req, res, { ComponentDescription }) {
    const componentId = String(req.params.componentId || "").trim();
    if (!componentId) {
        return res.status(400).json({ message: "componentId is required." });
    }

    const doc = await ComponentDescription.findOne({ componentId }).lean();
    if (!doc) {
        return res.status(404).json({ message: "Description not found." });
    }

    return res.json({ item: doc });
}

export async function putMongoDescription(req, res, { ComponentDescription }) {
    const componentId = String(req.params.componentId || "").trim();
    const title = String(req.body?.title || "").trim();
    const contentMarkdown = String(req.body?.contentMarkdown || "").trim();

    if (!componentId || !title || !contentMarkdown) {
        return res.status(400).json({ message: "componentId, title and contentMarkdown are required." });
    }

    const updated = await ComponentDescription.findOneAndUpdate(
        { componentId },
        {
            $set: {
                title,
                contentMarkdown,
                propsReference: Array.isArray(req.body?.propsReference) ? req.body.propsReference : [],
                examples: Array.isArray(req.body?.examples) ? req.body.examples : [],
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.json({ item: updated });
}

export async function postMongoLog(req, res, { UsageLog }) {
    const eventType = String(req.body?.eventType || "OTHER").trim();
    const entry = await UsageLog.create({
        eventType,
        componentId: String(req.body?.componentId || "").trim(),
        userId: String(req.body?.userId || "").trim(),
        sessionId: String(req.body?.sessionId || "").trim(),
        metadata: req.body?.metadata && typeof req.body.metadata === "object" ? req.body.metadata : {},
    });

    return res.status(201).json({ item: entry });
}

export async function getMongoLogs(_req, res, { UsageLog }) {
    const items = await UsageLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ items });
}

export async function upsertMongoEmbedding(req, res, { ComponentEmbedding }) {
    const componentId = String(req.body?.componentId || "").trim();
    const text = String(req.body?.text || "").trim();
    const model = String(req.body?.model || "manual").trim();
    const embedding = normalizeEmbedding(req.body?.embedding);

    if (!componentId || !text || embedding.length === 0) {
        return res.status(400).json({ message: "componentId, text and non-empty embedding are required." });
    }

    const item = await ComponentEmbedding.findOneAndUpdate(
        { componentId },
        {
            $set: {
                componentId,
                text,
                model,
                embedding,
            },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    return res.status(201).json({ item });
}

export async function semanticSearch(req, res, { ComponentEmbedding, Component, UsageLog }) {
    const query = String(req.body?.query || "").trim();
    const providedQueryEmbedding = normalizeEmbedding(req.body?.queryEmbedding);
    const queryEmbedding = providedQueryEmbedding.length > 0
        ? providedQueryEmbedding
        : buildDummyEmbeddingFromText(query);
    const limit = Math.max(1, Math.min(25, Number.parseInt(String(req.body?.limit || 10), 10) || 10));

    if (!query || queryEmbedding.length === 0) {
        return res.status(400).json({ message: "query and queryEmbedding are required." });
    }

    const candidates = await ComponentEmbedding.find({}).limit(500).lean();

    const items = candidates
        .map((item) => ({
            componentId: item.componentId,
            text: item.text,
            model: item.model,
            score: cosineSimilarity(queryEmbedding, item.embedding),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    const componentIds = items.map((item) => item.componentId).filter(Boolean);
    const components = componentIds.length > 0
        ? await Component.find({ id: { $in: componentIds } }).lean()
        : [];
    const componentMap = new Map(components.map((entry) => [entry.id, entry]));

    const enrichedItems = items.map((item) => ({
        ...item,
        component: componentMap.get(item.componentId) || null,
    }));

    await UsageLog.create({
        eventType: "SEARCH",
        metadata: {
            query,
            resultCount: enrichedItems.length,
        },
    });

    const compactItems = enrichedItems.map((item) => ({
        componentId: item.componentId,
        score: Number(item.score.toFixed(6)),
    }));

    return res.json(compactItems);
}

export function createMongoRouter({
    ComponentDescription,
    ComponentEmbedding,
    Component,
    UsageLog,
}) {
    const router = express.Router();

    router.get("/descriptions/:componentId", (req, res) => getMongoDescription(req, res, { ComponentDescription }));
    router.put("/descriptions/:componentId", (req, res) => putMongoDescription(req, res, { ComponentDescription }));
    router.post("/logs", (req, res) => postMongoLog(req, res, { UsageLog }));
    router.get("/logs", (req, res) => getMongoLogs(req, res, { UsageLog }));
    router.post("/embeddings", (req, res) => upsertMongoEmbedding(req, res, { ComponentEmbedding }));
    router.post("/embeddings/upsert", (req, res) => upsertMongoEmbedding(req, res, { ComponentEmbedding }));
    router.post("/search", (req, res) => semanticSearch(req, res, { ComponentEmbedding, Component, UsageLog }));
    router.post("/search/semantic", (req, res) => semanticSearch(req, res, { ComponentEmbedding, Component, UsageLog }));

    return router;
}
