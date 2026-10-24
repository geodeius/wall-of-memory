import pg from "pg";
import { chromium } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
const env = Object.fromEntries(
  (await readFile(".env", "utf8"))
    .split("\n")
    .filter(Boolean)
    .map((s) => {
      const i = s.indexOf("=");
      return [s.slice(0, i), s.slice(i + 1)];
    }),
);
const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const owner = "density-test-" + randomUUID();
let browser;
try {
  await pool.query(
    `INSERT INTO wall_marks(id,entry,x,y,owner_hash,visitor_hash) SELECT gen_random_uuid(),jsonb_build_object('kind','text','x',(i%40)*45-900,'y',(i/40)*45-560,'width',280,'height',140,'rotation',0,'text','test','name','','color','#303a36','font','hand','size',24,'strokes','[]'::jsonb),(i%40)*45-900,(i/40)*45-560,$1,$1 FROM generate_series(0,999) i`,
    [owner],
  );
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1365, height: 900 },
  });
  await page.goto("http://localhost:5186");
  await page.waitForFunction(
    () => document.querySelectorAll(".mark").length > 800,
  );
  await page.evaluate(() => {
    window.__frames = [];
    let last = performance.now(),
      n = 0;
    function tick(now) {
      window.__frames.push(now - last);
      last = now;
      if (++n < 120) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  await page.mouse.move(100, 450);
  await page.mouse.down();
  await page.mouse.move(600, 450, { steps: 100 });
  await page.mouse.up();
  await page.waitForFunction(() => window.__frames.length === 120);
  const metrics = await page.evaluate(() => {
    const times = window.__frames.slice(5).sort((a, b) => a - b);
    return {
      rendered: document.querySelectorAll(".mark").length,
      p95FrameMs: Math.round(times[Math.floor(times.length * 0.95)] * 10) / 10,
      maxFrameMs: Math.round(times.at(-1) * 10) / 10,
    };
  });
  assert.ok(metrics.rendered <= 1000);
  assert.ok(metrics.p95FrameMs < 80, JSON.stringify(metrics));
  await mkdir("artifacts", { recursive: true });
  await writeFile("artifacts/density.json", JSON.stringify(metrics, null, 2));
  console.log("PASS: dense viewport pan", metrics);
} finally {
  if (browser) await browser.close();
  await pool.query("DELETE FROM wall_marks WHERE owner_hash=$1", [owner]);
  await pool.end();
}
