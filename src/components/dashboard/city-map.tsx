import { useEffect } from "react"
import { InteractiveMapView } from "@/components/map/interactive-map-view"
import { setMapFilters } from "@/features/map/model/map-actions"
import type { DashboardMapMarker } from "@/types/dashboard"

export interface FilterState {
  ramps: boolean
  scooters: boolean
  friends: boolean
  events: boolean
  buses: boolean
}

interface CityMapProps {
  filters: FilterState
  dynamicMarkers?: DashboardMapMarker[]
}

export function CityMap({ filters, dynamicMarkers: _dynamicMarkers }: CityMapProps) {
  useEffect(() => {
    setMapFilters(filters)
  }, [filters])

  return <InteractiveMapView toolbarTop={84} />
}
