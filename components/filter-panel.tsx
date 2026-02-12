"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { memo } from "react"

import ExpertFilter from "@/src/components/expert-filter"

interface FilterPanelProps {
  dateFrom: string
  setDateFrom: (date: string) => void
  dateTo: string
  setDateTo: (date: string) => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedExperts: string[]
  setSelectedExperts: (experts: string[]) => void
  excludeRounds: string[]
  setExcludeRounds: (rounds: string[]) => void
  status: string
  setStatus: (status: string) => void
  selectedClient: string
  setSelectedClient: (client: string) => void
  uniqueClients: string[]
  uniqueExperts: string[]
  uniqueRounds: string[]
  applyFilters: () => void
  loading?: boolean
}

export default memo(function FilterPanel({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  searchTerm,
  setSearchTerm,
  selectedExperts,
  setSelectedExperts,
  excludeRounds,
  setExcludeRounds,
  status,
  setStatus,
  selectedClient,
  setSelectedClient,
  uniqueClients,
  uniqueExperts,
  uniqueRounds,
  applyFilters,
  loading,
}: FilterPanelProps) {
  const handleRoundToggle = (round: string) => {
    if (excludeRounds.includes(round)) {
      setExcludeRounds(excludeRounds.filter((r) => r !== round))
    } else {
      setExcludeRounds([...excludeRounds, round])
    }
  }

  const resetFilters = () => {
    setDateFrom("")
    setDateTo("")
    setSearchTerm("")
    setExcludeRounds([])
    setStatus("all")
    setSelectedClient("All")
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Search</label>
          <Input
            placeholder="Search candidate, client..."
            className="bg-background border-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Date From</label>
          <Input
            type="date"
            className="bg-background border-input"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Date To</label>
          <Input
            type="date"
            className="bg-background border-input"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {/* Expert Multi-Select Filter */}
        <div className="space-y-2">
          <ExpertFilter
            experts={uniqueExperts}
            selectedExperts={selectedExperts}
            onExpertChange={setSelectedExperts}
            loading={loading}
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-background border-input">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Client Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Client</label>
          <Select value={selectedClient} onValueChange={setSelectedClient} disabled={loading}>
            <SelectTrigger className="bg-background border-input">
              <SelectValue placeholder={loading ? "Loading..." : "All Clients"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Clients</SelectItem>
              {uniqueClients.map((client) => (
                <SelectItem key={client} value={client}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={applyFilters} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Apply Filters
        </Button>
        <Button
          variant="ghost"
          onClick={resetFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          Reset All
        </Button>
      </div>
    </div>
  )
})
