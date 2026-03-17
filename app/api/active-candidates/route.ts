import { getMongoClient } from "@/lib/mongodb"
import { MongoClient } from "mongodb"
import { getMockTeamsByEmail, MOCK_TEAMS } from "@/src/data/mock-teams"
export const runtime = "nodejs"

const TEAMS_URI = process.env.TEAMS_MONGODB_URI

let cachedTeamsClient: MongoClient | null = null
let cachedTeamsMap: { at: number; map: Record<string, string>; dbName?: string; collection?: string } | null = null

function toStr(v: unknown) {
  return typeof v === "string" ? v.trim() : ""
}

function firstNonEmpty(...values: unknown[]) {
  for (const v of values) {
    const s = toStr(v)
    if (s) return s
  }
  return ""
}

function normalizeEmail(v: unknown) {
  const s = toStr(v)
  return s && s.includes("@") ? s.toLowerCase() : ""
}

async function getTeamsClient() {
  if (!TEAMS_URI) {
    throw new Error('Invalid/Missing environment variable: "TEAMS_MONGODB_URI"')
  }
  if (cachedTeamsClient) return cachedTeamsClient
  const client = new MongoClient(TEAMS_URI, { serverSelectionTimeoutMS: 5000 })
  await client.connect()
  cachedTeamsClient = client
  return client
}

async function loadTeamsMap(client: MongoClient) {
  const admin = client.db().admin()
  const dbs = await admin.listDatabases()
  const targetDbName = dbs.databases.find((d) => !["admin", "local", "config"].includes(d.name))?.name
  if (!targetDbName) {
    return { map: {} as Record<string, string> }
  }

  const db = client.db(targetDbName)
  const collections = await db.listCollections().toArray()
  const teamCol = collections.find(
    (c) => c.name.toLowerCase().includes("team") || c.name.toLowerCase().includes("expert")
  )
  if (!teamCol) {
    return { map: {} as Record<string, string>, dbName: targetDbName }
  }

  const docs = await db.collection(teamCol.name).find({}).toArray()
  const map: Record<string, string> = {}

  for (const doc of docs) {
    const teamName = firstNonEmpty(
      (doc as any)?.team,
      (doc as any)?.teamName,
      (doc as any)?.Team,
      (doc as any)?.TeamName,
      (doc as any)?.group,
      (doc as any)?.name
    )

    const directEmail = normalizeEmail(
      firstNonEmpty((doc as any)?.email, (doc as any)?.Email, (doc as any)?.expertEmail, (doc as any)?.userEmail)
    )
    if (directEmail && teamName) {
      map[directEmail] = teamName
    }

    const members =
      (doc as any)?.members ??
      (doc as any)?.experts ??
      (doc as any)?.users ??
      (doc as any)?.teamMembers ??
      (doc as any)?.team_members

    if (Array.isArray(members) && teamName) {
      for (const m of members) {
        if (typeof m === "string") {
          const em = normalizeEmail(m)
          if (em) map[em] = teamName
        } else if (m && typeof m === "object") {
          const em = normalizeEmail(firstNonEmpty((m as any)?.email, (m as any)?.Email, (m as any)?.userEmail))
          if (em) map[em] = teamName
        }
      }
    }
  }

  return { map, dbName: targetDbName, collection: teamCol.name }
}

async function getTeamsByEmail() {
  const ttlMs = 60_000
  if (cachedTeamsMap && Date.now() - cachedTeamsMap.at < ttlMs) return cachedTeamsMap

  const client = await getTeamsClient()
  const loaded = await loadTeamsMap(client)
  cachedTeamsMap = { at: Date.now(), ...loaded }
  return cachedTeamsMap
}

