import express from "express";
import { sendSuccess, sendError } from "../utils/responseHelper.js";

export function createDiscussionsRouter({
    Discussion,
    Component,
    User = null,
    requireAuth,
    requireCsrf,
    syncSqlDiscussion = async () => {},
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
            const query = {};

            if (componentId) {
                const component = await Component.findOne({ id: componentId }).select("_id").lean();
                if (component?._id) {
                    query.componentId = component._id;
                }
            }

            const discussions = await Discussion.find(query).sort({ createdAt: -1 }).limit(100).lean();
            return successPayload(res, { discussions });
        } catch (error) {
            return errorPayload(res, "SERVER_ERROR", "Unable to fetch discussions.", 500);
        }
    });

    router.post("/", requireAuth, requireCsrf, async (req, res) => {
        try {
            const componentId = String(req.body?.componentId || "").trim();
            const message = String(req.body?.message || "").trim();
            const parentId = String(req.body?.parentId || "").trim() || null;

            if (!componentId || !message) {
                return errorPayload(res, "VALIDATION_ERROR", "componentId and message are required.", 400);
            }

            const component = await Component.findOne({ id: componentId });
            if (!component) {
                return errorPayload(res, "NOT_FOUND", "Component not found.", 404);
            }

            const discussion = await Discussion.create({
                componentId: component._id,
                userId: req.user._id,
                parentId,
                message,
            });

            const user = User ? (await User.findById(req.user._id).lean()) || req.user : req.user;
            await syncSqlUserAccount(user);
            await syncSqlDiscussion(discussion, { user, componentMongoId: component.id });

            return successPayload(res, { discussion }, 201);
        } catch (error) {
            return errorPayload(res, "SERVER_ERROR", "Unable to create discussion.", 500);
        }
    });

    return router;
}
