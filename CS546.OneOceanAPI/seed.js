import moment from 'moment';
import { dbConnection, closeConnection } from './config/mongoConnection.js';
import beachData from './data/beaches.js';
import advisoryData from './data/advisories.js';
import userData from './data/users.js';
import eventData from './data/events.js';

// California's public "Beach Water Quality Postings and Closures" open dataset (data.ca.gov),
// queried through CKAN's datastore_search_sql JSON API rather than the raw CSVs -- the bacteria
// monitoring resource alone is ~1.75GB / 2.3M rows, so filtering/joining happens server-side instead.
const CKAN_SQL_ENDPOINT = 'https://data.ca.gov/api/3/action/datastore_search_sql';
const RESOURCE_BEACHES = 'fcbc9250-06e3-437d-b0c6-3cc5ddde93fc';
const RESOURCE_ADVISORIES = 'd5cd6a23-829c-426d-a63e-689a55a3db9c';
const RESOURCE_BACTERIA = '7bd961cf-abe4-433b-8033-378161237ff3';

const TARGET_ACTIVE_BEACHES = 32;
const TARGET_UNKNOWN_BEACHES = 10;
const MAX_PER_COUNTY_ACTIVE = 5;
const MAX_PER_COUNTY_UNKNOWN = 3;
const ADVISORIES_PER_BEACH_CAP = 3;
const DEMO_PASSWORD = 'Password1!';

const DEMO_USERS = [
  { firstName: 'Demo', lastName: 'User', email: 'demo@oneocean.app', gender: 'NB', city: 'San Diego', state: 'CA', age: 28 },
  { firstName: 'Ava', lastName: 'Martinez', email: 'ava.martinez@oneocean.app', gender: 'F', city: 'Los Angeles', state: 'CA', age: 24 },
  { firstName: 'Liam', lastName: 'Chen', email: 'liam.chen@oneocean.app', gender: 'M', city: 'San Francisco', state: 'CA', age: 31 },
  { firstName: 'Maya', lastName: 'Patel', email: 'maya.patel@oneocean.app', gender: 'F', city: 'Long Beach', state: 'CA', age: 27 },
  { firstName: 'Noah', lastName: 'Garcia', email: 'noah.garcia@oneocean.app', gender: 'M', city: 'Santa Cruz', state: 'CA', age: 35 },
  { firstName: 'Zoe', lastName: 'Thompson', email: 'zoe.thompson@oneocean.app', gender: 'NB', city: 'Santa Barbara', state: 'CA', age: 22 },
  { firstName: 'Ethan', lastName: 'Brooks', email: 'ethan.brooks@oneocean.app', gender: 'M', city: 'Monterey', state: 'CA', age: 40 },
  { firstName: 'Olivia', lastName: 'Reyes', email: 'olivia.reyes@oneocean.app', gender: 'F', city: 'Newport Beach', state: 'CA', age: 33 }
];

const EVENT_TYPES = ['Meet up', 'Beach Cleanup', 'Pinic', 'Barbeque', 'Contest', 'Fishing', 'Swimming', 'Volleyball', 'Frisbee', 'Football', 'Other', 'Beach Cleanup'];
const EVENT_NAMES = [
  'Sunrise Beach Cleanup', 'Community Meet Up', 'Family Picnic Day', 'Beachside Barbeque',
  'Sandcastle Building Contest', 'Morning Fishing Trip', 'Open Water Swim Session',
  'Volleyball Tournament', 'Frisbee Friends Meetup', 'Football on the Sand',
  'Sunset Social Hour', 'Coastal Cleanup Crew'
];
const EVENT_LOCATIONS = [
  'North Parking Lot', 'Lifeguard Tower One', 'Main Beach Entrance', 'Boardwalk Pavilion',
  'South Picnic Area', 'Pier Parking Lot', 'Beach Volleyball Courts', 'Dune Trailhead',
  'Grand Ave Entrance', 'Sunset Point Overlook', 'Cove Overlook Trail', 'Fishing Pier Deck'
];
const EVENT_TIME_SLOTS = [
  { start: '9:00AM', end: '12:00PM' },
  { start: '2:00PM', end: '5:00PM' },
  { start: '10:00AM', end: '1:00PM' }
];
const EVENT_DATE_OFFSETS = [-14, -7, -3, 0, 3, 7, 10, 14, 21, 30, 45, 60];
const EVENT_COMMENT_POOL = [
  "Can't wait for this, count me in!",
  'This was such a fun time last year.',
  'Bringing my whole family to this one.',
  "Let's make this the best turnout yet!"
];

