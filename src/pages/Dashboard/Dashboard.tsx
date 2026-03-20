import { useState } from "react"
import { CityMap } from "@/components/dashboard/city-map"
import type { FilterState } from "@/components/dashboard/city-map"
import { ProfileSheet } from "@/components/dashboard/profile-sheet"
import { MessagesPanel } from "@/components/dashboard/messages-panel"
import { AddContentDialog } from "@/components/dashboard/add-content-dialog"
import { RouteSearch } from "@/components/dashboard/route-search"
import { MapFilters } from "@/components/dashboard/map-filters"
import { Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusMessage } from "@/components/ui/status-message"
import { useDashboardData } from "@/features/dashboard/model/useDashboardData"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

// Events Sheet Component
function EventsSheet({ events }: { events: Array<{ id: string; title: string; date: string; time: string; location: string }> }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="hover:bg-secondary"
          aria-label="City events"
        >
          <Calendar className="size-5 text-foreground" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="text-foreground">City Events</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            Upcoming events in Alatau
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-3">
          {events.map((event) => (
            <div 
              key={event.id}
              className="p-4 bg-secondary/30 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
            >
              <h4 className="font-medium text-foreground">{event.title}</h4>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <p>{event.date} at {event.time}</p>
                <p>{event.location}</p>
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function DashboardPage() {
  const {
    data,
    error,
    reloadData,
    submitDashboardAppeal,
    addDashboardPlace,
  } = useDashboardData("dashboard")
  const [filters, setFilters] = useState<FilterState>({
    ramps: true,
    scooters: true,
    friends: true,
    events: true,
    buses: true,
    points: true,
    fire: true,
    water: true,
    electricity: true,
  })

  return (
    <div className="relative h-screen w-full bg-background overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-background via-background/80 to-transparent">
        {/* Left - Profile */}
        <ProfileSheet />

        {/* Center - Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <div className="size-8 rounded-lg bg-accent flex items-center justify-center">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className="size-5 text-accent-foreground"
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="hidden sm:inline font-semibold text-foreground tracking-tight">Alatau</span>
        </div>

        {/* Right - Action buttons */}
        <div className="flex items-center gap-1">
          <MessagesPanel
            appeals={data?.appeals ?? []}
            events={data?.events ?? []}
            news={data?.news ?? []}
            situations={data?.situations ?? []}
            onSubmitAppeal={async (payload) => {
              const result = await submitDashboardAppeal(payload)

              if (result.error) {
                throw result.error
              }
            }}
          />
          <EventsSheet events={data?.events ?? []} />
          <AddContentDialog
            locationOptions={data?.locationOptions ?? []}
            onAddPlace={async (payload) => {
              const result = await addDashboardPlace(payload)

              if (result.error) {
                throw result.error
              }
            }}
          />
        </div>
      </header>

      {/* Map filters */}
      <MapFilters filters={filters} onFilterChange={setFilters} />

      {/* Main map */}
      <CityMap filters={filters} />

      {error ? (
        <div className="absolute left-4 right-4 top-20 z-30 md:left-auto md:right-4 md:w-[420px]">
          <StatusMessage tone="error" className="flex items-center justify-between gap-3">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void reloadData()}>
              Retry
            </Button>
          </StatusMessage>
        </div>
      ) : null}

      {/* Bottom search bar */}
      <RouteSearch
        suggestions={[
          ...(data?.locationOptions.map((location) => location.name) ?? []),
          ...(data?.mapMarkers.map((marker) => marker.label) ?? []),
        ]}
      />
    </div>
  )
}
