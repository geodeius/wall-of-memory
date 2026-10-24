import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
const b = await chromium.launch({ headless: true });
try {
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await c.addInitScript(() =>
    localStorage.setItem(
      "wall-draft",
      JSON.stringify({
        kind: "text",
        text: { bad: true },
        name: null,
        color: "not-a-color",
        size: 999,
        font: "invalid",
        strokes: [
          null,
          { points: "bad" },
          {
            points: [
              [20, 20],
              ["invalid", 10],
            ],
            color: "#303a36",
            width: 999,
          },
        ],
      }),
    ),
  );
  const p = await c.newPage();
  p.setDefaultTimeout(10000);
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto("http://localhost:5186");
  await p.getByRole("button", { name: "Add a mark", exact: true }).click();
  assert.equal(await p.getByLabel(/Your message/).inputValue(), "");
  await p.getByText("Style your mark", { exact: true }).click();
  assert.equal(await p.getByLabel(/Letter size/).inputValue(), "60");
  await p.keyboard.press("Escape");
  await p.locator("dialog").waitFor({ state: "detached" });
  await p.locator(".wall").focus();
  await p.keyboard.press("ArrowLeft");
  await p.keyboard.press("ArrowLeft");
  const samples = await p.evaluate(async () => {
    const x = () =>
      new DOMMatrix(
        getComputedStyle(document.querySelector(".world")).transform,
      ).m41 -
      innerWidth / 2;
    const before = x();
    document
      .querySelector('[aria-label="Back to start"]')
      .dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }));
    await new Promise((r) =>
      requestAnimationFrame(() => requestAnimationFrame(r)),
    );
    return { before, after: x() };
  });
  assert.ok(
    samples.after > 0 && samples.after < samples.before,
    JSON.stringify(samples),
  );
  await p.mouse.move(80, 300);
  await p.mouse.down();
  await p.mouse.move(150, 330, { steps: 5 });
  await p.mouse.up();
  const interrupted = await p
    .locator(".world")
    .evaluate((e) => getComputedStyle(e).transform);
  await p.waitForTimeout(650);
  assert.equal(
    await p.locator(".world").evaluate((e) => getComputedStyle(e).transform),
    interrupted,
  );
  assert.equal(await p.locator("dialog").count(), 0);
  await p.locator(".wall").focus();
  await p.keyboard.press("Home");
  assert.equal(
    await p
      .locator(".world")
      .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m41),
    640,
  );
  assert.deepEqual(errors, []);
  await c.close();
  const reduced = await b.newContext({
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  const q = await reduced.newPage();
  await q.goto("http://localhost:5186");
  await q.getByRole("button", { name: "Add a mark", exact: true }).click();
  await q.getByRole("button", { name: "Draw / sign", exact: true }).click();
  assert.equal(
    await q
      .locator(".tabs")
      .evaluate((e) => getComputedStyle(e, "::before").transitionDuration),
    "0s",
  );
  await q.getByRole("button", { name: "Close editor", exact: true }).click();
  await q.locator("dialog").waitFor({ state: "detached" });
  await reduced.close();
  console.log(
    "PASS: corrupt draft recovery, spring interruption, direct keyboard Home, and reduced-motion mode.",
  );
} finally {
  await b.close();
}
