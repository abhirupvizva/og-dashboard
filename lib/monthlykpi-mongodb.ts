import { MongoClient } from "mongodb"

const PRIMARY = process.env.MONTHLYKPI_MONGODB_URI || process.env.TEAMS_MONGODB_URI || process.env.MONGODB_URI
const SECONDARY = process.env.MONTHLYKPI_MONGODB_URI_SECONDARY || process.env.TEAMS_MONGODB_URI_SECONDARY
const ACTIVE = (process.env.MONTHLYKPI_MONGODB_URI_ACTIVE || process.env.TEAMS_MONGODB_URI_ACTIVE || "primary").toLowerCase()
const FALLBACK = (process.env.MONTHLYKPI_MONGODB_FALLBACK || "true").toLowerCase() !== "false"

function pickUri() {
  if (ACTIVE === "secondary" && SECONDARY) return SECONDARY
  return PRIMARY
}

if (!PRIMARY) {
  throw new Error('Invalid/Missing environment variable: "MONTHLYKPI_MONGODB_URI"')
}

let cached: { uri: string; client: MongoClient } | null = null

async function connect(uri: string) {
  const client = new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 0,
    serverSelectionTimeoutMS: 5000,
  })
  await client.connect()
  return client
}

export async function getMonthlyKpiMongoClient() {
  const uri = pickUri()
  if (!uri) {
    throw new Error('Invalid/Missing environment variable: "MONTHLYKPI_MONGODB_URI"')
  }

  if (cached && cached.uri === uri) {
    return cached.client
  }

  try {
    const client = await connect(uri)
    cached = { uri, client }
    return client
  } catch (e) {
    if (!FALLBACK) throw e
    const fallbackUri = process.env.MONGODB_URI
    if (!fallbackUri || fallbackUri === uri) throw e
    const client = await connect(fallbackUri)
    cached = { uri: fallbackUri, client }
    return client
  }
}

