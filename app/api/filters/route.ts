
import { getMongoClient } from "@/lib/mongodb"
export const runtime = "nodejs"

export async function GET() {
  try {
    const mongoClient = await getMongoClient()
    const db = mongoClient.db("interviewSupport")
    const collection = db.collection("taskBody")

    // Get unique Assigned To (Experts)
    // We filter out empty strings or nulls
    const experts = await collection.distinct("assignedTo", { assignedTo: { $ne: "" } })

    // Get unique End Clients
    const clients = await collection.distinct("End Client", { "End Client": { $ne: "" } })

    return Response.json({
      experts: experts.filter(Boolean).sort(),
      clients: clients.filter(Boolean).sort()
    })
  } catch (error) {
    console.error("Filters API Error:", error)
    return Response.json({ experts: [], clients: [] }, { status: 500 })
  }
}
