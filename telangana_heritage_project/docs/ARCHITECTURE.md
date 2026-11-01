# Application architecture

## Current implementation

The current MVP is intentionally lightweight:

- **Static client:** HTML, CSS and browser JavaScript in `frontend/`.
- **Destination catalogue:** one reviewed JSON dataset in `frontend/data/destinations.json`, used by the destination explorer, interactive map and read-only API.
- **Map:** Leaflet 1.9.4 renders sourced destination coordinates. The map loads OpenStreetMap standard tiles with visible attribution and a report-map-issue link.
- **API:** stateless Vercel Node.js Functions in `api/v1/` provide health checks and read-only destination queries. The client calls the API and falls back to the shared JSON catalogue when served outside Vercel.
- **Tests:** Node's built-in test runner validates the catalogue and API handlers without adding runtime dependencies.

The older `backend/server.js` is a local Express learning prototype. It is not the deployed API and must not be used to collect real reports because it stores data in process memory.

## Domain modules

The product is divided into these bounded areas:

| Module | Responsibility | Current state |
| --- | --- | --- |
| Destinations | Curated places, districts, categories, coordinates and source records | Catalogue + read API implemented |
| Mapping | Geographic discovery, marker/list synchronisation and source attribution | Leaflet map implemented |
| Trip planning | Itinerary templates, trip preferences and saved itineraries | Browser-only sample planner |
| Culture archive | Stories, crafts, oral histories and moderation | DB-backed submission and moderator publication workflow |
| Heritage reports | Issue intake, triage and status tracking | Authenticated DB-backed reporting; attachment upload not enabled |
| Sustainability | Verifiable destination indicators and transparent calculation methods | Illustrative values only |
| Identity and roles | Clerk identity plus database-backed tourist/contributor/moderator/admin roles | Implemented; initial admin requires manual bootstrap |
| Administration | Review queues, audit trail, role changes and moderation | Implemented in Vercel Functions |
| Telangana Guide | Search reviewed destination records and return official references | Curated-catalogue retrieval implemented; no generative model is connected |

Do not label an unfinished module as live functionality. In particular, never tell a visitor that a story or issue report has been submitted until it has been durably stored and a reference ID has been returned.

## Target production topology

Use a single Vercel project while the frontend and API share one release:

```text
Browser
  ├── static frontend (frontend/)
  ├── /api/v1/health
  ├── /api/v1/destinations
  └── /api/v1/destinations/:slug
          │
          ├── Node.js Vercel Functions
          │     ├── route handlers
          │     ├── request validation
          │     ├── authentication / authorization
          │     ├── domain services
          │     └── repositories
          │
          ├── managed PostgreSQL (curated data + user submissions)
          └── private object storage (moderated uploads)
```

Recommended Vercel project settings once the project connection is authorized:

- **Repository:** `Harshith2737/node-project`
- **Root Directory:** `telangana_heritage_project`
- **Framework Preset:** Other
- **Build Command:** none for the current static build
- **Output Directory:** `frontend`
- **Functions:** source files under `api/`

The current Vercel project is not yet connected to this repository. Do not remove its existing deployment protection to make previews public. Keep previews protected and use the approved project access flow.

## Backend layering

When persistent submissions are enabled, keep the code separated by responsibility:

```text
api/
  v1/
    reports.js
    stories.js
    destinations.js
src/
  config/          # typed environment parsing and startup checks
  middleware/      # auth, role checks, request IDs, rate limits
  modules/
    destinations/  # routes, schemas, service, repository
    reports/       # routes, schemas, service, repository
    stories/       # routes, schemas, service, repository
    trips/         # route planning and saved itineraries
  shared/
    errors/
    logging/
    validation/
db/
  migrations/
  seeds/
```

Business rules belong in services, not route handlers. Repositories own database access. Route handlers translate HTTP input/output and should not contain SQL. Use parameterized queries or a typed query builder; never interpolate request text into SQL.

## Data model proposal

The first persistent schema should cover:

