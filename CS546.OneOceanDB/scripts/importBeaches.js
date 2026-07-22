import 'dotenv/config';
import { parse } from 'csv-parse/sync';
import { MongoClient } from 'mongodb';
import { beachesIndexes, beachesValidator } from '../schema/beaches.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const databaseName = process.env.MONGO_DB_NAME || 'oneocean';

const CKAN_DATASET_BASE = 'https://data.ca.gov/dataset/b9c8ce91-40ff-4ad3-8164-bc17c46afb44/resource';
const BEACH_DETAIL_CSV_URL = `${CKAN_DATASET_BASE}/fcbc9250-06e3-437d-b0c6-3cc5ddde93fc/download/beach-information-csv.csv`;
const BEACH_ADVISORIES_CSV_URL = `${CKAN_DATASET_BASE}/d5cd6a23-829c-426d-a63e-689a55a3db9c/download/beach-advisories.csv`;

const fetchCsv = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return parse(text, { columns: true, bom: true, skip_empty_lines: true });
};

const buildAdvisoriesByBeachId = (advisoryRows) => {
  const advisoriesByBeachId = new Map();

  for (const row of advisoryRows) {
    if (!row.AdvisoryType || row.DateOpened) continue;

    const beachId = row.BeachName_id;
    if (!advisoriesByBeachId.has(beachId)) advisoriesByBeachId.set(beachId, new Set());
    advisoriesByBeachId.get(beachId).add(`${row.AdvisoryType}: ${row.AdvisoryCause || 'Unknown Cause'}`);
  }

  return advisoriesByBeachId;
};

const numberOrFallback = (value, fallbackValue) => (value ? Number(value) : Number(fallbackValue));

const toBeachDocument = (row, advisoriesByBeachId) => ({
  beachId: row.BeachName_id,
  name: row.Beach_Name.trim(),
  location: `${row.NearestCityName}, ${row.County}`,
  status: row.Status === 'Active' ? 'Active' : 'Inactive',
  beachLength: Number(row['Beach Length']) || 0,
  advisories: [...(advisoriesByBeachId.get(row.BeachName_id) || [])],
  upperLat: numberOrFallback(row.Beach_UpperLat, row.Beach_LowerLat),
  lowerLat: numberOrFallback(row.Beach_LowerLat, row.Beach_UpperLat),
  upperLon: numberOrFallback(row['Beach_ UpperLon'], row.Beach_LowerLon),
  lowerLon: numberOrFallback(row.Beach_LowerLon, row['Beach_ UpperLon'])
});

const client = new MongoClient(mongoUri);

try {
  const [beachRows, advisoryRows] = await Promise.all([
    fetchCsv(BEACH_DETAIL_CSV_URL),
    fetchCsv(BEACH_ADVISORIES_CSV_URL)
  ]);

  const advisoriesByBeachId = buildAdvisoriesByBeachId(advisoryRows);
  const beachDocuments = beachRows
    .filter((row) => row.CountAsBeach === '1')
    .map((row) => toBeachDocument(row, advisoriesByBeachId));

  await client.connect();
  const db = client.db(databaseName);

  await db.command({
    collMod: 'beaches',
    validator: beachesValidator,
    validationLevel: 'strict',
    validationAction: 'error'
  });
  const beaches = db.collection('beaches');
  for (const index of beachesIndexes) {
    const options = { name: index.name, unique: index.unique };
    if (index.collation) options.collation = index.collation;
    await beaches.createIndex(index.key, options);
  }

  const bulkOps = beachDocuments.map((doc) => ({
    updateOne: {
      filter: { beachId: doc.beachId },
      update: {
        $set: doc,
        $setOnInsert: { waterQuality: null, comments: [] }
      },
      upsert: true
    }
  }));

  const result = await beaches.bulkWrite(bulkOps, { ordered: false });
  console.log(
    `Imported ${beachDocuments.length} beaches: ${result.upsertedCount} inserted, ${result.modifiedCount} updated.`
  );
} finally {
  await client.close();
}
