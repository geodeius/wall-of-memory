import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const env = Object.fromEntries(
  (await readFile(".env", "utf8"))
    .split("\n")
    .filter(Boolean)
    .map((s) => {
      const i = s.indexOf("=");
      return [s.slice(0, i), s.slice(i + 1)];
    }),
);
const base = "http://localhost:3186";
const ids = [];
let cookie = "";
const bounds = "/api/marks?left=-1000&right=1000&top=-1000&bottom=1000";
async function request(path, method = "GET", body, extra = {}) {
  const r = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
      ...extra,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (r.headers.get("set-cookie"))
    cookie = r.headers.get("set-cookie").split(";")[0];
  return { status: r.status, data: await r.json() };
}
const mark = {
  kind: "text",
  x: 160,
  y: 160,
  width: 280,
  height: 140,
  rotation: 0,
  text: "API verification fixture",
  name: "",
  color: "#303a36",
  font: "hand",
  size: 36,
  strokes: [],
};
try {
  assert.equal((await request("/api/health")).status, 200);
  assert.equal((await request("/api/marks")).status, 400);
  assert.equal(
    (await request("/api/marks", "POST", { ...mark, x: Infinity })).status,
    400,
  );
  const create = await request("/api/marks", "POST", mark);
  assert.equal(create.status, 201);
  ids.push(create.data.id);
  assert.equal(create.data.owned, true);
  assert.equal(
    (await request(bounds)).data.some((m) => m.id === ids[0]),
    true,
  );
  const other = await fetch(base + bounds);
  const otherCookie = other.headers.get("set-cookie").split(";")[0];
  assert.equal((await other.json()).find((m) => m.id === ids[0]).owned, false);
  assert.equal(
    (
      await request(`/api/marks/${ids[0]}`, "DELETE", undefined, {
        Cookie: otherCookie,
      })
    ).status,
    404,
  );
  assert.equal(
    (await request(`/api/marks/${ids[0]}/report`, "POST", {})).status,
    200,
  );
  assert.equal((await request("/api/moderation")).status, 403);
  const auth = { Authorization: `Bearer ${env.MODERATION_TOKEN}` };
  assert.equal(
    (await request("/api/moderation", "GET", undefined, auth)).data.some(
      (m) => m.id === ids[0],
    ),
    true,
  );
  assert.equal(
    (
      await request(
        `/api/moderation/${ids[0]}`,
        "POST",
        { action: "hide" },
        auth,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request(bounds)).data.some((m) => m.id === ids[0]),
    false,
  );
  await request(
    `/api/moderation/${ids[0]}`,
    "POST",
    { action: "approve" },
    auth,
  );
  assert.equal(
    (await request(bounds)).data.some((m) => m.id === ids[0]),
    true,
  );
  const drawing = await request("/api/marks", "POST", {
    ...mark,
    kind: "drawing",
    text: "",
    strokes: [
      {
        color: "#303a36",
        width: 3,
        points: [
          [1, 1],
          [100, 70],
        ],
      },
    ],
  });
  assert.equal(drawing.status, 201);
  ids.push(drawing.data.id);
  assert.equal(
    (await request(`/api/marks/${drawing.data.id}`, "DELETE")).status,
    200,
  );
  assert.equal((await request(`/api/marks/${ids[0]}`, "DELETE")).status, 200);
  console.log(
    "PASS: database persistence, separate visitor ownership, validation, reports, authorization, hide, approve, drawing and owned deletion.",
  );
} finally {
  for (const id of ids)
    await request(
      `/api/moderation/${id}`,
      "POST",
      { action: "delete" },
      { Authorization: `Bearer ${env.MODERATION_TOKEN}` },
    );
}
