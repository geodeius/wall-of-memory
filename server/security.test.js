import test from "node:test";
import assert from "node:assert/strict";
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
test("production CSP blocks executable inline content, framing and plugins", () => {
  const csp = browserHeaders["Content-Security-Policy"];
  assert.match(csp, /script-src 'self';/);
  assert.match(csp, /object-src 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(browserHeaders["X-Frame-Options"], "DENY");
});
