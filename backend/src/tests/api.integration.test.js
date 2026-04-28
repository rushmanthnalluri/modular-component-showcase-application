import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import rateLimit from "express-rate-limit";
import { createSqlRouter } from "../routes/sqlRoutes.js";
import { createMongoRouter, getMongoLogs, semanticSearch } from "../routes/mongoRoutes.js";
import { createReviewsRouter } from "../routes/reviewsRoutes.js";
import { createDiscussionsRouter } from "../routes/discussionsRoutes.js";

const testLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests, please try again later.",
    },
});

async function withServer(app, run) {
    const server = await new Promise((resolve) => {
        const instance = app.listen(0, () => resolve(instance));
    });

    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        await run(baseUrl);
    } finally {
        await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    }
}

test("GET /api/sql/components returns wrapped component list", async () => {
    const app = express();
    app.use(express.json());

    app.use("/api/sql", createSqlRouter({
        listUsers: async () => [],
        listCategories: async () => [],
        listComponents: async () => [{ componentId: 100, name: "Input" }],
        createComponent: async () => ({ componentId: 101 }),
        updateComponent: async () => ({ componentId: 101 }),
        deleteComponent: async () => true,
    }));

    await withServer(app, async (baseUrl) => {
        const response = await fetch(`${baseUrl}/api/sql/components`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(Array.isArray(body.items), true);
        assert.equal(body.items[0].componentId, 100);
    });
});

test("top-level mongo routes return reviews, discussions, logs, and compact search payloads", async () => {
    const app = express();
    app.use(express.json());

    const allowAuth = (req, _res, next) => {
        req.user = { _id: "user-1", role: "developer" };
        next();
    };

    const allowCsrf = (_req, _res, next) => next();

    const reviewFindChain = {
        sort: () => ({
            limit: () => ({
                lean: async () => ([{ _id: "review-1", rating: 5, comment: "Great" }]),
            }),
        }),
    };

    const discussionFindChain = {
        sort: () => ({
            limit: () => ({
                lean: async () => ([{ _id: "discussion-1", message: "Helpful" }]),
            }),
        }),
    };

    const mongoDeps = {
        ComponentDescription: { findOne: () => ({ lean: async () => null }) },
        ComponentEmbedding: {
            find: () => ({
                limit: () => ({
                    lean: async () => [
                        { componentId: "cmp-1", text: "animated button", model: "mock", embedding: [0.8, 0.2, 0.1] },
                        { componentId: "cmp-2", text: "data table", model: "mock", embedding: [0.1, 0.9, 0.3] },
                    ],
                }),
            }),
            findOneAndUpdate: async () => ({ lean: async () => ({ componentId: "cmp-1" }) }),
        },
        Component: {
            findOne: async () => ({ _id: "component-object-id" }),
            find: () => ({
                limit: () => ({
                    lean: async () => [
                        { id: "cmp-1", name: "Animated Button" },
                        { id: "cmp-2", name: "Data Table" },
                    ],
                }),
            }),
        },
        UsageLog: {
            create: async () => ({ ok: true }),
            find: () => ({
                sort: () => ({
                    limit: () => ({
                        lean: async () => ([{ eventType: "SEARCH", metadata: { query: "button" } }]),
                    }),
                }),
            }),
        },
    };

    app.use("/api/reviews", createReviewsRouter({
        Review: {
            find: () => reviewFindChain,
            create: async (payload) => ({ _id: "review-new", ...payload }),
        },
        Component: {
            findOne: async () => ({ _id: "component-object-id" }),
        },
        requireAuth: allowAuth,
        requireCsrf: allowCsrf,
    }));

    app.use("/api/discussions", createDiscussionsRouter({
        Discussion: {
            find: () => discussionFindChain,
            create: async (payload) => ({ _id: "discussion-new", ...payload }),
        },
        Component: {
            findOne: async () => ({ _id: "component-object-id" }),
        },
        requireAuth: allowAuth,
        requireCsrf: allowCsrf,
    }));

    app.use("/api/mongo", testLimiter, createMongoRouter(mongoDeps));

    app.post(
        "/api/search",
        testLimiter,
        (req, res) => semanticSearch(req, res, mongoDeps)
    );

    app.get(
        "/api/logs",
        testLimiter,
        (req, res) => getMongoLogs(req, res, mongoDeps)
    );

    await withServer(app, async (baseUrl) => {
        const reviewsResponse = await fetch(`${baseUrl}/api/reviews`);
        const reviewsBody = await reviewsResponse.json();
        assert.equal(reviewsResponse.status, 200);
        assert.equal(Array.isArray(reviewsBody.reviews), true);
        assert.equal(reviewsBody.reviews[0].comment, "Great");

        const discussionsResponse = await fetch(`${baseUrl}/api/discussions`);
        const discussionsBody = await discussionsResponse.json();
        assert.equal(discussionsResponse.status, 200);
        assert.equal(Array.isArray(discussionsBody.discussions), true);
        assert.equal(discussionsBody.discussions[0].message, "Helpful");

        const logsResponse = await fetch(`${baseUrl}/api/logs`);
        const logsBody = await logsResponse.json();
        assert.equal(logsResponse.status, 200);
        assert.equal(Array.isArray(logsBody.items), true);

        const searchResponse = await fetch(`${baseUrl}/api/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: "button", limit: 2 }),
        });

        const searchBody = await searchResponse.json();
        assert.equal(searchResponse.status, 200);
        assert.equal(Array.isArray(searchBody), true);
        assert.equal(searchBody.length, 2);
        assert.equal(typeof searchBody[0].componentId, "string");
        assert.equal(typeof searchBody[0].score, "number");
        assert.equal(typeof searchBody[1].componentId, "string");
        assert.equal(typeof searchBody[1].score, "number");
    });
});
