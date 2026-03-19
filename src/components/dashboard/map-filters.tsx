"use client"

import { Accessibility, Bike, Users, Calendar, Bus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/cn"

interface FilterState {
  ramps: boolean
  scooters: boolean
  friends: boolean
  events: boolean
  buses: boolean
}

interface MapFiltersProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
}

const filterOptions: { key: keyof FilterState; icon: React.ReactNode; label: string; color: string }[] = [
  { key: "ramps", icon: <Accessibility className="size-4" />, label: "Ramps", color: "bg-blue-500" },
  { key: "scooters", icon: <Bike className="size-4" />, label: "Scooters", color: "bg-green-500" },
  { key: "friends", icon: <Users className="size-4" />, label: "Friends", color: "bg-pink-500" },
  { key: "events", icon: <Calendar className="size-4" />, label: "Events", color: "bg-amber-500" },
  { key: "buses", icon: <Bus className="size-4" />, label: "Buses", color: "bg-cyan-500" },
]

export function MapFilters({ filters, onFilterChange }: MapFiltersProps) {
  const toggleFilter = (key: keyof FilterState) => {
    onFilterChange({ ...filters, [key]: !filters[key] })
  }

  return (
    <div className="absolute top-20 right-4 z-20 flex flex-col gap-2">
      {filterOptions.map(({ key, icon, label, color }) => (
        <Button
          key={key}
          variant="ghost"
          size="sm"
          onClick={() => toggleFilter(key)}
          className={cn(
            "justify-start gap-2 bg-card/90 backdrop-blur-sm border border-border hover:bg-card shadow-md",
            filters[key] ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <div className={cn(
            "size-3 rounded-full transition-opacity",
            color,
            filters[key] ? "opacity-100" : "opacity-30"
          )} />
          <span className="hidden md:inline text-xs">{label}</span>
          {icon}
        </Button>
      ))}
    </div>
  )
}

