# One Ocean 🌊

An all-in-one platform for California beachgoers to find, explore, and connect around public beaches.

## About

One Ocean helps users search and filter public California beaches by location, water quality, size, and rating, view real-time advisories/closures, and connect with other beachgoers through community-hosted events (cleanups, volleyball, picnics, surf fishing, and more). Users can bookmark favorite beaches, leave reviews and comments, and build local networks around shared beach days.

This project is being built for a web development course (Professor Patrick Hill) and uses a full CRUD stack — MongoDB, Express, Handlebars, and Node.js — without any frontend framework (no React).

> **Status:** In development. Project proposal and database schema are approved. API scaffolding (Express app, MongoDB connection module) is in place; routes and collections are still being built out.

## Team

- Joseph Bamfo
- Samantha Bryan
- Ryan Lawless
- Daniel Suarez
- Tharun Varshan Jeyakumar

## Tech Stack

- **Database:** MongoDB
- **Backend:** Node.js, Express
- **Views:** Handlebars
- **Auth:** bcrypt (password hashing), express-session

## Data Source

[CA Beach Water Quality Postings and Closures](https://data.ca.gov/dataset/beach-water-quality-postings-and-closures) — California's open data portal dataset used to seed beach and advisory information.

## Planned Features

### Core

- **Search & Find Beaches** — search by name, county, or city; filter by water quality, size, and rating
- **Beach Detail Pages** — location, length, water quality, advisories/closures, swim season, ratings, and comments
- **Social/Community Tab** — host, edit, and cancel beach meetup events; RSVP and comment on events; filter events by date, time, attendance, and type
- **Bookmarked Beaches** — save public or private favorite beaches
- **User Profiles** — user info, reviews, bookmarks, and upcoming events

### Stretch Goals

- Live weather, tide, and UV index data on beach pages
- Friends system with friend-only event visibility

## Project Structure

```
CS546.OneOceanAPI/   # Express API (MongoDB, routes, views)
  app.js             # Express app setup (middleware, view engine, routes)
  server.js          # Entry point — starts the HTTP server
  config/
    mongoConnection.js  # Reusable MongoDB client/db getter (env-driven)
  routes/
    index.js          # Route registration

CS546.OneOceanDB/    # MongoDB validators, indexes, migrations, and seed/import scripts
CS546.OneOceanUI/    # (reserved for frontend)
```

## Getting Started

```bash
cd CS546.OneOceanAPI
npm install
cp .env.example .env   # then fill in MONGO_URI / MONGO_DB_NAME / SESSION_SECRET as needed
npm run dev            # or: npm start
```

Before starting the API for the first time, initialize the Users database contract:

```bash
cd CS546.OneOceanDB
npm install
cp .env.example .env   # use the same MONGO_URI / MONGO_DB_NAME as the API
npm run setup
```

The API reads its configuration from environment variables (see `.env.example`):

| Variable | Description |
| --- | --- |
| `PORT` | Port the API listens on (defaults to `3000`) |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `MONGO_URI` | MongoDB connection string (defaults to `mongodb://localhost:27017`) |
| `MONGO_DB_NAME` | Database name to connect to (defaults to `oneocean`) |

## Data Model

See [`Database Proposal`](https://oneoceandev.atlassian.net/wiki/spaces/ONE/pages/327681/Database+Proposal) in Confluence for the full MongoDB schema (Users, Beaches, Events, Advisories, and their subdocuments).

## Project Management

Development is tracked in Jira under the **One Ocean Development** (`OOD`) project, organized into three epics:

- `OOD-1` — One Ocean DB
- `OOD-2` — One Ocean API
- `OOD-3` — One Ocean UI

## License

_TBD_
