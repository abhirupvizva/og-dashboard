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

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1", 10)
    const limit = parseInt(searchParams.get("limit") || "100", 10)
    const skip = (page - 1) * limit
    const sortParam = searchParams.get("sort")

    // Build MongoDB filter from query parameters
    const filter: any = {}

    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    if (dateFrom || dateTo) {
      filter["Date of Interview"] = {}
      if (dateFrom) {
        const convertedFrom = convertDateFormat(dateFrom) // Convert to MM/DD/YYYY
        filter["Date of Interview"]["$gte"] = convertedFrom
      }
      if (dateTo) {
        const convertedTo = convertDateFormat(dateTo) // Convert to MM/DD/YYYY
        filter["Date of Interview"]["$lte"] = convertedTo
      }
    }

    const assignedTo = searchParams.get("assignedTo")
    if (assignedTo && assignedTo.trim()) {
      filter["assignedTo"] = assignedTo
    }

    // Multiple experts filter
    const experts = searchParams.get("experts")
    if (experts && experts.trim()) {
      const expertsArray = experts.split(",").filter((e) => e.trim())
      if (expertsArray.length > 0) {
        filter["assignedTo"] = { $in: expertsArray }
      }
    }

    const excludeRounds = searchParams.get("excludeRounds")
    if (excludeRounds) {
      const roundsArray = excludeRounds.split(",").filter((r) => r.trim())
      if (roundsArray.length > 0) {
        filter["actualRound"] = { $nin: roundsArray }
      }
    }

    const status = searchParams.get("status")
    if (status && status.trim()) {
      filter["status"] = status
    }

    // Client filter
    const client = searchParams.get("client")
    if (client && client !== "All" && client.trim()) {
      filter["End Client"] = client
    }

    const search = searchParams.get("search")
    if (search && search.trim()) {
      // Escape regex special characters to treat input as literal string
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      filter["$or"] = [
        { "Candidate Name": { $regex: escapedSearch, $options: "i" } },
        { "End Client": { $regex: escapedSearch, $options: "i" } },
        { "subject": { $regex: escapedSearch, $options: "i" } },
      ]
    }

    // New: Filter for replies existence
    const hasReplies = searchParams.get("hasReplies")
    if (hasReplies === "true") {
      filter["replies"] = { $exists: true, $not: { $size: 0 } }
    }

    const mongoClient = await getMongoClient()
    const db = mongoClient.db("interviewSupport")
    const collection = db.collection("taskBody")

    // Get total count for pagination
    const totalCount = await collection.countDocuments(filter)

    let interviews: any[] = []

    if (sortParam === "receivedDateTime:-1") {
      const pipeline = [
        { $match: filter },
        {
          $addFields: {
            replyDates: {
              $map: {
                input: { $ifNull: ["$replies", []] },
                as: "r",
                in: {
                  $convert: {
                    input: "$$r.receivedDateTime",
                    to: "date",
                    onError: null,
                    onNull: null,
                  }
                }
              }
            }
          }
        },
        {
          $addFields: {
            latestReplyDate: {
              $max: {
                $filter: {
                  input: "$replyDates",
                  as: "d",
                  cond: { $ne: ["$$d", null] }
                }
              }
            }
          }
        },
        { $sort: { latestReplyDate: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $project: { replyDates: 0 } },
      ]
      interviews = await collection.aggregate(pipeline).toArray()
    } else {
      interviews = await collection.find(filter).skip(skip).limit(limit).toArray()
    }

    return Response.json({
      interviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return Response.json({ error: "Failed to fetch interviews" }, { status: 500 })
  }
}
