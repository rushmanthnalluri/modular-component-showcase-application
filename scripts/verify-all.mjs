import { spawn } from "node:child_process";

const rootDir = process.cwd();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function terminate(child) {
  if (!child || child.killed) {
    return;
  }

  child.kill("SIGTERM");
  setTimeout(() => {
    if (!child.killed) {
      child.kill("SIGKILL");
    }
  }, 2000);
}

function startProcess(command, args, label) {
  const child = spawn(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env,
  });

  child.on("error", (error) => {
    console.error(`${label} failed to start: ${error.message}`);
  });

  return child;
}

async function run() {
  const backend = startProcess("npm", ["--prefix", "backend", "run", "start"], "Backend");
  const frontend = startProcess("npm", ["run", "dev"], "Frontend");

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
    await waitForAny(["http://localhost:5000/health"], 45000, "Backend");
    const frontendUrl = await waitForAny(
      ["http://localhost:8080", "http://localhost:8081", "http://localhost:5173"],
      45000,
      "Frontend"
    );

    console.log(`Detected frontend URL for verification: ${frontendUrl}`);

    const verifier = spawn(process.execPath, ["scripts/verify-connection.mjs"], {
      cwd: rootDir,
      stdio: "inherit",
      env: {
        ...process.env,
        VERIFY_FRONTEND_URL: frontendUrl,
      },
    });

    const exitCode = await new Promise((resolve) => {
      verifier.on("exit", (code) => resolve(code ?? 1));
    });

    cleanup();
    process.exit(exitCode);
  } catch (error) {
    cleanup();
    console.error(`verify:all failed: ${error.message}`);
    process.exit(1);
  }
}

run();
