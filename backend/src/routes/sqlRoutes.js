import express from "express";
import {
    listUsers,
    listCategories,
    listComponents,
    createComponent,
    updateComponent,
    deleteComponent,
} from "../services/sqlCatalogService.js";

function toNumber(value) {
    const parsed = Number.parseInt(String(value), 10);
    return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSqlError(error) {
    if (error?.code === "SQL_NOT_CONFIGURED") {
        return { status: 503, body: { message: "PostgreSQL is not configured." } };
    }

    if (error?.code === "23505") {
        return { status: 409, body: { message: "Unique constraint violation.", detail: error.detail } };
    }

    if (error?.code === "23503") {
        return { status: 400, body: { message: "Invalid foreign key reference.", detail: error.detail } };
    }

    if (error?.code === "23514") {
        return { status: 400, body: { message: "Check constraint violation.", detail: error.detail } };
    }

    return { status: 500, body: { message: "SQL operation failed." } };
}

export function createSqlRouter(deps = {
    listUsers,
    listCategories,
    listComponents,
    createComponent,
    updateComponent,
    deleteComponent,
}) {
    const router = express.Router();

    router.get("/users", async (_req, res) => {
        try {
            return res.json({ items: await deps.listUsers() });
        } catch (error) {
            const mapped = normalizeSqlError(error);
            return res.status(mapped.status).json(mapped.body);
        }
    });

    router.get("/categories", async (_req, res) => {
        try {
            return res.json({ items: await deps.listCategories() });
        } catch (error) {
            const mapped = normalizeSqlError(error);
            return res.status(mapped.status).json(mapped.body);
        }
    });

    router.get("/components", async (_req, res) => {
        try {
            return res.json({ items: await deps.listComponents() });
        } catch (error) {
            const mapped = normalizeSqlError(error);
            return res.status(mapped.status).json(mapped.body);
        }
    });

    router.post("/components", async (req, res) => {
        try {
            const name = String(req.body?.name || "").trim();
            const description = String(req.body?.description || "").trim();
            const categoryId = toNumber(req.body?.categoryId ?? req.body?.category_id);
            const userId = toNumber(req.body?.userId ?? req.body?.user_id);

            if (!name || !description || !categoryId || !userId) {
                return res.status(400).json({ message: "name, description, category_id and user_id are required." });
            }

            const item = await deps.createComponent({ name, description, categoryId, userId });
            return res.status(201).json({ item });
        } catch (error) {
            const mapped = normalizeSqlError(error);
            return res.status(mapped.status).json(mapped.body);
        }
    });

    router.put("/components/:id", async (req, res) => {
        try {
            const componentId = toNumber(req.params.id);
            const name = req.body?.name;
            const description = req.body?.description;
            const categoryInput = req.body?.categoryId ?? req.body?.category_id;
            const userInput = req.body?.userId ?? req.body?.user_id;
            const categoryId = categoryInput !== undefined ? toNumber(categoryInput) : null;
            const userId = userInput !== undefined ? toNumber(userInput) : null;

            if (!componentId) {
                return res.status(400).json({ message: "Valid component id is required." });
            }

            const item = await deps.updateComponent(componentId, { name, description, categoryId, userId });
            if (!item) {
                return res.status(404).json({ message: "Component not found." });
            }

            return res.json({ item });
        } catch (error) {
            const mapped = normalizeSqlError(error);
            return res.status(mapped.status).json(mapped.body);
        }
    });

    router.delete("/components/:id", async (req, res) => {
        try {
            const componentId = toNumber(req.params.id);
            if (!componentId) {
                return res.status(400).json({ message: "Valid component id is required." });
            }

            const deleted = await deps.deleteComponent(componentId);
            if (!deleted) {
                return res.status(404).json({ message: "Component not found." });
            }

            return res.json({ message: "Component deleted." });
        } catch (error) {
            const mapped = normalizeSqlError(error);
            return res.status(mapped.status).json(mapped.body);
        }
    });

    return router;
}