function getMockTeamsMeta() {
  return { dbName: "mock", collection: "MOCK_TEAMS", count: MOCK_TEAMS.length }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "500", 10) || 500, 1), 2000)

    const statusParam = toStr(searchParams.get("status"))
    const onlyActive = toStr(searchParams.get("onlyActive")).toLowerCase() !== "false"

    const filter: any = {}
    if (statusParam) {
      filter.status = statusParam
    } else if (onlyActive) {
      filter.status = { $ne: "Completed" }
    }

    const mongoClient = await getMongoClient()
    const db = mongoClient.db("interviewSupport")

    let sourceCollection: "candidateDetails" | "taskBody" = "candidateDetails"
    let docs = await db
      .collection("candidateDetails")
      .find(filter, {
        projection: {
          status: 1,
          "Candidate Name": 1,
          candidateName: 1,
          Branch: 1,
          branch: 1,
          Expert: 1,
          expert: 1,
          assignedTo: 1,
          Recruiter: 1,
          recruiter: 1,
        },
      })
      .sort({ _id: -1 })
      .limit(Math.min(limit * 3, 5000))
      .toArray()

    if (docs.length === 0) {
      sourceCollection = "taskBody"
      docs = await db
        .collection("taskBody")
        .find(filter, {
          projection: {
            status: 1,
            "Candidate Name": 1,
            Branch: 1,
            assignedTo: 1,
            Recruiter: 1,
            recruiter: 1,
          },
        })
        .sort({ _id: -1 })
        .limit(Math.min(limit * 3, 5000))
        .toArray()
    }

    const seen = new Set<string>()
    const rows: {
      id: string
      candidateName: string
      branch: string
      expert: string
      recruiter: string
      status: string
      team: string
      teamSource: "expert" | "recruiter" | ""
    }[] = []

    for (const d of docs) {
      const candidateName = firstNonEmpty((d as any)["Candidate Name"], (d as any).candidateName)
      if (!candidateName) continue
      const key = candidateName.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      rows.push({
        id: String((d as any)._id),
        candidateName,
        branch: firstNonEmpty((d as any).Branch, (d as any).branch),
        expert: firstNonEmpty((d as any).Expert, (d as any).expert, (d as any).assignedTo),
        recruiter: firstNonEmpty((d as any).Recruiter, (d as any).recruiter),
        status: firstNonEmpty((d as any).status),
        team: "",
        teamSource: "",
      })
      if (rows.length >= limit) break
    }

    let teamsError: string | null = null
    let teamsMeta: { dbName?: string; collection?: string } | null = null

    try {
      const teams = await getTeamsByEmail()
      teamsMeta = { dbName: teams.dbName, collection: teams.collection }
      for (const r of rows) {
        const expertEmail = normalizeEmail(r.expert)
        const recruiterEmail = normalizeEmail(r.recruiter)
        const byExpert = expertEmail ? teams.map[expertEmail] : ""
        const byRecruiter = recruiterEmail ? teams.map[recruiterEmail] : ""
        if (byExpert) {
          r.team = byExpert
          r.teamSource = "expert"
        } else if (byRecruiter) {
          r.team = byRecruiter
          r.teamSource = "recruiter"
        } else {
          r.team = "Unassigned"
          r.teamSource = ""
        }
      }
    } catch (e) {
      teamsError = e instanceof Error ? e.message : "Failed to fetch teams"
      const mockMap = getMockTeamsByEmail()
      teamsMeta = getMockTeamsMeta()
      for (const r of rows) {
        const expertEmail = normalizeEmail(r.expert)
        const recruiterEmail = normalizeEmail(r.recruiter)
        const byExpert = expertEmail ? mockMap[expertEmail] : ""
        const byRecruiter = recruiterEmail ? mockMap[recruiterEmail] : ""
        if (byExpert) {
          r.team = byExpert
          r.teamSource = "expert"
        } else if (byRecruiter) {
          r.team = byRecruiter
          r.teamSource = "recruiter"
        } else {
          r.team = "Unassigned"
          r.teamSource = ""
        }
      }
    }

    return Response.json({
      candidates: rows,
      refreshedAt: new Date().toISOString(),
      sourceCollection,
      teams: { ok: true, error: teamsError, ...teamsMeta },
    })
  } catch (error) {
    console.error("Active candidates API error:", error)
    return Response.json({ error: "Failed to fetch active candidates" }, { status: 500 })
  }
}

