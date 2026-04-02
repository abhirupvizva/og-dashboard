import fs from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

const ROOT = path.resolve(process.cwd(), "integrations", "monthlyKPI")

function isWithinRoot(p: string) {
  const rel = path.relative(ROOT, p)
  return rel && !rel.startsWith("..") && !path.isAbsolute(rel)
}

async function listDir(dir: string) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const items = entries
    .filter((e) => !e.name.startsWith(".") && e.name !== "node_modules" && e.name !== "dist")
    .map((e) => ({ name: e.name, type: e.isDirectory() ? "dir" : "file" as const }))
    .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1))
  return items
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rel = (searchParams.get("path") || "").trim()
    const target = path.resolve(ROOT, rel || ".")
    if (!isWithinRoot(target) && target !== ROOT) {
      return Response.json({ error: "Invalid path" }, { status: 400 })
    }
    const stat = await fs.stat(target)
    if (!stat.isDirectory()) {
      return Response.json({ error: "Not a directory" }, { status: 400 })
    }
    const items = await listDir(target)
    const normalizedRel = path.relative(ROOT, target).split(path.sep).join("/")
    return Response.json({ root: ROOT, path: normalizedRel === "" ? "" : normalizedRel, items })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Failed to list files" }, { status: 500 })
  }
}

