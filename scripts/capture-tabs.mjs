import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const out = process.env.MEDIA_DIR;
if (!out) {
  console.error("MEDIA_DIR required");
  process.exit(1);
}
fs.mkdirSync(out, { recursive: true });

const chrome =
  process.env.CHROME_PATH ||
  "/home/lane/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome";
const browser = await chromium.launch({
  executablePath: chrome,
  headless: true,
  args: ["--no-sandbox", "--disable-gpu", "--use-gl=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://127.0.0.1:43147/", {
  waitUntil: "domcontentloaded",
  timeout: 90000,
});
await page.waitForSelector("text=Oil Terminal", { timeout: 60000 });
await page.waitForTimeout(4000);
await page.getByRole("button", { name: "Play" }).click();
await page.waitForTimeout(4000);
await page.screenshot({ path: path.join(out, "tab-3d.png") });

for (const [tab, file] of [
  ["2D", "tab-2d.png"],
  ["Logic", "tab-logic.png"],
  ["Statistics", "tab-statistics.png"],
]) {
  await page.getByRole("button", { name: tab, exact: true }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(out, file) });
}

await page.getByRole("button", { name: "3D", exact: true }).click();
await page.getByRole("button", { name: "×5" }).click();
await page.waitForTimeout(6000);
await page.screenshot({ path: path.join(out, "tab-3d-running.png") });

await browser.close();
console.log("shots ok", out);
