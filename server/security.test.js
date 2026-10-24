import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { browserHeaders, rejectCrossSiteWrite } from "./security.js";
test("blocks foreign browser writes including requests without Origin", () => {
  const origin = "https://wall.example";
  for (const method of ["POST", "DELETE", "PUT"]) {
    assert.equal(
      rejectCrossSiteWrite(
        { method, headers: { origin: "https://evil.example" } },
        origin,
      ),
      true,
    );
    assert.equal(
      rejectCrossSiteWrite(
        { method, headers: { "sec-fetch-site": "cross-site" } },
        origin,
      ),
      true,
    );
    assert.equal(
      rejectCrossSiteWrite({ method, headers: { origin } }, origin),
      false,
    );
  }
  assert.equal(
    rejectCrossSiteWrite(
      { method: "GET", headers: { origin: "https://evil.example" } },
      origin,
    ),
    false,
  );
});
test("production CSP restricts framing and blocks executable inline content and plugins", () => {
  const csp = browserHeaders["Content-Security-Policy"];
  assert.match(csp, /script-src 'self';/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'self' http:\/\/localhost:5173$/);
  assert.equal(browserHeaders["X-Frame-Options"], undefined);
  const config = JSON.parse(
    readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
  );
  const headers = config.headers[0].headers;
  assert.equal(
    headers.find((h) => h.key === "Content-Security-Policy").value,
    csp,
  );
  assert.equal(
    headers.some((h) => h.key === "X-Frame-Options"),
    false,
  );
});
