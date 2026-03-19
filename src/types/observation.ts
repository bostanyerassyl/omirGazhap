import type { AdminRequestStatus } from './dashboard'

export type ObservationItem = {
  id: string
  assetId: string | null
  caseId: string | null
  locationId: string | null
  locationName: string | null
  createdBy: string | null
  timestamp: string
  payload: Record<string, unknown>
  reviewStatus: AdminRequestStatus
}
