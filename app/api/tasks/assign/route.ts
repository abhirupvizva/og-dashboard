import { getMongoClient } from "@/lib/mongodb"
import { ObjectId } from "mongodb"
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const taskId = body?.taskId
    const assignedTo = body?.assignedTo

    if (!taskId || !assignedTo) {
      return Response.json({ ok: false, error: "taskId and assignedTo are required" }, { status: 400 })
    }

    const client = await getMongoClient()
    const db = client.db("interviewSupport")
    const col = db.collection("taskBody")

    const res = await col.updateOne(
      { _id: new ObjectId(taskId) },
      { $set: { assignedTo } }
    )

    return Response.json({ ok: true, modifiedCount: res.modifiedCount })
  } catch (err) {
    return Response.json({ ok: false }, { status: 500 })
  }
}
