import { useState } from "react"
import { Building2, Home, MapPin, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/utils/cn"

const districts = [
  { id: "almaly", name: "Almaly District" },
  { id: "auezov", name: "Auezov District" },
  { id: "bostandyk", name: "Bostandyk District" },
  { id: "medeu", name: "Medeu District" },
  { id: "nauryzbay", name: "Nauryzbay District" },
  { id: "turksib", name: "Turksib District" },
]

const buildings: Record<string, { id: string; name: string; address: string }[]> = {
  almaly: [
    { id: "al-1", name: "Residential Complex Aurora", address: "Abay Ave, 52" },
    { id: "al-2", name: "Business Center Almaty", address: "Dostyk St, 123" },
    { id: "al-3", name: "Apartment Building 45", address: "Tole Bi St, 45" },
  ],
  auezov: [
    { id: "au-1", name: "Microdistrict 8", address: "Momyshuly St, 8" },
    { id: "au-2", name: "Microdistrict 12", address: "Zhandosov St, 12" },
  ],
  bostandyk: [
    { id: "bo-1", name: "Esentai Tower", address: "Al-Farabi Ave, 77" },
    { id: "bo-2", name: "Nurly Tau", address: "Al-Farabi Ave, 19" },
  ],
  medeu: [
    { id: "me-1", name: "Park Residence", address: "Nazarbayev Ave, 240" },
    { id: "me-2", name: "Green Village", address: "Timiryazev St, 42" },
  ],
  nauryzbay: [
    { id: "na-1", name: "New Almaty Complex", address: "Ryskulbekov St, 15" },
  ],
  turksib: [
    { id: "tu-1", name: "Industrial Park Buildings", address: "Seifullin Ave, 500" },
  ],
}

interface ScopeSelectorProps {
  scope: string
  district: string | null
  building: string | null
  onScopeChange: (scope: string, district: string | null, building: string | null) => void
}

export function ScopeSelector({ scope, district, building, onScopeChange }: ScopeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedDistrict = districts.find(d => d.id === district)
  const selectedBuilding = district
    ? buildings[district]?.find((b) => b.id === building) ?? null
    : null

  const getScopeLabel = () => {
    if (scope === "city") return "Entire City"
    if (scope === "district" && selectedDistrict) return selectedDistrict.name
    if (scope === "building" && selectedBuilding) return selectedBuilding.name
    return "Select Scope"
  }

  const getScopeIcon = () => {
    if (scope === "city") return MapPin
    if (scope === "district") return Building2
    return Home
  }

  const Icon = getScopeIcon()

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-card border-border">
            <Icon className="w-4 h-4 text-accent" />
            <span>{getScopeLabel()}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64 bg-card border-border">
          <DropdownMenuItem onClick={() => {
            onScopeChange("city", null, null)
            setIsOpen(false)
          }}>
            <MapPin className="w-4 h-4 mr-2 text-accent" />
            Entire City
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Districts</DropdownMenuLabel>
          
          {districts.map((d) => (
            <DropdownMenuItem
              key={d.id}
              onClick={() => {
                onScopeChange("district", d.id, null)
                setIsOpen(false)
              }}
              className={cn(district === d.id && "bg-accent/10")}
            >
              <Building2 className="w-4 h-4 mr-2" />
              {d.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {scope === "district" && district && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-card border-border">
              <Home className="w-4 h-4 text-accent" />
              <span>{selectedBuilding?.name || "Select Building"}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-72 bg-card border-border">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Buildings in {selectedDistrict?.name}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {buildings[district]?.map((b) => (
              <DropdownMenuItem
                key={b.id}
                onClick={() => onScopeChange("building", district, b.id)}
                className={cn(building === b.id && "bg-accent/10")}
              >
                <div className="flex flex-col">
                  <span>{b.name}</span>
                  <span className="text-xs text-muted-foreground">{b.address}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {scope !== "city" && (
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8"
          onClick={() => onScopeChange("city", null, null)}
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  )
}

