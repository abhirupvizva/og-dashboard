import { getMongoClient } from "@/lib/mongodb"
export const runtime = "nodejs"

function parseTs(s?: string) {
  const t = Date.parse(s || "")
  return Number.isFinite(t) ? t : null
}

export async function GET() {
  try {
    const mongoClient = await getMongoClient()
    const db = mongoClient.db("interviewSupport")
    const collection = db.collection("taskBody")

    // Fetch a broad slice; adjust if needed
    const docs = await collection
      .find({}, { projection: { replies: 1, actualRound: 1 } })
      .sort({ _id: -1 })
      .limit(3000)
      .toArray()

    const expertSet = new Set<string>()
    const roundSet = new Set<string>()
    for (const d of docs) {
      const rv = (d as any)?.actualRound
      if (rv && typeof rv === "string" && rv.trim()) {
        roundSet.add(rv.trim())
      }
      const replies = Array.isArray(d.replies) ? d.replies : []
      if (replies.length === 0) continue
      let first = replies[0]
      let minTs = parseTs(replies[0]?.receivedDateTime) ?? Infinity
      for (let i = 1; i < replies.length; i++) {
        const ts = parseTs(replies[i]?.receivedDateTime)
        if (ts !== null && ts < minTs) {
          minTs = ts
          first = replies[i]
        }
      }
      const body = String(first?.body || "")
      const emailBracket = body.match(/Assigned To:[^\[]*\[([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\]/i)
      let expert: string | null = null
      if (emailBracket && emailBracket[1]) {
        expert = emailBracket[1].trim()
      } else {
        const afterAssigned = body.split(/Assigned To:/i)[1] || ""
        const emailAny = afterAssigned.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)
        if (emailAny && emailAny[1]) {
          expert = emailAny[1].trim()
        }
      }
      if (expert) {
        expertSet.add(expert)
      }
    }

    const experts = Array.from(expertSet).sort((a, b) => a.localeCompare(b))
    const rounds = Array.from(roundSet).sort((a, b) => a.localeCompare(b))
    return Response.json({ experts, rounds })
  } catch (error) {
    console.error("First Assigned Filters API Error:", error)
    return Response.json({ experts: [], rounds: [] }, { status: 500 })
  }
}
