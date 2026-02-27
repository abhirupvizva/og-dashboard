"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { RefreshCw, Filter, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import DashboardLayout from "@/components/dashboard-layout"
import { useFilters } from "@/src/hooks/useCachedData"

interface TaggedInterview {
  _id: string
  subject: string // Interview Title
  mainExpert: string
  taggedExperts: string[]
  "Date of Interview": string
  "Start Time Of Interview": string
}

export default function TagsPage() {
  const [interviews, setInterviews] = useState<TaggedInterview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [limit] = useState(20)

  // Filters
  const [year, setYear] = useState<string>("")
  const [month, setMonth] = useState<string>("")
  const [mainExpertFilter, setMainExpertFilter] = useState("all")
  const [taggedExpertFilter, setTaggedExpertFilter] = useState("all")
  const didInitialFetch = useRef(false)

  // Data for filters (Experts)
  const { data: filterOptions } = useFilters()
  const experts = filterOptions?.experts || []

  useEffect(() => {
    const now = new Date()
    setYear(String(now.getFullYear()))
    setMonth(String(now.getMonth() + 1).padStart(2, "0"))
  }, [])

  const fetchTaggedInterviews = useCallback(async () => {
    if (!year || !month) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("page", currentPage.toString())
      params.append("limit", limit.toString())
      params.append("year", year)
      params.append("month", month)
      if (mainExpertFilter !== "all") params.append("mainExpert", mainExpertFilter)
      if (taggedExpertFilter !== "all") params.append("taggedExpert", taggedExpertFilter)

      const response = await fetch(`/api/tags?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch data")

      const data = await response.json()
      setInterviews(data.interviews)
      setTotalPages(data.pagination.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [currentPage, limit, mainExpertFilter, taggedExpertFilter, year, month])

  useEffect(() => {
    if (didInitialFetch.current) return
    if (!year || !month) return
    didInitialFetch.current = true
    fetchTaggedInterviews()
  }, [year, month, fetchTaggedInterviews])

  // Refetch when filters change (after initial load)
  useEffect(() => {
    if (didInitialFetch.current) {
        fetchTaggedInterviews()
    }
  }, [fetchTaggedInterviews])

  return (
    <DashboardLayout>
    <div className="space-y-6 w-full max-w-[1920px] mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">TAGGED INTERVIEWS</h1>
        <p className="text-muted-foreground">
          View interviews where experts have been tagged in replies.
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle>Filter Tags</CardTitle>
          <div className="flex flex-wrap items-end gap-3 mt-2">

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

            <div className="flex flex-col gap-2 w-[200px]">
              <Select value={mainExpertFilter} onValueChange={(val) => { setMainExpertFilter(val); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Main Expert: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Main Expert: All</SelectItem>
                  {experts.map((expert: string) => (
                    <SelectItem key={`main-${expert}`} value={expert}>
                      {expert}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 w-[200px]">
              <Select value={taggedExpertFilter} onValueChange={(val) => { setTaggedExpertFilter(val); setCurrentPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Tagged Expert: All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tagged Expert: All</SelectItem>
                  {experts.map((expert: string) => (
                    <SelectItem key={`tagged-${expert}`} value={expert}>
                      {expert}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" size="icon" onClick={fetchTaggedInterviews} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto min-h-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Interview Title</TableHead>
                <TableHead>Main Expert</TableHead>
                <TableHead>Tagged Expert</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : interviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No tagged interviews found.
                  </TableCell>
                </TableRow>
              ) : (
                interviews.map((interview) => (
                  <TableRow key={interview._id}>
                    <TableCell className="font-medium max-w-[400px]">
                      <div className="flex flex-col">
                        <span className="truncate" title={interview.subject}>{interview.subject || "No Subject"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{interview.mainExpert || "Unassigned"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {interview.taggedExperts.map((expert, idx) => (
                          <Badge key={idx} variant="outline" className="bg-primary/10">
                            {expert}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{interview["Date of Interview"]}</span>
                        <span className="text-muted-foreground">{interview["Start Time Of Interview"]} EST</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination Footer */}
        <div className="p-4 border-t">
            <Pagination>
                <PaginationContent>
                    <PaginationItem>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                    </PaginationItem>

                    <span className="flex items-center px-4 text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>

                    <PaginationItem>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
      </Card>
    </div>
    </DashboardLayout>
  )
}