const RATING_POOL = ['3.5', '4', '4.5', '5', '3', '4.5'];
const BEACH_COMMENT_POOL = [
  'Loved the water clarity here -- will be back!',
  'Great spot for a morning walk along the shore.',
  'A bit crowded on weekends but still beautiful.',
  'Perfect for family visits, plenty of space to relax.',
  'The sunset views from here are unbeatable.',
  'Clean sand and calm waves, highly recommend.'
];

const ckanSql = async (sql) => {
  const response = await fetch(`${CKAN_SQL_ENDPOINT}?sql=${encodeURIComponent(sql)}`);
  const json = await response.json();
  if (!json.success) {
    throw new Error(`CKAN query failed: ${JSON.stringify(json.error || json)}`);
  }
  return json.result.records;
};

const sqlQuote = (val) => `'${String(val).replace(/'/g, "''")}'`;
const sqlInList = (values) => values.map(sqlQuote).join(',');

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const fetchEligibleBeachPool = async () => {
  // Pre-filter in SQL to mirror the app's own validators (utils/beach_utils.js) so most rows
  // that come back will actually pass createBeach() -- the per-row try/catch below is a safety
  // net for the rest, not the primary selection mechanism.
  const sql = `
    SELECT "BeachName_id","Beach_Name","NearestCityName","County","Status","Beach Length",
           "Beach_ UpperLon","Beach_UpperLat","Beach_LowerLon","Beach_LowerLat","SwimSeasonLength"
    FROM "${RESOURCE_BEACHES}"
    WHERE "Beach_Name" ~ '^[A-Za-z][A-Za-z,'' -]{4,79}$'
      AND "NearestCityName" ~ '^[A-Za-z][A-Za-z'' -]{1,49}$'
      AND "County" ~ '^[A-Za-z][A-Za-z'' -]{1,49}$'
      AND "Beach Length"::numeric > 0
      AND "Beach_UpperLat" IS NOT NULL AND "Beach_ UpperLon" IS NOT NULL
      AND "Beach_LowerLat" IS NOT NULL AND "Beach_LowerLon" IS NOT NULL
    ORDER BY "County", "BeachName_id"
  `;
  return ckanSql(sql);
};

const fetchBacteriaCoverage = async (ids) => {
  const coverage = new Set();
  for (const group of chunk(ids, 100)) {
    const sql = `SELECT DISTINCT "BeachName_id" FROM "${RESOURCE_BACTERIA}" WHERE "BeachName_id" IN (${sqlInList(group)})`;
    const records = await ckanSql(sql);
    for (const r of records) coverage.add(String(r.BeachName_id));
  }
  return coverage;
};

// Deterministic (no randomness): same source data always produces the same curated set.
// Prefers beaches with real bacteria coverage, then spreads picks across counties round-robin.
const selectCuratedBeaches = (pool, coverageSet) => {
  const pickRoundRobin = (rows, target, maxPerCounty) => {
    const withCoverage = rows.filter((r) => coverageSet.has(String(r.BeachName_id)));
    const withoutCoverage = rows.filter((r) => !coverageSet.has(String(r.BeachName_id)));
    const ordered = [...withCoverage, ...withoutCoverage];

    const byCounty = new Map();
    for (const row of ordered) {
      if (!byCounty.has(row.County)) byCounty.set(row.County, []);
      byCounty.get(row.County).push(row);
    }

    const counties = [...byCounty.keys()];
    const countyCounts = new Map(counties.map((c) => [c, 0]));
    const selected = [];
    let progress = true;
    while (selected.length < target && progress) {
      progress = false;
      for (const county of counties) {
        if (selected.length >= target) break;
        const bucket = byCounty.get(county);
        if (bucket.length === 0 || countyCounts.get(county) >= maxPerCounty) continue;
        selected.push(bucket.shift());
        countyCounts.set(county, countyCounts.get(county) + 1);
        progress = true;
      }
    }
    return selected;
  };

  const activeRows = pool.filter((r) => r.Status === 'Active');
  const otherRows = pool.filter((r) => r.Status !== 'Active');
  const active = pickRoundRobin(activeRows, TARGET_ACTIVE_BEACHES, MAX_PER_COUNTY_ACTIVE);
  const unknown = pickRoundRobin(otherRows, TARGET_UNKNOWN_BEACHES, MAX_PER_COUNTY_UNKNOWN);
  return [...active, ...unknown];
};

