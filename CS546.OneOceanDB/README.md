# One Ocean Database

This repository owns database lifecycle artifacts: collection validators, indexes, migrations, and seed/import scripts. Runtime API CRUD code remains in `CS546.OneOceanAPI`.

## Users collection

The Users contract uses MongoDB's native `_id` and the API's established field names: `firstName`, `lastName`, `email`, `gender`, `city`, `state`, `age`, `hashedPassword`, and `favoriteBeaches`.

To apply the validator and case-insensitive unique `email` index:

```bash
npm install
copy .env.example .env
npm run setup
```
