"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardLayout from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Calendar, TrendingUp, CheckCircle2, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Expert {
  name: string
  count: number
  completed: number
  efficiency: number
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

export default function ExpertsPage() {
  const [experts, setExperts] = useState<Expert[]>([])
  const initialDateTo = toDateInputValue(new Date())
  const initialDateFrom = toDateInputValue(addDays(new Date(), -2))

  const [dateFrom, setDateFrom] = useState<string>(initialDateFrom)
  const [dateTo, setDateTo] = useState<string>(initialDateTo)
  const [excludeRounds, setExcludeRounds] = useState<string[]>([])
  const [uniqueRounds, setUniqueRounds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async (filters?: { dateFrom?: string; dateTo?: string; excludeRounds?: string[] }) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters?.dateFrom) params.append("dateFrom", filters.dateFrom)
      if (filters?.dateTo) params.append("dateTo", filters.dateTo)
      if (filters?.excludeRounds && filters.excludeRounds.length > 0) {
        params.append("excludeRounds", filters.excludeRounds.join(","))
      }
      const statsRes = await fetch(`/api/stats?${params.toString()}`)
      const statsData = await statsRes.json()
      setExperts(statsData.expertStats || [])
      setUniqueRounds(statsData.rounds || [])
    } catch (err) {
      console.error("Failed to fetch data", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData({ dateFrom: initialDateFrom, dateTo: initialDateTo, excludeRounds: [] })
  }, [fetchData])

  const handleApplyFilters = () => {
    fetchData({ dateFrom, dateTo, excludeRounds })
  }

  const handleRoundToggle = (round: string) => {
    if (excludeRounds.includes(round)) {
      setExcludeRounds(excludeRounds.filter((r) => r !== round))
    } else {
      setExcludeRounds([...excludeRounds, round])
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-[1920px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Experts</h1>
            <p className="text-muted-foreground">Top performing interview experts and their statistics.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
             <div className="flex items-center gap-2">
              <Input
                type="date"
                className="bg-background border-input w-full sm:w-auto"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="From Date"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                className="bg-background border-input w-full sm:w-auto"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="To Date"
              />
              <Button onClick={handleApplyFilters} size="icon" variant="outline" title="Apply Date Filter">
                <Filter className="h-4 w-4" />
              </Button>
             </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Exclude Rounds</label>
          <div className="flex flex-wrap gap-2">
            {uniqueRounds.map((round, index) => {
              const isExcluded = excludeRounds.includes(round)
              return (
                <Badge
                  key={round ? `round-${round}` : `round-empty-${index}`}
                  variant={isExcluded ? "destructive" : "outline"}
                  className={`cursor-pointer transition-all ${
                    isExcluded
                      ? "hover:bg-destructive/90"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                  onClick={() => handleRoundToggle(round)}
                >
                  {round || "Unknown"}
                  {isExcluded && <X className="ml-1 h-3 w-3" />}
                </Badge>
              )
            })}
            {uniqueRounds.length === 0 && (
              <span className="text-xs text-muted-foreground">No rounds found</span>
            )}
          </div>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            [...Array(8)].map((_, i) => (
              <Card key={i} className="bg-card border-border animate-pulse">
                <CardHeader className="h-24 bg-muted/50" />
                <CardContent className="h-32" />
              </Card>
            ))
          ) : experts.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No expert data available for the selected criteria.
            </div>
          ) : (
            experts.map((expert, index) => (
              <Card key={expert.name} className="bg-card border-border hover:border-primary/50 transition-colors group overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary to-primary/20" />
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Avatar className="h-12 w-12 border-2 border-border group-hover:border-primary transition-colors">
                    <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                      {expert.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <CardTitle className="text-lg truncate" title={expert.name}>
                      {expert.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 text-xs">
                      {index < 3 && <Trophy className="h-3 w-3 text-yellow-500" />}
                      Rank #{index + 1}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1 p-2 rounded-lg bg-secondary/50">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Total
                      </span>
                      <span className="text-xl font-bold text-foreground">{expert.count}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-2 rounded-lg bg-secondary/50">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Completed
                      </span>
                      <span className="text-xl font-bold text-foreground">{expert.completed}</span>
                    </div>
                    <div className="col-span-2 flex flex-col gap-1 p-2 rounded-lg bg-secondary/50">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Efficiency
                      </span>
                      <div className="flex items-center justify-between">
                        <span className={`text-xl font-bold ${expert.efficiency >= 80 ? 'text-green-500' : expert.efficiency >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                          {expert.efficiency}%
                        </span>
                        <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${expert.efficiency >= 80 ? 'bg-green-500' : expert.efficiency >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                            style={{ width: `${expert.efficiency}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
