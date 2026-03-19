"use client"

import { useState } from "react"
import { 
  AlertTriangle, 
  Building2, 
  Construction, 
  MapPin,
  Wrench,
  Flame,
  Droplets,
  X
} from "lucide-react"
import { cn } from "@/utils/cn"

interface MapMarker {
  id: string
  type: "building" | "problem" | "construction" | "utility-issue"
  name: string
  address: string
  lat: number
  lng: number
  status?: string
  details?: string
  reportedBy?: string
  date?: string
}

const markers: MapMarker[] = [
  { id: "1", type: "building", name: "Residential Complex Alatau", address: "Abay St, 45", lat: 35, lng: 25, status: "Active", details: "12 floors, 240 apartments" },
  { id: "2", type: "problem", name: "Road Damage", address: "Nazarbayev Ave, 112", lat: 55, lng: 40, status: "In Progress", details: "Large pothole causing traffic issues", reportedBy: "Citizen", date: "2024-01-15" },
  { id: "3", type: "construction", name: "Business Center", address: "Dostyk St, 78", lat: 45, lng: 65, status: "Under Construction", details: "Expected completion: Q3 2024" },
  { id: "4", type: "utility-issue", name: "Water Leak", address: "Tole Bi St, 23", lat: 70, lng: 30, status: "Critical", details: "Major water main break", reportedBy: "Utility Service", date: "2024-01-18" },
  { id: "5", type: "problem", name: "Street Light Outage", address: "Satpayev St, 56", lat: 25, lng: 55, status: "Pending", details: "Multiple lights not working", reportedBy: "Citizen", date: "2024-01-17" },
  { id: "6", type: "building", name: "School #45", address: "Zhandosov St, 12", lat: 60, lng: 75, status: "Active", details: "Public school, 800 students" },
  { id: "7", type: "construction", name: "Park Development", address: "Al-Farabi Ave, 200", lat: 40, lng: 45, status: "Planning", details: "New green zone project" },
  { id: "8", type: "utility-issue", name: "Gas Leak Report", address: "Baitursynov St, 89", lat: 80, lng: 60, status: "Resolved", details: "Minor leak, repaired", reportedBy: "Industrialist", date: "2024-01-10" },
]

const markerIcons = {
  building: Building2,
  problem: AlertTriangle,
  construction: Construction,
  "utility-issue": Wrench,
}

const markerColors = {
  building: "bg-blue-500",
  problem: "bg-red-500",
  construction: "bg-amber-500",
  "utility-issue": "bg-orange-500",
}

