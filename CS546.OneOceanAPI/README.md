# One Ocean API

The Express + Handlebars web application for One Ocean — a platform for California beachgoers to search public beaches, read/leave reviews, bookmark favorites, and organize community events. Pages are server-rendered Handlebars views (no frontend framework), and the app talks directly to MongoDB via the native driver.

For the overall project overview, team, and data source, see the [root README](../README.md). Database validators, indexes, and the beach data importer live in the sibling [`CS546.OneOceanDB`](../CS546.OneOceanDB) package.

## Tech Stack

- **Node.js + Express 5** — HTTP server and routing
- **Handlebars** (`express-handlebars`) — server-rendered views, `main` default layout
- **MongoDB** (native `mongodb` driver) — data store
- **Auth & Sessions** — `bcrypt` for password hashing, `express-session` with `connect-mongo` (sessions persisted in the `oneocean` database)
- **Other** — `body-parser`, `moment`, `dotenv`

## Getting Started

```bash
npm install
cp .env.example .env   # then fill in values as needed
npm run dev            # or: npm start
```

The server starts on `PORT` (default `3000`) — visit http://localhost:3000.

- `npm run dev` — runs `server.js` with `node --watch` for auto-reload on file changes
- `npm start` — runs `server.js` without watching
- `npm test` — not configured yet

To load a few sample beaches into your local database:

```bash
node seed.js
```

> **Note:** `seed.js` calls `dropDatabase()` first, so it wipes the target database before inserting its sample beaches. Point it at a local/dev database only.

For real beach data and to apply the collection validators/indexes, run the setup and import scripts in [`CS546.OneOceanDB`](../CS546.OneOceanDB) against the same `MONGO_URI` / `MONGO_DB_NAME`.

## Environment Variables

Configuration is read from environment variables (see `.env.example`):

| Variable | Description |
| --- | --- |
| `PORT` | Port the server listens on (defaults to `3000`) |
| `SESSION_SECRET` | Secret used to sign session cookies (falls back to a dev default) |
| `MONGO_URI` | MongoDB connection string (defaults to `mongodb://localhost:27017`) |
| `MONGO_DB_NAME` | Database name to connect to (defaults to `oneocean`) |

## Project Structure

```
app.js                 # Express app setup: static assets, body parsing, sessions, view engine, routes, error handler
server.js              # Entry point — imports app and starts the HTTP server
seed.js                # Drops the DB and inserts sample beaches (dev convenience)
middleware.js          # loggerMiddleware (request logging) + globalErrorHandler
helpers.js             # Shared validation helpers (checkString, checkId, checkEmail, checkNumber, checkDate)
config/
  mongoConnection.js   # Singleton MongoDB client/db connection (env-driven)
  mongoCollections.js  # Per-collection accessors: users, beaches, events, advisories
data/                  # Data-access layer (all DB reads/writes)
  beaches.js           # Beach CRUD, comments, ratings
  users.js             # User CRUD, auth (createUser/checkLogin), favorite beaches, bookmark privacy
  events.js            # Event CRUD, RSVP (attendants), comments
  advisories.js        # Advisory CRUD and lookups by beach
utils/                 # Field-level validation (general, beach, user, event, advisory)
routes/                # Express routers (see Routes below)
views/                 # Handlebars templates (layouts/, beaches/, community/, users/)
public/                # Static assets: css/, js/ (client-side validation & interactions), images/
```

## Application Layers

Requests flow **routes → data → config/collections → MongoDB**, with `utils/` handling input validation and `helpers.js` providing shared checks. The data layer returns plain objects with `_id` stringified; routes render Handlebars views or return JSON for AJAX (`PATCH`/`DELETE`) calls.

Sessions are stored in MongoDB via `connect-mongo`. The logged-in user is kept on `req.session.user` (`_id`, `email`, `firstName`); routes that mutate data check for it and redirect to `/login` (or return `401` for JSON endpoints) when absent.

## Routes

**Home** — `GET /` renders the landing page; unmatched paths render a 404 error page.

**Auth** (`routes/auth.js`, mounted at `/`)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/signup` | Show signup form |
| POST | `/signup` | Create a user and start a session |
| GET | `/login` | Show login form |
| POST | `/login` | Authenticate and start a session |
| GET | `/logout` | Destroy the session |

**Beaches** (`routes/beaches.js`, mounted at `/beaches`)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/beaches` | List beaches with search + filters (name/county/city, status, water quality, length, user/auto ratings) |
| GET | `/beaches/:id` | Beach detail page |
| POST | `/beaches/:id/comments` | Add a comment (login required) |

**Community** (`routes/community.js`, mounted at `/community`)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/community` | List events with filters (date, start time, type, min attendance) |
| GET | `/community/create` | Host-event form (login required) |
| POST | `/community/create` | Create an event |
| GET | `/community/:id` | Event detail page |
| PATCH | `/community/:id` | Update an event (host only, JSON) |
| DELETE | `/community/:id` | Cancel an event (host only, JSON) |
| POST | `/community/:id/attend` | RSVP to an event |
| POST | `/community/:id/comments` | Comment on an event |

**Users / Bookmarks** (`routes/users.js`, mounted at `/`)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/profile` | Current user's profile (reviews, bookmarks, attending events) |
| GET | `/bookmarks` | Current user's saved beaches |
| POST | `/bookmarks/:beachId` | Add a bookmark |
| POST | `/bookmarks/:beachId/delete` | Remove a bookmark (HTML form) |
| GET | `/users/:id/favorites` | View a user's favorites (respects privacy setting) |
| POST | `/users/:id/favorites` | Add a favorite (owner only) |
| DELETE | `/users/:id/favorites/:beachId` | Remove a favorite (owner only, JSON) |
| PATCH | `/users/:id/favorites/visibility` | Toggle bookmark-list privacy (owner only, JSON) |
