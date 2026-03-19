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

type MapActionHandlers = {
  requestRoute: (payload: RouteRequest) => Promise<RouteResult>
  clearRoute: () => void
  addFriend: (payload: FriendCreateInput) => Promise<{ ok: boolean; error?: string }>
  getMapCenter: () => { latitude: number; longitude: number } | null
}

const noopAsync = async () => ({ ok: false, error: "Map is not ready yet" })

let handlers: MapActionHandlers = {
  requestRoute: async () => ({ ok: false, error: "Map is not ready yet" }),
  clearRoute: () => {},
  addFriend: noopAsync,
  getMapCenter: () => null,
}

export function registerMapActionHandlers(next: Partial<MapActionHandlers>) {
  handlers = { ...handlers, ...next }
  return () => {
    handlers = {
      requestRoute: async () => ({ ok: false, error: "Map is not ready yet" }),
      clearRoute: () => {},
      addFriend: noopAsync,
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

export function getMapCenterPosition() {
  return handlers.getMapCenter()
}
