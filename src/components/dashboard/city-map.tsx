import { InteractiveMapView } from "@/components/map/interactive-map-view"

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

export function CityMap({ filters: _filters }: CityMapProps) {
  return <InteractiveMapView toolbarTop={84} />
}
