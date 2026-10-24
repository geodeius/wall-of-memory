import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
const db = new URL(process.env.DATABASE_URL);
assert.ok(
  ["localhost", "127.0.0.1"].includes(db.hostname),
  "Security fixtures must use local storage",
);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const base = "http://localhost:3190";
const id = randomUUID();
const data = {
  kind: "text",
  x: 0,
  y: 0,
  width: 280,
  height: 140,
  rotation: 0,
  text: "<img src=x onerror=alert(1)>",
  name: "",
  color: "#303a36",
  font: "hand",
  size: 36,
  strokes: [],
};
await pool.query("DELETE FROM wall_auth_limits");
try {
  await pool.query(
    "INSERT INTO wall_marks(id,entry,x,y,owner_hash,visitor_hash) VALUES($1,$2,0,0,$3,$4)",
    [id, data, randomUUID(), randomUUID()],
  );
  const read = await fetch(
    `${base}/api/marks?left=-100&right=100&top=-100&bottom=100`,
  );
  assert.equal(read.status, 200);
  const cookie = read.headers.get("set-cookie");
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=Lax/i);
  const mark = (await read.json()).find((m) => m.id === id);
  assert.equal(mark.owned, false);
  assert.equal(mark.owner_hash, undefined);
  assert.equal(mark.visitor_hash, undefined);
  assert.equal(
    (await fetch(`${base}/api/marks/${id}`, { method: "DELETE" })).status,
    404,
  );
  assert.equal(
    (
      await fetch(`${base}/api/marks/${id}`, {
        method: "DELETE",
        headers: { origin: "https://evil.example" },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(`${base}/api/marks`, {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "{}",
      })
    ).status,
    415,
  );
  assert.equal(
    (
      await fetch(`${base}/api/marks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
      })
    ).status,
    400,
  );
  for (let i = 0; i < 31; i++) {
    const r = await fetch(`${base}/api/moderation`, {
      headers: { authorization: "Bearer invalid-security-test" },
    });
    assert.equal(r.status, i < 30 ? 403 : 429);
  }
  const auth = { authorization: `Bearer ${process.env.MODERATION_TOKEN}` };
  assert.equal(
    (await fetch(`${base}/api/moderation`, { headers: auth })).status,
    200,
    "Valid moderator is not locked out by bad attempts",
  );
  const change = await fetch(`${base}/api/moderation/${id}`, {
    method: "POST",
    headers: { ...auth, "content-type": "application/json" },
    body: JSON.stringify({ action: "hide" }),
  });
  assert.equal(change.status, 200);
  const after = await fetch(
    `${base}/api/marks?left=-100&right=100&top=-100&bottom=100`,
  );
  assert.ok(!(await after.json()).some((m) => m.id === id));
  assert.equal(read.headers.get("x-frame-options"), "DENY");
  console.log(
    "PASS ownership isolation, hidden visibility, moderator auth/throttling, cross-origin writes, content types, malformed JSON, cookie flags and private-field filtering",
  );
} finally {
  await pool.query("DELETE FROM wall_auth_limits");
  await pool.query("DELETE FROM wall_marks WHERE id=$1", [id]);
  await pool.end();
}
