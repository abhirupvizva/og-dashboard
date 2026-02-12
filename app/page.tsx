"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Download, RefreshCw, Filter, Columns } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import InterviewTable, { ALL_COLUMNS, Interview } from "@/components/interview-table"
import FilterPanel from "@/components/filter-panel"
import DashboardLayout from "@/components/dashboard-layout"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useFilters, useStats } from "@/src/hooks/useCachedData"

interface Stats {
  statusCounts: Record<string, number>
  expertStats: { name: string; count: number; completed?: number; efficiency?: number }[]
  total: number
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toDateInputValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function Dashboard() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const initialDateTo = toDateInputValue(new Date())
  const initialDateFrom = toDateInputValue(addDays(new Date(), -2))

  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState<string>(initialDateFrom)
  const [dateTo, setDateTo] = useState<string>(initialDateTo)
  const [selectedExperts, setSelectedExperts] = useState<string[]>([])
  const [excludeRounds, setExcludeRounds] = useState<string[]>([])
  const [status, setStatus] = useState<string>("all")
  const [selectedClient, setSelectedClient] = useState<string>("All")

  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: initialDateFrom,
    dateTo: initialDateTo,
    selectedExperts: [] as string[],
    excludeRounds: [] as string[],
    status: "all",
    selectedClient: "All",
    searchTerm: ""
  })

  const [datePreset, setDatePreset] = useState<"7" | "30" | "all" | "2">("2")

  // Column Visibility
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    candidateName: true,
    endClient: true,
    interviewRound: true,
    date: true,
    time: true,
    actualRound: true,
    status: true,
    feedback: true,
    actions: true,
  })

  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams()
    if (appliedFilters.dateFrom) params.append("dateFrom", appliedFilters.dateFrom)
    if (appliedFilters.dateTo) params.append("dateTo", appliedFilters.dateTo)
    if (appliedFilters.selectedExperts.length > 0) params.append("experts", appliedFilters.selectedExperts.join(","))
    if (appliedFilters.excludeRounds.length > 0) params.append("excludeRounds", appliedFilters.excludeRounds.join(","))
    if (appliedFilters.status && appliedFilters.status !== "all") params.append("status", appliedFilters.status)
    if (appliedFilters.selectedClient !== "All") params.append("client", appliedFilters.selectedClient)
    if (appliedFilters.searchTerm) params.append("search", appliedFilters.searchTerm)
    return params
  }, [appliedFilters])

  const applyQuickRange = (range: "7" | "30" | "all") => {
    const today = new Date()
    const nextDateTo = range === "all" ? "" : toDateInputValue(today)
    const nextDateFrom =
      range === "all"
        ? ""
        : toDateInputValue(addDays(today, range === "7" ? -7 : -30))

    setDatePreset(range)
    setDateFrom(nextDateFrom)
    setDateTo(nextDateTo)
    setAppliedFilters((prev) => ({
      ...prev,
      dateFrom: nextDateFrom,
      dateTo: nextDateTo,
    }))
  }

  const handleApplyFilters = () => {
    setAppliedFilters(prev => ({
      ...prev,
      dateFrom,
      dateTo,
      selectedExperts,
      excludeRounds,
      status,
      selectedClient,
      searchTerm
    }))
  }

  // Use cached filters and stats
  const { data: filterOptions = { experts: [], clients: [] }, loading: filtersLoading } = useFilters()
  const { data: stats = null, loading: loadingStats } = useStats(getQueryParams().toString())




  const fetchInterviews = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setCurrentPage(1)
        setInterviews([])
      }

      const params = getQueryParams()
      params.append("page", page.toString())
      params.append("limit", "100")

      const response = await fetch(`/api/interviews?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch interviews")
      const data = await response.json()

      if (append) {
        setInterviews(prev => [...prev, ...data.interviews])
      } else {
        setInterviews(data.interviews)
      }

      setHasNextPage(data.pagination.hasNext)
      setTotalCount(data.pagination.totalCount)
      setCurrentPage(page)
      setLoading(false)
      setLoadingMore(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
      setLoadingMore(false)
    }
  }, [getQueryParams])

  useEffect(() => {
    fetchInterviews(1, false)
  }, [fetchInterviews])

  const handleExportCSV = useCallback(() => {
    const headers = Object.values(ALL_COLUMNS)
    const csv = [
      headers.join(","),
      ...interviews.map((i) =>
        [
          i["Candidate Name"],
          i["End Client"],
          i["Interview Round"],
          i["Date of Interview"],
          i["Start Time Of Interview"],
          i["End Time Of Interview"],
          i["actualRound"],
          i["assignedTo"] || "",
          i["status"] || "",
          i["feedback"] || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `interviews-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }, [interviews])

  const uniqueRounds = useMemo(() => {
    const rounds = interviews.map((i) => i.actualRound).filter((r) => r != null)
    return Array.from(new Set(rounds))
  }, [interviews])

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-[1920px] mx-auto">

        {/* Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Interviews</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">{loadingStats ? "..." : stats?.total}</div>
              <p className="text-xs text-muted-foreground">Based on current filters</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{loadingStats ? "..." : stats?.statusCounts["Completed"] || 0}</div>
              <p className="text-xs text-muted-foreground">Successfully finished</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rescheduled</CardTitle>
              <div className="h-2 w-2 rounded-full bg-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{loadingStats ? "..." : stats?.statusCounts["Rescheduled"] || 0}</div>
              <p className="text-xs text-muted-foreground">Moved to another time</p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cancelled</CardTitle>
              <div className="h-2 w-2 rounded-full bg-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{loadingStats ? "..." : stats?.statusCounts["Cancelled"] || 0}</div>
              <p className="text-xs text-muted-foreground">Did not happen</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
           {/* Main Content - Table */}
          <div className="xl:col-span-3 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center bg-card p-4 rounded-lg border border-border shadow-sm">
               <div className="flex flex-wrap items-center gap-2">
                 <Button
                   variant={datePreset === "7" ? "default" : "outline"}
                   size="sm"
                   className="h-8"
                   onClick={() => applyQuickRange("7")}
                 >
                   Last 7 days
                 </Button>
                 <Button
                   variant={datePreset === "30" ? "default" : "outline"}
                   size="sm"
                   className="h-8"
                   onClick={() => applyQuickRange("30")}
                 >
                   Last 30 days
                 </Button>
                 <Button
                   variant={datePreset === "all" ? "default" : "outline"}
                   size="sm"
                   className="h-8"
                   onClick={() => applyQuickRange("all")}
                 >
                   All time
                 </Button>
               </div>

               <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 bg-background border-input text-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    // Refresh all cached data
                    window.location.reload()
                  }}
                  title="Refresh all data"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="ml-auto h-8 lg:flex bg-background border-input text-foreground hover:bg-accent hover:text-accent-foreground">
                      <Columns className="mr-2 h-4 w-4" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[150px] bg-popover border-border text-popover-foreground">
                    <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    {Object.keys(visibleColumns).map((key) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={key}
                          className="capitalize focus:bg-accent focus:text-accent-foreground cursor-pointer"
                          checked={visibleColumns[key]}
                          onCheckedChange={(value) =>
                            setVisibleColumns((prev) => ({ ...prev, [key]: value }))
                          }
                        >
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" className="h-8 bg-background border-input text-foreground hover:bg-accent hover:text-accent-foreground" onClick={handleExportCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            <Card className="bg-card border-border shadow-sm">
              <CardContent className="p-4">
                <FilterPanel
                  dateFrom={dateFrom}
                  setDateFrom={setDateFrom}
                  dateTo={dateTo}
                  setDateTo={setDateTo}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedExperts={selectedExperts}
                  setSelectedExperts={setSelectedExperts}
                  excludeRounds={excludeRounds}
                  setExcludeRounds={setExcludeRounds}
                  status={status}
                  setStatus={setStatus}
                  selectedClient={selectedClient}
                  setSelectedClient={setSelectedClient}
                  uniqueClients={filterOptions.clients}
                  uniqueExperts={filterOptions.experts}
                  uniqueRounds={uniqueRounds}
                  applyFilters={handleApplyFilters}
                  loading={filtersLoading}
                />
              </CardContent>
            </Card>

              {/* Table */}
               {loading && !interviews.length ? (
                  <div className="flex items-center justify-center h-64">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    <InterviewTable interviews={interviews} visibleColumns={visibleColumns} />

                     {/* Load More */}
                    {hasNextPage && (
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={() => fetchInterviews(currentPage + 1, true)}
                          disabled={loadingMore}
                          variant="secondary"
                          className="w-full sm:w-auto"
                        >
                          {loadingMore && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                          Load More Interviews
                        </Button>
                      </div>
                    )}
                  </>
                )}
           </div>

           {/* Right Sidebar - Expert Stats */}
           <div className="space-y-6">
              <Card className="bg-card border-border h-full shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-card-foreground">Expert Performance</CardTitle>
                  <CardDescription className="text-muted-foreground">Interviews conducted by expert</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingStats ? (
                     <div className="space-y-3">
                       {[1,2,3].map(i => <div key={i} className="h-10 bg-accent/50 rounded animate-pulse" />)}
                     </div>
                  ) : (
                    <div className="space-y-4">
                      {stats?.expertStats.map((expert, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded hover:bg-accent/50 transition-colors group">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary border border-border text-xs font-bold text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                              {expert.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-foreground truncate max-w-[120px]" title={expert.name}>
                              {expert.name}
                            </span>
                          </div>
                          <Badge variant="secondary" className="bg-secondary text-secondary-foreground border-border group-hover:border-primary/20">
                            {expert.count}
                          </Badge>
                        </div>
                      ))}
                      {!stats?.expertStats.length && (
                        <p className="text-sm text-muted-foreground text-center py-4">No data available</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