- `destinations`: stable slug, name, district, category, descriptions, latitude/longitude, official source URL, coordinate source, review status, and timestamps.
- `destination_sources`: source URL, publisher, licence, retrieved date, fact supported, and reviewer.
- `stories`: contributor identity, title, body, language, media references, moderation status, reviewer and timestamps.
- `heritage_reports`: reporter identity, destination, issue type, description, location, status, priority, and timestamps.
- `report_events`: append-only status changes and moderator actions.
- `media_assets`: private object-storage path, content type, size, checksum, owner, and moderation state.
- `saved_trips`: owner, preferences, itinerary, and creation/update times.

Use UUID primary keys, unique destination slugs, foreign keys, created/updated timestamps, database constraints, and indexes for district/category/status and geographic lookups. Keep user identity in the identity provider and store its immutable subject ID in application tables.

## Security and operations baseline

Before accepting public submissions:

1. Provision managed PostgreSQL and private object storage through the selected Vercel Marketplace integration.
2. Implement real sign-in and server-side role authorization. Client-side role flags are not security.
3. Validate every request at the API boundary; enforce body-size limits, allowed MIME types, and field lengths.
4. Add shared rate limiting for public submission and sign-in endpoints. Do not rely on per-instance in-memory counters in serverless functions.
5. Restrict CORS to the deployed application origin. Do not use wildcard CORS for credentialed requests.
6. Keep provider secrets server-side; never put database credentials, signing secrets or admin keys in browser code.
7. Store uploads privately and issue short-lived, authorized access links. Scan uploads before moderator publication.
8. Add request IDs, structured logs, error monitoring, audit events, retention rules and a documented data-deletion process.
9. Add unit, API integration and browser smoke tests. Require checks before merging and preview validation before production promotion.
10. Define backups, restore tests, migration rollback, and an incident/rollback owner.

## Open-source and data reuse policy

Use upstream packages through their package managers and preserve their licence notices. Do not copy entire repositories or scrape arbitrary source trees. Review each dependency's licence, maintenance status, release history, security advisories and transitive dependencies before adoption.

The current map uses Leaflet 1.9.4 (BSD-2-Clause) from a pinned CDN URL with Subresource Integrity. Map imagery is supplied by OpenStreetMap's tile service, not by Leaflet. Display visible OpenStreetMap attribution, keep a valid page referrer, respect response caching, and never bulk-download, scrape, or prefetch map tiles. The public OSM tile service is best-effort and has no SLA; for a widely used production service, select a tile provider with terms and capacity appropriate to the expected traffic.

Destination context is linked to official Telangana government tourism sources. Coordinate reference points are linked per record. Wikidata facts are CC0; OpenStreetMap-derived geographic data is subject to the ODbL and attribution requirements. Coordinates in the prototype are discovery markers, not a substitute for official directions or on-site access information.


## Implemented identity and persistence

The live backend modules in this branch use Clerk for browser sign-in and server-side token verification. The verified Clerk subject becomes the immutable application owner identifier. The `user_profiles` row defaults to `tourist`; role changes are performed only by guarded moderator/admin endpoints. The initial admin is provisioned through the one-time `scripts/promote-admin.js` CLI script after the owner verifies the Clerk user ID.

The Neon schema includes user profiles, stories, heritage reports, saved trips, contributor requests, moderation events, and shared rate-limit buckets. The SQL migration is checked into `db/migrations/`; it must be applied explicitly using `npm run db:migrate` after verifying `DATABASE_URL`. It is intentionally not run as part of the static deployment build.

## Request and review lifecycle

- Every private endpoint validates the Clerk session bearer token and a configured set of exact authorised origins.
- User-owned trips, reports, stories and contributor requests are queried by the verified Clerk subject.
- Community stories default to `pending`; the public story endpoint exposes only `published` records.
- Reports reference a destination slug from the existing curated catalogue.
- Submission limits are stored in Postgres rather than local process memory.
- Moderator/admin decisions and audit events are written in one Neon batch.
- The browser UI renders user content with DOM text nodes; it does not use raw HTML for submitted content.

The guide performs source-linked search over the reviewed destination catalogue; it does not call a generative model. Sustainability indicators are illustrative, and private media storage/upload scanning are not enabled.
