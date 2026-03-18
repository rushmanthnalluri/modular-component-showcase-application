import { spawn } from "node:child_process";

const rootDir = process.cwd();
const backendTimeoutMs = Number(process.env.VERIFY_BACKEND_TIMEOUT_MS || 90000);
const frontendTimeoutMs = Number(process.env.VERIFY_FRONTEND_TIMEOUT_MS || 45000);
const backendOrigin = process.env.VERIFY_BACKEND_ORIGIN || "http://localhost:5000";
const apiBaseUrl = process.env.VERIFY_API_BASE_URL || `${backendOrigin}/api`;
const frontendCandidates = String(process.env.VERIFY_FRONTEND_CANDIDATES || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const defaultFrontendCandidates = ["http://localhost:8080", "http://localhost:8081", "http://localhost:5173"];
const routeSmokeList = [
  "/",
  "/category/data",
  "/component/gradient-button",
  "/component/gradient-button?demo_tone=slate&demo_disabled=true",
  "/component/live-line-chart?demo_autoUpdate=false&demo_pointCount=12",
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function terminate(childProcess) {
  if (!childProcess || childProcess.killed) {
    return;
  }

  childProcess.kill("SIGTERM");
  setTimeout(() => {
    if (!childProcess.killed) {
      childProcess.kill("SIGKILL");
    }
  }, 2000);
}

function startProcess(command, args, label) {
  const runOnWindows = process.platform === "win32";
  const child = runOnWindows
    ? spawn([command, ...args].join(" "), {
        cwd: rootDir,
        stdio: "inherit",
        shell: true,
        env: process.env,
      })
    : spawn(command, args, {
        cwd: rootDir,
        stdio: "inherit",
        shell: false,
        env: process.env,
      });

  child.on("error", (error) => {
    console.error(`${label} failed to start: ${error.message}`);
  });

  return child;
}

async function fetchSafeText(url) {
  const response = await fetch(url);
  const body = await response.text();
  return { response, body };
}

async function isReachable(url) {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForAny(urls, timeoutMs, label) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    for (const url of urls) {
      if (await isReachable(url)) {
        return url;
      }
    }

    await wait(1000);
  }

  throw new Error(`${label} did not become ready within ${Math.floor(timeoutMs / 1000)}s.`);
}

async function runVerifier(frontendUrl) {
  const verifier = spawn(process.execPath, ["scripts/verify-connection.mjs"], {
    cwd: rootDir,
    stdio: "inherit",
    env: {
      ...process.env,
      VERIFY_FRONTEND_URL: frontendUrl,
      VERIFY_API_BASE_URL: apiBaseUrl,
    },
  });

  return await new Promise((resolve) => {
    verifier.on("exit", (code) => resolve(code ?? 1));
  });
}

async function verifyFrontendRoutes(frontendUrl) {
  for (const routePath of routeSmokeList) {
    const target = `${frontendUrl}${routePath}`;
    const { response, body } = await fetchSafeText(target);
    const contentType = response.headers.get("content-type") || "";

    assert(response.ok, `Frontend route failed: ${target} (status ${response.status})`);
    assert(contentType.includes("text/html"), `Frontend route did not return HTML: ${target}`);
    assert(body.includes("id=\"root\""), `Frontend route did not return app shell markup: ${target}`);

    console.log(`[ok] Frontend route reachable: ${routePath}`);
  }
}

async function verifyBackendHealth() {
  const healthUrl = `${backendOrigin}/health`;
  const response = await fetch(healthUrl);
  const payload = await response.json();

  assert(response.ok, `Backend health failed (${response.status})`);
  assert(payload?.status === "ok", "Backend health payload is invalid.");
  console.log(`[ok] Backend health: mongo=${payload.mongo || "unknown"}, mode=${payload.mode || "unknown"}`);
}

async function run() {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const backend = startProcess(npmCommand, ["--prefix", "backend", "run", "start"], "Backend");
  const frontend = startProcess(npmCommand, ["run", "dev"], "Frontend");

  const cleanup = () => {
    terminate(frontend);
    terminate(backend);
  };

  process.on("SIGINT", () => {
    cleanup();
    process.exit(130);
  });

  process.on("SIGTERM", () => {
    cleanup();
    process.exit(143);
  });

  try {
    await waitForAny([`${backendOrigin}/health`], backendTimeoutMs, "Backend");
    const detectedFrontend = await waitForAny(
      frontendCandidates.length > 0 ? frontendCandidates : defaultFrontendCandidates,
      frontendTimeoutMs,
      "Frontend"
    );

    console.log(`Detected frontend URL: ${detectedFrontend}`);

    await verifyBackendHealth();
    await verifyFrontendRoutes(detectedFrontend);

    const verifierExitCode = await runVerifier(detectedFrontend);
    assert(verifierExitCode === 0, `verify-connection failed with exit code ${verifierExitCode}`);

    console.log("Review smoke checks passed.");
    cleanup();
    process.exit(0);
  } catch (error) {
    cleanup();
    console.error(`review:smoke failed: ${error.message}`);
    process.exit(1);
  }
}

run();
