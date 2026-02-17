"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import ExpertFilter from "@/src/components/expert-filter"
import { useFilters } from "@/src/hooks/useCachedData"

type FirstAssignedItem = {
  _id: string
  subject?: string
  status?: string
  firstAssignedExpert: string
}

export default function FirstAssignedPage() {
  const [year, setYear] = useState<string>("")
  const [month, setMonth] = useState<string>("")
  const [status, setStatus] = useState<string>("all")
  const [selectedExperts, setSelectedExperts] = useState<string[]>([])
  const [firstExperts, setFirstExperts] = useState<string[]>([])
  const [expertsLoading, setExpertsLoading] = useState(false)
  const [excludeRounds, setExcludeRounds] = useState<string[]>([])
  const [availableRounds, setAvailableRounds] = useState<string[]>([])
  const [total, setTotal] = useState<number>(0)
  const [items, setItems] = useState<FirstAssignedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const didInitialFetch = useRef(false)

  const { data: filterOptions = { experts: [], clients: [] }, loading: filtersLoading } = useFilters()

  useEffect(() => {
    const now = new Date()
    setYear(String(now.getFullYear()))
    setMonth(String(now.getMonth() + 1).padStart(2, "0"))
  }, [])

  useEffect(() => {
    let active = true
    const loadExperts = async () => {
      try {
        setExpertsLoading(true)
        const res = await fetch("/api/tasks/first-assigned/filters")
        const data = await res.json()
        if (!active) return
        const fromReplies = Array.isArray(data.experts) ? data.experts : []
        const rounds = Array.isArray(data.rounds) ? data.rounds : []
        // Fallback to assignedTo experts if none found
        const combined = Array.from(new Set([...(fromReplies || []), ...filterOptions.experts])).sort()
        setFirstExperts(combined)
        setAvailableRounds(rounds)
      } finally {
        setExpertsLoading(false)
      }
    }
    loadExperts()
    return () => { active = false }
  }, [filterOptions.experts])

  const fetchFirstAssigned = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (year) params.append("year", year)
      if (month) params.append("month", month)
      if (status && status !== "all") params.append("status", status)
      if (selectedExperts.length > 0) params.append("experts", selectedExperts.join(","))
      if (excludeRounds.length > 0) params.append("excludeRounds", excludeRounds.join(","))
      params.append("limit", "100")
      const res = await fetch(`/api/tasks/first-assigned?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch first assigned list")
      const data = await res.json()
      setTotal(data.total || 0)
      setItems(data.items || [])
    } catch (e) {
      setError("Failed to load first assigned list")
    } finally {
      setLoading(false)
    }
  }, [year, month, selectedExperts, status, excludeRounds])

  useEffect(() => {
    if (didInitialFetch.current) return
    if (!year || !month) return
    didInitialFetch.current = true
    fetchFirstAssigned()
  }, [year, month, fetchFirstAssigned])

  const clear = () => {
    const now = new Date()
    setYear(String(now.getFullYear()))
    setMonth(String(now.getMonth() + 1).padStart(2, "0"))
    setStatus("all")
    setSelectedExperts([])
    setExcludeRounds([])
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const params = new URLSearchParams()
      if (year) params.append("year", year)
      if (month) params.append("month", month)
      if (status && status !== "all") params.append("status", status)
      if (selectedExperts.length > 0) params.append("experts", selectedExperts.join(","))
      if (excludeRounds.length > 0) params.append("excludeRounds", excludeRounds.join(","))
      const res = await fetch(`/api/tasks/first-assigned/kpi?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to export KPI")
      const data = await res.json()
      const rows = [["Expert", "Total Interviews"]]
      for (const row of data.items || []) {
        rows.push([row.expert, String(row.count ?? 0)])
      }
      const csv = rows.map((r) =>
        r
          .map((v) => {
            const s = String(v ?? "")
            if (s.includes(",") || s.includes('"') || s.includes("\n")) {
              return `"${s.replace(/"/g, '""')}"`
            }
            return s
          })
          .join(","),
      ).join("\n")
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      const labelMonth = month ? month : ""
      const labelYear = year ? year : ""
      link.href = url
      link.setAttribute("download", `kpi-count-${labelYear}-${labelMonth}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch {
    } finally {
      setExporting(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-[1920px] mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">KPI COUNT</h1>
          <p className="text-muted-foreground">
            Shows the first expert tagged on each taskBody document (from replies), filtered by status.
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-3">
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="bg-background border-input w-[120px]">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }).map((_, i) => {
                    const y = new Date().getFullYear() - i
                    return (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>

              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="bg-background border-input w-[140px]">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="01">January</SelectItem>
                  <SelectItem value="02">February</SelectItem>
                  <SelectItem value="03">March</SelectItem>
                  <SelectItem value="04">April</SelectItem>
                  <SelectItem value="05">May</SelectItem>
                  <SelectItem value="06">June</SelectItem>
                  <SelectItem value="07">July</SelectItem>
                  <SelectItem value="08">August</SelectItem>
                  <SelectItem value="09">September</SelectItem>
                  <SelectItem value="10">October</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">December</SelectItem>
                </SelectContent>
              </Select>

              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-background border-input w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <ExpertFilter
                experts={firstExperts}
                selectedExperts={selectedExperts}
                onExpertChange={setSelectedExperts}
                loading={expertsLoading}
                compact
                className="w-[260px]"
              />

              {/* Exclude Rounds */}
              {availableRounds.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {availableRounds.map((round, idx) => {
                    const isExcluded = excludeRounds.includes(round)
                    return (
                      <button
                        key={`${round}-${idx}`}
                        onClick={() =>
                          setExcludeRounds((prev) =>
                            prev.includes(round) ? prev.filter((r) => r !== round) : [...prev, round],
                          )
                        }
                        className={[
                          "px-2 py-1 rounded border text-xs",
                          isExcluded
                            ? "bg-destructive/10 text-destructive border-destructive/30"
                            : "bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground",
                        ].join(" ")}
                        title={isExcluded ? "Excluded" : "Exclude this round"}
                      >
                        {round || "Unknown"}
                      </button>
                    )
                  })}
                </div>
              )}

              <Button onClick={fetchFirstAssigned}>Apply</Button>
              <Button variant="secondary" onClick={clear}>
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                disabled={exporting || !year || !month}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {exporting ? "Exporting..." : "Export KPI"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Interviews</CardTitle>
            <CardDescription>{loading ? "Loading..." : `${total} interviews`}</CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

            {loading ? (
              <div className="h-[560px] bg-card animate-pulse rounded-lg border border-border" />
            ) : (
              <ScrollArea className="h-[560px] rounded-md border border-border">
                <div className="p-2 space-y-2">
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2">No data</div>
                  ) : (
                    items.map((i) => (
                      <div key={i._id} className="rounded-md px-3 py-3 hover:bg-muted/50 transition-colors">
                        <div className="text-sm font-medium text-foreground truncate">{i.subject || "—"}</div>
                        <div className="flex items-center justify-between gap-3 mt-1">
                          <div className="text-xs text-muted-foreground truncate">{i.firstAssignedExpert}</div>
                          <Badge variant="secondary" className="text-xs">
                            {i.status || "Unknown"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
