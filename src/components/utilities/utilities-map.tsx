"use client"

import { useState } from "react"
import { Building2, MapPin } from "lucide-react"
import { cn } from "@/utils/cn"

interface District {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  consumption: number
}

const districts: District[] = [
  { id: "almaly", name: "Almaly", x: 35, y: 25, width: 18, height: 22, consumption: 85 },
  { id: "auezov", name: "Auezov", x: 10, y: 35, width: 22, height: 28, consumption: 72 },
  { id: "bostandyk", name: "Bostandyk", x: 55, y: 30, width: 20, height: 25, consumption: 91 },
  { id: "medeu", name: "Medeu", x: 40, y: 50, width: 25, height: 28, consumption: 68 },
  { id: "nauryzbay", name: "Nauryzbay", x: 70, y: 55, width: 20, height: 25, consumption: 45 },
  { id: "turksib", name: "Turksib", x: 15, y: 65, width: 22, height: 22, consumption: 78 },
]

const getConsumptionColor = (value: number) => {
  if (value >= 80) return "fill-red-500/40 stroke-red-500"
  if (value >= 60) return "fill-yellow-500/40 stroke-yellow-500"
  return "fill-green-500/40 stroke-green-500"
}

interface UtilitiesMapProps {
  onDistrictSelect: (districtId: string) => void
  selectedDistrict: string | null
  resource: string
}

export function UtilitiesMap({ onDistrictSelect, selectedDistrict, resource }: UtilitiesMapProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null)

  return (
    <div className="relative w-full h-[400px] bg-card rounded-lg border border-border overflow-hidden">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-border" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#smallGrid)" />
        </svg>
      </div>

      {/* Map SVG */}
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Districts */}
        {districts.map((district) => (
          <g key={district.id}>
            <rect
              x={district.x}
              y={district.y}
              width={district.width}
              height={district.height}
              rx="2"
              className={cn(
                "cursor-pointer transition-all duration-200",
                getConsumptionColor(district.consumption),
                selectedDistrict === district.id && "stroke-[3]",
                hoveredDistrict === district.id && "brightness-125"
              )}
              strokeWidth={selectedDistrict === district.id ? 2 : 1}
              onClick={() => onDistrictSelect(district.id)}
              onMouseEnter={() => setHoveredDistrict(district.id)}
              onMouseLeave={() => setHoveredDistrict(null)}
            />
            <text
              x={district.x + district.width / 2}
              y={district.y + district.height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-[3px] font-medium pointer-events-none"
            >
              {district.name}
            </text>
            <text
              x={district.x + district.width / 2}
              y={district.y + district.height / 2 + 4}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[2.5px] pointer-events-none"
            >
              {district.consumption}%
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 bg-background/80 backdrop-blur-sm p-2 rounded-lg border border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500/40 border border-green-500" />
          <span className="text-xs text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-500/40 border border-yellow-500" />
          <span className="text-xs text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500/40 border border-red-500" />
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>

      {/* Hovered District Info */}
      {hoveredDistrict && (
        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-accent" />
            <span className="font-medium text-foreground">
              {districts.find(d => d.id === hoveredDistrict)?.name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Consumption: {districts.find(d => d.id === hoveredDistrict)?.consumption}%
          </p>
        </div>
      )}

      {/* City Label */}
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <MapPin className="w-4 h-4 text-accent" />
        <span className="text-sm font-medium text-foreground">Alatau City</span>
      </div>
    </div>
  )
}

