import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1365, height: 900 },
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const url = "http://localhost:5186";
try {
  console.log("Opening desktop");
  await page.goto(url);
  await page
    .locator(".location")
    .filter({ hasText: "Shared wall, open to everyone" })
    .waitFor();
  const world = page.locator(".world"),
    wall = page.locator(".wall");
  const original = await world.getAttribute("style");
  await page.mouse.move(200, 400);
  await page.mouse.down();
  await page.mouse.move(390, 480, { steps: 12 });
  await page.mouse.up();
  assert.equal(await page.locator("dialog[open]").count(), 0);
  assert.notEqual(await world.getAttribute("style"), original);
  await page
    .getByRole("button", { name: "Back to start", exact: true })
    .click();
  await wall.focus();
  await page.keyboard.press("ArrowLeft");
  assert.notEqual(await world.getAttribute("style"), original);
  await page.keyboard.press("Home");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await page.getByText("120%", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Back to start", exact: true })
    .click();
  console.log("Opening editor");
  await page.mouse.click(300, 400);
  await page.getByRole("dialog", { name: "Make your mark." }).waitFor();
  const text = "Browser verification " + Date.now();
  await page.getByLabel(/Your message/).fill(text);
  await page.route("**/api/marks", (route) =>
    route.request().method() === "POST" ? route.abort() : route.continue(),
  );
  await page
    .getByRole("button", { name: "Publish your mark", exact: true })
    .click();
  await page.getByRole("alert").waitFor();
  assert.equal(await page.getByLabel(/Your message/).inputValue(), text);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Add a mark", exact: true }).click();
  assert.equal(await page.getByLabel(/Your message/).inputValue(), text);
  await page.unroute("**/api/marks");
  await page
    .getByRole("button", { name: "Publish your mark", exact: true })
    .click();
  await page
    .getByText("Your mark is on the wall. Thanks for being here.", {
      exact: true,
    })
    .waitFor();
  await page.locator(".world > .mark").filter({ hasText: text }).waitFor();
  console.log("Checking reload");
  await page.reload();
  await page.locator(".world > .mark").filter({ hasText: text }).waitFor();
  console.log("Checking mobile");
  const other = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const phone = await other.newPage();
  await phone.goto(url);
  await phone.locator(".world > .mark").filter({ hasText: text }).waitFor();
  assert.equal(
    await phone.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await phone.getByRole("button", { name: /Wall notes/ }).click();
  const note = phone.locator("article").filter({ hasText: text });
  assert.equal(
    await note.getByRole("button", { name: "Remove", exact: true }).count(),
    0,
  );
  await note.getByRole("button", { name: "Report", exact: true }).click();
  await phone.getByRole("button", { name: "Close panel", exact: true }).click();
  await phone.getByRole("button", { name: "Add a mark", exact: true }).tap();
  await phone.getByRole("button", { name: "Draw / sign", exact: true }).tap();
  const box = await phone.locator(".drawing-pad").boundingBox();
  await phone.mouse.move(box.x + 30, box.y + 30);
  await phone.mouse.down();
  await phone.mouse.move(box.x + 180, box.y + 80, { steps: 20 });
  await phone.mouse.up();
  assert.equal(await phone.locator(".drawing-pad path").count(), 1);
  await phone.getByRole("button", { name: "Undo", exact: true }).click();
  assert.equal(await phone.locator(".drawing-pad path").count(), 0);
  await phone.getByRole("button", { name: "Redo", exact: true }).click();
  assert.equal(await phone.locator(".drawing-pad path").count(), 1);
  await mkdir("artifacts", { recursive: true });
  await phone.screenshot({ path: "artifacts/mobile-editor.png" });
  await phone.keyboard.press("Escape");
  // Real touch dispatch for pinch zoom; two contacts must not open the editor.
  const cdp = await other.newCDPSession(phone);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: 100, y: 350 },
      { x: 250, y: 350 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: 60, y: 350 },
      { x: 290, y: 350 },
    ],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  assert.equal(await phone.locator("dialog[open]").count(), 0);
  await phone.getByRole("button", { name: "Back to start", exact: true }).tap();
  await phone.screenshot({ path: "artifacts/mobile.png" });
  await page.getByRole("button", { name: /Wall notes/ }).click();
  await page
    .locator("article")
    .filter({ hasText: text })
    .getByRole("button", { name: "Remove", exact: true })
    .click();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page
    .locator(".world > .mark")
    .filter({ hasText: text })
    .waitFor({ state: "detached" });
  await page.screenshot({ path: "artifacts/desktop.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: drag/click separation, keyboard pan/reset, zoom, failed publish and draft recovery, successful publish, reload, separate mobile session persistence, ownership, reporting, drawing undo/redo, touch pinch, mobile overflow, and no page errors.",
  );
} catch (e) {
  console.log({ body: await page.locator("body").innerText(), errors });
  throw e;
} finally {
  await browser.close();
}
