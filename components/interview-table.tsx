"use client"

import { Eye, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"

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
}

interface InterviewTableProps {
  interviews: Interview[]
}

export default function InterviewTable({ interviews }: InterviewTableProps) {
  const [openDialogIndex, setOpenDialogIndex] = useState<number | null>(null);

  if (interviews.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-400">No interviews found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-900">
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Candidate Name</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">End Client</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Interview Round</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Time</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Round #</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Assigned To</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Feedback</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
          </tr>
        </thead>
        <tbody>
          {interviews.map((interview, idx) => (
            <tr key={interview._id} className="border-b border-slate-700 hover:bg-slate-700 transition-colors">
              <td className="px-6 py-4 text-sm text-white font-medium">{interview["Candidate Name"]}</td>
              <td className="px-6 py-4 text-sm text-slate-300">{interview["End Client"]}</td>
              <td className="px-6 py-4 text-sm text-slate-300">{interview["Interview Round"]}</td>
              <td className="px-6 py-4 text-sm text-slate-300">{interview["Date of Interview"]}</td>
              <td className="px-6 py-4 text-sm text-slate-300">{interview["Start Time Of Interview"]} - {interview["End Time Of Interview"]}</td>
              <td className="px-6 py-4 text-sm text-slate-300">{interview.actualRound}</td>
              <td className="px-6 py-4 text-sm text-slate-300">{interview.assignedTo || "N/A"}</td>
              <td className="px-6 py-4 text-sm text-slate-300">{interview.status || "N/A"}</td>
              <td className="px-6 py-4 text-sm text-slate-300">
                {interview.replies && interview.replies.length >= 3 && interview.replies[2] ? (
                  <Dialog open={openDialogIndex === idx} onOpenChange={open => setOpenDialogIndex(open ? idx : null)}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-slate-600">
                        View Feedback
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {interview.replies[2].subject?.trim() ? interview.replies[2].subject : "Mail Body"}
                        </DialogTitle>
                      </DialogHeader>
                      <div
                        className="whitespace-pre-wrap text-sm"
                        style={{
                          maxHeight: "350px",
                          maxWidth: "600px",
                          overflowY: "auto",
                          overflowX: "auto",
                          background: "#181E2A",
                          borderRadius: "8px",
                          padding: "12px",
                          boxSizing: "border-box",
                          color: "#fff"
                        }}
                      >
                        <strong>From:</strong> {interview.replies[2].sender?.trim() ? interview.replies[2].sender : "Unknown"}<br />
                        <strong>To:</strong> {interview.replies[2].to?.trim() ? interview.replies[2].to : "Unknown"}<br />
                        <strong>CC:</strong> {interview.replies[2].cc?.trim() ? interview.replies[2].cc : "None"}<br />
                        <strong>Date:</strong> {interview.replies[2].receivedDateTime?.trim() ? interview.replies[2].receivedDateTime : "Unknown"}<br />
                        <hr className="my-2" />
                        {interview.replies[2].body}
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  "N/A"
                )}
              </td>
              <td className="px-6 py-4 text-sm">
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-slate-600">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-green-400 hover:bg-slate-600">
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-400 hover:bg-slate-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
