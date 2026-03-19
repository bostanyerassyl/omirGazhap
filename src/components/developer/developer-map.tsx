import { InteractiveMapView } from "@/components/map/interactive-map-view"
import { Building2, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import type { ConstructionObject } from "@/types/dashboard"

interface DeveloperMapProps {
  objects: ConstructionObject[]
  selectedObject?: ConstructionObject
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

export function DeveloperMap({ objects, selectedObject }: DeveloperMapProps) {
  return (
    <div className="absolute inset-0 bg-background">
      <InteractiveMapView toolbarTop={132} />

      <div className="absolute bottom-24 right-4 z-20 rounded-xl border border-slate-400/30 bg-slate-950/80 p-3 text-slate-100 shadow-xl shadow-black/35 backdrop-blur-md">
        <h4 className="mb-2 text-xs font-semibold text-slate-100">Status Legend</h4>
        <div className="space-y-1.5">
          {Object.entries(statusColors).map(([status, color]) => {
            const Icon = statusIcons[status as keyof typeof statusIcons]
            return (
              <div key={status} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                <Icon className="h-3 w-3" style={{ color }} />
                <span className="text-xs capitalize text-slate-200/90">{status.replace("-", " ")}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="absolute right-4 top-20 z-20 rounded-xl border border-slate-400/30 bg-slate-950/80 p-4 text-slate-100 shadow-xl shadow-black/35 backdrop-blur-md">
        <h4 className="mb-3 text-sm font-semibold text-slate-100">Project Overview</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-300">Total Objects</span>
            <span className="text-sm font-semibold text-slate-50">{objects.length}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-300">In Progress</span>
            <span className="text-sm font-medium text-amber-400">
              {objects.filter((object) => object.status === "in-progress").length}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-300">Completed</span>
            <span className="text-sm font-medium text-emerald-400">
              {objects.filter((object) => object.status === "completed").length}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-300">Delayed</span>
            <span className="text-sm font-medium text-red-400">
              {objects.filter((object) => object.status === "delayed").length}
            </span>
          </div>
        </div>
      </div>

      {selectedObject && (
        <div className="absolute bottom-4 left-4 z-20 max-w-sm rounded-xl border border-slate-400/30 bg-slate-950/85 p-4 text-slate-100 shadow-xl shadow-black/35 backdrop-blur-md">
          <div className="mb-2 flex items-center gap-2">
            <div className="rounded p-2" style={{ backgroundColor: `${statusColors[selectedObject.status]}33` }}>
              <Building2 className="h-4 w-4" style={{ color: statusColors[selectedObject.status] }} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-100">{selectedObject.name}</h4>
              <p className="text-xs text-slate-300">{selectedObject.address}</p>
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
          <p className="mt-2 text-xs text-slate-300">Progress: {selectedObject.progress}%</p>
        </div>
      )}
    </div>
  )
}
