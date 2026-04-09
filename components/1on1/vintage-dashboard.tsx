"use client"

import * as React from "react"
import { Users, Calendar, FileText, Target, RefreshCw, Plus, FileEdit, TrendingUp, Award, Zap, FlaskConical } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const EMPLOYEES = [
  { "Employee Name": "Aakash Sharma", "Employee ID": "#VNCR0389", "Team Lead": "Prateek Narvariya", email: "Aakash.sharma@vizvainc.com" },
  { "Employee Name": "Eklavya", "Employee ID": "#VNCR0446", "Team Lead": "Prateek Narvariya", email: "Eklavya.prasad@vizvainc.com" },
  { "Employee Name": "Aman Agnihotri", "Employee ID": "#VG0308", "Team Lead": "Rujuwal Garg", email: "aman.agnihotri@vizvainc.com" },
  { "Employee Name": "Amartya Kumar", "Employee ID": "#1702", "Team Lead": "Rujuwal Garg", email: "amartya.kumar@vizvainc.com" },
  { "Employee Name": "Varsha Sahu", "Employee ID": "#VNCR0394", "Team Lead": "Prateek Narvariya", email: "varsha.sahu@vizvainc.com" },
  { "Employee Name": "Priyanshu Jana", "Employee ID": "#VNCR0444", "Team Lead": "Prateek Narvariya", email: "priyanshu.jana@vizvainc.com" },
  { "Employee Name": "Abhirup Kumar", "Employee ID": "#VNCR0447", "Team Lead": "Prateek Narvariya", email: "Abhirup.kumar@vizvainc.com" },
  { "Employee Name": "Rahul Agarwal", "Employee ID": "#VG0267", "Team Lead": "Rujuwal Garg", email: "rahul.agarwal@vizvainc.com" },
  { "Employee Name": "Aditya Sharma", "Employee ID": "#VG0262", "Team Lead": "Rujuwal Garg", email: "aditya.sharma@vizvainc.com" }
]

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

const MOCK_DATA = {
  empName: "Aakash Sharma",
  empId: "#VNCR0389",
  teamLead: "Prateek Narvariya",
  performanceMonth: new Date().toISOString().slice(0, 7),
  leavesTaken: 2,
  interviewsReceived: 18,
  completedInterviews: 14,
  rescheduledCancelledInterviews: 3,
  notDoneInterviews: 1,
  poKpi: 4,
  poCount: 5,
  kpiScores: [
    {
      id: 1, category: "Performance Review",
      employeeInput: "I consistently met all interview targets this month and maintained high quality in candidate assessments. Managed 18 interviews with a 14-completion rate.",
      teamLeadFeedback: "Strong performance. Well-organised and thorough in evaluations. Has shown great improvement in structured feedback delivery.",
      score: 4,
      improvementPlan: "Focus on reducing time-per-interview while maintaining quality. Aim for a 90% completion rate next month."
    },
    {
      id: 2, category: "KRA Awareness",
      employeeInput: "Aware of all KRAs assigned for this quarter and tracking progress weekly. Shared KRA updates in two team standups.",
      teamLeadFeedback: "Good understanding of KRAs. Needs to improve report documentation to align with team standards.",
      score: 3,
      improvementPlan: "Maintain a weekly KRA tracking sheet and share detailed progress notes in team standups by next month."
    },
    {
      id: 3, category: "Career Path",
      employeeInput: "Completed 2 online certifications this month and attended 1 internal workshop on advanced sourcing strategies.",
      teamLeadFeedback: "Shows excellent initiative in self-development. The certifications directly complement current role requirements.",
      score: 4,
      improvementPlan: "Enrol in the advanced sourcing strategies advanced course by end of next month and share learnings with team."
    },
    {
      id: 4, category: "Communication",
      employeeInput: "Actively participated in all team meetings and shared best practices with 2 junior team members. Led one internal knowledge-sharing session.",
      teamLeadFeedback: "Excellent communication skills. Has been instrumental in onboarding new team members and promoting positive team culture.",
      score: 5,
      improvementPlan: "Continue mentoring junior members and consider leading a cross-team training session next quarter."
    },
  ],
  _isMockData: true,
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-indigo-500", "bg-violet-500", "bg-emerald-500",
  "bg-rose-500", "bg-amber-500", "bg-sky-500", "bg-teal-500", "bg-pink-500"
]

