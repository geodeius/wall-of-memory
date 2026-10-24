import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const [width, height] of [
    [1440, 900],
    [1280, 720],
    [768, 1024],
    [390, 844],
    [320, 720],
    [844, 390],
    [390, 450],
  ]) {
    const c = await browser.newContext({
      viewport: { width, height },
      hasTouch: width < 900,
      isMobile: width < 600,
    });
    const p = await c.newPage();
    p.setDefaultTimeout(12000);
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto("http://localhost:5186");
    await p.getByRole("button", { name: "Add a mark", exact: true }).waitFor();
    await p
      .getByRole("button", { name: "About the wall", exact: true })
      .click();
    await p.getByRole("dialog", { name: "A wall for all of us." }).waitFor();
    await p.keyboard.press("Escape");
    await p.getByRole("dialog").waitFor({ state: "detached" });
    assert.equal(
      await p
        .getByRole("button", { name: "About the wall", exact: true })
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await p.screenshot({
      path: `artifacts/review-after/wall-${width}x${height}.png`,
    });
    await p.getByRole("button", { name: "Add a mark", exact: true }).click();
    await p.getByLabel(/Your message/).fill("A little hello");
    await p.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all(
        document.getAnimations().map((a) => a.finished.catch(() => {})),
      );
    });
    const d = await p.locator(".editor-dialog").boundingBox(),
      pub = await p
        .getByRole("button", { name: "Publish your mark", exact: true })
        .boundingBox();
    assert.ok(
      pub.y >= d.y && pub.y + pub.height <= d.y + d.height + 1,
      "Publish visible " + width + "x" + height,
    );
    assert.ok(d.y >= 0 && d.y + d.height <= height + 1, "Dialog contained");
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    const colors = await p.locator(".palette button").evaluateAll((els) =>
      els.map((e) => ({
        width: e.getBoundingClientRect().width,
        height: e.getBoundingClientRect().height,
      })),
    );
    assert.ok(colors.every((b) => b.width >= 44 && b.height >= 44));
    await p.screenshot({
      path: `artifacts/review-after/editor-${width}x${height}.png`,
    });
    await p.getByText("Style your mark", { exact: true }).click();
    await p.getByLabel(/Your name/).fill("A visitor");
    await p.getByLabel(/Letter size/).fill("60");
    await p
      .getByLabel(/Your message/)
      .fill(
        "A long message with enough words to exercise the mark preview and keep publishing usable on a smaller screen. Hello, wall!".slice(
          0,
          120,
        ),
      );
    assert.equal(
      await p
        .locator(".editor-body")
        .evaluate((el) => el.scrollWidth > el.clientWidth),
      false,
      "Body horizontal overflow",
    );
    const finalPub = await p
      .getByRole("button", { name: "Publish your mark", exact: true })
      .boundingBox();
    assert.ok(finalPub.y + finalPub.height <= height + 1);
    await p.keyboard.press("Escape");
    await p.getByRole("dialog").waitFor({ state: "detached" });
    await p.getByRole("button", { name: "Add a mark", exact: true }).click();
    await p.getByRole("button", { name: "Draw / sign", exact: true }).click();
    const pad = p.locator(".drawing-pad");
    await pad.scrollIntoViewIfNeeded();
    const box = await pad.boundingBox();
    await p.mouse.move(box.x + 20, box.y + 20);
    await p.mouse.down();
    await p.mouse.move(box.x + 120, box.y + 50, { steps: 10 });
    await p.mouse.up();
    assert.equal(await pad.locator("path").count(), 1);
    await p.getByRole("button", { name: "Clear", exact: true }).click();
    assert.equal(await pad.locator("path").count(), 0);
    await p.getByRole("button", { name: "Undo", exact: true }).click();
    assert.equal(await pad.locator("path").count(), 1);
    await p.getByText("Style your mark", { exact: true }).click();
    await p.getByLabel("Stroke width", { exact: true }).fill("72");
    await p
      .getByRole("button", { name: "Write something", exact: true })
      .click();
    assert.ok(+(await p.getByLabel(/Letter size/).inputValue()) <= 60);
    assert.deepEqual(errors, []);
    results.push({
      width,
      height,
      publishVisible: true,
      colors44px: true,
      focusRestored: true,
      clearUndo: true,
      modeSizeValid: true,
      errors,
    });
    await c.close();
    console.log("PASS " + width + "x" + height);
  }
  await mkdir("artifacts/review-after", { recursive: true });
  await writeFile(
    "artifacts/review-after/studio-checks.json",
    JSON.stringify(results, null, 2),
  );
} finally {
  await browser.close();
}
