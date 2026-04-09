"use client"

import * as React from "react"
import { useForm, useFieldArray, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  ArrowLeft, Calculator, Download, Save, RefreshCw,
  User, Building2, CreditCard, UserCheck, CalendarDays, Palmtree,
  TrendingUp, Target, BarChart3, Award, Zap, Loader2
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const scoreSchema = z.object({
  id: z.number(),
  category: z.string(),
  employeeInput: z.string().optional(),
  teamLeadFeedback: z.string().optional(),
  score: z.coerce.number().min(0).max(5).default(0),
  improvementPlan: z.string().optional(),
})

const formSchema = z.object({
  id: z.string().optional(),
  branch: z.string().min(1, "Required"),
  empName: z.string().min(1, "Required"),
  department: z.string().min(1, "Required"),
  empId: z.string().min(1, "Required"),
  teamLead: z.string().min(1, "Required"),
  performanceMonth: z.string().regex(/^\d{4}-\d{2}$/, "Must be YYYY-MM"),
  leavesTaken: z.coerce.number(),
  interviewsReceived: z.coerce.number(),
  completedInterviews: z.coerce.number(),
  notDoneInterviews: z.coerce.number(),
  rescheduledCancelledInterviews: z.coerce.number(),
  poKpi: z.coerce.number(),
  poCount: z.coerce.number(),
  kpiScores: z.array(scoreSchema).default([]),
})

type FormValues = z.infer<typeof formSchema>

// Reusable read-only field wrapper
function ReadOnlyField({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
        <Icon className="w-3 h-3" />
        {label}
      </label>
      <div className="h-10 px-3 rounded-lg bg-slate-100 border border-slate-200 flex items-center text-slate-500 text-sm font-medium select-none cursor-not-allowed">
        {value || <span className="text-slate-300 italic">—</span>}
      </div>
    </div>
  )
}

export function VintageForm({ initialData, onBack, onSave }: {
  initialData: any
  onBack: () => void
  onSave: (data: FormValues) => Promise<void>
}) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isFetchingStats, setIsFetchingStats] = React.useState(false)
  const [statsFetched, setStatsFetched] = React.useState(false)
  const employeeEmail = initialData?.email || ""

  const defaultKpiCategories = [
    "Performance Review",
    "KRA Awareness",
    "Career Path",
    "Communication"
  ]

  const isEditing = initialData && initialData._id

  const getInitialKpiScores = (): z.infer<typeof scoreSchema>[] => {
    // Editing an existing review — use saved scores
    if (isEditing && initialData.kpiScores) return initialData.kpiScores
    // Mock data or any pre-loaded kpiScores passed in
    if (initialData?.kpiScores && Array.isArray(initialData.kpiScores) && initialData.kpiScores.length > 0)
      return initialData.kpiScores
    // Default blank KPI categories for new reviews
    return defaultKpiCategories.map((cat, i) => ({
      id: i + 1,
      category: cat,
      employeeInput: "",
      teamLeadFeedback: "",
      score: 0,
      improvementPlan: ""
    }))
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: (isEditing ? initialData : {
      branch: "GGR",
      empName: initialData?.empName || "",
      department: "Technical",
      empId: initialData?.empId || "",
      teamLead: initialData?.teamLead || "",
      performanceMonth: initialData?.performanceMonth || new Date().toISOString().slice(0, 7),
      leavesTaken: initialData?.leavesTaken ?? 0,
      interviewsReceived: initialData?.interviewsReceived ?? 0,
      completedInterviews: initialData?.completedInterviews ?? 0,
      notDoneInterviews: initialData?.notDoneInterviews ?? 0,
      rescheduledCancelledInterviews: initialData?.rescheduledCancelledInterviews ?? 0,
      poKpi: initialData?.poKpi ?? 0,
      poCount: initialData?.poCount ?? 0,
      kpiScores: getInitialKpiScores(),
    }) as FormValues,
  })

  // Reactive watches — ORIGINAL LOGIC PRESERVED
  const interviewsReceived = useWatch({ control: form.control, name: "interviewsReceived" }) || 0
  const rescheduledCancelledInterviews = useWatch({ control: form.control, name: "rescheduledCancelledInterviews" }) || 0
  const completedInterviews = useWatch({ control: form.control, name: "completedInterviews" }) || 0
  const poKpi = useWatch({ control: form.control, name: "poKpi" }) || 0
  const poCount = useWatch({ control: form.control, name: "poCount" }) || 0
  const kpiScores = useWatch({ control: form.control, name: "kpiScores" }) || []

  const effectiveInterviews = React.useMemo(() => Math.max(0, interviewsReceived - rescheduledCancelledInterviews), [interviewsReceived, rescheduledCancelledInterviews])
  const notDoneInterviewsCalc = React.useMemo(() => Math.max(0, effectiveInterviews - completedInterviews), [effectiveInterviews, completedInterviews])

  React.useEffect(() => {
    if (form.getValues("notDoneInterviews") !== notDoneInterviewsCalc) {
      form.setValue("notDoneInterviews", notDoneInterviewsCalc)
    }
  }, [notDoneInterviewsCalc, form])

  // Auto-fetch interview stats from MongoDB when email + month are available
  const watchedMonth = useWatch({ control: form.control, name: "performanceMonth" })

  const fetchInterviewStats = React.useCallback(async (email: string, month: string) => {
    if (!email || !month || !/^\d{4}-\d{2}$/.test(month)) return
    setIsFetchingStats(true)
    try {
      const res = await fetch(`/api/1on1/interview-stats?email=${encodeURIComponent(email)}&month=${encodeURIComponent(month)}`)
      if (!res.ok) throw new Error("Failed to fetch stats")
      const data = await res.json()
      form.setValue("interviewsReceived", data.received ?? 0)
      form.setValue("completedInterviews", data.completed ?? 0)
      form.setValue("rescheduledCancelledInterviews", data.rescheduledCancelled ?? 0)
      setStatsFetched(true)
    } catch (err) {
      console.error("Failed to fetch interview stats:", err)
    } finally {
      setIsFetchingStats(false)
    }
  }, [form])

  React.useEffect(() => {
    if (employeeEmail && watchedMonth && !isEditing) {
      fetchInterviewStats(employeeEmail, watchedMonth)
    }
  }, [employeeEmail, watchedMonth, isEditing, fetchInterviewStats])

  const compRate = effectiveInterviews > 0 ? (completedInterviews / effectiveInterviews) * 100 : 0
  const poAchieveRate = poKpi > 0 ? (poCount / poKpi) * 100 : 0

  // ORIGINAL SCORING LOGIC
  const validScores = kpiScores.filter((h: any) => Number(h.score) > 0)
  const avgScore = validScores.length === 0 ? 0 : validScores.reduce((acc, p) => acc + Number(p.score), 0) / validScores.length

  let ratingBadge = "N/A"
  let ratingColor = "bg-slate-100 text-slate-600"
  if (avgScore > 0) {
    if (avgScore >= 4.5) { ratingBadge = "Excellent"; ratingColor = "bg-emerald-100 text-emerald-700" }
    else if (avgScore >= 3.5) { ratingBadge = "Good"; ratingColor = "bg-green-100 text-green-700" }
    else if (avgScore >= 2.5) { ratingBadge = "Satisfactory"; ratingColor = "bg-yellow-100 text-yellow-700" }
    else if (avgScore >= 1.5) { ratingBadge = "Needs Improvement"; ratingColor = "bg-orange-100 text-orange-700" }
    else { ratingBadge = "Poor"; ratingColor = "bg-red-100 text-red-700" }
  }

  const { fields } = useFieldArray({ control: form.control, name: "kpiScores" })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      await onSave(values)
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleExportPdf() {
    const values = form.getValues()
    const validKpi = (values.kpiScores || []).filter((k: any) => Number(k.score) > 0)
    const avg = validKpi.length > 0
      ? (validKpi.reduce((s: number, k: any) => s + Number(k.score), 0) / validKpi.length)
      : 0
    let rating = "N/A"
    if (avg >= 4.5) rating = "Excellent"
    else if (avg >= 3.5) rating = "Good"
    else if (avg >= 2.5) rating = "Satisfactory"
    else if (avg >= 1.5) rating = "Needs Improvement"
    else if (avg > 0) rating = "Poor"

    const effInt = Math.max(0, (values.interviewsReceived || 0) - (values.rescheduledCancelledInterviews || 0))
    const compRate = effInt > 0 ? ((values.completedInterviews || 0) / effInt * 100).toFixed(1) : "0.0"
    const poRate = (values.poKpi || 0) > 0 ? ((values.poCount || 0) / (values.poKpi || 1) * 100).toFixed(1) : "0.0"

    const kpiRows = (values.kpiScores || []).map((k: any, i: number) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 12px;font-weight:700;color:#475569;">${i + 1}</td>
        <td style="padding:10px 12px;font-weight:700;color:#1e293b;">${k.category}</td>
        <td style="padding:10px 12px;color:#475569;font-size:12px;">${k.employeeInput || '—'}</td>
        <td style="padding:10px 12px;color:#475569;font-size:12px;">${k.teamLeadFeedback || '—'}</td>
        <td style="padding:10px 12px;text-align:center;">
          <span style="display:inline-block;padding:3px 10px;border-radius:999px;background:${Number(k.score)>=4?'#dcfce7':Number(k.score)>=3?'#fef9c3':'#fee2e2'};color:${Number(k.score)>=4?'#15803d':Number(k.score)>=3?'#854d0e':'#b91c1c'};font-weight:800;">${k.score || '—'}</span>
        </td>
        <td style="padding:10px 12px;color:#475569;font-size:12px;">${k.improvementPlan || '—'}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Performance Review — ${values.empName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1e293b; font-size: 13px; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: #fff; padding: 28px 36px; }
    .header h1 { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; }
    .header p { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .badge { display:inline-block; padding: 3px 10px; border-radius: 999px; background:#3b82f6; color:#fff; font-size:11px; font-weight:700; margin-top:8px; }
    .section { padding: 20px 36px; border-bottom: 1px solid #f1f5f9; }
    .section-title { font-size: 11px; font-weight: 800; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .field label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; display:block; margin-bottom:3px; }
    .field span { font-size: 13px; font-weight: 600; color: #1e293b; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
    .stat-card .val { font-size: 22px; font-weight: 900; color: #1e293b; }
    .stat-card .lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; margin-top: 2px; }
    .progress { height: 6px; background: #e2e8f0; border-radius: 999px; margin-top: 6px; }
    .progress-bar { height: 100%; border-radius: 999px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #f8fafc; }
    thead th { padding: 10px 12px; text-align: left; font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
    .footer { background: #f8fafc; padding: 16px 36px; display: flex; justify-content: flex-end; gap: 32px; align-items: center; }
    .score-big { font-size: 36px; font-weight: 900; color: #1e293b; }
    .rating-pill { display:inline-block; padding: 6px 18px; border-radius: 999px; font-weight: 800; font-size: 13px; background: ${avg>=4.5?'#dcfce7':avg>=3.5?'#d1fae5':avg>=2.5?'#fef9c3':avg>=1.5?'#ffedd5':'#fee2e2'}; color: ${avg>=4.5?'#15803d':avg>=3.5?'#065f46':avg>=2.5?'#854d0e':avg>=1.5?'#9a3412':'#b91c1c'}; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Monthly Performance Review</h1>
    <p>Branch: GGR &nbsp;|&nbsp; Department: Technical &nbsp;|&nbsp; Generated: ${new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })}</p>
    <span class="badge">${values.performanceMonth}</span>
  </div>

  <div class="section">
    <div class="section-title">Employee Information</div>
    <div class="grid4">
      <div class="field"><label>Name</label><span>${values.empName || '—'}</span></div>
      <div class="field"><label>Employee ID</label><span>${values.empId || '—'}</span></div>
      <div class="field"><label>Team Lead</label><span>${values.teamLead || '—'}</span></div>
      <div class="field"><label>Leaves Taken</label><span>${values.leavesTaken ?? 0}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Interview KPI Metrics</div>
    <div class="grid4">
      <div class="stat-card"><div class="val">${values.interviewsReceived ?? 0}</div><div class="lbl">Received</div></div>
      <div class="stat-card"><div class="val">${values.rescheduledCancelledInterviews ?? 0}</div><div class="lbl">Rescheduled / Cancelled</div></div>
      <div class="stat-card"><div class="val">${effInt}</div><div class="lbl">Effective</div></div>
      <div class="stat-card"><div class="val">${values.completedInterviews ?? 0}</div><div class="lbl">Completed</div></div>
    </div>
    <div class="grid3" style="margin-top:12px;">
      <div class="stat-card">
        <div class="lbl">Completion Rate</div>
        <div class="val" style="font-size:28px;">${compRate}%</div>
        <div class="progress"><div class="progress-bar" style="width:${Math.min(parseFloat(compRate),100)}%;background:#3b82f6;"></div></div>
      </div>
      <div class="stat-card">
        <div class="lbl">PO Achievement</div>
        <div class="val" style="font-size:28px;">${poRate}%</div>
        <div class="progress"><div class="progress-bar" style="width:${Math.min(parseFloat(poRate),100)}%;background:#10b981;"></div></div>
      </div>
      <div class="stat-card">
        <div class="lbl">PO Actual / Expected</div>
        <div class="val" style="font-size:28px;">${values.poCount ?? 0} / ${values.poKpi ?? 0}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">KPI Score Assessment</div>
    <table>
      <thead><tr>
        <th style="width:36px;">#</th>
        <th style="width:130px;">Category</th>
        <th>Employee Input</th>
        <th>Team Lead Feedback</th>
        <th style="width:70px;text-align:center;">Score</th>
        <th>Improvement Plan</th>
      </tr></thead>
      <tbody>${kpiRows}</tbody>
    </table>
  </div>

  <div class="footer">
    <div style="text-align:right;">
      <div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;">Average Score</div>
      <div class="score-big">${avg.toFixed(2)}</div>
    </div>
    <div style="text-align:right;border-left:1px solid #e2e8f0;padding-left:24px;">
      <div style="font-size:10px;font-weight:800;color:#94a3b8;text-transform:uppercase;margin-bottom:6px;">Final Rating</div>
      <span class="rating-pill">${rating}</span>
    </div>
  </div>
</body>
</html>`

    const win = window.open("", "_blank", "width=1000,height=800")
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 600)
  }

  const watchMonthValue = form.watch("performanceMonth")
  const watchEmpName = form.watch("empName")

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors duration-150 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>

          <div className="hidden md:block text-center">
            <h1 className="text-base font-black text-slate-800">Performance Review Form</h1>
            {watchEmpName && (
              <p className="text-xs text-slate-500">{watchEmpName} · {watchMonthValue}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleExportPdf}
              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 text-sm transition-all duration-150"
            >
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button
              type="submit"
              form="vintage-form"
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm shadow-md shadow-blue-600/20 transition-all duration-150"
              disabled={isSubmitting}
            >
              {isSubmitting ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Review
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Form {...form}>
          <form id="vintage-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            {/* Section 1: Employee Info */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Employee Information
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                {isEditing ? (
                  <ReadOnlyField label="Branch" value={form.watch("branch")} icon={Building2} />
                ) : (
                  <FormField control={form.control} name="branch" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3 h-3" />
                        Branch
                      </FormLabel>
                      <FormControl>
                        <Input className="h-10 border-slate-200 bg-white focus-visible:ring-blue-500 focus-visible:ring-2 text-sm" placeholder="e.g. GGR" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {isEditing ? (
                  <ReadOnlyField label="Employee Name" value={form.watch("empName")} icon={User} />
                ) : (
                  <FormField control={form.control} name="empName" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <User className="w-3 h-3" />
                        Employee Name
                      </FormLabel>
                      <FormControl>
                        <Input className="h-10 border-slate-200 bg-white focus-visible:ring-blue-500 focus-visible:ring-2 text-sm" placeholder="Full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {isEditing ? (
                  <ReadOnlyField label="Department" value={form.watch("department")} icon={Building2} />
                ) : (
                  <FormField control={form.control} name="department" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3 h-3" />
                        Department
                      </FormLabel>
                      <FormControl>
                        <Input className="h-10 border-slate-200 bg-white focus-visible:ring-blue-500 focus-visible:ring-2 text-sm" placeholder="e.g. Technical" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {isEditing ? (
                  <ReadOnlyField label="Employee ID" value={form.watch("empId")} icon={CreditCard} />
                ) : (
                  <FormField control={form.control} name="empId" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-3 h-3" />
                        Employee ID
                      </FormLabel>
                      <FormControl>
                        <Input className="h-10 border-slate-200 bg-white focus-visible:ring-blue-500 focus-visible:ring-2 text-sm" placeholder="e.g. #VNCR0389" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                {isEditing ? (
                  <ReadOnlyField label="Team Lead" value={form.watch("teamLead")} icon={UserCheck} />
                ) : (
                  <FormField control={form.control} name="teamLead" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="w-3 h-3" />
                        Team Lead
                      </FormLabel>
                      <FormControl>
                        <Input className="h-10 border-slate-200 bg-white focus-visible:ring-blue-500 focus-visible:ring-2 text-sm" placeholder="Team lead name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}

                <FormField control={form.control} name="performanceMonth" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <CalendarDays className="w-3 h-3" />
                      Performance Month
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 border-slate-200 bg-white focus-visible:ring-blue-500 focus-visible:ring-2 text-sm"
                        type="month"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="leavesTaken" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Palmtree className="w-3 h-3" />
                      Leaves Taken
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="h-10 border-slate-200 bg-white focus-visible:ring-blue-500 focus-visible:ring-2 text-sm"
                        type="number"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </div>

            {/* Section 2: Interview KPI Metrics */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-blue-600" />
                  Interview KPI Metrics
                </h2>
                <div className="flex items-center gap-2">
                  {isFetchingStats && (
                    <span className="flex items-center gap-1.5 text-xs text-blue-600 font-medium animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Fetching from DB…
                    </span>
                  )}
                  {statsFetched && !isFetchingStats && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      <Zap className="w-3 h-3" />
                      Auto-filled
                    </span>
                  )}
                  {employeeEmail && !isEditing && (
                    <button
                      type="button"
                      onClick={() => fetchInterviewStats(employeeEmail, form.getValues("performanceMonth"))}
                      disabled={isFetchingStats}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-all duration-150 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isFetchingStats ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  )}
                </div>
              </div>
              {/* Month selection tabs */}
              {employeeEmail && !isEditing && (
                <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Month:</span>
                  {(() => {
                    const months: string[] = []
                    const now = new Date()
                    for (let i = 5; i >= 0; i--) {
                      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
                      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
                    }
                    return months.map((m) => {
                      const [y, mo] = m.split("-")
                      const label = new Date(parseInt(y), parseInt(mo) - 1).toLocaleString("en-US", { month: "short", year: "numeric" })
                      const isActive = watchedMonth === m
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            form.setValue("performanceMonth", m)
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer shrink-0 ${
                            isActive
                              ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                              : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200"
                          }`}
                        >
                          {label}
                        </button>
                      )
                    })
                  })()}
                </div>
              )}
              <div className="p-6 space-y-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <FormField control={form.control} name="interviewsReceived" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Received</FormLabel>
                      <FormControl>
                        <Input className="h-12 text-xl font-black text-center border-slate-200 focus-visible:ring-blue-500 bg-blue-50/50" type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="rescheduledCancelledInterviews" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rescheduled / Cancelled</FormLabel>
                      <FormControl>
                        <Input className="h-12 text-xl font-black text-center border-slate-200 focus-visible:ring-rose-400 bg-rose-50/50" type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Effective (Auto)</label>
                    <div className="h-12 flex items-center justify-center text-xl font-black bg-slate-100 border border-slate-200 rounded-md text-slate-500 select-none">
                      {effectiveInterviews}
                    </div>
                  </div>
                  <FormField control={form.control} name="completedInterviews" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</FormLabel>
                      <FormControl>
                        <Input className="h-12 text-xl font-black text-center border-slate-200 focus-visible:ring-emerald-400 bg-emerald-50/50" type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Not Done (Auto)</label>
                    <div className="h-12 flex items-center justify-center text-xl font-black bg-slate-100 border border-slate-200 rounded-md text-slate-500 select-none">
                      {notDoneInterviewsCalc}
                    </div>
                  </div>
                  <FormField control={form.control} name="poKpi" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Expected PO</FormLabel>
                      <FormControl>
                        <Input className="h-12 text-xl font-black text-center border-emerald-200 focus-visible:ring-emerald-500 bg-emerald-50" type="number" step="0.1" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="poCount" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Actual PO Count</FormLabel>
                      <FormControl>
                        <Input className="h-12 text-xl font-black text-center border-blue-200 focus-visible:ring-blue-500 bg-blue-50" type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                </div>

                {/* Live KPI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Completion Rate</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">{compRate.toFixed(1)}%</div>
                    <div className="text-xs text-slate-500 mt-1">{completedInterviews} of {effectiveInterviews} effective</div>
                    <div className="mt-3 h-1.5 rounded-full bg-blue-100">
                      <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(compRate, 100)}%` }} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">PO Achievement</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">{poAchieveRate.toFixed(1)}%</div>
                    <div className="text-xs text-slate-500 mt-1">{poCount} of {poKpi} expected</div>
                    <div className="mt-3 h-1.5 rounded-full bg-emerald-100">
                      <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(poAchieveRate, 100)}%` }} />
                    </div>
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">PO Performance</span>
                    </div>
                    <div className="text-3xl font-black text-slate-800">{poCount} <span className="text-slate-400 text-xl font-bold">/</span> {poKpi}</div>
                    <div className="text-xs text-slate-500 mt-1">Actual / Expected POs</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: KPI Score Table */}
            {fields.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    KPI Score Assessment
                  </h2>
                  {avgScore > 0 && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${ratingColor}`}>
                      {ratingBadge}
                    </span>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-10">#</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-44">KPI Category</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee Input</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Team Lead Feedback</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-28">Score (1–5)</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Improvement Plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fields.map((field, index) => {
                        const currentScore = Number(kpiScores[index]?.score || 0)
                        let rowAccent = "border-l-slate-200"
                        if (currentScore >= 4.5) rowAccent = "border-l-emerald-400"
                        else if (currentScore >= 3.5) rowAccent = "border-l-green-400"
                        else if (currentScore >= 2.5) rowAccent = "border-l-yellow-400"
                        else if (currentScore >= 1.5) rowAccent = "border-l-orange-400"
                        else if (currentScore > 0) rowAccent = "border-l-red-400"

                        return (
                          <tr key={field.id} className={`hover:bg-slate-50/70 transition-colors border-l-4 ${rowAccent}`}>
                            <td className="px-4 py-4 align-top">
                              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-4 py-4 align-top">
                              <div className="font-bold text-slate-800 text-sm">{field.category}</div>
                              {field.category === "Communication" && (
                                <ul className="mt-2 space-y-1">
                                  {["Communication", "Innovation", "Best Practice Sharing", "Upscaling"].map(item => (
                                    <li key={item} className="text-xs text-slate-400 flex items-center gap-1.5">
                                      <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                            <td className="px-4 py-4 align-top">
                              <FormField control={form.control} name={`kpiScores.${index}.employeeInput`} render={({ field }) => (
                                <FormControl>
                                  <Textarea
                                    className="w-full min-h-[90px] text-sm resize-y border-slate-200 bg-white focus-visible:ring-blue-500 placeholder:text-slate-300"
                                    placeholder="Employee remarks..."
                                    {...field}
                                  />
                                </FormControl>
                              )} />
                            </td>
                            <td className="px-4 py-4 align-top">
                              <FormField control={form.control} name={`kpiScores.${index}.teamLeadFeedback`} render={({ field }) => (
                                <FormControl>
                                  <Textarea
                                    className="w-full min-h-[90px] text-sm resize-y border-slate-200 bg-white focus-visible:ring-blue-500 placeholder:text-slate-300"
                                    placeholder="Team lead feedback..."
                                    {...field}
                                  />
                                </FormControl>
                              )} />
                            </td>
                            <td className="px-4 py-4 align-top">
                              <FormField control={form.control} name={`kpiScores.${index}.score`} render={({ field }) => (
                                <FormControl>
                                  <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value.toString()}>
                                    <SelectTrigger className="bg-white border-slate-200 focus:ring-blue-500">
                                      <SelectValue placeholder="—" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[["0", "—"], ["1", "1 – Poor"], ["2", "2 – Below Avg"], ["3", "3 – Average"], ["4", "4 – Good"], ["5", "5 – Excellent"]].map(([val, label]) => (
                                        <SelectItem key={val} value={val}>{label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                              )} />
                            </td>
                            <td className="px-4 py-4 align-top">
                              <FormField control={form.control} name={`kpiScores.${index}.improvementPlan`} render={({ field }) => (
                                <FormControl>
                                  <Textarea
                                    className="w-full min-h-[90px] text-sm resize-y border-slate-200 bg-white focus-visible:ring-blue-500 placeholder:text-slate-300"
                                    placeholder="Action steps..."
                                    {...field}
                                  />
                                </FormControl>
                              )} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Score Summary Footer */}
                <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-6 justify-end">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Score</span>
                    <span className="text-4xl font-black text-slate-800 mt-0.5">{avgScore.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col items-end border-l border-slate-200 pl-6">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Final Rating</span>
                    <span className={`px-5 py-2 rounded-full text-sm font-black tracking-wide uppercase ${ratingColor}`}>
                      {ratingBadge}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  )
}
