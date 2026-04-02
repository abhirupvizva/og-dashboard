import { ObjectId } from "mongodb"
import { getMonthlyKpiMongoClient } from "@/lib/monthlykpi-mongodb"

export const runtime = "nodejs"

type KPIScore = {
  id: number
  category: string
  employeeInput: string
  teamLeadFeedback: string
  score: number
  improvementPlan: string
}

type PerformanceReview = {
  _id: ObjectId
  branch: string
  empName: string
  department: string
  empId: string
  teamLead: string
  performanceMonth: string
  leavesTaken: number
  interviewsReceived: number
  completedInterviews: number
  notDoneInterviews: number
  rescheduledCancelledInterviews: number
  poKpi: number
  poCount: number
  kpiScores: KPIScore[]
  createdAt: string
  updatedAt: string
}

function toStr(v: unknown) {
  return typeof v === "string" ? v.trim() : ""
}

function toNum(v: unknown, fallback = 0) {
  const n = typeof v === "number" ? v : parseFloat(toStr(v))
  return Number.isFinite(n) ? n : fallback
}

function clampInt(v: unknown, min: number, max: number, fallback: number) {
  const n = Math.trunc(toNum(v, fallback))
  return Math.max(min, Math.min(max, n))
}

function normalizeMonth(v: unknown) {
  const s = toStr(v)
  return /^\d{4}-\d{2}$/.test(s) ? s : ""
}

function normalizeScore(raw: any): KPIScore | null {
  const id = clampInt(raw?.id, 1, 10_000, 0)
  if (!id) return null
  return {
    id,
    category: toStr(raw?.category),
    employeeInput: toStr(raw?.employeeInput),
    teamLeadFeedback: toStr(raw?.teamLeadFeedback),
    score: toNum(raw?.score, 0),
    improvementPlan: toStr(raw?.improvementPlan),
  }
}

function normalizeReview(input: any) {
  const performanceMonth = normalizeMonth(input?.performanceMonth)
  return {
    branch: toStr(input?.branch),
    empName: toStr(input?.empName),
    department: toStr(input?.department),
    empId: toStr(input?.empId),
    teamLead: toStr(input?.teamLead),
    performanceMonth,
    leavesTaken: toNum(input?.leavesTaken, 0),
    interviewsReceived: toNum(input?.interviewsReceived, 0),
    completedInterviews: toNum(input?.completedInterviews, 0),
    notDoneInterviews: toNum(input?.notDoneInterviews, 0),
    rescheduledCancelledInterviews: toNum(input?.rescheduledCancelledInterviews, 0),
    poKpi: toNum(input?.poKpi, 0),
    poCount: toNum(input?.poCount, 0),
    kpiScores: Array.isArray(input?.kpiScores) ? input.kpiScores.map(normalizeScore).filter(Boolean) : [],
  }
}

function serializeReview(r: PerformanceReview) {
  return {
    id: r._id.toString(),
    branch: r.branch,
    empName: r.empName,
    department: r.department,
    empId: r.empId,
    teamLead: r.teamLead,
    performanceMonth: r.performanceMonth,
    leavesTaken: r.leavesTaken,
    interviewsReceived: r.interviewsReceived,
    completedInterviews: r.completedInterviews,
    notDoneInterviews: r.notDoneInterviews,
    rescheduledCancelledInterviews: r.rescheduledCancelledInterviews,
    poKpi: r.poKpi,
    poCount: r.poCount,
    kpiScores: r.kpiScores,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

async function getCollection() {
  const client = await getMonthlyKpiMongoClient()
  const db = client.db(process.env.MONTHLYKPI_DB_NAME || "interviewSupport")
  const col = db.collection<PerformanceReview>(process.env.MONTHLYKPI_REVIEWS_COLLECTION || "monthlyKPI_performance_reviews")
  try {
    await col.createIndex({ performanceMonth: 1, updatedAt: -1 })
    await col.createIndex({ empId: 1, performanceMonth: 1 })
    await col.createIndex({ teamLead: 1, performanceMonth: 1 })
  } catch {}
  return col
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const performanceMonth = normalizeMonth(searchParams.get("performanceMonth"))
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "200", 10) || 200, 1), 2000)
    const col = await getCollection()

    const filter: any = {}
    if (performanceMonth) filter.performanceMonth = performanceMonth

    const docs = await col.find(filter).sort({ updatedAt: -1 }).limit(limit).toArray()
    return Response.json({ reviews: docs.map(serializeReview) })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Failed to load reviews" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const id = toStr(body?.id)
    const normalized = normalizeReview(body)
    if (!normalized.performanceMonth) {
      return Response.json({ error: "Invalid performanceMonth" }, { status: 400 })
    }
    if (!normalized.empId) {
      return Response.json({ error: "Invalid empId" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const col = await getCollection()

    if (id) {
      const _id = ObjectId.isValid(id) ? new ObjectId(id) : null
      if (!_id) return Response.json({ error: "Invalid id" }, { status: 400 })

      const updated = await col.findOneAndUpdate(
        { _id },
        {
          $set: { ...normalized, updatedAt: now },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true, returnDocument: "after" }
      )
      if (!updated) return Response.json({ error: "Failed to save review" }, { status: 500 })
      return Response.json({ review: serializeReview(updated) })
    }

    const createdDoc: Omit<PerformanceReview, "_id"> = {
      ...normalized,
      createdAt: now,
      updatedAt: now,
    }
    const inserted = await col.insertOne(createdDoc as any)
    const saved = await col.findOne({ _id: inserted.insertedId })
    if (!saved) return Response.json({ error: "Failed to save review" }, { status: 500 })
    return Response.json({ review: serializeReview(saved) })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Failed to save review" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = toStr(searchParams.get("id"))
    if (!id || !ObjectId.isValid(id)) return Response.json({ error: "Invalid id" }, { status: 400 })
    const col = await getCollection()
    await col.deleteOne({ _id: new ObjectId(id) })
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Failed to delete review" }, { status: 500 })
  }
}