export function AkimatMap() {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [filter, setFilter] = useState<string>("all")

  const filteredMarkers = filter === "all" 
    ? markers 
    : markers.filter(m => m.type === filter)

  return (
    <div className="relative h-full w-full bg-background rounded-lg overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 bg-secondary/30">
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        />
        
        {/* Roads */}
        <svg className="absolute inset-0 w-full h-full">
          {/* Main horizontal roads */}
          <line x1="0" y1="30%" x2="100%" y2="30%" stroke="hsl(var(--muted-foreground))" strokeWidth="3" opacity="0.3" />
          <line x1="0" y1="60%" x2="100%" y2="60%" stroke="hsl(var(--muted-foreground))" strokeWidth="3" opacity="0.3" />
          <line x1="0" y1="85%" x2="100%" y2="85%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" opacity="0.3" />
          
          {/* Main vertical roads */}
          <line x1="25%" y1="0" x2="25%" y2="100%" stroke="hsl(var(--muted-foreground))" strokeWidth="3" opacity="0.3" />
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="hsl(var(--muted-foreground))" strokeWidth="4" opacity="0.4" />
          <line x1="75%" y1="0" x2="75%" y2="100%" stroke="hsl(var(--muted-foreground))" strokeWidth="3" opacity="0.3" />
          
          {/* Diagonal road */}
          <line x1="10%" y1="10%" x2="90%" y2="90%" stroke="hsl(var(--muted-foreground))" strokeWidth="2" opacity="0.2" />
        </svg>

        {/* District labels */}
        <div className="absolute top-4 left-4 text-xs text-muted-foreground/50 font-medium">Almaly District</div>
        <div className="absolute top-4 right-4 text-xs text-muted-foreground/50 font-medium">Bostandyk District</div>
        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground/50 font-medium">Medeu District</div>
        <div className="absolute bottom-4 right-4 text-xs text-muted-foreground/50 font-medium">Auezov District</div>
      </div>

      {/* Markers */}
      {filteredMarkers.map((marker) => {
        const Icon = markerIcons[marker.type]
        return (
          <button
            key={marker.id}
            className={cn(
              "absolute transform -translate-x-1/2 -translate-y-1/2 p-2 rounded-full transition-all duration-200 hover:scale-125 z-10",
              markerColors[marker.type],
              selectedMarker?.id === marker.id && "ring-2 ring-white scale-125"
            )}
            style={{ left: `${marker.lng}%`, top: `${marker.lat}%` }}
            onClick={() => setSelectedMarker(marker)}
          >
            <Icon className="h-4 w-4 text-white" />
          </button>
        )
      })}

      {/* Filter Legend */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 bg-card/90 backdrop-blur-sm p-2 rounded-lg border border-border">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "px-3 py-1 text-xs rounded-md transition-colors",
            filter === "all" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"
          )}
        >
          All
        </button>
        <button
          onClick={() => setFilter("building")}
          className={cn(
            "px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1",
            filter === "building" ? "bg-blue-500 text-white" : "text-muted-foreground hover:bg-secondary"
          )}
        >
          <Building2 className="h-3 w-3" /> Buildings
        </button>
        <button
          onClick={() => setFilter("problem")}
          className={cn(
            "px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1",
            filter === "problem" ? "bg-red-500 text-white" : "text-muted-foreground hover:bg-secondary"
          )}
        >
          <AlertTriangle className="h-3 w-3" /> Problems
        </button>
        <button
          onClick={() => setFilter("construction")}
          className={cn(
            "px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1",
            filter === "construction" ? "bg-amber-500 text-white" : "text-muted-foreground hover:bg-secondary"
          )}
        >
          <Construction className="h-3 w-3" /> Construction
        </button>
        <button
          onClick={() => setFilter("utility-issue")}
          className={cn(
            "px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1",
            filter === "utility-issue" ? "bg-orange-500 text-white" : "text-muted-foreground hover:bg-secondary"
          )}
        >
          <Wrench className="h-3 w-3" /> Utilities
        </button>
      </div>

      {/* Selected Marker Info */}
      {selectedMarker && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-2 rounded-lg", markerColors[selectedMarker.type])}>
                {(() => {
                  const Icon = markerIcons[selectedMarker.type]
                  return <Icon className="h-4 w-4 text-white" />
                })()}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{selectedMarker.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedMarker.address}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedMarker(null)}
              className="p-1 hover:bg-secondary rounded"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                selectedMarker.status === "Critical" && "bg-red-500/20 text-red-400",
                selectedMarker.status === "In Progress" && "bg-amber-500/20 text-amber-400",
                selectedMarker.status === "Pending" && "bg-blue-500/20 text-blue-400",
                selectedMarker.status === "Active" && "bg-green-500/20 text-green-400",
                selectedMarker.status === "Resolved" && "bg-emerald-500/20 text-emerald-400",
                selectedMarker.status === "Under Construction" && "bg-amber-500/20 text-amber-400",
                selectedMarker.status === "Planning" && "bg-purple-500/20 text-purple-400",
              )}>
                {selectedMarker.status}
              </span>
            </div>
            {selectedMarker.details && (
              <p className="text-muted-foreground">{selectedMarker.details}</p>
            )}
            {selectedMarker.reportedBy && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Reported by:</span>
                <span>{selectedMarker.reportedBy}</span>
              </div>
            )}
            {selectedMarker.date && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Date:</span>
                <span>{selectedMarker.date}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

