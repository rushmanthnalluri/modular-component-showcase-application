import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { chromium, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";
const docsScreenshotDir = path.join(process.cwd(), "docs", "screenshots");
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

async function waitForServer(url, timeoutMs = 60_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Ignore while server is starting.
    }
    await sleep(500);
  }

  throw new Error(`Preview server did not start within ${timeoutMs}ms.`);
}

function runBuild() {
  const result = spawnSync(
    npmCmd,
    ["run", "build"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        GITHUB_REPOSITORY: "",
      },
    }
  );

  if (result.status !== 0) {
    throw new Error("Build failed while capturing README screenshots.");
  }
}

async function captureScreenshots() {
  fs.mkdirSync(docsScreenshotDir, { recursive: true });

  const previewProcess = spawn(
    npmCmd,
    ["run", "preview", "--", "--host", "127.0.0.1", "--port", "4173", "--strictPort"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        GITHUB_REPOSITORY: "",
      },
    }
  );

  try {
    await waitForServer(baseURL);

    const browser = await chromium.launch();

    const desktopContext = await browser.newContext({
      ...devices["Desktop Chrome"],
      viewport: { width: 1440, height: 900 },
    });
    const desktopPage = await desktopContext.newPage();

    await desktopPage.goto(`${baseURL}/about`, { waitUntil: "networkidle" });
    await desktopPage.locator(".about-page-card").screenshot({
      path: path.join(docsScreenshotDir, "about-light-desktop.png"),
    });

    await desktopPage.addInitScript(() => {
      localStorage.setItem("ui-theme", "dark");
    });
    await desktopPage.goto(
      `${baseURL}/component/gradient-button?demo_label=Deploy%20Component&demo_tone=teal&demo_disabled=false`,
      { waitUntil: "networkidle" }
    );
    await desktopPage.locator(".details-grid").screenshot({
      path: path.join(docsScreenshotDir, "details-dark-desktop.png"),
    });

    const mobileContext = await browser.newContext({
      ...devices["Pixel 5"],
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.addInitScript(() => {
      localStorage.setItem("ui-theme", "dark");
    });
    await mobilePage.goto(`${baseURL}/contact`, { waitUntil: "networkidle" });
    await mobilePage.locator(".contact-card").screenshot({
      path: path.join(docsScreenshotDir, "contact-dark-mobile.png"),
    });

    await desktopContext.close();
    await mobileContext.close();
    await browser.close();
  } finally {
    previewProcess.kill();
  }
}

async function main() {
  runBuild();
  await captureScreenshots();
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
