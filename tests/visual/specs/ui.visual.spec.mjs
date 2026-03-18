import { expect, test, devices } from "@playwright/test";

const gradientButtonPath =
  "/component/gradient-button?demo_label=Deploy%20Component&demo_tone=teal&demo_disabled=false";

async function openPageWithTheme(page, path, theme) {
  await page.addInitScript((value) => {
    localStorage.setItem("ui-theme", value);
  }, theme);

  await page.goto(path, { waitUntil: "networkidle" });

  await page.addStyleTag({
    content:
      "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}",
  });
}

test.describe("Full visual regression suite", () => {
  const mainPages = [
    "/",
    "/about",
    "/contact",
    "/login",
    "/register",
    "/terms",
    "/privacy",
  ];

  for (const theme of ["light", "dark"]) {
    for (const pagePath of mainPages) {
      test(`visual regression: ${pagePath} (${theme}, desktop)`, async ({ page }) => {
        await openPageWithTheme(page, pagePath, theme);
        await expect(page).toHaveScreenshot(
          `${pagePath.replace(/\//g, "_")}_desktop_${theme}.png`,
          { fullPage: true, animations: "disabled" }
        );
      });
    }
  }

  test.describe("Mobile visual regression", () => {
    for (const theme of ["light", "dark"]) {
      for (const pagePath of mainPages) {
        test(`visual regression: ${pagePath} (${theme}, mobile)`, async ({ browser }) => {
          const mobileContext = await browser.newContext({
            ...devices["iPhone 12"],
            colorScheme: theme,
            viewport: { width: 414, height: 896 },
            deviceScaleFactor: 3,
          });
          const mobilePage = await mobileContext.newPage();
          await mobilePage.addInitScript((value) => {
            localStorage.setItem("ui-theme", value);
          }, theme);
          await mobilePage.goto(pagePath, { waitUntil: "networkidle" });
          await mobilePage.addStyleTag({
            content:
              "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}",
          });
          if (theme === "dark") {
            await mobilePage.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
          }
          await expect(mobilePage).toHaveScreenshot(
            `${pagePath.replace(/\//g, "_")}_mobile_${theme}.png`,
            { fullPage: true, animations: "disabled" }
          );
          await mobileContext.close();
        });
      }
    }
  });
});
