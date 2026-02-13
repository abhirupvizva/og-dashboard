import { getMongoClient } from "@/lib/mongodb"
export const runtime = "nodejs"

export async function GET() {
  try {
    const mongoClient = await getMongoClient()
    const db = mongoClient.db("interviewSupport")
    const collection = db.collection("candidateDetails")

    const pipeline = [
      {
        $project: {
          expertValue: { $ifNull: ["$Expert", "$expert"] },
          statusValue: "$status",
        },
      },
      {
        $facet: {
          experts: [
            { $match: { expertValue: { $exists: true, $ne: null, $ne: "" } } },
            { $group: { _id: "$expertValue" } },
            { $sort: { _id: 1 } },
          ],
          statuses: [
            { $match: { statusValue: { $exists: true, $ne: null, $ne: "" } } },
            { $group: { _id: "$statusValue" } },
            { $sort: { _id: 1 } },
          ],
        },
      },
    ]

    const results = await collection.aggregate(pipeline).toArray()
    const doc = results[0] || {}
    const experts = (doc.experts || []).map((x: any) => x._id)
    const statuses = (doc.statuses || []).map((x: any) => x._id)

    return Response.json({ experts, statuses })
  } catch (error) {
    console.error("Buckets Filters API Error:", error)
    return Response.json({ error: "Failed to fetch buckets filters" }, { status: 500 })
  }
}

