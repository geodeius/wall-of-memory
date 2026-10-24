export const browserHeaders = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'",
};
export function rejectCrossSiteWrite(req, expectedOrigin) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return false;
  return (
    req.headers["sec-fetch-site"] === "cross-site" ||
    Boolean(req.headers.origin && req.headers.origin !== expectedOrigin)
  );
}
