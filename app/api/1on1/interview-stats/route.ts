import { getMongoClient } from "@/lib/mongodb"

export const runtime = "nodejs"

/**
 * GET /api/1on1/interview-stats?email=...&month=YYYY-MM
 *
 * Aggregates interview counts from interviewSupport.taskBody for a given
 * expert email + month.  Email matching is case-insensitive so
 * "Aakash.sharma@vizvainc.com" and "aakash.sharma@vizvainc.com" both match.
 *
 * Returns:
 * {
 *   received: number,         // total interviews assigned
 *   completed: number,        // status === "Completed"
 *   rescheduled: number,      // status === "Rescheduled"
 *   cancelled: number,        // status === "Cancelled"
 *   rescheduledCancelled: number,  // rescheduled + cancelled combined
 *   notDone: number,          // received - rescheduledCancelled - completed
 * }
 */

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function getMonthDateRange(month: string): { start: string; end: string } | null {
  const match = month.match(/^(\d{4})-(\d{2})$/)
  if (!match) return null

  const year = parseInt(match[1], 10)
  const mon = parseInt(match[2], 10)

  // Date of Interview is stored as "MM/DD/YYYY" strings in DB
  const mm = String(mon).padStart(2, "0")
  const yyyy = String(year)

  // Build start = MM/01/YYYY, end = MM/lastDay/YYYY
  const lastDay = new Date(year, mon, 0).getDate()
  const start = `${mm}/01/${yyyy}`
  const end = `${mm}/${String(lastDay).padStart(2, "0")}/${yyyy}`

  return { start, end }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = (searchParams.get("email") || "").trim()
    const month = (searchParams.get("month") || "").trim()

    if (!email) {
      return Response.json({ error: "Missing 'email' parameter" }, { status: 400 })
    }
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return Response.json({ error: "Invalid 'month' parameter, expected YYYY-MM" }, { status: 400 })
    }

    const dateRange = getMonthDateRange(month)
    if (!dateRange) {
      return Response.json({ error: "Could not parse month" }, { status: 400 })
    }

    const mongoClient = await getMongoClient()
    const db = mongoClient.db("interviewSupport")
    const collection = db.collection("taskBody")

    // Case-insensitive email match + date range filter
    // Exclude Screening and On Demand AI rounds from KPI counts
    const escapedEmail = escapeRegex(email)
    const EXCLUDED_ROUNDS = ["Screening", "On Demand or AI Interview"]
    const filter: any = {
      assignedTo: { $regex: `^${escapedEmail}$`, $options: "i" },
      "Date of Interview": {
        $gte: dateRange.start,
        $lte: dateRange.end,
      },
      actualRound: { $nin: EXCLUDED_ROUNDS },
    }

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          received: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
          rescheduled: {
            $sum: { $cond: [{ $eq: ["$status", "Rescheduled"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
          },
        },
      },
    ]

    const results = await collection.aggregate(pipeline).toArray()
    const row = results[0] || { received: 0, completed: 0, rescheduled: 0, cancelled: 0 }

    const rescheduledCancelled = (row.rescheduled || 0) + (row.cancelled || 0)
    const effective = Math.max(0, (row.received || 0) - rescheduledCancelled)
    const notDone = Math.max(0, effective - (row.completed || 0))

    return Response.json({
      received: row.received || 0,
      completed: row.completed || 0,
      rescheduled: row.rescheduled || 0,
      cancelled: row.cancelled || 0,
      rescheduledCancelled,
      notDone,
    })
  } catch (error) {
    console.error("Interview Stats API Error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to fetch interview stats" },
      { status: 500 }
    )
  }
}
