import { useState } from "react"
import { Building2, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import type { ConstructionObject } from "@/types/dashboard"

interface DeveloperMapProps {
  objects: ConstructionObject[]
  selectedObject?: ConstructionObject
  onSelectObject: (obj: ConstructionObject) => void
}

const statusColors = {
  "planning": "#3b82f6",
  "in-progress": "#f59e0b",
  "completed": "#10b981",
  "delayed": "#ef4444",
}

const statusIcons = {
  "planning": Clock,
  "in-progress": Clock,
  "completed": CheckCircle2,
  "delayed": AlertCircle,
}

export function DeveloperMap({ objects, selectedObject, onSelectObject }: DeveloperMapProps) {
  const [hoveredObject, setHoveredObject] = useState<string | null>(null)

  // Calculate positions for objects on the map
  const getObjectPosition = (obj: ConstructionObject) => {
    // Normalize coordinates to percentages (simplified for demo)
    const baseLatMin = 43.225
    const baseLatMax = 43.255
    const baseLngMin = 76.930
    const baseLngMax = 76.970
    
    const x = ((obj.coordinates.lng - baseLngMin) / (baseLngMax - baseLngMin)) * 100
    const y = ((baseLatMax - obj.coordinates.lat) / (baseLatMax - baseLatMin)) * 100
    
    return { x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) }
  }

  return (
    <div className="absolute inset-0 bg-background">
      {/* Map Background with Grid */}
      <div className="absolute inset-0">
        {/* Dark map styling */}
        <div className="absolute inset-0 bg-[#0f1419]" />
        
        {/* Grid overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="devGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-accent/30" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#devGrid)" />
        </svg>

        {/* Simulated roads */}
        <svg className="absolute inset-0 w-full h-full">
          {/* Main horizontal roads */}
          <line x1="0" y1="30%" x2="100%" y2="30%" stroke="#2a3441" strokeWidth="8" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#2a3441" strokeWidth="12" />
          <line x1="0" y1="70%" x2="100%" y2="70%" stroke="#2a3441" strokeWidth="8" />
          
          {/* Main vertical roads */}
          <line x1="25%" y1="0" x2="25%" y2="100%" stroke="#2a3441" strokeWidth="8" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#2a3441" strokeWidth="12" />
          <line x1="75%" y1="0" x2="75%" y2="100%" stroke="#2a3441" strokeWidth="8" />

          {/* Road center lines */}
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#3d4a5c" strokeWidth="1" strokeDasharray="20,10" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#3d4a5c" strokeWidth="1" strokeDasharray="20,10" />
        </svg>

        {/* City blocks / areas */}
        <div className="absolute top-[10%] left-[10%] w-[12%] h-[15%] bg-secondary/30 rounded-sm border border-border/30" />
        <div className="absolute top-[10%] left-[30%] w-[15%] h-[15%] bg-secondary/20 rounded-sm border border-border/30" />
        <div className="absolute top-[55%] left-[55%] w-[18%] h-[12%] bg-secondary/30 rounded-sm border border-border/30" />
        <div className="absolute top-[75%] left-[10%] w-[12%] h-[18%] bg-secondary/20 rounded-sm border border-border/30" />
        <div className="absolute top-[35%] left-[78%] w-[15%] h-[12%] bg-secondary/30 rounded-sm border border-border/30" />
      </div>

      {/* Object Markers */}
      {objects.map((obj) => {
        const position = getObjectPosition(obj)
        const isSelected = selectedObject?.id === obj.id
        const isHovered = hoveredObject === obj.id
        const color = statusColors[obj.status]
        const StatusIcon = statusIcons[obj.status]

        return (
          <div
            key={obj.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
            onMouseEnter={() => setHoveredObject(obj.id)}
            onMouseLeave={() => setHoveredObject(null)}
            onClick={() => onSelectObject(obj)}
          >
            {/* Pulse animation for selected */}
            {isSelected && (
              <div 
                className="absolute inset-0 rounded-full animate-ping"
                style={{ 
                  backgroundColor: color,
                  opacity: 0.3,
                  width: "48px",
                  height: "48px",
                  transform: "translate(-50%, -50%)",
                  left: "50%",
                  top: "50%"
                }}
              />
            )}

            {/* Marker */}
            <div
              className={`relative flex items-center justify-center transition-transform duration-200 ${
                isSelected || isHovered ? "scale-125" : "scale-100"
              }`}
            >
              <div 
                className="h-10 w-10 rounded-lg flex items-center justify-center shadow-lg border-2"
                style={{ 
                  backgroundColor: `${color}20`,
                  borderColor: color,
                }}
              >
                <Building2 className="h-5 w-5" style={{ color }} />
              </div>
              
              {/* Status indicator */}
              <div 
                className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: color }}
              >
                <StatusIcon className="h-2.5 w-2.5 text-white" />
              </div>
            </div>

            {/* Tooltip */}
            {(isHovered || isSelected) && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-3 bg-card border border-border rounded-lg shadow-xl z-20">
                <h4 className="font-medium text-foreground text-sm truncate">{obj.name}</h4>
                <p className="text-xs text-muted-foreground mt-1 truncate">{obj.address}</p>
                <div className="flex items-center justify-between mt-2">
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ 
                      backgroundColor: `${color}20`,
                      color: color 
                    }}
                  >
                    {obj.status.replace("-", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">{obj.progress}%</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${obj.progress}%`,
                      backgroundColor: color 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Click to edit
                </p>
              </div>
            )}
          </div>
        )
      })}

      {/* Map Legend */}
      <div className="absolute bottom-24 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 z-10">
        <h4 className="text-xs font-medium text-foreground mb-2">Status Legend</h4>
        <div className="space-y-1.5">
          {Object.entries(statusColors).map(([status, color]) => {
            const Icon = statusIcons[status as keyof typeof statusIcons]
            return (
              <div key={status} className="flex items-center gap-2">
                <div 
                  className="h-3 w-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <Icon className="h-3 w-3" style={{ color }} />
                <span className="text-xs text-muted-foreground capitalize">
                  {status.replace("-", " ")}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="absolute top-20 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 z-10">
        <h4 className="text-sm font-medium text-foreground mb-3">Project Overview</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Total Objects</span>
            <span className="text-sm font-medium text-foreground">{objects.length}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">In Progress</span>
            <span className="text-sm font-medium text-amber-400">
              {objects.filter(o => o.status === "in-progress").length}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Completed</span>
            <span className="text-sm font-medium text-emerald-400">
              {objects.filter(o => o.status === "completed").length}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground">Delayed</span>
            <span className="text-sm font-medium text-red-400">
              {objects.filter(o => o.status === "delayed").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

