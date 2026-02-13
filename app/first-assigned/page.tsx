"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import ExpertFilter from "@/src/components/expert-filter"
import { useFilters } from "@/src/hooks/useCachedData"

type FirstAssignedItem = {
  _id: string
  subject?: string
  status?: string
  firstAssignedExpert: string
}

function formatYMD(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export default function FirstAssignedPage() {
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [status, setStatus] = useState<string>("all")
  const [selectedExperts, setSelectedExperts] = useState<string[]>([])
  const [total, setTotal] = useState<number>(0)
  const [items, setItems] = useState<FirstAssignedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const didInitialFetch = useRef(false)

  const { data: filterOptions = { experts: [], clients: [] }, loading: filtersLoading } = useFilters()

  useEffect(() => {
    const today = formatYMD(new Date())
    setDateFrom(today)
    setDateTo(today)
  }, [])

  const fetchFirstAssigned = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (dateFrom) params.append("dateFrom", dateFrom)
      if (dateTo) params.append("dateTo", dateTo)
      if (status && status !== "all") params.append("status", status)
      if (selectedExperts.length > 0) params.append("experts", selectedExperts.join(","))
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
  }, [dateFrom, dateTo, selectedExperts, status])

  useEffect(() => {
    if (didInitialFetch.current) return
    if (!dateFrom || !dateTo) return
    didInitialFetch.current = true
    fetchFirstAssigned()
  }, [dateFrom, dateTo, fetchFirstAssigned])

  const clear = () => {
    const today = formatYMD(new Date())
    setDateFrom(today)
    setDateTo(today)
    setStatus("all")
    setSelectedExperts([])
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-[1920px] mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">First Assigned</h1>
          <p className="text-muted-foreground">
            Shows the first expert tagged on each taskBody document (from replies), filtered by status.
          </p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
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
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                <ExpertFilter
                  experts={filterOptions.experts}
                  selectedExperts={selectedExperts}
                  onExpertChange={setSelectedExperts}
                  loading={filtersLoading}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchFirstAssigned}>Apply</Button>
                <Button variant="secondary" onClick={clear}>
                  Clear
                </Button>
              </div>
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
