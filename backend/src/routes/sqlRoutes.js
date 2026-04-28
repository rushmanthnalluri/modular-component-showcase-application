import express from "express";
import {
    listUsers,
    listCategories,
    listComponents,
    createComponent,
    updateComponent,
    deleteComponent,
} from "../services/sqlCatalogService.js";
import { createValidatedBodyMiddleware } from "../middleware/requestValidation.js";

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

function buildCreateComponentPayload(payload = {}) {
    const name = String(payload?.name || "").trim();
    const description = String(payload?.description || "").trim();
    const categoryId = toNumber(payload?.categoryId ?? payload?.category_id);
    const userId = toNumber(payload?.userId ?? payload?.user_id);

    if (!name || !description || !categoryId || !userId) {
        return { ok: false, message: "name, description, category_id and user_id are required." };
    }

    return { ok: true, data: { name, description, categoryId, userId } };
}

function buildUpdateComponentPayload(payload = {}) {
    const name = payload?.name !== undefined ? String(payload.name).trim() : undefined;
    const description = payload?.description !== undefined ? String(payload.description).trim() : undefined;
    const categoryInput = payload?.categoryId ?? payload?.category_id;
    const userInput = payload?.userId ?? payload?.user_id;
    const categoryId = categoryInput !== undefined ? toNumber(categoryInput) : null;
    const userId = userInput !== undefined ? toNumber(userInput) : null;

    if (categoryInput !== undefined && !categoryId) {
        return { ok: false, message: "category_id must be a valid number." };
    }

    if (userInput !== undefined && !userId) {
        return { ok: false, message: "user_id must be a valid number." };
    }

    return { ok: true, data: { name, description, categoryId, userId } };
}

const validateCreateComponent = createValidatedBodyMiddleware(buildCreateComponentPayload, { status: 400 });
const validateUpdateComponent = createValidatedBodyMiddleware(buildUpdateComponentPayload, { status: 400 });

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

    router.post("/components", validateCreateComponent, async (req, res) => {
        try {
            const item = await deps.createComponent(req.validatedBody);
            return res.status(201).json({ item });
        } catch (error) {
            const mapped = normalizeSqlError(error);
            return res.status(mapped.status).json(mapped.body);
        }
    });

    router.put("/components/:id", validateUpdateComponent, async (req, res) => {
        try {
            const componentId = toNumber(req.params.id);

            if (!componentId) {
                return res.status(400).json({ message: "Valid component id is required." });
            }

            const item = await deps.updateComponent(componentId, req.validatedBody);
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
