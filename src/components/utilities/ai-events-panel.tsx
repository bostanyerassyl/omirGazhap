"use client"

import { useState } from "react"
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Zap,
  Droplets,
  Flame,
  Bus,
  Sparkles,
  ChevronRight,
  Clock,
  MapPin
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils/cn"

interface AIEvent {
  id: string
  title: string
  description: string
  type: "warning" | "prediction" | "opportunity" | "alert"
  affectedResources: ("electricity" | "water" | "gas" | "transport")[]
  impact: "high" | "medium" | "low"
  predictedChange: number
  date: string
  location: string
  aiConfidence: number
}

const mockEvents: AIEvent[] = [
  {
    id: "1",
    title: "Heatwave Expected Next Week",
    description: "AI analysis predicts a 35-40°C heatwave from March 25-29, leading to significant increases in electricity and water consumption.",
    type: "warning",
    affectedResources: ["electricity", "water"],
    impact: "high",
    predictedChange: 28,
    date: "2026-03-25",
    location: "City-wide",
    aiConfidence: 92,
  },
  {
    id: "2",
    title: "Public Holiday: Nauryz",
    description: "Residential consumption expected to rise while industrial usage drops. Transport patterns will shift towards recreational areas.",
    type: "prediction",
    affectedResources: ["electricity", "gas", "transport"],
    impact: "medium",
    predictedChange: 15,
    date: "2026-03-21",
    location: "City-wide",
    aiConfidence: 95,
  },
  {
    id: "3",
    title: "Industrial Maintenance Window",
    description: "Scheduled maintenance at Turksib Industrial Zone. Opportunity to perform grid upgrades with minimal impact.",
    type: "opportunity",
    affectedResources: ["electricity", "gas"],
    impact: "low",
    predictedChange: -12,
    date: "2026-03-28",
    location: "Turksib District",
    aiConfidence: 88,
  },
  {
    id: "4",
    title: "Water Main Aging Alert",
    description: "AI detected increased pressure fluctuations in Medeu District water mains. Preventive maintenance recommended.",
    type: "alert",
    affectedResources: ["water"],
    impact: "high",
    predictedChange: 8,
    date: "2026-03-20",
    location: "Medeu District",
    aiConfidence: 78,
  },
  {
    id: "5",
    title: "New Metro Line Opening",
    description: "Line 3 opening expected to shift transport patterns. Bus routes may need reoptimization to avoid redundancy.",
    type: "prediction",
    affectedResources: ["transport", "electricity"],
    impact: "medium",
    predictedChange: -18,
    date: "2026-04-01",
    location: "Bostandyk District",
    aiConfidence: 85,
  },
  {
    id: "6",
    title: "Seasonal Heating Transition",
    description: "Based on weather patterns, heating demand expected to decrease by 40% over next 3 weeks. Optimize gas distribution.",
    type: "opportunity",
    affectedResources: ["gas"],
    impact: "medium",
    predictedChange: -40,
    date: "2026-03-30",
    location: "City-wide",
    aiConfidence: 91,
  },
]

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
  prediction: { bg: "bg-accent/10", border: "border-accent/30", icon: Sparkles, color: "text-accent" },
  opportunity: { bg: "bg-green-500/10", border: "border-green-500/30", icon: TrendingDown, color: "text-green-400" },
  alert: { bg: "bg-red-500/10", border: "border-red-500/30", icon: AlertTriangle, color: "text-red-400" },
}

const impactColors = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  low: "bg-green-500/20 text-green-400",
}

export function AIEventsPanel() {
  const [selectedEvent, setSelectedEvent] = useState<AIEvent | null>(null)
  const [filter, setFilter] = useState<"all" | "warning" | "prediction" | "opportunity" | "alert">("all")

  const filteredEvents = filter === "all" 
    ? mockEvents 
    : mockEvents.filter(e => e.type === filter)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Events List */}
      <div className="lg:col-span-2 space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "warning", "prediction", "opportunity", "alert"] as const).map((type) => (
            <Button
              key={type}
              variant={filter === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(type)}
              className={cn(
                filter === type ? "bg-accent text-accent-foreground" : "bg-card"
              )}
            >
              {type === "all" ? "All Events" : type.charAt(0).toUpperCase() + type.slice(1)}
            </Button>
          ))}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((event) => {
            const style = typeStyles[event.type]
            const TypeIcon = style.icon

            return (
              <Card 
                key={event.id}
                className={cn(
                  "bg-card border cursor-pointer transition-all hover:scale-[1.02]",
                  selectedEvent?.id === event.id ? style.border : "border-border",
                  selectedEvent?.id === event.id && style.bg
                )}
                onClick={() => setSelectedEvent(event)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn("p-2 rounded-lg", style.bg)}>
                      <TypeIcon className={cn("w-4 h-4", style.color)} />
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      impactColors[event.impact]
                    )}>
                      {event.impact} impact
                    </span>
                  </div>

                  <h3 className="font-semibold text-foreground mb-2 line-clamp-1">
                    {event.title}
                  </h3>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {event.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {event.affectedResources.map((resource) => {
                        const Icon = resourceIcons[resource]
                        return (
                          <div key={resource} className="p-1 rounded bg-secondary">
                            <Icon className={cn("w-3 h-3", resourceColors[resource])} />
                          </div>
                        )
                      })}
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-sm font-medium",
                      event.predictedChange > 0 ? "text-red-400" : "text-green-400"
                    )}>
                      {event.predictedChange > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {event.predictedChange > 0 ? "+" : ""}{event.predictedChange}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Event Details */}
      <div className="lg:col-span-1">
        <Card className="bg-card border-border sticky top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedEvent ? (
              <div className="space-y-4">
                {/* Event Header */}
                <div>
                  <div className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium mb-2",
                    typeStyles[selectedEvent.type].bg,
                    typeStyles[selectedEvent.type].color
                  )}>
                    {(() => {
                      const Icon = typeStyles[selectedEvent.type].icon
                      return <Icon className="w-3 h-3" />
                    })()}
                    {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {selectedEvent.title}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground">
                  {selectedEvent.description}
                </p>

                {/* Meta Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="text-foreground">{selectedEvent.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Location:</span>
                    <span className="text-foreground">{selectedEvent.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Impact:</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      impactColors[selectedEvent.impact]
                    )}>
                      {selectedEvent.impact.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Affected Resources */}
                <div>
                  <span className="text-sm text-muted-foreground mb-2 block">
                    Affected Resources:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.affectedResources.map((resource) => {
                      const Icon = resourceIcons[resource]
                      return (
                        <div 
                          key={resource}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary"
                        >
                          <Icon className={cn("w-3 h-3", resourceColors[resource])} />
                          <span className="text-xs text-foreground capitalize">{resource}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* AI Confidence */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">AI Confidence</span>
                    <span className="text-sm font-medium text-accent">
                      {selectedEvent.aiConfidence}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${selectedEvent.aiConfidence}%` }}
                    />
                  </div>
                </div>

                {/* Predicted Impact */}
                <div className="p-3 rounded-lg bg-secondary">
                  <span className="text-sm text-muted-foreground block mb-1">
                    Predicted Consumption Change
                  </span>
                  <div className={cn(
                    "text-2xl font-bold flex items-center gap-2",
                    selectedEvent.predictedChange > 0 ? "text-red-400" : "text-green-400"
                  )}>
                    {selectedEvent.predictedChange > 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    {selectedEvent.predictedChange > 0 ? "+" : ""}{selectedEvent.predictedChange}%
                  </div>
                </div>

                {/* Actions */}
                <Button className="w-full gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                  View Detailed Report
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Select an event to view AI analysis and predictions
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

