import assert from "node:assert/strict";
import test from "node:test";
import { createCookieOptions, shouldUseCrossSiteCookies } from "../src/utils/cookiePolicy.js";

function createMockRequest(headers = {}) {
    return {
        headers,
        get(name) {
            return this.headers[String(name || "").toLowerCase()];
        },
    };
}

test("shouldUseCrossSiteCookies returns false for same-host localhost development", () => {
    const req = createMockRequest({
        origin: "http://localhost:5173",
        host: "localhost:5000",
        "x-forwarded-proto": "http",
    });

    assert.equal(shouldUseCrossSiteCookies(req, false), false);
});

test("shouldUseCrossSiteCookies returns true for secure cross-host requests", () => {
    const req = createMockRequest({
        origin: "https://rushmanthnalluri.github.io",
        host: "modular-component-showcase-application.onrender.com",
        "x-forwarded-proto": "https",
    });

    assert.equal(shouldUseCrossSiteCookies(req, false), true);
});

test("createCookieOptions enables secure none cookies for secure cross-host requests", () => {
    const req = createMockRequest({
        origin: "https://rushmanthnalluri.github.io",
        host: "modular-component-showcase-application.onrender.com",
        "x-forwarded-proto": "https",
    });

    const options = createCookieOptions(req, {
        isProduction: false,
        httpOnly: true,
        maxAge: 1234,
    });

    assert.equal(options.httpOnly, true);
    assert.equal(options.secure, true);
    assert.equal(options.sameSite, "none");
    assert.equal(options.maxAge, 1234);
});
