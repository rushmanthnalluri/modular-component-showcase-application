import assert from "node:assert/strict";
import test from "node:test";

process.env.NODE_ENV = "test";
process.env.HOST = "127.0.0.1";
process.env.PORT = "0";
process.env.JWT_SECRET = "core-flow-smoke-test-secret-with-enough-entropy";
process.env.MONGODB_URI =
  process.env.CORE_FLOW_SMOKE_MONGODB_URI ||
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/modularcomponent-core-flow-smoke";
process.env.ALLOW_MEMORY_FALLBACK = "true";
process.env.SQL_AUTO_MIGRATE = "false";
process.env.SEED_SHOWCASE_ON_START = "false";

function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie();
  }

  const combined = response.headers.get("set-cookie");
  return combined ? combined.split(/,(?=\s*[^;,]+=)/) : [];
}

function createCookieJar() {
  const cookies = new Map();

  return {
    store(response) {
      for (const cookieHeader of getSetCookieHeaders(response)) {
        const [pair] = String(cookieHeader || "").split(";");
        const separatorIndex = pair.indexOf("=");
        if (separatorIndex <= 0) {
          continue;
        }
        cookies.set(pair.slice(0, separatorIndex).trim(), pair.slice(separatorIndex + 1).trim());
      }
    },
    header() {
      return Array.from(cookies.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; ");
    },
    get(name) {
      return cookies.get(name) || "";
    },
  };
}

async function requestJson(baseUrl, jar, path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 10000);
  const headers = {
    ...(jar.header() ? { cookie: jar.header() } : {}),
    ...(options.csrf ? { "x-csrf-token": jar.get("csrf_token") } : {}),
    ...(options.body && !(options.body instanceof FormData) ? { "content-type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  let response;
  let text = "";
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body,
      signal: controller.signal,
    });
    text = await response.text();
  } catch (error) {
    throw new Error(`${options.method || "GET"} ${path} did not complete: ${error.message}`);
  } finally {
    clearTimeout(timeout);
  }

  jar.store(response);

  const payload = text ? JSON.parse(text) : {};

  if (!response.ok && !options.allowFailure) {
    throw new Error(`${options.method || "GET"} ${path} failed ${response.status}: ${text}`);
  }

  return { response, payload };
}

