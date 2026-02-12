import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

let cachedClient: MongoClient | null = null

export async function getMongoClient() {
  if (cachedClient) {
    return cachedClient
  }

  try {
    const client = new MongoClient(MONGODB_URI!)
    await client.connect()
    cachedClient = client
    return client
  } catch (error) {
    console.error("MongoDB connection error:", error)
    throw error
  }
}
