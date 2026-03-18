import express from "express";
import { createComponentId, validateComponentPayload } from "../utils/validation.js";

export function createComponentsRouter({
    Component,
    writeLimiter,
    requireAuth,
    requireDeveloper,
    requireCsrf,
}) {
    const router = express.Router();

    router.get("/", async (_req, res) => {
        try {
            const items = await Component.find({}).sort({ createdAt: -1 }).lean();
            return res.json(items);
        } catch {
            return res.status(500).json({ message: "Unable to fetch components." });
        }
    });

    router.post("/", writeLimiter, requireAuth, requireCsrf, requireDeveloper, async (req, res) => {
        try {
            const validation = validateComponentPayload(req.body || {});
            if (!validation.ok) {
                return res.status(400).json({ message: validation.message });
            }

            const { name, description, category, jsxCode, cssCode, thumbnail, screenshot } = validation.data;
            const item = await Component.create({
                id: createComponentId(name),
                name,
                description,
                category,
                tags: [category, "user-added", ...name.toLowerCase().split(/\s+/)].slice(0, 5),
                thumbnail,
                screenshot,
                code: {
                    jsx: jsxCode,
                    css: cssCode,
                },
                createdBy: req.user.id,
            });

            return res.status(201).json(item);
        } catch (error) {
            console.error("Create component error:", error.message, error.stack);
            return res.status(500).json({ message: "Unable to save component right now." });
        }
    });

    router.delete("/:id", writeLimiter, requireAuth, requireCsrf, async (req, res) => {
        try {
            const component = await Component.findOne({ id: req.params.id });
            if (!component) {
                return res.status(404).json({ message: "Component not found." });
            }

            const isOwner = String(component.createdBy) === String(req.user._id);
            const isAdmin = String(req.user.role).toLowerCase() === "admin";
            if (!isOwner && !isAdmin) {
                return res.status(403).json({ message: "You can only delete your own components." });
            }

            await Component.deleteOne({ id: req.params.id });
            return res.json({ message: "Component deleted." });
        } catch (error) {
            console.error("Delete component error:", error.message);
            return res.status(500).json({ message: "Unable to delete component." });
        }
    });

    return router;
}
