import { MongoClient } from "mongodb"

const PRIMARY = process.env.TEAMS_MONGODB_URI_PRIMARY || process.env.TEAMS_MONGODB_URI
const SECONDARY = process.env.TEAMS_MONGODB_URI_SECONDARY
const ACTIVE = (process.env.TEAMS_MONGODB_URI_ACTIVE || "primary").toLowerCase()

function pickUri() {
  if (ACTIVE === "secondary" && SECONDARY) return SECONDARY
  return PRIMARY
}

if (!PRIMARY) {
  throw new Error('Invalid/Missing environment variable: "TEAMS_MONGODB_URI"')
}

let cached: { uri: string; client: MongoClient } | null = null

export async function getTeamsMongoClient() {
  const uri = pickUri()
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "TEAMS_MONGODB_URI"')
  }

  if (cached && cached.uri === uri) {
    return cached.client
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 5000,
  })
  await client.connect()
  cached = { uri, client }
  return client
}

