import express from "express";

export function createReviewsRouter({ Review, Component, requireAuth, requireCsrf }) {
    const router = express.Router();

    router.get("/", async (req, res) => {
        const componentId = String(req.query?.componentId || "").trim();
        const query = componentId ? { componentId } : {};
        const reviews = await Review.find(query).sort({ createdAt: -1 }).limit(100).lean();
        return res.json({ reviews });
    });

    router.post("/", requireAuth, requireCsrf, async (req, res) => {
        const componentId = String(req.body?.componentId || "").trim();
        const rating = Number(req.body?.rating);
        const title = String(req.body?.title || "").trim();
        const comment = String(req.body?.comment || "").trim();

        if (!componentId || !Number.isFinite(rating) || rating < 1 || rating > 5 || !comment) {
            return res.status(400).json({ message: "componentId, rating (1-5), and comment are required." });
        }

        const component = await Component.findOne({ id: componentId });
        if (!component) {
            return res.status(404).json({ message: "Component not found." });
        }

        const review = await Review.create({
            componentId: component._id,
            userId: req.user._id,
            rating,
            title,
            comment,
            status: "approved",
        });

        return res.status(201).json({ review });
    });

    return router;
}
