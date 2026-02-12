"use client"

import { useState } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { ALL_COLUMNS } from "@/components/interview-table"

export default function ReportsPage() {
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [status, setStatus] = useState("all")

  const generateReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append("limit", "1000") // Fetch a large batch for report
      if (dateFrom) params.append("dateFrom", dateFrom)
      if (dateTo) params.append("dateTo", dateTo)
      if (status !== "all") params.append("status", status)

      const response = await fetch(`/api/interviews?${params.toString()}`)
      const data = await response.json()

      if (!data.interviews || data.interviews.length === 0) {
        alert("No data found for the selected criteria.")
        return
      }

      // Convert to CSV
      const headers = Object.values(ALL_COLUMNS)
      const csvContent = [
        headers.join(","),
        ...data.interviews.map((i: any) =>
          [
            i["Candidate Name"],
            i["End Client"],
            i["Interview Round"],
            i["Date of Interview"],
            i["Start Time Of Interview"],
            i["End Time Of Interview"],
            i.actualRound,
            i.assignedTo || "",
            i.status || "",
            i.feedback || "",
          ].map((field: string) => `"${String(field).replace(/"/g, '""')}"`).join(","), // Escape quotes
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `report-${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error("Report generation failed", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-[1920px] mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="text-muted-foreground">Generate and download detailed interview reports.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-500" />
                Interview Export
              </CardTitle>
              <CardDescription>Export interview data to CSV format.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="bg-background"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={generateReport} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-card border-border opacity-60 cursor-not-allowed">
            <CardHeader>
              <CardTitle>Performance Report (Coming Soon)</CardTitle>
              <CardDescription>Detailed expert performance metrics PDF.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="h-32 flex items-center justify-center bg-muted/20 rounded-md border border-dashed border-border">
                 <p className="text-muted-foreground">PDF Generation Module</p>
               </div>
            </CardContent>
            <CardFooter>
              <Button disabled variant="outline" className="w-full">Download PDF</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
