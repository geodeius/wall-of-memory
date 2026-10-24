import express from "express";
import pg from "pg";
import {
  randomUUID,
  randomBytes,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { readFile } from "node:fs/promises";
import { validate } from "./validation.js";
const app = express(),
  port = Number(process.env.PORT || 3001),
  pool = process.env.DATABASE_URL
    ? new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        max: 5,
        idleTimeoutMillis: 10000,
        connectionTimeoutMillis: 10000,
      })
    : null;
const secret = process.env.OWNER_SECRET;
if (pool && !secret)
  throw Error("Set OWNER_SECRET before connecting a shared database.");
if (pool)
  await pool.query(
    await readFile(new URL("./schema.sql", import.meta.url), "utf8"),
  );
if (process.env.VERCEL) app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(express.json({ limit: "256kb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  next();
});
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (
    req.method !== "GET" &&
    req.headers.origin &&
    req.headers.origin !==
      (process.env.APP_ORIGIN ||
        (process.env.NODE_ENV === "production"
          ? `https://${req.headers.host}`
          : "http://localhost:5186"))
  )
    return res
      .status(403)
      .json({ error: "Cross-origin writes are not allowed." });
  if (!pool)
    return res
      .status(503)
      .json({ error: "Shared storage is not configured yet." });
  next();
});
const hash = (s) =>
  createHmac("sha256", secret || "development")
    .update(s)
    .digest("hex");
