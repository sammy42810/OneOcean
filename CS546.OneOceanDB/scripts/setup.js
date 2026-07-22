import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { usersIndexes, usersValidator } from '../schema/users.js';

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const databaseName = process.env.MONGO_DB_NAME || 'oneocean';
const client = new MongoClient(mongoUri);

try {
  await client.connect();
  const db = client.db(databaseName);
  const collections = await db.listCollections({ name: 'users' }).toArray();

  if (collections.length === 0) {
    await db.createCollection('users', {
      validator: usersValidator,
      validationLevel: 'strict',
      validationAction: 'error'
    });
    console.log('Created users collection with its schema validator.');
  } else {
    await db.command({
      collMod: 'users',
      validator: usersValidator,
      validationLevel: 'strict',
      validationAction: 'error'
    });
    console.log('Updated users collection schema validator.');
  }

  const usersCollection = db.collection('users');
  for (const index of usersIndexes) {
    await usersCollection.createIndex(index.key, {
      name: index.name,
      unique: index.unique,
      collation: index.collation
    });
  }
  console.log('Ensured users indexes.');
} finally {
  await client.close();
}
