"use client"

import { useState } from "react"
import { 
  Accessibility, 
  Bike, 
  Users, 
  Calendar, 
  Bus,
  Building2,
  X,
  Clock,
  Phone,
  MapPin
} from "lucide-react"
import { cn } from "@/utils/cn"
import { Button } from "@/components/ui/button"

type MarkerType = "ramp" | "scooter" | "friend" | "event" | "bus" | "building"

interface MapMarker {
  id: string
  type: MarkerType
  x: number
  y: number
  label: string
  details?: {
    title?: string
    description?: string
    deadline?: string
    developer?: string
    phone?: string
    status?: string
    eta?: string
    friend?: string
    eventDate?: string
  }
}

const mockMarkers: MapMarker[] = [
  { 
    id: "1", 
    type: "building", 
    x: 25, 
    y: 30, 
    label: "Alatau Tower",
    details: {
      title: "Alatau Business Tower",
      description: "Modern 32-floor office complex with smart building technology, green energy systems, and panoramic city views.",
      deadline: "Q4 2026",
      developer: "Alatau Development Corp",
      phone: "+7 (727) 123-4567",
      status: "Under Construction - 78% Complete"
    }
  },
  { 
    id: "2", 
    type: "building", 
    x: 65, 
    y: 45, 
    label: "Smart Residential",
    details: {
      title: "Smart Living Residential Complex",
      description: "Eco-friendly residential complex with 450 smart apartments, underground parking, and integrated IoT systems.",
      deadline: "Q2 2027",
      developer: "GreenBuild Kazakhstan",
      phone: "+7 (727) 987-6543",
      status: "Foundation Phase - 23% Complete"
    }
  },
  { id: "3", type: "ramp", x: 35, y: 55, label: "Central Park Ramp" },
  { id: "4", type: "ramp", x: 72, y: 25, label: "Station Ramp" },
  { id: "5", type: "scooter", x: 45, y: 40, label: "5 scooters available" },
  { id: "6", type: "scooter", x: 20, y: 60, label: "3 scooters available" },
  { id: "7", type: "scooter", x: 80, y: 55, label: "8 scooters available" },
  { 
    id: "8", 
    type: "friend", 
    x: 55, 
    y: 35, 
    label: "Arman",
    details: { friend: "Arman K." }
  },
  { 
    id: "9", 
    type: "friend", 
    x: 30, 
    y: 70, 
    label: "Diana",
    details: { friend: "Diana M." }
  },
  { 
    id: "10", 
    type: "event", 
    x: 50, 
    y: 60, 
    label: "City Festival",
    details: {
      title: "Alatau City Festival 2026",
      description: "Annual celebration with live music, food stalls, and cultural performances.",
      eventDate: "March 25, 2026 - 14:00"
    }
  },
  { 
    id: "11", 
    type: "bus", 
    x: 40, 
    y: 28, 
    label: "Bus 42",
    details: { eta: "2 min" }
  },
  { 
    id: "12", 
    type: "bus", 
    x: 60, 
    y: 70, 
    label: "Bus 15",
    details: { eta: "5 min" }
  },
]

const markerIcons: Record<MarkerType, React.ReactNode> = {
  ramp: <Accessibility className="size-4" />,
  scooter: <Bike className="size-4" />,
  friend: <Users className="size-4" />,
  event: <Calendar className="size-4" />,
  bus: <Bus className="size-4" />,
  building: <Building2 className="size-4" />,
}

const markerColors: Record<MarkerType, string> = {
  ramp: "bg-blue-500 hover:bg-blue-400",
  scooter: "bg-green-500 hover:bg-green-400",
  friend: "bg-pink-500 hover:bg-pink-400",
  event: "bg-amber-500 hover:bg-amber-400",
  bus: "bg-cyan-500 hover:bg-cyan-400",
  building: "bg-orange-500 hover:bg-orange-400",
}

interface FilterState {
  ramps: boolean
  scooters: boolean
  friends: boolean
  events: boolean
  buses: boolean
}

interface CityMapProps {
  filters: FilterState
}

