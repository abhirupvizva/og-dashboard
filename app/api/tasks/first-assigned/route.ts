import { getMongoClient } from "@/lib/mongodb"
export const runtime = "nodejs"

function convertDateFormat(dateStr: string): string {
  if (!dateStr) return ""
  const [year, month, day] = dateStr.split("-")
  return `${month}/${day}/${year}`
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filter: any = {}

    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    if (dateFrom || dateTo) {
      filter["Date of Interview"] = {}
      if (dateFrom) filter["Date of Interview"]["$gte"] = convertDateFormat(dateFrom)
      if (dateTo) filter["Date of Interview"]["$lte"] = convertDateFormat(dateTo)
    }

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
        filter["assignedTo"] = { $in: expertsArray }
      }
    }

    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10) || 50, 200)

    const mongoClient = await getMongoClient()
    const db = mongoClient.db("interviewSupport")
    const collection = db.collection("taskBody")

    const pipeline = [
      { $match: filter },
      {
        $facet: {
          total: [{ $count: "count" }],
          items: [
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
                            options: "i",
                          },
                        },
                      },
                    },
                    0,
                  ],
                },
              },
            },
            {
              $addFields: {
                expertInfo: {
                  $regexFind: {
                    input: { $ifNull: ["$assignedReply.body", ""] },
                    regex: "Assigned To:\\s*@([^[\\]]+)",
                    options: "i",
                  },
                },
              },
            },
            {
              $addFields: {
                firstAssignedExpert: {
                  $let: {
                    vars: {
                      tagged: {
                        $trim: {
                          input: { $arrayElemAt: ["$expertInfo.captures", 0] },
                        },
                      },
                    },
                    in: {
                      $cond: [
                        { $and: [{ $ne: ["$$tagged", null] }, { $ne: ["$$tagged", ""] }] },
                        "$$tagged",
                        { $ifNull: ["$assignedTo", "Unassigned"] },
                      ],
                    },
                  },
                },
              },
            },
            {
              $project: {
                _id: 1,
                subject: 1,
                status: 1,
                firstAssignedExpert: 1,
              },
            },
            { $sort: { _id: -1 } },
            { $limit: limit },
          ],
        },
      },
    ]

    const results = await collection.aggregate(pipeline).toArray()
    const doc = results[0] || {}
    const total = doc.total?.[0]?.count || 0
    const items = doc.items || []

    return Response.json({ total, items })
  } catch (error) {
    console.error("First Assigned API Error:", error)
    return Response.json({ error: "Failed to fetch first assigned list" }, { status: 500 })
  }
}