const fetchMostRecentBacteria = async (ids) => {
  const sql = `
    SELECT DISTINCT ON ("BeachName_id") "BeachName_id","SampleDate","Parameter","Result","Unit"
    FROM "${RESOURCE_BACTERIA}"
    WHERE "BeachName_id" IN (${sqlInList(ids)})
    ORDER BY "BeachName_id", to_date("SampleDate",'MM/DD/YYYY') DESC
  `;
  const records = await ckanSql(sql);
  const map = new Map();
  for (const r of records) {
    const num = Number(r.Result);
    if (!Number.isNaN(num)) map.set(String(r.BeachName_id), num);
  }
  return map;
};

const fetchAdvisoriesForBeaches = async (ids) => {
  const sql = `
    SELECT "Advisory id","BeachName_id","AdvisoryType","AdvisoryCause","DURATION CALCULATED",
           "DateofAdvisory","TimeofAdvisory","DateOpened","TimeOpened"
    FROM "${RESOURCE_ADVISORIES}"
    WHERE "BeachName_id" IN (${sqlInList(ids)})
    ORDER BY "BeachName_id", "DateofAdvisory" DESC
  `;
  const records = await ckanSql(sql);
  const byBeach = new Map();
  for (const r of records) {
    const id = String(r.BeachName_id);
    if (!byBeach.has(id)) byBeach.set(id, []);
    const bucket = byBeach.get(id);
    if (bucket.length < ADVISORIES_PER_BEACH_CAP) bucket.push(r);
  }
  return byBeach;
};

const insertBeaches = async (curated, bacteriaMap) => {
  const inserted = new Map(); // numeric beachId (string) -> inserted beach doc
  let skipped = 0;
  const skipReasons = [];
  for (const row of curated) {
    const beachId = Number(row.BeachName_id);
    try {
      const status = row.Status === 'Active' ? 'Active' : 'Unknown';
      const beach = await beachData.createBeach(
        beachId,
        row.Beach_Name.trim(),
        row.NearestCityName.trim(),
        row.County.trim(),
        status,
        Number(row['Beach Length']),
        Number(row.Beach_UpperLat),
        Number(row.Beach_LowerLat),
        Number(row['Beach_ UpperLon']),
        Number(row.Beach_LowerLon),
        bacteriaMap.get(String(beachId)) ?? null,
        row.SwimSeasonLength ? String(row.SwimSeasonLength) : null
      );
      inserted.set(String(beachId), beach);
    } catch (e) {
      skipped++;
      if (skipReasons.length < 5) skipReasons.push(`${row.Beach_Name} (${beachId}): ${e}`);
    }
  }
  return { inserted, skipped, skipReasons };
};

// The advisory validator only accepts letters/hyphens/spaces, 5-80 chars; real causes sometimes
// contain digits/punctuation. Falling back to null (an explicitly valid input) for those rather
// than skipping the whole advisory or inventing text.
const sanitizeCause = (str) => {
  if (!str) return null;
  const trimmed = String(str).trim();
  return /^[A-Za-z- ]{5,80}$/.test(trimmed) ? trimmed : null;
};

// Source times look like "16:17" or "9:15"; the validator requires zero-padded HH:MM:SS.
const normalizeTime = (str) => {
  if (!str) return null;
  let t = String(str).trim();
  if (t.split(':').length === 2) t = `${t}:00`;
  const segs = t.split(':');
  if (segs.length !== 3) return null;
  segs[0] = segs[0].padStart(2, '0');
  t = segs.join(':');
  return /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(t) ? t : null;
};

