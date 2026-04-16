import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { createSqlRouter } from "../routes/sqlRoutes.js";

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

test("sql routes expose list endpoints and return wrapped items", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/sql", createSqlRouter({
    listUsers: async () => [{ userId: 1, name: "Ava", email: "ava@example.com" }],
    listCategories: async () => [{ categoryId: 2, categoryName: "Buttons" }],
    listComponents: async () => [{ componentId: 3, name: "Primary Button" }],
    createComponent: async () => ({ componentId: 4, name: "Created" }),
    updateComponent: async () => ({ componentId: 4, name: "Updated" }),
    deleteComponent: async () => true,
  }));

  await withServer(app, async (baseUrl) => {
    const usersRes = await fetch(`${baseUrl}/api/sql/users`);
    const usersBody = await usersRes.json();
    assert.equal(usersRes.status, 200);
    assert.equal(Array.isArray(usersBody.items), true);
    assert.equal(usersBody.items[0].name, "Ava");

    const categoriesRes = await fetch(`${baseUrl}/api/sql/categories`);
    const categoriesBody = await categoriesRes.json();
    assert.equal(categoriesRes.status, 200);
    assert.equal(categoriesBody.items[0].categoryName, "Buttons");

    const componentsRes = await fetch(`${baseUrl}/api/sql/components`);
    const componentsBody = await componentsRes.json();
    assert.equal(componentsRes.status, 200);
    assert.equal(componentsBody.items[0].componentId, 3);
  });
});

test("sql routes support create update and delete operations", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/sql", createSqlRouter({
    listUsers: async () => [],
    listCategories: async () => [],
    listComponents: async () => [],
    createComponent: async ({ name, description, categoryId, userId }) => ({
      componentId: 4,
      name,
      description,
      categoryId,
      userId,
    }),
    updateComponent: async (componentId, payload) => ({
      componentId,
      ...payload,
    }),
    deleteComponent: async () => true,
  }));

  await withServer(app, async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/api/sql/components`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Primary Button",
        description: "Button for action flows",
        categoryId: 1,
        userId: 2,
      }),
    });

    const createBody = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(createBody.item.componentId, 4);
    assert.equal(createBody.item.name, "Primary Button");

    const updateResponse = await fetch(`${baseUrl}/api/sql/components/4`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Primary Button v2",
        description: "Updated description",
        categoryId: 3,
        userId: 5,
      }),
    });

    const updateBody = await updateResponse.json();
    assert.equal(updateResponse.status, 200);
    assert.equal(updateBody.item.componentId, 4);
    assert.equal(updateBody.item.name, "Primary Button v2");

    const deleteResponse = await fetch(`${baseUrl}/api/sql/components/4`, {
      method: "DELETE",
    });

    const deleteBody = await deleteResponse.json();
    assert.equal(deleteResponse.status, 200);
    assert.equal(deleteBody.message, "Component deleted.");
  });
});

test("sql routes validate create payload", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/sql", createSqlRouter({
    listUsers: async () => [],
    listCategories: async () => [],
    listComponents: async () => [],
    createComponent: async () => ({ componentId: 4 }),
    updateComponent: async () => ({ componentId: 4 }),
    deleteComponent: async () => true,
  }));

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/sql/components`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", description: "x" }),
    });

    const body = await response.json();
    assert.equal(response.status, 400);
    assert.match(body.message, /required/i);
  });
});