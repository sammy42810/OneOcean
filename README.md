# One Ocean

An all-in-one platform for California beachgoers to find, explore, and connect around public beaches.

## About

One Ocean helps users search and filter public California beaches by location, water quality, size, and rating, view real-time advisories/closures, and connect with other beachgoers through community-hosted events (cleanups, volleyball, picnics, surf fishing, and more). Users can bookmark favorite beaches, leave reviews and comments, and build local networks around shared beach days.

This project is being built for a web development course (Professor Patrick Hill) and uses a full CRUD stack — MongoDB, Express, Handlebars, and Node.js — without any frontend framework (no React).

> **Status:** Development complete. The site shell (header/nav, branding, shared layout) is in place, and all core features are implemented end-to-end. Signup/login/logout is wired to pages with client-side validation and MongoDB-backed sessions; beach search/filter (including a map view with proximity search), beach detail pages with comments and ratings, active advisories surfaced on beach pages and in the community activity feed, community events (full CRUD + RSVP + comments), bookmarks with a privacy toggle, and user profiles all have working routes, data functions, and views. Route-layer input validation (`helpers.js`) backs every mutation route, on top of the existing client-side and data-layer checks. `CS546.OneOceanDB`'s `import:beaches` script can load real beach/advisory data from the CA open dataset; the API's own `seed.js` is a lighter dev convenience script that inserts a handful of sample beaches (see [Setup & Running the App](#setup--running-the-app) below).

## Team

- Joseph Bamfo
- Samantha Bryan
- Ryan Lawless
- Daniel Suarez
- Tharun Varshan Jeyakumar

## Tech Stack

- **Database:** MongoDB (native `mongodb` driver)
- **Backend:** Node.js, Express 5
- **Views:** Handlebars (via `express-handlebars`)
- **Auth & Sessions:** bcrypt (password hashing), `express-session` with `connect-mongo` (sessions persisted in MongoDB)
- **Other:** `body-parser`, `moment`, `dotenv`

## Data Source

[CA Beach Water Quality Postings and Closures](https://data.ca.gov/dataset/beach-water-quality-postings-and-closures) — California's open data portal dataset used to seed beach and advisory information.

## Features

### Core

- **Search & Find Beaches** — search by name, county, or city; filter by county, city, status, minimum water quality, beach length, and user/auto ratings; a dedicated map view adds proximity search and an active-advisories toggle
- **Beach Detail Pages** — location, length, water quality, status, active advisories, and user comments; ratings and comments handled in the data layer
- **Advisories & Closures** — active advisories (closures, postings, rain advisories) surface on beach detail pages and in the community activity feed
- **Social/Community Tab** — host, edit, and cancel beach meetup events; RSVP and comment on events; filter events by date, start time, type, and minimum attendance
- **Bookmarked Beaches** — save favorite beaches, toggle bookmark list privacy, and view other users' public favorites
- **User Profiles** — user info, reviews left, saved beaches, and events being attended

### Future Enhancements

- Live weather, tide, and UV index data on beach pages
- Friends system with friend-only event visibility
- Reconciling the API's runtime document shape with `CS546.OneOceanDB`'s stricter Mongo schema validators, so a single seed/import path can satisfy both

## Project Structure

```
CS546.OneOceanAPI/       # Express API + Handlebars frontend (MongoDB, routes, views)
  app.js                 # Express app setup (middleware, sessions, view engine, routes)
  server.js              # Entry point — starts the HTTP server
  seed.js                # Dev convenience: drops the DB, then inserts 3 sample beaches
  middleware.js          # Request logger + global error handler
  helpers.js             # Shared validation helpers (strings, ids, email, number, date)
  config/
    mongoConnection.js   # Reusable MongoDB client/db getter (env-driven)
    mongoCollections.js  # Per-collection accessors (users, beaches, events, advisories)
  data/
    beaches.js           # Beach CRUD + comments + ratings
    users.js             # User CRUD, auth, and favorite-beach management
    events.js            # Event CRUD + RSVP (attendants) + comments
    advisories.js        # Advisory CRUD + lookups by beach
  utils/                 # Input validation helpers (general, beach, user, event, advisory)
  routes/
    index.js             # Route registration + home + 404 handler
    auth.js              # Signup/login/logout
    beaches.js           # Search/filter, detail pages, beach comments
    community.js         # Events list/detail, create/edit/cancel, RSVP, comments
    users.js             # Profile, bookmarks, and favorites (with privacy)
  views/                 # Handlebars templates
    layouts/main.handlebars
    beaches/, community/, users/  # Feature pages
  public/                # Static assets (CSS, client-side JS, images)

CS546.OneOceanDB/        # MongoDB validators, indexes, and seed/import scripts
  schema/                # Collection validators + indexes (users, beaches)
  scripts/setup.js       # Applies validators/indexes for users & beaches
  scripts/importBeaches.js  # Imports beach data from the CA open dataset
```

There is no separate frontend project — pages are server-rendered Handlebars views served directly from `CS546.OneOceanAPI`, per the course's required stack (no React/Vue/etc.).

## Setup & Running the App

### Prerequisites

- **Node.js 18+** (Express 5 requires it; this repo uses ESM `"type": "module"` throughout)
- **MongoDB** reachable via a connection string — either:
  - a local install ([MongoDB Community Server](https://www.mongodb.com/try/download/community)) running on the default port (`mongodb://localhost:27017`), or
  - a hosted cluster (e.g. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)) — use its connection string as `MONGO_URI` below

Only `CS546.OneOceanAPI` is required to run the app. `CS546.OneOceanDB` is optional tooling (see step 5).

### 1. Install dependencies

```bash
cd CS546.OneOceanAPI
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env`:

| Variable | Description |
| --- | --- |
| `PORT` | Port the API listens on (defaults to `3000`) |
| `SESSION_SECRET` | Secret used to sign session cookies — set this to any random string |
| `MONGO_URI` | MongoDB connection string (defaults to `mongodb://localhost:27017`) |
| `MONGO_DB_NAME` | Database name to connect to (defaults to `oneocean`) |

If you're using a local MongoDB install, make sure it's running before starting the app (e.g. `mongod`, or start the MongoDB service/daemon for your OS).

### 3. Start the server

```bash
npm run dev            # runs server.js with node --watch (auto-reloads on file changes)
# or
npm start              # runs server.js without watching
```

Visit **http://localhost:3000** (or your configured `PORT`) in a browser.

### 4. (Optional) Load sample beach data

The database starts empty. To insert a handful of sample beaches for local testing:

```bash
node seed.js
```

> **Warning:** `seed.js` calls `dropDatabase()` first, so it wipes the target database before inserting its 3 sample beaches. Only run it against a local/dev database. It does **not** create any users, events, or comments — sign up for an account through `/signup` in the browser to test those features.

### 5. (Optional) Real beach data + stricter schema validators

For real beach/advisory data from the CA open dataset, and to apply Mongo `$jsonSchema` validators/indexes, use the sibling `CS546.OneOceanDB` package instead:

```bash
cd CS546.OneOceanDB
npm install
cp .env.example .env       # use the same MONGO_URI / MONGO_DB_NAME as the API
npm run setup              # applies users & beaches validators/indexes
npm run import:beaches     # fetches and upserts real beach/advisory data from data.ca.gov
```

> **Note:** This package's schema is stricter than, and slightly diverges from, the API's own runtime document shape (see [`CS546.OneOceanDB/README.md`](CS546.OneOceanDB/README.md) for the field-level differences). Reconciling the two is tracked as in-progress work.

## Data Model

See [`Database Proposal`](https://oneoceandev.atlassian.net/wiki/spaces/ONE/pages/327681/Database+Proposal) in Confluence for the full MongoDB schema (Users, Beaches, Events, Advisories, and their subdocuments). See [`CS546.OneOceanDB/README.md`](CS546.OneOceanDB/README.md) for how the beach/advisory data is sourced and mapped from the CA open dataset.

## Project Management

Development is tracked in Jira under the **One Ocean Development** (`OOD`) project, organized into three epics:

- `OOD-1` — One Ocean DB
- `OOD-2` — One Ocean API
- `OOD-3` — One Ocean UI
