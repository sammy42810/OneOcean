# One Ocean Database

This package owns the database lifecycle artifacts for One Ocean: collection validators, indexes, and the seed/import scripts that populate MongoDB from the CA open dataset. Runtime CRUD code lives in the sibling [`CS546.OneOceanAPI`](../CS546.OneOceanAPI) package; this package is about defining and loading the data contract, not serving it.

For the overall project overview, see the [root README](../README.md).

## Requirements

- Node.js (ESM — this package is `"type": "module"`)
- A running MongoDB instance reachable at `MONGO_URI`

## Getting Started

```bash
npm install
cp .env.example .env       # set MONGO_URI / MONGO_DB_NAME (match the API)
npm run setup              # apply users & beaches validators + indexes
npm run import:beaches     # fetch and import beaches from the CA open dataset
```

Run `setup` before the API starts for the first time so the collection validators and unique indexes exist. `import:beaches` upserts beach documents against this package's own stricter schema (see the note below) — most local development should instead use the API's own `npm run seed` (in `CS546.OneOceanAPI`), which now fetches real beach/advisory/water-quality data from the same CA open dataset directly into the API's runtime document shape.

## Environment Variables

See `.env.example`:

| Variable | Description |
| --- | --- |
| `MONGO_URI` | MongoDB connection string (defaults to `mongodb://localhost:27017`) |
| `MONGO_DB_NAME` | Database name to connect to (defaults to `oneocean`) |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run setup` | Creates (or `collMod`s) the `users` and `beaches` collections with their JSON-schema validators in strict mode, then ensures their indexes. Safe to re-run — idempotent. |
| `npm run import:beaches` | Downloads the Beach Detail and Advisories CSVs from data.ca.gov, re-applies the beaches validator/indexes, and upserts beach documents by `beachId`. |

## Structure

```
schema/
  users.js      # usersValidator + usersIndexes (unique, case-insensitive email)
  beaches.js    # beachesValidator + beachesIndexes (unique beachId)
scripts/
  setup.js         # Applies all collection contracts (validators + indexes)
  importBeaches.js # Imports beach + advisory data from the CA open dataset
```

## Users collection

The Users contract requires `_id`, `firstName`, `lastName`, `email`, `gender` (`M`/`F`/`NB`), `city`, `state` (2-letter), `age`, `hashedPassword`, and `favoriteBeaches` (an array of beach document id strings). `additionalProperties` is `false`. `email` has a unique, case-insensitive index (collation `en`, strength 2).

## Beaches collection

The Beaches contract requires `_id`, `beachId` (the dataset's source identifier, uniquely indexed), `name`, `location`, `status` (`Active`/`Inactive`, matching the source dataset's own values), `beachLength`, `waterQuality`, `advisories` (array of strings), `comments` (subdocument array of `_id`/`name`/`comment`), and the bounding `upperLat`/`lowerLat`/`upperLon`/`lowerLon` coordinates.

Beach data is sourced from the [CA Beach Water Quality Postings and Closures](https://data.ca.gov/dataset/beach-water-quality-postings-and-closures) open dataset — see `scripts/importBeaches.js`. Notes on the mapping:

- Only Beach Detail rows with `CountAsBeach === '1'` are imported.
- `status` reflects the dataset's `Status` field (whether the beach is still part of the monitoring program), not real-time swim safety.
- `advisories` is built from the Advisories CSV, filtered to records with an `AdvisoryType` and no `DateOpened` (i.e. never marked resolved), stored as `"Type: Cause"` strings.
- `waterQuality` isn't provided per-beach in the source data — it's left `null` on first insert (deriving a 1-10 score from the raw bacteria monitoring results is a separate task) and is never overwritten by re-imports.
- `comments` is always user-generated and is only set (to `[]`) on first insert; it is never overwritten by re-imports.
- Re-running the import is idempotent: it upserts by `beachId` (`bulkWrite`, unordered), updating sourced fields in place while `$setOnInsert` protects `waterQuality`/`comments`.

> **Note:** These validators describe the schema this package enforces. The API's runtime data layer currently uses a richer/differently-named beach shape (e.g. `beachName`, `city`, `county`, `BeachComments`, `BeachRatings`, `userRating`) and an extra user field (`isBookmarksPrivate`). Keep that divergence in mind — documents written by the API may not satisfy these strict validators until the two are reconciled.
