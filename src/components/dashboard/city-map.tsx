import { useEffect } from "react"
import { InteractiveMapView } from "@/components/map/interactive-map-view"
import { setMapFilters } from "@/features/map/model/map-actions"

export interface FilterState {
  ramps: boolean
  scooters: boolean
  friends: boolean
  events: boolean
  buses: boolean
  points: boolean
  fire: boolean
  water: boolean
  electricity: boolean
}

interface CityMapProps {
  filters: FilterState
}

export function CityMap({ filters }: CityMapProps) {
  useEffect(() => {
    setMapFilters(filters)
  }, [filters])

  return <InteractiveMapView toolbarTop={84} />
}
