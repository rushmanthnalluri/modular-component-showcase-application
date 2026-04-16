import express from "express";

export function createDiscussionsRouter({ Discussion, Component, requireAuth, requireCsrf }) {
    const router = express.Router();

    router.get("/", async (req, res) => {
        const componentId = String(req.query?.componentId || "").trim();
        const query = {};

        if (componentId) {
            const component = await Component.findOne({ id: componentId }).select("_id").lean();
            if (component?._id) {
                query.componentId = component._id;
            }
        }

        const discussions = await Discussion.find(query).sort({ createdAt: -1 }).limit(100).lean();
        return res.json({ discussions });
    });

    router.post("/", requireAuth, requireCsrf, async (req, res) => {
        const componentId = String(req.body?.componentId || "").trim();
        const message = String(req.body?.message || "").trim();
        const parentId = String(req.body?.parentId || "").trim() || null;

        if (!componentId || !message) {
            return res.status(400).json({ message: "componentId and message are required." });
        }

        const component = await Component.findOne({ id: componentId });
        if (!component) {
            return res.status(404).json({ message: "Component not found." });
        }

        const discussion = await Discussion.create({
            componentId: component._id,
            userId: req.user._id,
            parentId,
            message,
        });

        return res.status(201).json({ discussion });
    });

    return router;
}
