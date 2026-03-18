import assert from "node:assert/strict";
import test from "node:test";
import { createCsrfMiddleware } from "../src/middleware/csrf.js";

function createMockResponse() {
    return {
        statusCode: 200,
        cookies: {},
        body: null,
        cookie(name, value) {
            this.cookies[name] = value;
        },
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };
}

test("csrf middleware creates token cookie and allows matching non-safe request", () => {
    const { ensureCsrfCookie, readCsrfToken, requireCsrf } = createCsrfMiddleware({ isProduction: false });
    const req = {
        method: "POST",
        headers: {},
        cookies: {},
        body: {},
        get(name) {
            return this.headers[name.toLowerCase()];
        },
    };
    const res = createMockResponse();

    ensureCsrfCookie(req, res, () => {});
    const token = readCsrfToken(req);
    assert.ok(token, "csrf token should be set");

    req.headers["x-csrf-token"] = token;
    let nextCalled = false;
    requireCsrf(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, 200);
});

test("csrf middleware blocks mismatched token", () => {
    const { requireCsrf } = createCsrfMiddleware({ isProduction: false });
    const req = {
        method: "POST",
        headers: { "x-csrf-token": "wrong-token" },
        cookies: { csrf_token: "correct-token" },
        body: {},
        get(name) {
            return this.headers[name.toLowerCase()];
        },
    };
    const res = createMockResponse();
    let nextCalled = false;

    requireCsrf(req, res, () => {
        nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.message, "Invalid CSRF token.");
});