const insertAdvisories = async (advisoriesByBeach, insertedBeaches) => {
  let inserted = 0;
  let skipped = 0;
  const reasonTally = { badType: 0, badTime: 0, other: 0 };
  for (const [beachId, rows] of advisoriesByBeach) {
    if (!insertedBeaches.has(beachId)) continue;
    for (const row of rows) {
      const advisoryType = String(row.AdvisoryType || '').trim().toLowerCase();
      const startTime = normalizeTime(row.TimeofAdvisory);
      if (!advisoryType) { skipped++; reasonTally.badType++; continue; }
      if (!startTime) { skipped++; reasonTally.badTime++; continue; }

      const hasEnd = Boolean(row.DateOpened);
      const rawDuration = hasEnd ? Number(row['DURATION CALCULATED']) : NaN;
      const duration = Number.isFinite(rawDuration) && rawDuration > 0 ? Math.round(rawDuration) : null;

      try {
        await advisoryData.createAdvisory(
          Number(row['Advisory id']),
          Number(beachId),
          advisoryType,
          sanitizeCause(row.AdvisoryCause),
          duration,
          row.DateofAdvisory,
          startTime,
          hasEnd ? row.DateOpened : null,
          hasEnd ? normalizeTime(row.TimeOpened) : null
        );
        inserted++;
      } catch (e) {
        skipped++;
        reasonTally.other++;
      }
    }
  }
  return { inserted, skipped, reasonTally };
};

const createDemoUsers = async () => {
  const users = [];
  for (const u of DEMO_USERS) {
    users.push(await userData.createUser(u.firstName, u.lastName, u.email, u.gender, u.city, u.state, u.age, DEMO_PASSWORD));
  }
  return users;
};

const createDemoEvents = async (users, beaches) => {
  const events = [];
  let attendantsAdded = 0;
  let eventCommentsAdded = 0;

  for (let i = 0; i < EVENT_TYPES.length; i++) {
    const beach = beaches[i % beaches.length];
    const host = users[i % users.length];
    const slot = EVENT_TIME_SLOTS[i % EVENT_TIME_SLOTS.length];
    const eventDate = moment().add(EVENT_DATE_OFFSETS[i], 'days').format('MM/DD/YYYY');

    try {
      const event = await eventData.createEvent(
        host._id,
        beach._id,
        EVENT_NAMES[i % EVENT_NAMES.length],
        EVENT_TYPES[i],
        eventDate,
        slot.start,
        slot.end,
        EVENT_LOCATIONS[i % EVENT_LOCATIONS.length],
        `Join us at ${beach.beachName} for this event! All skill levels welcome.`
      );
      events.push(event);

      const attendeeIds = [];
      const attendeeCount = 2 + (i % 3);
      for (let k = 1; k <= attendeeCount; k++) {
        const attendee = users[(i + k) % users.length];
        if (attendee._id === host._id) continue;
        await eventData.addEventAttendant(event._id, attendee._id);
        attendantsAdded++;
        attendeeIds.push(attendee._id);
      }

      const commentCount = Math.min(1 + (i % 2), attendeeIds.length);
      for (let k = 0; k < commentCount; k++) {
        await eventData.addEventComment(event._id, attendeeIds[k], EVENT_COMMENT_POOL[(i + k) % EVENT_COMMENT_POOL.length]);
        eventCommentsAdded++;
      }
    } catch (e) {
      console.warn(`  Skipped event #${i} (${EVENT_TYPES[i]}): ${e}`);
    }
  }

  return { events, attendantsAdded, eventCommentsAdded };
};

// Each user rates/comments on a deterministic spread of beaches, so profile "reviews" and the
// community activity feed are never empty -- with a dedupe guard since a rater can only rate once.
const createReviews = async (users, beaches) => {
  let ratingsAdded = 0;
  let beachCommentsAdded = 0;
  const seenPairs = new Set();

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const picks = [0, 1, 2, 3].map((k) => beaches[(i + k * users.length) % beaches.length]);
    const uniqueBeaches = [...new Map(picks.map((b) => [b._id, b])).values()];

    for (let j = 0; j < uniqueBeaches.length; j++) {
      const beach = uniqueBeaches[j];
      const pairKey = `${beach._id}:${user._id}`;
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      try {
        await beachData.addBeachRating(beach._id, user._id, RATING_POOL[(i + j) % RATING_POOL.length]);
        ratingsAdded++;
      } catch (e) { /* validation/dedupe guard -- skip */ }

      try {
        await beachData.addBeachComment(beach._id, user._id, `${BEACH_COMMENT_POOL[(i + j) % BEACH_COMMENT_POOL.length]} (${beach.beachName})`);
        beachCommentsAdded++;
      } catch (e) { /* validation guard -- skip */ }
    }
  }

  return { ratingsAdded, beachCommentsAdded };
};

