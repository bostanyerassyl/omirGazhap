export type EventSeverity = 'low' | 'medium' | 'high' | 'critical'

export type EventItem = {
  id: string
  assetId: string | null
  locationId: string | null
  locationName: string | null
  createdBy: string | null
  title: string
  description: string
  eventType: string
  severity: EventSeverity
  startsAt: string | null
  endsAt: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
}
