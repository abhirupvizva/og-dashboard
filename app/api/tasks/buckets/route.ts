import { getMongoClient } from "@/lib/mongodb"
export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filter: any = {}

    const status = searchParams.get("status")
    if (status && status.trim() && status !== "all") {
      filter["status"] = status
    }

    const experts = searchParams.get("experts")
    if (experts && experts.trim()) {
      const expertsArray = experts
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
      if (expertsArray.length > 0) {
        filter["$or"] = [{ Expert: { $in: expertsArray } }, { expert: { $in: expertsArray } }]
      }
    } else {
      const expert = searchParams.get("expert")
      if (expert && expert.trim() && expert !== "all") {
        filter["$or"] = [{ Expert: expert }, { expert }]
      }
    }

    const mongoClient = await getMongoClient()
    const db = mongoClient.db("interviewSupport")
    const collection = db.collection("candidateDetails")

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: {
            expert: { $ifNull: ["$Expert", { $ifNull: ["$expert", "Unassigned"] }] },
            candidate: { $ifNull: ["$Candidate Name", "Unknown"] },
          },
          items: { $sum: 1 },
        },
      },
      { $sort: { items: -1 } },
      {
        $group: {
          _id: "$_id.expert",
          totalItems: { $sum: "$items" },
          candidates: { $push: { name: "$_id.candidate", count: "$items" } },
        },
      },
      {
        $addFields: {
          totalCandidates: { $size: "$candidates" },
        },
      },
      { $sort: { totalCandidates: -1 } },
      {
        $project: {
          _id: 0,
          expert: "$_id",
          totalItems: 1,
          totalCandidates: 1,
          candidates: 1,
        },
      },
    ]

    const buckets = await collection.aggregate(pipeline).toArray()
    return Response.json({ buckets })
  } catch (error) {
    console.error("Buckets API Error:", error)
    return Response.json({ error: "Failed to fetch buckets" }, { status: 500 })
  }
}
