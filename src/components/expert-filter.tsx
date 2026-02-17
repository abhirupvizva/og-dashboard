"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface ExpertFilterProps {
  experts: string[]
  selectedExperts: string[]
  onExpertChange: (experts: string[]) => void
  loading?: boolean
  compact?: boolean
  className?: string
}

export default function ExpertFilter({ experts, selectedExperts, onExpertChange, loading, compact, className }: ExpertFilterProps) {
  const [open, setOpen] = useState(false)

  const handleExpertToggle = (expert: string) => {
    if (selectedExperts.includes(expert)) {
      onExpertChange(selectedExperts.filter(e => e !== expert))
    } else {
      onExpertChange([...selectedExperts, expert])
    }
  }

  const clearAllExperts = () => {
    onExpertChange([])
  }

  const selectAllExperts = () => {
    onExpertChange(experts)
  }

  return (
    <div className={cn(compact ? "" : "space-y-2", className)}>
      {!compact && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Experts</label>
          {selectedExperts.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
              onClick={clearAllExperts}
            >
              Clear all
            </Button>
          )}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between bg-background border-input", compact ? "w-full" : "w-full")}
            disabled={loading}
          >
            <span className="truncate">
              {selectedExperts.length === 0
                ? "Select experts..."
                : selectedExperts.length === 1
                ? selectedExperts[0]
                : `${selectedExperts.length} experts selected`}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search experts..." />
            <CommandList>
              <CommandEmpty>No experts found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={selectAllExperts}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedExperts.length === experts.length ? "opacity-100" : "opacity-0"
                    )}
                  />
                  Select All
                </CommandItem>
                {experts.map((expert) => (
                  <CommandItem
                    key={expert}
                    onSelect={() => handleExpertToggle(expert)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedExperts.includes(expert) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {expert}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {!compact && selectedExperts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedExperts.slice(0, 3).map((expert) => (
            <Badge key={expert} variant="secondary" className="text-xs">
              {expert}
            </Badge>
          ))}
          {selectedExperts.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{selectedExperts.length - 3} more
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
