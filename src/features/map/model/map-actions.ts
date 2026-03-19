export type TransportMode = "car" | "walk" | "bike" | "transit"

export type RouteRequest = {
  destination: string
  mode: TransportMode
}

export type RouteResult = {
  ok: boolean
  error?: string
  distanceKm?: number
  durationMin?: number
  destinationLabel?: string
}

export type FriendCreateInput = {
  name: string
  avatarUrl?: string
  latitude?: number
  longitude?: number
}

export type PoiCategory = "ramps" | "scooters" | "events" | "buses"

export type PoiCreateInput = {
  category: PoiCategory
  name: string
  description?: string
  latitude?: number
  longitude?: number
}

export type MapFilterState = {
  ramps: boolean
  scooters: boolean
  friends: boolean
  events: boolean
  buses: boolean
}

export type MapPointPickResult = {
  ok: boolean
  error?: string
  latitude?: number
  longitude?: number
}

type MapActionHandlers = {
  requestRoute: (payload: RouteRequest) => Promise<RouteResult>
  clearRoute: () => void
  addFriend: (payload: FriendCreateInput) => Promise<{ ok: boolean; error?: string }>
  addPoi: (payload: PoiCreateInput) => Promise<{ ok: boolean; error?: string }>
  setFilters: (payload: MapFilterState) => void
  pickPoint: () => Promise<MapPointPickResult>
  getMapCenter: () => { latitude: number; longitude: number } | null
}

const noopAsync = async () => ({ ok: false, error: "Map is not ready yet" })

let handlers: MapActionHandlers = {
  requestRoute: async () => ({ ok: false, error: "Map is not ready yet" }),
  clearRoute: () => {},
  addFriend: noopAsync,
  addPoi: noopAsync,
  setFilters: () => {},
  pickPoint: async () => ({ ok: false, error: "Map is not ready yet" }),
  getMapCenter: () => null,
}

let latestFilters: MapFilterState = {
  ramps: true,
  scooters: true,
  friends: true,
  events: true,
  buses: true,
}

export function registerMapActionHandlers(next: Partial<MapActionHandlers>) {
  handlers = { ...handlers, ...next }
  if (next.setFilters) {
    handlers.setFilters(latestFilters)
  }
  return () => {
    handlers = {
      requestRoute: async () => ({ ok: false, error: "Map is not ready yet" }),
      clearRoute: () => {},
      addFriend: noopAsync,
      addPoi: noopAsync,
      setFilters: () => {},
      pickPoint: async () => ({ ok: false, error: "Map is not ready yet" }),
      getMapCenter: () => null,
    }
  }
}

export function requestMapRoute(payload: RouteRequest) {
  return handlers.requestRoute(payload)
}

export function clearMapRoute() {
  handlers.clearRoute()
}

export function addFriendToMap(payload: FriendCreateInput) {
  return handlers.addFriend(payload)
}

export function addPoiToMap(payload: PoiCreateInput) {
  return handlers.addPoi(payload)
}

export function setMapFilters(payload: MapFilterState) {
  latestFilters = payload
  handlers.setFilters(payload)
}

export function pickPointOnMap() {
  return handlers.pickPoint()
}

export function getMapCenterPosition() {
  return handlers.getMapCenter()
}
