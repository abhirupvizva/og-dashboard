"use client"

import { Eye, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState, memo } from "react"
import { Badge } from "@/components/ui/badge"

interface ReplyMail {
  sender?: string
  to?: string
  cc?: string
  receivedDateTime?: string
  subject?: string
  body?: string
}

function toTimestamp(dateTime?: string) {
  if (!dateTime) return Number.NEGATIVE_INFINITY
  const t = Date.parse(dateTime)
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY
}

function pickReply(replies?: ReplyMail[]) {
  if (!replies || replies.length === 0) return null
  const items = replies.map((reply, index) => ({
    reply,
    index,
    ts: toTimestamp(reply.receivedDateTime),
    hasBody: Boolean(reply.body && reply.body.trim()),
  }))
  const candidates = items.some((i) => i.hasBody) ? items.filter((i) => i.hasBody) : items
  candidates.sort((a, b) => b.ts - a.ts || b.index - a.index)
  return candidates[0]?.reply ?? null
}

export interface Interview {
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

interface InterviewTableProps {
  interviews: Interview[]
  visibleColumns?: Record<string, boolean>
}

export const ALL_COLUMNS = {
  candidateName: "Candidate Name",
  endClient: "End Client",
  interviewRound: "Interview Round",
  date: "Date",
  time: "Time",
  actualRound: "Round #",
  assignedTo: "Assigned To",
  status: "Status",
  feedback: "Feedback",
  actions: "Actions",
}

export default memo(function InterviewTable({ interviews, visibleColumns }: InterviewTableProps) {
  const [openDialogId, setOpenDialogId] = useState<string | null>(null)

  const isVisible = (key: string) => {
    if (!visibleColumns) return true
    return visibleColumns[key] !== false
  }

  if (interviews.length === 0) {
    return (
      <div className="p-12 text-center bg-card rounded-lg border border-border border-dashed shadow-sm">
        <p className="text-muted-foreground">No interviews found matching your filters.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-md border border-border bg-card shadow-sm">
      <table className="w-full">
        <thead className="bg-muted/50 backdrop-blur">
          <tr className="border-b border-border">
            {isVisible("candidateName") && <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Candidate Name</th>}
            {isVisible("endClient") && <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Client</th>}
            {isVisible("interviewRound") && <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interview Round</th>}
            {isVisible("date") && <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>}
            {isVisible("time") && <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>}
            {isVisible("actualRound") && <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Round #</th>}
            {isVisible("assignedTo") && <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned To</th>}
            {isVisible("status") && <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>}
            {isVisible("feedback") && <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feedback</th>}
            {isVisible("actions") && <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {interviews.map((interview, idx) => (
            <tr key={interview._id} className="hover:bg-muted/50 transition-colors group">
              {isVisible("candidateName") && <td className="px-6 py-4 text-sm text-foreground font-medium">{interview["Candidate Name"]}</td>}
              {isVisible("endClient") && <td className="px-6 py-4 text-sm text-muted-foreground">{interview["End Client"]}</td>}
              {isVisible("interviewRound") && <td className="px-6 py-4 text-sm text-muted-foreground">{interview["Interview Round"]}</td>}
              {isVisible("date") && <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">{interview["Date of Interview"]}</td>}
              {isVisible("time") && <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">{interview["Start Time Of Interview"]} - {interview["End Time Of Interview"]}</td>}
              {isVisible("actualRound") && (
                <td className="px-6 py-4 text-sm">
                  <Badge variant="outline" className="bg-background text-foreground border-border">
                    {interview.actualRound}
                  </Badge>
                </td>
              )}
              {isVisible("assignedTo") && <td className="px-6 py-4 text-sm text-muted-foreground">{interview.assignedTo || "-"}</td>}
              {isVisible("status") && (
                <td className="px-6 py-4 text-sm">
                  <Badge
                    variant="secondary"
                    className={`
                      ${interview.status === 'Completed' ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20' : ''}
                      ${interview.status === 'Cancelled' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20' : ''}
                      ${interview.status === 'Rescheduled' ? 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20' : ''}
                      ${!['Completed', 'Cancelled', 'Rescheduled'].includes(interview.status || '') ? 'bg-secondary text-secondary-foreground' : ''}
                    `}
                  >
                    {interview.status || "Pending"}
                  </Badge>
                </td>
              )}
              {isVisible("feedback") && (
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {(() => {
                    const displayReply = pickReply(interview.replies)
                    if (!displayReply) {
                      return <span className="text-muted-foreground/50 text-xs italic">No feedback</span>
                    }
                    return (
                      <Dialog open={openDialogId === interview._id} onOpenChange={(open) => setOpenDialogId(open ? interview._id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 text-xs border-border bg-background text-primary hover:bg-primary/10 hover:text-primary hover:border-primary/20">
                          View Mail
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-popover border-border text-popover-foreground w-[95vw] max-w-6xl">
                        <DialogHeader>
                          <DialogTitle className="text-lg font-semibold text-foreground border-b border-border pb-2">
                            {displayReply.subject?.trim() ? displayReply.subject : "Mail Body"}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-[60px_1fr] gap-2 text-sm">
                            <span className="text-muted-foreground font-medium">From:</span>
                            <span className="text-foreground break-all">{displayReply.sender || "Unknown"}</span>

                            <span className="text-muted-foreground font-medium">To:</span>
                            <span className="text-foreground break-all">{displayReply.to || "Unknown"}</span>

                            <span className="text-muted-foreground font-medium">CC:</span>
                            <span className="text-foreground break-all">{displayReply.cc || "None"}</span>

                            <span className="text-muted-foreground font-medium">Date:</span>
                            <span className="text-foreground">{displayReply.receivedDateTime || "Unknown"}</span>
                          </div>

                          <div className="bg-muted/50 rounded-lg p-4 border border-border text-sm leading-relaxed text-foreground max-h-[60vh] overflow-y-auto whitespace-pre-wrap font-mono">
                            {displayReply.body}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    )
                  })()}
                </td>
              )}
              {isVisible("actions") && (
                <td className="px-6 py-4 text-right text-sm">
                  <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-primary/10 hover:text-primary">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-green-500/10 hover:text-green-500">
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})