export function CityMap({ filters }: CityMapProps) {
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)

  const filteredMarkers = mockMarkers.filter(marker => {
    if (marker.type === "ramp") return filters.ramps
    if (marker.type === "scooter") return filters.scooters
    if (marker.type === "friend") return filters.friends
    if (marker.type === "event") return filters.events
    if (marker.type === "bus") return filters.buses
    if (marker.type === "building") return true
    return true
  })

  return (
    <div className="relative w-full h-full bg-secondary/30 overflow-hidden">
      {/* Map background with grid pattern */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, oklch(0.28 0.005 260 / 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(0.28 0.005 260 / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Simulated roads */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="oklch(0.35 0.005 260)" />
            <stop offset="50%" stopColor="oklch(0.4 0.005 260)" />
            <stop offset="100%" stopColor="oklch(0.35 0.005 260)" />
          </linearGradient>
        </defs>
        {/* Horizontal roads */}
        <rect x="0" y="28%" width="100%" height="3%" fill="url(#roadGradient)" />
        <rect x="0" y="55%" width="100%" height="3%" fill="url(#roadGradient)" />
        <rect x="0" y="75%" width="100%" height="2.5%" fill="url(#roadGradient)" />
        {/* Vertical roads */}
        <rect x="20%" y="0" width="2.5%" height="100%" fill="url(#roadGradient)" />
        <rect x="48%" y="0" width="3%" height="100%" fill="url(#roadGradient)" />
        <rect x="75%" y="0" width="2.5%" height="100%" fill="url(#roadGradient)" />
      </svg>

      {/* Traffic overlay */}
      <div className="absolute top-[28%] left-[22%] w-[26%] h-[3%] bg-red-500/30 rounded-full blur-sm" />
      <div className="absolute top-[55%] left-[50%] w-[25%] h-[3%] bg-yellow-500/30 rounded-full blur-sm" />
      <div className="absolute top-[10%] left-[48%] w-[3%] h-[18%] bg-green-500/30 rounded-full blur-sm" />

      {/* Map markers */}
      {filteredMarkers.map((marker) => (
        <button
          key={marker.id}
          onClick={() => setSelectedMarker(marker)}
          className={cn(
            "absolute transform -translate-x-1/2 -translate-y-1/2 z-10",
            "flex items-center justify-center size-8 rounded-full text-white",
            "shadow-lg transition-all duration-200 hover:scale-110",
            "ring-2 ring-white/20",
            markerColors[marker.type],
            marker.type === "bus" && "animate-pulse"
          )}
          style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
          title={marker.label}
        >
          {markerIcons[marker.type]}
        </button>
      ))}

      {/* Marker detail popup */}
      {selectedMarker && (
        <div 
          className="absolute z-20 bg-card border border-border rounded-lg shadow-xl p-4 w-72 max-w-[calc(100%-2rem)]"
          style={{ 
            left: `${Math.min(Math.max(selectedMarker.x, 20), 80)}%`, 
            top: `${Math.min(selectedMarker.y + 8, 70)}%`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center size-8 rounded-full text-white",
                markerColors[selectedMarker.type]
              )}>
                {markerIcons[selectedMarker.type]}
              </div>
              <span className="font-semibold text-foreground">
                {selectedMarker.details?.title || selectedMarker.label}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="size-6 p-0 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedMarker(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
          
          {selectedMarker.type === "building" && selectedMarker.details && (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">{selectedMarker.details.description}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="size-3.5 text-accent" />
                <span>Deadline: {selectedMarker.details.deadline}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-3.5 text-accent" />
                <span>{selectedMarker.details.developer}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-3.5 text-accent" />
                <span>{selectedMarker.details.phone}</span>
              </div>
              <div className="mt-2 px-2 py-1 bg-accent/10 rounded text-accent text-xs">
                {selectedMarker.details.status}
              </div>
            </div>
          )}

          {selectedMarker.type === "event" && selectedMarker.details && (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">{selectedMarker.details.description}</p>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="size-3.5 text-accent" />
                <span>{selectedMarker.details.eventDate}</span>
              </div>
            </div>
          )}

          {selectedMarker.type === "bus" && selectedMarker.details && (
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 text-accent" />
                <span>Arriving in {selectedMarker.details.eta}</span>
              </div>
            </div>
          )}

          {selectedMarker.type === "friend" && selectedMarker.details && (
            <div className="text-sm text-muted-foreground">
              <p>{selectedMarker.details.friend} is nearby</p>
            </div>
          )}

          {selectedMarker.type === "scooter" && (
            <div className="text-sm text-muted-foreground">
              <p>{selectedMarker.label}</p>
              <Button size="sm" className="mt-2 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                Rent Now
              </Button>
            </div>
          )}

          {selectedMarker.type === "ramp" && (
            <div className="text-sm text-muted-foreground">
              <p>Accessible ramp location</p>
            </div>
          )}
        </div>
      )}

      {/* Map legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 text-xs">
        <div className="font-medium text-foreground mb-2">Traffic</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Clear</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-2 rounded-full bg-red-500" />
            <span className="text-muted-foreground">Heavy</span>
          </div>
        </div>
      </div>
    </div>
  )
}

