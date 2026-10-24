# Security review — 2026-10-24

Scope: source review of public publishing, browser ownership, reporting, moderator access, input validation, secret handling, dependency audit, and deployment headers. This is an application review, not an independent penetration test.

## Findings addressed locally

- Added a production Content Security Policy, restricted embedding with CSP, disabled unused camera/microphone/location permissions, and retained no-sniff/referrer protection. Framing permits the same origin, the local portfolio at `http://localhost:5173`, and the live portfolio at `https://georgeantwi.vercel.app`; other origins remain blocked. Headers apply to Vercel static files as well as API responses. Inline styles remain allowed because rendering uses positioned React styles; inline scripts and external script hosts are blocked.
- Added database-backed failed moderator authentication limits: 30 failures per visitor IP hash per 15 minutes. Valid credentials remain usable even after failed requests from the same IP. Expired counters are pruned. This works across serverless instances.
- Reject cross-site browser writes using Origin and Fetch Metadata, and require JSON for POST bodies. Requests from direct API clients without browser Origin headers remain possible; this is a public API, not bot prevention.
- Normalize nested drawing data so unknown stroke properties cannot be stored.

## Existing protections checked

- Parameterized SQL; bounded mark, drawing and viewport data.
- React text rendering rather than insertion of user HTML.
- High-entropy browser ownership tokens stored in HttpOnly, SameSite=Lax cookies; Secure in production. Only an owning browser can use the public delete endpoint.
- Constant-time moderator token comparison; absent/incorrect tokens deny access.
- Public responses exclude owner and visitor hashes. Hidden marks are excluded from public reads.
- Database-backed publishing and reporting limits. Deleted marks do not reset publishing quotas.
- JSON body size limit and generic errors without database details.
- Current configured secrets were absent from tracked files and built browser assets. Ignored secret files remain local; Git history and provider account access were outside this scan.
- Dependency audit found zero known vulnerabilities in both production-only and full installed dependencies at review time.

## Validation

Six automated tests; local integration probes for ownership isolation, visibility after moderator hide, invalid and valid moderator authorization, shared throttling, foreign origins, content types, malformed JSON, cookie flags, and private-field filtering. Fixtures are limited to local storage. Browser smoke checks exercise the production CSP on the compiled app. Build passes.

## Remaining limits

- These fixes are not deployed yet. Read-only inspection of the public site confirmed its current homepage lacked CSP and framing restrictions.
- Automatic approval intentionally permits offensive content to appear before reports are reviewed.
- Distributed bots can bypass IP quotas; public reads and malformed requests do not have an application-wide edge rate limit. Configure provider firewall/rate limits for exposure to significant hostile traffic.
- Moderation uses a shared bearer secret, with no individual accounts, MFA, action audit trail, or per-person revocation. Anyone holding the secret can moderate.
- Storage has no global capacity quota, and request limits do not cap total hosting/database spend.

Reference: Express production security guidance: https://expressjs.com/advanced/best-practice-security/
