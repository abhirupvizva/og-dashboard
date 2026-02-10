"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import InterviewTable from "@/components/interview-table"
import FilterPanel from "@/components/filter-panel"

interface Interview {
  _id: string
  subject: string
  "Candidate Name": string
  "End Client": string
  "Interview Round": string
  "Date of Interview": string
  "Start Time Of Interview": string
  "End Time Of Interview": string
  actualRound: string
  assignedTo?: string
  status?: string
  feedback?: string
}

export default function Dashboard() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [totalCount, setTotalCount] = useState(0)

  const [searchTerm, setSearchTerm] = useState("")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [assignedTo, setAssignedTo] = useState<string>("")
  const [excludeRounds, setExcludeRounds] = useState<string[]>([])
  const [status, setStatus] = useState<string>("")
  const [selectedClient, setSelectedClient] = useState<string>("All")

  // Fetch interviews
  const fetchInterviews = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        setCurrentPage(1)
        setInterviews([])
      }

      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", "100")

      if (dateFrom) params.append("dateFrom", dateFrom)
      if (dateTo) params.append("dateTo", dateTo)
      if (assignedTo) params.append("assignedTo", assignedTo)
      if (excludeRounds.length > 0) params.append("excludeRounds", excludeRounds.join(","))
      if (status) params.append("status", status)
      if (selectedClient !== "All") params.append("client", selectedClient)
      if (searchTerm) params.append("search", searchTerm)

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
  }, [searchTerm, dateFrom, dateTo, assignedTo, excludeRounds, status, selectedClient])

  useEffect(() => {
    fetchInterviews(1, false)
  }, [])

  const applyFilters = () => {
    fetchInterviews(1, false)
  }

  // Unique values based on actualRound only
  const uniqueClients = Array.from(new Set(interviews.map((i) => i["End Client"])))
  const uniqueRounds = Array.from(new Set(interviews.map((i) => i["actualRound"])))

  // Consistently filter interviews and round counts by actualRound
  const filteredInterviews = useMemo(
    () =>
      interviews.filter((interview) =>
        !excludeRounds.includes(interview["actualRound"])
      ),
    [interviews, excludeRounds]
  )

  const roundCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredInterviews.forEach(interview => {
      const round = interview["actualRound"]
      counts[round] = (counts[round] || 0) + 1
    })
    return counts
  }, [filteredInterviews])

  const handleExportCSV = () => {
    const headers = [
      "Candidate Name",
      "End Client",
      "Interview Round",
      "Date of Interview",
      "Start Time",
      "End Time",
      "Round Number",
      "Assigned To",
      "Status",
    ]
    const csv = [
      headers.join(","),
      ...filteredInterviews.map((i) =>
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
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `interviews-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Interviews ({filteredInterviews.length})</h1>
          <p className="text-slate-400">Manage and track interview schedules with advanced filters</p>
        </div>

        {/* Round Counts Box */}
        <Card className="bg-slate-900 border-slate-700 p-4 mb-3">
          <div className={`flex flex-wrap gap-4`}>
            {Object.entries(roundCounts).map(([round, count]) => (
              <div
                key={round}
                className="rounded-lg px-4 py-2 bg-slate-800 text-white flex items-center shadow"
              >
                <span className="text-slate-300 mr-2">{round}:</span>
                <span className="text-blue-400 font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Search and Filter Bar */}
        <Card className="bg-slate-800 border-slate-700 p-4 mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search name/client"
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                className="gap-2 border-slate-600 text-white hover:bg-slate-700 bg-transparent"
                onClick={handleExportCSV}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>

            {/* Filter Panel with advanced filters */}
            <FilterPanel
              dateFrom={dateFrom}
              setDateFrom={setDateFrom}
              dateTo={dateTo}
              setDateTo={setDateTo}
              assignedTo={assignedTo}
              setAssignedTo={setAssignedTo}
              excludeRounds={excludeRounds}
              setExcludeRounds={setExcludeRounds}
              status={status}
              setStatus={setStatus}
              selectedClient={selectedClient}
              setSelectedClient={setSelectedClient}
              uniqueClients={uniqueClients}
              uniqueRounds={uniqueRounds}
              applyFilters={applyFilters}
            />
          </div>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
              <p className="text-slate-400">Loading interviews...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 p-4 rounded-lg mb-6">
            <p>Error: {error}</p>
          </div>
        )}

        {/* Interviews Table */}
        {!loading && !error && (
          <>
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <InterviewTable interviews={filteredInterviews} />
            </Card>

            {/* Load More Button */}
            {hasNextPage && (
              <div className="text-center mt-6">
                <Button
                  onClick={() => fetchInterviews(currentPage + 1, true)}
                  disabled={loadingMore}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </>
                  ) : (
                    "Load More"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
