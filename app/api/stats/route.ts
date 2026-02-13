import { getMongoClient } from "@/lib/mongodb"
export const runtime = "nodejs"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mongoClient = await getMongoClient()
    const db = mongoClient.db("interviewSupport")
    const collection = db.collection("taskBody")

    const filter: any = {}

    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    if (dateFrom || dateTo) {
      filter["Date of Interview"] = {}
      if (dateFrom) {
         const [y, m, d] = dateFrom.split("-")
         filter["Date of Interview"]["$gte"] = `${m}/${d}/${y}`
      }
      if (dateTo) {
         const [y, m, d] = dateTo.split("-")
         filter["Date of Interview"]["$lte"] = `${m}/${d}/${y}`
      }
    }

    const assignedTo = searchParams.get("assignedTo")
    if (assignedTo && assignedTo.trim()) {
      filter["assignedTo"] = { $regex: assignedTo, $options: "i" }
    }

    // Support multiple experts via "experts" query (comma-separated names)
    const experts = searchParams.get("experts")
    if (experts && experts.trim()) {
      const expertsArray = experts
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean)
      if (expertsArray.length > 0) {
        filter["assignedTo"] = { $in: expertsArray }
      }
    }

    const status = searchParams.get("status")
    if (status && status.trim()) {
      filter["status"] = status
    }

    const client = searchParams.get("client")
    if (client && client !== "All" && client.trim()) {
      filter["End Client"] = client
    }

    const excludeRounds = searchParams.get("excludeRounds")
    if (excludeRounds && excludeRounds.trim()) {
      const rounds = excludeRounds
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
      if (rounds.length > 0) {
        filter["actualRound"] = { $nin: rounds }
      }
    }

    const pipeline = [
      { $match: filter },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: "$status", count: { $sum: 1 } } }
          ],
          expertStats: [
            {
              $addFields: {
                assignedReply: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: { $ifNull: ["$replies", []] },
                        as: "reply",
                        cond: {
                          $regexMatch: {
                            input: "$$reply.body",
                            regex: "Assigned To:",
                            options: "i"
                          }
                        }
                      }
                    },
                    0
                  ]
                }
              }
            },
            {
              $match: {
                "assignedReply": { $exists: true, $ne: null }
              }
            },
            {
              $addFields: {
                expertInfo: {
                  $regexFind: {
                    input: "$assignedReply.body",
                    regex: "Assigned To:\\s*@([^[\\]]+)",
                    options: "i"
                  }
                }
              }
            },
            {
              $addFields: {
                 expertName: {
                   $trim: {
                     input: { $arrayElemAt: ["$expertInfo.captures", 0] }
                   }
                 }
              }
            },
            {
               $match: { expertName: { $exists: true, $ne: "" } }
            },
            {
              $group: {
                _id: "$expertName",
                count: { $sum: 1 },
                completed: {
                  $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
                }
              }
            },
            {
              $project: {
                _id: 1,
                count: 1,
                completed: 1,
                efficiency: {
                  $cond: [
                    { $eq: ["$count", 0] },
                    0,
                    { $multiply: [{ $divide: ["$completed", "$count"] }, 100] }
                  ]
                }
              }
            },
            { $sort: { count: -1 } },
            { $limit: 20 }
          ],
          totalCount: [
            { $count: "count" }
          ],
          clientStats: [
            { $group: { _id: "$End Client", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ],
          rounds: [
            { $match: { actualRound: { $exists: true, $ne: "" } } },
            { $group: { _id: "$actualRound" } },
            { $sort: { _id: 1 } }
          ],
          // Basic timeline based on Date of Interview string
          timeline: [
             { $group: { _id: "$Date of Interview", count: { $sum: 1 } } },
             { $sort: { _id: 1 } } // Note: String sort might not be perfect for dates, but sufficient for simple charts if format is consistent
          ]
        }
      }
    ]

    const results = await collection.aggregate(pipeline).toArray()
    const stats = results[0]

    const formattedStats = {
      statusCounts: stats.statusCounts.reduce((acc: any, curr: any) => {
        const key = curr._id || "Unknown"
        acc[key] = curr.count
        return acc
      }, {}),
      expertStats: stats.expertStats.map((s: any) => ({
        name: s._id,
        count: s.count,
        completed: s.completed,
        efficiency: Math.round(s.efficiency || 0)
      })),
      clientStats: stats.clientStats.map((s: any) => ({ name: s._id, count: s.count })),
      rounds: stats.rounds.map((s: any) => s._id),
      timeline: stats.timeline.map((s: any) => ({ date: s._id, count: s.count })),
      total: stats.totalCount[0]?.count || 0
    }

    return Response.json(formattedStats)
  } catch (error) {
    console.error("Stats API Error:", error)
    return Response.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
