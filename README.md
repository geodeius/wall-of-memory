# The Wall

A shared community graffiti wall where anyone can leave a message, drawing, or signature. Explore an open canvas of colorful artwork, find a spot, and add something of your own.

The Wall is about small acts of expression and connection: a thought, a doodle, a kind reminder, or a little hello. There are no perfect lines required.

## Features

- Explore in every direction with dragging, scrolling, touch gestures, or keyboard controls.
- Write short messages or draw with a mouse, pen, or touch screen.
- Compose in a bottom editing palette with a live preview for messages and drawings. Choose ink colors, and open Style your mark for lettering, size, rotation, and an optional name.
- Undo, redo, and clear drawing strokes.
- Recover unfinished drafts and retry after a network error.
- Share published marks across visitors and devices through PostgreSQL.
- Browse nearby contributions in a list, report content, hide marks for your visit, and remove your own submissions.
- Review reported contributions through a protected moderation queue.

## Stack

React, TypeScript, and Vite power the interface. An Express API handles validation, publishing, ownership, and moderation, with PostgreSQL for shared storage. Artwork and visitor marks use DOM and SVG rendering.

## Local setup

### Requirements

- Node.js 22 or later
- npm
- PostgreSQL 14 or later

### Install and configure

```sh
git clone https://github.com/geodeius/wall-of-memory.git
cd wall-of-memory
npm install
cp .env.example .env
```

Create a PostgreSQL database, then update `.env`:

```dotenv
DATABASE_URL=postgresql://user:password@localhost:5432/community_wall
OWNER_SECRET=replace-with-a-random-secret
MODERATION_TOKEN=replace-with-a-different-random-secret
PORT=3186
APP_ORIGIN=http://localhost:5186
```

Generate each secret separately:

```sh
openssl rand -hex 32
```

Keep `.env` private. It is excluded from Git. Server secrets must never use the `VITE_` prefix, which exposes values to the browser.

### Start the app

```sh
npm run dev
```