function identity(req, res) {
  const raw = String(req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("wall_owner="))
    ?.slice(11);
  const token = /^[a-f0-9]{64}$/.test(raw || "")
    ? raw
    : randomBytes(32).toString("hex");
  if (token !== raw)
    res.cookie("wall_owner", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 365 * 86400000,
      path: "/",
    });
  return hash(token);
}
const visitor = (req) => hash(req.ip || "unknown");
function entry(row, owner) {
  return {
    ...row.entry,
    id: row.id,
    created_at: row.created_at,
    owned: owner === row.owner_hash,
  };
}
app.get("/api/health", async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
});
app.get("/api/marks", async (req, res) => {
  const b = ["left", "top", "right", "bottom"].map((k) => Number(req.query[k]));
  if (
    b.some((n) => !Number.isFinite(n) || Math.abs(n) > 1e9 + 100000) ||
    b[2] < b[0] ||
    b[3] < b[1] ||
    b[2] - b[0] > 30000 ||
    b[3] - b[1] > 30000
  )
    return res.status(400).json({ error: "Invalid viewport bounds." });
  const owner = identity(req, res);
  const rows = await pool.query(
    "SELECT * FROM wall_marks WHERE status='visible' AND x BETWEEN $1-400 AND $3+400 AND y BETWEEN $2-400 AND $4+400 ORDER BY created_at DESC LIMIT 1000",
    b,
  );
  res.json(rows.rows.map((r) => entry(r, owner)));
});
app.post("/api/marks", async (req, res) => {
  let data;
  try {
    data = validate(req.body);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  const owner = identity(req, res),
    v = visitor(req),
    client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [v]);
    const prior = await client.query(
      "SELECT * FROM wall_marks WHERE id=$1 AND owner_hash=$2",
      [
        /^[0-9a-f-]{36}$/i.test(req.body.id || "")
          ? req.body.id
          : "00000000-0000-0000-0000-000000000000",
        owner,
      ],
    );
    if (prior.rows.length) {
      await client.query("COMMIT");
      return res.json(entry(prior.rows[0], owner));
    }
    const count = await client.query(
      "SELECT count(*) FROM wall_submissions WHERE visitor_hash=$1 AND created_at>now()-interval '1 hour'",
      [v],
    );
    if (Number(count.rows[0].count) >= 5) {
      await client.query("ROLLBACK");
      return res.status(429).json({
        error:
          "Five marks per hour keeps room for everyone. Please try again later.",
      });
    }
    const id = /^[0-9a-f-]{36}$/i.test(req.body.id || "")
      ? req.body.id
      : randomUUID();
    const row = await client.query(
      "INSERT INTO wall_marks(id,entry,x,y,owner_hash,visitor_hash) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(id) DO NOTHING RETURNING *",
      [id, data, data.x, data.y, owner, v],
    );
    if (row.rows.length)
      await client.query(
        "INSERT INTO wall_submissions(visitor_hash) VALUES($1)",
        [v],
      );
    await client.query("COMMIT");
    if (!row.rows.length) {
      const existing = await pool.query(
        "SELECT * FROM wall_marks WHERE id=$1 AND owner_hash=$2",
        [id, owner],
      );
      if (!existing.rows.length)
        return res
          .status(409)
          .json({ error: "Please reopen the editor and retry." });
      return res.json(entry(existing.rows[0], owner));
    }
    res.status(201).json(entry(row.rows[0], owner));
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});
app.param("id", (req, res, next, id) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ? next()
    : res.status(400).json({ error: "Invalid mark ID." }),
);
app.post("/api/marks/:id/report", async (req, res) => {
  const v = visitor(req),
    client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [v]);
    const count = await client.query(
      "SELECT count(*) FROM wall_reports WHERE visitor_hash=$1 AND created_at>now()-interval '1 hour'",
      [v],
    );
    if (Number(count.rows[0].count) >= 20) {
      await client.query("ROLLBACK");
      return res
        .status(429)
        .json({ error: "Report limit reached. Please try later." });
    }
    const found = await client.query("SELECT id FROM wall_marks WHERE id=$1", [
      req.params.id,
    ]);
    if (!found.rowCount) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Mark not found." });
    }
    await client.query(
      "INSERT INTO wall_reports(mark_id,visitor_hash) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [req.params.id, v],
    );
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});
app.delete("/api/marks/:id", async (req, res) => {
  const result = await pool.query(
    "DELETE FROM wall_marks WHERE id=$1 AND owner_hash=$2",
    [req.params.id, identity(req, res)],
  );
  res
    .status(result.rowCount ? 200 : 404)
    .json(
      result.rowCount
        ? { ok: true }
        : { error: "Mark not found or not owned by this browser." },
    );
});
app.use("/api/moderation", (req, res, next) => {
  const expected = process.env.MODERATION_TOKEN,
    token = String(req.headers.authorization || "").replace(/^Bearer /, "");
  if (
    !expected ||
    Buffer.byteLength(token) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(token), Buffer.from(expected))
  )
    return res.status(403).json({ error: "Moderator access denied." });
  next();
});
app.get("/api/moderation", async (req, res) => {
  const rows = await pool.query(
    "SELECT m.* FROM wall_marks m WHERE EXISTS(SELECT 1 FROM wall_reports r WHERE r.mark_id=m.id) ORDER BY m.created_at DESC LIMIT 100",
  );
  res.json(rows.rows.map((r) => entry(r, null)));
});
app.post("/api/moderation/:id", async (req, res) => {
  const action = req.body.action;
  if (!["hide", "approve", "delete"].includes(action))
    return res.status(400).json({ error: "Invalid action." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (action === "delete")
      await client.query("DELETE FROM wall_marks WHERE id=$1", [req.params.id]);
    else {
      await client.query("UPDATE wall_marks SET status=$1 WHERE id=$2", [
        action === "hide" ? "hidden" : "visible",
        req.params.id,
      ]);
      await client.query("DELETE FROM wall_reports WHERE mark_id=$1", [
        req.params.id,
      ]);
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Endpoint not found." }),
);
app.use(express.static("dist"));
app.get("/{*path}", (req, res) =>
  res.sendFile(new URL("../dist/index.html", import.meta.url).pathname),
);
app.use((error, req, res, next) => {
  console.error(
    JSON.stringify({
      event: "request_failed",
      method: req.method,
      path: req.path,
      code: error.code || "internal",
    }),
  );
  res.status(error.status || 500).json({
    error:
      error.status === 413
        ? "Drawing is too large. Remove a few strokes."
        : "The wall could not save your request. Please try again.",
  });
});
export default app;
if (!process.env.VERCEL) {
  app.listen(port, () =>
    console.log(
      `Wall API listening on http://localhost:${port}; shared database ${pool ? "connected" : "not configured"}`,
    ),
  );
}
