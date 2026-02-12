"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'

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

export default function AnalyticsPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const initialDateTo = toDateInputValue(new Date())
  const initialDateFrom = toDateInputValue(addDays(new Date(), -2))
  const [datePreset, setDatePreset] = useState<"7" | "30" | "all" | "2">("2")
  const [dateFrom, setDateFrom] = useState<string>(initialDateFrom)
  const [dateTo, setDateTo] = useState<string>(initialDateTo)

  const fetchStats = useCallback(async (filters?: { dateFrom?: string; dateTo?: string }) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom)
      if (filters?.dateTo) params.append("dateTo", filters.dateTo)
      const response = await fetch(`/api/stats?${params.toString()}`)
      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Failed to fetch analytics", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats({ dateFrom: initialDateFrom, dateTo: initialDateTo })
  }, [fetchStats])

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

  // Transform statusCounts for PieChart
  const statusData = stats
    ? Object.entries(stats.statusCounts)
        .map(([name, value]) => ({ name, value: Number(value) || 0 }))
        .filter((d) => d.value > 0)
    : []
  const statusTotal = statusData.reduce((sum, d) => sum + d.value, 0)

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
    fetchStats({ dateFrom: nextDateFrom, dateTo: nextDateTo })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-[1920px] mx-auto">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Deep dive into interview metrics and trends.</p>
          </div>

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
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="h-96 bg-card animate-pulse rounded-lg border border-border" />
             <div className="h-96 bg-card animate-pulse rounded-lg border border-border" />
             <div className="h-96 bg-card animate-pulse rounded-lg border border-border" />
             <div className="h-96 bg-card animate-pulse rounded-lg border border-border" />
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Timeline */}
            <Card className="bg-card border-border col-span-1 xl:col-span-2">
              <CardHeader>
                <CardTitle>Interview Trends</CardTitle>
                <CardDescription>Daily interview volume over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.timeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Breakdown of interview statuses</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="35%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={105}
                      innerRadius={45}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ maxHeight: 300, overflowY: "auto" }}
                      formatter={(value: any, entry: any) => {
                        const v = Number(entry?.payload?.value) || 0
                        const p = statusTotal > 0 ? Math.round((v / statusTotal) * 100) : 0
                        return `${value} ${p}%`
                      }}
                    />
                    <Tooltip
                      wrapperStyle={{ zIndex: 50 }}
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Experts */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Top Experts</CardTitle>
                <CardDescription>Experts with most interviews</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.expertStats.slice(0, 7)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                    <XAxis type="number" stroke="#888" fontSize={12} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={140}
                      stroke="#888"
                      fontSize={12}
                      tickFormatter={(value) => {
                        const s = String(value ?? "")
                        return s.length > 18 ? `${s.slice(0, 18)}…` : s
                      }}
                    />
                    <Tooltip
                      wrapperStyle={{ zIndex: 50 }}
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    />
                    <Bar dataKey="count" fill="#82ca9d" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

             {/* Top Clients */}
             <Card className="bg-card border-border col-span-1 xl:col-span-2">
              <CardHeader>
                <CardTitle>Top Clients</CardTitle>
                <CardDescription>Clients with highest interview volume</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.clientStats}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      wrapperStyle={{ zIndex: 50 }}
                      cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                      contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
                    />
                    <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
