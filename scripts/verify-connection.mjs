const frontendUrl = process.env.VERIFY_FRONTEND_URL || "http://localhost:5173";
const apiBaseUrl =
  process.env.VERIFY_API_BASE_URL || process.env.VITE_API_BASE_URL || "http://localhost:5000/api";

function toBackendOrigin(baseUrl) {
  const parsed = new URL(baseUrl);
  return `${parsed.protocol}//${parsed.host}`;
}

function randomEmail() {
  return `verify_${Date.now()}_${Math.floor(Math.random() * 100000)}@example.com`;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await safeJson(response);
  return { response, payload };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verify() {
  const backendOrigin = toBackendOrigin(apiBaseUrl);
  const frontendOrigin = new URL(frontendUrl).origin;

  console.log(`Verifying frontend: ${frontendUrl}`);
  const frontendResponse = await fetch(frontendUrl);
  const contentType = frontendResponse.headers.get("content-type") || "";
  assert(frontendResponse.ok, `Frontend is not reachable at ${frontendUrl}.`);
  assert(contentType.includes("text/html"), "Frontend did not return HTML content.");
  console.log("✅ Frontend reachable");

  console.log(`Verifying backend health: ${backendOrigin}/health`);
  const { response: healthResponse, payload: healthPayload } = await requestJson(`${backendOrigin}/health`);
  assert(healthResponse.ok, "Backend health endpoint failed.");
  assert(healthPayload?.status === "ok", "Backend health payload is invalid.");
  console.log(`✅ Backend health ok (mongo=${healthPayload.mongo || "unknown"}, mode=${healthPayload.mode || "unknown"})`);

  const email = randomEmail();
  const password = "Passw0rd!";

  console.log("Verifying register + CORS headers");
  const registerBody = {
    fullName: "Verifier User",
    email,
    phone: "1234567890",
    password,
    role: "developer",
  };

  const { response: registerResponse, payload: registerPayload } = await requestJson(
    `${apiBaseUrl}/auth/register`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: frontendOrigin,
      },
      body: JSON.stringify(registerBody),
    }
  );

  const corsOrigin = registerResponse.headers.get("access-control-allow-origin");
  assert(registerResponse.status === 201, `Register failed (${registerResponse.status}): ${registerPayload?.message || "Unknown error"}`);
  assert(
    corsOrigin === frontendOrigin || corsOrigin === "*",
    `CORS is not configured for ${frontendOrigin}. Received: ${corsOrigin || "<none>"}`
  );
  console.log("✅ Register and CORS check passed");

  console.log("Verifying login");
  const { response: loginResponse, payload: loginPayload } = await requestJson(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: frontendOrigin,
    },
    body: JSON.stringify({ email, password }),
  });
  assert(loginResponse.ok, `Login failed (${loginResponse.status}).`);
  assert(Boolean(loginPayload?.token), "Login did not return token.");
  console.log("✅ Login passed");

  console.log("Verifying protected component create endpoint");
  const componentBody = {
    name: `Verifier Component ${Date.now()}`,
    description: "Created by verify-connection script",
    category: "Testing",
    jsxCode: "export default function Verified(){ return <div>verified</div>; }",
    cssCode: ".verified{display:block;}",
    thumbnail: "",
    screenshot: "",
  };

  const { response: createResponse, payload: createPayload } = await requestJson(`${apiBaseUrl}/components`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${loginPayload.token}`,
      Origin: frontendOrigin,
    },
    body: JSON.stringify(componentBody),
  });
  assert(createResponse.status === 201, `Create component failed (${createResponse.status}).`);
  assert(Boolean(createPayload?.id), "Created component payload is missing id.");

  const { response: listResponse, payload: listPayload } = await requestJson(`${apiBaseUrl}/components`, {
    headers: {
      Origin: frontendOrigin,
    },
  });
  assert(listResponse.ok, `List components failed (${listResponse.status}).`);
  assert(Array.isArray(listPayload), "Components list payload is not an array.");
  assert(listPayload.some((item) => item?.id === createPayload.id), "Created component not found in list response.");
  console.log("✅ Component create/list checks passed");

  console.log("All verifications passed.");
}

verify().catch((error) => {
  console.error(`Verification failed: ${error.message}`);
  process.exit(1);
});
