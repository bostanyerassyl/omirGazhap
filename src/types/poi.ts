export type PoiCategory = 'ramps' | 'scooters' | 'events' | 'buses'

export type PoiItem = {
  id: string
  category: PoiCategory
  name: string
  description: string | null
  latitude: number
  longitude: number
  createdBy: string | null
  createdAt: string
}

export type PoiCreateInput = {
  category: PoiCategory
  name: string
  description?: string | null
  latitude: number
  longitude: number
  createdBy?: string | null
}