"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FilterPanelProps {
  dateFrom: string
  setDateFrom: (date: string) => void
  dateTo: string
  setDateTo: (date: string) => void
  assignedTo: string
  setAssignedTo: (value: string) => void
  excludeRounds: string[]
  setExcludeRounds: (rounds: string[]) => void
  status: string
  setStatus: (status: string) => void
  selectedClient: string
  setSelectedClient: (client: string) => void
  uniqueClients: string[]
  uniqueRounds: string[]
  applyFilters: () => void
}

export default function FilterPanel({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  assignedTo,
  setAssignedTo,
  excludeRounds,
  setExcludeRounds,
  status,
  setStatus,
  selectedClient,
  setSelectedClient,
  uniqueClients,
  uniqueRounds,
  applyFilters,
}: FilterPanelProps) {
  const handleRoundToggle = (round: string) => {
    if (excludeRounds.includes(round)) {
      setExcludeRounds(excludeRounds.filter((r) => r !== round))
    } else {
      setExcludeRounds([...excludeRounds, round])
    }
  }

  return (
    <div className="space-y-4">
      {/* Date Range Filter */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Date From (MM/DD/YYYY)</label>
          <Input
            type="date"
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 w-40"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Date To (MM/DD/YYYY)</label>
          <Input
            type="date"
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 w-40"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {/* Assigned To Filter */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Assigned To (regex)</label>
          <Input
            type="text"
            placeholder="e.g., aman.agn"
            className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 w-40"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Status</label>
          <select
            className="bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-md w-40"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* Client Filter */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">Client</label>
          <select
            className="bg-slate-700 border border-slate-600 text-white px-3 py-2 rounded-md w-40"
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="All">All Clients</option>
            {uniqueClients.map((client) => (
              <option key={client} value={client}>
                {client}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Exclude Rounds Filter */}
      <div>
        <label className="text-xs text-slate-400 block mb-2">Exclude Rounds</label>
        <div className="flex flex-wrap gap-2">
          {uniqueRounds.map((round, index) => (
            <button
              key={round ? `round-${round}` : `round-empty-${index}`}
              onClick={() => handleRoundToggle(round)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                excludeRounds.includes(round)
                  ? "bg-red-600 text-white"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              {round || ""}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Button */}
      <Button
        className="bg-blue-600 hover:bg-blue-700 text-white"
        onClick={applyFilters}
      >
        Apply Filters
      </Button>

      {/* Reset Button */}
      <Button
        variant="outline"
        className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
        onClick={() => {
          setDateFrom("")
          setDateTo("")
          setAssignedTo("")
          setExcludeRounds([])
          setStatus("")
          setSelectedClient("All")
        }}
      >
        Reset All Filters
      </Button>
    </div>
  )
}