async function withTimeout(promise, label, timeoutMs = 30000) {
  let timeout;
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`${label} did not complete within ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
}

test("core user, component, interaction, and favorite flows work through real HTTP APIs", async () => {
  const { startServer, shutdownServer } = await import("../app.js");
  let server;
  const jar = createCookieJar();

  try {
    server = await withTimeout(startServer(), "startServer", 30000);
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}/api`;

    const csrf = await requestJson(baseUrl, jar, "/auth/csrf");
    assert.equal(csrf.response.status, 200);
    assert.equal(csrf.payload.success, true);
    assert.equal(typeof csrf.payload.csrfToken, "string");
    assert.equal(jar.get("csrf_token"), csrf.payload.csrfToken);

    const unique = Date.now().toString(36);
    const email = `core-flow-${unique}@example.com`;
    const password = "StrongPass123";

    const register = await requestJson(baseUrl, jar, "/auth/register", {
      method: "POST",
      csrf: true,
      body: JSON.stringify({
        fullName: "Core Flow Tester",
        email,
        phone: "9876543210",
        password,
        role: "developer",
        bio: "Smoke test developer",
        socialLinks: {},
        emailPreferences: { newComponents: false, reviewComments: true, newsletters: false },
      }),
    });
    assert.equal(register.response.status, 201);
    assert.equal(register.payload.success, true);

    const login = await requestJson(baseUrl, jar, "/auth/login", {
      method: "POST",
      csrf: true,
      body: JSON.stringify({ email, password }),
    });
    assert.equal(login.response.status, 200);
    assert.equal(login.payload.success, true);
    assert.equal(login.payload.user.role, "developer");
    assert.ok(jar.get("auth_token"));

    const profile = await requestJson(baseUrl, jar, "/users/me");
    assert.equal(profile.response.status, 200);
    assert.equal(profile.payload.success, true);
    assert.equal(profile.payload.user.email, email);

    const avatarForm = new FormData();
    avatarForm.append("fullName", "Core Flow Tester Updated");
    avatarForm.append("email", email);
    avatarForm.append("phone", "9876543210");
    avatarForm.append("bio", "Updated by smoke test");
    avatarForm.append("socialLinks", JSON.stringify({ github: "https://github.com/example" }));
    avatarForm.append("emailPreferences", JSON.stringify({ newComponents: true, reviewComments: true }));
    avatarForm.append("avatar", new Blob([Buffer.from("smoke-avatar")], { type: "image/png" }), "avatar.png");

    const updatedProfile = await requestJson(baseUrl, jar, "/users/me", {
      method: "PUT",
      csrf: true,
      body: avatarForm,
    });
    assert.equal(updatedProfile.response.status, 200);
    assert.equal(updatedProfile.payload.success, true);
    assert.equal(updatedProfile.payload.user.fullName, "Core Flow Tester Updated");
    assert.match(updatedProfile.payload.user.avatarUrl, /^http:\/\/127\.0\.0\.1:\d+\/uploads\/avatars\//);
    assert.match(updatedProfile.payload.user.avatarPath, /^\/uploads\/avatars\//);

    const componentPayload = {
      name: `Core Flow Button ${unique}`,
      description: "Created by core flow smoke test",
      descriptionMarkdown: "Smoke test component.",
      category: "buttons",
      tags: ["smoke", "test"],
      jsxCode: "export default function CoreFlowButton(){ return <button>Smoke</button>; }",
      cssCode: ".core-flow-button { color: #111; }",
      thumbnail: "data:image/png;base64,c21va2U=",
      screenshot: "data:image/png;base64,c21va2U=",
      props: [],
      usageExamples: [],
      bestPractices: ["Use accessible labels"],
      commonPitfalls: [],
      dependencies: [],
      relatedComponents: [],
      importStatements: {},
    };

    const created = await requestJson(baseUrl, jar, "/components", {
      method: "POST",
      csrf: true,
      body: JSON.stringify(componentPayload),
    });
    assert.equal(created.response.status, 201);
    assert.equal(created.payload.success, true);
    assert.ok(created.payload.id);
    assert.deepEqual(created.payload.tags.includes("smoke"), true);
    const componentId = created.payload.id;

    const list = await requestJson(baseUrl, jar, "/components");
    assert.equal(list.response.status, 200);
    assert.equal(list.payload.success, true);
    assert.ok(list.payload.items.some((item) => item.id === componentId));

    const updated = await requestJson(baseUrl, jar, `/components/${componentId}`, {
      method: "PUT",
      csrf: true,
      body: JSON.stringify({
        ...componentPayload,
        name: `${componentPayload.name} Edited`,
        tags: ["edited", "smoke"],
        changelog: "Smoke test edit",
      }),
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.payload.success, true);
    assert.equal(updated.payload.name, `${componentPayload.name} Edited`);
    assert.ok(updated.payload.tags.includes("edited"));

    const rating = await requestJson(baseUrl, jar, `/components/${componentId}/ratings`, {
      method: "POST",
      csrf: true,
      body: JSON.stringify({ rating: 5 }),
    });
    assert.equal(rating.response.status, 200);
    assert.equal(rating.payload.success, true);
    assert.equal(rating.payload.totalRatings, 1);

    const review = await requestJson(baseUrl, jar, `/components/${componentId}/reviews`, {
      method: "POST",
      csrf: true,
      body: JSON.stringify({ rating: 5, title: "Solid", comment: "Works end to end." }),
    });
    assert.equal(review.response.status, 201);
    assert.equal(review.payload.success, true);
    assert.equal(review.payload.comment, "Works end to end.");

    const discussion = await requestJson(baseUrl, jar, `/components/${componentId}/discussions`, {
      method: "POST",
      csrf: true,
      body: JSON.stringify({ message: "Can this support icon buttons?" }),
    });
    assert.equal(discussion.response.status, 201);
    assert.equal(discussion.payload.success, true);
    assert.equal(discussion.payload.message, "Can this support icon buttons?");

    const favorite = await requestJson(baseUrl, jar, `/users/me/favorites/${componentId}`, {
      method: "POST",
      csrf: true,
      body: JSON.stringify({}),
    });
    assert.equal(favorite.response.status, 200);
    assert.equal(favorite.payload.success, true);
    assert.ok(favorite.payload.favorites.includes(componentId));

    const favorites = await requestJson(baseUrl, jar, "/users/me/favorites");
    assert.equal(favorites.response.status, 200);
    assert.equal(favorites.payload.success, true);
    assert.ok(favorites.payload.favorites.includes(componentId));

    const favoriteComponents = await requestJson(baseUrl, jar, "/users/me/favorites/components");
    assert.equal(favoriteComponents.response.status, 200);
    assert.equal(favoriteComponents.payload.success, true);
    assert.ok(favoriteComponents.payload.components.some((item) => item.id === componentId));

    const deleted = await requestJson(baseUrl, jar, `/components/${componentId}`, {
      method: "DELETE",
      csrf: true,
    });
    assert.equal(deleted.response.status, 200);
    assert.equal(deleted.payload.success, true);

    const deletedFetch = await requestJson(baseUrl, jar, `/components/${componentId}`, {
      allowFailure: true,
    });
    assert.equal(deletedFetch.response.status, 404);
    assert.equal(deletedFetch.payload.success, false);
  } finally {
    await shutdownServer();
  }
});
