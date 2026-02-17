import { getMongoClient } from "@/lib/mongodb"
export const runtime = "nodejs"

function normalizeMonth(input?: string | null) {
  if (!input) return null
  const s = input.trim().toLowerCase()
  const shortNames = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
  const fullNames = ["january","february","march","april","may","june","july","august","september","october","november","december"]
  if (/^\d{1,2}$/.test(s)) {
    const n = Math.max(1, Math.min(12, parseInt(s, 10)))
    return n
  }
  const idxShort = shortNames.indexOf(s)
  if (idxShort !== -1) return idxShort + 1
  const idxFull = fullNames.indexOf(s)
  if (idxFull !== -1) return idxFull + 1
  return null
}

function buildSubjectRegex(month?: number | null, year?: number | null) {
  const shortNames = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"]
  const fullNames = ["january","february","march","april","may","june","july","august","september","october","november","december"]
  const parts: string[] = []
  if (month && year) {
    const mm = String(month).padStart(2, "0")
    const short = shortNames[month - 1]
    const full = fullNames[month - 1]
    parts.push(`\\b(?:${short}|${full})\\b.*\\b${year}\\b`)
    parts.push(`\\b\\d{1,2}[-/ ]${mm}[-/ ]${year}\\b`)
    parts.push(`\\b${mm}[-/ ]\\d{1,2}[-/ ]${year}\\b`)
  } else if (month) {
    const mm = String(month).padStart(2, "0")
    const short = shortNames[month - 1]
    const full = fullNames[month - 1]
    parts.push(`\\b(?:${short}|${full})\\b`)
    parts.push(`\\b\\d{1,2}[-/ ]${mm}[-/ ]\\d{2,4}\\b`)
    parts.push(`\\b${mm}[-/ ]\\d{1,2}[-/ ]\\d{2,4}\\b`)
  } else if (year) {
    parts.push(`\\b${year}\\b`)
  }
  if (parts.length === 0) return null
  return `(?:${parts.join("|")})`
}

function parseTs(s?: string) {
  const t = Date.parse(s || "")
  return Number.isFinite(t) ? t : null
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const baseFilter: any = {}

    const status = searchParams.get("status")
    if (status && status.trim() && status !== "all") {
      baseFilter["status"] = status
    }

    const excludeRoundsParam = searchParams.get("excludeRounds")
    if (excludeRoundsParam && excludeRoundsParam.trim()) {
      const rounds = excludeRoundsParam
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean)
      if (rounds.length > 0) {
        baseFilter["actualRound"] = { $nin: rounds }
      }
    }

    const yearParam = searchParams.get("year")
    const monthParam = searchParams.get("month") || searchParams.get("subjectMonth")
    const year = yearParam && /^\d{4}$/.test(yearParam) ? parseInt(yearParam, 10) : null
    const month = normalizeMonth(monthParam)

    const subjectPattern = buildSubjectRegex(month, year)
    if (subjectPattern) {
      baseFilter["subject"] = { $regex: subjectPattern, $options: "i" }
    }

    const mongoClient = await getMongoClient()
    const db = mongoClient.db("interviewSupport")
    const collection = db.collection("taskBody")

    const docs = await collection
      .find(baseFilter, { projection: { subject: 1, status: 1, replies: 1, actualRound: 1 } })
      .sort({ _id: -1 })
      .toArray()

    const expertsFilter = (searchParams.get("experts") || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)

    const counts: Record<string, number> = {}

    for (const d of docs) {
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
      let expert: string | null = null
      const emailBracket = body.match(/Assigned To:[^\[]*\[([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})\]/i)
      if (emailBracket && emailBracket[1]) {
        expert = emailBracket[1].trim()
      } else {
        const afterAssigned = body.split(/Assigned To:/i)[1] || ""
        const emailAny = afterAssigned.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i)
        if (emailAny && emailAny[1]) {
          expert = emailAny[1].trim()
        } else {
          const nameMention = body.match(/Assigned To:\s*@([^\[\]\r\n]+)/i)
          if (nameMention && nameMention[1]) {
            expert = nameMention[1].trim()
          }
        }
      }
      if (!expert) continue
      if (expertsFilter.length > 0 && !expertsFilter.includes(expert)) continue
      counts[expert] = (counts[expert] || 0) + 1
    }

    const items = Object.entries(counts)
      .map(([expert, count]) => ({ expert, count }))
      .sort((a, b) => b.count - a.count || a.expert.localeCompare(b.expert))
    const total = items.reduce((s, x) => s + x.count, 0)

    return Response.json({ total, items })
  } catch {
    return Response.json({ total: 0, items: [] }, { status: 500 })
  }
}
