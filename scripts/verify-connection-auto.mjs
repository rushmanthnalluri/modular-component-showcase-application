import { spawn } from "node:child_process";

const defaultCandidates = [
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:5173",
];

const candidateUrls = String(process.env.VERIFY_FRONTEND_CANDIDATES || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const frontendCandidates = candidateUrls.length > 0 ? candidateUrls : defaultCandidates;

async function isFrontendReachable(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    const contentType = response.headers.get("content-type") || "";
    return response.ok && contentType.includes("text/html");
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function detectFrontendUrl() {
  for (const candidate of frontendCandidates) {
    const reachable = await isFrontendReachable(candidate);
    if (reachable) {
      return candidate;
    }
  }

  return null;
}

function runVerify(frontendUrl) {
  const child = spawn(process.execPath, ["scripts/verify-connection.mjs"], {
    stdio: "inherit",
    env: {
      ...process.env,
      VERIFY_FRONTEND_URL: frontendUrl,
    },
  });

  child.on("exit", (code) => {
    process.exit(code ?? 1);
  });
}

const detected = await detectFrontendUrl();

if (!detected) {
  console.error(
    `No frontend server found. Checked: ${frontendCandidates.join(", ")}. Start Vite dev server or set VERIFY_FRONTEND_CANDIDATES.`
  );
  process.exit(1);
}

console.log(`Detected frontend URL: ${detected}`);
runVerify(detected);
