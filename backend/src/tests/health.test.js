import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "";
process.env.PGHOST = "";
process.env.PGPORT = "";
process.env.PGUSER = "";
process.env.PGPASSWORD = "";
process.env.PGDATABASE = "";

const { app } = await import("../app.js");

async function withServer(run) {
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

test("GET /health returns mongo and postgres booleans", async () => {
    await withServer(async (baseUrl) => {
        const response = await fetch(`${baseUrl}/health`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.status, "ok");
        assert.equal(typeof body.mongo, "boolean");
        assert.equal(typeof body.postgres, "boolean");
        assert.equal(typeof body.mode, "string");
    });
});