import { useMemo, useState } from "react"
import {
  AlertTriangle,
  BadgeAlert,
  Bus,
  Calendar,
  ChevronRight,
  Clock,
  Droplets,
  Flame,
  MapPin,
  TrendingDown,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { UtilitiesOperationalEvent, UtilitiesResourceKey } from "@/types/dashboard"
import { cn } from "@/utils/cn"

interface OperationalEventsPanelProps {
  events: UtilitiesOperationalEvent[]
  activeResource?: UtilitiesResourceKey | null
}

const resourceIcons = {
  electricity: Zap,
  water: Droplets,
  gas: Flame,
  transport: Bus,
}

const resourceColors = {
  electricity: "text-yellow-400",
  water: "text-blue-400",
  gas: "text-orange-400",
  transport: "text-green-400",
}

const typeStyles = {
  warning: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: AlertTriangle, color: "text-yellow-400" },
  prediction: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: TrendingUp, color: "text-blue-400" },
  opportunity: { bg: "bg-green-500/10", border: "border-green-500/30", icon: Wrench, color: "text-green-400" },
  alert: { bg: "bg-red-500/10", border: "border-red-500/30", icon: BadgeAlert, color: "text-red-400" },
}

const impactColors = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-green-500/20 text-green-400",
}

const statusColors: Record<UtilitiesOperationalEvent["status"], string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  "in-progress": "bg-blue-500/20 text-blue-400",
  resolved: "bg-emerald-500/20 text-emerald-400",
}

export function OperationalEventsPanel({
  events,
  activeResource = null,
}: OperationalEventsPanelProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(events[0]?.id ?? null)
  const [filter, setFilter] = useState<"all" | "warning" | "prediction" | "opportunity" | "alert">("all")

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (activeResource && event.resource !== activeResource) {
          return false
        }

        if (filter !== "all" && event.type !== filter) {
          return false
        }

        return true
      }),
    [activeResource, events, filter],
  )

  const selectedEvent =
    filteredEvents.find((event) => event.id === selectedEventId) ??
    filteredEvents[0] ??
    null

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "warning", "prediction", "opportunity", "alert"] as const).map((type) => (
            <Button
              key={type}
              variant={filter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(type)}
              className={cn(filter === type ? "bg-accent text-accent-foreground" : "bg-card")}
            >
              {type === "all" ? "All Events" : type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredEvents.map((event) => {
            const style = typeStyles[event.type]
            const TypeIcon = style.icon
            const ResourceIcon = resourceIcons[event.resource]

            return (
              <Card
                key={event.id}
                className={cn(
                  "cursor-pointer border bg-card transition-all hover:scale-[1.02]",
                  selectedEvent?.id === event.id ? style.border : "border-border",
                  selectedEvent?.id === event.id && style.bg,
                )}
                onClick={() => setSelectedEventId(event.id)}
              >
                <CardContent className="p-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className={cn("rounded-lg p-2", style.bg)}>
                      <TypeIcon className={cn("h-4 w-4", style.color)} />
                    </div>
                    <span className={cn("rounded-full px-2 py-1 text-xs font-medium", impactColors[event.impact])}>
                      {event.impact} impact
                    </span>
                  </div>

                  <h3 className="mb-2 line-clamp-1 font-semibold text-foreground">{event.title}</h3>
                  <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 rounded bg-secondary px-2 py-1">
                        <ResourceIcon className={cn("h-3 w-3", resourceColors[event.resource])} />
                        <span className="text-xs capitalize text-foreground">{event.resource}</span>
                      </div>
                      <Badge className={statusColors[event.status]}>{event.status}</Badge>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1 text-sm font-medium",
                        event.predictedChange > 0 ? "text-red-400" : "text-green-400",
                      )}
                    >
                      {event.predictedChange > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {event.predictedChange > 0 ? "+" : ""}
                      {event.predictedChange}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="lg:col-span-1">
        <Card className="sticky top-4 border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-accent" />
              Event Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <div className="space-y-4">
                <div>
                  <div
                    className={cn(
                      "mb-2 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium",
                      typeStyles[selectedEvent.type].bg,
                      typeStyles[selectedEvent.type].color,
                    )}
                  >
                    {(() => {
                      const Icon = typeStyles[selectedEvent.type].icon
                      return <Icon className="h-3 w-3" />
                    })()}
                    {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{selectedEvent.title}</h3>
                </div>

                <p className="text-sm text-muted-foreground">{selectedEvent.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-foreground">{selectedEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="text-foreground">{selectedEvent.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Status:</span>
                    <span className={cn("rounded px-2 py-0.5 text-xs font-medium", statusColors[selectedEvent.status])}>
                      {selectedEvent.status}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="mb-2 block text-sm text-muted-foreground">Resource:</span>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const Icon = resourceIcons[selectedEvent.resource]
                      return (
                        <div className="flex items-center gap-1.5 rounded-md bg-secondary px-2 py-1">
                          <Icon className={cn("h-3 w-3", resourceColors[selectedEvent.resource])} />
                          <span className="text-xs capitalize text-foreground">{selectedEvent.resource}</span>
                        </div>
                      )
                    })()}
                  </div>
                </div>

                <div className="rounded-lg bg-secondary p-3">
                  <span className="mb-1 block text-sm text-muted-foreground">Projected Consumption Change</span>
                  <div
                    className={cn(
                      "flex items-center gap-2 text-2xl font-bold",
                      selectedEvent.predictedChange > 0 ? "text-red-400" : "text-green-400",
                    )}
                  >
                    {selectedEvent.predictedChange > 0 ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                    {selectedEvent.predictedChange > 0 ? "+" : ""}
                    {selectedEvent.predictedChange}%
                  </div>
                </div>

                <Button className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                  Review Operational Report
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <AlertTriangle className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">No utility events available yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
