import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const base = process.argv[2];
if (!base)
  throw Error(
    "Usage: node scripts/check-deployment.mjs https://your-app.vercel.app",
  );
const browser = await chromium.launch({ headless: true });
const owner = await browser.newContext({
  baseURL: base,
  viewport: { width: 1365, height: 900 },
});
const reader = await browser.newContext({
  baseURL: base,
  viewport: { width: 390, height: 844 },
});
let id;
try {
  assert.equal((await owner.request.get("/api/health")).status(), 200);
  const page = await owner.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page
    .locator(".location")
    .filter({ hasText: "Shared wall, open to everyone" })
    .waitFor();
  await page.locator(".wall").click({ position: { x: 300, y: 400 } });
  const text = "Deployment verification " + Date.now();
  await page.getByLabel(/Your message/).fill(text);
  const saved = page.waitForResponse(
    (r) => r.url().endsWith("/api/marks") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Publish your mark", exact: true })
    .click();
  const response = await saved;
  assert.equal(response.status(), 201, await response.text());
  id = (await response.json()).id;
  await page.locator(".world > .mark").filter({ hasText: text }).waitFor();
  await page.reload();
  await page.locator(".world > .mark").filter({ hasText: text }).waitFor();
  const other = await reader.newPage();
  await other.goto(base);
  await other.locator(".world > .mark").filter({ hasText: text }).waitFor();
  const result = await reader.request.get(
    "/api/marks?left=-2400&top=-2400&right=2400&bottom=2400",
  );
  assert.equal((await result.json()).find((m) => m.id === id).owned, false);
  assert.equal((await reader.request.delete(`/api/marks/${id}`)).status(), 404);
  assert.equal((await owner.request.delete(`/api/marks/${id}`)).status(), 200);
  id = null;
  assert.deepEqual(errors, []);
  console.log(
    "PASS: public health, real browser publish, reload persistence, separate mobile-session reading, ownership protection, and cleanup.",
  );
} finally {
  if (id) await owner.request.delete(`/api/marks/${id}`);
  await browser.close();
}
