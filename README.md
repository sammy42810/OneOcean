# One Ocean 🌊

An all-in-one platform for California beachgoers to find, explore, and connect around public beaches.

## About

One Ocean helps users search and filter public California beaches by location, water quality, size, and rating, view real-time advisories/closures, and connect with other beachgoers through community-hosted events (cleanups, volleyball, picnics, surf fishing, and more). Users can bookmark favorite beaches, leave reviews and comments, and build local networks around shared beach days.

This project is being built for a web development course (Professor Patrick Hill) and uses a full CRUD stack — MongoDB, Express, Handlebars, and Node.js — without any frontend framework (no React).

> **Status:** In active development. The site shell (header/nav, branding, shared layout) is in place, and most core features are now implemented end-to-end. Signup/login/logout is wired to pages with client-side validation and MongoDB-backed sessions; beach search/filter, beach detail pages with comments and ratings, community events (full CRUD + RSVP + comments), bookmarks with a privacy toggle, and user profiles all have working routes, data functions, and views. Advisories have a data layer and importer but are not yet surfaced in the UI.

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

- **Search & Find Beaches** — search by name, county, or city; filter by county, city, status, water quality, beach length, and user/auto ratings
- **Beach Detail Pages** — location, length, water quality, status, and user comments; ratings and comments handled in the data layer
- **Social/Community Tab** — host, edit, and cancel beach meetup events; RSVP and comment on events; filter events by date, start time, type, and minimum attendance
- **Bookmarked Beaches** — save favorite beaches, toggle bookmark list privacy, and view other users' public favorites
- **User Profiles** — user info, reviews left, saved beaches, and events being attended

### In Progress / Planned

- **Advisories in the UI** — advisory data layer (`data/advisories.js`) and importer exist; surfacing active advisories/closures on beach pages is still pending
- Live weather, tide, and UV index data on beach pages
- Friends system with friend-only event visibility

## Project Structure

```
CS546.OneOceanAPI/       # Express API + Handlebars frontend (MongoDB, routes, views)
  app.js                 # Express app setup (middleware, sessions, view engine, routes)
  server.js              # Entry point — starts the HTTP server
  seed.js                # Seeds a few sample beaches into the database
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

## Getting Started

```bash
cd CS546.OneOceanAPI
npm install
cp .env.example .env   # then fill in MONGO_URI / MONGO_DB_NAME / SESSION_SECRET as needed
npm run dev            # or: npm start
```

`npm run dev` runs the server with `node --watch` for auto-reload; `npm start` runs it without watching.

To load a few sample beaches for local development:

```bash
cd CS546.OneOceanAPI
node seed.js
```

Before starting the API for the first time, initialize the database contracts (validators + indexes) and optionally import real beach data:

```bash
cd CS546.OneOceanDB
npm install
cp .env.example .env       # use the same MONGO_URI / MONGO_DB_NAME as the API
npm run setup              # applies users & beaches validators/indexes
npm run import:beaches     # imports beaches from the CA open dataset
```

The API reads its configuration from environment variables (see `.env.example`):

| Variable | Description |
| --- | --- |
| `PORT` | Port the API listens on (defaults to `3000`) |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `MONGO_URI` | MongoDB connection string (defaults to `mongodb://localhost:27017`) |
| `MONGO_DB_NAME` | Database name to connect to (defaults to `oneocean`) |

## Data Model

See [`Database Proposal`](https://oneoceandev.atlassian.net/wiki/spaces/ONE/pages/327681/Database+Proposal) in Confluence for the full MongoDB schema (Users, Beaches, Events, Advisories, and their subdocuments). See [`CS546.OneOceanDB/README.md`](CS546.OneOceanDB/README.md) for how the beach/advisory data is sourced and mapped from the CA open dataset.

## Project Management

Development is tracked in Jira under the **One Ocean Development** (`OOD`) project, organized into three epics:

- `OOD-1` — One Ocean DB
- `OOD-2` — One Ocean API
- `OOD-3` — One Ocean UI

## License

_TBD_