const main = async () => {
  const db = await dbConnection();
  await db.dropDatabase();
  console.log('Seeding One Ocean database...\n');

  console.log('Fetching beach pool from data.ca.gov...');
  const pool = await fetchEligibleBeachPool();
  if (!pool.length) throw new Error('No eligible beaches returned from the CA open dataset -- aborting seed.');
  console.log(`  ${pool.length} eligible beaches found in source data.`);

  const poolIds = pool.map((r) => String(r.BeachName_id));
  console.log('Checking bacteria monitoring coverage...');
  const coverageSet = await fetchBacteriaCoverage(poolIds);
  console.log(`  ${coverageSet.size} of ${poolIds.length} beaches have bacteria monitoring data.`);

  const curated = selectCuratedBeaches(pool, coverageSet);
  const countySet = new Set(curated.map((r) => r.County));
  console.log(`Selected ${curated.length} curated beaches across ${countySet.size} counties.`);

  const curatedIds = curated.map((r) => String(r.BeachName_id));
  console.log('Fetching most recent bacteria readings for curated beaches...');
  const bacteriaMap = await fetchMostRecentBacteria(curatedIds);
  console.log(`  ${bacteriaMap.size} curated beaches have a real bacteria reading.`);

  console.log('Inserting beaches...');
  const { inserted: insertedBeaches, skipped: beachesSkipped, skipReasons: beachSkipReasons } = await insertBeaches(curated, bacteriaMap);
  console.log(`  ${insertedBeaches.size} inserted, ${beachesSkipped} skipped.`);
  beachSkipReasons.forEach((r) => console.log(`    - ${r}`));
  if (insertedBeaches.size === 0) throw new Error('No beaches were inserted -- aborting seed.');

  console.log('Fetching advisories for curated beaches...');
  const advisoriesByBeach = await fetchAdvisoriesForBeaches([...insertedBeaches.keys()]);
  console.log('Inserting advisories...');
  const { inserted: advisoriesInserted, skipped: advisoriesSkipped, reasonTally } = await insertAdvisories(advisoriesByBeach, insertedBeaches);
  console.log(`  ${advisoriesInserted} inserted, ${advisoriesSkipped} skipped (${JSON.stringify(reasonTally)}).`);

  console.log('Creating demo users...');
  const users = await createDemoUsers();
  console.log(`  ${users.length} users created.`);

  const beachList = [...insertedBeaches.values()];

  console.log('Creating community events...');
  const { events, attendantsAdded, eventCommentsAdded } = await createDemoEvents(users, beachList);
  console.log(`  ${events.length} events created, ${attendantsAdded} RSVPs, ${eventCommentsAdded} event comments.`);

  console.log('Creating beach ratings and comments...');
  const { ratingsAdded, beachCommentsAdded } = await createReviews(users, beachList);
  console.log(`  ${ratingsAdded} ratings, ${beachCommentsAdded} comments added.`);

  const activeAdvisories = await advisoryData.getAllActiveAdvisories();

  console.log('\n===== Seed Summary =====');
  console.log(`Beaches:    ${insertedBeaches.size} inserted / ${beachesSkipped} skipped (of ${curated.length} curated, ${pool.length} eligible in source data)`);
  console.log(`Advisories: ${advisoriesInserted} inserted / ${advisoriesSkipped} skipped ${JSON.stringify(reasonTally)}`);
  console.log(`Users:      ${users.length} created`);
  console.log(`Events:     ${events.length} created, ${attendantsAdded} RSVPs, ${eventCommentsAdded} event comments`);
  console.log(`Reviews:    ${ratingsAdded} beach ratings, ${beachCommentsAdded} beach comments`);
  console.log(`Active advisories currently live: ${activeAdvisories.length}`);
  console.log(`\nDemo login -- email: ${DEMO_USERS[0].email} / password: ${DEMO_PASSWORD}`);
  console.log('=========================\n');

  await closeConnection();
};

main().catch(async (e) => {
  console.error('Fatal error during seeding:', e);
  await closeConnection();
  process.exitCode = 1;
});
