# Telangana Heritage — Full-Stack Platform

A responsive heritage discovery and responsible-tourism platform for Telangana, India. The application combines a static HTML/CSS/JavaScript frontend with authenticated Node.js API routes, Neon PostgreSQL, Clerk authentication and private Vercel Blob storage.

## Features

- **Discover:** curated Telangana heritage, nature and cultural destinations, searchable by name, category and district.
- **Explore on a map:** Leaflet and OpenStreetMap map display, with Google Maps directions handoff.
- **Plan journeys:** save trip plans and open transport handoffs, including Uber and Rapido where available.
- **Culture and community:** public published stories, authenticated story contributions, heritage issue reports and moderation workflows.
- **Private travel memories:** signed-in users can take or upload photos, add captions and destination names, search their own gallery, delete saved memories and export Telangana-themed postcards.
- **SEO and sharing:** title and description metadata, canonical URL, Open Graph and Twitter metadata, JSON-LD, robots.txt, sitemap, favicon, web manifest and social preview artwork.
- **Admin and moderation:** role-protected workflows with database-backed role checks and audit events.

## Architecture

- **Frontend:** static HTML, CSS and browser JavaScript under `frontend/`.
- **API:** Vercel Node.js functions under `api/`.
- **Authentication:** Clerk browser SDK and server-side session verification.
- **Database:** Neon PostgreSQL accessed through Drizzle ORM.
- **Private photo storage:** Vercel Blob private storage. The database stores ownership and photo metadata, not public image URLs.
- **Deployment:** Vercel Git integration; project root is `telangana_heritage_project`, output directory is `frontend`.

## Run locally

Use Node.js 24.

For the static-only frontend preview:

```bash
python -m http.server 8000 --directory frontend
```

Then visit `http://localhost:8000`. This static-only mode does not run Vercel API functions, authenticated account features or private photo uploads.

For the full application, link the project to the owning Vercel project and pull the development environment into a local, ignored file:

```bash
npm ci
vercel link --yes --project node-project --scope team_z2jnnFtZIA3yrMTMVOEBkTfK
vercel env pull .env.local --environment development
npm run db:check
npx vercel dev
```

Open the local URL printed by `vercel dev`. Ensure `APP_ORIGINS` includes the exact localhost origin used by the browser. The `.env.local` file is ignored by Git; never commit it or paste secret values into chat.

Required runtime configuration:

- `DATABASE_URL` — Neon database connection.
- `CLERK_SECRET_KEY` — Clerk server-side secret.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk browser publishable key.
- `BLOB_READ_WRITE_TOKEN` — Vercel Blob read/write token for the connected private store.
- `APP_ORIGINS` — comma-separated trusted application origins used for Clerk token verification.
- `INITIAL_ADMIN_CLERK_USER_ID` — only temporarily, when promoting the intended first administrator.

See `.env.example` for variable names. Do not place real credentials in source control.

## Vercel project setup

Configure the Vercel project as follows:

- **Root Directory:** `telangana_heritage_project`
- **Framework Preset:** Other
- **Install Command:** `npm ci`
- **Build Command:** `npm run build`
- **Output Directory:** `frontend`
- **Node.js:** 24.x

The project is connected to a **private** Vercel Blob store in the Mumbai region. Keep `BLOB_READ_WRITE_TOKEN` available in Preview and Production. Do not switch the photo store to public access.

Before the production release, configure Clerk's production instance and use its production publishable and secret keys in Vercel. Verify that `APP_ORIGINS` contains the production domain and any intended custom domain. Do not use development/test Clerk keys for public production sign-in.

## Database migrations

The additive migration `db/migrations/0001_travel_memories.sql` creates the private travel-memory metadata table and owner index.

- The Vercel production build runs Drizzle migrations when `VERCEL_ENV=production`.
- Preview builds deliberately skip database migrations.
- For a deliberate manual migration, use `npm run db:migrate` with the intended database URL configured.
- Use `npm run db:check` to verify database connectivity.

Confirm the target database and backup/restore plan before any production migration. The travel-memory migration adds a new table and index; it does not modify existing destination or user rows.

## Private travel memories and privacy

- Every list, photo-read and delete request requires a valid Clerk session.
- Database queries are scoped to the authenticated Clerk user ID; the browser cannot select another owner's memory.
- Photo bytes are stored in private Blob storage and streamed through an authenticated API after ownership checks.
- Browser-side image re-encoding removes embedded EXIF metadata (including GPS metadata) before upload.
- Images are resized to a maximum 1,800-pixel long edge and limited to 2 MB after optimisation.
- The server verifies JPEG/WebP file signatures and rejects SVG and mismatched content.
- Upload requests are limited to 10 photos per batch and 12 saved uploads per account per hour.
- The public heritage destination photo gallery is separate from personal travel memories.
- Users can delete their own memories from the journal.

See [docs/MEMORIES_PRIVACY.md](docs/MEMORIES_PRIVACY.md) for the implementation and safeguards.

## Initial administrator

Create the intended administrator account through Clerk and verify its immutable Clerk user ID. Set `INITIAL_ADMIN_CLERK_USER_ID` in a trusted local environment, then run:

```bash
npm run admin:promote
```

Remove the temporary variable after promotion. Only an authorised administrator should be promoted. Do not trust browser-supplied role or owner IDs.

## Quality checks

```bash
npm ci
npm test
npm run check
npm run build
```

The tests cover public APIs, authentication/role controls, guide search, destination data, image upload validation, SEO metadata and memory-page presence. The build skips migrations outside Production.

## Demo limitations and responsible use

- Destination facts, coordinates, visitor details and source links should be reviewed against current authoritative sources before public launch.
- Sustainability and carbon figures that are labelled illustrative must not be presented as official measurements.
- Map markers are discovery aids; always follow the destination's official visitor guidance.
- Google Maps and ride-provider links hand off to external services and do not guarantee route, driver or vehicle availability.
- The destination catalogue and public story moderation process should be reviewed periodically for accuracy and respectful community representation.
