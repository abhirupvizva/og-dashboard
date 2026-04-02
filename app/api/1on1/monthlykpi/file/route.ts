import fs from "node:fs/promises"
import path from "node:path"

export const runtime = "nodejs"

const ROOT = path.resolve(process.cwd(), "integrations", "monthlyKPI")
const MAX_BYTES = 300_000

function isWithinRoot(p: string) {
  const rel = path.relative(ROOT, p)
  return rel && !rel.startsWith("..") && !path.isAbsolute(rel)
}

function isProbablyText(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  return [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".css",
    ".html",
    ".yml",
    ".yaml",
    ".txt",
    ".env",
    ".sql",
  ].includes(ext)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const rel = (searchParams.get("path") || "").trim()
    if (!rel) return Response.json({ error: "Missing path" }, { status: 400 })

    const target = path.resolve(ROOT, rel)
    if (!isWithinRoot(target)) {
      return Response.json({ error: "Invalid path" }, { status: 400 })
    }

    const stat = await fs.stat(target)
    if (!stat.isFile()) {
      return Response.json({ error: "Not a file" }, { status: 400 })
    }
    if (stat.size > MAX_BYTES) {
      return Response.json({ error: "File too large" }, { status: 413 })
    }
    if (!isProbablyText(target)) {
      return Response.json({ error: "Unsupported file type" }, { status: 415 })
    }

    const content = await fs.readFile(target, "utf8")
    const normalizedRel = path.relative(ROOT, target).split(path.sep).join("/")
    return Response.json({ path: normalizedRel, content })
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Failed to read file" }, { status: 500 })
  }
}