export function VintageDashboard({ onNew, onEdit, reviews = [], fetchReviews, loading }: {
  onNew: (emp?: any) => void
  onEdit: (r: any) => void
  reviews: any[]
  fetchReviews: () => void
  loading: boolean
}) {
  const totalReviews = reviews.length
  const uniqueEmployees = new Set(reviews.map(r => r.empId)).size
  const uniquePeriods = new Set(reviews.map(r => r.performanceMonth)).size
  const totalCompleted = reviews.reduce((sum, r) => sum + (Number(r.completedInterviews) || 0), 0)
  const totalCancelled = reviews.reduce((sum, r) => sum + (Number(r.rescheduledCancelledInterviews) || 0), 0)
  const totalPo = reviews.reduce((sum, r) => sum + (Number(r.poCount) || 0), 0)

  const stats = [
    { label: "Total Reviews", value: totalReviews, icon: FileText, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
    { label: "Employees", value: uniqueEmployees, icon: Users, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
    { label: "Periods", value: uniquePeriods, icon: Calendar, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200" },
    { label: "Completed", value: totalCompleted, icon: TrendingUp, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200" },
    { label: "Cancelled", value: totalCancelled, icon: RefreshCw, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" },
    { label: "Total POs", value: totalPo, icon: Target, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" },
  ]

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-8 relative overflow-hidden">
        {/* Decorative grid */}
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px"}} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="relative max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-blue-400 text-xs font-semibold tracking-widest uppercase">GGR · Technical</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Interview Performance</h1>
              <p className="text-slate-400 text-sm mt-1">Manage employee interview performance evaluations · 1 on 1</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchReviews}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm font-medium transition-all duration-200 disabled:opacity-50 border border-white/10 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={() => onNew()}
                className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-900/40 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Blank Review
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-10">
        {/* KPI Stats */}
        <div className="-mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
              <div className={`w-9 h-9 rounded-lg ${s.bg} ${s.border} border flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <div>
                <div className="text-2xl font-black text-slate-800">{s.value}</div>
                <div className="text-xs font-medium text-slate-500 mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Start Section */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Quick Start Review</h2>
              <p className="text-xs text-slate-500">Click an employee to pre-fill their review form</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {/* Mock Data Test Card */}
            <button
              onClick={() => onNew(MOCK_DATA)}
              className="group flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 transition-all duration-150 cursor-pointer text-left"
            >
              <div className="w-9 h-9 shrink-0 rounded-full bg-amber-500 flex items-center justify-center">
                <FlaskConical className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-800 truncate group-hover:text-amber-900 transition-colors">Mock Data</div>
                <div className="text-[10px] text-amber-500 truncate">Test PDF Export</div>
              </div>
            </button>
            {EMPLOYEES.map((emp, idx) => (
              <button
                key={idx}
                onClick={() => onNew({ empName: emp["Employee Name"], empId: emp["Employee ID"], teamLead: emp["Team Lead"], email: emp.email })}
                className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all duration-150 cursor-pointer text-left"
              >
                <div className={`w-9 h-9 shrink-0 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-xs font-black`}>
                  {getInitials(emp["Employee Name"])}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-blue-700 transition-colors">{emp["Employee Name"]}</div>
                  <div className="text-[10px] text-slate-400 truncate">{emp["Employee ID"]}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Reviews Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-28 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-28 px-6 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center">
              <FileEdit className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">No reviews yet</h3>
              <p className="text-sm text-slate-500 mt-1">Get started by choosing an employee above or creating a blank review.</p>
            </div>
            <button
              onClick={() => onNew()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-200 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create First Review
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-800">Review History</h2>
                <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">{reviews.length}</span>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider">Month</TableHead>
                  <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider">Employee</TableHead>
                  <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider">Team Lead</TableHead>
                  <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Interviews</TableHead>
                  <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider text-center">Avg Score</TableHead>
                  <TableHead className="font-bold text-slate-600 text-xs uppercase tracking-wider text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((r) => {
                  const eff = Math.max(0, (r.interviewsReceived || 0) - (r.rescheduledCancelledInterviews || 0))
                  const done = r.completedInterviews || 0
                  const kpiCount = Array.isArray(r.kpiScores) ? r.kpiScores.length : 0
                  const total = Array.isArray(r.kpiScores) ? r.kpiScores.reduce((acc: number, cur: any) => acc + (Number(cur.score) || 0), 0) : 0
                  const avg = kpiCount > 0 ? (total / kpiCount) : null
                  const avgDisplay = avg !== null ? avg.toFixed(2) : "N/A"

                  let scoreBg = "bg-slate-100 text-slate-600"
                  if (avg !== null) {
                    if (avg >= 4.5) scoreBg = "bg-emerald-100 text-emerald-700"
                    else if (avg >= 3.5) scoreBg = "bg-green-100 text-green-700"
                    else if (avg >= 2.5) scoreBg = "bg-yellow-100 text-yellow-700"
                    else if (avg >= 1.5) scoreBg = "bg-orange-100 text-orange-700"
                    else scoreBg = "bg-red-100 text-red-700"
                  }

                  return (
                    <TableRow
                      key={r.id}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors duration-150 border-slate-100"
                      onClick={() => onEdit(r)}
                    >
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                          <Calendar className="w-3 h-3" />
                          {r.performanceMonth}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full ${AVATAR_COLORS[EMPLOYEES.findIndex(e => e["Employee ID"] === r.empId) % AVATAR_COLORS.length] || "bg-slate-400"} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                            {getInitials(r.empName || "?")}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800">{r.empName}</div>
                            <div className="text-xs text-slate-400">{r.empId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{r.teamLead}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-semibold text-slate-700">{eff}</span>
                        <span className="text-slate-400 text-xs mx-1">/</span>
                        <span className="text-sm text-slate-500">{done}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">eff / done</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${scoreBg}`}>
                          {avgDisplay}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); onEdit(r) }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold transition-all duration-150 cursor-pointer border border-transparent hover:border-blue-200"
                        >
                          <Award className="w-3.5 h-3.5" />
                          View / Edit
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
