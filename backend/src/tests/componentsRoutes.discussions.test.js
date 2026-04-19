import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { createComponentsRouter } from "../routes/componentsRoutes.js";

async function withServer(app, run) {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });

  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
}

test("discussion create syncs SQL using public component id", async () => {
  const syncCalls = [];

  const app = express();
  app.use(express.json());

  const router = createComponentsRouter({
    Component: {
      findOne: () => ({
        select: async () => ({ _id: "mongo_component_id", id: "button-1" }),
      }),
      findByIdAndUpdate: async () => ({}),
      countDocuments: async () => 0,
      find: () => ({
        sort: () => ({ skip: () => ({ limit: () => ({ lean: async () => [] }) }) }),
      }),
    },
    Rating: {
      find: () => ({ lean: async () => [] }),
      countDocuments: async () => 0,
    },
    Review: {
      find: () => ({
        populate: () => ({
          sort: () => ({
            skip: () => ({
              limit: () => ({ lean: async () => [] }),
            }),
          }),
        }),
      }),
      countDocuments: async () => 0,
      findById: async () => null,
    },
    Discussion: {
      create: async ({ componentId, userId, parentId, message }) => ({
        _id: "discussion-1",
        componentId,
        userId,
        parentId,
        message,
        populate: async () => ({
          _id: "discussion-1",
          componentId,
          userId: { fullName: "Admin" },
          parentId,
          message,
          status: "active",
        }),
      }),
      find: () => ({
        populate: () => ({
          sort: () => ({
            lean: async () => [],
          }),
        }),
      }),
      findById: async () => null,
    },
    ComponentView: {
      create: async () => ({}),
    },
    ComponentDependency: {
      create: async () => ({}),
      find: () => ({ populate: () => ({ lean: async () => [] }) }),
    },
    SubmissionHistory: {
      create: async () => ({}),
      find: () => ({
        sort: () => ({
          limit: () => ({
            lean: async () => [],
          }),
        }),
      }),
    },
    User: {
      find: () => ({ select: () => ({ limit: () => ({ lean: async () => [] }) }) }),
      findById: () => ({
        lean: async () => ({ _id: "user-1", fullName: "Admin", role: "admin" }),
      }),
    },
    sendAnnouncementEmail: async () => ({}),
    writeLimiter: (_req, _res, next) => next(),
    requireAuth: (req, _res, next) => {
      req.user = { _id: "user-1", role: "admin" };
      next();
    },
    requireDeveloper: (_req, _res, next) => next(),
    requireCsrf: (_req, _res, next) => next(),
    syncSqlRating: async () => {},
    syncSqlReview: async () => {},
    syncSqlDiscussion: async (_discussion, context) => {
      syncCalls.push(context);
    },
    syncSqlUserAccount: async () => {},
  });

  app.use("/api/components", router);

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/components/button-1/discussions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Looks good" }),
    });

    assert.equal(response.status, 201);
    assert.equal(syncCalls.length, 1);
    assert.equal(syncCalls[0]?.componentMongoId, "button-1");
  });
});
