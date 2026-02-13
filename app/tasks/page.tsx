"use client"

import { useCallback, useEffect, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import ExpertFilter from "@/src/components/expert-filter"
import { useFilters } from "@/src/hooks/useCachedData"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TaskRow = {
  _id: string
  subject?: string
  ["Candidate Name"]: string
  assignedTo?: string
  status?: string
}

function formatYMD(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function TasksPage() {
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [selectedExperts, setSelectedExperts] = useState<string[]>([])
  const [status, setStatus] = useState<string>("all")

  const [rows, setRows] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: filterOptions = { experts: [], clients: [] }, loading: filtersLoading } = useFilters()

  useEffect(() => {
    const today = formatYMD(new Date())
    setDateFrom(today)
    setDateTo(today)
  }, [])

  const getQueryParams = useCallback(() => {
    const p = new URLSearchParams()
    if (dateFrom) p.append("dateFrom", dateFrom)
    if (dateTo) p.append("dateTo", dateTo)
    if (selectedExperts.length > 0) p.append("experts", selectedExperts.join(","))
    if (status && status !== "all") p.append("status", status)
    return p
  }, [dateFrom, dateTo, selectedExperts, status])

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = getQueryParams()
      params.append("page", "1")
      params.append("limit", "100")
      const res = await fetch(`/api/interviews?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch tasks")
      const data = await res.json()
      const tasks: TaskRow[] = (data.interviews || []).map((i: any) => ({
        _id: i._id,
        subject: i.subject,
        ["Candidate Name"]: i["Candidate Name"],
        assignedTo: i.assignedTo,
        status: i.status
      }))
      setRows(tasks)
    } catch (e) {
      setError("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }, [getQueryParams])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const clearSelections = () => {
    setSelectedExperts([])
    setStatus("all")
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <aside className="lg:col-span-1">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Date + Assigned To filter</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                </SelectContent>
              </Select>

              <ExpertFilter
                experts={filterOptions.experts}
                selectedExperts={selectedExperts}
                onExpertChange={setSelectedExperts}
                loading={filtersLoading}
              />

              <div className="flex gap-2">
                <Button onClick={fetchTasks}>Apply</Button>
                <Button variant="secondary" onClick={clearSelections}>Clear</Button>
              </div>

              <div className="rounded-md border border-border p-2 text-xs text-muted-foreground">
                Pick a date range and select multiple Assigned To values.
                If none is selected, today’s tasks are shown by default.
              </div>
            </CardContent>
          </Card>
        </aside>
        <main className="lg:col-span-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Task List</CardTitle>
              <CardDescription>
                {loading ? "Loading..." : `${rows.length} items`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
              <div className="overflow-auto rounded-md border border-border">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Candidate Name</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned To</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {rows.map((row) => (
                      <tr key={row._id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-foreground font-medium">{row.subject || "—"}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{row["Candidate Name"]}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{row.assignedTo || "Unassigned"}</td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className="text-xs">{row.status || "Unknown"}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </DashboardLayout>
  )
}
