# Telangana Heritage — Sustainable Tourism MVP

A responsive college-project prototype for sustainable tourism and cultural heritage preservation in Telangana.

## Frontend

The frontend is a static HTML, CSS and JavaScript app. It has no build step. Leaflet 1.9.4 is loaded from a pinned CDN release with Subresource Integrity; the catalogue is JSON and the map uses OpenStreetMap tiles.

To run it locally, either open `frontend/index.html` in a browser or serve the folder:

```bash
python -m http.server 8000 --directory frontend
```

Then visit `http://localhost:8000`.

### Vercel settings

Deploy the frontend as a static site with these project settings:

- **Root Directory:** `telangana_heritage_project`
- **Framework Preset:** Other
- **Build Command:** leave blank / auto
- **Install Command:** leave blank / auto
- **Output Directory:** `frontend`
- **Functions:** files under `api/` are deployed as Node.js Vercel Functions.

The frontend uses `/api/v1/destinations` and falls back to the curated JSON file for local preview. The older Express backend below is not part of the deployed request path.

## Backend prototype (local development only)

The backend is an Express API starter. From this folder:

```bash
cd backend
npm init -y
npm install express cors
node server.js
```

Health check: `http://localhost:5000/api/health`.

The backend uses in-memory storage for reports. Data is lost when the process restarts; it currently has no database, authentication, rate limiting or production CORS policy. Do not treat it as a production reporting service.

## Demo limitations

- The destination catalogue includes six curated examples with source links to Telangana Tourism, district administrations and UNESCO; coordinates are approximate discovery markers and must not be treated as official navigation directions.
- The map uses Leaflet and OpenStreetMap standard tiles. Respect the OpenStreetMap Tile Usage Policy; do not bulk-fetch tiles or implement offline tile downloads.
- The AI guide returns local sample responses; no AI service is connected.
- Clerk sign-in is implemented; it requires the connected Clerk application to be configured for the deployed domain.
- Story submissions, heritage reports, saved trips and contributor requests are stored in Neon after the database migration is applied.
- The static frontend currently uses its own local destination list and does not call the Express API.

Verify destination facts and sustainability figures against authoritative sources before public use.

## Before production use

Add a persistent database, real authentication and role-based authorization, validated and rate-limited API endpoints, an explicit CORS allow-list, verified destination data, a real map/routing provider, and a reviewed privacy/retention policy.


## Managed platform setup

Neon PostgreSQL and Clerk are provisioned through the Vercel Marketplace. The API verifies Clerk session tokens on the server; account roles are read from the database and new accounts default to `tourist`. Do not trust browser-supplied role or owner IDs.

### Local setup and database migration

Run these commands from `telangana_heritage_project` with the Vercel CLI authenticated to the owning team:

```bash
vercel link --yes --project node-project --scope team_z2jnnFtZIA3yrMTMVOEBkTfK
npm install
vercel env pull .env.local --environment production
npm run db:check
npm run db:migrate
npm run db:check
npx vercel dev
```

The pulled `.env.local` file is ignored by Git. Never commit it or display its contents. For local development, include the exact localhost origin in `APP_ORIGINS`. The checked-in migration is an explicit operation and is not run during a deployment build.

### Initial administrator

Create the intended administrator account through Clerk, verify its immutable Clerk user ID, then set `INITIAL_ADMIN_CLERK_USER_ID` in the trusted local environment and run:

```bash
npm run admin:promote
```

Remove that temporary variable after use. Only an authorised administrator should be promoted. Moderators can review stories, reports and contributor requests; only admins can assign moderator/admin roles.

### Authenticated API modules

Private APIs include `GET /api/v1/me`, `GET /api/v1/submissions`, trip create/list, story/report submissions, contributor requests, and moderator/admin review endpoints. Public story reads return only approved (`published`) records. All writes apply input limits and database-backed rate limits; moderation decisions create audit events in the same Neon batch.

The AI guide remains sample-only, sustainability metrics are illustrative, and media uploads are not enabled. Apply the database migration and complete the Clerk sign-in/role checks on a protected Vercel preview before using the platform with real visitors.
