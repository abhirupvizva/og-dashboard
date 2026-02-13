import { getMongoClient } from "@/lib/mongodb"
export const runtime = "nodejs"

type Role = "Manager" | "Team Lead" | "Expert" | "AM" | "Unknown"

function normalizeRole(input: any): Role {
  const val = String(input || "").toLowerCase().trim()
  if (!val) return "Unknown"
  if (/(^|[^a-z])manager($|[^a-z])/.test(val)) return "Manager"
  if (/(team\s*lead|lead)/.test(val)) return "Team Lead"
  if (/(expert|interviewer|mentor)/.test(val)) return "Expert"
  if (/(^|[^a-z])am($|[^a-z])/.test(val) || /(account\s*manager)/.test(val)) return "AM"
  return "Unknown"
}

function pickName(u: any): string {
  return (
    u?.name ??
    u?.fullName ??
    u?.displayName ??
    u?.username ??
    u?.user ??
    u?.candidate ??
    ""
  )
}

export async function GET() {
  try {
    const client = await getMongoClient()
    const db = client.db("interviewSupport")
    const usersCol = db.collection("users")

    const docs = await usersCol.find({}).toArray()

    const idByName = new Map<string, string>()
    docs.forEach((d: any) => {
      const name = pickName(d)
      const id = String(d?._id ?? "")
      if (name && id) idByName.set(name, id)
    })

    const users = docs.map((d: any) => {
      const id = String(d?._id ?? "")
      const name = pickName(d)

      const rawRole =
        d?.role ?? d?.designation ?? d?.title ?? d?.position ?? d?.level ?? d?.type
      const role = normalizeRole(rawRole)

      const managerId =
        d?.managerId ??
        (d?.manager && idByName.get(d.manager)) ??
        d?.reportsTo ??
        (d?.reportsToName && idByName.get(d.reportsToName)) ??
        (d?.managerName && idByName.get(d.managerName)) ??
        undefined

      const leadId =
        d?.teamLeadId ??
        (d?.teamLead && idByName.get(d.teamLead)) ??
        d?.leadId ??
        (d?.lead && idByName.get(d.lead)) ??
        (d?.leadName && idByName.get(d.leadName)) ??
        undefined

      const amId =
        d?.amId ??
        (d?.am && idByName.get(d.am)) ??
        (d?.accountManager && idByName.get(d.accountManager)) ??
        undefined

      return { id, name, role, managerId, leadId, amId }
    })

    const managers = users.filter(u => u.role === "Manager")
    const leads = users.filter(u => u.role === "Team Lead")
    const experts = users.filter(u => u.role === "Expert")
    const ams = users.filter(u => u.role === "AM")

    const leadsByManager: Record<string, string[]> = {}
    leads.forEach(l => {
      if (l.managerId) {
        const key = String(l.managerId)
        if (!leadsByManager[key]) leadsByManager[key] = []
        leadsByManager[key].push(l.id)
      }
    })

    const expertsByLead: Record<string, string[]> = {}
    experts.forEach(e => {
      if (e.leadId) {
        const key = String(e.leadId)
        if (!expertsByLead[key]) expertsByLead[key] = []
        expertsByLead[key].push(e.id)
      }
    })

    const expertsByManager: Record<string, string[]> = {}
    experts.forEach(e => {
      const key = e.managerId ? String(e.managerId) : ""
      if (key) {
        if (!expertsByManager[key]) expertsByManager[key] = []
        expertsByManager[key].push(e.id)
      }
    })

    return Response.json({
      managers,
      teamLeads: leads,
      experts,
      ams,
      leadsByManager,
      expertsByLead,
      expertsByManager
    })
  } catch (err) {
    return Response.json({ managers: [], teamLeads: [], experts: [], ams: [] }, { status: 500 })
  }
}
