export type LocationZone = 'Gate' | 'Golden' | 'Growing' | 'Green'

export type LocationItem = {
  id: string
  name: string
  zone: LocationZone
  lat: number
  lon: number
  createdAt: string
}
