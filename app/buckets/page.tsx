"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ExpertFilter from "@/src/components/expert-filter"

type BucketCandidate = {
  name: string
  count: number
}

type Bucket = {
  expert: string
  totalItems: number
  totalCandidates: number
  candidates: BucketCandidate[]
}

export default function BucketsPage() {
  const [status, setStatus] = useState<string>("all")
  const [statusOptions, setStatusOptions] = useState<string[]>([])

  const [selectedExperts, setSelectedExperts] = useState<string[]>([])
  const [activeExpert, setActiveExpert] = useState<string>("all")
  const [search, setSearch] = useState<string>("")

  const [buckets, setBuckets] = useState<Bucket[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [expertOptions, setExpertOptions] = useState<string[]>([])
  const [filtersLoading, setFiltersLoading] = useState(false)
  const didInitialFetch = useRef(false)

  const loadFilterOptions = useCallback(async () => {
    try {
      setFiltersLoading(true)
      const res = await fetch("/api/buckets/filters")
      if (!res.ok) throw new Error("Failed to fetch buckets filters")
      const data = await res.json()
      setExpertOptions(data.experts || [])
      setStatusOptions(data.statuses || [])
    } finally {
      setFiltersLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFilterOptions()
  }, [loadFilterOptions])

  const fetchBuckets = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (status && status !== "all") params.append("status", status)
      if (selectedExperts.length > 0) params.append("experts", selectedExperts.join(","))

      const res = await fetch(`/api/tasks/buckets?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch buckets")
      const data = await res.json()
      setBuckets(data.buckets || [])
    } catch (e) {
      setError("Failed to load buckets")
    } finally {
      setLoading(false)
    }
  }, [selectedExperts, status])

  useEffect(() => {
    if (didInitialFetch.current) return
    didInitialFetch.current = true
    fetchBuckets()
  }, [fetchBuckets])

  const selectedBucket = useMemo(() => {
    if (activeExpert === "all") return undefined
    return buckets.find((b) => b.expert === activeExpert)
  }, [buckets, activeExpert])

  const candidateRows = useMemo(() => {
    const rows = selectedBucket?.candidates || []
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((c) => c.name.toLowerCase().includes(q))
  }, [search, selectedBucket])

  useEffect(() => {
    if (activeExpert === "all") return
    if (buckets.some((b) => b.expert === activeExpert)) return
    setActiveExpert("all")
  }, [activeExpert, buckets])

  const clear = () => {
    setSelectedExperts([])
    setActiveExpert("all")
    setStatus("all")
    setSearch("")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-[1920px] mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Buckets</h1>
          <p className="text-muted-foreground">Pick an expert and see candidates grouped into their bucket.</p>
        </div>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 flex-1">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <ExpertFilter
                  experts={expertOptions}
                  selectedExperts={selectedExperts}
                  onExpertChange={setSelectedExperts}
                  loading={filtersLoading}
                />

                <Input placeholder="Search candidate..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              <div className="flex gap-2">
                <Button onClick={fetchBuckets}>Apply</Button>
                <Button variant="secondary" onClick={clear}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>{activeExpert === "all" ? "Experts" : activeExpert}</CardTitle>
            <CardDescription>
              {loading
                ? "Loading..."
                : activeExpert === "all"
                  ? `${buckets.length} experts`
                  : `${selectedBucket?.totalCandidates || 0} candidates`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

            {loading ? (
              <div className="h-[520px] bg-card animate-pulse rounded-lg border border-border" />
            ) : activeExpert === "all" ? (
              <ScrollArea className="h-[560px] rounded-md border border-border">
                <div className="p-2 space-y-1">
                  {buckets.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2">No data</div>
                  ) : (
                    buckets.map((b) => (
                      <button
                        key={b.expert}
                        className="w-full text-left rounded-md px-3 py-3 hover:bg-muted/50 transition-colors"
                        onClick={() => setActiveExpert(b.expert)}
                        type="button"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium text-foreground truncate">{b.expert}</div>
                          <Badge variant="secondary" className="text-xs">
                            {b.totalCandidates}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{b.totalCandidates} candidates</div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            ) : (
              <ScrollArea className="h-[560px] rounded-md border border-border">
                <div className="p-2 space-y-1">
                  {candidateRows.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2">No matches</div>
                  ) : (
                    candidateRows.map((c) => (
                      <div
                        key={c.name}
                        className="flex items-center justify-between gap-3 rounded-md px-3 py-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-sm text-foreground truncate">{c.name}</div>
                        <Badge variant="secondary" className="text-xs">
                          {c.count}
                        </Badge>
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
