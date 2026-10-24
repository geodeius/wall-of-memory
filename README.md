# The Wall

An independent React + TypeScript + Vite community graffiti wall. The portfolio at `../New portfolio` is unchanged. Its mural and plaster assets are reused, with a new nonrepeating collection of SVG decorations. Curated art is kept in `Art.tsx`; real visitor marks live in PostgreSQL. No fabricated visitors are seeded.

## Run locally

Requires Node 22+ and PostgreSQL 14+.

```sh
npm install
cp .env.example .env
# Fill DATABASE_URL, OWNER_SECRET and MODERATION_TOKEN with your own values.
# Generate distinct secrets: openssl rand -hex 32
npm run dev
```

Open http://localhost:5186. The API runs on port 3186; Vite forwards `/api` there. Without DATABASE_URL, exploration and draft editing work, but publishing explicitly returns unavailable. Browser storage holds drafts only. A local development `.env` and isolated PostgreSQL instance on port 55432 were created during implementation; neither is a hosted service. That database uses `/tmp/community-wall-pg` and is disposable. To restart it while its files exist:

```sh
pg_ctl -D /tmp/community-wall-pg -l /tmp/community-wall-pg.log -o '-p 55432 -h 127.0.0.1' start
```

## Implementation

- `src/useCamera.ts`: mutable camera and direct DOM transforms, frame-scheduled state, wheel panning and focal zoom.
- `src/main.tsx`: pointer capture, drag threshold, two-pointer pinch, keyboard exploration, controls, accessible visitor list and moderation interface.
- `src/Art.tsx`, `src/MarkView.tsx`: curated SVG/art and memoized visitor rendering. Art is placed once, not tiled into wallpaper. The plaster texture repeats beneath paint.
- `src/Editor.tsx`: native modal focus containment/Escape, text/lettering, per-stroke drawing ink, undo/redo/clear, preview, draft recovery and retry.
- `src/useWallData.ts`: overscanned world bounds, abortable requests, debouncing, bounded 16-region cache and visible rendering. Zoom is included in region requests. Up to 1,000 newest marks are returned per queried area; extreme density needs zoom-based aggregation or pagination before large-scale launch.
- `server/index.js`: shared API, anonymous ownership, reports, protected moderation and rate limits.
- `server/validation.js`: allowlisted fields, colors, dimensions and bounded point data. Text is rendered as React text; no user HTML or SVG is accepted.

World origin is the center of the starting mural. Positions do not depend on device dimensions. Arrow keys pan, Home resets, Enter opens placement. Wheel pans; control-wheel/trackpad pinch zooms around the pointer. Touch supports dragging and pinch zoom. The explicit Add a mark button places at the current view center. Native dialogs trap focus; closing restores wall focus. Text is always available as an alternative to freehand input.

## Database and migration

`server/schema.sql` is an idempotent initial migration, applied at API startup. For controlled deployment, apply it once with `psql "$DATABASE_URL" -f server/schema.sql`, then run with a suitably restricted database account. Future schema changes should be separately versioned migrations.

Marks store JSON settings, indexed world coordinates, creation time, visibility status, ownership hash and a keyed visitor hash. Curated art never goes into the visitor table. The anonymous owner receives a random HttpOnly SameSite cookie; only its HMAC is stored. Removing cookies loses ownership. Raw IPs are not stored; keyed IP hashes enforce five successful new submissions per hour. Deleting a mark does not reset that limit. Stable draft IDs make publishing retries idempotent. Drawing limits: 60 strokes, 400 points each, 280×140 point area, 1–6px width, 256KB request body. Text: 120 characters; names: 30; tilt: ±15°. Reports: 20 per hour, deduplicated per mark and visitor.

Submissions publish immediately. Wall notes exposes reporting, per-visit hiding, and owner deletion. About → Moderator access opens the protected queue. Moderators supply MODERATION_TOKEN, kept only in component memory. Queue actions approve (restore/clear reports), hide, or permanently delete. The server never sends moderation secrets or ownership hashes to the browser.

For a reverse proxy, keep Express's default proxy trust unless you configure trusted proxy hops for your deployment. Without that configuration, IP limits apply to the proxy as a whole. Do not blindly trust forwarded IP headers. Use HTTPS, secure production cookies, a correct APP_ORIGIN, database TLS settings required by the host, and distinct strong secrets. Add gateway request throttles/CAPTCHA when actual abuse requires them. Secret rotation invalidates existing ownership hashes. The moderator token is a simple launch foundation; use authenticated individual moderator accounts and an audit trail for a team.

## API

| Method | Endpoint                                     | Purpose                                                            |
| ------ | -------------------------------------------- | ------------------------------------------------------------------ |
| GET    | `/api/health`                                | Database health                                                    |
| GET    | `/api/marks?left=&top=&right=&bottom=&zoom=` | Visible area, newest first                                         |
| POST   | `/api/marks`                                 | Validate and publish a mark                                        |
| POST   | `/api/marks/:id/report`                      | Report a mark                                                      |
| DELETE | `/api/marks/:id`                             | Remove an owned mark                                               |
| GET    | `/api/moderation`                            | Reported marks; bearer token required                              |
| POST   | `/api/moderation/:id`                        | `{action: "hide" \| "approve" \| "delete"}`; bearer token required |

## Verification

```sh
npm test
npm run build
node scripts/check-api.mjs       # needs the configured local API and database
npx playwright install chromium
node scripts/check-browser.mjs   # needs the local Vite app and API
node scripts/check-density.mjs   # seeds/removes 1,000 test marks in your local DB
```

The API script creates clearly labeled fixtures and removes them. Each run consumes two real rate-limit slots. Browser checks cover drag/click separation, keyboard pan/reset, zoom, failed publishing with draft recovery, publishing/reload, a second isolated mobile browser session, ownership, reports, drawing undo/redo, pinch touch events, and mobile overflow. Browser screenshots are written to ignored `artifacts/`.

Local database and browser verification is not proof of deployed persistence, real iOS/Android gestures, or assistive-technology compatibility. Those require testing on the deployed origin and physical devices.

## Deploy and operate

1. Provision a PostgreSQL database; configure backups and TLS.
2. Configure DATABASE_URL, OWNER_SECRET, MODERATION_TOKEN, APP_ORIGIN and NODE_ENV=production as server secrets. Do not prefix secrets with VITE_.
3. Run `npm ci && npm run build`, then `npm start`. Set PORT for the host. Express serves the built app and API on one origin. Vite is development-only.
4. Probe `/api/health`, monitor structured `request_failed` logs and 429/5xx rates, and routinely review the moderation queue. No external monitoring provider is wired in.
5. Schedule deletion of `wall_submissions` older than 24 hours and old report records as appropriate to your moderation retention policy. Visitor hashes attached to published marks remain until the mark is deleted; minimize access and define a retention policy before launch.
6. Verify two separate browsers can publish/read on the deployed URL, test mobile keyboards and touch on physical devices, review keyboard/screen-reader workflows, and profile your expected peak mark density.

This workspace is a working local implementation. No production database, public deployment, external monitoring, or physical-device certification is claimed.

### Recorded local verification

On 24 October 2026, the production build, three server validation tests, the API integration script, and the desktop/mobile Chromium browser script passed. A 1,000-mark synthetic density check rendered 975 marks during panning, with a measured 95th-percentile frame interval of 16.8 ms and a maximum of 83.3 ms on this machine. This is a local smoke profile, not a guarantee for all hardware. Density fixtures were removed afterward.
