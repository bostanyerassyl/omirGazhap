import { useMemo, useState } from "react"
import { Building2, MapPin } from "lucide-react"
import { MapboxMap } from "@/map/react/mapbox-map"
import { percentToLngLat } from "@/map/react/geo"

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
  if (value >= 80) return "#ef4444"
  if (value >= 60) return "#eab308"
  return "#22c55e"
}

interface UtilitiesMapProps {
  onDistrictSelect: (districtId: string) => void
  selectedDistrict: string | null
  resource: string
}

export function UtilitiesMap({ onDistrictSelect, selectedDistrict }: UtilitiesMapProps) {
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null)

  const activeDistrictId = hoveredDistrict ?? selectedDistrict
  const activeDistrict = districts.find((district) => district.id === activeDistrictId) ?? null

  const markers = useMemo(
    () =>
      districts.map((district) => {
        const [lng, lat] = percentToLngLat(district.x + district.width / 2, district.y + district.height / 2)
        return {
          id: district.id,
          lng,
          lat,
          color: getConsumptionColor(district.consumption),
          iconHtml: `${district.consumption}%`,
          title: `${district.name}: ${district.consumption}%`,
          onClick: () => {
            setHoveredDistrict(district.id)
            onDistrictSelect(district.id)
          },
        }
      }),
    [onDistrictSelect],
  )

  return (
    <div className="relative h-[400px] w-full overflow-hidden rounded-lg border border-border bg-card">
      <MapboxMap className="absolute inset-0" center={[76.95, 43.24]} zoom={11.8} markers={markers} />

      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 rounded-lg border border-border bg-background/80 p-2 backdrop-blur-sm">
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

      {activeDistrict && (
        <div className="absolute right-4 top-4 z-10 rounded-lg border border-border bg-background/90 p-3 backdrop-blur-sm">
          <div className="mb-1 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" />
            <span className="font-medium text-foreground">{activeDistrict.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">Consumption: {activeDistrict.consumption}%</p>
        </div>
      )}

      <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-accent" />
        <span className="text-sm font-medium text-foreground">Alatau City</span>
      </div>
    </div>
  )
}
