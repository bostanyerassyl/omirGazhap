import { useMemo } from "react"
import { Building2, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import type { ConstructionObject } from "@/types/dashboard"
import { MapboxMap } from "@/map/react/mapbox-map"

interface DeveloperMapProps {
  objects: ConstructionObject[]
  selectedObject?: ConstructionObject
  onSelectObject: (obj: ConstructionObject) => void
}

const statusColors: Record<ConstructionObject["status"], string> = {
  planning: "#3b82f6",
  "in-progress": "#f59e0b",
  completed: "#10b981",
  delayed: "#ef4444",
}

const statusIcons = {
  planning: Clock,
  "in-progress": Clock,
  completed: CheckCircle2,
  delayed: AlertCircle,
}

const statusEmoji: Record<ConstructionObject["status"], string> = {
  planning: "📐",
  "in-progress": "🚧",
  completed: "✅",
  delayed: "⏳",
}

export function DeveloperMap({ objects, selectedObject, onSelectObject }: DeveloperMapProps) {
  const center: [number, number] = selectedObject
    ? [selectedObject.coordinates.lng, selectedObject.coordinates.lat]
    : [76.95, 43.24]

  const markers = useMemo(
    () =>
      objects.map((obj) => ({
        id: obj.id,
        lng: obj.coordinates.lng,
        lat: obj.coordinates.lat,
        color: statusColors[obj.status],
        iconHtml: statusEmoji[obj.status],
        title: obj.name,
        pulse: selectedObject?.id === obj.id,
        onClick: () => onSelectObject(obj),
      })),
    [objects, onSelectObject, selectedObject?.id],
  )

  return (
    <div className="absolute inset-0 bg-background">
      <MapboxMap className="absolute inset-0" center={center} zoom={13} markers={markers} />

      <div className="absolute bottom-24 right-4 z-10 rounded-lg border border-border bg-card/90 p-3 backdrop-blur-sm">
        <h4 className="mb-2 text-xs font-medium text-foreground">Status Legend</h4>
        <div className="space-y-1.5">
          {Object.entries(statusColors).map(([status, color]) => {
            const Icon = statusIcons[status as keyof typeof statusIcons]
            return (
              <div key={status} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                <Icon className="h-3 w-3" style={{ color }} />
                <span className="text-xs capitalize text-muted-foreground">{status.replace("-", " ")}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="absolute right-4 top-20 z-10 rounded-lg border border-border bg-card/90 p-4 backdrop-blur-sm">
        <h4 className="mb-3 text-sm font-medium text-foreground">Project Overview</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Total Objects</span>
            <span className="text-sm font-medium text-foreground">{objects.length}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">In Progress</span>
            <span className="text-sm font-medium text-amber-400">
              {objects.filter((object) => object.status === "in-progress").length}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Completed</span>
            <span className="text-sm font-medium text-emerald-400">
              {objects.filter((object) => object.status === "completed").length}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Delayed</span>
            <span className="text-sm font-medium text-red-400">
              {objects.filter((object) => object.status === "delayed").length}
            </span>
          </div>
        </div>
      </div>

      {selectedObject && (
        <div className="absolute bottom-4 left-4 z-10 max-w-sm rounded-lg border border-border bg-card/95 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded p-2" style={{ backgroundColor: `${statusColors[selectedObject.status]}33` }}>
              <Building2 className="h-4 w-4" style={{ color: statusColors[selectedObject.status] }} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">{selectedObject.name}</h4>
              <p className="text-xs text-muted-foreground">{selectedObject.address}</p>
            </div>
          </div>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full"
              style={{
                width: `${selectedObject.progress}%`,
                backgroundColor: statusColors[selectedObject.status],
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Progress: {selectedObject.progress}%</p>
        </div>
      )}
    </div>
  )
}
