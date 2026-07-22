# One Ocean Database

This repository owns database lifecycle artifacts: collection validators, indexes, migrations, and seed/import scripts. Runtime API CRUD code remains in `CS546.OneOceanAPI`.

## Users collection

The Users contract uses MongoDB's native `_id` and the API's established field names: `firstName`, `lastName`, `email`, `gender`, `city`, `state`, `age`, `hashedPassword`, and `favoriteBeaches`.

## Beaches collection

The Beaches contract uses MongoDB's native `_id` plus `beachId` (the dataset's source identifier), `name`, `location`, `status` (`Active`/`Inactive`, matching the source dataset's own values), `beachLength`, `waterQuality`, `advisories`, `comments` (a subdocument array of `_id`/`name`/`comment`), and the bounding `upperLat`/`lowerLat`/`upperLon`/`lowerLon` coordinates. `beachId` has a unique index.

Beach data is sourced from the [CA Beach Water Quality Postings and Closures](https://data.ca.gov/dataset/beach-water-quality-postings-and-closures) open dataset — see `scripts/importBeaches.js`. Notes on the mapping:

- `status` reflects the dataset's Beach Detail `Status` field (whether the beach is still part of the monitoring program), not real-time swim safety.
- `advisories` is built from the Advisories CSV, filtered to records with no `DateOpened` (i.e. never marked resolved).
- `waterQuality` isn't provided per-beach in the source data — it's left `null` on import (deriving a 1-10 score from the raw bacteria monitoring results is a separate task) and is never overwritten by re-imports.
- `comments` is always user-generated and is never overwritten by re-imports (only set on first insert).
- Re-running the import is idempotent: it upserts by `beachId`, updating sourced fields in place without touching `comments`/`waterQuality`.

To apply the validators and indexes for both collections, then import beach data:

```bash
npm install
copy .env.example .env
npm run setup
npm run import:beaches
```
