import { supabase } from '@/services/supabaseClient'
import { logger } from '@/services/logger'
import type { AuthResult, Role } from '@/types/auth'
import type { ObservationItem } from '@/types/observation'
import { toError } from '@/utils/error'

type ObservationRecord = {
  id: string
  asset_id: string | null
  case_id: string | null
  location_id: string | null
  created_by: string | null
  timestamp: string | null
  payload: Record<string, unknown> | null
  locations?: {
    name: string | null
  } | null
}

function mapObservation(record: ObservationRecord): ObservationItem {
  return {
    id: record.id,
    assetId: record.asset_id,
    caseId: record.case_id,
    locationId: record.location_id,
    locationName: record.locations?.name ?? null,
    createdBy: record.created_by,
    timestamp: record.timestamp ?? '',
    payload: record.payload ?? {},
  }
}

export const observationService = {
  async list(
    role: Role | null,
    userId: string | null,
  ): Promise<AuthResult<ObservationItem[]>> {
    try {
      let query = supabase
        .from('observations')
        .select('*, locations(name)')
        .order('timestamp', { ascending: false })

      if (role === 'user' && userId) {
        query = query.eq('created_by', userId)
      }

      const { data, error } = await query.returns<ObservationRecord[]>()

      if (error) {
        return {
          data: null,
          error,
        }
      }

      return {
        data: (data ?? []).map(mapObservation),
        error: null,
      }
    } catch (error) {
      const normalizedError = toError(error)
      logger.error(normalizedError, 'observation.list')
      return {
        data: null,
        error: normalizedError,
      }
    }
  },
}
