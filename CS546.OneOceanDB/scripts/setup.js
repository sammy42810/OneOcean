import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { usersIndexes, usersValidator } from '../schema/users.js';
import { beachesIndexes, beachesValidator } from '../schema/beaches.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const databaseName = process.env.MONGO_DB_NAME || 'oneocean';
const client = new MongoClient(mongoUri);

const collectionContracts = [
  { name: 'users', validator: usersValidator, indexes: usersIndexes },
  { name: 'beaches', validator: beachesValidator, indexes: beachesIndexes }
];

const applyContract = async (db, { name, validator, indexes }) => {
  const collections = await db.listCollections({ name }).toArray();

  if (collections.length === 0) {
    await db.createCollection(name, {
      validator,
      validationLevel: 'strict',
      validationAction: 'error'
    });
    console.log(`Created ${name} collection with its schema validator.`);
  } else {
    await db.command({
      collMod: name,
      validator,
      validationLevel: 'strict',
      validationAction: 'error'
    });
    console.log(`Updated ${name} collection schema validator.`);
  }

  const collection = db.collection(name);
  for (const index of indexes) {
    const options = { name: index.name, unique: index.unique };
    if (index.collation) options.collation = index.collation;
    await collection.createIndex(index.key, options);
  }
  console.log(`Ensured ${name} indexes.`);
};

try {
  await client.connect();
  const db = client.db(databaseName);

  for (const contract of collectionContracts) {
    await applyContract(db, contract);
  }
} finally {
  await client.close();
}
