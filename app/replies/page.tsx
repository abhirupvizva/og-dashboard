"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Mail, RefreshCw, ChevronDown, ChevronUp, User, Calendar, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import DashboardLayout from "@/components/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ReplyMail {
  sender?: string
  to?: string
  cc?: string
  receivedDateTime?: string
  subject?: string
  body?: string
}

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
  replies?: ReplyMail[]
  feedback?: string
}

export default function RepliesPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

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
      params.append("limit", "50")
      params.append("hasReplies", "true") // Only fetch items with replies

      if (searchTerm) {
        params.append("search", searchTerm)
      }

      const response = await fetch(`/api/interviews?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch replies")
      const data = await response.json()

      if (append) {
        setInterviews(prev => [...prev, ...data.interviews])
      } else {
        setInterviews(data.interviews)
      }

      setHasNextPage(data.pagination.hasNext)
      setCurrentPage(page)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [searchTerm])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchInterviews(1, false)
    }, 500)
    return () => clearTimeout(timer)
  }, [fetchInterviews])

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-[1920px] mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Email Replies</h1>
          <p className="text-muted-foreground">Track communication threads and status updates.</p>
        </div>

        {/* Search Bar */}
        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 relative max-w-2xl">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by subject, candidate, or client..."
                className="pl-10 bg-background border-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Replies List */}
        <div className="space-y-4">
          {loading && !interviews.length ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : interviews.length === 0 ? (
             <div className="p-12 text-center bg-card rounded-lg border border-border border-dashed shadow-sm">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">No replies found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms.</p>
              </div>
          ) : (
            interviews.map((interview) => (
              <Card key={interview._id} className="bg-card border-border overflow-hidden">
                <Collapsible
                  open={openItems[interview._id]}
                  onOpenChange={() => toggleItem(interview._id)}
                >
                  <CollapsibleTrigger asChild>
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                           <h3 className="text-base font-semibold text-foreground truncate">
                              {interview.subject || "No Subject"}
                           </h3>
                           <Badge variant="outline" className="text-xs bg-muted/50">
                              {interview.replies?.length || 0} replies
                           </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" /> {interview["Candidate Name"]}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" /> {interview["End Client"]}
                          </span>
                          <span className="flex items-center gap-1">
                             <Badge
                                variant="secondary"
                                className={`text-[10px] h-5 px-1.5
                                  ${interview.status === 'Completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}
                                  ${interview.status === 'Cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''}
                                  ${interview.status === 'Rescheduled' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : ''}
                                `}
                              >
                                {interview.status || "Pending"}
                              </Badge>
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        {openItems[interview._id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border bg-muted/10 p-4 space-y-4">
                      {interview.replies?.map((reply, idx) => (
                        <Card key={idx} className="bg-background border-border shadow-none">
                          <CardHeader className="p-4 pb-2">
                             <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <CardTitle className="text-sm font-medium text-foreground">
                                    {reply.subject || "No Subject"}
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                    From: <span className="text-foreground">{reply.sender}</span> | To: {reply.to}
                                  </CardDescription>
                                </div>
                                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                  {reply.receivedDateTime}
                                </span>
                             </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-2">
                             <div className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 p-3 rounded-md max-h-[200px] overflow-y-auto">
                               {reply.body?.trim() || "No content"}
                             </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}

          {hasNextPage && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => fetchInterviews(currentPage + 1, true)}
                disabled={loadingMore}
                variant="secondary"
              >
                {loadingMore && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Load More Threads
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
