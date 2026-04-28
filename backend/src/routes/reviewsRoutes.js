import express from "express";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export function createReviewsRouter({
    Review,
    Component,
    User = null,
    requireAuth,
    requireCsrf,
    syncSqlReview = async () => {},
    syncSqlUserAccount = async () => {},
}) {
    const router = express.Router();

    function successPayload(res, payload = {}, status = 200) {
        return sendSuccess(res, payload, status);
    }

    function errorPayload(res, code, message, status = 500, details = null) {
        return sendError(res, code, message, status, details);
    }

    router.get("/", async (req, res) => {
        try {
            const componentId = String(req.query?.componentId || "").trim();
            const query = componentId ? { componentId } : {};
            const reviews = await Review.find(query).sort({ createdAt: -1 }).limit(100).lean();
            return successPayload(res, { reviews });
        } catch (error) {
            return errorPayload(res, "SERVER_ERROR", "Unable to fetch reviews.", 500);
        }
    });

    router.post("/", requireAuth, requireCsrf, async (req, res) => {
        try {
            const componentId = String(req.body?.componentId || "").trim();
            const rating = Number(req.body?.rating);
            const title = String(req.body?.title || "").trim();
            const comment = String(req.body?.comment || "").trim();

            if (!componentId || !Number.isFinite(rating) || rating < 1 || rating > 5 || !comment) {
                return errorPayload(res, "VALIDATION_ERROR", "componentId, rating (1-5), and comment are required.", 400);
            }

            const component = await Component.findOne({ id: componentId });
            if (!component) {
                return errorPayload(res, "NOT_FOUND", "Component not found.", 404);
            }

            const review = await Review.create({
                componentId: component._id,
                userId: req.user._id,
                rating,
                title,
                comment,
                status: "approved",
            });

            const user = User ? (await User.findById(req.user._id).lean()) || req.user : req.user;
            await syncSqlUserAccount(user);
            await syncSqlReview(review, { user, componentMongoId: component.id });

            return successPayload(res, { review }, 201);
        } catch (error) {
            return errorPayload(res, "SERVER_ERROR", "Unable to create review.", 500);
        }
    });

    return router;
}
