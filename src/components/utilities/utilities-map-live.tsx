import { useMemo, useState } from "react"
import { Building2, MapPin } from "lucide-react"
import type { UtilitiesDistrictMetric } from "@/types/dashboard"
import { cn } from "@/utils/cn"

interface UtilitiesMapLiveProps {
  onDistrictSelect: (districtId: string) => void
  selectedDistrict: string | null
  resource: string
  districts: UtilitiesDistrictMetric[]
}

function getConsumptionColor(value: number) {
  if (value >= 80) return "fill-red-500/40 stroke-red-500"
  if (value >= 60) return "fill-yellow-500/40 stroke-yellow-500"
  return "fill-green-500/40 stroke-green-500"
}

function buildDistrictLayout(districts: UtilitiesDistrictMetric[]) {
  const baseLayout = [
    { x: 10, y: 16, width: 24, height: 20 },
    { x: 38, y: 18, width: 22, height: 24 },
    { x: 63, y: 15, width: 22, height: 22 },
    { x: 18, y: 44, width: 22, height: 24 },
    { x: 44, y: 48, width: 24, height: 22 },
    { x: 71, y: 46, width: 18, height: 24 },
  ]

  return districts.map((district, index) => ({
    ...district,
    ...baseLayout[index % baseLayout.length],
  }))
}

export function UtilitiesMapLive({
  onDistrictSelect,
  selectedDistrict,
  resource,
  districts,
}: UtilitiesMapLiveProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null)
  const layout = useMemo(() => buildDistrictLayout(districts), [districts])

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-lg border border-border bg-card">
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

      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {layout.map((district) => (
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
                hoveredDistrict === district.id && "brightness-125",
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
              className="pointer-events-none fill-foreground text-[3px] font-medium"
            >
              {district.name}
            </text>
            <text
              x={district.x + district.width / 2}
              y={district.y + district.height / 2 + 4}
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none fill-muted-foreground text-[2.5px]"
            >
              {district.consumption}%
            </text>
          </g>
        ))}
      </svg>

      <div className="absolute bottom-4 left-4 flex items-center gap-4 rounded-lg border border-border bg-background/80 p-2 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border border-green-500 bg-green-500/40" />
          <span className="text-xs text-muted-foreground">Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border border-yellow-500 bg-yellow-500/40" />
          <span className="text-xs text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border border-red-500 bg-red-500/40" />
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>

      {hoveredDistrict ? (
        <div className="absolute right-4 top-4 rounded-lg border border-border bg-background/90 p-3 backdrop-blur-sm">
          <div className="mb-1 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            <span className="font-medium text-foreground">
              {layout.find((item) => item.id === hoveredDistrict)?.name}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {resource.charAt(0).toUpperCase() + resource.slice(1)} load: {layout.find((item) => item.id === hoveredDistrict)?.consumption}%
          </p>
        </div>
      ) : null}

      <div className="absolute left-4 top-4 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-foreground">Alatau City</span>
      </div>
    </div>
  )
}
