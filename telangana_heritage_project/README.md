# Telangana Heritage — Sustainable Tourism MVP

A responsive college-project prototype for sustainable tourism and cultural heritage preservation in Telangana.

## Frontend

The frontend is a static HTML, CSS and JavaScript app. It has no build step or frontend package dependencies.

To run it locally, either open `frontend/index.html` in a browser or serve the folder:

```bash
python -m http.server 8000 --directory frontend
```

Then visit `http://localhost:8000`.

### Vercel settings

Deploy the frontend as a static site with these project settings:

- **Root Directory:** `telangana_heritage_project/frontend`
- **Framework Preset:** Other
- **Build Command:** leave blank / auto
- **Install Command:** leave blank / auto
- **Output Directory:** leave blank / auto

The frontend is the deployable MVP. The Express backend below is a separate local starter and is not connected to the live UI.

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

- The destination catalogue, map positions and sustainability/carbon values are illustrative demo data.
- The map is a visual prototype, not a live geographic map or routing service.
- The AI guide returns local sample responses; no AI service is connected.
- Login is a visual demo; there is no authentication.
- Culture contributions and issue reports are not stored or transmitted.
- The static frontend currently uses its own local destination list and does not call the Express API.

Verify destination facts and sustainability figures against authoritative sources before public use.

## Before production use

Add a persistent database, real authentication and role-based authorization, validated and rate-limited API endpoints, an explicit CORS allow-list, verified destination data, a real map/routing provider, and a reviewed privacy/retention policy.
