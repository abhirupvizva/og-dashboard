
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const uri = process.env.TEAMS_MONGODB_URI;

if (!uri) {
    throw new Error("TEAMS_MONGODB_URI not found in .env");
}

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to Teams DB");

    const dbs = await client.db().admin().listDatabases();
    console.log("Databases:");
    dbs.databases.forEach(db => console.log(` - ${db.name}`));

    // Assume there is a database (maybe 'test' or 'teams' or 'vizvaconsultancyteams')
    // I'll pick the first non-system one or the one in the URI if specified (URI has no path, so default 'test')

    // Let's list collections in the default db (which might be 'test' if not specified)
    // Actually, let's look at the dbs list first.

    // Also check 'vizvaconsultancyteams' if it exists in the list? No, the host is that.

    // I will list collections of the first non-system DB.
    const targetDbName = dbs.databases.find(d => !['admin', 'local', 'config'].includes(d.name))?.name;
    if (targetDbName) {
        console.log(`\nInspecting DB: ${targetDbName}`);
        const db = client.db(targetDbName);
        const collections = await db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        for (const col of collections) {
            console.log(`\nSample from ${col.name}:`);
            const doc = await db.collection(col.name).findOne({});
            console.log(JSON.stringify(doc, null, 2));
        }
    } else {
        console.log("No user databases found.");
    }

  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

run();
