import { MongoClient } from "mongodb"
export const runtime = "nodejs"

const TEAMS_URI = process.env.TEAMS_MONGODB_URI

let cachedClient: MongoClient | null = null

async function getTeamsClient() {
  if (!TEAMS_URI) {
    throw new Error('Invalid/Missing environment variable: "TEAMS_MONGODB_URI"')
  }

  if (cachedClient) return cachedClient
  try {
    const client = new MongoClient(TEAMS_URI, { serverSelectionTimeoutMS: 5000 })
    await client.connect()
    cachedClient = client
    return client
  } catch (err) {
    console.error("Teams DB Connection Error:", err)
    throw err
  }
}

export async function GET() {
  try {
    const client = await getTeamsClient()
    // The URI provided doesn't specify a DB name, so it defaults to 'test' usually.
    // We should check available databases or collections.
    const admin = client.db().admin()
    const dbs = await admin.listDatabases()

    // Pick the first non-system database
    const targetDbName = dbs.databases.find(d => !['admin', 'local', 'config'].includes(d.name))?.name

    if (!targetDbName) {
        return Response.json({ teams: [], message: "No user database found" })
    }

    const db = client.db(targetDbName)
    const collections = await db.listCollections().toArray()

    // Look for 'teams' or 'experts' collection
    const teamCol = collections.find(c => c.name.toLowerCase().includes('team') || c.name.toLowerCase().includes('expert'))

    let teams = []
    if (teamCol) {
       teams = await db.collection(teamCol.name).find({}).toArray()
    } else {
       // If no obvious team collection, return all collection names for now (debugging)
       teams = collections.map(c => ({ name: c.name, type: 'collection' }))
    }

    return Response.json({ teams, dbName: targetDbName })
  } catch (error) {
    console.error("Teams API Error:", error)
    return Response.json({ teams: [], error: "Failed to fetch teams" })
  }
}