Open [localhost:5186](http://localhost:5186). The API runs on port 3186, and Vite forwards `/api` requests to it. Keep the local API port at 3186 unless you also update the proxy in `vite.config.ts`.

The API applies the initial schema automatically at startup. A configured database also requires `OWNER_SECRET`. Without a database, you can explore and prepare drafts, but publishing is unavailable. Browser storage retains drafts; published marks are stored in PostgreSQL.

## Using the wall

| Action                       | Control                                                                   |
| ---------------------------- | ------------------------------------------------------------------------- |
| Explore                      | Drag, scroll, or use the arrow keys while the wall is focused             |
| Zoom                         | Pinch, use control-wheel, or select the zoom buttons                      |
| Return to the starting mural | Select Back to start or press Home                                        |
| Add a contribution           | Click a spot, select Add a mark, or press Enter while the wall is focused |
| Close an editor or panel     | Select its close button or press Escape                                   |
| Browse nearby contributions  | Open Wall notes                                                           |

Marks use world coordinates, so their positions remain consistent across screen sizes. Add a mark selects the center of your current view. Messages provide an alternative to freehand drawing.

## Community and moderation

Keep contributions kind. Share your own words and drawings, and leave out hate, harassment, spam, and private information.

Submissions publish immediately. Wall notes provides reporting, hiding for the current visit, and deletion of your own marks. Anonymous ownership uses an HttpOnly, SameSite cookie. Clearing that cookie removes your ability to manage earlier submissions.

To review reports, open About the wall → Moderator access and enter the server's `MODERATION_TOKEN`. Moderators can approve a mark and clear its reports, hide it, or permanently delete it. The token remains in component memory for the current session.

Server limits include:

- Five new contributions per visitor IP per hour; deleting a mark does not reset the limit.
- Messages up to 120 characters and optional names up to 30 characters.
- Drawings up to 60 strokes, with 400 points per stroke and a 256 KB request limit.
- Twenty reports per visitor IP per hour, deduplicated per contribution.

Raw IP addresses are not stored. Rate limits use keyed hashes, and ownership tokens are stored as hashes. Rotating `OWNER_SECRET` invalidates existing ownership hashes.

## Project structure

| File                   | Responsibility                                                            |
| ---------------------- | ------------------------------------------------------------------------- |
| `src/main.tsx`         | Wall interactions, controls, contribution list, and moderation interface  |
| `src/useCamera.ts`     | Camera coordinates, transforms, panning, and zoom                         |
| `src/useWallData.ts`   | Viewport loading, request cancellation, and region caching                |
| `src/Art.tsx`          | Curated mural artwork and decorations                                     |
| `src/MarkView.tsx`     | Visitor contribution rendering                                            |
| `src/MarkPreview.tsx`  | Fitted live preview for text and drawings                                 |
| `src/useModal.ts`      | Accessible modal lifecycle, focus restoration, and visual viewport sizing |
| `src/draft.ts`         | Normalization and recovery of saved drafts                                |
| `src/Editor.tsx`       | Messages, drawing tools, previews, and draft recovery                     |
| `server/index.js`      | API, ownership, moderation, and rate limits                               |
| `server/validation.js` | Server-side field and drawing validation                                  |
| `server/schema.sql`    | Initial database schema and indexes                                       |

Curated artwork is separate from visitor data. Text is rendered as text, and drawings are constructed from validated points. Contributions cannot contain arbitrary HTML or executable SVG.

Viewport queries return up to 1,000 newest marks per area. The interface renders nearby marks and keeps a bounded region cache. Very dense walls need aggregation or pagination beyond this limit.

## Database setup

`server/schema.sql` is an idempotent initial migration. To apply it explicitly, set `DATABASE_URL` in your shell and run:

```sh
psql "$DATABASE_URL" -f server/schema.sql
```

The schema contains contributions, reports, and submission rate-limit records. Use separately versioned migrations for future schema changes. Configure database access, TLS, and backups for your hosting environment.

## API

| Method | Endpoint                                     | Purpose                                            |
| ------ | -------------------------------------------- | -------------------------------------------------- |
| GET    | `/api/health`                                | Check database health                              |
| GET    | `/api/marks?left=&top=&right=&bottom=&zoom=` | Read contributions in a viewport                   |
| POST   | `/api/marks`                                 | Publish a validated contribution                   |
| POST   | `/api/marks/:id/report`                      | Report a contribution                              |
| DELETE | `/api/marks/:id`                             | Remove an owned contribution                       |
| GET    | `/api/moderation`                            | Read reported contributions; bearer token required |
| POST   | `/api/moderation/:id`                        | Apply a moderation action; bearer token required   |

Moderation requests accept an `action` of `hide`, `approve`, or `delete`.

## Checks

Run validation tests and build the app:

```sh
npm test
npm run build
```

With the local app and database running, run integration and browser checks:

```sh
node scripts/check-api.mjs
npx playwright install chromium
node scripts/check-browser.mjs
node scripts/check-studio.mjs
node scripts/check-interaction-details.mjs
node scripts/check-density.mjs
```

These scripts use the local development ports and `.env` configuration. Run them against a development database. They create and remove test contributions; the density check temporarily adds 1,000 marks. The API check consumes two submission rate-limit slots, and the browser check consumes one.

Browser checks cover exploration, drawing undo/redo, draft recovery after failed publishing, reload persistence, separate visitor sessions, ownership, reporting, touch pinch, and mobile overflow. Screenshots and density measurements are written to the ignored `artifacts/` directory.

To verify a deployed instance, run `node scripts/check-deployment.mjs https://your-app.vercel.app`. This publishes a labeled test contribution, checks reload and separate-session persistence, verifies ownership, and removes the contribution.

## Deploy to Vercel

The app is hosted at [wall-of-memory-one.vercel.app](https://wall-of-memory-one.vercel.app).

`vercel.json` builds the Vite interface into `dist` and routes `/api` requests to an Express function through `api/index.js`. PostgreSQL connections use a small pool suited to serverless instances. Vercel serves the interface and API on the same origin.

To deploy your own instance:

1. Import this repository into Vercel with the Vite framework preset.
2. Connect a PostgreSQL database through Vercel Marketplace, such as Neon. A pooled connection string is recommended. Set `DATABASE_URL` if your integration does not configure it automatically.
3. Add distinct, randomly generated `OWNER_SECRET` and `MODERATION_TOKEN` values as sensitive server environment variables. Generate each with `openssl rand -hex 32`.
4. Deploy. The initial database schema is applied when the API starts. Database-backed endpoints return an explicit unavailable response until storage is configured.
5. Check `/api/health` and verify publishing and reading from separate browser sessions.

On Vercel, same-origin checks use the request hostname, and the API trusts Vercel's proxy for visitor IP limits. Set `APP_ORIGIN` only if you want to restrict writes to one canonical URL. Production cookies require HTTPS.

For command-line deployment:

```sh
npx vercel link
npx vercel deploy --prod
```

Keep secrets in Vercel's environment settings. Local environment files are excluded from deployment uploads. Preview deployments require their own environment configuration; use a separate database for preview testing when appropriate.

## Other hosting environments

1. Provision a PostgreSQL database with backups and the TLS settings required by your host.
2. Set `DATABASE_URL`, `OWNER_SECRET`, `MODERATION_TOKEN`, `APP_ORIGIN`, and `NODE_ENV=production` as server environment variables. Set `PORT` to your host's required listening port. `APP_ORIGIN` must match the public URL, including its scheme.
3. Build and start the app:

   ```sh
   npm ci
   npm run build
   npm start
   ```

4. Serve the app over HTTPS. Express serves both the built interface and the API on one origin; Vite is used only for development.
5. Check `/api/health` and verify publishing and reading from two separate browser sessions on the public URL.

Outside Vercel, configure trusted reverse-proxy hops before relying on per-visitor IP limits. With Express's default settings, limits apply to the proxy's address. Avoid trusting arbitrary forwarded headers.

## Operations

- Monitor `/api/health`, structured `request_failed` logs, and rates of 429 and 5xx responses.
- Review the moderation queue regularly.
- Schedule deletion of `wall_submissions` records older than 24 hours and set a retention policy for reports. Visitor hashes attached to contributions remain until those contributions are deleted.
- Add gateway throttling or CAPTCHA if abuse requires it. For a moderation team, add individual authenticated accounts and an audit trail.
- Test touch gestures, mobile keyboards, keyboard navigation, and screen readers on your deployed app. Profile the contribution density you expect to support.

## License

Licensed under the [MIT License](LICENSE). You may use, modify, distribute,
and sell copies of this software, provided you include the copyright and license
notices. See [LICENSE](LICENSE) for the full terms.

## Portfolio previews

The framing policy permits this site and `http://localhost:5173` to embed the wall.
For a published portfolio, add its exact origin (scheme and hostname, without a
path) to `frame-ancestors` in both `server/security.js` and `vercel.json`, then
redeploy. Keep the policies synchronized; automated tests check this.
